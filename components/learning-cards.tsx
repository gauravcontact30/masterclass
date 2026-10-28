"use client";
import { useId, useMemo, useState, type CSSProperties } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, BookOpen, CalendarClock, ChevronDown, GitBranch, Images, ListOrdered, MessageCircleQuestion, Pin, Sparkles, X } from "lucide-react";
import { TONES, readingMinutes, type DiagramNode, type LearningBlock, type StudyPack } from "@/lib/learning-uploads";
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
  return new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));
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
          <details name={`${block.id}-questions`} open={index === 0}><summary><span className={styles.qNumber}>Q{index + 1}</span><span className={styles.qText}>{item.question}</span><ChevronDown size={18} className={styles.qChevron} aria-hidden="true" /></summary><p>{item.answer}</p></details>
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
// Box sizes match the system-design sketches the diagram is modelled on; the svg scales down to fit the window.
const BOX_W = 266, BOX_H = 98, GAP_X = 52, GAP_Y = 104, PAD = 28, TAG_ROOM = 44, LOOP_DIP = 130;
type Kind = NonNullable<DiagramNode["kind"]>;
type Placed = DiagramNode & { kind: Kind; step?: number; col: number; row: number; x: number; y: number };
/**
 * Lays a diagram out left to right: the longest chain of edges is the main flow on one row, numbered 01, 02…;
 * every other node sits above (then below) the node it connects to. Ranks come from the longest path to each node
 * from a node nothing points at, leaving out edges that close a cycle, so a response back to the start is drawn as
 * a loop under the row instead of pushing the start along.
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
  // The main flow: walk back from the deepest node through predecessors one rank up.
  const spine: string[] = [];
  for (let id = nodes.reduce<string | undefined>((best, node) => best === undefined || level.get(node.id)! > level.get(best)! ? node.id : best, undefined); id !== undefined;) {
    spine.unshift(id);
    const at = level.get(id)!, current = id;
    id = forward.find(([from, to]) => to === current && level.get(from) === at - 1)?.[0];
  }
  const slot = new Map<string, { col: number; row: number }>(spine.map((id, col) => [id, { col, row: 0 }]));
  const taken = new Set(spine.map((_, col) => `${col}:0`));
  const linked = (id: string) => edges.find(edge => (edge.from === id && slot.has(edge.to)) || (edge.to === id && slot.has(edge.from)));
  const rest = nodes.filter(node => !slot.has(node.id)).sort((a, b) => level.get(a.id)! - level.get(b.id)!);
  while (rest.length) {
    // Next, a node joined to one already placed; failing that, any node, in the column of its rank.
    const node = rest.splice(Math.max(0, rest.findIndex(node => linked(node.id))), 1)[0];
    const link = linked(node.id);
    const anchor = link ? slot.get(link.from === node.id ? link.to : link.from)! : { col: Math.min(level.get(node.id)!, spine.length - 1), row: 0 };
    // Away from the main row: up first, then down, further out until a free spot.
    const signs = anchor.row < 0 ? [-1] : anchor.row > 0 ? [1] : [-1, 1];
    let row: number | undefined;
    for (let step = 1; row === undefined; step++) row = signs.map(sign => anchor.row + sign * step).find(r => !taken.has(`${anchor.col}:${r}`));
    slot.set(node.id, { col: anchor.col, row }); taken.add(`${anchor.col}:${row}`);
  }
  const spots = [...slot.values()], top = Math.min(0, ...spots.map(spot => spot.row)), bottom = Math.max(0, ...spots.map(spot => spot.row));
  const cols = Math.max(1, ...spots.map(spot => spot.col + 1));
  const placed = new Map<string, Placed>();
  for (const node of nodes) {
    const { col, row } = slot.get(node.id)!, step = spine.indexOf(node.id);
    const kind = node.kind ?? (step === 0 ? "client" : step === spine.length - 1 && spine.length > 2 ? "data" : "service");
    placed.set(node.id, { ...node, kind, step: step < 0 ? undefined : step + 1, col, row, x: PAD + col * (BOX_W + GAP_X), y: PAD + TAG_ROOM + (row - top) * (BOX_H + GAP_Y) });
  }
  const loops = edges.some(edge => { const from = placed.get(edge.from), to = placed.get(edge.to); return !!from && !!to && from.row === to.row && to.col < from.col; });
  const floor = PAD + TAG_ROOM + (bottom - top) * (BOX_H + GAP_Y) + BOX_H;
  return { width: PAD * 2 + cols * BOX_W + (cols - 1) * GAP_X, height: floor + (loops ? LOOP_DIP + PAD : PAD), floor, nodes: [...placed.values()], placed };
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

/** Where an edge runs and where its label sits: straight between neighbours, over the top when it skips ahead, up or down a column, and a loop underneath back along the row. */
function route(from: Placed, to: Placed, floor: number) {
  if (from.row === to.row && to.col === from.col + 1) {
    const y = from.y + BOX_H / 2;
    return { d: `M${from.x + BOX_W + 8} ${y}H${to.x - 6}`, tag: [from.x + BOX_W + GAP_X / 2, from.y - 30] };
  }
  if (from.row === to.row && to.col > from.col) {
    const x1 = from.x + BOX_W * 0.7, x2 = to.x + BOX_W * 0.3, y = from.y - 4, lift = 70;
    return { d: `M${x1} ${y}C${x1} ${y - lift} ${x2} ${y - lift} ${x2} ${y - 6}`, tag: [(x1 + x2) / 2, y - lift * 0.75] };
  }
  if (from.row === to.row) {
    const x1 = from.x + BOX_W * 0.24, x2 = to.x + BOX_W * 0.78, y = from.y + BOX_H + 2, dip = floor + LOOP_DIP;
    return { d: `M${x1} ${y}C${x1 - 60} ${dip} ${x2 + 60} ${dip} ${x2 - 2} ${y + 10}`, tag: [(x1 + x2) / 2, y + (dip - y) * 0.75] };
  }
  const up = to.row < from.row;
  const x1 = from.x + BOX_W / 2, y1 = up ? from.y - 4 : from.y + BOX_H + 4, x2 = to.x + BOX_W / 2, y2 = up ? to.y + BOX_H + 6 : to.y - 6;
  if (x1 === x2) return { d: `M${x1} ${y1}V${y2}`, tag: [x1, (y1 + y2) / 2] };
  const bend = (y2 - y1) / 2;
  return { d: `M${x1} ${y1}C${x1} ${y1 + bend} ${x2} ${y2 - bend} ${x2} ${y2}`, tag: [(x1 + x2) / 2, (y1 + y2) / 2] };
}

