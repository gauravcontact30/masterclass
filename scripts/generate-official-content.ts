/**
 * Write the learning content for Search cards (`--set search`) and API Docs
 * entries (`--set api`) from each card's official documentation.
 *
 * Per card, Claude searches and fetches only the card's official sites
 * (lib/official-content/domains.ts), then writes a card in its own words in
 * which every key point quotes the page that supports it. verifyDraft checks
 * each quote against the text the fetch tool actually returned: unsupported or
 * copied points are dropped, and a card left with too few points is rejected,
 * not published. Verified cards land in content/official/<set>/<tab|package>.json,
 * which lib/server/official-content.ts reads at request time, so the pages pick
 * them up without a rebuild.
 *
 * Resumable: cards already written are skipped, and so are cards the report
 * shows were rejected (--retry-rejected retries them). Every card's outcome,
 * evidence and token cost is appended to --report (JSON lines), and a cost
 * total is printed at the end, so a pilot measures what the full run will cost.
 *
 *   npm run official:search -- --dry-run                       # list the work and domains, no calls
 *   npm run official:search -- --tabs zod,react-19 --limit 10  # the next 10 cards of two tabs
 *   npm run official:api -- --packages nextjs --only useRouter # one entry
 *   npm run official:api -- --model claude-sonnet-5-5          # a cheaper model
 *
 * Needs ANTHROPIC_API_KEY. --concurrency (default 4) caps cards in flight.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { TECHNOLOGY_HANDBOOKS } from "../lib/pro-learn/technology-handbooks";
import { awsHighlights, type AwsHighlight } from "../lib/pro-learn/aws-highlights";
import { aiTerms } from "../lib/pro-learn/ai-glossary";
import { pythonTopics } from "../lib/pro-learn/python-handbook";
import { API_PACKAGES, API_STATUSES, API_TYPES } from "../lib/api-docs";
import { API_DETAILS } from "../lib/api-docs-details";
import { apiDomainPolicy, BLOCKED_HOSTS, isOfficialUrl, searchDomainPolicy, type DomainPolicy } from "../lib/official-content/domains";
import { officialDraftSchema, officialSlug, searchCardKey, verifyDraft, type FetchedPage, type OfficialCard } from "../lib/official-content/card";

/* ---------------- Arguments ---------------- */
const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const option = (name: string) => { const at = argv.indexOf(`--${name}`); return at >= 0 ? argv[at + 1] : undefined; };
const list = (name: string) => option(name)?.split(",").map(item => item.trim()).filter(Boolean);

const set = option("set");
if (set !== "search" && set !== "api") throw new Error("--set search|api is required");
const provider = option("provider") ?? "anthropic";
if (provider !== "anthropic" && provider !== "perplexity") throw new Error("--provider anthropic|perplexity");
const model = option("model") ?? (provider === "perplexity" ? "sonar-pro" : "claude-opus-5-5");
const effort = option("effort") ?? "medium";
const concurrency = Number(option("concurrency") ?? 4);
const limit = option("limit") ? Number(option("limit")) : Infinity;
const only = list("only"), tabs = list("tabs"), packages = list("packages");
const dryRun = flag("dry-run"), retryRejected = flag("retry-rejected"), widen = flag("widen"), useFormat = !flag("no-format");
const outDir = join(process.cwd(), "content", "official", set);
const reportPath = option("report") ?? join(process.cwd(), "content", "official", `report-${set}.jsonl`);
/** USD per million tokens, and per web search; override with --price-in / --price-out. */
const PRICES: Record<string, [number, number]> = { "sonar-pro": [3, 15], sonar: [1, 1],"claude-opus-5-5": [4, 20], "claude-opus-5": [5, 25], "claude-sonnet-5-5": [3, 15], "claude-sonnet-5": [3, 15], "claude-haiku-5-5": [1, 5] };
const [priceIn, priceOut] = [Number(option("price-in") ?? PRICES[model]?.[0] ?? 4), Number(option("price-out") ?? PRICES[model]?.[1] ?? 20)];
const PRICE_PER_SEARCH = 0.01;

