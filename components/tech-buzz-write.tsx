"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Code2, Eye, ImagePlus, Lightbulb, List, ListOrdered, Loader2, PenLine, Plus, Quote, Send, Trash2, X } from "lucide-react";
import { CodeFiles } from "./code-files";
import { INK_LIMITS, inkWords, WRITE_TECHNOLOGIES, type InkListItem, type InkSection, type InkStatus, type InkStory } from "@/lib/tech-buzz-ink";
import styles from "./tech-buzz-write.module.css";

/*
 * Write: a member's editor for their own Tech Buzz story (lib/tech-buzz-ink.ts). A story is a title, a subtitle, a
 * cover and sections; each section has a heading and paragraphs, plus optional steps, bullet points, code files,
 * a callout, a quote and a picture, the same parts the /tech-buzz story page renders. Drafts autosave to Supabase a
 * few seconds after typing stops; Publish puts the story live on /tech-buzz at once.
 */

type CodeFile = { filename: string; language: string; code: string };
type Draft = {
  key: string; heading: string; body: string; steps?: string; bullets?: string; files?: CodeFile[];
  callout?: { type: "tip" | "insight" | "warning"; text: string }; quote?: { text: string; attribution: string }; image?: { src: string; alt: string };
};
type Meta = { title: string; subtitle: string; technology: string; tags: string; coverImage: string; takeaways: string; founderTakeaway: string };
export type WriteInitial = (InkStory & { id: string; slug: string; status: InkStatus }) | null;

const LANGUAGES = ["typescript", "javascript", "tsx", "python", "java", "cpp", "go", "rust", "bash", "json", "yaml", "sql", "html", "css", "text"];
const EXTENSION: Record<string, string> = { typescript: "ts", javascript: "js", tsx: "tsx", python: "py", java: "java", cpp: "cpp", go: "go", rust: "rs", bash: "sh", json: "json", yaml: "yaml", sql: "sql", html: "html", css: "css", text: "txt" };
const ERRORS: Record<string, string> = {
  title_required: "Give your story a title first.",
  subtitle_required: "Add a subtitle of at least 10 characters before publishing.",
  section_required: "Add at least one section with a heading and a paragraph before publishing.",
  too_short: `Stories need at least ${INK_LIMITS.minPublishWords} words before they can be published.`,
  image_not_allowed: "Pictures must be uploaded through Write.",
  unsupported_image: "That file is not a picture Write can use. Try PNG, JPEG, WebP, GIF or AVIF.",
  request_too_large: "That is too large. Pictures can be up to 6 MB.",
  rate_limited: "You are saving very quickly. Wait a moment and try again.",
  signin_required: "Your session ended. Sign in again to keep writing.",
  subscription_required: "Writing on Tech Buzz is for members.",
  not_found: "This story no longer exists.",
};
const message = (code: string) => ERRORS[code] ?? "Something went wrong while saving. Your text is still here; try again.";

let counter = 0;
const nextKey = () => `s${++counter}-${Date.now().toString(36)}`;
const blankSection = (): Draft => ({ key: nextKey(), heading: "", body: "" });

function toDrafts(sections: InkSection[]): Draft[] {
  if (!sections.length) return [blankSection()];
  return sections.map(section => ({
    key: nextKey(), heading: section.heading, body: section.paragraphs.join("\n\n"),
    ...(section.steps ? { steps: section.steps.join("\n") } : {}),
    ...(section.bulletPoints ? { bullets: section.bulletPoints.join("\n") } : {}),
    ...(section.codeSnippet ? { files: section.codeSnippet.files ?? [{ filename: section.codeSnippet.filename ?? "example.txt", language: section.codeSnippet.language, code: section.codeSnippet.code }] } : {}),
    ...(section.callout ? { callout: section.callout } : {}),
    ...(section.quote ? { quote: section.quote } : {}),
    ...(section.image ? { image: section.image } : {}),
  }));
}

const splitLines = (value?: string) => (value ?? "").split("\n").map(line => line.trim()).filter(Boolean);

