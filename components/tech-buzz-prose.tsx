import type { MouseEvent, ReactNode } from "react";
import { CodeFiles } from "./code-files";
import { codeFileName, FENCE, IMAGE_LINE } from "@/lib/prose-markup";
import { isInkImage } from "@/lib/tech-buzz-ink";
import styles from "./tech-buzz-prose.module.css";

/*
 * Tech Buzz paragraphs arrive as plain strings, and writers (people and the daily AI edition) put lists inside them:
 * "- item" lines, "1. step" lines, or a run like "Three fixes: 1. … 2. … 3. …" on one line. This turns those into real
 * <ol>/<ul> lists so numbering and bullets render and align properly; everything else stays a paragraph. Write's
 * toolbar adds the rest of lib/prose-markup.ts: inline marks, sub-headings, quotes, dividers, pictures and code blocks.
 */
type Block =
  | { kind: "p" | "h" | "quote"; text: string }
  | { kind: "ul" | "ol"; items: string[]; start: number }
  | { kind: "code"; language: string; name: string; code: string }
  | { kind: "img"; src: string; alt: string }
  | { kind: "hr" };

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*(\d{1,2})[.)]\s+/;
const HEADING = /^#{2,3}\s+/;
const QUOTE = /^>\s?/;
const RULE = /^(-{3,}|\*{3,})$/;

/** "Intro: 1. a 2. b 3. c" on one line → the intro, then each numbered item on its own line. */
function splitInlineNumbering(line: string): string[] {
  const marks = [...line.matchAll(/(?:^|\s)(\d{1,2})[.)]\s+(?=\S)/g)];
  // Only a run counting up from 1 is a list; "Node.js 22. Next" or a lone "2. " is not.
  const run = marks.filter((mark, index) => Number(mark[1]) === index + 1);
  if (run.length < 2 || run.length !== marks.length) return [line];
  const cuts = run.map(mark => mark.index! + (mark[0].startsWith(" ") ? 1 : 0));
  const parts = [line.slice(0, cuts[0]).trim(), ...cuts.map((cut, index) => line.slice(cut, cuts[index + 1]).trim())];
  return parts.filter(Boolean);
}

function lineBlocks(text: string, blocks: Block[]) {
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean)
    .flatMap(line => HEADING.test(line) || QUOTE.test(line) || IMAGE_LINE.test(line) ? [line] : splitInlineNumbering(line));
  for (const line of lines) {
    const picture = line.match(IMAGE_LINE);
    if (picture) { if (isInkImage(picture[2])) blocks.push({ kind: "img", alt: picture[1], src: picture[2] }); continue; }
    if (RULE.test(line)) { blocks.push({ kind: "hr" }); continue; }
    if (HEADING.test(line)) { blocks.push({ kind: "h", text: line.replace(HEADING, "") }); continue; }
    if (QUOTE.test(line)) {
      const previous = blocks.at(-1), quoted = line.replace(QUOTE, "");
      if (previous?.kind === "quote") previous.text += `\n${quoted}`; else blocks.push({ kind: "quote", text: quoted });
      continue;
    }
    const numbered = line.match(NUMBERED);
    const kind = numbered ? "ol" : BULLET.test(line) ? "ul" : "p";
    if (kind === "p") { blocks.push({ kind, text: line }); continue; }
    const item = line.replace(kind === "ol" ? NUMBERED : BULLET, "");
    const previous = blocks.at(-1);
    if (previous && previous.kind === kind) previous.items.push(item);
    else blocks.push({ kind, items: [item], start: numbered ? Number(numbered[1]) : 1 });
  }
}

export function proseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let at = 0;
  for (const fence of text.matchAll(FENCE)) {
    lineBlocks(text.slice(at, fence.index), blocks);
    blocks.push({ kind: "code", language: fence[1], name: fence[2], code: fence[3] });
    at = fence.index! + fence[0].length;
  }
  lineBlocks(text.slice(at), blocks);
  return blocks;
}

// **bold**, ~~strike~~, `code`, [text](https://…) and *italic*; a lone "*" (as in "a * b") stays a star.
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(~~[^~\n]+?~~)|(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))|((?<![\w*])\*(?![\s*])[^*\n]+?(?<!\s)\*(?![\w*]))/g;

/** A line of text with its inline marks drawn. */
export function Inline({ text }: { text: string }): ReactNode {
  const out: ReactNode[] = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > at) out.push(text.slice(at, match.index));
    const token = match[0], key = match.index;
    if (match[1]) out.push(<code key={key} className={styles.inlineCode}>{token.slice(1, -1)}</code>);
    else if (match[2]) out.push(<strong key={key}><Inline text={token.slice(2, -2)} /></strong>);
    else if (match[3]) out.push(<s key={key}><Inline text={token.slice(2, -2)} /></s>);
    else if (match[4]) {
      const split = token.indexOf("](");
      out.push(<a key={key} className={styles.link} href={token.slice(split + 2, -1)} target="_blank" rel="noopener noreferrer nofollow ugc"><Inline text={token.slice(1, split)} /></a>);
    } else out.push(<em key={key}><Inline text={token.slice(1, -1)} /></em>);
    at = match.index + token.length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

