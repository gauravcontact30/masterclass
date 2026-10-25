"use client";
import { useEffect, useRef, useState } from "react";
import { Cpu, Gauge, GraduationCap, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react";
import { WORKFLOW_PREP, type WorkflowPrep } from "@/lib/workflow-prep";
import { loadMoreQuestions } from "@/lib/workflow-prep/questions";
import type { QuestionSet } from "@/lib/interview-questions";
import { InterviewQuestions } from "./interview-accordion";
import styles from "./landing-workflow-prep.module.css";

type Text = (en: string, hindi: string) => string;

/**
 * Under each Workflow blueprint: its full detail (stack, decisions, mistakes, metrics) and the interview
 * questions most asked about it, subjective and objective, each rated by how often it comes up and opened
 * one at a time like an accordion. Loaded as its own chunk by components/landing-workflows.tsx. The first
 * three of each kind ship with it; the rest load when the blueprint's slide comes near the screen, on the landing
 * page and on /learning alike. `full={false}` keeps just those three; `limit` (the landing preview) shows only the
 * most asked few of each kind, with a link to the full set on /learning.
 */
export default function WorkflowPrepPanel({ id, text, full = true, limit }: Readonly<{ id: string; text: Text; full?: boolean; limit?: number }>) {
  const prep = WORKFLOW_PREP[id];
  const box = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState<QuestionSet | null>(null);
  useEffect(() => {
    const node = box.current; if (!node || !prep || !full) return;
    let live = true;
    const load = () => loadMoreQuestions(id).then(set => { if (live) setMore(set); }).catch(() => undefined);
    // Without IntersectionObserver (old browsers, tests) the questions load straight away.
    if (typeof IntersectionObserver === "undefined") { load(); return () => { live = false; }; }
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { observer.disconnect(); load(); } }, { rootMargin: "300px" });
    observer.observe(node);
    return () => { live = false; observer.disconnect(); };
  }, [id, prep, full]);
  if (!prep) return null;
  const set: QuestionSet = more ? { subjective: [...prep.subjective, ...more.subjective], objective: [...prep.objective, ...more.objective] } : prep;
  return <div ref={box} className={styles.prep}>
    <Detail prep={prep} text={text} />
    <section className={styles.interview} aria-label={text("Interview questions", "इंटरव्यू प्रश्न")}>
      <InterviewQuestions set={set} text={text} scroll limit={limit} heading={<h4><GraduationCap size={17} aria-hidden="true" />{text("Most-asked interview questions", "सबसे ज़्यादा पूछे जाने वाले इंटरव्यू प्रश्न")}</h4>} />
    </section>
  </div>;
}

/** The four detail cards, each in its own light colour. */
function Detail({ prep, text }: Readonly<{ prep: WorkflowPrep; text: Text }>) {
  const cards: { key: string; Icon: LucideIcon; title: string; items: string[]; chips?: boolean }[] = [
    { key: "stack", Icon: Cpu, title: text("Tech stack", "टेक स्टैक"), items: prep.stack, chips: true },
    { key: "decisions", Icon: Lightbulb, title: text("Key design decisions", "मुख्य डिज़ाइन निर्णय"), items: prep.decisions },
    { key: "pitfalls", Icon: TriangleAlert, title: text("Common mistakes", "आम गलतियाँ"), items: prep.pitfalls },
    { key: "metrics", Icon: Gauge, title: text("What to measure", "क्या मापें"), items: prep.metrics },
  ];
  return <div className={styles.detail}>{cards.map(({ key, Icon, title, items, chips }) => <section key={key} className={styles.card} data-card={key} aria-label={title}>
    <h4><Icon size={15} aria-hidden="true" />{title}</h4>
    <ul className={chips ? styles.chips : styles.points}>{items.map(item => <li key={item}>{item}</li>)}</ul>
  </section>)}</div>;
}
