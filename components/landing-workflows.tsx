"use client";
import { useId, useMemo, useState, type ReactNode } from "react";
import { Boxes, FlaskConical, GitBranch, Layers, Network, Workflow as WorkflowIcon, type LucideIcon } from "lucide-react";
import { NODE_HEIGHT, NODE_WIDTH, WORKFLOW_HEIGHT, WORKFLOW_WIDTH, WORKFLOWS, type Workflow, type WorkflowEdge, type WorkflowNode, type WorkflowNodeKind } from "@/lib/landing-workflows";
import { learningImageUrl } from "@/lib/learning-image";
import { AUTOPLAY_MS, Controls, Dots } from "./landing-ai-pulse";
import { useLanguage } from "./language-provider";
import { usePagedCarousel } from "./use-paged-carousel";
import home from "./landing-home.module.css";
import styles from "./landing-workflows.module.css";

type Group = Workflow["group"];
type Text = (en: string, hindi: string) => string;
const GROUPS: Group[] = ["System Design", "LangChain", "LangGraph", "LangFlow", "LangSmith"];
const GROUP_ICON: Record<Group, LucideIcon> = { "System Design": Boxes, LangChain: Network, LangGraph: GitBranch, LangFlow: WorkflowIcon, LangSmith: FlaskConical };
const KIND_LABEL: Record<WorkflowNodeKind, string> = { actor: "Person / client", service: "Service", store: "Data store", queue: "Queue", llm: "Model / agent", tool: "Tool / step", decision: "Decision" };
/** Seven light tones the step pills and their diagram badges cycle through, so badge 03 matches pill 03. */
const STEP_TONES = 7;
const two = (n: number) => String(n).padStart(2, "0");
const labelWidth = (label: string) => label.length * 6.4 + 18;

/**
 * Workflow blueprints: System Design patterns and agentic AI workflows from real industries, one a screen.
 * Each screen pairs a picture-topped brief (industry, problem, outcome) with a drawn diagram whose numbered badges
 * match the colour-coded step pills beneath it. Autoplay turns a screen every two minutes, as the pulse carousel does.
 */
export function LandingWorkflows() {
  const { language } = useLanguage(); const hi = language === "hi"; const text: Text = (en, hindi) => hi ? hindi : en;
  const [group, setGroup] = useState<Group | "All">("All");
  const shown = useMemo(() => group === "All" ? WORKFLOWS : WORKFLOWS.filter(workflow => workflow.group === group), [group]);
  const industries = new Set(WORKFLOWS.map(workflow => workflow.industry)).size;

  return <section id="workflows" className={styles.section} aria-labelledby="workflows-title"><div className={home.inner}>
    <div className={styles.head}>
      <p className={styles.kicker}><Layers size={14} aria-hidden="true" />{text("Workflow blueprints", "वर्कफ़्लो ब्लूप्रिंट")}</p>
      <h2 id="workflows-title">{text("How real systems and ", "असली सिस्टम और ")}<em>{text("AI agents get work done", "AI एजेंट काम कैसे करते हैं")}</em></h2>
      <p className={styles.lede}>{text(
        `${WORKFLOWS.length} step-by-step blueprints: the system design behind apps you use every day, and LangChain, LangGraph, LangFlow and LangSmith agents solving real problems across ${industries} industries, from e-commerce and banking to hospitals.`,
        `${WORKFLOWS.length} चरण-दर-चरण ब्लूप्रिंट: रोज़ इस्तेमाल होने वाले ऐप्स के पीछे का सिस्टम डिज़ाइन, और LangChain, LangGraph, LangFlow व LangSmith एजेंट जो ई-कॉमर्स, बैंकिंग से लेकर अस्पतालों तक ${industries} उद्योगों की असली समस्याएँ हल करते हैं।`)}</p>
    </div>
    <div className={styles.filters} role="group" aria-label={text("Filter workflows", "वर्कफ़्लो छाँटें")}>
      {(["All", ...GROUPS] as const).map(option => {
        const count = option === "All" ? WORKFLOWS.length : WORKFLOWS.filter(workflow => workflow.group === option).length;
        const Icon = option === "All" ? Layers : GROUP_ICON[option];
        return <button key={option} type="button" aria-pressed={group === option} data-group={option} onClick={() => setGroup(option)}>
          <Icon size={14} aria-hidden="true" />{option === "All" ? text("All", "सभी") : option}<span>{count}</span>
        </button>;
      })}
    </div>
    {/* Remounted per filter so the page count and position start fresh. */}
    <WorkflowCarousel key={group} workflows={shown} text={text} />
  </div></section>;
}

