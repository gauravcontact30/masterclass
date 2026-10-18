/**
 * Learning content for the Technology docs showcase, read from each vendor's official website: the page's own
 * title, description and section headings, plus the current release from the official registry (npm, nodejs.org).
 * Used by `npm run docs:tech` (writes the committed snapshot) and by the daily-cached server refresh.
 */
import { TECH_DOCS } from "./tech-docs";

/** `complete`: the page gave its own title and description (a single-page-app shell only yields the site name). */
export type OfficialPage = { url: string; ok: boolean; complete: boolean; status: number; title: string; description: string; lead: string; sections: string[]; fetchedAt: string };
export type OfficialTechDocs = { fetchedAt: string; versions: Record<string, { version: string; date?: string; source: string }>; pages: Record<string, OfficialPage> };

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};
const SKIP_HEADING = /^(on this page|table of contents|contents|next steps?|see also|related|feedback|was this (page )?helpful\??|edit this page|previous|next|footer|resources|community|learn more|subscribe|newsletter|sign in|search|platinum sponsors|gold sponsors|sponsors)$/i;
/** Site names and app shells, never a page's own title or description. */
const GENERIC_TITLE = /^(home|index|blog|vue\.js|node\.js|salesforce( developers| help)?|documentation|docs|node\.js v[\d.]+ documentation)$/i;
const GENERIC_TEXT = /^(salesforce developer website|vue\.js - the progressive javascript framework|the official blog for the vue\.js project)$/i;
// Boilerplate, code and preambles: never a page's summary.
const NOT_PROSE = /cookie|javascript is (disabled|required)|table of contents|^on this page|^you are reading|^tip:|^learn \w+ with video|^node\.js v\d|^this (page|chapter) (assumes|and many)|^in this example|[{}`$]|=>|\/\/|--\w/i;
const INVISIBLE = new RegExp("[​‌‍﻿]", "g");

const decode = (text: string) => text
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, "\"").replace(/&#0?39;|&#x27;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const clean = (html: string) => decode(html.replace(/<[^>]+>/g, " ")).replace(INVISIBLE, "").replace(/[#¶]\s*$/, "").replace(/\s+/g, " ").trim();
const meta = (html: string, key: string) => {
  const tag = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*>`, "i"))?.[0];
  return tag ? decode(tag.match(/content=["']([^"']*)["']/i)?.[1] ?? "").trim() : "";
};
/** "Signals • Overview • Angular" → "Signals"; keeps a short title whole. */
const tidyTitle = (title: string) => {
  const parts = title.split(/\s+[|•·–—-]\s+/).map(part => part.trim()).filter(Boolean);
  return (parts[0]?.length ?? 0) >= 4 ? parts[0] : title.trim();
};
const clip = (text: string, max: number) => text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;

