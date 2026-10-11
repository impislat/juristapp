import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
 const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
 if (admin?.role !== "admin") return NextResponse.json({ error: "Только администратор может отправлять письма клиентам." }, { status: 403 });
 const form = await request.formData(); const ticketId = String(form.get("ticketId") || ""); const subject = String(form.get("subject") || "").trim(); const body = String(form.get("body") || "").trim(); const file = form.get("file");
 if (!ticketId || !subject || !body) return NextResponse.json({ error: "Заполните тему и текст письма." }, { status: 400 });
 const { data: ticket } = await supabase.from("tickets").select("id,user_id,title").eq("id", ticketId).maybeSingle();
 if (!ticket) return NextResponse.json({ error: "Обращение не найдено." }, { status: 404 });
 const { data: client } = await supabase.from("profiles").select("email,full_name").eq("id", ticket.user_id).maybeSingle();
 if (!client?.email) return NextResponse.json({ error: "У клиента не указан email. Попросите его обновить адрес или проверьте профиль." }, { status: 400 });
 const apiKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
 if (!apiKey || !from) return NextResponse.json({ error: "Отправка писем ещё не настроена. Добавьте RESEND_API_KEY и RESEND_FROM_EMAIL в Vercel." }, { status: 503 });
 const payload: any = { from, to: [client.email], subject, text: body };
 if (file instanceof File && file.size > 0) {
   if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Вложение для email должно быть до 10 МБ." }, { status: 400 });
   const allowedTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/webp", "text/plain"]);
   if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Поддерживаются PDF, Word, JPG, PNG, WEBP и TXT." }, { status: 400 });
   const bytes = Buffer.from(await file.arrayBuffer()); payload.attachments = [{ filename: file.name, content: bytes.toString("base64") }];
 }
 const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
 if (!response.ok) return NextResponse.json({ error: "Почтовый сервис не принял письмо. Проверьте настройки Resend и подтверждение домена." }, { status: 502 });
 return NextResponse.json({ ok: true, email: client.email });
}
