import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock3, FileText, LayoutDashboard, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut, updateTicketStatus } from "@/app/actions";
import { Brand } from "@/app/components/brand";

const statusLabel: Record<string, string> = {
  new: "Новое",
  in_progress: "В работе",
  waiting_client: "Ждём ответ клиента",
  completed: "Выполнено",
  closed: "Закрыто",
};

const statusOptions = [
  { value: "new", label: "Новое" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting_client", label: "Ждём ответ клиента" },
  { value: "completed", label: "Выполнено" },
  { value: "closed", label: "Закрыто" },
];

export default async function AdminPage({ searchParams }: { searchParams: { error?: string; updated?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard?error=Доступ%20только%20для%20администратора");

  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("id,title,category,status,created_at,updated_at,user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const ticketRows = tickets || [];
  const userIds = Array.from(new Set(ticketRows.map((ticket) => ticket.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id,full_name,role").in("id", userIds)
    : { data: [] as { id: string; full_name: string; role: string }[] };
  const profilesById = new Map((profiles || []).map((item) => [item.id, item]));

  const { data: messages } = ticketRows.length
    ? await supabase.from("ticket_messages").select("ticket_id").in("ticket_id", ticketRows.map((ticket) => ticket.id))
    : { data: [] as { ticket_id: string }[] };
  const messageCounts = new Map<string, number>();
  (messages || []).forEach((message) => messageCounts.set(message.ticket_id, (messageCounts.get(message.ticket_id) || 0) + 1));

  const activeCount = ticketRows.filter((ticket) => ["new", "in_progress", "waiting_client"].includes(ticket.status)).length;
  const completedCount = ticketRows.filter((ticket) => ["completed", "closed"].includes(ticket.status)).length;
  const clientsCount = new Set(ticketRows.map((ticket) => ticket.user_id)).size;
  const name = profile?.full_name || user.email?.split("@")[0] || "Администратор";

  return <main className="portal">
    <aside className="portal-sidebar">
      <Brand />
      <div className="sidebar-label">УПРАВЛЕНИЕ СЕРВИСОМ</div>
      <Link className="side-link" href="/dashboard"><FileText size={18} /> Личный кабинет</Link>
      <Link className="side-link active" href="/admin"><LayoutDashboard size={18} /> Админ-панель <span className="side-count">{ticketRows.length}</span></Link>
      <div className="sidebar-bottom">
        <div className="secure-note"><ShieldCheck size={18} /><span>Административные действия доступны только аккаунту с ролью admin.</span></div>
        <form action={signOut}><button className="side-link side-button" type="submit"><ArrowLeft size={18} /> Выйти</button></form>
      </div>
    </aside>

    <section className="portal-main">
      <header className="portal-header">
        <div><div className="eyebrow">УПРАВЛЕНИЕ JURISTAPP</div><h1>Админ-панель</h1><p className="muted">Обращения клиентов, статусы и история общения — в одном месте.</p></div>
        <div className="user-chip"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><span><strong>{name}</strong><small>Администратор</small></span></div>
      </header>

      {searchParams.error && <div className="notice notice-error">{searchParams.error}</div>}
      {searchParams.updated && <div className="notice">Статус обращения обновлён.</div>}
      {ticketsError && <div className="notice notice-error">Не удалось загрузить обращения. Проверьте права доступа в Supabase.</div>}

      <div className="stat-grid admin-stat-grid">
        <div className="stat-card"><span>Всего обращений</span><strong>{ticketRows.length}</strong><FileText size={19} /></div>
        <div className="stat-card"><span>Требуют внимания</span><strong>{activeCount}</strong><Clock3 size={19} /></div>
        <div className="stat-card"><span>Завершено</span><strong>{completedCount}</strong><CheckCircle2 size={19} /></div>
        <div className="stat-card"><span>Клиентов с обращениями</span><strong>{clientsCount}</strong><Users size={19} /></div>
      </div>

      <section className="ticket-section admin-ticket-section">
        <div className="section-heading"><div><div className="eyebrow">ЦЕНТР ОБРАЩЕНИЙ</div><h2>Все обращения</h2></div><span className="admin-results">Последние {ticketRows.length} из максимум 100</span></div>
        {ticketRows.length ? <div className="admin-ticket-list">{ticketRows.map((ticket) => {
          const client = profilesById.get(ticket.user_id);
          return <article className="admin-ticket-card" key={ticket.id}>
            <div className="admin-ticket-top">
              <div className="ticket-icon"><MessageCircle size={20} /></div>
              <div className="admin-ticket-title"><Link href={`/tickets/${ticket.id}`}><strong>{ticket.title}</strong><ArrowUpRight size={15} /></Link><span>{ticket.category} · {new Date(ticket.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}</span></div>
              <span className={`status status-${ticket.status}`}>{statusLabel[ticket.status] || ticket.status}</span>
            </div>
            <div className="admin-ticket-meta"><span><Users size={14} /> {client?.full_name || "Клиент без имени"}</span><span><MessageCircle size={14} /> {messageCounts.get(ticket.id) || 0} сообщ.</span><span>ID: {ticket.id.slice(0, 8).toUpperCase()}</span></div>
            <div className="admin-ticket-actions">
              <Link className="button button-primary" href={`/tickets/${ticket.id}`}>Открыть переписку <ArrowUpRight size={15} /></Link>
              <form action={updateTicketStatus} className="admin-status-form">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <label className="sr-only" htmlFor={`status-${ticket.id}`}>Статус обращения</label>
                <select id={`status-${ticket.id}`} name="status" defaultValue={ticket.status} aria-label={`Статус обращения ${ticket.title}`}>
                  {statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                </select>
                <button className="button button-outline" type="submit">Сохранить</button>
              </form>
            </div>
          </article>;
        })}</div> : <div className="empty-state"><div className="empty-icon"><MessageCircle size={26} /></div><h3>Пока нет обращений</h3><p>Когда клиенты создадут обращение, оно появится здесь.</p><Link className="button button-primary" href="/dashboard">Открыть личный кабинет</Link></div>}
      </section>
      <footer className="portal-footer">© {new Date().getFullYear()} JuristApp <span>Данные отображаются согласно правам доступа Supabase.</span></footer>
    </section>
  </main>;
}
