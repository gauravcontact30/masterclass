/** @jest-environment node */
import Home, { metadata } from "@/app/page";
import { JsonLd } from "@/components/json-ld";
import { LandingPage } from "@/components/landing-page";

test("renders a static public page and parseable website structured data", () => {
  const element = Home();
  const [schema, landing] = element.props.children;
  expect(landing.type).toBe(LandingPage);
  expect(JSON.parse(JsonLd(schema.props).props.dangerouslySetInnerHTML.__html)[0]["@type"]).toBe("WebSite");
  expect(metadata.alternates?.canonical).toBe("/");
});
