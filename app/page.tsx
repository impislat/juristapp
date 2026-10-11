"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Check, ChevronRight, FileText, Gavel, MessageCircle, Phone, ShieldCheck, Star, UserRound, Menu, X, Send, Sparkles, Clock3 } from "lucide-react";

const services = [
  { icon: MessageCircle, title: "Разбор ситуации", price: "от 700 ₽", desc: "Изучение вопроса, оценка рисков и понятный план дальнейших действий." },
  { icon: FileText, title: "Претензия или требование", price: "от 3 000 ₽", desc: "Подготовка документа под обстоятельства вашей ситуации." },
  { icon: FileText, title: "Заявление или ходатайство", price: "от 2 000 ₽", desc: "Структурированный документ с учётом ваших вводных и цели." },
  { icon: ShieldCheck, title: "Жалоба", price: "от 2 500 ₽", desc: "Помощь с формулировками, доводами и приложениями." },
  { icon: Gavel, title: "Возражение или апелляция", price: "от 4 000 ₽", desc: "Разбор позиции и подготовка проекта процессуального документа." },
  { icon: FileText, title: "Договор", price: "от 5 000 ₽", desc: "Подготовка или проверка проекта договора и ключевых условий." },
  { icon: UserRound, title: "Документы под задачу", price: "по запросу", desc: "Обсудим задачу и согласуем состав работы до начала." },
  { icon: Clock3, title: "Сопровождение в переписке", price: "от 500 ₽", desc: "Помощь с формулировками и разбором документов в чате." }
];

const reviews = [
  { name: "Отзыв клиента", text: "Здесь разместите реальный отзыв клиента с его разрешения.", note: "Замените пример перед публикацией" },
  { name: "Отзыв клиента", text: "Добавьте отзыв о качестве коммуникации, сроках и результате работы.", note: "Только подлинные отзывы" },
  { name: "Отзыв клиента", text: "Лучше короткий конкретный отзыв, чем неподтверждённые обещания.", note: "Замените пример перед публикацией" }
];

