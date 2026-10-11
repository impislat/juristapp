import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
const allowed = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/webp", "text/plain"]);
export async function POST(request: Request, { params }: { params: { id: string } }) {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
 const { data: ticket } = await supabase.from("tickets").select("id,status").eq("id", params.id).maybeSingle();
 if (!ticket) return NextResponse.json({ error: "Обращение не найдено или нет доступа." }, { status: 404 });
 if (["completed", "closed"].includes(ticket.status)) return NextResponse.json({ error: "Обращение завершено. Нельзя отправлять новые файлы." }, { status: 409 });
 const form = await request.formData(); const file = form.get("file");
 if (!(file instanceof File)) return NextResponse.json({ error: "Выберите файл." }, { status: 400 });
 if (file.size < 1 || file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Размер файла должен быть до 15 МБ." }, { status: 400 });
 if (!allowed.has(file.type)) return NextResponse.json({ error: "Поддерживаются PDF, Word, JPG, PNG, WEBP и TXT." }, { status: 400 });
 const safeName = file.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9._ -]/g, "_").slice(0, 120) || "file";
 const path = `${ticket.id}/${crypto.randomUUID()}-${safeName}`;
 const { error: uploadError } = await supabase.storage.from("ticket-files").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
 if (uploadError) return NextResponse.json({ error: "Не удалось загрузить файл. Проверьте, что выполнена миграция Supabase." }, { status: 400 });
 const { data: message, error: messageError } = await supabase.from("ticket_messages").insert({ ticket_id: ticket.id, sender_id: user.id, body: `Вложение: ${safeName}` }).select("id,body,sender_id,created_at").single();
 if (messageError || !message) { await supabase.storage.from("ticket-files").remove([path]); return NextResponse.json({ error: "Файл загружен, но сообщение не сохранилось." }, { status: 400 }); }
 const { data: attachment, error: attachmentError } = await supabase.from("ticket_attachments").insert({ ticket_id: ticket.id, message_id: message.id, uploader_id: user.id, file_name: safeName, storage_path: path, mime_type: file.type || "application/octet-stream", file_size: file.size }).select("id,file_name,mime_type,file_size,storage_path").single();
 if (attachmentError || !attachment) return NextResponse.json({ error: "Файл загружен, но метаданные не сохранились. Обратитесь к администратору." }, { status: 500 });
 const { data: signed } = await supabase.storage.from("ticket-files").createSignedUrl(path, 3600);
 return NextResponse.json({ message, attachment: { ...attachment, url: signed?.signedUrl || null } });
}
