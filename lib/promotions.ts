/*
 * Promotional tracking: which social platforms and campaigns bring people to the site, and what they do next.
 * Pure functions over rows the API reads (site_visits, profiles, subscriptions, promotions), so the attribution
 * rules are testable without a database and shared by the super admin page. No zod or server imports here.
 */

export const PLATFORMS = ["instagram", "facebook", "linkedin", "telegram", "youtube", "x", "whatsapp", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];
/** The four platforms the team promotes on first; the rest are tracked when traffic arrives from them. */
export const PRIMARY_PLATFORMS: Platform[] = ["instagram", "facebook", "linkedin", "telegram"];
export const PLATFORM_LABEL: Record<Platform, string> = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", telegram: "Telegram", youtube: "YouTube", x: "X (Twitter)", whatsapp: "WhatsApp", other: "Other" };
export const PROMOTION_FORMATS = ["post", "reel", "story", "video", "ad", "article", "group", "channel", "live"] as const;
export const PROMOTION_STATUSES = ["planned", "live", "paused", "ended"] as const;
export type PromotionFormat = (typeof PROMOTION_FORMATS)[number];
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export type Promotion = {
  id: string; created_at: string; updated_at: string; platform: Platform; title: string; format: PromotionFormat; status: PromotionStatus;
  url: string | null; utm_campaign: string; audience: string | null; owner: string | null; starts_on: string | null; ends_on: string | null;
  budget_inr: number; spend_inr: number; reach: number; impressions: number; engagements: number; followers_gained: number; notes: string | null;
};
export type VisitRow = { created_at: string; visitor_id: string; session_id: string; user_id: string | null; path: string; referrer_host: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null };
export type ProfileRow = { id: string; created_at: string };
export type SubscriptionRow = { user_id: string; status: string; tier: string };

/** utm_source values and referrer hosts that identify each platform (in-app browsers and link shorteners included). */
const SOURCES: Record<Exclude<Platform, "other">, { utm: string[]; hosts: RegExp }> = {
  instagram: { utm: ["instagram", "ig", "insta"], hosts: /(^|\.)instagram\.com$/ },
  facebook: { utm: ["facebook", "fb", "meta"], hosts: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/ },
  linkedin: { utm: ["linkedin", "li", "lnkd"], hosts: /(^|\.)(linkedin\.com|lnkd\.in)$/ },
  telegram: { utm: ["telegram", "tg"], hosts: /(^|\.)(t\.me|telegram\.org|telegram\.me)$/ },
  youtube: { utm: ["youtube", "yt"], hosts: /(^|\.)(youtube\.com|youtu\.be)$/ },
  x: { utm: ["x", "twitter"], hosts: /(^|\.)(x\.com|twitter\.com|t\.co)$/ },
  whatsapp: { utm: ["whatsapp", "wa"], hosts: /(^|\.)(whatsapp\.com|wa\.me)$/ },
};

/** The social platform a visit came from: its utm_source first (the team's own tagging), then its referrer host. */
export function classifyPlatform(visit: Pick<VisitRow, "utm_source" | "referrer_host">): Platform | null {
  const source = visit.utm_source?.trim().toLowerCase();
  const host = visit.referrer_host?.trim().toLowerCase().replace(/^www\./, "");
  for (const [platform, rule] of Object.entries(SOURCES) as [Exclude<Platform, "other">, (typeof SOURCES)[keyof typeof SOURCES]][]) {
    if (source && rule.utm.includes(source)) return platform;
  }
  if (host) for (const [platform, rule] of Object.entries(SOURCES) as [Exclude<Platform, "other">, (typeof SOURCES)[keyof typeof SOURCES]][]) if (rule.hosts.test(host)) return platform;
  return null;
}

/** A campaign slug: lower case, letters, digits, hyphens and underscores, as the promotions table requires. */
export const campaignSlug = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

/** A tracked link for a promotion: the landing URL with utm_source, utm_medium and utm_campaign set. */
export function utmLink(base: string, platform: Platform, format: PromotionFormat, campaign: string): string {
  const url = new URL(base);
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", format === "ad" ? "paid_social" : "social");
  url.searchParams.set("utm_campaign", campaignSlug(campaign));
  return url.toString();
}

export type Funnel = { visits: number; visitors: number; sessions: number; signups: number; members: number };
export type PlatformStats = Funnel & { platform: Platform; promotions: number; live: number; spend: number; reach: number; impressions: number; engagements: number; costPerVisit: number | null; costPerSignup: number | null };
export type CampaignStats = Funnel & { campaign: string; platform: Platform | "mixed"; title: string; status: PromotionStatus | "untracked"; spend: number; costPerSignup: number | null };
export type DailyPoint = { day: string } & Record<Platform, number>;
export type LandingPage = { path: string; platform: Platform; visits: number; visitors: number };
export type Attribution = { platforms: PlatformStats[]; campaigns: CampaignStats[]; daily: DailyPoint[]; landingPages: LandingPage[]; totals: Funnel & { spend: number } };

const emptyFunnel = (): Funnel => ({ visits: 0, visitors: 0, sessions: 0, signups: 0, members: 0 });
/** Paying members only; Razorpay's "authenticated" means a mandate exists but nothing has been charged yet. */
const ACTIVE = new Set(["active"]);

/**
 * Joins traffic to promotions and outcomes. A visit counts for the platform it came from; a sign-up counts for a
 * platform when the account was created inside the window and its first attributed visit came from that platform;
 * a member is such a sign-up with an active subscription. Campaigns match on utm_campaign.
 */
