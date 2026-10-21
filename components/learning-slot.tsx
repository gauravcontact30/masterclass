"use client";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUpRight, Pin } from "lucide-react";
import { sanitizeNotepadHtml } from "@/lib/notepad";
import { TONES, type LearningBlock, type LearningSurface } from "@/lib/learning-uploads";
import { useLanguage } from "./language-provider";
import styles from "./learning-slot.module.css";
import { ListenButton } from "./listen-button";

/*
 * Where Upload Learning content appears. Each page places one slot per section; slots on the same page share a
 * single request. Content is fetched after hydration (the landing page is cached, so it cannot be rendered in),
 * sanitised again in the browser, and nothing renders at all when the section has no published content.
 * Device targeting is CSS (no layout shift, no hydration difference); language follows the visitor's EN/Hi choice.
 * On the Learning Dashboard every upload is a card that opens the full lesson and its study pack (learning-cards).
 */
// Dashboard cards and their "Read more" window load only where they are used, never in the landing bundle.
const LearningCards = dynamic(() => import("./learning-cards").then(module => module.LearningCards), { ssr: false });
const requests = new Map<string, Promise<LearningBlock[]>>();
/** Fired by the admin page after a publish, so open slots show the change without a reload. */
export const LEARNING_CHANGED = "learning-content:changed";

function load(surface: LearningSurface, page: string) {
  const key = `${surface}|${page}`;
  let request = requests.get(key);
  if (!request) {
    // Started from a resolved promise so any failure, even a missing fetch, just means no extra content.
    request = Promise.resolve().then(() => fetch(`/api/learning-content?${new URLSearchParams({ surface, page })}`, { cache: "no-store" }))
      .then(response => response?.ok ? response.json() : { blocks: [] }).then(body => Array.isArray(body?.blocks) ? body.blocks as LearningBlock[] : [])
      .catch(() => []);
    requests.set(key, request);
  }
  return request;
}

/** Counts a view once per block per browser session. */
function countView(id: string) {
  try {
    const key = `masterclass:learning-viewed:${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const body = JSON.stringify({ id });
    if (!navigator.sendBeacon?.("/api/learning-content", new Blob([body], { type: "application/json" }))) void fetch("/api/learning-content", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
  } catch { /* storage or network unavailable: skip counting */ }
}

export function LearningSlot({ surface, page, section, className, fallback = null }: { surface: LearningSurface; page: string; section: string; className?: string; fallback?: ReactNode }) {
  const { language } = useLanguage();
  const [blocks, setBlocks] = useState<(LearningBlock & { clean: string })[] | null>(null);
  useEffect(() => {
    let live = true;
    const read = () => load(surface, page).then(all => { if (live) setBlocks(all.filter(block => block.section === section).map(block => ({ ...block, clean: sanitizeNotepadHtml(block.html) }))); });
    const changed = () => { requests.delete(`${surface}|${page}`); void read(); };
    void read();
    window.addEventListener(LEARNING_CHANGED, changed);
    return () => { live = false; window.removeEventListener(LEARNING_CHANGED, changed); };
  }, [surface, page, section]);
  const shown = useMemo(() => blocks?.filter(block => !block.language || block.language === "all" || block.language === language) ?? null, [blocks, language]);
  useEffect(() => { shown?.forEach(block => countView(block.id)); }, [shown]);
  // Nothing while loading; the fallback (if any) only once the section is known to be empty.
  if (!shown) return null;
  if (!shown.length) return fallback;
  return <section className={`${styles.slot} ${className ?? ""}`} data-section={section} aria-label="Featured learning">
    {surface === "dashboard" ? <LearningCards blocks={shown} /> : shown.map(block => <LearningBlockView key={block.id} block={block} />)}
  </section>;
}

type ViewBlock = Pick<LearningBlock, "id" | "title" | "summary" | "layout" | "tone" | "background" | "showTitle"> & Partial<Pick<LearningBlock, "pinned" | "device" | "ctaLabel" | "ctaUrl" | "tags">> & { clean: string };

function Cta({ label, url }: { label: string; url: string }) {
  const content = <>{label}<ArrowUpRight size={15} aria-hidden="true" /></>;
  return url.startsWith("/") ? <Link className={styles.cta} href={url}>{content}</Link> : <a className={styles.cta} href={url} target="_blank" rel="noopener noreferrer">{content}</a>;
}

export function LearningBlockView({ block }: { block: ViewBlock }) {
  const tone = TONES.find(t => t.value === block.tone) ?? TONES[0];
  const style = { "--slot-fill": block.background !== "#ffffff" ? block.background : tone.fill, "--slot-edge": tone.edge } as CSSProperties;
  const cta = block.ctaLabel && block.ctaUrl ? <Cta label={block.ctaLabel} url={block.ctaUrl} /> : null;
  const tags = block.tags?.length ? <ul className={styles.tags} aria-label="Topics">{block.tags.map(tag => <li key={tag}>{tag}</li>)}</ul> : null;
  const body = <div className={styles.body} dangerouslySetInnerHTML={{ __html: block.clean }} />;
  const device = block.device && block.device !== "all" ? block.device : undefined;
  const listen = <ListenButton id={`upload:${block.id}`} title={block.title} text={() => `${block.title}. ${block.summary ?? ""} ${block.clean}`} />;
  if (block.layout === "accordion") return <details className={styles.block} data-layout="accordion" data-device={device} style={style}>
    <summary><strong>{block.pinned && <Pin size={13} aria-label="Pinned" />}{block.title}</strong>{block.summary && <span>{block.summary}</span>}</summary>{body}<footer className={styles.footer}>{tags}{listen}{cta}</footer>
  </details>;
  return <article className={styles.block} data-layout={block.layout} data-device={device} style={style}>
    {block.showTitle && <header><h2>{block.pinned && <Pin size={14} aria-label="Pinned" />}{block.title}</h2>{block.summary && <p>{block.summary}</p>}</header>}
    {body}
    <footer className={styles.footer}>{tags}{listen}{cta}</footer>
  </article>;
}
