import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ПравоПро — юридическая помощь онлайн", description: "Обращения, документы и общение со специалистом в личном кабинете.", applicationName: "ПравоПро", manifest: "/manifest.webmanifest", appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ПравоПро" }, icons: { icon: "/icon.svg", apple: "/icon.svg" } };
export const viewport: Viewport = { themeColor: "#101d30", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="ru"><body>{children}</body></html>; }
