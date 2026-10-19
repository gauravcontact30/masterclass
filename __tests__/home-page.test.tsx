/** @jest-environment node */
import Home, { metadata } from "@/app/(landing)/page";
import { JsonLd } from "@/components/json-ld";
import { LandingPage } from "@/components/landing-page";

jest.mock("@/lib/server/official-tech-docs", () => ({
  officialTechDocs: jest.fn().mockResolvedValue(null),
  previewTechDocs: jest.fn().mockReturnValue(null),
}));

test("renders the cached public page and parseable website structured data", async () => {
  const element = await Home();
  const [schema, landing] = element.props.children;
  expect(landing.type).toBe(LandingPage);
  expect(JSON.parse(JsonLd(schema.props).props.dangerouslySetInnerHTML.__html)[0]["@type"]).toBe("WebSite");
  expect(metadata.alternates?.canonical).toBe("/");
});