/* ---------------- Work list ---------------- */
type Work = { file: string; key: string; label: string; policy: DomainPolicy; brief: string; widened?: boolean };

function searchWork(): Work[] {
  const tabsList: { technology: string; topics: AwsHighlight[]; sources?: { url: string }[] }[] = [
    ...TECHNOLOGY_HANDBOOKS.map(book => ({ technology: book.title, topics: book.topics, sources: book.sources })),
    { technology: "AWS", topics: awsHighlights() }, { technology: "AI terms", topics: aiTerms() }, { technology: "Python", topics: pythonTopics() },
  ];
  return tabsList.filter(tab => !tabs || tabs.some(wanted => officialSlug(tab.technology).includes(officialSlug(wanted))))
    .flatMap(tab => {
      const policy = searchDomainPolicy(tab.technology, tab.sources);
      return tab.topics.filter(topic => !topic.vocabulary).map(topic => ({
        file: officialSlug(tab.technology), key: searchCardKey(topic.category, topic.name), label: `${tab.technology} › ${topic.name}`, policy,
        brief: `Topic: ${JSON.stringify(topic.name)}\nTechnology: ${tab.technology}\nCategory: ${topic.category}\nWhat our catalogue says about it: ${topic.summary}`,
      }));
    });
}

function apiWork(): Work[] {
  return API_PACKAGES.filter(pkg => !packages || packages.includes(pkg.id)).flatMap(pkg => {
    const policy = apiDomainPolicy(pkg);
    return pkg.entries.filter(entry => !API_DETAILS[`${pkg.id}:${entry.name}`]).map(entry => {
      const kind = API_TYPES.find(type => type.k === entry.kind)?.label ?? "identifier";
      const status = API_STATUSES.find(item => item.id === entry.status)?.label ?? "Stable";
      return {
        file: officialSlug(pkg.id), key: entry.name, label: `${pkg.name} › ${entry.name}`, policy,
        brief: `Identifier: ${JSON.stringify(entry.name)}\nPackage: ${pkg.name} — ${pkg.description}\nKind: ${kind}\nStatus in our catalogue: ${status}\nOfficial documentation root: ${pkg.docs}`,
      };
    });
  });
}

/* ---------------- Output files ---------------- */
const readJson = (path: string): Record<string, OfficialCard> => existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
const fileLocks = new Map<string, Promise<void>>();
function saveCard(file: string, key: string, card: OfficialCard) {
  const path = join(outDir, `${file}.json`);
  const next = (fileLocks.get(path) ?? Promise.resolve()).then(() => {
    const cards = readJson(path);
    cards[key] = card;
    const sorted = Object.fromEntries(Object.entries(cards).sort(([a], [b]) => a.localeCompare(b)));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(`${path}.tmp`, `${JSON.stringify(sorted, null, 1)}\n`);
    renameSync(`${path}.tmp`, path);
  });
  fileLocks.set(path, next);
  return next;
}
/** Latest rejection reason per card, from the report. */
function rejectedKeys() {
  const rejected = new Map<string, string>();
  if (!existsSync(reportPath)) return rejected;
  for (const line of readFileSync(reportPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as { file: string; key: string; status: string; reason?: string };
    const id = `${row.file}\u0000${row.key}`;
    if (row.status === "rejected") rejected.set(id, row.reason ?? ""); else rejected.delete(id);
  }
  return rejected;
}

/* ---------------- One card ---------------- */
const DRAFT_JSON_SCHEMA = (() => {
  const str = { type: "string" };
  const obj = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });
  const backed = obj({ text: str, evidence: str });
  return obj({
    found: { type: "boolean" }, sourceUrl: str, sourceTitle: str, summary: str, explanation: str, syntax: str,
    parameters: { type: "array", items: obj({ name: str, type: str, description: str }) }, returns: str,
    keyPoints: { type: "array", items: backed }, gotchas: { type: "array", items: backed },
    example: obj({ title: str, code: str, language: str, explanation: str }),
    useCases: { type: "array", items: obj({ title: str, scenario: str }) }, related: { type: "array", items: str }, since: str,
    interview: { type: "array", items: obj({ question: str, answer: str, followUp: str }) },
  });
})();

