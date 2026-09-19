import { highlightLines, proseTokens } from "@/lib/code-highlight";
import { inferLanguage, languageLabel, runSupport } from "@/lib/code-run";
import { STUDY_SECTIONS, hiddenSectionTitles, showsSection } from "@/lib/interview-focus";

const toneOf = (code: string, text: string) =>
  highlightLines(code, "javascript").flat().find(token => token.text === text)?.tone;

describe("highlightLines", () => {
  it("keeps every character of the source", () => {
    const code = "const total = items.reduce((sum, n) => sum + n, 0); // adds up\n";
    const rebuilt = highlightLines(code, "javascript")
      .map(line => line.map(token => token.text).join(""))
      .join("\n");
    expect(rebuilt).toBe(code);
  });

  it("splits on newlines so the gutter numbering matches the source", () => {
    expect(highlightLines("a\nb\nc", "javascript")).toHaveLength(3);
  });

  it("tones keywords, strings, numbers, comments and types", () => {
    const code = 'const name = "Ada"; // note\nclass Widget {}\nconst n = 42;';
    expect(toneOf(code, "const")).toBe("keyword");
    expect(toneOf(code, '"Ada"')).toBe("string");
    expect(toneOf(code, "42")).toBe("number");
    expect(toneOf(code, "// note")).toBe("comment");
    expect(toneOf(code, "Widget")).toBe("type");
  });

  it("does not tokenise inside strings or comments", () => {
    const tokens = highlightLines('const a = "const class 42";', "javascript").flat();
    expect(tokens.filter(token => token.tone === "keyword").map(token => token.text)).toEqual(["const"]);
  });

  it("leaves plain languages untouched", () => {
    const tokens = highlightLines("const is just a word here", "text").flat();
    expect(tokens.every(token => token.tone === "")).toBe(true);
  });

  it("survives unbalanced quotes and empty input", () => {
    expect(() => highlightLines('const a = "unterminated', "javascript")).not.toThrow();
    expect(highlightLines("", "javascript")).toEqual([[]]);
  });
});

