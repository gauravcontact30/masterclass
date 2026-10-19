"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Brain, ChevronRight, Code2, Compass, GraduationCap, Layers, Lightbulb, Rocket, Sparkles, Star, type LucideIcon } from "lucide-react";
import { LEARNING_CHANGED } from "./learning-slot";

/** The owner's custom Learning Dashboard pages (Upload Learning › Learning pages), as a sidebar group. */
const ICONS: Record<string, LucideIcon> = { BookOpen, Brain, Code2, Compass, GraduationCap, Layers, Lightbulb, Rocket, Sparkles, Star };
type NavPage = { slug: string; title: string; icon: string };

export function LearningPagesNav({ collapsed, activeSlug }: { collapsed: boolean; activeSlug?: string }) {
  const [pages, setPages] = useState<NavPage[]>([]);
  useEffect(() => {
    let live = true;
    const read = () => Promise.resolve().then(() => fetch("/api/learning-content?pages=1", { cache: "no-store" })).then(r => r?.ok ? r.json() : { pages: [] }).then(body => { if (live) setPages(Array.isArray(body?.pages) ? body.pages : []); }, () => undefined);
    void read();
    window.addEventListener(LEARNING_CHANGED, read);
    return () => { live = false; window.removeEventListener(LEARNING_CHANGED, read); };
  }, []);
  if (!pages.length) return null;
  return <>
    <div className="sidebar-label">{!collapsed && "Your pages"}</div>
    <nav aria-label="Your pages" className="sidebar-pro-nav">{pages.map(page => {
      const Icon = ICONS[page.icon] ?? BookOpen;
      return <Link key={page.slug} href={`/dashboard/learn/${page.slug}`} aria-label={page.title} className="sidebar-notes" aria-current={activeSlug === page.slug ? "page" : undefined}>
        <Icon size={17} />{!collapsed && <>{page.title}<ChevronRight size={14} /></>}{collapsed && <span className="sidebar-tooltip">{page.title}</span>}
      </Link>;
    })}</nav>
  </>;
}