/** Title, description, lead paragraph and up to five section headings, read from a page's HTML. */
export function extractOfficialPage(html: string, url: string, status = 200): OfficialPage {
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, "");
  // The page's content region: <main>, Node's API docs' #apicontent, an <article>, or the whole body.
  const apiContent = body.search(/id=["']?apicontent\b/i);
  const main = body.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? (apiContent >= 0 ? body.slice(apiContent) : null) ?? body.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? body;
  const h1 = clean(main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const title = [h1, meta(html, "og:title"), clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")]
    .map(tidyTitle).find(t => t.length >= 3 && t.length <= 110 && !GENERIC_TITLE.test(t)) ?? "";
  // Minified HTML may never close a <p>: a paragraph also ends at the next block element.
  const prose = main.replace(/<(table|details|aside)[\s>][\s\S]*?<\/\1>/gi, "");
  const lead = clip([...prose.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)(?=<\/p>|<(?:p|pre|div|h\d|ul|ol|table|section|details)[\s>])/gi)].map(m => clean(m[1])).find(text => text.length >= 40 && !NOT_PROSE.test(text)) ?? "", 260);
  const metaText = meta(html, "description") || meta(html, "og:description");
  const description = clip(metaText && !GENERIC_TEXT.test(metaText) && !NOT_PROSE.test(metaText) ? metaText : lead, 260);
  const headings = (level: 2 | 3) => {
    const found: string[] = [];
    const pattern = level === 2 ? /<h2[^>]*>([\s\S]*?)<\/h2>/gi : /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    for (const m of main.matchAll(pattern)) {
      const text = clean(m[1]);
      if (text.length < 3 || text.length > 80 || SKIP_HEADING.test(text) || text === title || found.includes(text)) continue;
      found.push(text);
      if (found.length === 5) break;
    }
    return found;
  };
  const h2 = headings(2);
  const sections = h2.length >= 2 ? h2 : headings(3);
  return { url, ok: status < 400, complete: status < 400 && !!title && !!description, status, title, description, lead, sections, fetchedAt: new Date().toISOString() };
}

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
const failed = (url: string, status: number): OfficialPage => ({ url, ok: false, complete: false, status, title: "", description: "", lead: "", sections: [], fetchedAt: new Date().toISOString() });
async function page(url: string, fetcher: Fetch): Promise<OfficialPage> {
  try {
    const res = await fetcher(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(15_000) });
    return res.ok ? extractOfficialPage(await res.text(), url, res.status) : failed(url, res.status);
  } catch {
    return failed(url, 0);
  }
}
async function json<T>(url: string, fetcher: Fetch): Promise<T | null> {
  try { const res = await fetcher(url, { signal: AbortSignal.timeout(15_000) }); return res.ok ? await res.json() as T : null; } catch { return null; }
}
async function versions(fetcher: Fetch): Promise<OfficialTechDocs["versions"]> {
  const out: OfficialTechDocs["versions"] = {};
  const npm = async (id: string, pkg: string, label: (v: string) => string) => {
    const data = await json<{ version: string }>(`https://registry.npmjs.org/${pkg}/latest`, fetcher);
    if (data?.version) out[id] = { version: label(data.version), source: `npmjs.com/package/${pkg}` };
  };
  await Promise.all([
    npm("angular", "@angular/core", v => v), npm("vue", "vue", v => v), npm("ai-gateway", "ai", v => `AI SDK ${v}`),
    (async () => {
      const releases = await json<{ version: string; date: string }[]>("https://nodejs.org/dist/index.json", fetcher);
      const latest = releases?.find(r => r.version.startsWith("v26."));
      if (latest) out.node = { version: latest.version, date: latest.date, source: "nodejs.org/dist" };
    })(),
  ]);
  return out;
}

/** Every official URL the showcase cites: each platform's docs home and each learning material. */
export const officialUrls = () => [...new Set(TECH_DOCS.flatMap(tech => [tech.docs, ...tech.materials.map(m => m.url)]))];

/**
 * Fetch every official page and version. A page that fails keeps its previous complete copy from `previous`, so
 * one vendor's outage or bot wall never blanks a card.
 */
export async function fetchOfficialTechDocs(previous: OfficialTechDocs | null, fetcher: Fetch = fetch): Promise<OfficialTechDocs> {
  const [pages, current] = await Promise.all([Promise.all(officialUrls().map(url => page(url, fetcher))), versions(fetcher)]);
  // A description shared by several pages of one site is boilerplate: use that page's own lead paragraph instead.
  // (Two URLs of the same page, with the same title, may share it legitimately.)
  const titles = new Map<string, Set<string>>();
  for (const p of pages) if (p.description) {
    const key = `${new URL(p.url).host}|${p.description}`;
    titles.set(key, (titles.get(key) ?? new Set()).add(p.title));
  }
  for (const p of pages) if (p.description && (titles.get(`${new URL(p.url).host}|${p.description}`)?.size ?? 0) > 1 && p.lead) p.description = p.lead;
  const merged: OfficialTechDocs["pages"] = {};
  for (const fresh of pages) {
    const before = previous?.pages[fresh.url];
    merged[fresh.url] = fresh.complete || !before?.complete ? fresh : before;
  }
  return { fetchedAt: new Date().toISOString(), versions: { ...previous?.versions, ...current }, pages: merged };
}
