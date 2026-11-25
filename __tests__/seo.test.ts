/** @jest-environment node */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { INDIA_ONLY_PAGES, PUBLIC_PAGES, faqSchema, isIndexable, jsonLd, pageMetadata, siteUrl, webPageSchema, websiteSchema } from "@/lib/seo";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const original = { ...process.env };
afterEach(() => { process.env = { ...original }; });
test("production canonical fallback uses the deployed domain without enabling preview indexing", () => {
  delete process.env.APP_URL;
  delete process.env.SEO_INDEXABLE;
  expect(siteUrl().href).toBe("https://www.masterclassbuddy.com/");
  expect(isIndexable()).toBe(false);
  expect(pageMetadata("/library").keywords).toContain("AI agent workflows");
});
test("only an explicitly enabled HTTPS deployment is indexable", async () => {
  process.env.APP_URL = "https://learning.example.com";
  delete process.env.SEO_INDEXABLE;
  expect(isIndexable()).toBe(false);
  expect(await sitemap()).toEqual([]);
  expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  process.env.SEO_INDEXABLE = "true";
  expect(isIndexable()).toBe(true);
  const urls = (await sitemap()).map(entry => entry.url);
  // Every registered public page, then the whole learning library, each listed once. The India-only exam guides are
  // left out: crawlers elsewhere are redirected away from them (lib/seo.ts INDIA_ONLY_PAGES).
  const listed = PUBLIC_PAGES.filter(page => !INDIA_ONLY_PAGES.has(page.path));
  expect(urls.slice(0, listed.length)).toEqual(listed.map(page => `https://learning.example.com${page.path}`));
  for (const path of INDIA_ONLY_PAGES) expect(urls).not.toContain(`https://learning.example.com${path}`);
  expect(urls).toEqual(expect.arrayContaining(["https://learning.example.com/library", "https://learning.example.com/interview-questions/react", "https://learning.example.com/workflows/url-shortener", "https://learning.example.com/learn", "https://learning.example.com/vocabulary"]));
  // The API reference is not in the sitemap (app/sitemap.ts).
  expect(urls.some(url => url.includes("/api-reference/"))).toBe(false);
  expect(new Set(urls).size).toBe(urls.length);
  // The API reference is indexed through its own sitemap, listed beside the main one.
  expect(robots().sitemap).toEqual(["https://learning.example.com/sitemap.xml", "https://learning.example.com/api-reference/sitemap.xml"]);
  expect(websiteSchema().url).toBe("https://learning.example.com/");
  process.env.APP_URL = "http://localhost:3000";
  expect(isIndexable()).toBe(false);
});
test.each(["javascript:alert(1)", "https://user:pass@example.com", "https://example.com/path", "https://example.com?x=1"])("rejects invalid canonical origin %s", value => {
  process.env.APP_URL = value;
  expect(siteUrl).toThrow();
});

test("every public page is registered once and has a route file", () => {
  const paths = PUBLIC_PAGES.map(page => page.path);
  expect(new Set(paths).size).toBe(paths.length);
  // A page's route may sit in any route group: (site), or its own such as (tech-buzz).
  const groups = readdirSync(join(process.cwd(), "app")).filter(name => /^\(.+\)$/.test(name));
  for (const path of paths.filter(path => path !== "/")) expect(groups.some(group => existsSync(join(process.cwd(), "app", group, path.slice(1), "page.tsx")))).toBe(true);
  for (const page of PUBLIC_PAGES) {
    expect(page.description.length).toBeGreaterThanOrEqual(70);
    expect(page.description.length).toBeLessThanOrEqual(260);
  }
});
test("page metadata carries a canonical URL and a complete social card", () => {
  const about = pageMetadata("/about");
  expect(about.title).toBe("About MasterClass");
  expect(about.alternates?.canonical).toBe("/about");
  expect(about.openGraph).toMatchObject({ url: "/about", title: "About MasterClass | MasterClass Buddy", images: [expect.objectContaining({ width: 1200, height: 630 })] });
  expect(about.twitter).toMatchObject({ card: "summary_large_image" });
  // The home title already names the brand, so it must bypass the "%s | MasterClass" template.
  expect(pageMetadata("/").title).toEqual({ absolute: expect.stringContaining("MasterClass") });
  expect(() => pageMetadata("/missing")).toThrow();
});
test("structured data is well formed and safe to inline", () => {
  process.env.APP_URL = "https://learning.example.com";
  expect(webPageSchema("/terms").breadcrumb.itemListElement.map(item => item.item)).toEqual(["https://learning.example.com/", "https://learning.example.com/terms"]);
  expect(faqSchema([{ question: "Q?", answer: "A." }]).mainEntity[0]).toEqual({ "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } });
  expect(jsonLd({ text: "</script><script>alert(1)</script>" })).not.toContain("</script>");
});
