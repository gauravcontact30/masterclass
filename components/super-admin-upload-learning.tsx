"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown, ArrowUp, BookOpen, CalendarClock, CheckCircle2, Copy, Eye, EyeOff, FilePlus2, FileText, FileUp, History, LayoutTemplate, Map as MapIcon, Monitor, MousePointerClick,
  Pencil, Pin, PinOff, Plus, RefreshCw, Rocket, RotateCcw, Save, Search, Send, Smartphone, Sparkles, Tablet, Tag, Trash2, Upload, UploadCloud, Users, X,
  ExternalLink, Globe2, LogIn, ShieldCheck, UserPlus, LayoutDashboard, Flame, type LucideIcon,
} from "lucide-react";
import { SuperAdminTechBuzz } from "./super-admin-tech-buzz";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { AdminSelect } from "./super-admin-select";
import { AdminPagePicker } from "./super-admin-page-picker";
import { LearningBlockView, LEARNING_CHANGED } from "./learning-slot";
import { ListenButton } from "./listen-button";
import { sanitizeNotepadHtml } from "@/lib/notepad";
import { documentText, readNotepadCollection, type NotepadFile } from "@/lib/notepad-library";
import {
  AUDIENCES, DEVICES, LANGUAGES, LAYOUTS, PAGE_ICONS, SECTIONS, SURFACES, TONES, isSafeCtaUrl, readingMinutes, slugify, surfacePages,
  type LearningAudience, type LearningDevice, type LearningLanguage, type LearningLayout, type LearningPage, type LearningRevision, type LearningStatus,
  type LearningSurface, type LearningTone, type LearningUpload,
} from "@/lib/learning-uploads";
import modal from "./suggestion-box.module.css";
import styles from "./super-admin-upload-learning.module.css";

/*
 * Upload Learning (owner only). Compose: pick a Notepad document (or import a file), choose where it appears on a
 * picture of the page, style it, target it and schedule it, with a live preview at desktop, tablet and phone
 * widths. Library: every upload with views, versions, bulk actions and restore. Pages: custom Learning Dashboard
 * pages. Placements: what is shown where, at a glance. Everything is stored in Supabase (migration 0029).
 */
/** Where an upload's AI Gateway thumbnail and study pack stand (migration 0033). */
const PACK_LABELS: Record<NonNullable<LearningUpload["packStatus"]>, string> = { none: "not made yet", generating: "being made…", ready: "ready", failed: "failed" };
type Draft = {
  id: string | null; title: string; summary: string; html: string; background: string; sourceFileId: string | null; sourceName: string;
  surface: LearningSurface; page: string; section: string; layout: LearningLayout; tone: LearningTone; showTitle: boolean; pinned: boolean;
  position: number; audience: LearningAudience; device: LearningDevice; language: LearningLanguage; ctaLabel: string; ctaUrl: string; tags: string[];
  startsAt: string; endsAt: string;
};
const BLANK: Draft = {
  id: null, title: "", summary: "", html: "", background: "#ffffff", sourceFileId: null, sourceName: "", surface: "dashboard", page: "dashboard", section: "top",
  layout: "card", tone: "ivory", showTitle: true, pinned: false, position: 0, audience: "everyone", device: "all", language: "all", ctaLabel: "", ctaUrl: "", tags: [], startsAt: "", endsAt: "",
};
const ERRORS: Record<string, string> = {
  migration_required: "Upload Learning needs its database tables. Apply supabase/migrations/0029_learning_uploads.sql in Supabase, then press Refresh.",
  owner_only: "Only the owner account (garvcontact30@gmail.com) can upload learning content.",
  signin_required: "Your session ended. Sign in again.", slug_taken: "A page with that address already exists. Choose another title or address.",
  request_too_large: "This document is too large to upload (4 MB limit including images). Shrink or remove some images.", invalid_slug: "Give the page a title made of letters or numbers.",
  invalid_request: "Some details are not valid. Check the call-to-action link and the schedule, then try again.", not_found: "That item no longer exists. Press Refresh.",
};
const message = (code: string) => ERRORS[code] ?? "Something went wrong. Try again in a moment.";
const when = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
/** ISO ↔ the local value a datetime-local input takes. */
const toLocal = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const toIso = (local: string) => local ? new Date(local).toISOString() : null;
const surfaceLabel = (surface: string) => SURFACES.find(s => s.value === surface)?.label ?? surface;
const SURFACE_ICONS: Record<LearningSurface, LucideIcon> = {
  dashboard: LayoutDashboard,
  landing: Globe2,
  sign_in: LogIn,
  sign_up: UserPlus,
  super_admin: ShieldCheck,
  tech_buzz: Flame,
};
const LAYOUT_HINTS: Record<LearningLayout, string> = { card: "A framed card with a soft shadow", banner: "One slim line, for short notes", full: "A wide article, for long reads", accordion: "Folded until the learner opens it" };
const PREVIEW_WIDTHS = [{ value: "desktop", label: "Desktop", width: "100%", icon: Monitor }, { value: "tablet", label: "Tablet", width: "768px", icon: Tablet }, { value: "phone", label: "Phone", width: "375px", icon: Smartphone }] as const;
/**
 * A picture of each surface, top to bottom: fixed parts of the page (grey) and the sections content can go in.
 * Learning Dashboard pages put their own content between Top and Bottom; custom pages use Main.
 */
