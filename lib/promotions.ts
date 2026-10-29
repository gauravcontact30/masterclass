import { isGoogleSearchHost, nextTrafficSource, type TrafficSource } from "./traffic-attribution";
/*
 * Promotional tracking: which social platforms and campaigns bring people to the site, and what they do next.
 * Pure functions over rows the API reads (site_visits, profiles, subscriptions, promotions), so the attribution
 * rules are testable without a database and shared by the super admin page. No zod or server imports here.
 */

export const PLATFORMS = ["instagram", "facebook", "linkedin", "telegram", "medium", "pinterest", "coursera", "youtube", "x", "whatsapp", "google_search", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];
/** The platforms the team promotes on first; the rest are tracked when traffic arrives from them. */
export const PRIMARY_PLATFORMS: Platform[] = ["instagram", "facebook", "linkedin", "telegram", "medium", "pinterest", "coursera"];
export const PLATFORM_LABEL: Record<Platform, string> = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", telegram: "Telegram", medium: "Medium", pinterest: "Pinterest", coursera: "Coursera", youtube: "YouTube", x: "X (Twitter)", whatsapp: "WhatsApp", google_search: "Google Search", other: "Other" };
export const PROMOTION_FORMATS = ["post", "reel", "story", "video", "ad", "article", "pin", "idea_pin", "board", "course", "lecture", "group", "channel", "live"] as const;
export const PROMOTION_STATUSES = ["planned", "live", "paused", "ended"] as const;
export type PromotionFormat = (typeof PROMOTION_FORMATS)[number];
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export type Promotion = {
  id: string; created_at: string; updated_at: string; platform: Platform; title: string; format: PromotionFormat; status: PromotionStatus;
  url: string | null; utm_campaign: string; audience: string | null; owner: string | null; starts_on: string | null; ends_on: string | null;
  budget_inr: number; spend_inr: number; reach: number; impressions: number; engagements: number; followers_gained: number; notes: string | null;
  /** Figures only one platform reports (Medium reads, Pinterest saves, Coursera enrolments); keys from PLATFORM_METRICS. */
  platform_metrics?: Partial<Record<MetricKey, number>> | null;
};

/*
 * Platform-specific figures, named as each platform's own analytics names them. Medium (Stats): views, reads, claps,
 * responses, member reading time and Partner Program earnings. Pinterest (Analytics): saves, pin clicks, outbound
 * clicks and video views on top of impressions. Coursera (instructor/partner dashboard): enrolments, active learners,
 * completions, ratings and revenue. An admin enters them on the promotion; the page totals them per platform.
 */
