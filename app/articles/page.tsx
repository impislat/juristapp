import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, Heart, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Brand } from "@/app/components/brand";
export const dynamic = "force-dynamic";
export default async function ArticlesPage() {
 const supabase=createClient();
 const {data:articles}=await supabase.from("articles").select("id,title,slug,excerpt,content,published_at,created_at").eq("status","published").order("published_at",{ascending:false});
 const rows=articles||[];
 const ids=rows.map(a=>a.id);
 const [{data:likes},{data:comments}]=ids.length?await Promise.all([supabase.from("article_likes").select("article_id").in("article_id",ids),supabase.from("article_comments").select("article_id").in("article_id",ids)]):[{data:[] as {article_id:string}[]},{data:[] as {article_id:string}[]}];
 const count=(items:any[],id:string)=>items.filter(x=>x.article_id===id).length;
 return <main className="editorial-page"><header className="editorial-header"><Brand/><nav><Link href="/">Главная</Link><Link href="/services">Услуги и цены</Link><Link href="/dashboard">Личный кабинет</Link></nav></header><section className="editorial-hero"><Link href="/" className="back-link"><ArrowLeft size={15}/> На главную</Link><div className="eyebrow">ПРАВОВОЙ ЖУРНАЛ</div><h1>Знания, которые помогают <em>действовать.</em></h1><p>Короткие инструкции и разборы распространённых ситуаций. Информация носит общий характер и не заменяет анализ конкретных обстоятельств.</p></section><section className="article-grid">{rows.length?rows.map((a,i)=><article className={`article-card ${i===0?"article-card-featured":""}`} key={a.id}><div className="article-card-top"><span className="article-index">{String(i+1).padStart(2,"0")}</span><BookOpen size={19}/></div><div className="article-date">{new Date(a.published_at||a.created_at).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}</div><h2>{a.title}</h2><p>{a.excerpt||a.content.slice(0,180)}</p><div className="article-card-bottom"><span><Heart size={14}/>{count(likes||[],a.id)}</span><span><MessageCircle size={14}/>{count(comments||[],a.id)}</span><Link href={`/articles/${a.slug}`}>Читать <ArrowUpRight size={16}/></Link></div></article>):<div className="article-empty"><BookOpen size={28}/><h2>Публикации скоро появятся</h2><p>Здесь будут короткие инструкции и разборы. Администратор может публиковать материалы из админ-панели.</p><Link href="/services" className="button button-primary">Посмотреть услуги</Link></div>}</section><footer className="editorial-footer"><Brand/><span>Общая информация не является индивидуальным юридическим заключением.</span></footer></main>
}
