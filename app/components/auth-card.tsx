import Link from "next/link";
import { Brand } from "./brand";
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
 return <main className="auth-page"><div className="auth-top"><Brand/></div><section className="auth-card"><div className="eyebrow"><span className="eyebrow-dot"/> ЛИЧНЫЙ КАБИНЕТ</div><h1>{title}</h1><p className="muted">{subtitle}</p>{children}<div className="auth-foot"><span>Продолжая, вы соглашаетесь с условиями сервиса.</span><Link href="/privacy">Конфиденциальность</Link></div></section><div className="auth-bottom">© {new Date().getFullYear()} ПравоПро · Помогаем разобраться в ситуации</div></main>
}
