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
