import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { Brand } from "@/app/components/brand";
import { TicketChat } from "@/app/components/ticket-chat";
const statusLabel: Record<string,string> = { new:"Новое",in_progress:"В работе",waiting_client:"Ждём ответ клиента",completed:"Выполнено",closed:"Закрыто" };
export default async function TicketPage({ params, searchParams }: { params: { id:string }; searchParams: { error?:string; sent?:string } }) {
 const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
 const {data:ticket,error}=await supabase.from("tickets").select("id,title,category,status,created_at,user_id").eq("id",params.id).maybeSingle();
 if(error || !ticket) notFound();
 const [{data:messages},{data:attachments}]=await Promise.all([supabase.from("ticket_messages").select("id,body,sender_id,created_at").eq("ticket_id",ticket.id).order("created_at",{ascending:true}),supabase.from("ticket_attachments").select("id,message_id,file_name,mime_type,file_size,storage_path").eq("ticket_id",ticket.id)]);
 const signedAttachments = await Promise.all((attachments || []).map(async item => { const {data:signed}=await supabase.storage.from("ticket-files").createSignedUrl(item.storage_path,3600); return [item.message_id,{id:item.id,file_name:item.file_name,mime_type:item.mime_type,file_size:item.file_size,url:signed?.signedUrl || null}] as const; }));
 const attachmentByMessage = new Map<string, any>(signedAttachments);
 const initialMessages=(messages||[]).map(m=>({...m,attachment:attachmentByMessage.get(m.id)||null}));
 const isClosed=["completed","closed"].includes(ticket.status);
 return <main className="thread-page"><header className="thread-header"><Brand/><form action={signOut}><button className="quiet-button" type="submit">Выйти</button></form></header><div className="thread-wrap"><Link href="/dashboard" className="back-link"><ArrowLeft size={16}/> Назад к обращениям</Link><section className="thread-title"><div className="ticket-icon large"><MessageCircle size={23}/></div><div><div className="eyebrow">ОБРАЩЕНИЕ · {ticket.id.slice(0,8).toUpperCase()}</div><h1>{ticket.title}</h1><p className="muted">{ticket.category} · {new Date(ticket.created_at).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}</p></div><span className={`status status-${ticket.status}`}>{statusLabel[ticket.status]||ticket.status}</span></section>
 {searchParams.error && <div className="notice notice-error">{searchParams.error}</div>}{searchParams.sent && <div className="notice">Сообщение отправлено.</div>}
 <TicketChat ticketId={ticket.id} userId={user.id} initialMessages={initialMessages} closed={isClosed} isStaff={["admin","specialist"].includes(profile?.role||"")}/></div></main>
}
