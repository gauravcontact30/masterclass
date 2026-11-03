import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import { ArrowRight, CircleHelp } from "lucide-react";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./page-answers.module.css";
import { AnswerList } from "./page-answers";
import { landingAnswers } from "@/lib/page-answers";
import { readableDate } from "@/lib/seo";

/**
 * Questions and answers, the last section before the footer. A server component: its text is in the HTML for readers
 * and answer engines, and nothing here hydrates. The title is an h3 styled as a section heading (the page keeps 9 h2s).
 */
export function LandingAnswers({ monthly, yearly, updated }: Readonly<{ monthly: number; yearly: number; updated: string }>) {
  return <section id="questions" className={frame.section} data-ground="wash" aria-labelledby="questions-title">
    <div className={home.inner}>
      <div className={styles.head}>
        <p className={frame.kicker}><CircleHelp size={14} aria-hidden="true" />Questions</p>
        <h3 data-h2="" id="questions-title">Everything people ask <em>before they start.</em></h3>
        <p className={frame.lede}>Straight answers about what MasterClass Buddy teaches, what you can read for free, what membership costs and how to begin. If yours is not here, the Contact page lists more answers and every way to reach support.</p>
        <p className={styles.updated}>Last updated <time dateTime={updated}>{readableDate(updated)}</time>. New content arrives every Monday at 00:00 IST.</p>
      </div>
      <div className={styles.landing}><AnswerList answers={landingAnswers({ monthly, yearly })} closing={<div className={styles.item}>
        <Image className={styles.icon} src="/images/landing/answers/ask.png" alt="" width={96} height={96} loading="lazy" />
        <div className={styles.askTitle}>Still have a question?</div>
        <p>Write, call or message us on Instagram. The Contact page lists every way to reach support.</p>
        <Link className={styles.askLink} href="/contact" prefetch={false}>Contact support<ArrowRight size={15} aria-hidden="true" /></Link>
      </div>} /></div>
    </div>
  </section>;
}