const WIREFRAMES: Record<LearningSurface, (string | { fixed: string })[]> = {
  dashboard: [{ fixed: "Header and page title" }, "top", { fixed: "The page's own content" }, "main", "bottom"],
  landing: [{ fixed: "Navigation bar" }, { fixed: "Image slider" }, "after-slider", { fixed: "AI pulse, Word power, workflows, interview, comparisons, docs" }, "middle", { fixed: "Techy and API previews" }, "before-plans", { fixed: "Plans" }, "bottom", { fixed: "Footer" }],
  sign_in: [{ fixed: "Back link and language" }, { fixed: "Sign in heading" }, "above-form", { fixed: "Email and password form" }, "below-form", { fixed: "Brand story panel" }],
  sign_up: [{ fixed: "Back link and language" }, { fixed: "Sign up heading" }, "above-form", { fixed: "Name, email and password form" }, "below-form", { fixed: "Brand story panel" }],
  super_admin: [{ fixed: "Console header" }, { fixed: "Page title" }, "top", { fixed: "The admin page's own content" }, "bottom"],
  tech_buzz: [{ fixed: "Hero & radar feed header" }, "feed-top", { fixed: "Blog card stream" }, "feed-middle", { fixed: "Story reader" }, "article-bottom"],
};
/** The status a learner would see right now. */
function liveState(u: Pick<LearningUpload, "status" | "startsAt" | "endsAt">, now: number) {
  if (u.status === "draft") return { key: "draft", label: "Draft" };
  if (u.status === "hidden") return { key: "hidden", label: "Hidden" };
  if (u.startsAt && Date.parse(u.startsAt) > now) return { key: "scheduled", label: "Scheduled" };
  if (u.endsAt && Date.parse(u.endsAt) <= now) return { key: "ended", label: "Ended" };
  return { key: "live", label: "Live" };
}
/** The address where a placement can be seen. */
export function placementHref(surface: LearningSurface, page: string) {
  if (surface === "landing") return "/";
  if (surface === "sign_in") return "/sign-in";
  if (surface === "sign_up") return "/sign-up";
  if (surface === "tech_buzz") return page === "article" ? "/tech-buzz/scaling-websockets-kubernetes-rust" : "/tech-buzz";
  if (surface === "super_admin") return "/super-admin";
  if (page.startsWith("learn:")) return `/learning/learn/${page.slice(6)}`;
  return page === "dashboard" ? "/learning" : `/learning/${page}`;
}

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? (response.status === 413 ? "request_too_large" : "service_error"));
  return json as T;
}
const draftFrom = (u: LearningUpload): Draft => ({
  id: u.id, title: u.title, summary: u.summary ?? "", html: u.html, background: u.background, sourceFileId: u.sourceFileId, sourceName: "Current content", surface: u.surface, page: u.page,
  section: u.section, layout: u.layout, tone: u.tone, showTitle: u.showTitle, pinned: u.pinned, position: u.position, audience: u.audience, device: u.device, language: u.language,
  ctaLabel: u.ctaLabel ?? "", ctaUrl: u.ctaUrl ?? "", tags: u.tags, startsAt: toLocal(u.startsAt), endsAt: toLocal(u.endsAt),
});
const bodyFrom = (d: Draft, status: LearningStatus) => ({
  title: d.title.trim(), summary: d.summary.trim() || null, html: d.html, background: /^#[0-9a-f]{6}$/i.test(d.background) ? d.background : "#ffffff", sourceFileId: d.sourceFileId,
  surface: d.surface, page: d.page, section: d.section, layout: d.layout, tone: d.tone, showTitle: d.showTitle, pinned: d.pinned, position: d.position, audience: d.audience,
  device: d.device, language: d.language, ctaLabel: d.ctaLabel.trim() || null, ctaUrl: d.ctaUrl.trim() || null, tags: d.tags, status, startsAt: toIso(d.startsAt), endsAt: toIso(d.endsAt),
});

