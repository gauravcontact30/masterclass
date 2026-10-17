"use client";
import { Fragment, useState, type ReactNode } from "react";
import { ChevronDown, CircleCheck, ListChecks, MessageSquareText } from "lucide-react";
import { arrangeOptions, byStars, type QuestionSet, type Stars } from "@/lib/interview-questions";
import styles from "./interview-accordion.module.css";

type Text = (en: string, hindi: string) => string;
type Mode = "subjective" | "objective";
const LETTERS = ["A", "B", "C", "D"];

/**
 * Subjective and objective interview questions behind a two-way switch, most asked first, each rated in stars
 * and opened like an accordion. Colours come from the parent's --deep and --tint. Used by the Workflow
 * blueprints and the interview carousel on the landing page.
 */
export function InterviewQuestions({ set, text, heading, scroll = false }: Readonly<{ set: QuestionSet; text: Text; heading?: ReactNode; scroll?: boolean }>) {
  const [mode, setMode] = useState<Mode>(set.subjective.length || !set.objective.length ? "subjective" : "objective");
  return <div className={styles.wrap}>
    <header className={styles.head}>
      {heading}
      {/* A set with only one kind (the comparison banks are all subjective) needs no switch. */}
      {set.subjective.length > 0 && set.objective.length > 0 && <div className={styles.modes} role="group" aria-label={text("Question type", "प्रश्न का प्रकार")}>
        <button type="button" aria-pressed={mode === "subjective"} onClick={() => setMode("subjective")}><MessageSquareText size={14} aria-hidden="true" />{text("Subjective", "विषयगत")}<span>{set.subjective.length}</span></button>
        <button type="button" aria-pressed={mode === "objective"} onClick={() => setMode("objective")}><ListChecks size={14} aria-hidden="true" />{text("Objective", "वस्तुनिष्ठ")}<span>{set.objective.length}</span></button>
      </div>}
    </header>
    <p className={styles.key}><StarRow stars={5} />{text("= asked almost every time. Open a question to see the answer.", "= लगभग हर बार पूछा जाता है। उत्तर देखने के लिए प्रश्न खोलें।")}</p>
    {/* Keyed by mode so switching starts with every row closed and the list scrolled to the top. */}
    <div key={mode} className={styles.list} data-scroll={scroll}>
      {mode === "subjective"
        ? byStars(set.subjective).map((q, i) => <Item key={q.question} n={i + 1} stars={q.stars} question={q.question} text={text}>
          {q.code && <pre className={styles.code}><code>{q.code}</code></pre>}
          <p className={styles.answer}><Inline text={q.answer} /></p>
          {q.source && <p className={styles.source}>{q.source}</p>}
        </Item>)
        : byStars(set.objective).map((q, i) => {
          const { options, answer } = arrangeOptions(q);
          return <Item key={q.question} n={i + 1} stars={q.stars} question={q.question} text={text}>
            {q.code && <pre className={styles.code}><code>{q.code}</code></pre>}
            <ol className={styles.options}>{options.map((option, k) => <li key={option} data-correct={k === answer}>
              <b aria-hidden="true">{LETTERS[k]}</b><span><Inline text={option} /></span>
              {k === answer && <em><CircleCheck size={14} aria-hidden="true" />{text("Correct", "सही")}</em>}
            </li>)}</ol>
            <p className={styles.why}><b>{text("Why", "क्यों")}</b> <Inline text={q.why} /></p>
            {q.source && <p className={styles.source}>{q.source}</p>}
          </Item>;
        })}
    </div>
  </div>;
}

/** One accordion row: number, question and stars as the summary; the answer inside. */
function Item({ n, stars, question, text, children }: Readonly<{ n: number; stars: Stars; question: string; text: Text; children: ReactNode }>) {
  return <details className={styles.item}>
    <summary>
      <span className={styles.num} aria-hidden="true">{String(n).padStart(2, "0")}</span>
      <span className={styles.q}><Inline text={question} /></span>
      <StarRow stars={stars} label={text(`Asked often: ${stars} of 5`, `कितनी बार पूछा जाता है: 5 में से ${stars}`)} />
      <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
    </summary>
    <div className={styles.body}>{children}</div>
  </details>;
}

/** Five stars, `stars` of them filled; decorative when there is no label. */
export function StarRow({ stars, label }: Readonly<{ stars: number; label?: string }>) {
  return <span className={styles.stars} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
    {Array.from({ length: 5 }, (_, i) => <i key={i} data-on={i < stars}>★</i>)}
  </span>;
}

/** Text with `inline code` in backticks shown as code. */
export function Inline({ text }: Readonly<{ text: string }>) {
  const parts = text.split("`");
  return <>{parts.map((part, i) => i % 2 ? <code key={i} className={styles.inline}>{part}</code> : <Fragment key={i}>{part}</Fragment>)}</>;
}
