"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Download, FileText, LoaderCircle, Paperclip, Send } from "lucide-react";
type Attachment = { id: string; file_name: string; mime_type: string; file_size: number; url: string | null };
type Message = { id: string; body: string; sender_id: string; created_at: string; attachment?: Attachment | null };
export function TicketChat({ ticketId, userId, initialMessages, closed, isStaff }: { ticketId: string; userId: string; initialMessages: Message[]; closed: boolean; isStaff: boolean }) {
 const [messages, setMessages] = useState(initialMessages); const [body, setBody] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const fileRef = useRef<HTMLInputElement>(null); const router = useRouter();
 async function send(e: FormEvent) { e.preventDefault(); const text = body.trim(); if (!text || busy || closed) return; setBusy(true); setError("");
  try { const response = await fetch(`/api/tickets/${ticketId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Не удалось отправить сообщение."); setMessages(old => [...old, data.message]); setBody(""); router.refresh(); }
  catch (err) { setError(err instanceof Error ? err.message : "Не удалось отправить сообщение."); } finally { setBusy(false); }
 }
 async function upload(file?: File) { if (!file || busy || closed) return; setBusy(true); setError(""); const form = new FormData(); form.append("file", file);
  try { const response = await fetch(`/api/tickets/${ticketId}/files`, { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Не удалось загрузить файл."); setMessages(old => [...old, { ...data.message, attachment: data.attachment }]); if (fileRef.current) fileRef.current.value = ""; router.refresh(); }
  catch (err) { setError(err instanceof Error ? err.message : "Не удалось загрузить файл."); } finally { setBusy(false); }
 }
 useEffect(() => { setMessages(initialMessages); }, [initialMessages]);
 useEffect(() => {
  const supabase = createClient();

  const channel = supabase
    .channel(`ticket-live-${ticketId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ticket_messages",
        filter: `ticket_id=eq.${ticketId}`,
      },
      (payload) => {
        const incoming = payload.new as Message;

        if (!incoming?.id) return;

        setMessages((current) =>
          current.some((message) => message.id === incoming.id)
            ? current
            : [...current, incoming]
        );

        router.refresh();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "tickets",
        filter: `id=eq.${ticketId}`,
      },
      () => {
        router.refresh();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}, [ticketId, router]);
 const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} КБ` : `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
 return <section className="conversation"><div className="conversation-top"><div><h2>Переписка</h2><p>{closed ? "Обращение завершено. История доступна только для чтения." : "Сообщения и документы по обращению хранятся здесь."}</p></div><FileText size={20}/></div>
  {messages.length ? messages.map(m => <article className={`message ${m.sender_id === userId ? "message-own" : ""}`} key={m.id}><div className="message-meta"><strong>{m.sender_id === userId ? "Вы" : (isStaff ? "Клиент" : "Администратор / специалист")}</strong><time>{new Date(m.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time></div><p className="message-body">{m.body}</p>{m.attachment && <div className="attachment-card"><span className="attachment-icon"><FileText size={20}/></span><span className="attachment-info"><strong>{m.attachment.file_name}</strong><small>{formatSize(m.attachment.file_size)} · {m.attachment.mime_type}</small></span>{m.attachment.url && <a href={m.attachment.url} target="_blank" rel="noreferrer" aria-label="Открыть файл"><Download size={18}/></a>}</div>}</article>) : <div className="empty-message">Сообщений пока нет.</div>}
  {closed ? <div className="closed-thread-note"><FileText size={18}/> Обращение завершено. Переписка и вложения сохранены, новые сообщения отключены.</div> : <form className="reply-form chat-composer" onSubmit={send}><label htmlFor="chat-body">Ваше сообщение</label><textarea id="chat-body" rows={3} maxLength={10000} value={body} onChange={e => setBody(e.target.value)} placeholder="Напишите сообщение…"/><div className="chat-composer-bottom"><div className="chat-tools"><button type="button" className="attachment-button" onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Прикрепить файл"><Paperclip size={18}/> <span>Прикрепить файл</span></button><input ref={fileRef} className="visually-hidden-input" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,text/plain" onChange={e => upload(e.target.files?.[0])}/><small>PDF, Word, JPG, PNG, WEBP, TXT · до 15 МБ</small></div><button className="button button-primary" type="submit" disabled={busy || !body.trim()}>{busy ? <LoaderCircle className="spin" size={16}/> : <Send size={16}/>} {busy ? "Отправка…" : "Отправить"}</button></div>{error && <div className="notice notice-error chat-error">{error}</div>}</form>}
 </section>;
}