const SYSTEM = `You write learning cards for software engineers, strictly from official documentation. You research with the web tools, then answer with one JSON object and nothing else.`;

function instructions(work: Work) {
  const where = work.widened ? "This is a general concept with no single owner: base the card on the official documentation of a major framework or vendor that documents it (for example PyTorch, TensorFlow, Keras, Hugging Face, scikit-learn, Google for Developers, Microsoft Learn, AWS, MDN), never blogs, tutorials, Q&A sites, videos or Wikipedia. The card must explain the concept itself, never a library or product that shares its name."
    : "allowed" in work.policy ? `The tools only reach these official sites: ${work.policy.allowed.join(", ")}.` : "Use only the project's own official documentation site (never blogs, tutorials, Q&A sites or videos).";
  return `${work.brief}

${where}
1. Search for the official documentation page that covers exactly this ${set === "api" ? "identifier" : "topic"}, then fetch it with web_fetch (fetch at most two pages; prefer the reference page over a guide).
2. Write the card in your own words for a learner; never copy sentences from the page. Use the docs for the current stable major version only, never archived or legacy versioned docs (such as v3.* or legacy.* sites).
3. Every keyPoints and gotchas entry needs "evidence": 5 to 25 consecutive words copied exactly, character for character, from a page you fetched, that support the point. Points you cannot support this way must be left out.
4. Fields: summary ≤ 2 sentences (≤ 400 chars); explanation one paragraph (≤ 650 chars) on how it works; syntax the real signature, command or declaration ("" if none); parameters and returns from the page ([] and "" if not applicable); 4-8 keyPoints (each ≤ 280 chars); 0-4 gotchas (pitfalls the page warns about); example a short, modern, runnable snippet (≤ 35 lines, ≤ 1400 chars) with language one of typescript, tsx, javascript, python, bash, json, yaml, hcl, dockerfile, css, html, text, and a one-sentence explanation; 2-4 useCases; related names from the same documentation; since = version that introduced it if the page says so, else ""; interview: 3 questions a technical interviewer is likely to ask about this, each with a correct, to-the-point model answer (2-4 sentences, using the page) and a followUp that poses a harder related question and answers it in one or two sentences.
5. Say each idea once: no key point, gotcha, use case or answer may repeat the summary, the explanation or another entry.
6. sourceUrl is the exact URL you fetched that the card is based on, and sourceTitle that page's title.
7. If the official site does not document this, return found: false with empty strings and arrays.
Answer with the JSON object only.`;
}

type Outcome = { status: "ok" | "rejected"; reason?: string; card?: OfficialCard; dropped?: unknown; evidence?: unknown; sourceUrl?: string; usage: Usage };
type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number; searches: number; cost: number };

const client = new Anthropic({ maxRetries: 6 });

async function research(work: Work): Promise<Outcome> {
  const domains = "allowed" in work.policy ? { allowed_domains: work.policy.allowed } : { blocked_domains: work.policy.blocked };
  // The basic tool versions return the fetched page text in the response, which the
  // evidence check needs; the dynamic-filtering versions hand back only Claude's filtered view.
  const tools: Anthropic.ToolUnion[] = [
    { type: "web_search_20250305", name: "web_search", max_uses: 3, ...domains },
    { type: "web_fetch_20250910", name: "web_fetch", max_uses: 3, max_content_tokens: 30000, ...domains },
  ];
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: instructions(work) }];
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, searches: 0, cost: 0 };
  const pages: FetchedPage[] = [];
  let text = "";
  for (let turn = 0; turn < 5; turn++) {
    const params = {
      model, max_tokens: 16000, system: SYSTEM, tools, messages, thinking: { type: "adaptive" },
      output_config: { effort, ...(useFormat ? { format: { type: "json_schema", schema: DRAFT_JSON_SCHEMA } } : {}) },
    } as unknown as Anthropic.MessageStreamParams;
    const response = await client.messages.stream(params).finalMessage();
    usage.input += response.usage.input_tokens; usage.output += response.usage.output_tokens;
    usage.cacheRead += response.usage.cache_read_input_tokens ?? 0; usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0;
    usage.searches += response.usage.server_tool_use?.web_search_requests ?? 0;
    for (const block of response.content) {
      if (block.type === "web_fetch_tool_result" && block.content.type === "web_fetch_result" && block.content.content.source.type === "text") {
        pages.push({ url: block.content.url, text: block.content.content.source.data });
      }
    }
    text = response.content.flatMap(block => block.type === "text" ? [block.text] : []).join("");
    if (response.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: response.content });
  }
  usage.cost = (usage.input * priceIn + usage.cacheWrite * priceIn * 1.25 + usage.cacheRead * priceIn * 0.1 + usage.output * priceOut) / 1e6 + usage.searches * PRICE_PER_SEARCH;
  return judge(text, pages, work, usage);
}

