/** @jest-environment node */
import { artisticThemes, contrastPairs, contrastRatio, relativeLuminance, themeNames, WCAG_AA } from "@/lib/artistic-notes/themes";

describe("WCAG contrast maths", () => {
  test("matches the reference values from the WCAG definition", () => {
    expect(relativeLuminance("FFFFFF")).toBeCloseTo(1, 10);
    expect(relativeLuminance("#000000")).toBe(0);
    expect(contrastRatio("000000", "FFFFFF")).toBeCloseTo(21, 10);
    expect(contrastRatio("FFFFFF", "000000")).toBeCloseTo(21, 10);
    expect(contrastRatio("777777", "777777")).toBeCloseTo(1, 10);
    // #767676 on white is the well-known lightest grey that still passes AA body text.
    expect(contrastRatio("767676", "FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("777777", "FFFFFF")).toBeLessThan(4.5);
  });

  test("rejects malformed colours instead of computing nonsense", () => {
    expect(() => relativeLuminance("FFF")).toThrow("Invalid colour");
    expect(() => relativeLuminance("GGGGGG")).toThrow("Invalid colour");
  });
});

describe("artistic themes", () => {
  test("ships exactly the four named themes", () => {
    expect([...themeNames].sort()).toEqual(["high-contrast-dark", "high-contrast-light", "retro-cyberpunk", "warm-academic"]);
    for (const name of themeNames) expect(artisticThemes[name].name).toBe(name);
  });

  test("every colour is a six-digit hex without a leading #, as PptxGenJS expects", () => {
    for (const theme of Object.values(artisticThemes)) {
      const colours = [theme.background, theme.surface, theme.text, theme.muted, theme.accent, theme.accent2, theme.onAccent, theme.codeBackground, theme.codeText, theme.rule, ...Object.values(theme.callouts).flatMap(c => [c.background, c.label])];
      for (const colour of colours) expect(colour).toMatch(/^[0-9A-F]{6}$/);
    }
  });

  test("the pair list covers every text colour and every callout panel", () => {
    for (const theme of Object.values(artisticThemes)) {
      const names = contrastPairs(theme).map(pair => pair.name);
      expect(names).toEqual(expect.arrayContaining(["text on background", "text on surface", "muted on background", "accent on background", "onAccent on accent", "code text on code background"]));
      for (const kind of ["definition", "takeaway", "warning", "recall"]) {
        expect(names).toContain(`${kind} label on ${kind} panel`);
        expect(names).toContain(`text on ${kind} panel`);
      }
    }
  });

  const cases = themeNames.flatMap(name => contrastPairs(artisticThemes[name]).map(pair => [name, pair.name, pair] as const));
  test.each(cases)("%s: %s meets WCAG AA", (_theme, _name, pair) => {
    const ratio = contrastRatio(pair.foreground, pair.background);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA[pair.size]);
  });

  test("the high-contrast themes clear AAA (7:1) for body copy", () => {
    for (const name of ["high-contrast-light", "high-contrast-dark"] as const) {
      const theme = artisticThemes[name];
      expect(contrastRatio(theme.text, theme.background)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(theme.text, theme.surface)).toBeGreaterThanOrEqual(7);
    }
  });
});