// A click inside a code block or picture copies or selects; it must not start the read-aloud the paragraph listens for.
const keep = (event: MouseEvent) => event.stopPropagation();

/** One paragraph string rendered as paragraphs, lists and the blocks above, with the given class names. */
export function ProseText({ text, paragraphClass, listClass, orderedClass }: { text: string; paragraphClass: string; listClass: string; orderedClass: string }): ReactNode {
  return proseBlocks(text).map((block, index) => {
    switch (block.kind) {
      case "p": return <p key={index} className={paragraphClass}><Inline text={block.text} /></p>;
      case "h": return <h3 key={index} className={styles.subheading}><Inline text={block.text} /></h3>;
      case "quote": return <blockquote key={index} className={styles.quote}>{block.text.split("\n").map((line, i) => <p key={i}><Inline text={line} /></p>)}</blockquote>;
      case "hr": return <hr key={index} className={styles.rule} />;
      case "img": return <figure key={index} className={styles.figure} onClick={keep}>
        {/* eslint-disable-next-line @next/next/no-img-element -- writers' pictures live in Supabase Storage */}
        <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />
        {block.alt && <figcaption>{block.alt}</figcaption>}
      </figure>;
      case "code": return <div key={index} className={styles.codeBlock} onClick={keep}>
        <CodeFiles files={[{ path: codeFileName(block.language, block.name), code: block.code, note: "" }]} skin="apple" annotate={false} label={block.name || block.language || "Code"} />
      </div>;
      case "ol": return <ol key={index} className={orderedClass} start={block.start === 1 ? undefined : block.start}>{block.items.map((item, i) => <li key={i}><Inline text={item} /></li>)}</ol>;
      default: return <ul key={index} className={listClass}>{block.items.map((item, i) => <li key={i}><Inline text={item} /></li>)}</ul>;
    }
  });
}

/** A list item without the "1." or "-" a writer may have typed before it (the list draws its own). */
export const listItem = (text: string) => text.replace(NUMBERED, "").replace(BULLET, "").trim();

type SectionLists = { steps?: string[]; bulletPoints?: string[]; callout?: { type: "tip" | "insight" | "warning"; text: string } };
const CALLOUT_LABEL = { tip: "Tip", insight: "Insight", warning: "Watch out" } as const;

/** A section's numbered steps, bullet points and callout, in that order, with the article's prose classes. */
export function SectionLists({ section, classes }: { section: SectionLists; classes: { ordered: string; list: string; label: string; callout: string } }): ReactNode {
  return <>
    {section.steps?.length ? <>
      <p className={classes.label}>Step by step</p>
      <ol className={classes.ordered}>{section.steps.map((step, i) => <li key={i}><Inline text={listItem(step)} /></li>)}</ol>
    </> : null}
    {section.bulletPoints?.length ? <ul className={classes.list}>{section.bulletPoints.map((point, i) => <li key={i}><Inline text={listItem(point)} /></li>)}</ul> : null}
    {section.callout?.text ? <aside className={classes.callout} data-type={section.callout.type}>
      <strong>{CALLOUT_LABEL[section.callout.type] ?? "Note"}</strong> <Inline text={section.callout.text} />
    </aside> : null}
  </>;
}

/**
 * The story's learning summary, open to every reader: its key takeaways as a numbered list, the editor's score from
 * the pre-publish review, and the official documentation it was researched from (named, never linked).
 */
export function KeyTakeaways({ takeaways, editorScore, basedOn, classes }: {
  takeaways: string[]; editorScore?: number; basedOn?: { title: string; site: string }[];
  classes: { box: string; heading: string; ordered: string; score: string; sources: string };
}): ReactNode {
  if (!takeaways.length && !basedOn?.length) return null;
  return <section className={classes.box} aria-label="Key takeaways">
    <div className={classes.heading}>
      <span>What you will learn</span>
      {editorScore ? <span className={classes.score} title="Score from the editor's review before publishing; stories need 4 out of 5 to go live">
        <span aria-hidden="true">{"★".repeat(Math.round(editorScore))}{"☆".repeat(5 - Math.round(editorScore))}</span> {editorScore.toFixed(1)}/5 editor review
      </span> : null}
    </div>
    {takeaways.length ? <ol className={classes.ordered}>{takeaways.map((item, i) => <li key={i}><Inline text={listItem(item)} /></li>)}</ol> : null}
    {basedOn?.length ? <div className={classes.sources}>
      <span>Researched from the official documentation</span>
      <ul>{basedOn.map(source => <li key={`${source.site}${source.title}`}>{source.title} <small>({source.site})</small></li>)}</ul>
    </div> : null}
  </section>;
}
