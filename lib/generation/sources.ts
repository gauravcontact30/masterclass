import "server-only";

// Maintained documentation publishers, never arbitrary client-provided hosts.
const documentationHosts = new Set([
  "angular.dev", "dev.java", "developer.android.com", "developer.apple.com", "developer.mozilla.org",
  "developers.google.com", "doc.rust-lang.org", "docs.anthropic.com", "docs.claude.com", "platform.claude.com", "code.claude.com",
  "docs.aws.amazon.com", "docs.docker.com", "docs.flutter.dev", "docs.github.com", "docs.python.org", "docs.ruby-lang.org",
  "en.cppreference.com", "expressjs.com", "firebase.google.com", "getcomposer.org", "git-scm.com", "go.dev",
  "graphql.org", "guides.rubygems.org", "guides.rubyonrails.org", "jestjs.io", "kotlinlang.org", "kubernetes.io",
  "nextjs.org", "nodejs.org", "playwright.dev", "python.langchain.com", "docs.langchain.com", "reference.langchain.com",
  "pytorch.org", "docs.pytorch.org", "react.dev", "redis.io", "router.vuejs.org", "supabase.com", "tailwindcss.com",
  "testing-library.com", "vuejs.org", "www.elastic.co", "www.mongodb.com", "www.php.net", "www.postgresql.org",
  "www.swift.org", "docs.swift.org", "www.tensorflow.org", "www.typescriptlang.org",
  "modelcontextprotocol.io", "www.anthropic.com", "claude.com", "vitest.dev", "zustand.docs.pmnd.rs", "tanstack.com",
  "tc39.es", "devblogs.microsoft.com", "aws.amazon.com", "dora.dev", "developer.hashicorp.com",
  "opentelemetry.io", "prometheus.io",
  "docs.nestjs.com", "docs.smith.langchain.com", "fastapi.tiangolo.com", "javascript.info",
  "js.langchain.com", "langchain-ai.github.io", "mongoosejs.com", "orm.drizzle.team",
  "redux-toolkit.js.org", "redux.js.org", "sre.google", "www.prisma.io",
  "authjs.dev", "clerk.com", "conform.guide", "create.t3.gg", "docs.arcjet.com",
  "docs.astral.sh", "docs.cypress.io", "docs.kinde.com", "neon.com", "neon.tech",
  "upstash.com", "www.inngest.com", "inngest.com", "zod.dev",
]);
export type DocumentationSource = { url: string; title: string; retrievedAt: string; text: string };
export function documentationUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.port || url.username || url.password || !documentationHosts.has(url.hostname)) {
    throw new Error("Unsupported documentation URL");
  }
  url.hash = "";
  return url;
}

function decodeEntities(text: string): string {
  return text.replace(/&#(x[0-9a-f]+|\d+);/gi, (match, code: string) => {
    const point = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match;
  }).replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, key: string) => ({amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "}[key]!));
}
export function documentationText(html: string): { title: string; text: string } {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, "") ?? "Documentation").trim();
  const cleaned = html.replace(/<(script|style|nav|footer|header|aside|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  const main = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? cleaned;
  const text = decodeEntities(main.replace(/<\/(?:p|div|h[1-6]|li|pre|section)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/[\t ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return { title, text: text.slice(0, 24000) };
}

async function fetchSource(value: string): Promise<DocumentationSource> {
  let url = documentationUrl(value);
  const signal = AbortSignal.timeout(20000);
  for (let hop = 0; hop < 5; hop++) {
    const response = await fetch(url, { signal, cache: "no-store", redirect: "manual", headers: { Accept: "text/html, text/plain, text/markdown", "User-Agent": "MasterClassDocumentationReader/1.0" } });
    if ([301,302,303,307,308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get("location");
      if (!location) throw new Error("Documentation redirect missing location");
      url = documentationUrl(new URL(location, url).href);
      continue;
    }
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !/text\/(html|plain|markdown)/i.test(type)) {
      await response.body?.cancel();
      throw new Error("Documentation is unavailable or unsupported");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Empty documentation response");
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      size += chunk.length;
      if (size > 2_000_000) { await reader.cancel(); throw new Error("Documentation response too large"); }
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString("utf8");
    const extracted = type.includes("text/html") ? documentationText(body) : { title: url.pathname, text: body.slice(0, 24000) };
    if (extracted.text.length < 300 || /just a moment|access denied|verify you are human/i.test(extracted.title)) throw new Error("Documentation contains no usable learning content");
    return { ...extracted, url: url.href, retrievedAt: new Date().toISOString() };
  }
  throw new Error("Too many documentation redirects");
}

export async function fetchDocumentation(references: string[]): Promise<DocumentationSource[]> {
  const urls = [...new Set(references.map(value => documentationUrl(value).href))];
  if (!urls.length || urls.length > 8) throw new Error("A learning scope needs 1–8 documentation sources");
  // Failure is intentional: never silently generate from model memory instead.
  return Promise.all(urls.map(fetchSource));
}
