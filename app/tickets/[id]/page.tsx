import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { sendMessage, signOut } from "@/app/actions";
import { Brand } from "@/app/components/brand";
const statusLabel: Record<string,string> = { new:"Новое",in_progress:"В работе",waiting_client:"Ждём ответ клиента",completed:"Выполнено",closed:"Закрыто" };
export default async function TicketPage({ params, searchParams }: { params: { id:string }; searchParams: { error?:string; sent?:string } }) {
 const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
 const {data:ticket,error}=await supabase.from("tickets").select("id,title,category,status,created_at,user_id").eq("id",params.id).maybeSingle();
 if(error || !ticket) notFound();
 const {data:messages}=await supabase.from("ticket_messages").select("id,body,sender_id,created_at").eq("ticket_id",ticket.id).order("created_at",{ascending:true});
 const isStaff=["admin","specialist"].includes(profile?.role||"");
 return <main className="thread-page"><header className="thread-header"><Brand/><form action={signOut}><button className="quiet-button" type="submit">Выйти</button></form></header><div className="thread-wrap"><Link href="/dashboard" className="back-link"><ArrowLeft size={16}/> Назад к обращениям</Link><section className="thread-title"><div className="ticket-icon large"><MessageCircle size={23}/></div><div><div className="eyebrow">ОБРАЩЕНИЕ · {ticket.id.slice(0,8).toUpperCase()}</div><h1>{ticket.title}</h1><p className="muted">{ticket.category} · {new Date(ticket.created_at).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}</p></div><span className={`status status-${ticket.status}`}>{statusLabel[ticket.status]||ticket.status}</span></section>
 {searchParams.error && <div className="notice notice-error">{searchParams.error}</div>}{searchParams.sent && <div className="notice">Сообщение отправлено.</div>}
 <section className="conversation"><div className="conversation-top"><div><h2>Переписка</h2><p>История сообщений по вашему обращению</p></div><ShieldCheck size={20}/></div>{messages?.length ? messages.map(m=><article className={`message ${m.sender_id===user.id?"message-own":""}`} key={m.id}><div className="message-meta"><strong>{m.sender_id===user.id?(profile?.full_name||"Вы"):(isStaff?"Клиент":"Специалист")}</strong><time>{new Date(m.created_at).toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</time></div><p>{m.body}</p></article>) : <div className="empty-message">Сообщений пока нет.</div>}
 <form action={sendMessage} className="reply-form"><input type="hidden" name="ticketId" value={ticket.id}/><label htmlFor="body">Ваше сообщение</label><textarea id="body" name="body" rows={4} placeholder="Напишите сообщение…" required/><div className="reply-bottom"><span>Не отправляйте пароли и данные банковских карт.</span><button className="button button-primary" type="submit">Отправить <span>→</span></button></div></form></section></div></main>
}
