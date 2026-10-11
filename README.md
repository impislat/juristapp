# JuristApp — база приложения

Next.js 14 + Supabase Auth/Postgres. В этом этапе есть премиальная главная, регистрация клиента, вход, личный кабинет, создание обращений и переписка в обращении.

## 1. Environment variables
В Vercel → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` = `https://juristapp.vercel.app` (используется для подтверждения email)

Сохраните секреты только в Vercel, не в GitHub.

## 2. Database
В Supabase → SQL Editor → New query. Откройте `supabase/schema.sql`, скопируйте весь SQL, нажмите Run. SQL создаёт profiles, tickets, ticket_messages и RLS-политики.

## 3. Auth settings
Supabase → Authentication → URL Configuration:
- Site URL: `https://juristapp.vercel.app`
- Redirect URLs: `https://juristapp.vercel.app/auth/callback` и локально `http://localhost:3000/auth/callback` (для разработки).
Для теста можно временно отключить Confirm email, но для публичного запуска лучше оставить подтверждение email включённым и проверить SMTP/письма.

## 4. Deploy
После добавления файлов в GitHub в ветку `main` Vercel запустит новый deploy. Если не запустился, Vercel → Deployments → Redeploy.

## 5. Первичный администратор / специалист
По умолчанию регистрация всегда создаёт роль `client`. Нельзя дать себе роль специалиста через форму. После того как пользователь зарегистрировался и подтвердил email, администратор должен выдать роль вручную через Supabase SQL Editor, заменив email на настоящий:

```sql
update public.profiles p set role = 'admin'
from auth.users u where p.id = u.id and u.email = 'YOUR_EMAIL_HERE';
```

Выдавайте роль `admin` только своему аккаунту. Для назначения специалиста используйте `role = 'specialist'` только после проверки пользователя. Это пока ручное приглашение/одобрение; интерфейс приглашений добавляется следующим этапом.

## Important
- Не добавляйте `service_role`/Secret key в `NEXT_PUBLIC_*` или GitHub.
- Перед публичным запуском проверьте SQL/RLS и email confirmation. Функции оплаты, загрузки документов, realtime и реальные отзывы пока не входят в этот этап.
- Цены на главной — исходные цены проекта; проверьте и подтвердите их перед публичным продвижением.


## Admin panel update

The admin interface is available at `/admin` for accounts whose `public.profiles.role` is `admin`. Admins can review the latest 100 tickets, open conversations, and update ticket statuses. Server actions check the authenticated user's role before changing a status; Supabase RLS remains enabled.

To deploy this update, upload the updated project files to the root of the connected GitHub repository and commit them. Vercel should start a deployment automatically. After it succeeds, sign in again or refresh the dashboard; an “Админ-панель” link will be shown to the admin account.