function toSections(drafts: Draft[]): InkSection[] {
  return drafts.map(draft => ({
    heading: draft.heading.trim(),
    paragraphs: draft.body.split(/\n\s*\n/).map(paragraph => paragraph.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean),
    ...(draft.steps !== undefined ? { steps: splitLines(draft.steps) } : {}),
    ...(draft.bullets !== undefined ? { bulletPoints: splitLines(draft.bullets) } : {}),
    ...(draft.files?.length ? { codeSnippet: { language: draft.files[0].language, filename: draft.files[0].filename, code: draft.files[0].code, files: draft.files } } : {}),
    ...(draft.callout ? { callout: draft.callout } : {}),
    ...(draft.quote ? { quote: draft.quote } : {}),
    ...(draft.image?.src ? { image: draft.image } : {}),
  }));
}

const TIME = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

async function readError(response: Response) {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error ?? "service_error";
}

/** Uploads one picture to Supabase Storage through /api/tech-buzz/write/image and returns its public URL. */
async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/tech-buzz/write/image", { method: "POST", body: form });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json() as { url: string }).url;
}

export function TechBuzzWrite({ initial, stories: initialStories, authorName }: { initial: WriteInitial; stories: InkListItem[]; authorName: string }) {
  const router = useRouter();
  const [id, setId] = useState(initial?.id);
  const [status, setStatus] = useState<InkStatus>(initial?.status ?? "draft");
  const [meta, setMeta] = useState<Meta>({
    title: initial?.title ?? "", subtitle: initial?.subtitle ?? "", technology: initial?.technology ?? "agentic-ai", tags: initial?.tags.join(", ") ?? "",
    coverImage: initial?.coverImage ?? "", takeaways: initial?.summaryBullets.join("\n") ?? "", founderTakeaway: initial?.founderTakeaway ?? "",
  });
  const [sections, setSections] = useState<Draft[]>(() => toDrafts(initial?.sections ?? []));
  const [stories, setStories] = useState(initialStories);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const inFlight = useRef(false);

  const story = useCallback((): InkStory => ({
    ...(id ? { id } : {}),
    title: meta.title.trim(), subtitle: meta.subtitle.trim(), technology: meta.technology,
    tags: meta.tags.split(",").map(tag => tag.trim()).filter(Boolean).slice(0, INK_LIMITS.tags),
    coverImage: meta.coverImage, summaryBullets: splitLines(meta.takeaways).slice(0, 5), founderTakeaway: meta.founderTakeaway.trim(),
    sections: toSections(sections),
  }), [id, meta, sections]);

  const refreshList = useCallback(async () => {
    const response = await fetch("/api/tech-buzz/write", { cache: "no-store" }).catch(() => null);
    if (response?.ok) setStories((await response.json() as { stories: InkListItem[] }).stories);
  }, []);

  const save = useCallback(async (publish: boolean) => {
    if (inFlight.current) return;
    const body = story();
    if (!body.title) { if (publish) setError(message("title_required")); return; }
    inFlight.current = true;
    setSaving(publish ? "publish" : "draft");
    setError("");
    try {
      const response = await fetch("/api/tech-buzz/write", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ story: body, publish }) });
      if (!response.ok) { setError(message(await readError(response))); return; }
      const saved = await response.json() as { id: string; slug: string; status: InkStatus };
      setId(saved.id);
      setStatus(saved.status);
      setDirty(false);
      setSavedAt(Date.now());
      if (!id) window.history.replaceState(null, "", `/tech-buzz/write?id=${saved.id}`);
      if (publish) { router.push(`/tech-buzz/${saved.slug}`); return; }
      void refreshList();
    } catch {
      setError(message("service_error"));
    } finally {
      inFlight.current = false;
      setSaving(null);
    }
  }, [id, refreshList, router, story]);

  // Drafts save themselves a few seconds after typing stops; a published story changes only when its writer says so.
  useEffect(() => {
    if (!dirty || status === "published" || !meta.title.trim()) return;
    const timer = setTimeout(() => void save(false), 4000);
    return () => clearTimeout(timer);
  }, [dirty, status, meta.title, save]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const editMeta = (patch: Partial<Meta>) => { setMeta(current => ({ ...current, ...patch })); setDirty(true); };
  const editSection = (key: string, patch: Partial<Draft>) => { setSections(current => current.map(section => section.key === key ? { ...section, ...patch } : section)); setDirty(true); };
  const dropPart = (key: string, part: "steps" | "bullets" | "files" | "callout" | "quote" | "image") => {
    setSections(current => current.map(section => { if (section.key !== key) return section; const next = { ...section }; delete next[part]; return next; }));
    setDirty(true);
  };
  const moveSection = (index: number, by: number) => {
    setSections(current => { const next = [...current]; const [item] = next.splice(index, 1); next.splice(Math.max(0, Math.min(next.length, index + by)), 0, item); return next; });
    setDirty(true);
  };
  const removeSection = (key: string) => { setSections(current => current.length > 1 ? current.filter(section => section.key !== key) : [blankSection()]); setDirty(true); };

  async function pickImage(event: ChangeEvent<HTMLInputElement>, target: string, apply: (url: string) => void) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(target);
    setError("");
    try { apply(await uploadImage(file)); setDirty(true); }
    catch (failure) { setError(message(failure instanceof Error ? failure.message : "")); }
    finally { setUploading(null); }
  }

  async function remove(item: InkListItem) {
    if (!window.confirm(`Delete "${item.title}"? ${item.status === "published" ? "It will be removed from Tech Buzz. " : ""}This cannot be undone.`)) return;
    const response = await fetch(`/api/tech-buzz/write/${item.id}`, { method: "DELETE" });
    if (!response.ok) { setError(message(await readError(response))); return; }
    if (item.id === id) { router.replace("/tech-buzz/write"); router.refresh(); return; }
    setStories(current => current.filter(entry => entry.id !== item.id));
  }

  const current = story();
  const words = inkWords(current);
  const tech = WRITE_TECHNOLOGIES.find(item => item.id === meta.technology) ?? WRITE_TECHNOLOGIES[0];
  const stateLine = saving === "draft" ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? `Saved ${TIME.format(savedAt)}` : id ? "Saved" : "New story";

  return <div className={styles.page}>
    <header className={styles.bar}>
      <Link href="/tech-buzz" className={styles.back}><ArrowLeft size={16} aria-hidden="true" />Tech Buzz</Link>
      <span className={styles.brand}><PenLine size={16} aria-hidden="true" />Write</span>
      <span className={styles.state} aria-live="polite">{status === "published" ? "Published · " : "Draft · "}{stateLine}</span>
      <span className={styles.actions}>
        <button type="button" className={styles.ghost} aria-pressed={preview} onClick={() => setPreview(value => !value)}><Eye size={15} aria-hidden="true" />{preview ? "Edit" : "Preview"}</button>
        {status !== "published" && <button type="button" className={styles.ghost} disabled={!!saving || !meta.title.trim()} onClick={() => void save(false)}>Save draft</button>}
        <button type="button" className={styles.publish} disabled={!!saving} onClick={() => void save(true)}>
          {saving === "publish" ? <Loader2 size={15} className={styles.spin} aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}{status === "published" ? "Update story" : "Publish"}
        </button>
      </span>
    </header>
    {error && <p className={styles.error} role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></p>}

    <div className={styles.layout}>
      <main className={styles.canvas}>
        {preview ? <StoryPreview story={current} authorName={authorName} technology={tech.label} words={words} /> : <>
          <div className={styles.cover}>
            {meta.coverImage
              ? <span className={styles.coverImage}><Image src={meta.coverImage} alt="" fill sizes="(max-width: 800px) 100vw, 720px" /><button type="button" onClick={() => editMeta({ coverImage: "" })} aria-label="Remove cover"><X size={15} /></button></span>
              : <label className={styles.coverPick}>
                  {uploading === "cover" ? <Loader2 size={18} className={styles.spin} aria-hidden="true" /> : <ImagePlus size={18} aria-hidden="true" />}
                  {uploading === "cover" ? "Uploading…" : "Add a cover picture"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={event => void pickImage(event, "cover", url => editMeta({ coverImage: url }))} />
                </label>}
          </div>
          <AutoText className={styles.title} value={meta.title} onChange={title => editMeta({ title })} placeholder="Title" maxLength={INK_LIMITS.title} label="Title" />
          <AutoText className={styles.subtitle} value={meta.subtitle} onChange={subtitle => editMeta({ subtitle })} placeholder="Tell readers what they will be able to do…" maxLength={INK_LIMITS.subtitle} label="Subtitle" />

          {sections.map((section, index) => <section key={section.key} className={styles.section} aria-label={`Section ${index + 1}`}>
            <div className={styles.sectionTools}>
              <span>Section {index + 1}</span>
              <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="Move section up"><ArrowUp size={14} /></button>
              <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} aria-label="Move section down"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => removeSection(section.key)} aria-label="Delete section"><Trash2 size={14} /></button>
            </div>
            <AutoText className={styles.heading} value={section.heading} onChange={heading => editSection(section.key, { heading })} placeholder="Section heading" maxLength={200} label={`Section ${index + 1} heading`} />
            <AutoText className={styles.body} value={section.body} onChange={body => editSection(section.key, { body })} placeholder="Write your story… Leave an empty line between paragraphs." label={`Section ${index + 1} text`} />

            {section.steps !== undefined && <Part title="Numbered steps" icon={<ListOrdered size={14} />} onRemove={() => dropPart(section.key, "steps")}>
              <AutoText className={styles.list} value={section.steps} onChange={steps => editSection(section.key, { steps })} placeholder={"One step per line\nInstall the package\nCreate the agent"} label="Steps, one per line" />
            </Part>}
            {section.bullets !== undefined && <Part title="Bullet points" icon={<List size={14} />} onRemove={() => dropPart(section.key, "bullets")}>
              <AutoText className={styles.list} value={section.bullets} onChange={bullets => editSection(section.key, { bullets })} placeholder="One point per line" label="Bullet points, one per line" />
            </Part>}
            {section.files && <Part title="Code" icon={<Code2 size={14} />} onRemove={() => dropPart(section.key, "files")}>
              {section.files.map((file, fileIndex) => <div key={fileIndex} className={styles.codeFile}>
                <div className={styles.codeHead}>
                  <input value={file.filename} onChange={event => editSection(section.key, { files: section.files!.map((entry, i) => i === fileIndex ? { ...entry, filename: event.target.value } : entry) })} placeholder="src/app/page.tsx" aria-label="File name" maxLength={120} />
                  <select value={file.language} onChange={event => editSection(section.key, { files: section.files!.map((entry, i) => i === fileIndex ? { ...entry, language: event.target.value } : entry) })} aria-label="Language">
                    {LANGUAGES.map(language => <option key={language} value={language}>{language}</option>)}
                  </select>
                  {section.files!.length > 1 && <button type="button" onClick={() => editSection(section.key, { files: section.files!.filter((_, i) => i !== fileIndex) })} aria-label="Remove file"><X size={14} /></button>}
                </div>
                <textarea className={styles.code} value={file.code} spellCheck={false} rows={Math.min(24, Math.max(6, file.code.split("\n").length + 1))} maxLength={INK_LIMITS.code}
                  onChange={event => editSection(section.key, { files: section.files!.map((entry, i) => i === fileIndex ? { ...entry, code: event.target.value } : entry) })}
                  onKeyDown={event => {
                    if (event.key !== "Tab") return;
                    event.preventDefault();
                    const area = event.currentTarget, start = area.selectionStart;
                    const code = `${file.code.slice(0, start)}  ${file.code.slice(area.selectionEnd)}`;
                    editSection(section.key, { files: section.files!.map((entry, i) => i === fileIndex ? { ...entry, code } : entry) });
                    requestAnimationFrame(() => { area.selectionStart = area.selectionEnd = start + 2; });
                  }} aria-label={`Code of ${file.filename || "file"}`} />
              </div>)}
              {section.files.length < INK_LIMITS.codeFiles && <button type="button" className={styles.addFile} onClick={() => editSection(section.key, { files: [...section.files!, { filename: `file${section.files!.length + 1}.ts`, language: "typescript", code: "" }] })}><Plus size={13} aria-hidden="true" />Add a file tab</button>}
            </Part>}
            {section.callout && <Part title="Callout" icon={<Lightbulb size={14} />} onRemove={() => dropPart(section.key, "callout")}>
              <div className={styles.calloutKinds} role="radiogroup" aria-label="Callout type">
                {(["tip", "insight", "warning"] as const).map(type => <button key={type} type="button" role="radio" aria-checked={section.callout!.type === type} onClick={() => editSection(section.key, { callout: { ...section.callout!, type } })}>{type}</button>)}
              </div>
              <AutoText className={styles.list} value={section.callout.text} onChange={value => editSection(section.key, { callout: { ...section.callout!, text: value } })} placeholder="A tip, an insight or a warning worth highlighting" maxLength={1200} label="Callout text" />
            </Part>}
            {section.quote && <Part title="Quote" icon={<Quote size={14} />} onRemove={() => dropPart(section.key, "quote")}>
              <AutoText className={styles.list} value={section.quote.text} onChange={value => editSection(section.key, { quote: { ...section.quote!, text: value } })} placeholder="The quote" maxLength={800} label="Quote" />
              <input className={styles.inline} value={section.quote.attribution} onChange={event => editSection(section.key, { quote: { ...section.quote!, attribution: event.target.value } })} placeholder="Who said it" maxLength={120} aria-label="Quote attribution" />
            </Part>}
            {section.image && <Part title="Picture" icon={<ImagePlus size={14} />} onRemove={() => dropPart(section.key, "image")}>
              {section.image.src
                ? <span className={styles.sectionImage}><Image src={section.image.src} alt={section.image.alt} width={720} height={405} /></span>
                : <label className={styles.coverPick}>
                    {uploading === section.key ? <Loader2 size={18} className={styles.spin} aria-hidden="true" /> : <ImagePlus size={18} aria-hidden="true" />}{uploading === section.key ? "Uploading…" : "Upload a picture"}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={event => void pickImage(event, section.key, url => editSection(section.key, { image: { ...section.image!, src: url } }))} />
                  </label>}
              <input className={styles.inline} value={section.image.alt} onChange={event => editSection(section.key, { image: { ...section.image!, alt: event.target.value } })} placeholder="Describe the picture for screen readers" maxLength={200} aria-label="Picture description" />
            </Part>}

            <div className={styles.addParts} aria-label="Add to this section">
              {section.steps === undefined && <button type="button" onClick={() => editSection(section.key, { steps: "" })}><ListOrdered size={14} aria-hidden="true" />Steps</button>}
              {section.bullets === undefined && <button type="button" onClick={() => editSection(section.key, { bullets: "" })}><List size={14} aria-hidden="true" />Bullets</button>}
              {!section.files && <button type="button" onClick={() => editSection(section.key, { files: [{ filename: "index.ts", language: "typescript", code: "" }] })}><Code2 size={14} aria-hidden="true" />Code</button>}
              {!section.callout && <button type="button" onClick={() => editSection(section.key, { callout: { type: "tip", text: "" } })}><Lightbulb size={14} aria-hidden="true" />Callout</button>}
              {!section.quote && <button type="button" onClick={() => editSection(section.key, { quote: { text: "", attribution: "" } })}><Quote size={14} aria-hidden="true" />Quote</button>}
              {!section.image && <button type="button" onClick={() => editSection(section.key, { image: { src: "", alt: "" } })}><ImagePlus size={14} aria-hidden="true" />Picture</button>}
            </div>
          </section>)}
          {sections.length < INK_LIMITS.sections && <button type="button" className={styles.addSection} onClick={() => { setSections(current => [...current, blankSection()]); setDirty(true); }}><Plus size={16} aria-hidden="true" />Add a section</button>}
        </>}
      </main>

      <aside className={styles.side}>
        <section className={styles.panel} aria-labelledby="write-settings">
          <h2 id="write-settings">Story settings</h2>
          <label>Technology
            <select value={meta.technology} onChange={event => editMeta({ technology: event.target.value })}>
              {WRITE_TECHNOLOGIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <span className={styles.techPreview}><Image src={`/images/tech/${tech.id}.png`} alt="" width={18} height={18} />Files under {tech.label} · {tech.category}</span>
          <label>Tags <small>(comma separated, up to {INK_LIMITS.tags})</small>
            <input value={meta.tags} onChange={event => editMeta({ tags: event.target.value })} placeholder="LangGraph, Agents, RAG" />
          </label>
          <label>Key takeaways <small>(one per line, up to 5)</small>
            <textarea rows={4} value={meta.takeaways} onChange={event => editMeta({ takeaways: event.target.value })} placeholder="What readers should remember" />
          </label>
          <label>Closing takeaway
            <textarea rows={3} value={meta.founderTakeaway} onChange={event => editMeta({ founderTakeaway: event.target.value })} maxLength={600} placeholder="A short closing thought for the reader's next project" />
          </label>
          <p className={styles.count}>{words} words · about {Math.max(1, Math.round(words / 220))} min read{words < INK_LIMITS.minPublishWords ? ` · ${INK_LIMITS.minPublishWords - words} more to publish` : ""}</p>
        </section>

        <section className={styles.panel} aria-labelledby="write-stories">
          <h2 id="write-stories">Your stories</h2>
          <Link href="/tech-buzz/write" className={styles.newStory} onClick={event => { if (!id) event.preventDefault(); }}><Plus size={14} aria-hidden="true" />New story</Link>
          {stories.length ? <ul className={styles.stories}>
            {stories.map(item => <li key={item.id} aria-current={item.id === id ? "true" : undefined}>
              <a href={`/tech-buzz/write?id=${item.id}`} className={styles.storyTitle}>{item.title}</a>
              <span className={styles.storyMeta}><b data-status={item.status}>{item.status === "published" ? "Published" : "Draft"}</b>{DATE.format(Date.parse(item.status === "published" ? item.publishedAt : item.updatedAt))}</span>
              <span className={styles.storyActions}>
                {item.status === "published" && <Link href={`/tech-buzz/${item.slug}`}>View</Link>}
                <button type="button" onClick={() => void remove(item)}>Delete</button>
              </span>
            </li>)}
          </ul> : <p className={styles.empty}>Your drafts and published stories will appear here.</p>}
        </section>
      </aside>
    </div>
  </div>;
}

