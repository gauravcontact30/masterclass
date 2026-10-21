"use client";
import { useId, useMemo, useState, type CSSProperties } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, BookOpen, CalendarClock, GitBranch, Images, ListOrdered, MessageCircleQuestion, Pin, Sparkles, X } from "lucide-react";
import { TONES, readingMinutes, type LearningBlock, type StudyPack } from "@/lib/learning-uploads";
import { useLanguage } from "./language-provider";
import styles from "./learning-cards.module.css";
import { ListenButton } from "./listen-button";

/*
 * Upload Learning content on the Learning Dashboard: a card per upload (AI Gateway thumbnail, title, short
 * description, when it was published, "Read more"), opening a light window with the whole lesson and its study
 * pack: most-asked interview questions, workflow, diagram and illustrations. Loaded only on dashboard pages (the
 * slot imports it lazily), so none of this reaches the landing page's bundle.
 */
type CardBlock = LearningBlock & { clean: string };
type Copy = Record<"readMore" | "published" | "lesson" | "interview" | "workflow" | "diagram" | "images" | "preparing" | "close" | "minRead" | "jump", string>;
const COPY: Record<"en" | "hi", Copy> = {
  en: { readMore: "Read more", published: "Published", lesson: "Full lesson", interview: "Most asked interview questions", workflow: "Workflow", diagram: "Diagram", images: "Illustrations", preparing: "Interview questions, the workflow and the diagram for this lesson are being prepared. Check back in a few minutes.", close: "Close", minRead: "min read", jump: "Jump to" },
  hi: { readMore: "और पढ़ें", published: "प्रकाशित", lesson: "पूरा पाठ", interview: "सबसे ज़्यादा पूछे जाने वाले इंटरव्यू प्रश्न", workflow: "वर्कफ़्लो", diagram: "डायग्राम", images: "चित्र", preparing: "इस पाठ के इंटरव्यू प्रश्न, वर्कफ़्लो और डायग्राम तैयार हो रहे हैं। कुछ मिनट बाद देखें।", close: "बंद करें", minRead: "मिनट पढ़ें", jump: "सीधे जाएँ" },
};

const when = (iso: string | null | undefined, hi: boolean) => {
  if (!iso || Number.isNaN(Date.parse(iso))) return null;
  return new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
};

