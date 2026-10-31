"use client";
import { ContentImage } from "./content-image";
import { useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Boxes, Building2, FlaskConical, GitBranch, Layers, Network, Workflow as WorkflowIcon, Zap, type LucideIcon } from "lucide-react";
import { WORKFLOW_HEIGHT, WORKFLOW_WIDTH, type Workflow, type WorkflowNodeKind } from "@/lib/landing-workflows-shape";
import { WORKFLOW_LESSONS } from "@/lib/workflow-learning";
import { STEP_TONES, WorkflowDiagram, two } from "./workflow-diagram";
import { learningImageUrl } from "@/lib/learning-image";
import { AUTOPLAY_MS, Controls, Dots, PREVIEW_COUNT } from "./landing-ai-pulse";
import { DashboardMore } from "./dashboard-more";
import { useLanguage } from "./language-provider";
import { usePagedCarousel } from "./use-paged-carousel";
import { DashboardLessons } from "./dashboard-lessons";
import home from "./landing-home.module.css";
import styles from "./landing-workflows.module.css";
import { LearningLoader } from "./learning-loader";
import { Editable, useContentItem, useContentEditing } from "./content-editing";
import { contentKey } from "@/lib/content-overrides";
import { ListenButton } from "./listen-button";

const workflowKey = (workflow: Workflow) => contentKey("workflow", workflow.id);

/** The official-docs learning paths (~180 KB of curriculum and guides) only show on /learning, so they are their own chunk. */
const WorkflowLearning = dynamic(() => import("./workflow-learning").then(module => module.WorkflowLearning), { loading: () => <LearningLoader size="inline" label="Loading the learning paths…" /> });
/** Full detail and interview questions: about 200 Q&As (lib/workflow-prep), so they load as their own chunk after the page. */
const WorkflowPrep = dynamic(() => import("./landing-workflow-prep"), { loading: () => <LearningLoader size="inline" label="Loading the interview questions…" /> });

/** The landing preview shows this many of the most asked subjective and objective questions per blueprint; /learning shows all. */
const LANDING_QUESTIONS = 3;

type Group = Workflow["group"];
type Text = (en: string, hindi: string) => string;
const GROUPS: Group[] = ["System Design", "LangChain", "LangGraph", "LangFlow", "LangSmith", "n8n", "Companies"];
const GROUP_ICON: Record<Group, LucideIcon> = { "System Design": Boxes, LangChain: Network, LangGraph: GitBranch, LangFlow: WorkflowIcon, LangSmith: FlaskConical, n8n: Zap, Companies: Building2 };
const KIND_LABEL: Record<WorkflowNodeKind, string> = { actor: "Person / client", service: "Service", store: "Data store", queue: "Queue", llm: "Model / agent", tool: "Tool / step", decision: "Decision" };

/**
 * Workflow blueprints: System Design patterns and agentic AI workflows from real industries, one a screen.
 * Each screen pairs a picture-topped brief (industry, problem, outcome) with a drawn diagram whose numbered badges
 * match the colour-coded step pills beneath it, then its full detail and most-asked interview questions.
 * Autoplay turns a screen every two minutes, as the pulse carousel does.
 */
/**
 * `preview` (the landing page) shows the first three blueprints of each category, each with its 7 most asked
 * subjective and 7 most asked objective interview questions; /learning carries every blueprint with its full set.
 */
