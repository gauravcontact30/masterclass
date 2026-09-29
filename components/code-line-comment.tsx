import styles from "./code-line-comment.module.css";

/** Reading notes stay outside the source used by Copy and Run actions. */
export function CodeLineComment({ note }: { note: string | null | undefined }) {
  if (!note) return null;
  return <span className={styles.comment} data-code-comment><span aria-hidden="true">{"// "}</span>{note}</span>;
}
