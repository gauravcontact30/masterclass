/** @jest-environment node */
import { isIndexable, siteUrl, websiteSchema } from "@/lib/seo";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const original = { ...process.env };
afterEach(() => { process.env = { ...original }; });
test("only an explicitly enabled HTTPS deployment is indexable", () => {
  process.env.APP_URL = "https://learning.example.com";
  delete process.env.SEO_INDEXABLE;
  expect(isIndexable()).toBe(false);
  expect(sitemap()).toEqual([]);
  expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  process.env.SEO_INDEXABLE = "true";
  expect(isIndexable()).toBe(true);
  expect(sitemap()).toEqual([{ url: "https://learning.example.com/" }]);
  expect(robots().sitemap).toBe("https://learning.example.com/sitemap.xml");
  expect(websiteSchema().url).toBe("https://learning.example.com/");
  process.env.APP_URL = "http://localhost:3000";
  expect(isIndexable()).toBe(false);
});
test.each(["javascript:alert(1)", "https://user:pass@example.com", "https://example.com/path", "https://example.com?x=1"])("rejects invalid canonical origin %s", value => {
  process.env.APP_URL = value;
  expect(siteUrl).toThrow();
});