export type MetricDef = { key: string; label: string; decimals?: number; max?: number };
export const PLATFORM_METRICS = {
  instagram: [{ key: "likes", label: "Likes" }, { key: "comments", label: "Comments" }, { key: "shares", label: "Shares" }, { key: "saves", label: "Saves" }, { key: "profile_visits", label: "Profile visits" }, { key: "link_clicks", label: "Link clicks" }],
  facebook: [{ key: "reactions", label: "Reactions" }, { key: "comments", label: "Comments" }, { key: "shares", label: "Shares" }, { key: "link_clicks", label: "Link clicks" }, { key: "video_views", label: "Video views" }],
  linkedin: [{ key: "reactions", label: "Reactions" }, { key: "comments", label: "Comments" }, { key: "reposts", label: "Reposts" }, { key: "link_clicks", label: "Link clicks" }],
  telegram: [{ key: "views", label: "Post views" }, { key: "reactions", label: "Reactions" }, { key: "shares", label: "Shares" }, { key: "subscribers_gained", label: "Subscribers gained" }],
  youtube: [{ key: "views", label: "Views" }, { key: "watch_time_hours", label: "Watch time (hours)", decimals: 2 }, { key: "likes", label: "Likes" }, { key: "comments", label: "Comments" }, { key: "subscribers_gained", label: "Subscribers gained" }],
  x: [{ key: "likes", label: "Likes" }, { key: "replies", label: "Replies" }, { key: "reposts", label: "Reposts" }, { key: "link_clicks", label: "Link clicks" }, { key: "bookmarks", label: "Bookmarks" }],
  whatsapp: [{ key: "messages_sent", label: "Messages sent" }, { key: "messages_delivered", label: "Messages delivered" }, { key: "messages_read", label: "Messages read" }],
  medium: [{ key: "views", label: "Views" }, { key: "reads", label: "Reads" }, { key: "claps", label: "Claps" }, { key: "responses", label: "Responses" }, { key: "member_reading_minutes", label: "Member reading time (min)" }, { key: "earnings_inr", label: "Partner earnings (₹)", decimals: 2 }],
  pinterest: [{ key: "saves", label: "Saves" }, { key: "pin_clicks", label: "Pin clicks" }, { key: "outbound_clicks", label: "Outbound clicks" }, { key: "video_views", label: "Video views" }],
  coursera: [{ key: "enrollments", label: "Enrolments" }, { key: "active_learners", label: "Active learners" }, { key: "completions", label: "Completions" }, { key: "ratings", label: "Ratings" }, { key: "rating_average", label: "Average rating (of 5)", decimals: 1, max: 5 }, { key: "earnings_inr", label: "Revenue (₹)", decimals: 2 }],
} as const satisfies Partial<Record<Platform, readonly MetricDef[]>>;
export type MetricPlatform = keyof typeof PLATFORM_METRICS;
export type MetricKey = (typeof PLATFORM_METRICS)[MetricPlatform][number]["key"];
export const METRIC_KEYS = [...new Set(Object.values(PLATFORM_METRICS).flat().map(def => def.key))] as MetricKey[];
export const hasPlatformMetrics = (platform: Platform): platform is MetricPlatform => platform in PLATFORM_METRICS;
/** The format a new promotion defaults to on each platform. */
export const DEFAULT_FORMAT: Partial<Record<Platform, PromotionFormat>> = { medium: "article", pinterest: "pin", coursera: "course", youtube: "video", telegram: "channel", google_search: "ad" };
/** Where to put the tracked link on each platform, so its visits are attributed. */
export const LINK_HINT: Partial<Record<Platform, string>> = {
  instagram: "Use a tagged link in your bio, story link or ad. In-app browsers may remove referrers.",
  facebook: "Use a tagged destination URL in posts and ads; website visits differ from Facebook link clicks.",
  linkedin: "Use tagged links in posts, articles and ads, including when links are shortened.",
  telegram: "Use tagged links in channel or group messages; native apps may not send a referrer.",
  youtube: "Use tagged links in video descriptions and channel links. Video views are not website visits.",
  x: "Tag the destination before sharing; t.co referrals are also recognized.",
  whatsapp: "Use tagged links in messages or status links. Private shares often arrive without a referrer.",
  google_search: "Search referrers are detected automatically. Use the builder for paid search ads only; do not tag organic canonical URLs. Search Console metrics are shown separately below.",
  medium: "Put the tracked link in the article body or its closing call to action; Medium keeps query strings on outbound links.",
  pinterest: "Set the tracked link as the Pin's destination link (Idea Pins: the product or link sticker).",
  coursera: "Add the tracked link to the course's resources, the instructor profile or a reading item.",
};

/** The rates each platform's analytics headlines, worked out from the summed figures; null when the base is zero. */
export type DerivedRate = { label: string; value: number | null; hint: string };
export function derivedRates(platform: Platform, m: Partial<Record<MetricKey, number>>, impressions: number): DerivedRate[] {
  const rate = (part?: number, whole?: number) => part !== undefined && whole !== undefined && whole > 0 ? part / whole : null;
  if (platform === "medium") return [
    { label: "Read ratio", value: rate(m.reads, m.views), hint: "Reads ÷ views" },
    { label: "Claps per read", value: rate(m.claps, m.reads), hint: "Claps ÷ reads" },
  ];
  if (platform === "pinterest") return [
    { label: "Save rate", value: rate(m.saves, impressions), hint: "Saves ÷ impressions" },
    { label: "Outbound click rate", value: rate(m.outbound_clicks, impressions), hint: "Outbound clicks ÷ impressions" },
  ];
  if (platform === "coursera") return [
    { label: "Completion rate", value: rate(m.completions, m.enrollments), hint: "Completions ÷ enrolments" },
    { label: "Active share", value: rate(m.active_learners, m.enrollments), hint: "Active learners ÷ enrolments" },
  ];
  return [];
}
export type VisitRow = { created_at: string; visitor_id: string; session_id: string; user_id: string | null; path: string; referrer_host: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null };
export type ProfileRow = { id: string; created_at: string };
export type SubscriptionRow = { user_id: string; status: string; tier: string; current_period_end?: string | null };