export function LandingWorkflows({ workflows: initial, total = initial.length, industries: industryCount, groups: groupCounts, expanded = false, preview = false }: Readonly<{
  /** Every blueprint on /learning; on the landing page only the "All" tab's first screen (lib/landing-workflows-preview.ts). */
  workflows: Workflow[]; total?: number; industries?: number; expanded?: boolean; preview?: boolean;
  /** The landing page's blueprints per category; the rest of them are fetched the first time a tab is picked. */
  groups?: Partial<Record<Group, number>>;
}>) {
  const { language } = useLanguage(); const hi = language === "hi"; const text: Text = (en, hindi) => hi ? hindi : en;
  const [group, setGroup] = useState<string>("All");
  const [loaded, setLoaded] = useState<Workflow[] | null>(null);
  const [pending, setPending] = useState(false);
  const source = loaded ?? initial;
  const partial = Boolean(groupCounts) && !loaded;
  // The landing preview leaves out the dashboard-only blueprints (the URL shortener and the company slides).
  const pool = useMemo(() => preview ? source.filter(workflow => !workflow.dashboardOnly) : source, [preview, source]);
  // A category tab appears only when it has something to show (a blueprint, or on /learning a learning path).
  const groups = expanded ? [...new Set([...GROUPS.filter(option => pool.some(workflow => workflow.group === option) || WORKFLOW_LESSONS.some(lesson => lesson.group === option)), ...WORKFLOW_LESSONS.map(lesson => lesson.group)])]
    : partial ? GROUPS.filter(option => groupCounts?.[option]) : GROUPS.filter(option => pool.some(workflow => workflow.group === option));
  const pick = (option: string) => {
    if (!partial || option === "All") { setGroup(option); return; }
    if (pending) return;
    setPending(true);
    // On failure the tab still switches and shows what the page already has.
    fetch("/api/landing/workflows").then(response => response.ok ? response.json() : null)
      .then((full: { workflows?: Workflow[] } | null) => { if (full?.workflows?.length) setLoaded(full.workflows); })
      .catch(() => {})
      .finally(() => { setPending(false); setGroup(option); });
  };
  const lessons = expanded ? WORKFLOW_LESSONS.filter(lesson => group === "All" || lesson.group === group) : [];
  const { overrides, editing } = useContentEditing();
  const section = useContentItem("section:workflows", "section");
  const shown = useMemo(() => {
    const visible = editing ? pool : pool.filter(workflow => !overrides[workflowKey(workflow)]?.deleted);
    const all = group === "All" ? visible : visible.filter(workflow => workflow.group === group);
    return preview ? all.slice(0, PREVIEW_COUNT) : all;
  }, [group, preview, overrides, editing, pool]);
  const industries = industryCount ?? new Set(source.map(workflow => workflow.industry)).size;

  if (section.hidden) return null;
  return <section id="workflows" className={styles.section} aria-labelledby="workflows-title" {...section.props}>{section.toolbar}<div className={home.inner}>
    {preview && <DashboardMore href="/learning" title={text(`See all ${total} blueprints`, `सभी ${total} ब्लूप्रिंट देखें`)} detail={text("Every blueprint with 30+ subjective and 30+ objective interview questions.", "हर ब्लूप्रिंट के साथ 30+ विषयगत और 30+ वस्तुनिष्ठ इंटरव्यू प्रश्न।")} />}
    <div className={styles.head} data-learning-header>
      <p className={styles.kicker}><Layers size={14} aria-hidden="true" />{text("Workflow blueprints", "वर्कफ़्लो ब्लूप्रिंट")}</p>
      <h2 id="workflows-title"><Editable k="section:workflows" f={`heading.${language}`}>{text("System design: how real systems and ", "सिस्टम डिज़ाइन: असली सिस्टम और ")}</Editable><em><Editable k="section:workflows" f={`emphasis.${language}`}>{text("AI agents get work done", "AI एजेंट काम कैसे करते हैं")}</Editable></em></h2>
      <p className={styles.lede} data-learning-intro><Editable k="section:workflows" f={`lede.${language}`} multiline>{text(
        `${total} step-by-step blueprints: the system design behind apps you use every day, and LangChain, LangGraph, LangFlow and LangSmith agents solving real problems across ${industries} industries, from e-commerce and banking to hospitals. Each comes with its tech stack, design decisions, common mistakes and the interview questions most asked about it.`,
        `${total} चरण-दर-चरण ब्लूप्रिंट: रोज़ इस्तेमाल होने वाले ऐप्स के पीछे का सिस्टम डिज़ाइन, और LangChain, LangGraph, LangFlow व LangSmith एजेंट जो ई-कॉमर्स, बैंकिंग से लेकर अस्पतालों तक ${industries} उद्योगों की असली समस्याएँ हल करते हैं। हर एक के साथ टेक स्टैक, डिज़ाइन निर्णय, आम गलतियाँ और सबसे ज़्यादा पूछे जाने वाले इंटरव्यू प्रश्न।`)}</Editable></p>
    </div>
    {/* Remounted per filter so the page count and position start fresh. */}
    <div className={styles.filters} role="group" aria-label={text("Filter workflows", "वर्कफ़्लो छाँटें")} aria-busy={pending}>
      {["All", ...groups].map(option => {
        const count = partial
          ? (option === "All" ? Object.values(groupCounts ?? {}).reduce((sum, n) => sum + (n ?? 0), 0) : groupCounts?.[option as Group] ?? 0)
          : (option === "All" ? pool.length : pool.filter(workflow => workflow.group === option).length)
            + (expanded ? WORKFLOW_LESSONS.filter(lesson => option === "All" || lesson.group === option).length : 0);
        const Icon = GROUP_ICON[option as Group] ?? Layers;
        return <button key={option} type="button" aria-pressed={group === option} data-group={option} onClick={() => pick(option)}>
          <Icon size={14} aria-hidden="true" />{option === "All" ? text("All", "सभी") : option}<span>{count}</span>
        </button>;
      })}
    </div>
    {expanded && <WorkflowLearning key={`learning-${group}`} lessons={lessons} text={text} />}
    {shown.length > 0 && <WorkflowCarousel key={`carousel-${group}`} workflows={shown} text={text} preview={preview} />}
    {expanded && <DashboardLessons section="workflows" />}
  </div></section>;
}

