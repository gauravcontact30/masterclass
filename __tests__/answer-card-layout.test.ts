/**
 * The search page must never be wider than the column it sits in.
 *
 * jsdom does no layout, so this asserts the CSS contract that produces that
 * result: every grid or flex ancestor between the page and a code block floors
 * its track at zero, and the code surfaces scroll rather than grow. Without
 * these, one wide snippet or one long identifier pushes the answer — and the
 * shell column with it — past the edge of the screen.
 *
 * It also pins the two numbers the layout promises: three entries to a row,
 * and a reveal that reduced-motion users never see.
 */
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
// Comments are stripped so a rule preceded by one still matches by selector.
const css = read("components/answer-search.module.css").replace(/\/\*[\s\S]*?\*\//g, "");

/** The declarations of one top-level rule, by exact selector. */
function rule(selector: string): string {
  const declarations: string[] = [];
  for (const block of css.split("}")) {
    const [head, body] = block.split("{");
    if (head && body && head.trim() === selector) declarations.push(body);
  }
  if (declarations.length) return declarations.join("\n");
  throw new Error(`no rule for ${selector}`);
}

test.each([".steps ol", ".points", ".alternatives", ".useCases", ".matches"])(
  "%s floors its grid track at zero so no child can widen the answer", selector => {
    const body = rule(selector);
    expect(body).toContain("display: grid");
    expect(body).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\)/);
  });

test.each([".answer", ".block", ".steps", ".steps li > div", ".matches a", ".entry", ".entryOpen"])(
  "%s can shrink below its content", selector => {
    expect(rule(selector)).toMatch(/min-width:\s*0/);
  });

test("the page fills its column but never exceeds it", () => {
  const body = rule(".page");
  expect(body).toMatch(/max-width:\s*940px/);
  expect(body).toMatch(/min-width:\s*0/);
});

