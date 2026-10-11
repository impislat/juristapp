import Link from "next/link";
import { Scale } from "lucide-react";
export function Brand({ light = false }: { light?: boolean }) {
 return <Link href="/" className={`brand ${light ? "brand-light" : ""}`}><span className="brand-mark"><Scale size={21}/></span><span><strong>ПРАВО<span>ПРО</span></strong><small>Юридическая помощь онлайн</small></span></Link>;
}