function WorkflowCarousel({ workflows, text }: Readonly<{ workflows: Workflow[]; text: Text }>) {
  const { track, page, pages, playing, setPlaying, running, goTo, holdProps } = usePagedCarousel<HTMLUListElement>(workflows.length, 1, AUTOPLAY_MS);
  const current = workflows[page];
  return <div className={styles.carousel}>
    <div className={styles.toolbar}>
      <p className={styles.now} aria-live="polite">{current && <><b>{current.group}</b><span aria-hidden="true">·</span>{current.industry}</>}</p>
      <Controls text={text} playing={playing} onPlay={() => setPlaying(p => !p)} page={page} pages={pages} goTo={goTo} previous={text("Previous workflow", "पिछला वर्कफ़्लो")} next={text("Next workflow", "अगला वर्कफ़्लो")} />
    </div>
    <ul ref={track} className={styles.track} aria-roledescription="carousel" aria-label={text("Workflow blueprints", "वर्कफ़्लो ब्लूप्रिंट")} {...holdProps}>
      {workflows.map((workflow, i) => <WorkflowSlide key={workflow.id} workflow={workflow} index={i} total={workflows.length} text={text} />)}
    </ul>
    <Dots pages={pages} page={page} running={running} goTo={goTo} label={n => text(`Show workflow ${n}`, `वर्कफ़्लो ${n} दिखाएँ`)} />
  </div>;
}

function WorkflowSlide({ workflow, index, total, text }: Readonly<{ workflow: Workflow; index: number; total: number; text: Text }>) {
  const kinds = [...new Set(workflow.nodes.map(node => node.kind))];
  const Icon = GROUP_ICON[workflow.group];
  return <li className={styles.slide} data-group={workflow.group} aria-roledescription="slide" aria-label={`${index + 1} / ${total}: ${workflow.title}`}>
    <article className={styles.brief}>
      <BriefPicture src={learningImageUrl("topics", ["blueprints", workflow.id])} alt={`Illustration of ${workflow.title}`} icon={<Icon size={46} strokeWidth={1.3} aria-hidden="true" />}>
        <span className={styles.tag}><Icon size={12} aria-hidden="true" />{workflow.group}</span>
        <span className={styles.index} aria-hidden="true">{two(index + 1)}<i>/{two(total)}</i></span>
      </BriefPicture>
      <div className={styles.briefBody}>
        <p className={styles.industry}>{workflow.industry}</p>
        <h3>{workflow.title}</h3>
        <p className={styles.summary}>{workflow.summary}</p>
        <dl className={styles.facts}>
          <div data-fact="problem"><dt>{text("Real-life problem", "असली समस्या")}</dt><dd>{workflow.problem}</dd></div>
          <div data-fact="outcome"><dt>{text("Outcome", "नतीजा")}</dt><dd>{workflow.outcome}</dd></div>
        </dl>
      </div>
    </article>
    <div className={styles.board}>
      <div className={styles.canvas}><Diagram workflow={workflow} /></div>
      <ul className={styles.legend} aria-label={text("Legend", "संकेत")}>{kinds.map(kind => <li key={kind} data-kind={kind}>{KIND_LABEL[kind]}</li>)}</ul>
    </div>
    <ol className={styles.steps} aria-label={text("Step by step", "चरण दर चरण")}>
      {workflow.steps.map((step, i) => <li key={step} data-tone={i % STEP_TONES}><b>{two(i + 1)}</b><span>{step}</span></li>)}
    </ol>
  </li>;
}

