/**
 * A tab must be as wide as its own label.
 *
 * Both strips on the Search page used to divide one line between five tabs and
 * ellipsise whatever did not fit, which left a reader choosing between
 * "Transactions & produ…" and "Next.js 16+ APIs — Direct…". The tab's label is
 * the only thing saying what is behind it, so each tab now sizes to its content
 * and the strip wraps onto another line instead of truncating.
 *
 * jsdom does no layout, so this pins the CSS contract that produces that
 * result: the strip wraps, the tab does not flex-grow or flex-shrink, and no
 * ellipsis clamp survives at desktop width.
 */
import fs from "node:fs";
import path from "node:path";

const strip = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** The declarations of one top-level rule, by exact selector. */
function rule(css: string, selector: string): string {
  for (const block of css.split("}")) {
    const [head, body] = block.split("{");
    if (head && body && head.trim() === selector) return body;
  }
  throw new Error(`no rule for ${selector}`);
}

/**
 * Every `@media (max-width: 720px)` block in the file, joined.
 *
 * A stylesheet may carry several, and the strip's rules are not always in the
 * first one — this file's other narrow block belongs to the answer modal.
 */
function narrow(css: string): string {
  const blocks: string[] = [];
  for (let at = css.indexOf("@media (max-width: 720px)"); at > -1; at = css.indexOf("@media (max-width: 720px)", at + 1)) {
    blocks.push(css.slice(at, css.indexOf("\n}", at)));
  }
  expect(blocks.length).toBeGreaterThan(0);
  return blocks.join("\n");
}

const STRIPS: [name: string, file: string, list: string, tab: string, label: string][] = [
  ["catalogue sections", "components/answer-search.module.css", ".sectionsList", ".sectionTab", ".sectionName"],
  ["category tabs", "components/catalog-browser.module.css", ".tabsList", ".tab", ".tabName"],
];

describe.each(STRIPS)("%s", (_name, file, list, tab, label) => {
  const css = strip(file);

  test("the strip wraps rather than squeezing every tab onto one line", () => {
    expect(rule(css, list)).toMatch(/flex-wrap:\s*wrap/);
  });

  test("a tab is sized by its own content", () => {
    // Neither growing to an equal share nor shrinking below its label.
    expect(rule(css, tab)).toMatch(/flex:\s*0\s+0\s+auto/);
    expect(rule(css, tab)).toMatch(/max-width:\s*100%/);
  });

  test("the label carries no ellipsis clamp at reading width", () => {
    const declarations = rule(css, label);
    expect(declarations).not.toMatch(/text-overflow/);
    expect(declarations).not.toMatch(/max-width/);
  });

  test("only a single very long name is held inside its own tab on a phone", () => {
    const small = narrow(css);
    expect(small).toContain(`${label} { overflow: hidden; text-overflow: ellipsis; }`);
    // The old fixed clamp cut every label at roughly ten characters.
    expect(small).not.toMatch(/max-width:\s*9\dpx/);
  });
});
