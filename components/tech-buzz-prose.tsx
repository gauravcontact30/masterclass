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
