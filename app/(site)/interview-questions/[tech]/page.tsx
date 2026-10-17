import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { interviewBanks, interviewTech, interviewTechs } from "@/lib/public-learning";
import { learningMetadata } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import { QuestionList, faqData } from "@/components/public-learning/question-list";
import { LearningLoader } from "@/components/learning-loader";
import styles from "@/components/public-learning/library.module.css";

type Props = { params: Promise<{ tech: string }> };

export function generateStaticParams() {
  return interviewTechs().map(tech => ({ tech: tech.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tech = interviewTech((await params).tech);
  if (!tech) return { title: "Interview questions not found", robots: { index: false } };
  return learningMetadata({
    path: `/interview-questions/${tech.id}`,
    title: `${tech.title} interview questions and answers`,
    description: `Most-asked ${tech.title} interview questions with model answers and multiple-choice practice: ${tech.tagline}`,
    keywords: [`${tech.title} interview questions`, `${tech.title} interview questions and answers`, `${tech.title} MCQ`, `${tech.title} questions for experienced`],
  });
}

export default function Page({ params }: Props) {
  return <Suspense fallback={<LearningLoader size="inline" label="Loading the questions…" />}><TechQuestions params={params} /></Suspense>;
}

async function TechQuestions({ params }: Props) {
  const tech = interviewTech((await params).tech);
  if (!tech) notFound();
  const banks = await interviewBanks(tech);
  const all = { subjective: banks.flatMap(bank => bank.set.subjective), objective: banks.flatMap(bank => bank.set.objective) };
  const techs = interviewTechs();
  const index = techs.indexOf(tech);
  const [previous, next] = [techs[index - 1], techs[index + 1]];
  return <>
    <LibraryIntro trail={[["Interview questions", "/interview-questions"], [tech.title, `/interview-questions/${tech.id}`]]} eyebrow="Interview questions with answers"
      title={`${tech.title} interview questions and answers`} lead={`${tech.tagline} Open any question to read its model answer; the multiple-choice set marks the right option and explains it.`}
      facts={[["Subjective", all.subjective.length], ["Objective", all.objective.length]]} schema={faqData(all)} />
    {banks.length > 1
      ? banks.map((bank, i) => <section key={bank.title} className={styles.section} aria-labelledby={`bank-${i}`}><h2 id={`bank-${i}`}>{bank.title}</h2><p className={styles.meta}>{bank.tagline}</p><QuestionList set={bank.set} idPrefix={`bank-${i}`} level={3} /></section>)
      : <QuestionList set={all} idPrefix="q" />}
    <nav className={styles.next} aria-label="More interview questions">
      {previous ? <Link href={`/interview-questions/${previous.id}`}>← {previous.title}</Link> : <span />}
      {next && <Link href={`/interview-questions/${next.id}`}>{next.title} →</Link>}
    </nav>
    <div className={styles.cta}><p>Track what you have practised and search every bank in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