/** Readable text of an HTML page: what the evidence quotes are checked against. */
function pageText(html: string) {
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
  return html.replace(/<(script|style|noscript|svg|nav|header|footer)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (all, name: string) => entities[name.toLowerCase()]
      ?? (name.startsWith("#x") ? String.fromCodePoint(parseInt(name.slice(2), 16)) : name.startsWith("#") ? String.fromCodePoint(Number(name.slice(1))) : all))
    .replace(/\s+/g, " ");
}

async function fetchPage(url: string): Promise<FetchedPage | undefined> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (learning-card verifier)", Accept: "text/html,text/plain" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!response.ok) return undefined;
    const body = await response.text();
    return { url, text: /html/i.test(response.headers.get("content-type") ?? "") ? pageText(body) : body };
  } catch { return undefined; }
}

/**
 * Perplexity searches the official sites and drafts the card; the script then
 * fetches the cited page itself, so the evidence check runs against the real
 * page exactly as it does for Claude's own fetches.
 */
async function researchPerplexity(work: Work): Promise<Outcome> {
  // Perplexity takes at most 20 domains; a leading "-" excludes one.
  const filter = "allowed" in work.policy ? work.policy.allowed.slice(0, 20) : work.policy.blocked.slice(0, 20).map(host => `-${host}`);
  const prompt = instructions(work).replace(/^1\. .*$/m, "1. Find the official documentation page that covers exactly this, and base the card on that one page.");
  let body: { choices?: { message?: { content?: string } }[]; citations?: string[]; usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: { total_cost?: number } }; error?: { message?: string } } = {};
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }], search_domain_filter: filter, max_tokens: 7000,
        response_format: { type: "json_schema", json_schema: { schema: DRAFT_JSON_SCHEMA } } }),
    });
    body = await response.json().catch(() => ({}));
    if (response.status === 429 || response.status >= 500) { await new Promise(done => setTimeout(done, 2000 * 2 ** attempt)); continue; }
    if (!response.ok) throw new Error(`perplexity ${response.status}: ${body.error?.message ?? JSON.stringify(body).slice(0, 200)}`);
    break;
  }
  const input = body.usage?.prompt_tokens ?? 0, output = body.usage?.completion_tokens ?? 0;
  const usage: Usage = { input, output, cacheRead: 0, cacheWrite: 0, searches: 1, cost: body.usage?.cost?.total_cost ?? (input * priceIn + output * priceOut) / 1e6 + PRICE_PER_SEARCH };
  const text = body.choices?.[0]?.message?.content ?? "";
  let sourceUrl = "";
  try { sourceUrl = String((JSON.parse(jsonOf(text)) as { sourceUrl?: unknown }).sourceUrl ?? ""); } catch {}
  const urls = [...new Set([sourceUrl, ...(body.citations ?? [])])].filter(url => url && isOfficialUrl(url, work.policy)).slice(0, 3);
  const pages = (await Promise.all(urls.map(fetchPage))).filter((page): page is FetchedPage => Boolean(page));
  return judge(text, pages, work, usage);
}

/** The JSON object in a reply, ignoring any reasoning, fences or prose around it. */
const jsonOf = (text: string) => { const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, ""); return cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1); };

