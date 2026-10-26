"use client";

import { Fragment } from "react";
import { expandAbbreviations } from "@/lib/abbreviations";
import { triggerWordLookup } from "./vocabulary-lookup-provider";
import styles from "./expanded-text.module.css";

/**
 * Prose with known abbreviations marked up as abbreviations.
 *
 * The full form is shown in a compact pill beside the short form. This keeps
 * navigation and learning content concise while making the meaning visible
 * without requiring a hover or tooltip.
 *
 * Use for display prose only; never change stored content, code or input values.
 */
export function ExpandedText({ text }: { text: string }) {
  if (!text) return null;
  return (
    <>
      {expandAbbreviations(text).map((part, index) =>
        part.fullForm ? (
          <span
            key={index}
            className={styles.term}
            onClick={(e) => {
              e.stopPropagation();
              triggerWordLookup(part.fullForm || part.text);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                triggerWordLookup(part.fullForm || part.text);
              }
            }}
            title={`Click to inspect “${part.text}” (${part.fullForm}) in Vocabulary`}
          >
            <abbr title={part.fullForm}>{part.text}</abbr>
            <span className={styles.fullForm}>
              {part.fullForm}
            </span>
          </span>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        )
      )}
    </>
  );
}
