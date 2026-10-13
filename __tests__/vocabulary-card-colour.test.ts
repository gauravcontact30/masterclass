/** @jest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The marked state of a vocabulary card has to carry that card's own colour.
 *
 * This is asserted against the stylesheet text rather than a rendered card
 * because the rule is entirely a cascade question: Jest mocks CSS modules, so a
 * DOM test would pass while the tick stayed the wrong colour in a browser — as
 * it did once, when the value came from a variable another stylesheet owned and
 * silently fell through to its hardcoded fallback.
 */
const css = readFileSync(join(process.cwd(), "components/vocabulary-history.module.css"), "utf8");

/** The three positions a card can take in a row, each with its own hue. */
const POSITIONS = ["1", "2", "3"];

test("each of the three card positions defines its own mark colour and ink", () => {
  for (const position of POSITIONS) {
    const light = new RegExp(`^\\.cardGrid > li:nth-child\\(${position}\\) \\{[^}]*--mark:\\s*#[0-9a-f]{6}[^}]*--mark-ink:\\s*`, "m");
    expect(css).toMatch(light);
  }
  // Three distinct fills, or two cards on a page would mark identically.
  const fills = [...css.matchAll(/--mark:\s*(#[0-9a-f]{6})/g)].map(match => match[1]);
  expect(new Set(fills).size).toBe(fills.length);
});

test("dark mode gives every position its own mark colour too", () => {
  for (const position of POSITIONS) {
    expect(css).toMatch(new RegExp(`:global\\(\\.dark\\) \\.cardGrid > li:nth-child\\(${position}\\) \\{[^}]*--mark:`));
  }
});

test("the checked tick, the header bar and the header rule all read the card's mark", () => {
  const marked = [
    /\.headerCheckbox\[data-checked\][^{]*\{[^}]*background:\s*var\(--mark/,
    /\.headerCheckbox\[data-checked\][^{]*\{[^}]*color:\s*var\(--mark-ink/,
    /\.wordCard\[data-learned\]::before \{[^}]*background:\s*var\(--mark/,
    /\.wordCard\[data-learned\] \.flashHead \{[^}]*border-bottom-color:\s*var\(--mark/,
  ];
  for (const rule of marked) expect(css).toMatch(rule);
});

test("the checked rule outranks the checkbox component's own utility class", () => {
  // `data-checked:bg-primary` on the shared Checkbox is (0,2,0). A bare
  // `.headerCheckbox[data-checked]` only ties with it, so the rule carries a
  // second, more specific selector that cannot lose on source order.
  expect(css).toMatch(/\.wordCard \.headerCheckbox\[data-checked\]/);
});

test("no marked-state rule falls back to one fixed colour for every card", () => {
  // The old behaviour: one green for every card, whatever colour the card was.
  const markedBlocks = css.match(/\.(headerCheckbox\[data-checked\]|wordCard\[data-learned\])[^{]*\{[^}]*\}/g) ?? [];
  expect(markedBlocks.length).toBeGreaterThan(0);
  for (const block of markedBlocks) {
    // A literal colour may appear as the fallback inside var(), which is what
    // renders for a card somehow outside the three tinted positions. What it
    // may not be is the declared value itself, so the var() calls come out
    // before looking for one.
    const declared = block.replace(/var\([^)]*\)/g, "");
    const literals = [...declared.matchAll(/#[0-9a-f]{3,8}\b/g)];
    expect(literals.map(match => `${block.slice(0, 40)} → ${match[0]}`)).toEqual([]);
  }
});