/** A textarea that grows with its text, so writing feels like a page rather than a form. */
function AutoText({ value, onChange, placeholder, className, maxLength, label }: { value: string; onChange: (value: string) => void; placeholder: string; className: string; maxLength?: number; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const area = ref.current; if (!area) return; area.style.height = "auto"; area.style.height = `${area.scrollHeight}px`; }, [value]);
  return <textarea ref={ref} className={className} value={value} rows={1} placeholder={placeholder} maxLength={maxLength} aria-label={label} onChange={event => onChange(event.target.value)} />;
}

function Part({ title, icon, onRemove, children }: { title: string; icon: ReactNode; onRemove: () => void; children: ReactNode }) {
  return <div className={styles.part}>
    <div className={styles.partHead}><span aria-hidden="true">{icon}</span>{title}<button type="button" onClick={onRemove} aria-label={`Remove ${title.toLowerCase()}`}><X size={14} /></button></div>
    {children}
  </div>;
}

/** How the story will read once published. */
function StoryPreview({ story, authorName, technology, words }: { story: InkStory; authorName: string; technology: string; words: number }) {
  return <article className={styles.preview}>
    {story.coverImage && <span className={styles.coverImage}><Image src={story.coverImage} alt="" fill sizes="(max-width: 800px) 100vw, 720px" /></span>}
    <p className={styles.previewMeta}>{technology} · {Math.max(1, Math.round(words / 220))} min read · by {authorName}</p>
    <h1>{story.title || "Untitled story"}</h1>
    {story.subtitle && <p className={styles.previewSubtitle}>{story.subtitle}</p>}
    {story.summaryBullets.length > 0 && <ul className={styles.previewTakeaways}>{story.summaryBullets.map((item, i) => <li key={i}>{item}</li>)}</ul>}
    {story.sections.map((section, i) => <section key={i}>
      {section.heading && <h2>{section.heading}</h2>}
      {section.image?.src && <span className={styles.sectionImage}><Image src={section.image.src} alt={section.image.alt} width={720} height={405} /></span>}
      {section.paragraphs.map((paragraph, j) => <p key={j}>{paragraph}</p>)}
      {section.quote?.text && <blockquote>{section.quote.text}{section.quote.attribution && <cite>{section.quote.attribution}</cite>}</blockquote>}
      {!!section.steps?.length && <ol>{section.steps.map((step, j) => <li key={j}>{step}</li>)}</ol>}
      {!!section.bulletPoints?.length && <ul>{section.bulletPoints.map((point, j) => <li key={j}>{point}</li>)}</ul>}
      {section.codeSnippet?.files?.some(file => file.code.trim()) && <CodeFiles skin="apple" annotate={false} label={section.heading || "Code"}
        files={section.codeSnippet.files.filter(file => file.code.trim()).map(file => ({ path: file.filename || `example.${EXTENSION[file.language] ?? "txt"}`, code: file.code, note: "" }))} />}
      {section.callout?.text && <p className={styles.previewCallout} data-type={section.callout.type}><b>{section.callout.type}</b>{section.callout.text}</p>}
    </section>)}
    {story.founderTakeaway && <p className={styles.previewClosing}>{story.founderTakeaway}</p>}
  </article>;
}
