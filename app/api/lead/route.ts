import { NextResponse } from "next/server";

// Токен хранится только в переменных окружения Vercel и не попадает в браузер.
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return NextResponse.json({ error: "Владелец сайта ещё не настроил Telegram. Напишите напрямую в мессенджер." }, { status: 503 });

    const body = await request.json();
    const name = clean(body.name, 80);
    const phone = clean(body.phone, 40);
    const details = clean(body.details, 2500);
    if (name.length < 2 || phone.length < 3 || details.length < 10) {
      return NextResponse.json({ error: "Проверьте имя, контакт и описание вопроса." }, { status: 400 });
    }

    const message = [
      "📩 Новая заявка с PWA",
      "Скидка: клиент пришёл через приложение (проверить условия)",
      "",
      `Имя: ${name}`,
      `Контакт: ${phone}`,
      "",
      "Вопрос:",
      details,
      "",
      `Время: ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })} (МСК)`
    ].join("\n");

    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
      cache: "no-store"
    });
    const result = await tg.json();
    if (!tg.ok || !result.ok) {
      console.error("Telegram sendMessage failed", result?.description || tg.status);
      return NextResponse.json({ error: "Telegram не принял заявку. Попробуйте ещё раз или напишите напрямую." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось обработать заявку. Попробуйте ещё раз." }, { status: 400 });
  }
}
function clean(value: unknown, max: number): string {
  return String(value ?? "").replace(/[<>]/g, "").replace(/\u0000/g, "").trim().slice(0, max);
}