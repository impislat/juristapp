import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Правовая помощь — Давид Курбанов",
  description: "Помощь с документами и правовыми вопросами. Обсудим вашу ситуацию и варианты действий.",
  applicationName: "Правовая помощь",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Правовая помощь" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" }
};
export const viewport: Viewport = { themeColor: "#0A2540", width: "device-width", initialScale: 1, maximumScale: 1 };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="ru"><body>{children}</body></html>;
}