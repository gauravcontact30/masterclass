import type { ReactNode } from "react";

/*
 * Tech Buzz paragraphs arrive as plain strings, and writers (people and the daily AI edition) put lists inside them:
 * "- item" lines, "1. step" lines, or a run like "Three fixes: 1. … 2. … 3. …" on one line. This turns those into real
 * <ol>/<ul> lists so numbering and bullets render and align properly; everything else stays a paragraph.
 */
type Block = { kind: "p"; text: string } | { kind: "ul" | "ol"; items: string[]; start: number };

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*(\d{1,2})[.)]\s+/;

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

export function proseBlocks(text: string): Block[] {
  const lines = text.split(/\n+/).flatMap(splitInlineNumbering).map(line => line.trim()).filter(Boolean);
  const blocks: Block[] = [];
  for (const line of lines) {
    const numbered = line.match(NUMBERED);
    const kind = numbered ? "ol" : BULLET.test(line) ? "ul" : "p";
    if (kind === "p") { blocks.push({ kind, text: line }); continue; }
    const item = line.replace(kind === "ol" ? NUMBERED : BULLET, "");
    const previous = blocks.at(-1);
    if (previous && previous.kind === kind) previous.items.push(item);
    else blocks.push({ kind, items: [item], start: numbered ? Number(numbered[1]) : 1 });
  }
  return blocks;
}

/** One paragraph string rendered as paragraphs and lists, with the given class names. */
export function ProseText({ text, paragraphClass, listClass, orderedClass }: { text: string; paragraphClass: string; listClass: string; orderedClass: string }): ReactNode {
  return proseBlocks(text).map((block, index) => block.kind === "p"
    ? <p key={index} className={paragraphClass}>{block.text}</p>
    : block.kind === "ol"
      ? <ol key={index} className={orderedClass} start={block.start === 1 ? undefined : block.start}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ol>
      : <ul key={index} className={listClass}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>);
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
      <ol className={classes.ordered}>{section.steps.map((step, i) => <li key={i}>{listItem(step)}</li>)}</ol>
    </> : null}
    {section.bulletPoints?.length ? <ul className={classes.list}>{section.bulletPoints.map((point, i) => <li key={i}>{listItem(point)}</li>)}</ul> : null}
    {section.callout?.text ? <aside className={classes.callout} data-type={section.callout.type}>
      <strong>{CALLOUT_LABEL[section.callout.type] ?? "Note"}</strong> {section.callout.text}
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
    {takeaways.length ? <ol className={classes.ordered}>{takeaways.map((item, i) => <li key={i}>{listItem(item)}</li>)}</ol> : null}
    {basedOn?.length ? <div className={classes.sources}>
      <span>Researched from the official documentation</span>
      <ul>{basedOn.map(source => <li key={`${source.site}${source.title}`}>{source.title} <small>({source.site})</small></li>)}</ul>
    </div> : null}
  </section>;
}