function judge(text: string, pages: FetchedPage[], work: Work, usage: Usage): Outcome {
  let raw: unknown;
  try { raw = JSON.parse(jsonOf(text)); } catch { return { status: "rejected", reason: "unparseable_reply", dropped: { length: text.length, tail: text.slice(-240) }, usage }; }
  const parsed = officialDraftSchema.safeParse(raw);
  if (!parsed.success) return { status: "rejected", reason: `schema: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`, usage };
  const draft = parsed.data;
  const verdict = verifyDraft(draft, pages, work.policy);
  const evidence = [...draft.keyPoints, ...draft.gotchas];
  if (!verdict.ok) return { status: "rejected", reason: verdict.reason, dropped: verdict.dropped, evidence, sourceUrl: draft.sourceUrl, usage };
  return { status: "ok", card: verdict.card, dropped: verdict.dropped, evidence, sourceUrl: draft.sourceUrl, usage };
}

/* ---------------- Status ---------------- */
/**
 * content/official/STATUS.md: for both pages, every tab or package with its
 * cards marked done, rejected (with the reason) or still pending.
 */
function writeStatus() {
  const lines = ["# Official learning content — status", "", `Updated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC.`, "",
    "A card is **done** when its content was written from its official documentation page and every key point passed the evidence check; **rejected** when the official site did not document it or too few points could be verified (it keeps its existing content); **pending** when it has not been attempted yet.", ""];
  const summary: string[] = [];
  for (const [page, which, works] of [["Search", "search", searchWork()], ["API Docs", "api", apiWork()]] as const) {
    const rows = new Map<string, { status: string; reason?: string }>();
    const report = join(process.cwd(), "content", "official", `report-${which}.jsonl`);
    if (existsSync(report)) for (const line of readFileSync(report, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line) as { file: string; key: string; status: string; reason?: string };
      rows.set(`${row.file}\u0000${row.key}`, row);
    }
    const groups = new Map<string, { label: string; done: string[]; rejected: string[]; pending: string[] }>();
    for (const work of works) {
      const [label, name] = work.label.split(" › ");
      const group = groups.get(work.file) ?? { label, done: [], rejected: [], pending: [] };
      groups.set(work.file, group);
      const written = Boolean(readJsonCached(join(process.cwd(), "content", "official", which, `${work.file}.json`))[work.key]);
      const row = rows.get(`${work.file}\u0000${work.key}`);
      if (written) group.done.push(name);
      else if (row?.status === "rejected") group.rejected.push(`${name} _(${row.reason})_`);
      else group.pending.push(name);
    }
    const all = [...groups.values()];
    const total = (key: "done" | "rejected" | "pending") => all.reduce((sum, group) => sum + group[key].length, 0);
    summary.push(`| ${page} | ${total("done")} | ${total("rejected")} | ${total("pending")} | ${all.filter(group => !group.pending.length).length} of ${all.length} |`);
    lines.push(`## ${page} page`, "", "| Tab / package | Done | Rejected | Pending | State |", "|---|---|---|---|---|",
      ...all.map(group => `| ${group.label} | ${group.done.length} | ${group.rejected.length} | ${group.pending.length} | ${group.pending.length ? group.done.length || group.rejected.length ? "In progress" : "Not started" : "Completed"} |`), "");
    for (const group of all) {
      lines.push(`### ${group.label}`, "");
      for (const [title, names] of [["Done", group.done], ["Rejected", group.rejected], ["Pending", group.pending]] as const) {
        if (names.length) lines.push(`**${title} (${names.length}):** ${names.join(" · ")}`, "");
      }
    }
  }
  lines.splice(6, 0, "| Page | Done | Rejected | Pending | Tabs completed |", "|---|---|---|---|---|", ...summary, "",
    `API Docs also has ${Object.keys(API_DETAILS).length} hand-written entries, which are not regenerated.`, "");
  const path = join(process.cwd(), "content", "official", "STATUS.md");
  writeFileSync(path, lines.join("\n"));
  console.log(summary.join("\n"));
  console.log(`Wrote ${path}`);
}
const jsonCache = new Map<string, Record<string, OfficialCard>>();
const readJsonCached = (path: string) => jsonCache.get(path) ?? jsonCache.set(path, readJson(path)).get(path)!;

