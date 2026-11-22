import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import { ArrowRight, CheckCircle2, MessageSquareText, Sparkles } from "lucide-react";
import { PageAnswers } from "@/components/page-answers";
import { JsonLd } from "@/components/json-ld";
import { EXAM_GUIDES, type ExamGuidePath } from "@/lib/exam-guides";
import { INDIA_ONLY_PAGES, publicPage, siteName, siteUrl } from "@/lib/seo";
import { IndiaOnly } from "./india-only";
import { PageIntro } from "@/app/(site)/page-intro";
import styles from "./exam-guide.module.css";

const OTHER_LABEL: Record<ExamGuidePath, string> = {
  "/board-exams": "Board Exams", "/competitive-exams": "Competitive Exams", "/tet-exam": "TET Exams", "/ielts-preparation": "IELTS Preparation",
};

/** Course structured data for a guide: what it teaches, in which languages, from whom, and the free trial. */
function courseSchema(path: ExamGuidePath) {
  const guide = EXAM_GUIDES[path], page = publicPage(path), origin = siteUrl().href;
  return {
    "@context": "https://schema.org", "@type": "Course", name: guide.courseName, description: page.description, url: new URL(path, origin).href,
    inLanguage: path === "/ielts-preparation" ? ["en"] : ["en", "hi"], teaches: guide.teaches, educationalLevel: path === "/board-exams" ? "Secondary school (Class 10 and 12)" : "Professional",
    provider: { "@type": "Organization", name: siteName, url: origin },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT1H" },
    offers: { "@type": "Offer", category: "Subscription", price: 0, priceCurrency: "INR", description: "One-day free trial, then membership", availability: "https://schema.org/InStock" },
    image: new URL(guide.image, origin).href,
  };
}

/**
 * A public exam guide (Board Exams, Competitive Exams, TET, IELTS): intro with WebPage, Breadcrumb and Course data,
 * a hero picture, what the dashboard holds, sample questions with answers (question and answer in their own light
 * themes), the FAQ with FAQPage data, and links to the dashboard and the other guides.
 */
export function ExamGuide({ path }: { path: ExamGuidePath }) {
  const guide = EXAM_GUIDES[path];
  return <div className={styles.guide}>
    <PageIntro path={path} eyebrow={guide.eyebrow} extraSchema={courseSchema(path)} />
    <div className={styles.hero}>
      <Image src={guide.image} alt={guide.imageAlt} width={guide.imageSize[0]} height={guide.imageSize[1]} priority sizes="(max-width: 960px) 100vw, 880px" className={styles.heroImage} />
    </div>
    <div className={styles.ctaRow}>
      <Link className={styles.cta} href={guide.dashboard}>{guide.cta}<ArrowRight size={16} aria-hidden="true" /></Link>
      <span>Full access for 24 hours after you sign up, then a membership.</span>
    </div>

    <section aria-labelledby="guide-covers" className={styles.section}>
      <h2 id="guide-covers">What you get</h2>
      <ul className={styles.covers}>{guide.covers.map(item => <li key={item.title}><CheckCircle2 size={18} aria-hidden="true" /><div><h3>{item.title}</h3><p>{item.text}</p></div></li>)}</ul>
    </section>

    <section aria-labelledby="guide-samples" className={styles.section}>
      <h2 id="guide-samples">Sample questions with answers</h2>
      <p className={styles.note}>A free preview. The dashboard holds the full, searchable bank.</p>
      <ol className={styles.samples}>{guide.samples.map((item, index) => <li key={item.q}>
        <div className={styles.q}><span className={styles.tag}>{item.tag}</span><p><b>Q{index + 1}.</b> {item.q}</p></div>
        <div className={styles.a}><MessageSquareText size={15} aria-hidden="true" /><p>{item.a}</p></div>
      </li>)}</ol>
    </section>

    <PageAnswers answers={guide.answers} />

    <nav aria-label="More exam guides" className={styles.more}>
      <h2><Sparkles size={16} aria-hidden="true" />More exam guides</h2>
      <ul>{(Object.keys(EXAM_GUIDES) as ExamGuidePath[]).filter(other => other !== path).map(other => { const item = <li key={other}><Link href={other}>{OTHER_LABEL[other]}<ArrowRight size={14} aria-hidden="true" /></Link></li>;
          // Board, Competitive and TET guides are for visitors in India only.
          return INDIA_ONLY_PAGES.has(other) ? <IndiaOnly key={other}>{item}</IndiaOnly> : item; })}
        <li><Link href="/vocabulary">English vocabulary<ArrowRight size={14} aria-hidden="true" /></Link></li><li><Link href="/library">Free library<ArrowRight size={14} aria-hidden="true" /></Link></li></ul>
    </nav>
  </div>;
}