/** utm_source values and referrer hosts that identify each platform (in-app browsers and link shorteners included). */
const SOURCES: Record<Exclude<Platform, "other" | "google_search">, { utm: string[]; hosts: RegExp }> = {
  instagram: { utm: ["instagram", "ig", "insta"], hosts: /(^|\.)instagram\.com$/ },
  facebook: { utm: ["facebook", "fb", "meta"], hosts: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/ },
  linkedin: { utm: ["linkedin", "li", "lnkd"], hosts: /(^|\.)(linkedin\.com|lnkd\.in)$/ },
  telegram: { utm: ["telegram", "tg"], hosts: /(^|\.)(t\.me|telegram\.org|telegram\.me)$/ },
  youtube: { utm: ["youtube", "yt"], hosts: /(^|\.)(youtube\.com|youtu\.be)$/ },
  x: { utm: ["x", "twitter"], hosts: /(^|\.)(x\.com|twitter\.com|t\.co)$/ },
  whatsapp: { utm: ["whatsapp", "wa"], hosts: /(^|\.)(whatsapp\.com|wa\.me)$/ },
  // Medium publications live on *.medium.com; custom-domain publications only show up through utm_source.
  medium: { utm: ["medium", "medium.com"], hosts: /(^|\.)medium\.com$/ },
  // Pinterest serves country domains (in.pinterest.com, pinterest.co.uk) and shortens links with pin.it.
  pinterest: { utm: ["pinterest", "pin", "pinterest.com"], hosts: /(^|\.)(pinterest\.[a-z]{2,3}(\.[a-z]{2})?|pin\.it)$/ },
  coursera: { utm: ["coursera", "coursera.org"], hosts: /(^|\.)coursera\.(org|com)$/ },
};

/** The social platform a visit came from: its utm_source first (the team's own tagging), then its referrer host. */
export function classifyPlatform(visit: Pick<VisitRow, "utm_source" | "referrer_host"> & Partial<Pick<VisitRow, "utm_medium">>): Platform | null {
  const source = visit.utm_source?.trim().toLowerCase();
  const host = visit.referrer_host?.trim().toLowerCase().replace(/^www\./, "");
  const medium = visit.utm_medium?.trim().toLowerCase();
  if (source === "google_search" || source === "google-search" || source === "google search") return "google_search";
  // A Google source alone can also mean email, display or another Google product.
  if (source === "google" && ["organic", "cpc", "ppc", "paid_search", "paidsearch"].includes(medium ?? "")) return "google_search";
  for (const [platform, rule] of Object.entries(SOURCES) as [keyof typeof SOURCES, (typeof SOURCES)[keyof typeof SOURCES]][]) {
    if (source && rule.utm.includes(source)) return platform;
  }
  if (source) return source === "other" ? "other" : null;
  if (host && isGoogleSearchHost(host)) return "google_search";
  if (host) for (const [platform, rule] of Object.entries(SOURCES) as [keyof typeof SOURCES, (typeof SOURCES)[keyof typeof SOURCES]][]) if (rule.hosts.test(host)) return platform;
  return null;
}

/** A campaign slug: lower case, letters, digits, hyphens and underscores, as the promotions table requires. */
export const campaignSlug = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^[-_]+|[-_]+$/g, "").slice(0, 80);

