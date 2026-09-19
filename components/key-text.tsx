import { Fragment, memo } from "react";
import { proseTokens } from "@/lib/code-highlight";
import { ExpandedText } from "./expanded-text";
import styles from "./key-text.module.css";

/**
 * Prose with the code-shaped parts picked out: `useLinkStatus`, `router.push`,
 * `loading.tsx`, `prefetch={false}`. Scanning a bullet list for the identifier
 * that matters is the whole point, so those runs get a chip and the rest keeps
 * the normal abbreviation expansion.
 *
 * Display only. It never changes stored content, code or input values.
 */
function KeyTextView({ text }: { text: string }) {
  return (
    <>
      {proseTokens(text).map((token, index) =>
        token.code ? (
          <code className={styles.chip} key={index}>
            {token.text}
          </code>
        ) : (
          <Fragment key={index}>
            <ExpandedText text={token.text} />
          </Fragment>
        ),
      )}
    </>
  );
}

export const KeyText = memo(KeyTextView);