export default function Home() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installVisible, setInstallVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", details: "", consent: false });

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setInstallVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installApp() {
    if (!installPrompt) {
      alert("На iPhone: нажмите «Поделиться» в Safari → «На экран Домой». На Android: откройте меню браузера → «Установить приложение» или «Добавить на главный экран».");
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallVisible(false);
  }

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");
    if (!form.consent) { setStatus("Подтвердите согласие на обработку данных."); return; }
    setSending(true);
    try {
      const response = await fetch("/api/lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, details: form.details })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось отправить заявку.");
      setStatus("Заявка отправлена. Я свяжусь с вами после получения сообщения.");
      setForm({ name: "", phone: "", details: "", consent: false });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка отправки. Напишите напрямую в Telegram.");
    } finally { setSending(false); }
  }

  const closeMenu = () => setMenuOpen(false);
  return (
    <main>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="container flex h-[72px] items-center justify-between gap-4">
          <a href="#home" className="flex items-center gap-3" onClick={closeMenu}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-gold"><ScaleIcon /></span>
            <span><b className="block text-sm tracking-tight text-navy">ПРАВОВАЯ ПОМОЩЬ</b><span className="text-xs text-slate-500">Давид Курбанов</span></span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#services" className="hover:text-navy">Услуги и цены</a><a href="#about" className="hover:text-navy">Обо мне</a><a href="#reviews" className="hover:text-navy">Отзывы</a>
          </nav>
          <a href="#request" className="gold-button hidden !px-4 !py-3 text-sm sm:inline-flex">Скидка 30% <ArrowRight size={16}/></a>
          <button className="rounded-lg p-2 md:hidden" aria-label="Открыть меню" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
        </div>
        {menuOpen && <div className="container grid gap-3 pb-4 text-sm md:hidden"><a href="#services" onClick={closeMenu}>Услуги и цены</a><a href="#about" onClick={closeMenu}>Обо мне</a><a href="#reviews" onClick={closeMenu}>Отзывы</a><a href="#request" onClick={closeMenu}>Оставить заявку</a></div>}
      </header>

      <section id="home" className="relative overflow-hidden bg-navy text-white">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border border-white/10" /><div className="absolute -right-4 -top-8 h-48 w-48 rounded-full border border-gold/20"/>
        <div className="container relative grid gap-12 py-16 md:grid-cols-[1.15fr_.85fr] md:items-center md:py-24">
          <div className="animate-rise">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200"><span className="h-2 w-2 rounded-full bg-gold"/><span>Разбор ситуации • Документы • Переписка</span></div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[.2em] text-gold">Персональный подход к вашему вопросу</p>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Когда важны детали — <span className="text-gold">разберёмся по порядку.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Помощь с правовыми вопросами и подготовкой документов. Объясню варианты простым языком и заранее согласую стоимость работы.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#request" className="gold-button">Получить скидку 30% <ArrowRight size={18}/></a>
              <a href="#services" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 font-semibold text-white hover:bg-white/5">Посмотреть услуги <ChevronRight size={17}/></a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300"><span className="flex items-center gap-2"><Check size={15} className="text-gold"/> Согласование цены заранее</span><span className="flex items-center gap-2"><Check size={15} className="text-gold"/> Общение в удобном формате</span></div>
          </div>
          <div className="mx-auto w-full max-w-sm animate-rise [animation-delay:120ms]">
            <div className="relative rounded-[28px] border border-white/15 bg-white/[.06] p-5 shadow-2xl backdrop-blur">
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900">
                <div className="text-center"><div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full border border-gold/50 bg-navy/70 text-gold"><UserRound size={36}/></div><p className="text-sm text-slate-300">Ваше фото</p><p className="mt-1 text-xs text-slate-400">Замените этот блок на портрет</p></div>
              </div>
              <div className="px-1 pb-1 pt-5"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Давид Курбанов</h2><p className="mt-1 text-sm text-slate-300">Правовая помощь и документы</p></div><div className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-gold"><BadgeCheck size={23}/></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/5 p-3"><p className="text-lg font-bold text-gold">1:1</p><p className="mt-1 text-xs text-slate-300">Персональная работа</p></div><div className="rounded-xl bg-white/5 p-3"><p className="text-lg font-bold text-gold">До старта</p><p className="mt-1 text-xs text-slate-300">Согласуем стоимость</p></div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container -mt-1 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#f4e9bd] via-[#fff9e9] to-[#f0e3b1] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy text-gold"><Sparkles size={23}/></div><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#866b19]">Предложение для пользователей приложения</p><h2 className="mt-1 text-2xl font-extrabold text-navy sm:text-3xl">Скидка 30% на первую работу</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">Укажите, что пришли через приложение. Скидка действует на согласованный объём работ; условия подтвердим до начала.</p></div></div><a href="#request" className="navy-button shrink-0">Забрать скидку <ArrowRight size={17}/></a></div>
        </div>
      </section>

      <section id="about" className="container py-12 sm:py-16">
        <div className="max-w-2xl"><p className="section-kicker">Почему удобно работать со мной</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Понятный процесс — без лишней сложности</h2><p className="mt-4 leading-7 text-slate-600">Сначала разбираем вводные и документы, затем обсуждаем возможные варианты, сроки и стоимость. Вы понимаете, что именно входит в работу.</p></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Прямой контакт","Вы общаетесь напрямую, без посредников."],["Цена до начала","Объём и стоимость согласуем заранее."],["Понятный язык","Объясняю ход работы без лишнего канцелярита."],["Конфиденциальность","Передавайте только сведения, необходимые для оценки вопроса."]].map(([title,desc],i)=><div className="card p-5" key={title}><div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[#f8f1d8] text-navy">{[<MessageCircle size={21}/>,<Check size={21}/>,<FileText size={21}/>,<ShieldCheck size={21}/>][i]}</div><h3 className="font-bold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p></div>)}
        </div>
      </section>

      <section id="services" className="bg-white py-14 sm:py-20">
        <div className="container"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="section-kicker">Услуги</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Чем могу помочь</h2><p className="mt-3 max-w-xl leading-7 text-slate-600">Стоимость ориентировочная. Итоговая цена зависит от сложности, объёма документов и срочности.</p></div><span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">8 направлений</span></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.map(({icon:Icon,title,price,desc})=><article key={title} className="card flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-lg"><div className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-gold"><Icon size={21}/></div><h3 className="mt-5 text-lg font-bold text-navy">{title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{desc}</p><div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4"><span className="font-extrabold text-navy">{price}</span><a href="#request" aria-label={`Заказать: ${title}`} className="grid h-9 w-9 place-items-center rounded-lg bg-[#f8f1d8] text-navy hover:bg-gold"><ArrowRight size={17}/></a></div></article>)}</div>
        </div>
      </section>

      <section id="request" className="container py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div className="pt-2"><p className="section-kicker">Первый шаг</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Опишите вопрос — обсудим решение</h2><p className="mt-4 leading-7 text-slate-600">Оставьте контакты и кратко опишите ситуацию. Заявка поступит мне в Telegram. Не указывайте в форме паспортные данные, номера карт и другую лишнюю чувствительную информацию.</p>
            <div className="mt-7 grid gap-3"><a href="https://t.me/your_telegram_username" target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-4 hover:border-gold"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e6f3ff] text-[#1478bd]"><Send size={21}/></span><span className="flex-1"><b className="block text-navy">Telegram</b><span className="text-sm text-slate-500">Написать напрямую</span></span><ArrowRight size={18}/></a>
              <a href="https://wa.me/70000000000" target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-4 hover:border-gold"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e7f8ed] text-[#168b49]"><MessageCircle size={21}/></span><span className="flex-1"><b className="block text-navy">WhatsApp</b><span className="text-sm text-slate-500">Открыть чат</span></span><ArrowRight size={18}/></a>
              <a href="tel:+70000000000" className="card flex items-center gap-4 p-4 hover:border-gold"><span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-navy"><Phone size={21}/></span><span className="flex-1"><b className="block text-navy">Позвонить</b><span className="text-sm text-slate-500">Обсудить задачу голосом</span></span><ArrowRight size={18}/></a></div>
          </div>
          <form onSubmit={submitForm} className="card p-5 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3"><div><h3 className="text-xl font-bold text-navy">Заявка на консультацию</h3><p className="mt-1 text-sm text-slate-500">Обычно достаточно пары предложений</p></div><span className="rounded-lg bg-[#f8f1d8] px-3 py-2 text-sm font-extrabold text-navy">−30%</span></div>
            <div className="grid gap-4"><label className="grid gap-2 text-sm font-semibold text-slate-700">Ваше имя<input className="field" required minLength={2} maxLength={80} autoComplete="name" placeholder="Как к вам обращаться?" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="grid gap-2 text-sm font-semibold text-slate-700">Телефон или мессенджер<input className="field" required maxLength={40} autoComplete="tel" placeholder="+7 900 000-00-00" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label className="grid gap-2 text-sm font-semibold text-slate-700">Кратко опишите вопрос<textarea className="field min-h-32 resize-y" required minLength={10} maxLength={2500} placeholder="Что произошло и какая помощь нужна?" value={form.details} onChange={e=>setForm({...form,details:e.target.value})}/></label>
              <label className="flex items-start gap-3 text-xs leading-5 text-slate-500"><input className="mt-1" type="checkbox" checked={form.consent} onChange={e=>setForm({...form,consent:e.target.checked})}/><span>Я согласен(на) на обработку указанных данных для ответа на обращение и ознакомлен(а) с <a className="underline" href="/privacy" target="_blank">политикой конфиденциальности</a>.</span></label>
              <button disabled={sending} className="gold-button w-full disabled:opacity-60" type="submit">{sending ? "Отправляем..." : "Отправить заявку"} <ArrowRight size={18}/></button>
              {status && <p role="status" className="rounded-xl bg-slate-50 p-3 text-sm text-navy">{status}</p>}
              <p className="text-center text-xs leading-5 text-slate-400">Нажимая кнопку, вы отправляете заявку. Это не создаёт автоматически договор об оказании услуг.</p>
            </div>
          </form>
        </div>
      </section>

      <section id="reviews" className="bg-[#eef1f5] py-14 sm:py-16"><div className="container"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="section-kicker">Отзывы</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-navy">Опыт клиентов</h2></div><p className="max-w-md text-sm leading-6 text-slate-500">Перед публикацией замените примеры реальными отзывами, которые разрешено размещать.</p></div><div className="mt-7 grid gap-4 md:grid-cols-3">{reviews.map((r,i)=><article key={i} className="card p-5"><div className="flex gap-1 text-[#b08d22]">{[1,2,3,4,5].map(n=><Star key={n} size={15} fill="currentColor"/>)}</div><p className="mt-4 leading-7 text-slate-600">«{r.text}»</p><div className="mt-5 border-t border-slate-100 pt-4"><b className="block text-sm text-navy">{r.name}</b><span className="mt-1 block text-xs text-slate-400">{r.note}</span></div></article>)}</div></div></section>

      <section className="container py-10"><div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-navy p-6 text-white sm:flex-row sm:items-center sm:p-8"><div><h2 className="text-2xl font-bold">Будем на связи</h2><p className="mt-2 text-sm leading-6 text-slate-300">Установите приложение, чтобы открывать контакты и услуги с главного экрана.</p></div><button onClick={installApp} className="gold-button shrink-0"><ArrowRight size={17}/> Установить приложение</button></div></section>

      <footer className="border-t border-slate-200 bg-white py-7"><div className="container flex flex-col gap-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between"><div><b className="text-navy">Правовая помощь · Давид Курбанов</b><p className="mt-1">Информация на сайте не является гарантией результата по конкретному делу.</p></div><div className="flex flex-wrap gap-4"><a className="underline" href="/privacy">Политика конфиденциальности</a><a className="underline" href="#home">Наверх ↑</a></div></div></footer>
    </main>
  );
}

function ScaleIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7Zm10 0-4 7h8l-4-7ZM7 21h10"/></svg>;
}