test("earlier searches sit three to a row, and reflow rather than overflow", () => {
  const grid = rule(".grid");
  expect(grid).toMatch(/grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  // Three columns collapse to one on phones.
  expect(css).toMatch(/@media \(max-width: 620px\)[\s\S]*?\.grid \{ grid-template-columns: minmax\(0, 1fr\); \}/);
});

test("body prose runs the full width of the card with readable left alignment", () => {
  // No reading-width cap survives inside the answer: the card is the measure.
  for (const selector of [".headline", ".definition", ".summary", ".steps p", ".alternatives p", ".useCases p"]) {
    expect(rule(selector)).not.toMatch(/max-width:\s*\d+ch/);
  }
  const prose = rule(".definition, .summary, .steps p, .alternatives p, .useCases p, .points li, .noModel p, .error p");
  expect(prose).toMatch(/text-align:\s*left/);
  // Justification without hyphenation tears rivers through a narrow column.
  expect(prose).toMatch(/overflow-wrap:\s*break-word/);
  // Headings are never justified.
  expect(rule(".headline")).not.toMatch(/text-align:\s*left/);
  expect(rule(".blockTitle")).not.toMatch(/text-align:\s*left/);
});

test("key points read as separate paragraphs, bulleted and in their own colour", () => {
  const list = rule(".points");
  const point = rule(".points li");
  // Paragraph spacing between points, not a packed row of pills.
  expect(list).toMatch(/gap:\s*14px/);
  expect(point).toMatch(/color:\s*var\(--keypoint\)/);
  expect(point).not.toMatch(/background:/);
  // A real bullet glyph, offset so the text hangs clear of it.
  expect(rule(".points li::before")).toContain('content: "•"');
  expect(point).toMatch(/padding:\s*0 0 0 26px/);
  // The key-point colour is defined as a token, distinct from body ink.
  expect(rule(".page")).toMatch(/--keypoint:\s*#8a4b2f/);
});

test("nothing inside an answer can scroll the page sideways", () => {
  // A chip the model filled with a whole clause is what produced the page-wide
  // horizontal scrollbar: nowrap made it unbreakable, so it painted past the card.
  const chip = read("components/key-text.module.css").replace(/\/\*[\s\S]*?\*\//g, "");
  expect(chip).not.toMatch(/white-space:\s*nowrap/);
  expect(chip).toMatch(/overflow-wrap:\s*anywhere/);
  // And as a backstop, the answer and each entry clip on the x axis only.
  expect(rule(".answer")).toMatch(/overflow-x:\s*clip/);
  expect(rule(".entry")).toMatch(/overflow-x:\s*clip/);
});

test("supporting sections fold behind a titled control that turns", () => {
  expect(rule(".fold > summary")).toMatch(/cursor:\s*pointer/);
  expect(rule(".fold > summary::-webkit-details-marker")).toMatch(/display:\s*none/);
  expect(rule(".fold[open] > summary .foldMark")).toMatch(/rotate\(180deg\)/);
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  expect(reduced).toMatch(/\.foldBody \{ animation: none; \}|\.foldBody[^{]*\{ animation: none; \}/);
});

test("only one clear button shows in the search field", () => {
  // Chrome, Edge and Safari each draw their own for type=search.
  expect(css).toMatch(/::-webkit-search-cancel-button[\s\S]*?display: none/);
  expect(css).toMatch(/::-ms-clear \{ display: none/);
});

test("long identifiers wrap instead of stretching the answer", () => {
  for (const selector of [".headline", ".steps h4", ".asked", ".answer"]) {
    expect(rule(selector)).toMatch(/overflow-wrap:\s*(break-word|anywhere)/);
  }
  expect(rule(".definition, .summary, .steps p, .alternatives p, .useCases p, .points li, .noModel p, .error p"))
    .toMatch(/overflow-wrap:\s*break-word/);
});

test("the answer's entrance and the page-turn wave are both dropped for reduced motion", () => {
  expect(rule(".answer")).toMatch(/animation:\s*settle/);
  expect(rule(".grid > li")).toMatch(/animation:\s*deal/);
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  expect(reduced).toMatch(/\.answer,\s*\.answerHead::after,\s*\.grid > li,\s*\.foldBody \{ animation: none; \}/);
  expect(reduced).toMatch(/animation: none/);
});

test("the shell column can shrink, so a wide answer cannot drag the page sideways", () => {
  const globals = read("app/globals.css");
  expect(globals).toContain(".compact-workspace .main-shell{margin-left:216px;width:calc(100% - 216px);min-width:0}");
  expect(globals).toContain(".main-shell{margin-left:235px;width:calc(100% - 235px);min-width:0}");
});

test("every code surface clips its shell and scrolls its source", () => {
  for (const file of ["components/code-lab.module.css", "components/code-files.module.css"]) {
    const sheet = read(file);
    expect(sheet).toMatch(/overflow:\s*hidden/);
    expect(sheet).toMatch(/overflow-x:\s*auto/);
  }
});

test("card headings are smaller and wear their own colour, not black", () => {
  expect(rule(".page")).toMatch(/--heading:\s*#2f4b5c/);
  // The headline tops out at 21px, down from 29px.
  expect(rule(".headline")).toMatch(/font-size:\s*clamp\(17px, 1\.9vw, 21px\)/);
  for (const selector of [".headline", ".blockTitle", ".steps h4", ".alternatives strong", ".useCases strong"]) {
    expect(rule(selector)).toMatch(/color:\s*var\(--heading\)/);
  }
  expect(rule(".blockTitle")).toMatch(/font-size:\s*13px/);
  expect(rule(".steps h4")).toMatch(/font-size:\s*13\.5px/);
});

test("each card on a page of earlier searches gets its own light tint", () => {
  const tints = [1, 2, 3].map(slot => rule(`.grid > li:nth-child(${slot})`).match(/--tint:\s*(#[0-9a-f]{6})/)![1]);
  // Three places on a page, three different colours.
  expect(new Set(tints).size).toBe(3);
  // All pale: every channel high enough that dark heading ink stays readable.
  for (const tint of tints) {
    const channels = [1, 3, 5].map(at => parseInt(tint.slice(at, at + 2), 16));
    expect(Math.min(...channels)).toBeGreaterThanOrEqual(0xdd);
  }
  expect(rule(".entry")).toMatch(/background:\s*var\(--tint, var\(--surface\)\)/);
});

/**
 * A catalogue card is a header strip above a body, and nothing may escape it.
 *
 * The strip was added after the body was written, and the body still claimed
 * the card's whole height — so the row anchored to its bottom edge, the
 * "Explain this" reveal and the Hindi controls beneath it, hung past the
 * rounded border. jsdom cannot see that, so this pins the geometry instead.
 */
const catalog = read("components/catalog-browser.module.css").replace(/\/\*[\s\S]*?\*\//g, "");

function catalogRule(selector: string): string {
  for (const block of catalog.split("}")) {
    const [head, body] = block.split("{");
    if (head && body && head.trim() === selector) return body;
  }
  throw new Error(`no rule for ${selector}`);
}

test("the card lays out its own children, so the header and body stack", () => {
  const body = catalogRule(".card");
  expect(body).toContain("display: flex");
  expect(body).toMatch(/flex-direction:\s*column/);
});

test("the card body fills what the header leaves rather than claiming the whole card", () => {
  const body = catalogRule(".open");
  // A hard 100% here is the bug: it ignores the header above it.
  expect(body).not.toMatch(/height:\s*100%/);
  expect(body).toMatch(/flex:\s*1 1 auto/);
  expect(body).toMatch(/min-height:\s*0/);
});

test("the reveal stays anchored inside the body", () => {
  // `margin-top: auto` is what pins the reveal to the bottom of the body; it
  // only lands inside the card while the body is flex-sized, not 100% tall.
  expect(catalogRule(".go")).toMatch(/margin-top:\s*auto/);
});

test("a rule separates the card's header strip from its body", () => {
  expect(catalogRule(".cardHead")).toMatch(/border-bottom:\s*1px solid/);
});

test("the meaning box is a fixed height, so no language toggle can reflow the grid", () => {
  const body = catalogRule(".cardSummary");
  // Fixed rather than min-height: a short English meaning and three lines of
  // Devanagari have to occupy exactly the same space, or switching one card
  // grows its row and drags every card beside it.
  expect(body).toMatch(/height:\s*calc\(/);
  expect(body).toMatch(/--summary-lines:\s*3/);
  expect(body).toMatch(/-webkit-line-clamp:\s*var\(--summary-lines\)/);
});

test("the gloss no longer has a block of its own to expand into", () => {
  // The appended panel and its toggle were what grew the card; the header's
  // En/Hi switch replaces the meaning in place instead.
  expect(catalog).not.toContain(".hindiToggle");
  expect(catalog).not.toMatch(/^\.hindi\s*\{/m);
});
