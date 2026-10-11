"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  if (!email || password.length < 8 || fullName.length < 2) redirect("/register?error=Проверьте%20имя,%20email%20и%20пароль%20(не%20менее%208%20символов)");
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, requested_role: "client" }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://juristapp.vercel.app"}/auth/callback` } });
  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);
  redirect("/register?success=Проверьте%20почту%20и%20подтвердите%20регистрацию");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent("Не удалось войти. Проверьте email и пароль.")}`);
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createTicket(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "Другая помощь");
  const description = String(formData.get("description") || "").trim();
  if (title.length < 4 || description.length < 10) redirect("/dashboard?error=Добавьте%20название%20и%20подробное%20описание");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("tickets").insert({ user_id: user.id, title, category, status: "new" }).select("id").single();
  if (error || !data) redirect(`/dashboard?error=${encodeURIComponent("Не удалось создать обращение. Проверьте, что вы выполнили SQL-настройку Supabase.")}`);
  const { error: messageError } = await supabase.from("ticket_messages").insert({ ticket_id: data.id, sender_id: user.id, body: description });
  if (messageError) redirect(`/dashboard?error=${encodeURIComponent("Обращение создано, но сообщение не сохранилось. Откройте обращение и напишите повторно.")}`);
  revalidatePath("/dashboard");
  redirect(`/tickets/${data.id}`);
}

export async function sendMessage(formData: FormData) {
  const ticketId = String(formData.get("ticketId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!ticketId || body.length < 1) redirect("/dashboard");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("ticket_messages").insert({ ticket_id: ticketId, sender_id: user.id, body });
  if (error) redirect(`/tickets/${ticketId}?error=${encodeURIComponent("Сообщение не отправлено. Возможно, у вас нет доступа к этому обращению.")}`);
  revalidatePath(`/tickets/${ticketId}`);
  redirect(`/tickets/${ticketId}?sent=1`);
}


export async function updateTicketStatus(formData: FormData) {
  const ticketId = String(formData.get("ticketId") || "");
  const status = String(formData.get("status") || "");
  const allowedStatuses = ["new", "in_progress", "waiting_client", "completed", "closed"];
  if (!ticketId || !allowedStatuses.includes(status)) {
    redirect("/admin?error=Некорректные%20данные");
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard?error=Недостаточно%20прав");

  const { error } = await supabase
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) redirect(`/admin?error=${encodeURIComponent("Не удалось изменить статус обращения")}`);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath(`/tickets/${ticketId}`);
  redirect("/admin?updated=1");
}

export async function createArticle(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const status = String(formData.get("status") || "draft");
  if (title.length < 4 || content.length < 20 || !["draft", "published"].includes(status)) redirect("/admin?articleError=Проверьте%20заголовок%20и%20текст");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  const baseSlug = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 100) || "article";
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("articles").insert({ author_id: user.id, title, slug, excerpt, content, status, published_at: status === "published" ? new Date().toISOString() : null });
  if (error) redirect(`/admin?articleError=${encodeURIComponent("Не удалось сохранить публикацию. Сначала выполните migration_v2.sql в Supabase.")}`);
  revalidatePath("/admin"); revalidatePath("/articles");
  redirect("/admin?articleCreated=1");
}

export async function addArticleComment(formData: FormData) {
  const articleId = String(formData.get("articleId") || "");
  const slug = String(formData.get("slug") || "");
  const body = String(formData.get("body") || "").trim();
  if (!articleId || body.length < 1 || body.length > 2000) redirect(`/articles/${slug}?error=Напишите%20комментарий`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/articles/${slug}`)}`);
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const authorName = String(profile?.full_name || user.user_metadata?.full_name || "Пользователь").slice(0, 100);
  const { error } = await supabase.from("article_comments").insert({ article_id: articleId, user_id: user.id, body, author_name: authorName });
  if (error) redirect(`/articles/${slug}?error=${encodeURIComponent("Не удалось добавить комментарий")}`);
  revalidatePath(`/articles/${slug}`);
  redirect(`/articles/${slug}#comments`);
}

export async function toggleArticleLike(formData: FormData) {
  const articleId = String(formData.get("articleId") || "");
  const slug = String(formData.get("slug") || "");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/articles/${slug}`)}`);
  const { data: existing } = await supabase.from("article_likes").select("article_id").eq("article_id", articleId).eq("user_id", user.id).maybeSingle();
  const result = existing
    ? await supabase.from("article_likes").delete().eq("article_id", articleId).eq("user_id", user.id)
    : await supabase.from("article_likes").insert({ article_id: articleId, user_id: user.id });
  if (result.error) redirect(`/articles/${slug}?error=${encodeURIComponent("Не удалось обновить лайк")}`);
  revalidatePath(`/articles/${slug}`); revalidatePath("/articles");
  redirect(`/articles/${slug}`);
}

export async function createTicketFromService(formData: FormData) {
  const title = String(formData.get("serviceTitle") || "").trim();
  const category = String(formData.get("category") || "Юридическая услуга").trim();
  const price = String(formData.get("price") || "Уточняется").trim();
  if (title.length < 4) redirect("/services");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/services")}`);
  const { data, error } = await supabase.from("tickets").insert({ user_id: user.id, title, category }).select("id").single();
  if (error || !data) redirect("/services?error=Не%20удалось%20создать%20обращение");
  const { error: messageError } = await supabase.from("ticket_messages").insert({ ticket_id: data.id, sender_id: user.id, body: `Запрос услуги: ${title}\nСтоимость по прайс-листу: ${price}\n\nПожалуйста, уточните детали и согласуйте объём работы.` });
  if (messageError) redirect(`/tickets/${data.id}`);
  revalidatePath("/dashboard");
  redirect(`/tickets/${data.id}`);
}

export async function updateArticleStatus(formData: FormData) {
  const articleId = String(formData.get("articleId") || "");
  const status = String(formData.get("status") || "");
  if (!articleId || !["draft", "published"].includes(status)) redirect("/admin?articleError=Некорректный%20статус");
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(); if (profile?.role !== "admin") redirect("/dashboard");
  const { error } = await supabase.from("articles").update({ status, published_at: status === "published" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", articleId);
  if (error) redirect("/admin?articleError=Не%20удалось%20обновить%20публикацию");
  revalidatePath("/admin"); revalidatePath("/articles"); redirect("/admin?articleCreated=1");
}
export async function deleteArticle(formData: FormData) {
  const articleId = String(formData.get("articleId") || ""); if (!articleId) redirect("/admin");
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(); if (profile?.role !== "admin") redirect("/dashboard");
  const { error } = await supabase.from("articles").delete().eq("id", articleId);
  if (error) redirect("/admin?articleError=Не%20удалось%20удалить%20публикацию");
  revalidatePath("/admin"); revalidatePath("/articles"); redirect("/admin?articleCreated=1");
}

export async function updateArticle(formData: FormData) {
  const articleId = String(formData.get("articleId") || "");
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const status = String(formData.get("status") || "draft");
  if (!articleId || title.length < 4 || content.length < 20 || !["draft", "published"].includes(status)) redirect("/admin?articleError=Проверьте%20поля%20публикации");
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(); if (profile?.role !== "admin") redirect("/dashboard");
  const { error } = await supabase.from("articles").update({ title, excerpt, content, status, published_at: status === "published" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", articleId);
  if (error) redirect(`/admin/articles/${articleId}/edit?error=${encodeURIComponent("Не удалось сохранить изменения")}`);
  revalidatePath("/admin"); revalidatePath("/articles"); redirect("/admin?articleCreated=1");
}