/** A tracked link for a promotion: the landing URL with utm_source, utm_medium and utm_campaign set. */
const UTM_MEDIUM: Partial<Record<Platform, string>> = { medium: "blog", coursera: "course" };
export function utmLink(base: string, platform: Platform, format: PromotionFormat, campaign: string): string {
  const url = new URL(base);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Use an HTTP or HTTPS landing URL");
  if (platform === "google_search" && format !== "ad") throw new Error("Use untagged canonical URLs for organic search");
  url.searchParams.set("utm_source", platform === "google_search" ? "google" : platform);
  url.searchParams.set("utm_medium", platform === "google_search" ? "cpc" : format === "ad" ? "paid_social" : UTM_MEDIUM[platform] ?? "social");
  url.searchParams.set("utm_campaign", campaignSlug(campaign));
  return url.toString();
}

export type Funnel = { visits: number; visitors: number; sessions: number; signups: number; members: number };
export type PlatformStats = Funnel & { platform: Platform; promotions: number; live: number; spend: number; reach: number; impressions: number; engagements: number; followers: number; costPerVisit: number | null; costPerSignup: number | null; metrics: Partial<Record<MetricKey, number>>; lastSeen: string | null; taggedViews: number; referrerViews: number; paidTaggedViews: number; organicTaggedViews: number };
export type CampaignStats = Funnel & { campaign: string; platform: Platform | "mixed"; title: string; status: PromotionStatus | "untracked"; spend: number; costPerSignup: number | null };
export type DailyPoint = { day: string } & Record<Platform, number>;
export type LandingPage = { path: string; platform: Platform; visits: number; visitors: number };
export type Attribution = { platforms: PlatformStats[]; campaigns: CampaignStats[]; daily: DailyPoint[]; landingPages: LandingPage[]; totals: Funnel & { spend: number } };

/** Totals a platform's own figures across its promotions; the average rating is weighted by each promotion's ratings. */
function sumMetrics(platform: Platform, items: Promotion[]): Partial<Record<MetricKey, number>> {
  if (!hasPlatformMetrics(platform)) return {};
  const out: Partial<Record<MetricKey, number>> = {};
  let weighted = 0, weight = 0;
  for (const item of items) for (const def of PLATFORM_METRICS[platform]) {
    const key = def.key as MetricKey;
    const value = item.platform_metrics?.[key];
    if (value === undefined || !Number.isFinite(value) || value < 0) continue;
    if (key === "rating_average") { const n = Number(item.platform_metrics?.ratings ?? 0); if (n > 0) { weighted += value * n; weight += n; } continue; }
    out[key] = (out[key] ?? 0) + value;
  }
  if (weight) out.rating_average = Math.round((weighted / weight) * 10) / 10;
  return out;
}

const emptyFunnel = (): Funnel => ({ visits: 0, visitors: 0, sessions: 0, signups: 0, members: 0 });
/** Paying members only; Razorpay's "authenticated" means a mandate exists but nothing has been charged yet. */
const ACTIVE = new Set(["active"]);

/**
 * Joins traffic to promotions and outcomes. A visit counts for the platform it came from; a sign-up counts for a
 * platform when the account was created inside the window and its first attributed visit came from that platform;
 * a member is such a sign-up with an active subscription. Campaigns match on utm_campaign.
 */
