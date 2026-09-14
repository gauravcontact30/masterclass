/** @jest-environment node */
import Home, { metadata } from "@/app/page";
import { LandingPage } from "@/components/landing-page";

test("renders a static public page and parseable website structured data", () => {
  const element = Home();
  const [schema, landing] = element.props.children;
  expect(landing.type).toBe(LandingPage);
  expect(JSON.parse(schema.props.dangerouslySetInnerHTML.__html)["@type"]).toBe("WebSite");
  expect(metadata.alternates?.canonical).toBe("/");
});
