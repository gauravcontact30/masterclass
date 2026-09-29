/** @jest-environment node */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_PAGES, faqSchema, isIndexable, jsonLd, pageMetadata, siteUrl, webPageSchema, websiteSchema } from "@/lib/seo";
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
  expect(sitemap().map(entry => entry.url)).toEqual(["https://learning.example.com/", "https://learning.example.com/courses", "https://learning.example.com/about", "https://learning.example.com/contact", "https://learning.example.com/privacy", "https://learning.example.com/terms"]);
  expect(robots().sitemap).toBe("https://learning.example.com/sitemap.xml");
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
  for (const path of paths.filter(path => path !== "/")) expect(existsSync(join(process.cwd(), "app", "(site)", path.slice(1), "page.tsx"))).toBe(true);
  for (const page of PUBLIC_PAGES) {
    expect(page.description.length).toBeGreaterThanOrEqual(70);
    expect(page.description.length).toBeLessThanOrEqual(260);
  }
});
test("page metadata carries a canonical URL and a complete social card", () => {
  const about = pageMetadata("/about");
  expect(about.title).toBe("About MasterClass");
  expect(about.alternates?.canonical).toBe("/about");
  expect(about.openGraph).toMatchObject({ url: "/about", title: "About MasterClass | MasterClass", images: [expect.objectContaining({ width: 1200, height: 630 })] });
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