export function attribute({ visits, profiles, subscriptions, promotions, since, until = new Date().toISOString() }: { visits: VisitRow[]; profiles: ProfileRow[]; subscriptions: SubscriptionRow[]; promotions: Promotion[]; since: string; until?: string }): Attribution {
  const sinceTime = new Date(since).getTime();
  const untilTime = Date.parse(until);
  const created = new Map(profiles.map(profile => [profile.id, new Date(profile.created_at).getTime()]));
  const paying = new Set(subscriptions.filter(sub => ACTIVE.has(sub.status) && !!sub.current_period_end && Date.parse(sub.current_period_end) > Date.parse(until)).map(sub => sub.user_id));
  const sorted = visits.filter(visit => Date.parse(visit.created_at) >= sinceTime && Date.parse(visit.created_at) < untilTime).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  // Apply source changes in time order; a later campaign must never rewrite earlier activity.
  const sessionSources = new Map<string, TrafficSource>();
  const evidence = new Map<Platform, { lastSeen: string | null; taggedViews: number; referrerViews: number; paidTaggedViews: number; organicTaggedViews: number }>();

  const platformFunnel = new Map<Platform, Funnel & { visitorSet: Set<string>; sessionSet: Set<string> }>();
  const campaignFunnel = new Map<string, Funnel & { visitorSet: Set<string>; sessionSet: Set<string>; platforms: Set<Platform> }>();
  const firstPlatformOfUser = new Map<string, Platform>();
  const firstCampaignOfUser = new Map<string, string>();
  const dailyMap = new Map<string, DailyPoint>();
  const landing = new Map<string, LandingPage & { visitorSet: Set<string> }>();
  const firstPage = new Set<string>();
  const allVisitors = new Set<string>(), allSessions = new Set<string>();

  for (const visit of sorted) {
    if (/^\/(?:dashboard\/)?super-admin(?:\/|$)/.test(visit.path) || visit.path.startsWith("/api/")) continue;
    const session = `${visit.visitor_id}:${visit.session_id}`;
    const source = nextTrafficSource(sessionSources.get(session), { source: visit.utm_source, medium: visit.utm_medium, campaign: visit.utm_campaign, referrer: visit.referrer_host });
    sessionSources.set(session, source);
    const platform = classifyPlatform({ utm_source: source.source, utm_medium: source.medium, referrer_host: source.referrer });
    const campaign = source.campaign;
    if (platform) {
      const detail = evidence.get(platform) ?? { lastSeen: null, taggedViews: 0, referrerViews: 0, paidTaggedViews: 0, organicTaggedViews: 0 };
      detail.lastSeen = visit.created_at;
      if (source.source) detail.taggedViews++; else detail.referrerViews++;
      if (source.source && /^(cpc|ppc|paid_search|paidsearch|paid_social|paidsocial)$/.test(source.medium?.toLowerCase() ?? "")) detail.paidTaggedViews++;
      if (source.source && source.medium?.toLowerCase() === "organic") detail.organicTaggedViews++;
      evidence.set(platform, detail);
      const f = platformFunnel.get(platform) ?? { ...emptyFunnel(), visitorSet: new Set(), sessionSet: new Set() };
      f.visits++; f.visitorSet.add(visit.visitor_id); f.sessionSet.add(session);
      allVisitors.add(visit.visitor_id); allSessions.add(session);
      platformFunnel.set(platform, f);
      const day = new Date(Date.parse(visit.created_at) + 330 * 60_000).toISOString().slice(0, 10);
      const point = dailyMap.get(day) ?? Object.fromEntries([["day", day], ...PLATFORMS.map(p => [p, 0])]) as DailyPoint;
      point[platform]++; dailyMap.set(day, point);
      // The page a social session started on is its landing page.
      if (!firstPage.has(session)) {
        const key = `${platform}|${visit.path}`;
        const page = landing.get(key) ?? { path: visit.path, platform, visits: 0, visitors: 0, visitorSet: new Set() };
        page.visits++; page.visitorSet.add(visit.visitor_id); landing.set(key, page);
      }
      if (visit.user_id && !firstPlatformOfUser.has(visit.user_id)) firstPlatformOfUser.set(visit.user_id, platform);
    }
    if (campaign) {
      const c = campaignFunnel.get(campaign) ?? { ...emptyFunnel(), visitorSet: new Set(), sessionSet: new Set(), platforms: new Set() };
      c.visits++; c.visitorSet.add(visit.visitor_id); c.sessionSet.add(session); if (platform) c.platforms.add(platform);
      campaignFunnel.set(campaign, c);
      if (visit.user_id && !firstCampaignOfUser.has(visit.user_id)) firstCampaignOfUser.set(visit.user_id, campaign);
    }
    firstPage.add(session);
  }

  const isNewSignup = (userId: string) => (created.get(userId) ?? 0) >= sinceTime && (created.get(userId) ?? Infinity) < Date.parse(until);
  for (const [userId, platform] of firstPlatformOfUser) {
    if (!isNewSignup(userId)) continue;
    const f = platformFunnel.get(platform)!; f.signups++; if (paying.has(userId)) f.members++;
  }
  for (const [userId, campaign] of firstCampaignOfUser) {
    if (!isNewSignup(userId)) continue;
    const c = campaignFunnel.get(campaign)!; c.signups++; if (paying.has(userId)) c.members++;
  }

  const byPlatform = new Map<Platform, Promotion[]>(), byCampaign = new Map<string, Promotion[]>();
  for (const item of promotions) {
    const platformItems = byPlatform.get(item.platform) ?? []; platformItems.push(item); byPlatform.set(item.platform, platformItems);
    const campaignItems = byCampaign.get(item.utm_campaign) ?? []; campaignItems.push(item); byCampaign.set(item.utm_campaign, campaignItems);
  }
  const platforms: PlatformStats[] = PLATFORMS.map(platform => {
    const f = platformFunnel.get(platform);
    const items = byPlatform.get(platform) ?? [];
    const spend = items.reduce((sum, item) => sum + Number(item.spend_inr || 0), 0);
    const funnel: Funnel = f ? { visits: f.visits, visitors: f.visitorSet.size, sessions: f.sessionSet.size, signups: f.signups, members: f.members } : emptyFunnel();
    return {
      platform, ...funnel, ...(evidence.get(platform) ?? { lastSeen: null, taggedViews: 0, referrerViews: 0, paidTaggedViews: 0, organicTaggedViews: 0 }), promotions: items.length, live: items.filter(item => item.status === "live").length, spend,
      reach: items.reduce((sum, item) => sum + item.reach, 0), impressions: items.reduce((sum, item) => sum + item.impressions, 0), engagements: items.reduce((sum, item) => sum + item.engagements, 0),
      followers: items.reduce((sum, item) => sum + item.followers_gained, 0), metrics: sumMetrics(platform, items),
      costPerVisit: spend && funnel.visits ? spend / funnel.visits : null, costPerSignup: spend && funnel.signups ? spend / funnel.signups : null,
    };
  });

  const campaignNames = new Set([...campaignFunnel.keys(), ...promotions.map(item => item.utm_campaign)]);
  const campaigns: CampaignStats[] = [...campaignNames].map(campaign => {
    const c = campaignFunnel.get(campaign);
    const items = byCampaign.get(campaign) ?? [];
    const spend = items.reduce((sum, item) => sum + Number(item.spend_inr || 0), 0);
    const platformsSeen = new Set<Platform>([...(c?.platforms ?? []), ...items.map(item => item.platform)]);
    const funnel: Funnel = c ? { visits: c.visits, visitors: c.visitorSet.size, sessions: c.sessionSet.size, signups: c.signups, members: c.members } : emptyFunnel();
    return {
      campaign, platform: (platformsSeen.size === 1 ? [...platformsSeen][0] : "mixed") as Platform | "mixed", title: items[0]?.title ?? "(not registered as a promotion)",
      status: items[0]?.status ?? "untracked", ...funnel, spend, costPerSignup: spend && funnel.signups ? spend / funnel.signups : null,
    };
  }).sort((a, b) => b.visits - a.visits || a.campaign.localeCompare(b.campaign));

  const daily = [...dailyMap.values()].sort((a, b) => a.day.localeCompare(b.day));
  const landingPages = [...landing.values()].map(({ visitorSet, ...page }) => ({ ...page, visitors: visitorSet.size })).sort((a, b) => b.visits - a.visits).slice(0, 50);
  const totals = platforms.reduce((sum, p) => ({ visits: sum.visits + p.visits, visitors: sum.visitors + p.visitors, sessions: sum.sessions + p.sessions, signups: sum.signups + p.signups, members: sum.members + p.members, spend: sum.spend + p.spend }), { ...emptyFunnel(), spend: 0 });
  totals.visitors = allVisitors.size;
  totals.sessions = allSessions.size;
  return { platforms, campaigns, daily, landingPages, totals };
}