/** The brief's picture with the tag and number laid over it; a missing one becomes a tinted panel with the group's icon. */
function BriefPicture({ src, alt, icon, children }: Readonly<{ src: string | null; alt: string; icon: ReactNode; children: ReactNode }>) {
  const [failed, setFailed] = useState(false);
  const empty = !src || failed;
  return <div className={styles.picture} data-empty={empty}>
    {empty ? <span className={styles.placeholder}>{icon}</span> : /* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP from the storage bucket, as on the pulse cards. */
      <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
    {children}
  </div>;
}

/** Where the line from a node's centre toward `toward` leaves its box. */
function clip(node: WorkflowNode, toward: { x: number; y: number }, pad = 5) {
  const dx = toward.x - node.x, dy = toward.y - node.y;
  const t = Math.min(dx ? (NODE_WIDTH / 2 + pad) / Math.abs(dx) : Infinity, dy ? (NODE_HEIGHT / 2 + pad) / Math.abs(dy) : Infinity);
  return { x: node.x + dx * t, y: node.y + dy * t };
}

function edgeGeometry(edge: WorkflowEdge, from: WorkflowNode, to: WorkflowNode) {
  if (edge.via) {
    const via = { x: edge.via[0], y: edge.via[1] };
    const s = clip(from, via), e = clip(to, via);
    return { d: `M${s.x},${s.y} Q${via.x},${via.y} ${e.x},${e.y}`, mid: { x: .25 * s.x + .5 * via.x + .25 * e.x, y: .25 * s.y + .5 * via.y + .25 * e.y } };
  }
  const s = clip(from, to), e = clip(to, from);
  const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
  // A label on a short level arrow would cover both boxes, so it rides just above them instead.
  if (edge.label && from.y === to.y && Math.abs(e.x - s.x) < labelWidth(edge.label) + 8) mid.y = from.y - NODE_HEIGHT / 2 - 20;
  return { d: `M${s.x},${s.y} L${e.x},${e.y}`, mid };
}

function Diagram({ workflow }: Readonly<{ workflow: Workflow }>) {
  const id = useId().replaceAll(":", "");
  const byId = new Map(workflow.nodes.map(node => [node.id, node]));
  const edges = workflow.edges.map(edge => ({ edge, ...edgeGeometry(edge, byId.get(edge.from)!, byId.get(edge.to)!) }));
  return <svg viewBox={`0 0 ${WORKFLOW_WIDTH} ${WORKFLOW_HEIGHT}`} role="img" aria-label={`${workflow.title} workflow: ${workflow.nodes.map(node => node.label.replace("\n", " ")).join(", ")}`}>
    <defs>
      <marker id={`arrow-${id}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" className={styles.arrowHead} /></marker>
      <filter id={`lift-${id}`} x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#141413" floodOpacity=".08" /></filter>
    </defs>
    <g>{edges.map(({ edge, d }) => <g key={`${edge.from}-${edge.to}`}>
      <path d={d} className={styles.edge} data-dashed={!!edge.dashed} markerEnd={`url(#arrow-${id})`} />
      {!edge.dashed && <path d={d} className={styles.flow} />}
    </g>)}</g>
    <g filter={`url(#lift-${id})`}>{workflow.nodes.map(node => <NodeBox key={node.id} node={node} />)}</g>
    <g>{edges.filter(({ edge }) => edge.label).map(({ edge, mid }) => {
      const width = labelWidth(edge.label!);
      return <g key={`label-${edge.from}-${edge.to}`} className={styles.edgeLabel}>
        <rect x={mid.x - width / 2} y={mid.y - 10} width={width} height={20} rx={10} />
        <text x={mid.x} y={mid.y + 4} textAnchor="middle">{edge.label}</text>
      </g>;
    })}</g>
  </svg>;
}

function NodeBox({ node }: Readonly<{ node: WorkflowNode }>) {
  const [title, detail] = node.label.split("\n");
  const left = node.x - NODE_WIDTH / 2, top = node.y - NODE_HEIGHT / 2;
  return <g className={styles.node} data-kind={node.kind}>
    <rect x={left} y={top} width={NODE_WIDTH} height={NODE_HEIGHT} rx={node.kind === "decision" ? NODE_HEIGHT / 2 : 14} />
    <rect className={styles.accent} x={left + 10} y={top + 14} width={4} height={NODE_HEIGHT - 28} rx={2} />
    <text x={node.x + 5} y={detail ? node.y - 3 : node.y + 5} textAnchor="middle" className={styles.nodeTitle}>{title}</text>
    {detail && <text x={node.x + 5} y={node.y + 16} textAnchor="middle" className={styles.nodeDetail}>{detail}</text>}
    {node.step && <g className={styles.badge} data-tone={(node.step - 1) % STEP_TONES}><circle cx={left + 4} cy={top + 4} r={12.5} /><text x={left + 4} y={top + 8} textAnchor="middle">{two(node.step)}</text></g>}
  </g>;
}
