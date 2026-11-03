import { CircleHelp } from "lucide-react";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./page-answers.module.css";
import { AnswerList } from "./page-answers";
import { landingAnswers } from "@/lib/page-answers";
import { readableDate } from "@/lib/seo";

/** Neutral references for what the page teaches (user decision 2026-11-03): standards bodies and encyclopedias, never a vendor's site. */
const REFERENCES = [
  ["Web standards at W3C", "https://www.w3.org/standards/"],
  ["HTTP semantics, RFC 9110", "https://www.rfc-editor.org/rfc/rfc9110"],
  ["Software agents", "https://en.wikipedia.org/wiki/Software_agent"],
  ["Systems design", "https://en.wikipedia.org/wiki/Systems_design"],
] as const;

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
      <div className={styles.landing}><AnswerList answers={landingAnswers({ monthly, yearly })} /></div>
      <p className={styles.references}>Further reading: {REFERENCES.map(([label, href], at) => <span key={href}>{at > 0 && ", "}<a href={href} target="_blank" rel="noopener noreferrer">{label}</a></span>)}.</p>
    </div>
  </section>;
}
