import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Не настроены переменные Supabase в окружении.");
  return createServerClient(url, key, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value; },
      set(name: string, value: string, options: any) { try { cookieStore.set({ name, value, ...options }); } catch {} },
      remove(name: string, options: any) { try { cookieStore.set({ name, value: "", ...options }); } catch {} },
    },
  });
}
