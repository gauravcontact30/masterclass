import Link from "next/link";
import { organizationSchema, pageMetadata } from "@/lib/seo";
import { PageIntro } from "../page-intro";
import styles from "../site.module.css";

export const metadata = pageMetadata("/about");

export default function AboutPage() {
  return <>
    <PageIntro path="/about" eyebrow="Our story" extraSchema={organizationSchema()} />
    <div className={styles.prose}>
      <h2>Why MasterClass exists</h2>
      <p>Learning a technology is scattered: official docs here, a video there, interview questions somewhere else. MasterClass Buddy brings what a tech professional needs for the next role or certification into one dashboard, so each study session starts with a clear next step instead of a search.</p>
      <h2>What you can learn</h2>
      <ul>
        <li><strong>Technology careers</strong>: handbooks, official docs explained, API references, coding labs and step-by-step build guides.</li>
        <li><strong>AI and agents</strong>: LangChain, LangGraph, LangSmith, LangFlow and n8n workflow blueprints, plus the agentic AI pulse.</li>
        <li><strong>Interviews and certifications</strong>: interview question banks, system-design case studies, quizzes and certification paths with mock exams.</li>
        <li><strong>Workplace English</strong>: IELTS practice and professional vocabulary with Hindi meanings.</li>
      </ul>
      <p>See every path on the <Link href="/courses">courses page</Link>.</p>
      <h2>How we teach</h2>
      <p>Every topic pairs a plain-language explanation with worked answers and timed practice. Content is available in English and Hindi, and you can switch language at any time. An AI study assistant can explain a concept again in a different way when you are stuck.</p>
      <h2>Our commitments</h2>
      <ul>
        <li>We say what each guide covers before you subscribe. Coverage varies by path.</li>
        <li>We keep your revision notes and bookmarks in your own browser.</li>
        <li>You can cancel renewal at any time and keep access until the end of the period you paid for.</li>
      </ul>
    </div>
    <div className={styles.banner}><p>Your next skill starts with one clear step.</p><Link className={styles.cta} href="/sign-up">Start learning</Link></div>
  </>;
}
