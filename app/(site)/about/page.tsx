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
      <p>Preparation is scattered: a textbook here, a video there, practice questions somewhere else. MasterClass brings the pieces you need for your next goal into one dashboard, so each study session starts with a clear next step instead of a search.</p>
      <h2>What you can learn</h2>
      <ul>
        <li><strong>School foundations</strong> for CBSE, NCERT, ICSE and ISC students from Class 6 to Class 12.</li>
        <li><strong>Competitive exams</strong> including SSC, banking, railways, defence, teaching, state exams, JEE and NEET.</li>
        <li><strong>Language skills</strong>: IELTS practice and English vocabulary with Hindi meanings.</li>
        <li><strong>Technology careers</strong>: handbooks, coding labs, interview practice and system-design case studies.</li>
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
