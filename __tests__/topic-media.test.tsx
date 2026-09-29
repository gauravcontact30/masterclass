import { existsSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { BRAND_SLUGS, OWNED_BRAND_PNGS, brandKeyFor } from "@/lib/media/brands";
import { brandAssetFor } from "@/lib/media";
import { creditLine, needsAttribution, type MediaAsset } from "@/lib/media/types";
import { SubjectArtwork, hasSubjectArtwork } from "@/components/subject-artwork";
import { CLASSROOM_CATALOGUES } from "@/lib/pro-learn/classroom";
import manifest from "@/lib/media/brand-manifest.json";
import { BrandMark, TopicCover } from "@/components/topic-media";
import { CatalogBrowser } from "@/components/catalog-browser";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";

const publicPath = (src: string) => join(process.cwd(), "public", src.replace(/^\//, ""));

test.each([
  ["Agentic AI", "lucide-brain-circuit"],
  ["AI terms worth knowing", "lucide-brain-circuit"],
  ["Arcjet", "lucide-shield-alert"],
  ["Authentication with Auth.js & Kinde Auth", "lucide-key-round"],
  ["A new catalogue", "lucide-layers"],
])("%s displays a fallback in both covers and inline marks", (label, iconClass) => {
  const { container } = render(<><TopicCover label={label} /><BrandMark label={label} size={18} /></>);
  const icons = container.querySelectorAll(`svg.${iconClass}`);
  expect(icons).toHaveLength(2);
  expect(icons[0]).toHaveAttribute("width", "44");
  expect(icons[1]).toHaveAttribute("width", "18");
  for (const icon of icons) expect(icon).toHaveAttribute("aria-hidden", "true");
});

test("every technology handbook renders a visible cover", () => {
  for (const handbook of TECHNOLOGY_HANDBOOKS) {
    const { container, unmount } = render(<TopicCover label={handbook.title} />);
    expect(container.querySelector("img, svg")).not.toBeNull();
    unmount();
  }
});

test("catalogue headers include an icon when no cover is supplied", () => {
  const { container } = render(<CatalogBrowser id="ai-terms" title="AI terms worth knowing"
    description="An AI glossary" noun="terms" items={[]} categories={[]}
    itemIcon={() => null} categoryIcon={() => null} question={item => item.name} onAsk={() => {}} />);
  expect(container.querySelector("[data-has-cover] svg.lucide-brain-circuit")).not.toBeNull();
});

/**
 * The manifest and the files on disk are generated together, so the thing
 * worth pinning is that they have not drifted apart — an entry pointing at a
 * file nobody wrote renders as a broken image, which is exactly the failure a
 * type checker cannot see.
 */
test("every brand in the slug map has a generated file and a manifest entry", () => {
  const entries = manifest as Record<string, MediaAsset>;
  for (const key of Object.keys(BRAND_SLUGS)) {
    expect(entries[key]).toBeDefined();
    expect(existsSync(publicPath(entries[key].src))).toBe(true);
  }
  expect(Object.keys(entries)).toHaveLength(Object.keys(BRAND_SLUGS).length);
});

test("the marks the project owns exist and never come from the generated manifest", () => {
  const entries = manifest as Record<string, MediaAsset>;
  for (const [key, src] of Object.entries(OWNED_BRAND_PNGS)) {
    expect(existsSync(publicPath(src))).toBe(true);
    // These four were withdrawn from simple-icons; a manifest entry appearing
    // for one would mean the package started shipping it again and the app
    // had quietly begun redistributing it.
    expect(entries[key]).toBeUndefined();
    expect(brandAssetFor(key)?.src).toBe(src);
  }
});

test("every generated mark ships as CC0 and needs no credit line", () => {
  for (const asset of Object.values(manifest as Record<string, MediaAsset>)) {
    expect(asset.license).toBe("CC0-1.0");
    expect(needsAttribution(asset)).toBe(false);
    expect(creditLine(asset)).toBeNull();
  }
});

test("a CC-BY asset would be given a credit line", () => {
  const borrowed: MediaAsset = {
    src: "/images/x.jpg", width: 10, height: 10, license: "CC-BY-SA-4.0",
    licenseName: "CC BY-SA 4.0", title: "Dispersive prism", creator: "Kelvinsong",
  };
  expect(creditLine(borrowed)).toBe("Dispersive prism · Kelvinsong · CC BY-SA 4.0");
});

/**
 * Ordering is the whole design of the rule table, so these are the pairs where
 * a bare substring would pick the wrong logo. Each one failed at least once
 * while the order was being settled.
 */
test.each([
  ["React Testing Library", "testing-library"],
  ["React 19+ — Components, Actions & Server UI", "react"],
  ["Next.js 16+ — Routing, Rendering & Caching", "nextjs"],
  ["Node.js Packages — Modules, Libraries & Middleware", "nodejs"],
  ["Nest.js — APIs, Architecture, Security & Testing", "nestjs"],
  ["@nestjs/common", "nestjs"],
  ["@playwright/test", "playwright"],
  ["Redux Toolkit", "redux"],
  ["Scikit-Learn", "scikit-learn"],
  ["Drizzle ORM", "drizzle"],
  ["Mongoose", "mongodb"],
  ["AWS Services", "aws"],
  ["boto3", "aws"],
  ["TypeScript 7 — Types, Compiler & Migration", "typescript"],
  ["JavaScript (ECMAScript 2026) — Language & Runtime", "javascript"],
  ["SCSS", "sass"],
  ["CSS", "css"],
])("%s resolves to the %s mark", (label, expected) => {
  expect(brandKeyFor(label)).toBe(expected);
});

/**
 * False positives are the expensive failure here: a concept row that picks up
 * an unrelated logo looks like a bug to a reader, where a concept row with no
 * logo just keeps the glyph it always had.
 */
test.each([
  "Refs and the DOM", "Reducers & context", "Effects and synchronization",
  "System Design", "AI Agents", "Behavioral", "Algorithms", "Data Structures",
  "Place value and expanded form", "Comparing numbers",
])("%s names no product and resolves to no mark", label => {
  expect(brandKeyFor(label)).toBeNull();
  expect(brandAssetFor(label)).toBeNull();
});

test("every Class Room catalogue has cover artwork", () => {
  for (const entry of CLASSROOM_CATALOGUES) {
    expect(hasSubjectArtwork(entry.id)).toBe(true);
  }
});

test("subject artwork is labelled for a screen reader and skipped when unmapped", () => {
  const { container } = render(<SubjectArtwork id="maths" title="Maths" />);
  const svg = container.querySelector("svg")!;
  expect(svg).toHaveAttribute("role", "img");
  expect(svg.querySelector("title")?.textContent).toMatch(/^Maths: /);
  expect(svg.getAttribute("aria-labelledby")).toBe(svg.querySelector("title")!.id);

  const { container: none } = render(<SubjectArtwork id="not-a-subject" />);
  expect(none.querySelector("svg")).toBeNull();
});