type Tab = "compose" | "library" | "pages" | "tech_buzz" | "placements";
export function SuperAdminUploadLearning({ userId }: { userId: string }) {
  const id = useId();
  const [tab, setTab] = useState<Tab>("compose");
  const [uploads, setUploads] = useState<LearningUpload[]>([]);
  const [pages, setPages] = useState<LearningPage[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(BLANK);
  // When the list was read, for live vs scheduled (render must not read the clock).
  const [loadedAt, setLoadedAt] = useState(0);

  const reload = useCallback(async () => {
    setLoading(true);
    try { const body = await send<{ uploads: LearningUpload[]; pages: LearningPage[] }>("/api/super-admin/learning-uploads", "GET"); setUploads(body.uploads); setPages(body.pages); setLoadedAt(Date.now()); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "service_error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { queueMicrotask(() => void reload()); }, [reload]);
  const changed = (text: string) => { setNotice(text); setError(""); window.dispatchEvent(new Event(LEARNING_CHANGED)); void reload(); };
  const edit = (upload: LearningUpload) => { setDraft(draftFrom(upload)); setTab("compose"); setNotice(""); };
  const stats = useMemo(() => {
    const states = uploads.map(u => liveState(u, loadedAt).key);
    const top = [...uploads].sort((a, b) => b.views - a.views)[0];
    return { live: states.filter(s => s === "live").length, scheduled: states.filter(s => s === "scheduled").length, drafts: states.filter(s => s === "draft").length, views: uploads.reduce((t, u) => t + u.views, 0), top: top && top.views ? top : null };
  }, [uploads, loadedAt]);
  const tabs: [Tab, string, LucideIcon, number | null][] = [
    ["compose", draft.id ? "Edit upload" : "Compose", Sparkles, null],
    ["library", "Library", LayoutTemplate, uploads.length],
    ["pages", "Learning pages", BookOpen, pages.length],
    ["tech_buzz", "Tech Buzz Blogs", Flame, null],
    ["placements", "Placements map", MapIcon, null],
  ];

  return <div className={styles.root}>
    <section className={styles.hero}>
      <div className={styles.heroText}>
        <span className={styles.heroMark} aria-hidden="true"><UploadCloud size={22} /></span>
        <div><h2>Publish learning anywhere in MasterClass</h2><p>Turn a Notepad document into a card, banner or article on the Learning Dashboard, landing page, sign in, sign up or this console, for exactly the learners you choose.</p></div>
      </div>
      <div className={styles.heroActions}>
        <button type="button" className={styles.primary} onClick={() => { setDraft(BLANK); setTab("compose"); }}><Plus size={15} aria-hidden="true" />New upload</button>
        <button type="button" className={styles.secondary} onClick={() => setTab("pages")}><FilePlus2 size={15} aria-hidden="true" />New page</button>
      </div>
    </section>

    <div className={styles.stats}>
      <Stat tone="mint" icon={Rocket} label="Live now" value={stats.live} note="Visible to learners" onClick={() => setTab("library")} />
      <Stat tone="sky" icon={CalendarClock} label="Scheduled" value={stats.scheduled} note="Start later" onClick={() => setTab("library")} />
      <Stat tone="butter" icon={Pencil} label="Drafts" value={stats.drafts} note="Not visible yet" onClick={() => setTab("library")} />
      <Stat tone="lavender" icon={Eye} label="Views" value={stats.views} note={stats.top ? `Top: ${stats.top.title}` : "Counted once per visit"} />
      <Stat tone="peach" icon={BookOpen} label="Your pages" value={pages.length} note={`${pages.filter(p => p.visible).length} in the sidebar`} onClick={() => setTab("pages")} />
    </div>

    <div className={styles.tabs} role="tablist" aria-label="Upload Learning">
      {tabs.map(([value, text, Icon, count]) => <button type="button" role="tab" key={value} id={`${id}-tab-${value}`} aria-selected={tab === value} aria-controls={`${id}-panel`} onClick={() => setTab(value)}>
        <Icon size={15} aria-hidden="true" /><span>{text}</span>{count != null && <span className={styles.count}>{count}</span>}
      </button>)}
      <button type="button" className={styles.refresh} onClick={() => void reload()} disabled={loading} aria-label="Refresh"><RefreshCw size={14} aria-hidden="true" className={loading ? "spin" : undefined} /><span>Refresh</span></button>
    </div>
    {error && <p className={styles.error} role="alert">{message(error)}</p>}
    {notice && <p className={styles.notice} role="status"><CheckCircle2 size={15} aria-hidden="true" />{notice}<button type="button" aria-label="Dismiss" onClick={() => setNotice("")}><X size={14} /></button></p>}

    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`}>
      {tab === "compose" && <Composer userId={userId} draft={draft} setDraft={setDraft} pages={pages} onDone={text => { setDraft(BLANK); changed(text); setTab("library"); }} onError={setError} />}
      {tab === "library" && <Library uploads={uploads} pages={pages} now={loadedAt} loading={loading} onEdit={edit} onChanged={changed} onError={setError} />}
      {tab === "pages" && <PagesPanel pages={pages} uploads={uploads} onChanged={changed} onError={setError} onAddContent={page => { setDraft({ ...BLANK, page: `learn:${page.slug}`, section: "main" }); setTab("compose"); }} />}
      {tab === "tech_buzz" && <SuperAdminTechBuzz onChanged={changed} />}
      {tab === "placements" && <Placements uploads={uploads} pages={pages} now={loadedAt} onEdit={edit} onCompose={(surface, page, section) => { setDraft({ ...BLANK, surface, page, section }); setTab("compose"); }} />}
    </div>
  </div>;
}

function Stat({ tone, icon: Icon, label, value, note, onClick }: { tone: string; icon: LucideIcon; label: string; value: number; note: string; onClick?: () => void }) {
  const body = <><span className={styles.statIcon} aria-hidden="true"><Icon size={16} /></span><span className={styles.statLabel}>{label}</span><strong>{value.toLocaleString("en-IN")}</strong><small>{note}</small></>;
  return onClick ? <button type="button" className={styles.stat} data-tone={tone} onClick={onClick}>{body}</button> : <div className={styles.stat} data-tone={tone}>{body}</div>;
}

function Step({ n, title, hint, tone, children, done }: { n: number; title: string; hint: string; tone: string; children: ReactNode; done?: boolean }) {
  return <section className={styles.step} data-tone={tone} aria-labelledby={`step-${n}`}>
    <header><span className={styles.stepNo} data-done={done || undefined} aria-hidden="true">{done ? <CheckCircle2 size={15} /> : n}</span><div><h3 id={`step-${n}`}>{title}</h3><p>{hint}</p></div></header>
    {children}
  </section>;
}
function Field({ label, htmlFor, children, hint, wide }: { label: string; htmlFor?: string; children: ReactNode; hint?: string; wide?: boolean }) {
  return <div className={styles.field} data-wide={wide || undefined}><label htmlFor={htmlFor}>{label}</label>{children}{hint && <small>{hint}</small>}</div>;
}
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <div className={styles.segmented} role="radiogroup" aria-label={label}>{options.map(option => <button type="button" role="radio" key={option.value} aria-checked={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}

function Composer({ userId, draft, setDraft, pages, onDone, onError }: { userId: string; draft: Draft; setDraft: (d: Draft) => void; pages: LearningPage[]; onDone: (text: string) => void; onError: (code: string) => void }) {
  const id = useId();
  const [files, setFiles] = useState<NotepadFile[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [tag, setTag] = useState("");
  const [width, setWidth] = useState<(typeof PREVIEW_WIDTHS)[number]["value"]>("desktop");
  const fileInput = useRef<HTMLInputElement>(null);
  const readFiles = useCallback(() => {
    try { setFiles(readNotepadCollection(localStorage.getItem(`masterclass:admin-notepad:${userId}`)).documents.filter(file => documentText(file.html).trim() || /<img/i.test(file.html)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))); }
    catch { setFiles([]); }
  }, [userId]);
  // Local storage exists only in the browser, so the files are read after mount.
  useEffect(() => { queueMicrotask(readFiles); }, [readFiles]);
  const set = <K extends keyof Draft>(key: K) => (value: Draft[K]) => setDraft({ ...draft, [key]: value });
  const pick = (file: NotepadFile) => setDraft({ ...draft, title: draft.id && draft.title ? draft.title : file.title, html: sanitizeNotepadHtml(file.html), background: file.background, sourceFileId: file.id, sourceName: file.title });
  const importFile = async (file: File) => {
    const text = await file.text();
    const html = /\.html?$/i.test(file.name) ? text : text.split(/\n{2,}/).map(block => `<p>${block.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!)).replace(/\n/g, "<br>")}</p>`).join("");
    setDraft({ ...draft, title: draft.title || file.name.replace(/\.[^.]+$/, ""), html: sanitizeNotepadHtml(html), sourceFileId: null, sourceName: file.name });
  };
  const setSurface = (s: LearningSurface) => setDraft({ ...draft, surface: s, page: surfacePages(s, pages)[0].value, section: SECTIONS[s][0].value });
  const addTag = () => { const value = tag.trim().toLowerCase().slice(0, 30); if (value && !draft.tags.includes(value) && draft.tags.length < 10) set("tags")([...draft.tags, value]); setTag(""); };
  const shown = files.filter(file => !query || file.title.toLowerCase().includes(query.toLowerCase()) || documentText(file.html).toLowerCase().includes(query.toLowerCase()));
  const pageOptions = surfacePages(draft.surface, pages);
  const sections = SECTIONS[draft.surface].filter(s => draft.surface !== "dashboard" || (draft.page.startsWith("learn:") ? true : s.value !== "main"));
  const preview = useMemo(() => ({ ...draft, id: "preview", summary: draft.summary || null, clean: draft.html, ctaLabel: draft.ctaLabel || null, ctaUrl: draft.ctaUrl && isSafeCtaUrl(draft.ctaUrl) ? draft.ctaUrl : null, device: "all" as const }), [draft]);
  const invalidSchedule = !!draft.startsAt && !!draft.endsAt && draft.endsAt <= draft.startsAt;
  const invalidCta = (!!draft.ctaUrl && !isSafeCtaUrl(draft.ctaUrl.trim())) || (!!draft.ctaUrl !== !!draft.ctaLabel);
  const ready = !!draft.html && !!draft.title.trim() && !invalidSchedule && !invalidCta;
  const scheduled = !!draft.startsAt && draft.startsAt > toLocal(new Date().toISOString());
  const save = async (status: LearningStatus) => {
    if (!ready) return;
    setBusy(true);
    const body = bodyFrom(draft, status);
    try {
      if (draft.id) await send("/api/super-admin/learning-uploads", "PATCH", { id: draft.id, changes: body });
      else await send("/api/super-admin/learning-uploads", "POST", body);
      onDone(`${status === "published" ? (scheduled ? "Scheduled" : "Published") : "Saved as draft"}: “${body.title}” on ${surfaceLabel(body.surface)} › ${pageOptions.find(p => p.value === body.page)?.label ?? body.page}.`);
    } catch (e) { onError(e instanceof Error ? e.message : "service_error"); }
    finally { setBusy(false); }
  };

  return <div className={styles.composer}>
    <div className={styles.steps}>
      <Step n={1} tone="sky" title="Choose the content" hint="A document saved in Notepad on this browser, or a file from your computer." done={!!draft.html}>
        <div className={styles.sourceTools}>
          <div className={styles.search}><Search size={14} aria-hidden="true" /><input type="search" aria-label="Search Notepad files" placeholder="Search your Notepad files…" value={query} onChange={e => setQuery(e.target.value)} /></div>
          <button type="button" className={styles.ghost} onClick={readFiles}><RefreshCw size={13} aria-hidden="true" />Reload</button>
          <button type="button" className={styles.ghost} onClick={() => fileInput.current?.click()}><FileUp size={13} aria-hidden="true" />Import file</button>
          <input ref={fileInput} type="file" accept=".html,.htm,.txt,.md,text/html,text/plain,text/markdown" hidden onChange={e => { const file = e.target.files?.[0]; if (file) void importFile(file); e.target.value = ""; }} />
        </div>
        {shown.length ? <ul className={styles.files} aria-label="Notepad files">{shown.map(file => {
          const text = documentText(file.html);
          return <li key={file.id}><button type="button" aria-pressed={draft.sourceFileId === file.id} onClick={() => pick(file)}>
            <span className={styles.fileIcon} style={{ background: file.background }} aria-hidden="true"><FileText size={16} /></span>
            <span className={styles.fileText}><strong>{file.title}</strong><small>{file.kind} · {when(file.updatedAt)} · {readingMinutes(file.html)} min read</small><span className={styles.excerpt}>{text.slice(0, 110)}</span></span>
            {draft.sourceFileId === file.id && <CheckCircle2 size={17} className={styles.picked} aria-hidden="true" />}
          </button></li>;
        })}</ul> : <p className={styles.empty}>{files.length ? "No file matches your search." : "No saved Notepad files in this browser yet. Write a document in Notepad (or import a file), then come back."}</p>}
        {draft.sourceName && <p className={styles.hint}><FileText size={13} aria-hidden="true" />Using <b>{draft.sourceName}</b>{draft.id ? ". Pick another file only to replace the content." : "."}</p>}
      </Step>

      <Step n={2} tone="lavender" title="Choose where it appears" hint="Pick a surface, a page, then click the section on the page picture." done={!!draft.html}>
        <div className={styles.surfaces} role="radiogroup" aria-label="Surface">{SURFACES.map(surface => {
          const Icon = SURFACE_ICONS[surface.value];
          return <button type="button" role="radio" key={surface.value} aria-checked={draft.surface === surface.value} onClick={() => setSurface(surface.value)} title={surface.help}><Icon size={18} aria-hidden="true" /><span>{surface.label}</span></button>;
        })}</div>
        <div className={styles.placementRow}>
          <Field label="Page" htmlFor={`${id}-page`} hint={SURFACES.find(s => s.value === draft.surface)?.help}><AdminPagePicker id={`${id}-page`} value={draft.page} onChange={page => setDraft({ ...draft, page, section: draft.surface === "dashboard" && page.startsWith("learn:") ? "main" : draft.section === "main" ? "top" : draft.section })} options={pageOptions} disabled={pageOptions.length < 2} hrefFor={page => placementHref(draft.surface, page)} /></Field>
          <div className={styles.wireframe} role="radiogroup" aria-label="Section of the page">
            {WIREFRAMES[draft.surface].map((part, index) => typeof part === "string"
              ? sections.some(s => s.value === part) && <button type="button" role="radio" key={part} aria-checked={draft.section === part} onClick={() => set("section")(part)}><MousePointerClick size={13} aria-hidden="true" />{SECTIONS[draft.surface].find(s => s.value === part)?.label}</button>
              : <span key={index} className={styles.fixed}>{part.fixed}</span>)}
          </div>
        </div>
      </Step>

      <Step n={3} tone="peach" title="Style it" hint="How it looks: layout, colour, a button and topic tags.">
        <div className={styles.layouts} role="radiogroup" aria-label="Layout">{LAYOUTS.map(layout => <button type="button" role="radio" key={layout.value} aria-checked={draft.layout === layout.value} onClick={() => set("layout")(layout.value)}>
          <span className={styles.layoutArt} data-layout={layout.value} aria-hidden="true"><i /><i /><i /></span><strong>{layout.label}</strong><small>{LAYOUT_HINTS[layout.value]}</small>
        </button>)}</div>
        <div className={styles.form}>
          <Field label="Title" htmlFor={`${id}-title`}><input id={`${id}-title`} value={draft.title} maxLength={160} onChange={e => set("title")(e.target.value)} placeholder="Shown as the heading" /></Field>
          <Field label="Short summary (optional)" htmlFor={`${id}-summary`}><input id={`${id}-summary`} value={draft.summary} maxLength={400} onChange={e => set("summary")(e.target.value)} placeholder="One line under the title" /></Field>
          <fieldset className={styles.tones}><legend>Colour</legend>{TONES.map(tone => <label key={tone.value} title={tone.label} style={{ background: tone.fill, borderColor: tone.edge }}>
            <input type="radio" name={`${id}-tone`} value={tone.value} checked={draft.tone === tone.value} onChange={() => set("tone")(tone.value)} /><span>{tone.label}</span></label>)}</fieldset>
          <Field label="Button text (optional)" htmlFor={`${id}-cta-label`}><input id={`${id}-cta-label`} value={draft.ctaLabel} maxLength={40} onChange={e => set("ctaLabel")(e.target.value)} placeholder="e.g. Start the lesson" /></Field>
          <Field label="Button link" htmlFor={`${id}-cta-url`} hint={invalidCta ? "Give both the text and a link starting with / or https://" : "A page here (/learning/techy) or an https:// link"}><input id={`${id}-cta-url`} value={draft.ctaUrl} maxLength={500} onChange={e => set("ctaUrl")(e.target.value)} placeholder="/learning/techy" aria-invalid={invalidCta} /></Field>
          <Field label="Topic tags (up to 10)" htmlFor={`${id}-tag`} wide>
            <div className={styles.tagBox}>{draft.tags.map(t => <span key={t}><Tag size={11} aria-hidden="true" />{t}<button type="button" aria-label={`Remove tag ${t}`} onClick={() => set("tags")(draft.tags.filter(x => x !== t))}><X size={11} /></button></span>)}
              <input id={`${id}-tag`} value={tag} maxLength={30} onChange={e => setTag(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} onBlur={addTag} placeholder={draft.tags.length ? "Add another…" : "Type and press Enter"} disabled={draft.tags.length >= 10} /></div>
          </Field>
          <label className={styles.check}><input type="checkbox" checked={draft.showTitle} onChange={e => set("showTitle")(e.target.checked)} />Show the title and summary</label>
          <label className={styles.check}><input type="checkbox" checked={draft.pinned} onChange={e => set("pinned")(e.target.checked)} /><Pin size={13} aria-hidden="true" />Pin to the top of its section</label>
        </div>
      </Step>

      <Step n={4} tone="mint" title="Who sees it, and when" hint="Target learners, devices and language, and schedule it if you like.">
        <div className={styles.form}>
          <Field label="Who can see it" wide><Segmented label="Audience" value={draft.audience} options={AUDIENCES} onChange={set("audience")} /></Field>
          <Field label="Devices"><Segmented label="Devices" value={draft.device} options={DEVICES} onChange={set("device")} /></Field>
          <Field label="Language"><Segmented label="Language" value={draft.language} options={LANGUAGES.map(l => ({ ...l, label: l.value === "all" ? "Both" : l.value === "en" ? "English" : "हिन्दी" }))} onChange={set("language")} /></Field>
          <Field label="Show from (optional)" htmlFor={`${id}-start`}><input id={`${id}-start`} type="datetime-local" value={draft.startsAt} onChange={e => set("startsAt")(e.target.value)} /></Field>
          <Field label="Hide after (optional)" htmlFor={`${id}-end`} hint={invalidSchedule ? "Must be after the start." : undefined}><input id={`${id}-end`} type="datetime-local" value={draft.endsAt} min={draft.startsAt || undefined} onChange={e => set("endsAt")(e.target.value)} aria-invalid={invalidSchedule} /></Field>
          <Field label="Order in the section" htmlFor={`${id}-position`} hint="Lower numbers show first; pinned items come before all others."><input id={`${id}-position`} type="number" min={-1000} max={1000} value={draft.position} onChange={e => set("position")(Math.max(-1000, Math.min(1000, Number(e.target.value) || 0)))} /></Field>
        </div>
      </Step>
    </div>

    <aside className={styles.previewPane} aria-label="Preview and publish">
      <div className={styles.previewHead}>
        <h3><Eye size={16} aria-hidden="true" />Live preview</h3>
        <Segmented label="Preview width" value={width} options={PREVIEW_WIDTHS.map(w => ({ value: w.value, label: w.label }))} onChange={setWidth} />
      </div>
      <p className={styles.crumb}>{surfaceLabel(draft.surface)} › {pageOptions.find(p => p.value === draft.page)?.label} › {SECTIONS[draft.surface].find(s => s.value === draft.section)?.label}</p>
      <div className={styles.previewFrame} data-width={width}><div style={{ width: PREVIEW_WIDTHS.find(w => w.value === width)?.width }}>
        {draft.html ? <LearningBlockView block={preview} /> : <p className={styles.empty}>Pick a document in step 1 to see it here.</p>}
      </div></div>
      <ul className={styles.summary}>
        <li><Users size={13} aria-hidden="true" />{AUDIENCES.find(a => a.value === draft.audience)?.label} · {DEVICES.find(d => d.value === draft.device)?.label}</li>
        <li><CalendarClock size={13} aria-hidden="true" />{draft.startsAt ? `From ${when(toIso(draft.startsAt)!)}` : "Immediately"}{draft.endsAt ? ` until ${when(toIso(draft.endsAt)!)}` : ""}</li>
        {draft.html && <li><FileText size={13} aria-hidden="true" />{readingMinutes(draft.html)} min read</li>}
      </ul>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={busy || !ready} onClick={() => void save("published")}>{scheduled ? <CalendarClock size={15} aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}{draft.id ? "Save and publish" : scheduled ? "Schedule" : "Publish now"}</button>
        <button type="button" className={styles.secondary} disabled={busy || !ready} onClick={() => void save("draft")}><Save size={15} aria-hidden="true" />Save draft</button>
        {(draft.id || draft.html) && <button type="button" className={styles.ghost} onClick={() => setDraft(BLANK)}><X size={14} aria-hidden="true" />{draft.id ? "Cancel edit" : "Start over"}</button>}
      </div>
      {!ready && <p className={styles.small}>{!draft.html ? "Choose the content first." : !draft.title.trim() ? "Give it a title." : invalidCta ? "Fix the button link." : "Fix the schedule."}</p>}
    </aside>
  </div>;
}

type Sort = "updated" | "views" | "title" | "placement";
function Library({ uploads, pages, now, loading, onEdit, onChanged, onError }: { uploads: LearningUpload[]; pages: LearningPage[]; now: number; loading: boolean; onEdit: (u: LearningUpload) => void; onChanged: (text: string) => void; onError: (code: string) => void }) {
  const id = useId();
  const [surface, setSurface] = useState("all");
  const [state, setState] = useState("all");
  const [sort, setSort] = useState<Sort>("updated");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<LearningUpload[] | null>(null);
  const [preview, setPreview] = useState<LearningUpload | null>(null);
  const [history, setHistory] = useState<LearningUpload | null>(null);
  const [busy, setBusy] = useState(false);
  const q = query.toLowerCase();
  const shown = uploads.filter(u => (surface === "all" || u.surface === surface) && (state === "all" || liveState(u, now).key === state)
    && (!q || u.title.toLowerCase().includes(q) || u.tags.some(t => t.includes(q)) || documentText(u.html).toLowerCase().includes(q)))
    .sort((a, b) => sort === "views" ? b.views - a.views : sort === "title" ? a.title.localeCompare(b.title) : sort === "placement" ? `${a.surface}${a.page}${a.section}`.localeCompare(`${b.surface}${b.page}${b.section}`) || a.position - b.position : b.updatedAt.localeCompare(a.updatedAt));
  const pageLabel = (u: LearningUpload) => surfacePages(u.surface, pages).find(p => p.value === u.page)?.label ?? u.page;
  const act = async (run: () => Promise<unknown>, text: string) => { setBusy(true); try { await run(); setSelected([]); onChanged(text); } catch (e) { onError(e instanceof Error ? e.message : "service_error"); } finally { setBusy(false); } };
  const patch = (u: LearningUpload, changes: Record<string, unknown>, text: string) => act(() => send("/api/super-admin/learning-uploads", "PATCH", { id: u.id, changes }), text);
  const bulk = (changes: Record<string, unknown>, text: string) => act(() => send("/api/super-admin/learning-uploads", "PATCH", { ids: selected, changes }), text);
  const duplicate = (u: LearningUpload) => act(() => send("/api/super-admin/learning-uploads", "POST", { ...bodyFrom(draftFrom(u), "draft"), title: `${u.title} (copy)`.slice(0, 160), position: u.position + 1 }), `Copied “${u.title}” as a draft.`);
  const allShown = shown.length > 0 && shown.every(u => selected.includes(u.id));
  const toggle = (uid: string) => setSelected(current => current.includes(uid) ? current.filter(x => x !== uid) : [...current, uid]);

  return <section className={styles.panel} data-tone="peach">
    <div className={styles.toolbar}>
      <div className={styles.search}><Search size={14} aria-hidden="true" /><input type="search" aria-label="Search uploads" placeholder="Search titles, tags or text…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <AdminSelect id={`${id}-surface`} label="Surface" value={surface} onValueChange={setSurface} options={[{ value: "all", label: "Every surface" }, ...SURFACES.map(({ value, label }) => ({ value, label }))]} />
      <AdminSelect id={`${id}-state`} label="Status" value={state} onValueChange={setState} options={[{ value: "all", label: "Any status" }, { value: "live", label: "Live" }, { value: "scheduled", label: "Scheduled" }, { value: "ended", label: "Ended" }, { value: "draft", label: "Draft" }, { value: "hidden", label: "Hidden" }]} />
      <AdminSelect id={`${id}-sort`} label="Sort" value={sort} onValueChange={value => setSort(value as Sort)} options={[{ value: "updated", label: "Recently updated" }, { value: "views", label: "Most viewed" }, { value: "title", label: "Title A–Z" }, { value: "placement", label: "By placement" }]} />
    </div>
    {shown.length > 0 && <div className={styles.bulk} data-active={selected.length > 0 || undefined}>
      <label className={styles.check}><input type="checkbox" checked={allShown} onChange={() => setSelected(allShown ? [] : shown.map(u => u.id))} />{selected.length ? `${selected.length} selected` : `Select all ${shown.length}`}</label>
      {selected.length > 0 && <div className={styles.bulkActions}>
        <button type="button" disabled={busy} onClick={() => void bulk({ status: "published" }, `Published ${selected.length} upload(s).`)}><Send size={13} aria-hidden="true" />Publish</button>
        <button type="button" disabled={busy} onClick={() => void bulk({ status: "hidden" }, `Hid ${selected.length} upload(s).`)}><EyeOff size={13} aria-hidden="true" />Hide</button>
        <button type="button" disabled={busy} onClick={() => void bulk({ status: "draft" }, `Moved ${selected.length} upload(s) to drafts.`)}><Pencil size={13} aria-hidden="true" />To drafts</button>
        <button type="button" disabled={busy} onClick={() => void bulk({ pinned: true }, `Pinned ${selected.length} upload(s).`)}><Pin size={13} aria-hidden="true" />Pin</button>
        <button type="button" disabled={busy} onClick={() => void bulk({ pinned: false }, `Unpinned ${selected.length} upload(s).`)}><PinOff size={13} aria-hidden="true" />Unpin</button>
        <button type="button" className={styles.danger} disabled={busy} onClick={() => setConfirm(uploads.filter(u => selected.includes(u.id)))}><Trash2 size={13} aria-hidden="true" />Delete</button>
      </div>}
    </div>}
    {loading && !uploads.length ? <p className={styles.empty}>Loading uploads…</p> : shown.length ? <ul className={styles.cards}>{shown.map(u => {
      const live = liveState(u, now); const tone = TONES.find(t => t.value === u.tone) ?? TONES[0];
      return <li key={u.id} className={styles.uploadCard} style={{ borderTopColor: tone.edge }} data-selected={selected.includes(u.id) || undefined}>
        <div className={styles.cardTop}>
          <label className={styles.select}><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} aria-label={`Select ${u.title}`} /></label>
          <span className={styles.status} data-status={live.key}>{live.label}</span>
          {u.pinned && <span className={styles.pin}><Pin size={11} aria-hidden="true" />Pinned</span>}
          <span className={styles.views} title="Views"><Eye size={12} aria-hidden="true" />{u.views.toLocaleString("en-IN")}</span>
        </div>
        <button type="button" className={styles.cardTitle} onClick={() => setPreview(u)}>{u.title}</button>
        <p className={styles.placement}>{surfaceLabel(u.surface)} › {pageLabel(u)} › {SECTIONS[u.surface].find(s => s.value === u.section)?.label ?? u.section}</p>
        <p className={styles.meta}>{LAYOUTS.find(l => l.value === u.layout)?.label} · {AUDIENCES.find(a => a.value === u.audience)?.label}{u.device !== "all" ? ` · ${DEVICES.find(d => d.value === u.device)?.label}` : ""}{u.language !== "all" ? ` · ${u.language === "en" ? "English" : "हिन्दी"}` : ""} · {readingMinutes(u.html)} min · v{u.version}</p>
        {(u.startsAt || u.endsAt) && <p className={styles.meta}><CalendarClock size={12} aria-hidden="true" />{u.startsAt ? `from ${when(u.startsAt)}` : ""}{u.endsAt ? ` until ${when(u.endsAt)}` : ""}</p>}
        {u.tags.length > 0 && <ul className={styles.cardTags}>{u.tags.map(t => <li key={t}>{t}</li>)}</ul>}
        {u.surface === "dashboard" && <p className={styles.meta} title={u.packError ?? undefined}><Sparkles size={12} aria-hidden="true" />Thumbnail & study pack: {PACK_LABELS[u.packStatus ?? "none"]}{u.packStatus === "failed" && u.packError ? ` (${u.packError})` : ""}</p>}
        <p className={styles.updated}>Updated {when(u.updatedAt)}</p>
        <div className={styles.rowActions}>
          <button type="button" onClick={() => onEdit(u)} aria-label={`Edit ${u.title}`} title="Edit"><Pencil size={14} /></button>
          <button type="button" onClick={() => setPreview(u)} aria-label={`Preview ${u.title}`} title="Preview"><Eye size={14} /></button>
          <ListenButton id={`upload:${u.id}`} title={u.title} text={() => `${u.title}. ${u.summary ?? ""} ${u.html}`} compact />
          <button type="button" onClick={() => setHistory(u)} aria-label={`Version history of ${u.title}`} title="Version history"><History size={14} /></button>
          <button type="button" disabled={busy} onClick={() => void patch(u, { position: u.position - 1 }, `Moved “${u.title}” up.`)} aria-label={`Move ${u.title} up`} title="Move up"><ArrowUp size={14} /></button>
          <button type="button" disabled={busy} onClick={() => void patch(u, { position: u.position + 1 }, `Moved “${u.title}” down.`)} aria-label={`Move ${u.title} down`} title="Move down"><ArrowDown size={14} /></button>
          {u.status === "published" ? <button type="button" disabled={busy} onClick={() => void patch(u, { status: "hidden" }, `Hid “${u.title}”.`)} aria-label={`Hide ${u.title}`} title="Hide"><EyeOff size={14} /></button>
            : <button type="button" disabled={busy} onClick={() => void patch(u, { status: "published" }, `Published “${u.title}”.`)} aria-label={`Publish ${u.title}`} title="Publish"><Send size={14} /></button>}
          <button type="button" disabled={busy} onClick={() => void patch(u, { pinned: !u.pinned }, `${u.pinned ? "Unpinned" : "Pinned"} “${u.title}”.`)} aria-label={`${u.pinned ? "Unpin" : "Pin"} ${u.title}`} title={u.pinned ? "Unpin" : "Pin"}>{u.pinned ? <PinOff size={14} /> : <Pin size={14} />}</button>
          <button type="button" disabled={busy} onClick={() => void duplicate(u)} aria-label={`Duplicate ${u.title}`} title="Duplicate as draft"><Copy size={14} /></button>
          {u.surface === "dashboard" && <button type="button" disabled={busy || u.packStatus === "generating"} onClick={() => void act(() => send("/api/super-admin/learning-uploads", "POST", { studyPack: u.id }), `Made the thumbnail and study pack for “${u.title}”.`)} aria-label={`${u.packStatus === "ready" ? "Regenerate" : "Generate"} the thumbnail and study pack of ${u.title}`} title={`${u.packStatus === "ready" ? "Regenerate" : "Generate"} thumbnail & study pack (Vercel AI Gateway, about a minute)`}><Sparkles size={14} /></button>}
          <a href={placementHref(u.surface, u.page)} target="_blank" rel="noreferrer" aria-label={`Open the page showing ${u.title}`} title="Open the page"><ExternalLink size={14} /></a>
          <button type="button" className={styles.danger} disabled={busy} onClick={() => setConfirm([u])} aria-label={`Delete ${u.title}`} title="Delete"><Trash2 size={14} /></button>
        </div>
      </li>;
    })}</ul> : <div className={styles.emptyState}><UploadCloud size={28} aria-hidden="true" /><p>{uploads.length ? "Nothing matches these filters." : "Nothing uploaded yet. Compose your first upload from a Notepad document."}</p></div>}

    <Dialog open={!!confirm} onOpenChange={open => { if (!open) setConfirm(null); }}><DialogContent className={modal.modal}><DialogHeader><DialogTitle className={modal.title}>Delete {confirm?.length === 1 ? `“${confirm[0].title}”` : `${confirm?.length} uploads`}?</DialogTitle><DialogDescription className={modal.lede}>{confirm?.length === 1 ? "It disappears" : "They disappear"} from the site at once, with every earlier version. Your Notepad files are not touched. This cannot be undone.</DialogDescription></DialogHeader>
      <div className={styles.actions}><button type="button" className={styles.dangerButton} disabled={busy} onClick={() => { const ids = confirm!.map(u => u.id); setConfirm(null); void act(() => send("/api/super-admin/learning-uploads", "DELETE", { ids }), `Deleted ${ids.length} upload(s).`); }}><Trash2 size={14} aria-hidden="true" />Delete</button><button type="button" className={styles.secondary} onClick={() => setConfirm(null)}>Keep</button></div>
    </DialogContent></Dialog>
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}><DialogContent className={`${modal.modal} ${styles.previewModal}`}><DialogHeader><DialogTitle className={modal.title}>{preview?.title}</DialogTitle><DialogDescription className={modal.lede}>{preview ? `${surfaceLabel(preview.surface)} › ${pageLabel(preview)} · ${preview.views} views` : ""}</DialogDescription></DialogHeader>
      {preview && <LearningBlockView block={{ ...preview, clean: sanitizeNotepadHtml(preview.html), device: "all" }} />}
    </DialogContent></Dialog>
    {history && <HistoryDialog upload={history} onClose={() => setHistory(null)} onRestored={text => { setHistory(null); onChanged(text); }} onError={onError} />}
  </section>;
}

function HistoryDialog({ upload, onClose, onRestored, onError }: { upload: LearningUpload; onClose: () => void; onRestored: (text: string) => void; onError: (code: string) => void }) {
  const [revisions, setRevisions] = useState<LearningRevision[] | null>(null);
  const [open, setOpen] = useState<LearningRevision | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    send<{ revisions: LearningRevision[] }>(`/api/super-admin/learning-uploads?revisions=${upload.id}`, "GET").then(body => { if (live) setRevisions(body.revisions); }, e => { if (live) { setRevisions([]); onError(e instanceof Error ? e.message : "service_error"); } });
    return () => { live = false; };
  }, [upload.id, onError]);
  const restore = async (revision: LearningRevision) => {
    setBusy(true);
    try { await send("/api/super-admin/learning-uploads", "POST", { restore: revision.id }); onRestored(`Restored version ${revision.version} of “${upload.title}”. The replaced content is kept as a version too.`); }
    catch (e) { onError(e instanceof Error ? e.message : "service_error"); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={value => { if (!value) onClose(); }}><DialogContent className={`${modal.modal} ${styles.previewModal}`}>
    <DialogHeader><DialogTitle className={modal.title}>Version history</DialogTitle><DialogDescription className={modal.lede}>“{upload.title}” is on version {upload.version}. Each edit that changed the content kept the earlier one here.</DialogDescription></DialogHeader>
    {!revisions ? <p className={styles.empty}>Loading versions…</p> : revisions.length ? <ul className={styles.revisions}>{revisions.map(r => <li key={r.id}>
      <div><strong>Version {r.version}</strong><small>{r.title} · saved {when(r.createdAt)} · {readingMinutes(r.html)} min</small></div>
      <div className={styles.rowActions}>
        <button type="button" onClick={() => setOpen(open?.id === r.id ? null : r)} aria-label={`Preview version ${r.version}`} title="Preview"><Eye size={14} /></button>
        <button type="button" disabled={busy} onClick={() => void restore(r)} aria-label={`Restore version ${r.version}`} title="Restore"><RotateCcw size={14} /></button>
      </div>
      {open?.id === r.id && <div className={styles.revisionPreview}><LearningBlockView block={{ ...upload, title: r.title, summary: r.summary, background: r.background, clean: sanitizeNotepadHtml(r.html), device: "all" }} /></div>}
    </li>)}</ul> : <p className={styles.empty}>No earlier versions yet. They appear after you edit the content.</p>}
  </DialogContent></Dialog>;
}

function Placements({ uploads, pages, now, onEdit, onCompose }: { uploads: LearningUpload[]; pages: LearningPage[]; now: number; onEdit: (u: LearningUpload) => void; onCompose: (surface: LearningSurface, page: string, section: string) => void }) {
  return <div className={styles.map}>{SURFACES.map(surface => {
    const Icon = SURFACE_ICONS[surface.value];
    const onSurface = uploads.filter(u => u.surface === surface.value);
    const pageList = surfacePages(surface.value, pages).filter(p => surface.value !== "dashboard" || p.value === "dashboard" || onSurface.some(u => u.page === p.value));
    return <section key={surface.value} className={styles.mapSurface}>
      <header><Icon size={17} aria-hidden="true" /><h3>{surface.label}</h3><span>{onSurface.length} upload{onSurface.length === 1 ? "" : "s"}</span></header>
      {pageList.map(page => <div key={page.value} className={styles.mapPage}>
        <h4>{page.label}</h4>
        {SECTIONS[surface.value].filter(s => surface.value !== "dashboard" || page.value.startsWith("learn:") || s.value !== "main").map(section => {
          const here = onSurface.filter(u => u.page === page.value && u.section === section.value).sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.position - b.position);
          return <div key={section.value} className={styles.mapSection}>
            <span className={styles.mapSectionName}>{section.label}</span>
            {here.map(u => { const live = liveState(u, now); return <button type="button" key={u.id} className={styles.mapItem} data-status={live.key} onClick={() => onEdit(u)} title={`${live.label} · edit`}>{u.pinned && <Pin size={11} aria-hidden="true" />}{u.title}</button>; })}
            <button type="button" className={styles.mapAdd} onClick={() => onCompose(surface.value, page.value, section.value)} aria-label={`Add to ${surface.label}, ${page.label}, ${section.label}`}><Plus size={12} aria-hidden="true" />Add</button>
          </div>;
        })}
      </div>)}
    </section>;
  })}</div>;
}

function PagesPanel({ pages, uploads, onChanged, onError, onAddContent }: { pages: LearningPage[]; uploads: LearningUpload[]; onChanged: (text: string) => void; onError: (code: string) => void; onAddContent: (page: LearningPage) => void }) {
  const id = useId();
  const empty = { id: "", title: "", slug: "", description: "", icon: "BookOpen", position: 0, visible: true };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<LearningPage | null>(null);
  const act = async (run: () => Promise<unknown>, text: string) => { setBusy(true); try { await run(); onChanged(text); setForm(empty); } catch (e) { onError(e instanceof Error ? e.message : "service_error"); } finally { setBusy(false); } };
  const save = () => {
    const body = { title: form.title.trim(), slug: form.slug.trim() || undefined, description: form.description.trim() || null, icon: form.icon, position: form.position, visible: form.visible };
    return form.id ? act(() => send("/api/super-admin/learning-pages", "PATCH", { id: form.id, changes: body }), `Saved the page “${body.title}”.`)
      : act(() => send("/api/super-admin/learning-pages", "POST", body), `Added “${body.title}” to the Learning Dashboard sidebar.`);
  };
  return <div className={styles.pagesLayout}>
    <section className={styles.panel} data-tone="butter">
      <header className={styles.panelHead}><FilePlus2 size={16} aria-hidden="true" /><h3>{form.id ? "Edit page" : "New Learning Dashboard page"}</h3></header>
      <div className={styles.form}>
        <Field label="Page title" htmlFor={`${id}-title`}><input id={`${id}-title`} value={form.title} maxLength={80} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Weekly deep dives" /></Field>
        <Field label="Address" htmlFor={`${id}-slug`} hint={`/learning/learn/${slugify(form.slug || form.title) || "…"}`}><input id={`${id}-slug`} value={form.slug} maxLength={60} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Made from the title if left empty" /></Field>
        <Field label="Description (optional)" htmlFor={`${id}-desc`} wide><input id={`${id}-desc`} value={form.description} maxLength={300} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Shown under the page heading" /></Field>
        <Field label="Sidebar icon" htmlFor={`${id}-icon`}><AdminSelect id={`${id}-icon`} label="Icon" value={form.icon} onValueChange={icon => setForm({ ...form, icon })} options={PAGE_ICONS.map(icon => ({ value: icon, label: icon.replace(/([a-z])([A-Z0-9])/g, "$1 $2") }))} /></Field>
        <Field label="Order in the sidebar" htmlFor={`${id}-position`}><input id={`${id}-position`} type="number" min={-1000} max={1000} value={form.position} onChange={e => setForm({ ...form, position: Number(e.target.value) || 0 })} /></Field>
        <label className={styles.check}><input type="checkbox" checked={form.visible} onChange={e => setForm({ ...form, visible: e.target.checked })} />Show in the Learning Dashboard sidebar</label>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={busy || !form.title.trim()} onClick={() => void save()}><Plus size={14} aria-hidden="true" />{form.id ? "Save page" : "Add page"}</button>
        {form.id && <button type="button" className={styles.ghost} onClick={() => setForm(empty)}><X size={14} aria-hidden="true" />Cancel edit</button>}
      </div>
    </section>
    <section className={styles.panel} data-tone="sky">
      <header className={styles.panelHead}><BookOpen size={16} aria-hidden="true" /><h3>Your pages</h3><span>Shown under “Your pages” in the Learning Dashboard sidebar</span></header>
      {pages.length ? <ul className={styles.pageList}>{pages.map(page => { const count = uploads.filter(u => u.surface === "dashboard" && u.page === `learn:${page.slug}`).length; return <li key={page.id} data-hidden={!page.visible || undefined}>
        <div><strong>{page.title}</strong><small>/learning/learn/{page.slug} · {count} upload{count === 1 ? "" : "s"} · order {page.position}</small><span className={styles.status} data-status={page.visible ? "live" : "hidden"}>{page.visible ? "In sidebar" : "Hidden"}</span></div>
        <div className={styles.rowActions}>
          <button type="button" onClick={() => onAddContent(page)} aria-label={`Add content to ${page.title}`} title="Add content"><Upload size={14} /></button>
          <button type="button" onClick={() => setForm({ id: page.id, title: page.title, slug: page.slug, description: page.description ?? "", icon: page.icon, position: page.position, visible: page.visible })} aria-label={`Edit ${page.title}`} title="Edit"><Pencil size={14} /></button>
          <button type="button" disabled={busy} onClick={() => void act(() => send("/api/super-admin/learning-pages", "PATCH", { id: page.id, changes: { visible: !page.visible } }), `${page.visible ? "Hid" : "Showed"} “${page.title}”.`)} aria-label={`${page.visible ? "Hide" : "Show"} ${page.title}`} title={page.visible ? "Hide from sidebar" : "Show in sidebar"}>{page.visible ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          <a href={`/learning/learn/${page.slug}`} target="_blank" rel="noreferrer" aria-label={`Open ${page.title}`} title="Open the page"><ExternalLink size={14} /></a>
          <button type="button" className={styles.danger} disabled={busy} onClick={() => setConfirm(page)} aria-label={`Delete ${page.title}`} title="Delete"><Trash2 size={14} /></button>
        </div>
      </li>; })}</ul> : <div className={styles.emptyState}><BookOpen size={28} aria-hidden="true" /><p>No custom pages yet. Add one to give your uploads their own place in the Learning Dashboard.</p></div>}
    </section>
    <Dialog open={!!confirm} onOpenChange={open => { if (!open) setConfirm(null); }}><DialogContent className={modal.modal}><DialogHeader><DialogTitle className={modal.title}>Delete the page “{confirm?.title}”?</DialogTitle><DialogDescription className={modal.lede}>It leaves the sidebar, and the uploads placed on it are deleted too. Your Notepad files are not touched. This cannot be undone.</DialogDescription></DialogHeader>
      <div className={styles.actions}><button type="button" className={styles.dangerButton} disabled={busy} onClick={() => { const target = confirm!; setConfirm(null); void act(() => send("/api/super-admin/learning-pages", "DELETE", { id: target.id }), `Deleted the page “${target.title}”.`); }}><Trash2 size={14} aria-hidden="true" />Delete page</button><button type="button" className={styles.secondary} onClick={() => setConfirm(null)}>Keep it</button></div>
    </DialogContent></Dialog>
  </div>;
}