function Diagram({ diagram }: { diagram: StudyPack["diagram"] }) {
  const { width, height, floor, nodes, placed } = useMemo(() => layoutDiagram(diagram), [diagram]);
  // useId has characters url(#…) does not accept.
  const arrow = `arrow-${useId().replace(/[^\w-]/g, "")}`;
  const summary = diagram.edges.map(edge => `${placed.get(edge.from)?.label} → ${placed.get(edge.to)?.label}${edge.label ? ` (${edge.label})` : ""}`).join("; ");
  return <figure className={styles.diagram}>
    {diagram.title && <figcaption>{diagram.title}</figcaption>}
    <div className={styles.diagramScroll}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: Math.min(width, 760), maxWidth: width }} role="img" aria-label={`${diagram.title}. ${summary}`}>
        <defs><marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" className={styles.arrowHead} /></marker></defs>
        {diagram.edges.map((edge, index) => {
          const from = placed.get(edge.from), to = placed.get(edge.to);
          if (!from || !to) return null;
          const { d, tag: [tx, ty] } = route(from, to, floor);
          const pill = edge.label ? edge.label.length * 8 + 28 : 0;
          return <g key={index}>
            <path d={d} className={styles.edge} data-dashed={edge.dashed || undefined} data-back={(from.row === to.row && to.col < from.col) || undefined} markerEnd={`url(#${arrow})`} />
            {edge.label && <g transform={`translate(${tx} ${ty})`}><rect x={-pill / 2} y={-15} width={pill} height={30} rx={15} className={styles.edgeTag} /><text textAnchor="middle" dy="5.5" className={styles.edgeText}>{edge.label}</text></g>}
          </g>;
        })}
        {nodes.map(node => {
          const text = lines(node.label), top = (BOX_H - text.length * 24 - (node.detail ? 26 : 0)) / 2;
          return <g key={node.id} transform={`translate(${node.x} ${node.y})`} data-kind={node.kind} className={styles.box}>
            <rect width={BOX_W} height={BOX_H} rx={16} className={styles.node} />
            <rect x={16} y={24} width={5} height={BOX_H - 48} rx={2.5} className={styles.bar} />
            <text textAnchor="middle" className={styles.nodeText}>{text.map((line, i) => <tspan key={i} x={BOX_W / 2 + 6} y={top + 19 + i * 24}>{line}</tspan>)}</text>
            {node.detail && <text x={BOX_W / 2 + 6} y={top + text.length * 24 + 20} textAnchor="middle" className={styles.nodeDetail}>{node.detail}</text>}
            {node.step && <g transform="translate(6 8)" data-tone={(node.step - 1) % 5} className={styles.badge}><circle r={18} /><text textAnchor="middle" dy="5">{String(node.step).padStart(2, "0")}</text></g>}
          </g>;
        })}
      </svg>
    </div>
  </figure>;
}