export function attribute({ visits, profiles, subscriptions, promotions, since }: { visits: VisitRow[]; profiles: ProfileRow[]; subscriptions: SubscriptionRow[]; promotions: Promotion[]; since: string }): Attribution {
  const sinceTime = new Date(since).getTime();
  const created = new Map(profiles.map(profile => [profile.id, new Date(profile.created_at).getTime()]));
  const paying = new Set(subscriptions.filter(sub => ACTIVE.has(sub.status)).map(sub => sub.user_id));
  const sorted = [...visits].sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Sessions inherit the platform of their first social visit, so later pages in that session count for it too.
  const sessionPlatform = new Map<string, Platform>();
  const sessionCampaign = new Map<string, string>();
  for (const visit of sorted) {
    const platform = classifyPlatform(visit);
    if (platform && !sessionPlatform.has(visit.session_id)) sessionPlatform.set(visit.session_id, platform);
    const campaign = visit.utm_campaign?.trim().toLowerCase();
    if (campaign && !sessionCampaign.has(visit.session_id)) sessionCampaign.set(visit.session_id, campaign);
  }

  const platformFunnel = new Map<Platform, Funnel & { visitorSet: Set<string>; sessionSet: Set<string> }>();
  const campaignFunnel = new Map<string, Funnel & { visitorSet: Set<string>; sessionSet: Set<string>; platforms: Set<Platform> }>();
  const firstPlatformOfUser = new Map<string, Platform>();
  const firstCampaignOfUser = new Map<string, string>();
  const dailyMap = new Map<string, DailyPoint>();
  const landing = new Map<string, LandingPage & { visitorSet: Set<string> }>();
  const firstPage = new Set<string>();

  for (const visit of sorted) {
    const platform = sessionPlatform.get(visit.session_id);
    const campaign = sessionCampaign.get(visit.session_id);
    if (platform) {
      const f = platformFunnel.get(platform) ?? { ...emptyFunnel(), visitorSet: new Set(), sessionSet: new Set() };
      f.visits++; f.visitorSet.add(visit.visitor_id); f.sessionSet.add(visit.session_id);
      platformFunnel.set(platform, f);
      const day = visit.created_at.slice(0, 10);
      const point = dailyMap.get(day) ?? Object.fromEntries([["day", day], ...PLATFORMS.map(p => [p, 0])]) as DailyPoint;
      point[platform]++; dailyMap.set(day, point);
      // The page a social session started on is its landing page.
      if (!firstPage.has(visit.session_id)) {
        firstPage.add(visit.session_id);
        const key = `${platform}|${visit.path}`;
        const page = landing.get(key) ?? { path: visit.path, platform, visits: 0, visitors: 0, visitorSet: new Set() };
        page.visits++; page.visitorSet.add(visit.visitor_id); landing.set(key, page);
      }
      if (visit.user_id && !firstPlatformOfUser.has(visit.user_id)) firstPlatformOfUser.set(visit.user_id, platform);
    }
    if (campaign) {
      const c = campaignFunnel.get(campaign) ?? { ...emptyFunnel(), visitorSet: new Set(), sessionSet: new Set(), platforms: new Set() };
      c.visits++; c.visitorSet.add(visit.visitor_id); c.sessionSet.add(visit.session_id); if (platform) c.platforms.add(platform);
      campaignFunnel.set(campaign, c);
      if (visit.user_id && !firstCampaignOfUser.has(visit.user_id)) firstCampaignOfUser.set(visit.user_id, campaign);
    }
  }

  const isNewSignup = (userId: string) => (created.get(userId) ?? 0) >= sinceTime;
  for (const [userId, platform] of firstPlatformOfUser) {
    if (!isNewSignup(userId)) continue;
    const f = platformFunnel.get(platform)!; f.signups++; if (paying.has(userId)) f.members++;
  }
  for (const [userId, campaign] of firstCampaignOfUser) {
    if (!isNewSignup(userId)) continue;
    const c = campaignFunnel.get(campaign)!; c.signups++; if (paying.has(userId)) c.members++;
  }

  const perPlatform = (platform: Platform) => promotions.filter(item => item.platform === platform);
  const platforms: PlatformStats[] = PLATFORMS.map(platform => {
    const f = platformFunnel.get(platform);
    const items = perPlatform(platform);
    const spend = items.reduce((sum, item) => sum + Number(item.spend_inr || 0), 0);
    const funnel: Funnel = f ? { visits: f.visits, visitors: f.visitorSet.size, sessions: f.sessionSet.size, signups: f.signups, members: f.members } : emptyFunnel();
    return {
      platform, ...funnel, promotions: items.length, live: items.filter(item => item.status === "live").length, spend,
      reach: items.reduce((sum, item) => sum + item.reach, 0), impressions: items.reduce((sum, item) => sum + item.impressions, 0), engagements: items.reduce((sum, item) => sum + item.engagements, 0),
      costPerVisit: spend && funnel.visits ? spend / funnel.visits : null, costPerSignup: spend && funnel.signups ? spend / funnel.signups : null,
    };
  }).filter(stats => PRIMARY_PLATFORMS.includes(stats.platform) || stats.visits > 0 || stats.promotions > 0);

  const campaignNames = new Set([...campaignFunnel.keys(), ...promotions.map(item => item.utm_campaign)]);
  const campaigns: CampaignStats[] = [...campaignNames].map(campaign => {
    const c = campaignFunnel.get(campaign);
    const items = promotions.filter(item => item.utm_campaign === campaign);
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
  return { platforms, campaigns, daily, landingPages, totals };
}
