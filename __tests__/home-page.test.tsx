/** @jest-environment node */
import Home, { metadata } from "@/app/(landing)/page";
import { JsonLd } from "@/components/json-ld";
import { LandingPage } from "@/components/landing-page";

// The page imports the weekly-content generator, which imports the ESM-only `ai` package; nothing here calls it.
jest.mock("ai", () => ({ generateText: jest.fn(), generateObject: jest.fn(), streamText: jest.fn(), gateway: jest.fn() }));
jest.mock("@/lib/server/official-tech-docs", () => ({
  officialTechDocs: jest.fn().mockResolvedValue(null),
  previewTechDocs: jest.fn().mockReturnValue(null),
}));

test("renders the cached public page and parseable website structured data", async () => {
  const element = await Home();
  const [schema, landing] = element.props.children;
  expect(landing.type).toBe(LandingPage);
  // One <script type="application/ld+json"> per schema (components/json-ld.tsx); the first is the WebSite.
  const scripts = JsonLd(schema.props).props.children;
  expect(JSON.parse(scripts[0].props.dangerouslySetInnerHTML.__html)["@type"]).toBe("WebSite");
  expect(metadata.alternates?.canonical).toBe("/");
});
