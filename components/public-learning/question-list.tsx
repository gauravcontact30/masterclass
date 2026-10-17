import { arrangeOptions, byStars, type QuestionSet } from "@/lib/interview-questions";
import { InlineText } from "./library-intro";
import styles from "./library.module.css";

const LETTERS = ["A", "B", "C", "D"];
const FREQUENCY = ["", "Rarely asked", "Sometimes asked", "Often asked", "Very often asked", "Asked almost every time"];

/**
 * A full interview question set as plain server HTML: subjective questions with their model answers, then
 * multiple-choice questions with the right option marked and the reason. Native <details> keeps every answer in
 * the page for search engines and readers without JavaScript, while staying compact to scan. Most-asked first.
 */
export function QuestionList({ set, idPrefix, level = 2 }: Readonly<{ set: QuestionSet; idPrefix: string; level?: 2 | 3 }>) {
  const Heading = level === 3 ? "h3" : "h2";
  return <div className={styles.questions}>
    {set.subjective.length > 0 && <section aria-labelledby={`${idPrefix}-subjective`}>
      <Heading id={`${idPrefix}-subjective`}>Subjective questions <small>{set.subjective.length}</small></Heading>
      {byStars(set.subjective).map((q, i) => <details key={q.question} className={styles.qa} id={`${idPrefix}-s${i + 1}`}>
        <summary><span className={styles.qNumber}>{i + 1}</span><span className={styles.qText}><InlineText text={q.question} /></span><span className={styles.freq} data-stars={q.stars}>{FREQUENCY[q.stars]}</span></summary>
        <div className={styles.answer}>
          {q.code && <pre><code>{q.code}</code></pre>}
          <p><InlineText text={q.answer} /></p>
          {q.source && <p className={styles.source}>{q.source}</p>}
        </div>
      </details>)}
    </section>}
    {set.objective.length > 0 && <section aria-labelledby={`${idPrefix}-objective`}>
      <Heading id={`${idPrefix}-objective`}>Objective questions <small>{set.objective.length}</small></Heading>
      {byStars(set.objective).map((q, i) => {
        const { options, answer } = arrangeOptions(q);
        return <details key={q.question} className={styles.qa} id={`${idPrefix}-o${i + 1}`}>
          <summary><span className={styles.qNumber}>{i + 1}</span><span className={styles.qText}><InlineText text={q.question} /></span><span className={styles.freq} data-stars={q.stars}>{FREQUENCY[q.stars]}</span></summary>
          <div className={styles.answer}>
            {q.code && <pre><code>{q.code}</code></pre>}
            <ol className={styles.options}>{options.map((option, k) => <li key={option} data-correct={k === answer || undefined}><b>{LETTERS[k]}</b><span><InlineText text={option} /></span>{k === answer && <em>Correct answer</em>}</li>)}</ol>
            <p><strong>Why:</strong> <InlineText text={q.why} /></p>
            {q.source && <p className={styles.source}>{q.source}</p>}
          </div>
        </details>;
      })}
    </section>}
  </div>;
}

/** FAQPage structured data for the subjective questions on a page. */
export function faqData(set: QuestionSet) {
  return {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: set.subjective.map(q => ({ "@type": "Question", name: q.question.replace(/`/g, ""), acceptedAnswer: { "@type": "Answer", text: q.answer.replace(/`/g, "") } })),
  };
}