/* ---------------- Run ---------------- */
async function main() {
  if (flag("status")) return writeStatus();
  const all = set === "search" ? searchWork() : apiWork();
  const rejected = retryRejected ? new Map<string, string>() : rejectedKeys();
  const existing = new Map<string, Record<string, OfficialCard>>();
  const done = (work: Work) => {
    if (!existing.has(work.file)) existing.set(work.file, readJson(join(outDir, `${work.file}.json`)));
    // A card written before interview questions existed is written again.
    return Array.isArray(existing.get(work.file)![work.key]?.interview);
  };
  // --widen: a second pass over cards the tab's or package's own site does not
  // document (general concepts such as "Transformer" under the OpenAI package),
  // searching any project's documentation with the blog and tutorial hosts still refused.
  const id = (work: Work) => `${work.file}\u0000${work.key}`;
  const queue = (widen
    ? all.flatMap(work => {
      const reason = rejected.get(id(work)) ?? "";
      // Only a card its own site does not document searches wider; a cut-off reply
      // or a rejected source URL is retried on the official sites as before.
      if (reason === "not_found_on_official_site") return [{ ...work, policy: { blocked: BLOCKED_HOSTS }, widened: true }];
      return ["unparseable_reply", "source_not_official", "source_not_fetched"].includes(reason) ? [work] : [];
    })
    : all.filter(work => !rejected.has(id(work))))
    .filter(work => (!only || only.includes(work.key.split("::").pop()!)) && !done(work)).slice(0, limit);
  console.log(`${set}: ${all.length} cards, ${queue.length} to write with ${model} (effort ${effort})`);
  if (dryRun) {
    const byFile = new Map<string, { count: number; policy: DomainPolicy }>();
    for (const work of queue) byFile.set(work.file, { count: (byFile.get(work.file)?.count ?? 0) + 1, policy: work.policy });
    for (const [file, { count, policy }] of byFile) console.log(`  ${file}: ${count}  ${"allowed" in policy ? policy.allowed.join(", ") : "open (blogs blocked)"}`);
    return;
  }
  mkdirSync(dirname(reportPath), { recursive: true });
  const totals = { ok: 0, rejected: 0, error: 0, cost: 0 };
  let next = 0, stop = false;
  const worker = async () => {
    while (!stop && next < queue.length) {
      const work = queue[next++];
      const at = new Date().toISOString();
      try {
        const run = provider === "perplexity" ? researchPerplexity : research;
        let outcome = await run(work);
        // A cut-off or malformed reply is intermittent: one more try usually parses.
        if (outcome.reason === "unparseable_reply") {
          const spent = outcome.usage.cost;
          outcome = await run(work);
          outcome.usage.cost += spent;
        }
        totals.cost += outcome.usage.cost;
        if (outcome.card) await saveCard(work.file, work.key, outcome.card);
        totals[outcome.status]++;
        appendFileSync(reportPath, `${JSON.stringify({ at, file: work.file, key: work.key, status: outcome.status, reason: outcome.reason, sourceUrl: outcome.sourceUrl, dropped: outcome.dropped, evidence: outcome.evidence, usage: outcome.usage })}\n`);
        console.log(`${outcome.status === "ok" ? "✓" : "✗"} ${work.label}${outcome.reason ? `  (${outcome.reason})` : ""}  $${outcome.usage.cost.toFixed(3)}`);
      } catch (failure) {
        totals.error++;
        const message = failure instanceof Error ? failure.message : String(failure);
        appendFileSync(reportPath, `${JSON.stringify({ at, file: work.file, key: work.key, status: "error", reason: message.slice(0, 300) })}\n`);
        console.log(`! ${work.label}  ${message.slice(0, 160)}`);
        // Nothing after this can succeed; stop rather than burn through the queue.
        if (/credit balance|authentication|invalid x-api-key|perplexity 40[123]|output_config|json_schema/i.test(message)) stop = true;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  const attempted = totals.ok + totals.rejected;
  console.log(`\n${totals.ok} written, ${totals.rejected} rejected, ${totals.error} errors — $${totals.cost.toFixed(2)}${attempted ? ` ($${(totals.cost / attempted).toFixed(3)} per card)` : ""}`);
  if (stop) process.exitCode = 1;
}

main();
