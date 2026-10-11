-- JuristApp feature upgrade. Run once in Supabase SQL Editor.
-- Adds articles, likes/comments, attachment metadata, client email and strict closed-ticket protection.

alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and (p.email is null or p.email = '');
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name',''), 'client', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create table if not exists public.ticket_attachments (
 id uuid primary key default gen_random_uuid(),
 ticket_id uuid not null references public.tickets(id) on delete cascade,
 message_id uuid not null references public.ticket_messages(id) on delete cascade,
 uploader_id uuid not null references public.profiles(id) on delete cascade,
 file_name text not null,
 storage_path text not null unique,
 mime_type text not null default 'application/octet-stream',
 file_size bigint not null default 0,
 created_at timestamptz not null default now()
);
create index if not exists ticket_attachments_ticket_idx on public.ticket_attachments(ticket_id, created_at);
alter table public.ticket_attachments enable row level security;
drop policy if exists "attachments read for ticket participants" on public.ticket_attachments;
create policy "attachments read for ticket participants" on public.ticket_attachments for select to authenticated using (exists (select 1 from public.tickets t where t.id=ticket_id and (t.user_id=(select auth.uid()) or public.current_app_role() in ('admin','specialist'))));
drop policy if exists "attachments insert for open ticket participants" on public.ticket_attachments;
create policy "attachments insert for open ticket participants" on public.ticket_attachments for insert to authenticated with check (uploader_id=(select auth.uid()) and exists (select 1 from public.tickets t where t.id=ticket_id and t.status not in ('completed','closed') and (t.user_id=(select auth.uid()) or public.current_app_role() in ('admin','specialist'))));
grant select, insert on public.ticket_attachments to authenticated;

-- Make closed/completed conversations read-only at the database policy level.
drop policy if exists "messages insert for ticket participants" on public.ticket_messages;
create policy "messages insert for open ticket participants" on public.ticket_messages for insert to authenticated with check (
 sender_id=(select auth.uid()) and exists (
  select 1 from public.tickets t where t.id=ticket_id and t.status not in ('completed','closed')
  and (t.user_id=(select auth.uid()) or public.current_app_role() in ('admin','specialist'))
 )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-files','ticket-files',false,15728640,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp','text/plain'])
on conflict (id) do update set public=false, file_size_limit=15728640, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "ticket files read by participants" on storage.objects;
create policy "ticket files read by participants" on storage.objects for select to authenticated using (
 bucket_id='ticket-files' and split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and exists (select 1 from public.tickets t where t.id::text = split_part(name,'/',1) and (t.user_id=(select auth.uid()) or public.current_app_role() in ('admin','specialist')))
);
drop policy if exists "ticket files upload to open tickets" on storage.objects;
create policy "ticket files upload to open tickets" on storage.objects for insert to authenticated with check (
 bucket_id='ticket-files' and split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and exists (select 1 from public.tickets t where t.id::text = split_part(name,'/',1) and t.status not in ('completed','closed') and (t.user_id=(select auth.uid()) or public.current_app_role() in ('admin','specialist')))
);
drop policy if exists "ticket files delete by uploader or staff" on storage.objects;
create policy "ticket files delete by uploader or staff" on storage.objects for delete to authenticated using (
 bucket_id='ticket-files' and (owner_id=(select auth.uid())::text or public.current_app_role() in ('admin','specialist'))
);

create table if not exists public.articles (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check (char_length(title) between 4 and 180),
 slug text not null unique,
 excerpt text not null default '',
 content text not null,
 status text not null default 'draft' check (status in ('draft','published')),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists articles_published_idx on public.articles(status,published_at desc);
create table if not exists public.article_likes (
 article_id uuid not null references public.articles(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(article_id,user_id)
);
create table if not exists public.article_comments (
 id uuid primary key default gen_random_uuid(),
 article_id uuid not null references public.articles(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check (char_length(body) between 1 and 2000),
 author_name text not null default 'Пользователь',
 created_at timestamptz not null default now()
);
alter table public.article_comments add column if not exists author_name text not null default 'Пользователь';
create index if not exists article_comments_article_idx on public.article_comments(article_id,created_at asc);
alter table public.articles enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_comments enable row level security;
drop policy if exists "published articles readable by everyone" on public.articles;
create policy "published articles readable by everyone" on public.articles for select using (status='published' or public.current_app_role()='admin');
drop policy if exists "admins create articles" on public.articles;
create policy "admins create articles" on public.articles for insert to authenticated with check (author_id=(select auth.uid()) and public.current_app_role()='admin');
drop policy if exists "admins update articles" on public.articles;
create policy "admins update articles" on public.articles for update to authenticated using (public.current_app_role()='admin') with check (public.current_app_role()='admin');
drop policy if exists "admins delete articles" on public.articles;
create policy "admins delete articles" on public.articles for delete to authenticated using (public.current_app_role()='admin');
drop policy if exists "likes visible on published articles" on public.article_likes;
create policy "likes visible on published articles" on public.article_likes for select using (exists(select 1 from public.articles a where a.id=article_id and a.status='published') or public.current_app_role()='admin');
drop policy if exists "users like published articles" on public.article_likes;
create policy "users like published articles" on public.article_likes for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.articles a where a.id=article_id and a.status='published'));
drop policy if exists "users remove own likes" on public.article_likes;
create policy "users remove own likes" on public.article_likes for delete to authenticated using (user_id=(select auth.uid()));
drop policy if exists "comments visible on published articles" on public.article_comments;
create policy "comments visible on published articles" on public.article_comments for select using (exists(select 1 from public.articles a where a.id=article_id and a.status='published') or public.current_app_role()='admin');
drop policy if exists "authenticated users comment on published articles" on public.article_comments;
create policy "authenticated users comment on published articles" on public.article_comments for insert to authenticated with check (user_id=(select auth.uid()) and author_name=(select full_name from public.profiles where id=(select auth.uid())) and exists(select 1 from public.articles a where a.id=article_id and a.status='published'));
drop policy if exists "users delete own comments or admin" on public.article_comments;
create policy "users delete own comments or admin" on public.article_comments for delete to authenticated using (user_id=(select auth.uid()) or public.current_app_role()='admin');
grant select, insert, update, delete on public.articles to authenticated;
grant select, insert, delete on public.article_likes to authenticated;
grant select, insert, delete on public.article_comments to authenticated;
grant select on public.articles, public.article_likes, public.article_comments to anon;
grant execute on function public.current_app_role() to anon;
