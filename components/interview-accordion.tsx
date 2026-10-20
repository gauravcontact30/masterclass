"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";
import { Fragment, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck, ListChecks, MessageSquareText } from "lucide-react";
import { arrangeOptions, byStars, type QuestionSet, type Stars } from "@/lib/interview-questions";
import styles from "./interview-accordion.module.css";
import { Editable, useContentItem, useVisibleContent } from "./content-editing";

/** A stable key per built-in question (they have no ids): FNV-1a of the question text. */
function questionKey(q: { question: string }) {
  let h = 0x811c9dc5;
  for (let i = 0; i < q.question.length; i++) { h ^= q.question.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return `question:${(h >>> 0).toString(36)}`;
}
const inline = (value: string) => <Inline text={value} />;

type Text = (en: string, hindi: string) => string;
type Mode = "subjective" | "objective";
const LETTERS = ["A", "B", "C", "D"];

/**
 * Subjective and objective interview questions behind a two-way switch, most asked first, each rated in stars
 * and opened like an accordion. Colours come from the parent's --deep and --tint. Used by the Workflow
 * blueprints and the interview carousel on the landing page.
 * `limit` shows only the most asked few of each kind (the landing preview), with a link to the full set at `moreHref`.
 */
export function InterviewQuestions({ set, text, heading, scroll = false, limit, moreHref = "/dashboard" }: Readonly<{ set: QuestionSet; text: Text; heading?: ReactNode; scroll?: boolean; limit?: number; moreHref?: string }>) {
  const [mode, setMode] = useState<Mode>(set.subjective.length || !set.objective.length ? "subjective" : "objective");
  const cap = <T,>(list: T[]) => limit ? list.slice(0, limit) : list;
  const subjective = useVisibleContent(set.subjective, questionKey);
  const objective = useVisibleContent(set.objective, questionKey);
  const total = mode === "subjective" ? subjective.length : objective.length;
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
        ? cap(byStars(subjective)).map((q, i) => <Item key={q.question} k={questionKey(q)} n={i + 1} stars={q.stars} question={q.question} text={text}>
          {q.code && <pre className={styles.code}><code>{q.code}</code></pre>}
          <p className={styles.answer}><Editable k={questionKey(q)} f="answer" multiline render={inline}>{q.answer}</Editable></p>
          {q.source && <p className={styles.source}>{q.source}</p>}
        </Item>)
        : cap(byStars(objective)).map((q, i) => {
          const { options, answer } = arrangeOptions(q);
          return <Item key={q.question} k={questionKey(q)} n={i + 1} stars={q.stars} question={q.question} text={text}>
            {q.code && <pre className={styles.code}><code>{q.code}</code></pre>}
            <ol className={styles.options}>{options.map((option, k) => <li key={option} data-correct={k === answer}>
              <b aria-hidden="true">{LETTERS[k]}</b><span><Inline text={option} /></span>
              {k === answer && <em><CircleCheck size={14} aria-hidden="true" />{text("Correct", "सही")}</em>}
            </li>)}</ol>
            <p className={styles.why}><b>{text("Why", "क्यों")}</b> <Editable k={questionKey(q)} f="why" multiline render={inline}>{q.why}</Editable></p>
            {q.source && <p className={styles.source}>{q.source}</p>}
          </Item>;
        })}
    </div>
    {limit && total > limit && <Link className={styles.more} href={moreHref}>
      {text(`Showing the ${limit} most asked of ${total}. See all ${total} ${mode} questions in the dashboard`, `सबसे ज़्यादा पूछे गए ${limit} / ${total}। डैशबोर्ड में सभी ${total} ${mode === "subjective" ? "विषयगत" : "वस्तुनिष्ठ"} प्रश्न देखें`)}
      <ArrowRight size={15} aria-hidden="true" />
    </Link>}
  </div>;
}

/** One accordion row: number, question and stars as the summary; the answer inside. */
function Item({ k, n, stars, question, text, children }: Readonly<{ k: string; n: number; stars: Stars; question: string; text: Text; children: ReactNode }>) {
  const item = useContentItem(k, "question");
  // The toolbar sits inside the summary: anything after it is hidden while the question is closed.
  return <details className={styles.item} {...item.props}>
    <AccordionSummary>
      {item.toolbar}
      <span className={styles.num} aria-hidden="true">{String(n).padStart(2, "0")}</span>
      <span className={styles.q}><Editable k={k} f="question" multiline render={inline}>{question}</Editable></span>
      <StarRow stars={stars} label={text(`Asked often: ${stars} of 5`, `कितनी बार पूछा जाता है: 5 में से ${stars}`)} />
    </AccordionSummary>
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
