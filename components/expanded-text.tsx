import { Fragment } from "react";
import { expandAbbreviations } from "@/lib/abbreviations";
import styles from "./expanded-text.module.css";

/**
 * Prose with known abbreviations marked up as abbreviations.
 *
 * The full form lives in the `title`, not in the sentence. Spelling every term
 * out inline doubled the text at 500-odd call sites — "API Application
 * Programming Interface" in nav labels, headings and buttons — which cost more
 * in reading than it bought in clarity. The dotted underline advertises that
 * the expansion is there; hover, focus or a screen reader retrieves it.
 *
 * Use for display prose only; never change stored content, code or input values.
 */
export function ExpandedText({ text }: { text: string }) {
  return <>{expandAbbreviations(text).map((part, index) => part.fullForm
    ? <abbr key={index} className={styles.term} title={part.fullForm}>{part.text}</abbr>
    : <Fragment key={index}>{part.text}</Fragment>)}</>;
}
