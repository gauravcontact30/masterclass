/*
 * One classifier for where a visit came from, used by the Super Admin Traffic sources panel and the weekly report.
 * Order of evidence: the campaign tag (utm_source, e.g. "ig", "fb", "li", "trustmrr"), then the referring host, then
 * Direct (no referrer, or our own host). Platforms are kept apart (Instagram is not folded into Facebook) because the
 * owner promotes on each separately. Android apps send "android-app://com.instagram.android" style referrers; in-app
 * browsers often send none at all, which is why tagged links (?utm_source=instagram) are the reliable signal.
 */
export type SourceId =
  | "direct" | "google" | "bing" | "search" | "instagram" | "facebook" | "linkedin" | "x" | "pinterest" | "youtube"
  | "reddit" | "whatsapp" | "telegram" | "threads" | "quora" | "trustmrr" | "producthunt" | "github" | "ai" | "email" | "referral";

export const SOURCE_LABEL: Record<SourceId, string> = {
  direct: "Direct", google: "Google", bing: "Bing", search: "Other search", instagram: "Instagram", facebook: "Facebook (Meta)",
  linkedin: "LinkedIn", x: "X (Twitter)", pinterest: "Pinterest", youtube: "YouTube", reddit: "Reddit", whatsapp: "WhatsApp",
  telegram: "Telegram", threads: "Threads", quora: "Quora", trustmrr: "TrustMRR", producthunt: "Product Hunt", github: "GitHub",
  ai: "AI assistants", email: "Email", referral: "Other websites",
};
/** Social platforms, for the "Social" total. */
export const SOCIAL_SOURCES = new Set<SourceId>(["instagram", "facebook", "linkedin", "x", "pinterest", "youtube", "reddit", "whatsapp", "telegram", "threads", "quora"]);

const RULES: [SourceId, RegExp][] = [
  ["trustmrr", /trustmrr/],
  ["instagram", /^(ig|insta|instagram)$|(^|\.)instagram\.com$|com\.instagram\.android/],
  ["threads", /^threads$|(^|\.)threads\.(net|com)$/],
  ["facebook", /^(fb|facebook|meta)$|(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$|com\.facebook\./],
  ["linkedin", /^(li|linkedin)$|(^|\.)(linkedin\.com|lnkd\.in)$|com\.linkedin\.android/],
  ["x", /^(x|tw|twitter)$|(^|\.)(t\.co|twitter\.com|x\.com)$|com\.twitter\.android/],
  ["pinterest", /^(pin|pinterest)$|(^|\.)(pinterest\.[a-z.]+|pin\.it)$|com\.pinterest/],
  ["youtube", /^(yt|youtube)$|(^|\.)(youtube\.com|youtu\.be)$|com\.google\.android\.youtube/],
  ["reddit", /^reddit$|(^|\.)(reddit\.com|redd\.it)$/],
  ["whatsapp", /^(wa|whatsapp)$|(^|\.)(whatsapp\.com|wa\.me)$|com\.whatsapp/],
  ["telegram", /^(tg|telegram)$|(^|\.)(telegram\.org|t\.me)$|org\.telegram/],
  ["quora", /^quora$|(^|\.)quora\.com$/],
  ["producthunt", /^(ph|producthunt)$|(^|\.)producthunt\.com$/],
  ["github", /^github$|(^|\.)github\.(com|io)$/],
  ["ai", /^(chatgpt|openai|perplexity|claude|gemini|copilot)$|(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/],
  ["email", /^(email|newsletter|mail|gmail|outlook)$|(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com)$|com\.google\.android\.gm$/],
  ["google", /^(google|gsc|google_search|googleads|adwords)$|(^|\.)google\.[a-z.]+$|com\.google\.android\.googlequicksearchbox/],
  ["bing", /^bing$|(^|\.)bing\.com$/],
  ["search", /(^|\.)(duckduckgo\.com|search\.yahoo\.com|yahoo\.com|yandex\.[a-z]+|baidu\.com|ecosia\.org|search\.brave\.com)$/],
];

const clean = (value: string | null | undefined) => (value ?? "").toLowerCase().trim().replace(/^android-app:\/\//, "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^(www|m|l|lm|out)\./, "");

/** Which platform a visit came from. `ownHosts` are this site's hosts: a referrer from them is an internal click (Direct). */
export function classifySource(input: { utm_source?: string | null; utm_medium?: string | null; referrer_host?: string | null }, ownHosts: readonly string[] = []): SourceId {
  const tag = clean(input.utm_source), host = clean(input.referrer_host), medium = clean(input.utm_medium);
  for (const value of [tag, host]) {
    if (!value) continue;
    if (value === host && ownHosts.some(own => value === own || value.endsWith(`.${own}`))) continue;
    for (const [id, rule] of RULES) if (rule.test(value)) return id;
  }
  if (medium === "email") return "email";
  if (tag) return "referral";
  if (host && !ownHosts.some(own => host === own || host.endsWith(`.${own}`))) return "referral";
  return "direct";
}