function WorkflowCarousel({ workflows, text, preview }: Readonly<{ workflows: Workflow[]; text: Text; preview: boolean }>) {
  const { track, nearViewport, page, pages, playing, setPlaying, running, goTo, holdProps } = usePagedCarousel<HTMLUListElement>(workflows.length, 1, AUTOPLAY_MS, { fitHeight: true });
  const current = workflows[page];
  return <>
    <div className={styles.toolbar}>
      <p className={styles.now} aria-live="polite">{current && <><b>{current.group}</b><span aria-hidden="true">·</span>{current.industry}</>}</p>
      <Controls text={text} playing={playing} onPlay={() => setPlaying(p => !p)} page={page} pages={pages} goTo={goTo} previous={text("Previous workflow", "पिछला वर्कफ़्लो")} next={text("Next workflow", "अगला वर्कफ़्लो")} />
    </div>
    <div className={styles.carousel}>
    <ul ref={track} className={styles.track} aria-roledescription="carousel" aria-label={text("Workflow blueprints", "वर्कफ़्लो ब्लूप्रिंट")} {...holdProps}>
      {workflows.map((workflow, i) => <WorkflowSlide key={workflow.id} workflow={workflow} near={nearViewport && Math.abs(i - page) <= 1} index={i} total={workflows.length} text={text} preview={preview} />)}
    </ul>
    <Dots pages={pages} page={page} running={running} goTo={goTo} label={n => text(`Show workflow ${n}`, `वर्कफ़्लो ${n} दिखाएँ`)} />
  </div></>;
}

function WorkflowSlide({ workflow, near, index, total, text, preview }: Readonly<{ workflow: Workflow; near: boolean; index: number; total: number; text: Text; preview: boolean }>) {
  const kinds = [...new Set(workflow.nodes.map(node => node.kind))];
  const Icon = GROUP_ICON[workflow.group];
  const k = workflowKey(workflow);
  const item = useContentItem(k, "blueprint");
  return <li className={styles.slide} data-group={workflow.group} aria-roledescription="slide" aria-label={`${index + 1} / ${total}: ${workflow.title}`} {...item.props}>{item.toolbar}
    <article className={styles.brief}>
      <BriefPicture src={learningImageUrl("topics", ["blueprints", workflow.id])} alt={`Illustration of ${workflow.title}`} icon={<Icon size={46} strokeWidth={1.3} aria-hidden="true" />}>
        <span className={styles.tag}><Icon size={12} aria-hidden="true" />{workflow.group}</span>
        <span className={styles.index} aria-hidden="true">{two(index + 1)}<i>/{two(total)}</i></span>
      </BriefPicture>
      <div className={styles.briefBody}>
        <p className={styles.industry}><Editable k={k} f="industry">{workflow.industry}</Editable></p>
        <h3><Editable k={k} f="title">{workflow.title}</Editable></h3>
        <ListenButton id={`workflow:${workflow.id}`} title={workflow.title} text={() => [workflow.title, workflow.summary, `The real-life problem. ${workflow.problem}`, `The outcome. ${workflow.outcome}`].join(". ")} />
        <p className={styles.summary}><Editable k={k} f="summary" multiline>{workflow.summary}</Editable></p>
        <dl className={styles.facts}>
          <div data-fact="problem"><dt>{text("Real-life problem", "असली समस्या")}</dt><dd><Editable k={k} f="problem" multiline>{workflow.problem}</Editable></dd></div>
          <div data-fact="outcome"><dt>{text("Outcome", "नतीजा")}</dt><dd><Editable k={k} f="outcome" multiline>{workflow.outcome}</Editable></dd></div>
        </dl>
      </div>
    </article>
    <div className={styles.board}>
      {/* A diagram is a few hundred SVG nodes: it is drawn as the section nears the screen, in an empty frame of the same size till then. */}
      <div className={styles.canvas}>{near ? <WorkflowDiagram workflow={workflow} /> : <svg viewBox={`0 0 ${WORKFLOW_WIDTH} ${WORKFLOW_HEIGHT}`} aria-hidden="true" />}</div>
      <ul className={styles.legend} aria-label={text("Legend", "संकेत")}>{kinds.map(kind => <li key={kind} data-kind={kind}>{KIND_LABEL[kind]}</li>)}</ul>
    </div>
    <ol className={styles.steps} aria-label={text("Step by step", "चरण दर चरण")}>
      {workflow.steps.map((step, i) => <li key={step} data-tone={i % STEP_TONES}><b>{two(i + 1)}</b><span>{step}</span></li>)}
    </ol>
    {/* The shown slide and its neighbours always carry their details, so no loader ever stands in for them. */}
    {/* Like the diagram, the questions (a ~600 KB chunk of every blueprint's detail) load only as the section nears the
        screen, so the landing page never fetches them on first load. */}
    <div className={styles.prep}>{near && <WorkflowPrep id={workflow.id} text={text} limit={preview ? LANDING_QUESTIONS : undefined} />}</div>
  </li>;
}

/** The brief's picture with the tag and number laid over it; a missing one becomes a tinted panel with the group's icon. */
function BriefPicture({ src, alt, icon, children }: Readonly<{ src: string | null; alt: string; icon: ReactNode; children: ReactNode }>) {
  const [failed, setFailed] = useState(false);
  const empty = !src || failed;
  return <div className={styles.picture} data-empty={empty}>
    {empty ? <span className={styles.placeholder}>{icon}</span> :
      <ContentImage src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
    {children}
  </div>;
}
