"use client";

import { Fragment } from "react";
import { expandAbbreviations } from "@/lib/abbreviations";
import { triggerWordLookup } from "./vocabulary-lookup-provider";
import styles from "./expanded-text.module.css";

/**
 * Prose with known abbreviations marked up as abbreviations.
 *
 * The full form appears only in a tooltip on hover or focus (user rule 2026-11-01): a pill beside the short form
 * stretched lines and broke cards into several rows.
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
          >
            <abbr title={`${part.text} stands for ${part.fullForm}`}>{part.text}</abbr>
          </span>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        )
      )}
    </>
  );
}
