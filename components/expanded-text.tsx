import { Fragment } from "react";
import { expandAbbreviations } from "@/lib/abbreviations";
import styles from "./expanded-text.module.css";

/** Use for display prose only; never change stored content, code or input values. */
export function ExpandedText({ text }: { text: string }) {
  return <>{expandAbbreviations(text).map((part, index) => part.fullForm ? <Fragment key={index}><abbr className={styles.term} title={part.fullForm}>{part.text}</abbr><span className={styles.pill} data-tone={Array.from(part.fullForm).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 6, 0)} aria-hidden="true">{part.fullForm}</span></Fragment> : <Fragment key={index}>{part.text}</Fragment>)}</>;
}
