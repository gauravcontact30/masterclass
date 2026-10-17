"use client";
import { useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Boxes, FlaskConical, GitBranch, Layers, Network, Workflow as WorkflowIcon, type LucideIcon } from "lucide-react";
import { WORKFLOWS, type Workflow, type WorkflowNodeKind } from "@/lib/landing-workflows";
import { STEP_TONES, WorkflowDiagram, two } from "./workflow-diagram";
import { learningImageUrl } from "@/lib/learning-image";
import { AUTOPLAY_MS, Controls, Dots, PREVIEW_COUNT } from "./landing-ai-pulse";
import { DashboardMore } from "./dashboard-more";
import { useLanguage } from "./language-provider";
import { usePagedCarousel } from "./use-paged-carousel";
import home from "./landing-home.module.css";
import styles from "./landing-workflows.module.css";
import { LearningLoader } from "./learning-loader";

/** Full detail and interview questions: about 200 Q&As, so they load as their own chunk after the page. */
const WorkflowPrep = dynamic(() => import("./landing-workflow-prep"), { ssr: false, loading: () => <LearningLoader size="inline" label="Loading the blueprint details…" /> });

type Group = Workflow["group"];
type Text = (en: string, hindi: string) => string;
const GROUPS: Group[] = ["System Design", "LangChain", "LangGraph", "LangFlow", "LangSmith"];
const GROUP_ICON: Record<Group, LucideIcon> = { "System Design": Boxes, LangChain: Network, LangGraph: GitBranch, LangFlow: WorkflowIcon, LangSmith: FlaskConical };
const KIND_LABEL: Record<WorkflowNodeKind, string> = { actor: "Person / client", service: "Service", store: "Data store", queue: "Queue", llm: "Model / agent", tool: "Tool / step", decision: "Decision" };

/**
 * Workflow blueprints: System Design patterns and agentic AI workflows from real industries, one a screen.
 * Each screen pairs a picture-topped brief (industry, problem, outcome) with a drawn diagram whose numbered badges
 * match the colour-coded step pills beneath it, then its full detail and most-asked interview questions.
 * Autoplay turns a screen every two minutes, as the pulse carousel does.
 */
/**
 * `preview` (the landing page) shows the first three blueprints of each category; every blueprint, here and on
 * /dashboard, carries its full set of 30+ subjective and 30+ objective interview questions.
 */
export function LandingWorkflows({ preview = false }: Readonly<{ preview?: boolean }>) {
  const { language } = useLanguage(); const hi = language === "hi"; const text: Text = (en, hindi) => hi ? hindi : en;
  const [group, setGroup] = useState<Group | "All">("All");
  const shown = useMemo(() => {
    const all = group === "All" ? WORKFLOWS : WORKFLOWS.filter(workflow => workflow.group === group);
    return preview ? all.slice(0, PREVIEW_COUNT) : all;
  }, [group, preview]);
  const industries = new Set(WORKFLOWS.map(workflow => workflow.industry)).size;

  return <section id="workflows" className={styles.section} aria-labelledby="workflows-title"><div className={home.inner}>
    {preview && <DashboardMore href="/dashboard#workflows" title={text(`See all ${WORKFLOWS.length} blueprints`, `सभी ${WORKFLOWS.length} ब्लूप्रिंट देखें`)} detail={text("Every blueprint with 30+ subjective and 30+ objective interview questions.", "हर ब्लूप्रिंट के साथ 30+ विषयगत और 30+ वस्तुनिष्ठ इंटरव्यू प्रश्न।")} />}
    <div className={styles.head}>
      <p className={styles.kicker}><Layers size={14} aria-hidden="true" />{text("Workflow blueprints", "वर्कफ़्लो ब्लूप्रिंट")}</p>
      <h2 id="workflows-title">{text("How real systems and ", "असली सिस्टम और ")}<em>{text("AI agents get work done", "AI एजेंट काम कैसे करते हैं")}</em></h2>
      <p className={styles.lede}>{text(
        `${WORKFLOWS.length} step-by-step blueprints: the system design behind apps you use every day, and LangChain, LangGraph, LangFlow and LangSmith agents solving real problems across ${industries} industries, from e-commerce and banking to hospitals. Each comes with its tech stack, design decisions, common mistakes and the interview questions most asked about it.`,
        `${WORKFLOWS.length} चरण-दर-चरण ब्लूप्रिंट: रोज़ इस्तेमाल होने वाले ऐप्स के पीछे का सिस्टम डिज़ाइन, और LangChain, LangGraph, LangFlow व LangSmith एजेंट जो ई-कॉमर्स, बैंकिंग से लेकर अस्पतालों तक ${industries} उद्योगों की असली समस्याएँ हल करते हैं। हर एक के साथ टेक स्टैक, डिज़ाइन निर्णय, आम गलतियाँ और सबसे ज़्यादा पूछे जाने वाले इंटरव्यू प्रश्न।`)}</p>
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
      <div className={styles.canvas}><WorkflowDiagram workflow={workflow} /></div>
      <ul className={styles.legend} aria-label={text("Legend", "संकेत")}>{kinds.map(kind => <li key={kind} data-kind={kind}>{KIND_LABEL[kind]}</li>)}</ul>
    </div>
    <ol className={styles.steps} aria-label={text("Step by step", "चरण दर चरण")}>
      {workflow.steps.map((step, i) => <li key={step} data-tone={i % STEP_TONES}><b>{two(i + 1)}</b><span>{step}</span></li>)}
    </ol>
    <div className={styles.prep}><WorkflowPrep id={workflow.id} text={text} /></div>
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