export function LearningCards({ blocks }: { blocks: CardBlock[] }) {
  const { language } = useLanguage();
  const copy = COPY[language === "hi" ? "hi" : "en"];
  const [open, setOpen] = useState<CardBlock | null>(null);
  return <>
    <ul className={styles.grid}>
      {blocks.map(block => <li key={block.id} data-device={block.device && block.device !== "all" ? block.device : undefined} className={styles.item}>
        <LearningCard block={block} copy={copy} hi={language === "hi"} onOpen={() => setOpen(block)} />
      </li>)}
    </ul>
    <Dialog.Root open={!!open} onOpenChange={next => { if (!next) setOpen(null); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.modal}>{open && <LessonWindow block={open} copy={copy} hi={language === "hi"} />}</Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}

function Thumbnail({ block, className }: { block: CardBlock; className: string }) {
  const [failed, setFailed] = useState(false);
  const tone = TONES.find(t => t.value === block.tone) ?? TONES[0];
  if (block.thumbnailUrl && !failed) return <div className={className}><img src={block.thumbnailUrl} alt="" width={1200} height={800} loading="lazy" decoding="async" onError={() => setFailed(true)} /></div>;
  // No picture yet (or it failed): the upload's tone, so the card still has a cover.
  return <div className={className} data-empty style={{ "--thumb-fill": tone.fill, "--thumb-edge": tone.edge } as CSSProperties} aria-hidden="true"><BookOpen size={34} /></div>;
}

function LearningCard({ block, copy, hi, onOpen }: { block: CardBlock; copy: Copy; hi: boolean; onOpen: () => void }) {
  const description = block.summary || block.studyPack?.description || null;
  const published = when(block.publishedAt, hi);
  return <article className={styles.card}>
    <Thumbnail block={block} className={styles.thumb} />
    <div className={styles.cardBody}>
      <h2 className={styles.cardTitle}>{block.pinned && <Pin size={14} aria-label="Pinned" />}{block.title}</h2>
      {description && <p className={styles.cardText}>{description}</p>}
      <div className={styles.cardFoot}>
        <ListenButton id={`lesson:${block.id}`} title={block.title} text={() => lectureOf(block)} compact />
        {published && <p className={styles.date}><CalendarClock size={13} aria-hidden="true" /><span className={styles.srOnly}>{copy.published} </span><time dateTime={block.publishedAt ?? undefined}>{published}</time></p>}
        <button type="button" className={styles.readMore} onClick={onOpen} aria-label={`${copy.readMore}: ${block.title}`}>
          <span className={styles.spark} aria-hidden="true">✻</span>{copy.readMore}<ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  </article>;
}

/** The lesson as a lecture: title, description, the lesson itself, then its interview questions and workflow. */
function lectureOf(block: CardBlock) {
  const pack = block.studyPack;
  return [block.title + ".", pack?.description || block.summary || "", block.clean,
    pack?.interview.length ? `Most asked interview questions. ${pack.interview.map((item, index) => `Question ${index + 1}. ${item.question} Answer. ${item.answer}`).join(" ")}` : "",
    pack?.workflow.length ? `Workflow. ${pack.workflow.map((step, index) => `Step ${index + 1}. ${step.title}. ${step.detail}`).join(" ")}` : ""].filter(Boolean).join(" ");
}

type SectionKey = "lesson" | "interview" | "workflow" | "diagram" | "images";
function LessonWindow({ block, copy, hi }: { block: CardBlock; copy: Copy; hi: boolean }) {
  const pack = block.studyPack;
  const sections: [SectionKey, boolean][] = [["lesson", !!block.clean.trim()], ["interview", !!pack?.interview.length], ["workflow", !!pack?.workflow.length], ["diagram", !!pack && pack.diagram.nodes.length > 1], ["images", !!pack?.images.length]];
  const shown = sections.filter(([, has]) => has).map(([key]) => key);
  const published = when(block.publishedAt, hi);
  const jump = (key: SectionKey) => document.getElementById(`${block.id}-${key}`)?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return <>
    <header className={styles.modalHead}>
      <p className={styles.eyebrow}><Sparkles size={13} aria-hidden="true" />{published ? `${copy.published} ${published}` : copy.lesson}<span aria-hidden="true">·</span>{readingMinutes(block.html)} {copy.minRead}</p>
      <ListenButton id={`lesson:${block.id}`} title={block.title} text={() => lectureOf(block)} />
      <Dialog.Close className={styles.close} aria-label={copy.close}><X size={18} aria-hidden="true" /></Dialog.Close>
    </header>
    <div className={styles.scroll}>
      <Dialog.Title className={styles.title}>{block.title}</Dialog.Title>
      {(block.summary || pack?.description) && <Dialog.Description className={styles.description}>{pack?.description || block.summary}</Dialog.Description>}
      {block.tags.length > 0 && <ul className={styles.tags} aria-label="Topics">{block.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
      {block.thumbnailUrl && <Thumbnail block={block} className={styles.hero} />}
      {shown.length > 1 && <nav className={styles.jump} aria-label={copy.jump}>{shown.map(key => <button type="button" key={key} onClick={() => jump(key)}>{copy[key]}</button>)}</nav>}
      {!pack && <p className={styles.preparing}><Sparkles size={15} aria-hidden="true" />{copy.preparing}</p>}

      {shown.includes("lesson") && <section className={styles.section} aria-labelledby={`${block.id}-lesson`}>
        <h3 id={`${block.id}-lesson`}><BookOpen size={17} aria-hidden="true" />{copy.lesson}</h3>
        <div className={styles.article} dangerouslySetInnerHTML={{ __html: block.clean }} />
      </section>}
      {pack && shown.includes("interview") && <section className={styles.section} aria-labelledby={`${block.id}-interview`}>
        <h3 id={`${block.id}-interview`}><MessageCircleQuestion size={17} aria-hidden="true" />{copy.interview}</h3>
        <ol className={styles.questions}>{pack.interview.map((item, index) => <li key={index}>
          <details open={index === 0}><summary><span className={styles.qNumber}>Q{index + 1}</span>{item.question}</summary><p>{item.answer}</p></details>
        </li>)}</ol>
      </section>}
      {pack && shown.includes("workflow") && <section className={styles.section} aria-labelledby={`${block.id}-workflow`}>
        <h3 id={`${block.id}-workflow`}><ListOrdered size={17} aria-hidden="true" />{copy.workflow}</h3>
        <ol className={styles.steps}>{pack.workflow.map((step, index) => <li key={index}><span className={styles.stepNumber} aria-hidden="true">{index + 1}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div></li>)}</ol>
      </section>}
      {pack && shown.includes("diagram") && <section className={styles.section} aria-labelledby={`${block.id}-diagram`}>
        <h3 id={`${block.id}-diagram`}><GitBranch size={17} aria-hidden="true" />{copy.diagram}</h3>
        <Diagram diagram={pack.diagram} />
      </section>}
      {pack && shown.includes("images") && <section className={styles.section} aria-labelledby={`${block.id}-images`}>
        <h3 id={`${block.id}-images`}><Images size={17} aria-hidden="true" />{copy.images}</h3>
        <div className={styles.figures}>{pack.images.map(image => <Figure key={image.url} {...image} />)}</div>
      </section>}
    </div>
  </>;
}

function Figure({ url, caption }: { url: string; caption: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <figure><img src={url} alt={caption} width={1200} height={800} loading="lazy" decoding="async" onError={() => setFailed(true)} />{caption && <figcaption>{caption}</figcaption>}</figure>;
}

// ----- Diagram -----
const BOX_W = 168, BOX_H = 54, GAP_X = 28, GAP_Y = 48, PAD = 14;
type Placed = { id: string; label: string; x: number; y: number };
/**
 * Lays a diagram out top to bottom: each node's row is the longest path to it from a node nothing points at, so a
 * flow reads downward and branches sit side by side. Edges that close a cycle are left out of the ranking (they
 * are still drawn, looping round the side), so a loop back to the start never pushes the start down.
 */
export function layoutDiagram({ nodes, edges }: Pick<StudyPack["diagram"], "nodes" | "edges">) {
  const out = new Map<string, string[]>(nodes.map(node => [node.id, []]));
  for (const edge of edges) if (out.has(edge.to)) out.get(edge.from)?.push(edge.to);
  const pointedAt = new Set(edges.map(edge => edge.to));
  // Depth-first from the roots (then anything left), keeping only edges that do not lead back to an open node.
  const state = new Map<string, "open" | "done">(), forward: [string, string][] = [], order: string[] = [];
  const visit = (id: string) => {
    state.set(id, "open");
    for (const next of out.get(id) ?? []) {
      if (state.get(next) === "open") continue;
      forward.push([id, next]);
      if (!state.has(next)) visit(next);
    }
    state.set(id, "done"); order.push(id);
  };
  for (const node of [...nodes.filter(node => !pointedAt.has(node.id)), ...nodes]) if (!state.has(node.id)) visit(node.id);
  // Reverse post-order is a topological order of the forward edges.
  const level = new Map(nodes.map(node => [node.id, 0]));
  for (const id of order.reverse()) for (const [from, to] of forward) if (from === id) level.set(to, Math.max(level.get(to)!, level.get(id)! + 1));
  const rows: string[][] = [];
  for (const node of nodes) (rows[level.get(node.id)!] ??= []).push(node.id);
  const filled = rows.filter(Boolean);
  const widest = Math.max(1, ...filled.map(row => row.length));
  const width = PAD * 2 + widest * BOX_W + (widest - 1) * GAP_X;
  const height = PAD * 2 + filled.length * BOX_H + Math.max(0, filled.length - 1) * GAP_Y;
  const labels = new Map(nodes.map(node => [node.id, node.label]));
  const placed = new Map<string, Placed>();
  filled.forEach((row, y) => {
    const start = (width - (row.length * BOX_W + (row.length - 1) * GAP_X)) / 2;
    row.forEach((id, x) => placed.set(id, { id, label: labels.get(id) ?? id, x: start + x * (BOX_W + GAP_X), y: PAD + y * (BOX_H + GAP_Y) }));
  });
  return { width, height, nodes: [...placed.values()], placed };
}

/** Breaks a label into at most two lines of about 20 characters. */
function lines(label: string) {
  const words = label.split(/\s+/), out: string[] = [""];
  for (const word of words) {
    const line = out[out.length - 1];
    if (line && (line + " " + word).length > 20 && out.length < 2) out.push(word);
    else out[out.length - 1] = line ? `${line} ${word}` : word;
  }
  return out.map(line => line.length > 24 ? `${line.slice(0, 23)}…` : line);
}

function Diagram({ diagram }: { diagram: StudyPack["diagram"] }) {
  const { width, height, nodes, placed } = useMemo(() => layoutDiagram(diagram), [diagram]);
  // useId has characters url(#…) does not accept.
  const arrow = `arrow-${useId().replace(/[^\w-]/g, "")}`;
  const summary = diagram.edges.map(edge => `${placed.get(edge.from)?.label} → ${placed.get(edge.to)?.label}${edge.label ? ` (${edge.label})` : ""}`).join("; ");
  return <figure className={styles.diagram}>
    {diagram.title && <figcaption>{diagram.title}</figcaption>}
    <div className={styles.diagramScroll}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: Math.min(width, 560) }} role="img" aria-label={`${diagram.title}. ${summary}`}>
        <defs><marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" className={styles.arrowHead} /></marker></defs>
        {diagram.edges.map((edge, index) => {
          const from = placed.get(edge.from), to = placed.get(edge.to);
          if (!from || !to) return null;
          const down = to.y > from.y;
          // Downward edges leave the bottom and enter the top; the rest loop round the right-hand side.
          const [x1, y1, x2, y2] = down ? [from.x + BOX_W / 2, from.y + BOX_H, to.x + BOX_W / 2, to.y] : [from.x + BOX_W, from.y + BOX_H / 2, to.x + BOX_W, to.y + BOX_H / 2];
          const d = down ? `M${x1} ${y1} C${x1} ${y1 + GAP_Y / 2} ${x2} ${y2 - GAP_Y / 2} ${x2} ${y2 - 2}` : `M${x1} ${y1} C${x1 + 46} ${y1} ${x2 + 46} ${y2} ${x2 + 2} ${y2}`;
          const mx = down ? (x1 + x2) / 2 : Math.max(x1, x2) + 34, my = (y1 + y2) / 2;
          return <g key={index}>
            <path d={d} className={styles.edge} markerEnd={`url(#${arrow})`} />
            {edge.label && <g transform={`translate(${mx} ${my})`}><rect x={-edge.label.length * 3.2 - 6} y={-9} width={edge.label.length * 6.4 + 12} height={18} rx={9} className={styles.edgeTag} /><text textAnchor="middle" dy="4" className={styles.edgeText}>{edge.label}</text></g>}
          </g>;
        })}
        {nodes.map((node, index) => {
          const text = lines(node.label);
          return <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
            <rect width={BOX_W} height={BOX_H} rx={12} className={styles.node} data-first={index === 0 || undefined} />
            <text x={BOX_W / 2} y={BOX_H / 2 - (text.length - 1) * 8 + 4} textAnchor="middle" className={styles.nodeText}>{text.map((line, i) => <tspan key={i} x={BOX_W / 2} dy={i ? 16 : 0}>{line}</tspan>)}</text>
          </g>;
        })}
      </svg>
    </div>
  </figure>;
}
