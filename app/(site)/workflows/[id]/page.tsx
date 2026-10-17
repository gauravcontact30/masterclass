import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { workflow, workflowPrep, workflowQuestions, workflows } from "@/lib/public-learning";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import { QuestionList, faqData } from "@/components/public-learning/question-list";
import { WorkflowDiagram } from "@/components/workflow-diagram";
import { LearningLoader } from "@/components/learning-loader";
import home from "@/components/landing-home.module.css";
import diagram from "@/components/landing-workflows.module.css";
import styles from "@/components/public-learning/library.module.css";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return workflows().map(item => ({ id: item.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = workflow((await params).id);
  if (!item) return { title: "Blueprint not found", robots: { index: false } };
  return learningMetadata({
    path: `/workflows/${item.id}`,
    title: `${item.title}: ${item.group} blueprint and interview questions`,
    description: `${item.summary} ${item.problem} Architecture diagram, steps, tech stack, design decisions, common mistakes and 60+ interview questions with answers.`,
    keywords: [`${item.title} system design`, `${item.title} architecture`, `${item.title} interview questions`, `${item.group} workflow`],
  });
}

export default function Page({ params }: Props) {
  return <Suspense fallback={<LearningLoader size="inline" label="Loading the blueprint…" />}><Blueprint params={params} /></Suspense>;
}

async function Blueprint({ params }: Props) {
  const item = workflow((await params).id);
  if (!item) notFound();
  const prep = workflowPrep(item.id);
  const questions = await workflowQuestions(item.id);
  const all = workflows();
  const index = all.indexOf(item);
  const [previous, next] = [all[index - 1], all[index + 1]];
  const howTo = {
    "@context": "https://schema.org", "@type": "HowTo", name: item.title, description: item.summary,
    step: item.steps.map((step, i) => ({ "@type": "HowToStep", position: i + 1, text: step })),
    url: new URL(`/workflows/${item.id}`, siteUrl()).href,
  };
  return <>
    <LibraryIntro trail={[["Workflow blueprints", "/workflows"], [item.title, `/workflows/${item.id}`]]} eyebrow={`${item.group} blueprint · ${item.industry}`}
      title={item.title} lead={item.summary} schema={[howTo, faqData(questions)]}
      facts={[["Steps", item.steps.length], ["Subjective questions", questions.subjective.length], ["Objective questions", questions.objective.length]]} />
    <section className={styles.section} aria-labelledby="problem">
      <h2 id="problem">The problem and the outcome</h2>
      <div className={styles.prose}><p><strong>Problem:</strong> {item.problem}</p><p><strong>Outcome:</strong> {item.outcome}</p></div>
    </section>
    <section className={styles.section} aria-labelledby="diagram">
      <h2 id="diagram">Architecture</h2>
      <div className={`${home.home} ${diagram.canvas}`}><WorkflowDiagram workflow={item} /></div>
    </section>
    <section className={styles.section} aria-labelledby="steps">
      <h2 id="steps">How it works, step by step</h2>
      <ol className={styles.prose}>{item.steps.map(step => <li key={step}>{step}</li>)}</ol>
    </section>
    {prep && <>
      <section className={styles.section} aria-labelledby="stack"><h2 id="stack">Tech stack</h2><ul className={styles.chips}>{prep.stack.map(entry => <li key={entry}>{entry}</li>)}</ul></section>
      <section className={styles.section} aria-labelledby="decisions"><h2 id="decisions">Key design decisions</h2><ul className={styles.prose}>{prep.decisions.map(entry => <li key={entry}>{entry}</li>)}</ul></section>
      <section className={styles.section} aria-labelledby="pitfalls"><h2 id="pitfalls">Common mistakes</h2><ul className={styles.prose}>{prep.pitfalls.map(entry => <li key={entry}>{entry}</li>)}</ul></section>
      <section className={styles.section} aria-labelledby="metrics"><h2 id="metrics">What to measure</h2><ul className={styles.prose}>{prep.metrics.map(entry => <li key={entry}>{entry}</li>)}</ul></section>
    </>}
    <section className={styles.section} aria-labelledby="interview"><h2 id="interview">Most-asked interview questions</h2><QuestionList set={questions} idPrefix="q" level={3} /></section>
    <nav className={styles.next} aria-label="More blueprints">
      {previous ? <Link href={`/workflows/${previous.id}`}>← {previous.title}</Link> : <span />}
      {next && <Link href={`/workflows/${next.id}`}>{next.title} →</Link>}
    </nav>
    <div className={styles.cta}><p>Track your progress through every blueprint in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
