/**
 * One learning card written from a card's official documentation page.
 *
 * The model returns a draft in which every key point and gotcha carries a short
 * `evidence` quote from the page it fetched. The draft becomes a card only after
 * verifyDraft has checked each quote against the fetched text: a point whose
 * quote is not on an official page is dropped, and a card left with fewer than
 * MIN_VERIFIED_POINTS is rejected, because an unsupported point is exactly the
 * thing this content exists to replace. The quotes stay in the run report and
 * never reach the site, and points copied word for word from the page are
 * dropped too: the cards teach in their own words and link to the source.
 *
 * Field caps match searchAnswerSchema's, so a card fits the Search modal.
 */
import { z } from "zod";
import { isOfficialUrl, type DomainPolicy } from "./domains";

// Over-long prose is clipped rather than rejected: one wordy sentence should not
// cost a card its verified points. Code is never clipped (a cut snippet is wrong
// code); withOfficialCard leaves out an example too long for the Search modal.
const text = (max: number) => z.string().transform(value => value.trim().slice(0, max));
const atMost = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item).transform(items => items.slice(0, max));
const backed = z.object({ text: text(300), evidence: z.string() });

export const officialDraftSchema = z.object({
  found: z.boolean(),
  sourceUrl: z.string().trim(),
  sourceTitle: text(200),
  summary: text(500),
  explanation: text(700),
  syntax: z.string(),
  parameters: atMost(z.object({ name: text(120), type: text(200), description: text(400) }), 12),
  returns: text(400),
  keyPoints: atMost(backed, 8),
  gotchas: atMost(backed, 4),
  example: z.object({ title: text(120), code: z.string(), language: text(20), explanation: text(700) }),
  useCases: atMost(z.object({ title: text(120), scenario: text(500) }), 4),
  related: atMost(text(120), 8),
  since: text(60),
  /** Interview preparation: likely questions with a model answer and a follow-up. Defaulted so cards written before it still load. */
  interview: z.array(z.object({ question: text(240), answer: text(900), followUp: text(500) })).default([]).transform(items => items.slice(0, 4)),
});
export type OfficialDraft = z.infer<typeof officialDraftSchema>;

export const officialCardSchema = officialDraftSchema.omit({ found: true, keyPoints: true, gotchas: true }).extend({
  keyPoints: z.array(z.string()).min(1),
  gotchas: z.array(z.string()),
  checkedAt: z.string(),
});
export type OfficialCard = z.infer<typeof officialCardSchema>;

/** A page the model fetched during research: its URL and the text it was given. */
export type FetchedPage = { url: string; text: string };

export const MIN_VERIFIED_POINTS = 3;
/** Shortest run of words that counts as copying a sentence from the page. */
const COPIED_RUN_WORDS = 12;

export function normalizeText(text: string) {
  return text.toLowerCase()
    .replace(/[‘’‛`]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
    .replace(/[*_#>|]/g, " ").replace(/\s+/g, " ").trim();
}

const sameUrl = (a: string, b: string) => {
  const strip = (url: string) => url.replace(/#.*$/, "").replace(/\/+$/, "").replace(/^https?:\/\/(www\.)?/, "");
  return strip(a) === strip(b);
};

export type Verification =
  | { ok: true; card: OfficialCard; dropped: { text: string; reason: string }[] }
  | { ok: false; reason: string; dropped: { text: string; reason: string }[] };

export function verifyDraft(draft: OfficialDraft, pages: FetchedPage[], policy: DomainPolicy, now = new Date()): Verification {
  const dropped: { text: string; reason: string }[] = [];
  if (!draft.found) return { ok: false, reason: "not_found_on_official_site", dropped };
  if (!isOfficialUrl(draft.sourceUrl, policy)) return { ok: false, reason: "source_not_official", dropped };
  if (!pages.some(page => sameUrl(page.url, draft.sourceUrl))) return { ok: false, reason: "source_not_fetched", dropped };
  const official = pages.filter(page => isOfficialUrl(page.url, policy)).map(page => normalizeText(page.text));
  // Words only: markdown, backticks and spacing around punctuation differ between
  // a page's HTML and a quote of it, and neither check should hinge on them.
  const bare = (value: string) => ` ${value.replace(/[^a-z0-9]+/g, " ").trim()} `;
  const barePages = official.map(bare);
  const supported = (evidence: string) => {
    const quote = bare(normalizeText(evidence));
    return quote.trim().split(" ").length >= 3 && barePages.some(text => text.includes(quote));
  };
  const copied = (text: string) => {
    const words = bare(normalizeText(text)).trim().split(" ");
    if (words.length < COPIED_RUN_WORDS) return false;
    for (let start = 0; start + COPIED_RUN_WORDS <= words.length; start++) {
      const run = ` ${words.slice(start, start + COPIED_RUN_WORDS).join(" ")} `;
      if (barePages.some(page => page.includes(run))) return true;
    }
    return false;
  };
  const keep = (items: OfficialDraft["keyPoints"]) => items.filter(item => {
    const reason = !supported(item.evidence) ? "evidence_not_on_page" : copied(item.text) ? "copied_verbatim" : "";
    if (reason) dropped.push({ text: item.text, reason });
    return !reason;
  }).map(item => item.text.trim());
  const keyPoints = keep(draft.keyPoints), gotchas = keep(draft.gotchas);
  if (keyPoints.length < MIN_VERIFIED_POINTS) return { ok: false, reason: `only_${keyPoints.length}_verified_points`, dropped };
  const { found: _found, keyPoints: _points, gotchas: _gotchas, ...rest } = draft;
  void _found; void _points; void _gotchas;
  return { ok: true, card: { ...rest, keyPoints, gotchas, checkedAt: now.toISOString().slice(0, 10) }, dropped };
}

/** File-name slug for a Search tab or an API package. */
export const officialSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/** Key of a Search card inside its tab's file; API cards are keyed by entry name alone. */
export const searchCardKey = (category: string, name: string) => `${category}::${name}`;
