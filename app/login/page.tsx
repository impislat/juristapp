import Link from "next/link";
import { AuthShell } from "@/app/components/auth-card";
import { signIn } from "@/app/actions";
export default function LoginPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
 return <AuthShell title="С возвращением" subtitle="Войдите, чтобы продолжить работу с обращениями.">
 {searchParams.error && <div className="notice notice-error">{searchParams.error}</div>}{searchParams.message && <div className="notice">{searchParams.message}</div>}
 <form action={signIn} className="form-stack"><label>Email<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required/></label><label>Пароль<input name="password" type="password" placeholder="Введите пароль" autoComplete="current-password" required/></label><button className="button button-primary button-full" type="submit">Войти в аккаунт <span>→</span></button></form>
 <p className="auth-switch">Впервые здесь? <Link href="/register">Создать аккаунт</Link></p>
 </AuthShell>
}
