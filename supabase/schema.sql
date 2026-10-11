-- JuristApp initial schema. Run in Supabase Dashboard > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'client' check (role in ('client','specialist','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name',''), 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 180),
  category text not null default 'Другая помощь',
  status text not null default 'new' check (status in ('new','in_progress','waiting_client','completed','closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index if not exists tickets_user_created_idx on public.tickets(user_id, created_at desc);
create index if not exists messages_ticket_created_idx on public.ticket_messages(ticket_id, created_at asc);

create or replace function public.current_app_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;
revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- Users can read their own profile. Role cannot be changed via client updates.
drop policy if exists "profiles read self or staff" on public.profiles;
create policy "profiles read self or staff" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.current_app_role() in ('admin','specialist'));
drop policy if exists "profiles update own name" on public.profiles;
create policy "profiles update own name" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Clients can only create/read their own tickets; staff can read all tickets.
drop policy if exists "tickets read own or staff" on public.tickets;
create policy "tickets read own or staff" on public.tickets for select to authenticated
using (user_id = (select auth.uid()) or public.current_app_role() in ('admin','specialist'));
drop policy if exists "clients create own tickets" on public.tickets;
create policy "clients create own tickets" on public.tickets for insert to authenticated
with check (user_id = (select auth.uid()) and public.current_app_role() = 'client');
drop policy if exists "staff update tickets" on public.tickets;
create policy "staff update tickets" on public.tickets for update to authenticated
using (public.current_app_role() in ('admin','specialist'))
with check (public.current_app_role() in ('admin','specialist'));

-- Messages are only visible inside tickets the user can access.
drop policy if exists "messages read for ticket participants" on public.ticket_messages;
create policy "messages read for ticket participants" on public.ticket_messages for select to authenticated
using (exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = (select auth.uid()) or public.current_app_role() in ('admin','specialist'))));
drop policy if exists "messages insert for ticket participants" on public.ticket_messages;
create policy "messages insert for ticket participants" on public.ticket_messages for insert to authenticated
with check (sender_id = (select auth.uid()) and exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = (select auth.uid()) or public.current_app_role() in ('admin','specialist'))));

-- Prevent authenticated users from changing roles through the table API.
revoke update (role) on public.profiles from authenticated;
grant select, insert on public.tickets to authenticated;
grant update (title, category, status, assigned_to, updated_at) on public.tickets to authenticated;
grant select, insert on public.ticket_messages to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
