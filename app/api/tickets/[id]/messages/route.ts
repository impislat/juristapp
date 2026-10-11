import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const body = String(payload?.body || "").trim();
  if (!body || body.length > 10000) return NextResponse.json({ error: "Сообщение должно содержать от 1 до 10 000 символов." }, { status: 400 });
  const { data: ticket } = await supabase.from("tickets").select("id,status,user_id").eq("id", params.id).maybeSingle();
  if (!ticket) return NextResponse.json({ error: "Обращение не найдено или нет доступа." }, { status: 404 });
  if (["completed", "closed"].includes(ticket.status)) return NextResponse.json({ error: "Обращение завершено. История доступна только для чтения." }, { status: 409 });
  const { data, error } = await supabase.from("ticket_messages").insert({ ticket_id: ticket.id, sender_id: user.id, body }).select("id,body,sender_id,created_at").single();
  if (error || !data) return NextResponse.json({ error: "Не удалось отправить сообщение." }, { status: 403 });
  return NextResponse.json({ message: data });
}
