import Link from "next/link";
import { AuthShell } from "@/app/components/auth-card";
import { signUp } from "@/app/actions";
export default function RegisterPage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
 return <AuthShell title="Создайте аккаунт" subtitle="Все обращения и ответы будут собраны в одном безопасном месте.">
 {searchParams.error && <div className="notice notice-error">{searchParams.error}</div>}{searchParams.success && <div className="notice">{searchParams.success}</div>}
 <form action={signUp} className="form-stack"><label>Как к вам обращаться<input name="fullName" type="text" placeholder="Имя и фамилия" autoComplete="name" minLength={2} required/></label><label>Email<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required/></label><label>Пароль<input name="password" type="password" placeholder="Минимум 8 символов" autoComplete="new-password" minLength={8} required/><small className="field-hint">Используйте пароль, который не применяете на других сайтах.</small></label><div className="role-note"><strong>Регистрация клиента</strong><span>Доступ специалиста выдаётся отдельно после приглашения или одобрения администратора.</span></div><button className="button button-primary button-full" type="submit">Создать аккаунт <span>→</span></button></form>
 <p className="auth-switch">Уже зарегистрированы? <Link href="/login">Войти</Link></p>
 </AuthShell>
}