describe("proseTokens", () => {
  it("picks out the identifiers a reader scans for", () => {
    const code = (text: string) =>
      proseTokens(text)
        .filter(token => token.code)
        .map(token => token.text);
    expect(code("render a LoadingIndicator that reads useLinkStatus")).toContain("useLinkStatus");
    expect(code("Redirect with router.push after a form succeeds")).toContain("router.push");
    expect(code("a loading.tsx fallback for the slow route")).toContain("loading.tsx");
    expect(code("inside a Link with prefetch={false}")).toContain("prefetch={false}");
  });

  it("unwraps backticked spans", () => {
    expect(proseTokens("use `npm run dev` first")).toContainEqual({ text: "npm run dev", code: true });
  });

  it("keeps ordinary prose intact", () => {
    const text = "Users get instant confirmation that their click registered.";
    expect(proseTokens(text).map(token => token.text).join("")).toBe(text);
    expect(proseTokens(text).some(token => token.code)).toBe(false);
  });

  it("sets a backticked clause as prose, not as a monospace chip", () => {
    // Verbatim from an answer that boxed half its own headline in monospace.
    const headline = "`CloudFormation` `defines AWS infrastructure,` `CloudWatch` `monitors it, and` `CloudFront` `delivers it at the edge.`";
    const tokens = proseTokens(headline);
    const chips = tokens.filter(token => token.code).map(token => token.text);
    // The service names are identifier-shaped and stay chips; the clauses do not.
    expect(chips).toEqual(["CloudFormation", "CloudWatch", "CloudFront"]);
    for (const clause of ["defines AWS infrastructure,", "monitors it, and", "delivers it at the edge."]) {
      expect(tokens).toContainEqual({ text: clause, code: false });
    }
    // The backticks themselves never reach the reader either way.
    expect(tokens.map(token => token.text).join("")).not.toContain("`");
  });

  it("keeps short commands, paths and flags as chips", () => {
    const chip = (text: string) => proseTokens(text).filter(token => token.code).map(token => token.text);
    expect(chip("run `npm run dev` now")).toEqual(["npm run dev"]);
    expect(chip("open `app/layout.tsx` next")).toEqual(["app/layout.tsx"]);
    expect(chip("pass `--turbopack` to it")).toEqual(["--turbopack"]);
    // A dot mid-token is an identifier; a dot at the end is a sentence.
    expect(chip("call `router.push` here")).toEqual(["router.push"]);
    expect(chip("`it redirects the user.`")).toEqual([]);
  });

  it("does not invert when the text opens with a code token", () => {
    // `split` emits a leading "" here; dropping it before reading the
    // separator/match parity used to turn every chip into its neighbour.
    const chip = (text: string) => proseTokens(text).filter(token => token.code).map(token => token.text);
    expect(chip("`npm run dev` starts the server")).toEqual(["npm run dev"]);
    expect(chip("router.push moves the user")).toEqual(["router.push"]);
    expect(chip("useLinkStatus and loading.tsx together")).toEqual(["useLinkStatus", "loading.tsx"]);
  });

  it("never drops characters", () => {
    const text = "Inside each Link, render useLinkStatus and a loading.tsx fallback.";
    expect(proseTokens(text).map(token => token.text).join("")).toBe(text.replace(/`/g, ""));
  });
});

describe("runSupport", () => {
  it("runs self-contained javascript", () => {
    expect(runSupport("console.log(1 + 1);", "javascript")).toEqual({ runnable: true });
  });

  it("refuses languages the browser sandbox cannot execute", () => {
    for (const language of ["python", "tsx", "bash", "yaml", "typescript"] as const) {
      const support = runSupport("print(1)", language);
      expect(support.runnable).toBe(false);
      if (!support.runnable) expect(support.reason).toContain("JavaScript only");
    }
  });

  it("refuses javascript that needs a module loader, Node or a DOM", () => {
    const cases = [
      'import { total } from "./values.mjs";\nconsole.log(total());',
      'const fs = require("node:fs");',
      "console.log(process.env.HOME);",
      "document.querySelector('#app');",
      "await fetch('/api/thing');",
    ];
    for (const code of cases) expect(runSupport(code, "javascript").runnable).toBe(false);
  });

  it("explains itself instead of failing silently", () => {
    const support = runSupport('export const a = 1;', "javascript");
    expect(support.runnable).toBe(false);
    if (!support.runnable) expect(support.reason).toMatch(/Set up & run/);
  });

  it("refuses empty and oversized input", () => {
    expect(runSupport("   ", "javascript").runnable).toBe(false);
    expect(runSupport("x".repeat(12001), "javascript").runnable).toBe(false);
  });
});

describe("inferLanguage", () => {
  it.each([
    ["def add(a, b):\n    return a + b", "python"],
    ["FROM node:22\nRUN npm ci", "dockerfile"],
    ["npm install next@latest", "bash"],
    ['resource "aws_s3_bucket" "logs" {}', "hcl"],
    ["const doubled = list.map(n => n * 2);", "javascript"],
    ["interface User { name: string }", "typescript"],
  ])("reads %s as %s", (code, expected) => {
    expect(inferLanguage(code)).toBe(expected);
  });

  it("falls back to text rather than guessing wrong", () => {
    expect(inferLanguage("Just a sentence about closures")).toBe("text");
  });

  it("never marks an inferred non-javascript block runnable", () => {
    const code = "def add(a, b):\n    return a + b";
    expect(runSupport(code, inferLanguage(code)).runnable).toBe(false);
  });
});

describe("interview focus", () => {
  it("shows everything when off", () => {
    for (const section of STUDY_SECTIONS) expect(showsSection(section.id, false)).toBe(true);
  });

  it("keeps the interview-critical sections and folds the rest away", () => {
    expect(showsSection("interview", true)).toBe(true);
    expect(showsSection("questions", true)).toBe(true);
    expect(showsSection("code", true)).toBe(true);
    expect(showsSection("concepts", true)).toBe(true);
    expect(showsSection("vocabulary", true)).toBe(false);
    expect(showsSection("useCases", true)).toBe(false);
  });

  it("names the hidden sections for the toggle hint", () => {
    expect(hiddenSectionTitles()).toEqual(["Real-world use cases", "Vocabulary, synonyms & antonyms"]);
  });

  it("labels every language it can be handed", () => {
    expect(languageLabel("tsx")).toBe("TSX");
    expect(languageLabel("javascript")).toBe("JavaScript");
  });
});
