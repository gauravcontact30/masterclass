"use client";
import { useId, useState, type ReactNode } from "react";
import type { WorkflowLesson } from "@/lib/workflow-learning";
import { WORKFLOW_LESSON_GUIDES } from "@/lib/workflow-lesson-guides";
import { learningPoints } from "@/lib/workflow-presentation";
import { WorkflowDiagram } from "./workflow-diagram";
import styles from "./landing-workflows.module.css";

type Text = (en: string, hi: string) => string;
const TABS = ["interview", "guide", "workflow", "practice"] as const;
type Tab = typeof TABS[number];

export function WorkflowStudyPanels({ lesson, sources, children, text }: Readonly<{ lesson: WorkflowLesson; sources: WorkflowLesson["sources"]; children: ReactNode; text: Text }>) {
  const [tab, setTab] = useState<Tab>("interview");
  const id = useId();
  const guide = WORKFLOW_LESSON_GUIDES[lesson.id];
  const labels: Record<Tab, string> = { interview: text("Interview Q&A", "इंटरव्यू प्रश्नोत्तर"), guide: text("Learning guide", "अध्ययन गाइड"), workflow: text("Workflow", "वर्कफ़्लो"), practice: text("Practice", "अभ्यास") };
  const diagram = {
    title: lesson.title,
    nodes: guide.stages.map(([label, kind], index) => ({ id: `stage-${index}`, label, kind, x: 125 + index * 250, y: 190, step: index + 1 })),
    edges: guide.stages.slice(1).map((_, index) => ({ from: `stage-${index}`, to: `stage-${index + 1}` })),
  };
  const picture = <figure className={styles.studyFigure}>
    <div className={styles.studyDiagram}><WorkflowDiagram workflow={diagram} /></div>
    <figcaption>{text("Workflow overview", "वर्कफ़्लो परिचय")}: {lesson.summary}</figcaption>
  </figure>;
  return <>
    <div role="tablist" aria-label={`${lesson.group} ${text("learning sections", "अध्ययन भाग")}`} className={styles.studyTabs}>
      {TABS.map((value, index) => <button key={value} type="button" role="tab" id={`${id}-${value}`} aria-controls={`${id}-panel`} aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} title={`${labels[value]} — ${lesson.group}`} onClick={() => setTab(value)} onKeyDown={event => {
        const next = event.key === "ArrowRight" ? (index + 1) % TABS.length : event.key === "ArrowLeft" ? (index + TABS.length - 1) % TABS.length : event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault(); setTab(TABS[next]);
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
      }}>{labels[value]}</button>)}
    </div>
    <section role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`} tabIndex={0} className={styles.studyPanel}>
      {tab === "interview" && children}
      {tab === "guide" && <>
        {picture}
        {guide.sections.map(section => <article key={section.title} className={styles.guidePanel}>
          <h5>{section.title}</h5><ul>{learningPoints(section.body).map((point, index) => <li key={index}>{point}</li>)}</ul>
          <p className={styles.studyExample}><strong>{text("Worked example", "उदाहरण")}: </strong>{section.example}</p>
        </article>)}
        <aside className={styles.guidePanel} aria-label={text("Source attribution", "स्रोत श्रेय")}>
          <h5>{text("Official documentation behind this guide", "इस गाइड के आधिकारिक दस्तावेज़")}</h5>
          <p>{text("The explanations, examples and diagrams above are original study material based on these references.", "ऊपर दिए गए विवरण, उदाहरण और चित्र इन स्रोतों पर आधारित मौलिक अध्ययन सामग्री हैं।")}</p>
          <ul>{sources.map(source => <li key={source.url}>{source.title}</li>)}</ul>
        </aside>
      </>}
      {tab === "workflow" && <>{picture}<article className={styles.guidePanel}><h5>{text("Build step by step", "चरण दर चरण बनाएँ")}</h5><ol>{lesson.steps.map(step => <li key={step}>{step}</li>)}</ol></article></>}
      {tab === "practice" && <>
        <article className={styles.guidePanel}><h5>{text("Your practical assignment", "आपका अभ्यास")}</h5><ul>{learningPoints(lesson.exercise).map((point, index) => <li key={index}>{point}</li>)}</ul></article>
        <article className={styles.guidePanel}><h5>{text("Acceptance checks", "सफलता की जाँच")}</h5><ul>{guide.verify.map(check => <li key={check}>{check}</li>)}</ul></article>
        <article className={styles.guidePanel}><h5>{text("Explain your decisions", "अपने निर्णय समझाएँ")}</h5><p>{text("Describe the input, the state you retain, the failure path and the evidence that proves success. Compare one alternative and explain its tradeoff.", "इनपुट, सुरक्षित स्थिति, विफलता के रास्ते और सफलता के प्रमाण का वर्णन करें। एक विकल्प से तुलना करके उसका लाभ और सीमा समझाएँ।")}</p></article>
      </>}
    </section>
  </>;
}
