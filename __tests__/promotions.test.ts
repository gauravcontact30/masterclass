/** @jest-environment node */
import { attribute, campaignSlug, classifyPlatform, derivedRates, utmLink, type Promotion, type VisitRow } from "@/lib/promotions";

const visit = (over: Partial<VisitRow>): VisitRow => ({ created_at: "2026-10-10T10:00:00Z", visitor_id: "v1", session_id: "s1", user_id: null, path: "/", referrer_host: null, utm_source: null, utm_medium: null, utm_campaign: null, ...over });
const promotion = (over: Partial<Promotion>): Promotion => ({ id: "p1", created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", platform: "instagram", title: "Reel", format: "reel", status: "live", url: null, utm_campaign: "react-week", audience: null, owner: null, starts_on: null, ends_on: null, budget_inr: 0, spend_inr: 1000, reach: 5000, impressions: 9000, engagements: 300, followers_gained: 20, notes: null, ...over });

test("platforms are recognised from UTM tags first, then referrer hosts and in-app browsers", () => {
  expect(classifyPlatform({ utm_source: "IG", referrer_host: null })).toBe("instagram");
  expect(classifyPlatform({ utm_source: null, referrer_host: "l.instagram.com" })).toBe("instagram");
  expect(classifyPlatform({ utm_source: null, referrer_host: "lm.facebook.com" })).toBe("facebook");
  expect(classifyPlatform({ utm_source: null, referrer_host: "www.linkedin.com" })).toBe("linkedin");
  expect(classifyPlatform({ utm_source: null, referrer_host: "lnkd.in" })).toBe("linkedin");
  expect(classifyPlatform({ utm_source: null, referrer_host: "t.me" })).toBe("telegram");
  expect(classifyPlatform({ utm_source: "telegram", referrer_host: "google.com" })).toBe("telegram");
  expect(classifyPlatform({ utm_source: null, referrer_host: "google.com" })).toBe("google_search");
  expect(classifyPlatform({ utm_source: null, referrer_host: "notinstagram.com" })).toBeNull();
});

test("tracked links carry platform, medium and a clean campaign slug", () => {
  const link = new URL(utmLink("https://masterclass.example/compare", "linkedin", "ad", "React Interview Week!"));
  expect(link.searchParams.get("utm_source")).toBe("linkedin");
  expect(link.searchParams.get("utm_medium")).toBe("paid_social");
  expect(link.searchParams.get("utm_campaign")).toBe("react-interview-week");
  expect(campaignSlug("  Diwali Offer 2026 ")).toBe("diwali-offer-2026");
});

test("attribution follows the session, counts new sign-ups and paying members, and costs them", () => {
  const result = attribute({
    since: "2026-10-01T00:00:00Z",
    promotions: [promotion({})],
    visits: [
      visit({ session_id: "s1", visitor_id: "v1", utm_source: "instagram", utm_campaign: "react-week", path: "/compare" }),
      visit({ session_id: "s1", visitor_id: "v1", created_at: "2026-10-10T10:05:00Z", path: "/sign-up", user_id: "u1" }),
      visit({ session_id: "s2", visitor_id: "v2", referrer_host: "l.instagram.com", path: "/" }),
      visit({ session_id: "s3", visitor_id: "v3", referrer_host: "t.me", user_id: "u2", created_at: "2026-10-11T09:00:00Z" }),
      visit({ session_id: "s4", visitor_id: "v4", referrer_host: "google.com" }),
    ],
    profiles: [{ id: "u1", created_at: "2026-10-10T10:06:00Z" }, { id: "u2", created_at: "2025-01-01T00:00:00Z" }],
    subscriptions: [{ user_id: "u1", status: "active", tier: "monthly", current_period_end: "2099-01-01T00:00:00Z" }],
  });
  const instagram = result.platforms.find(p => p.platform === "instagram")!;
  expect(instagram).toMatchObject({ visits: 3, visitors: 2, sessions: 2, signups: 1, members: 1, spend: 1000, promotions: 1, live: 1, costPerSignup: 1000 });
  // An existing account arriving from Telegram is a visit, not a new sign-up.
  expect(result.platforms.find(p => p.platform === "telegram")).toMatchObject({ visits: 1, signups: 0 });
  expect(result.platforms.map(p => p.platform)).toEqual(expect.arrayContaining(["instagram", "facebook", "linkedin", "telegram"]));
  expect(result.campaigns[0]).toMatchObject({ campaign: "react-week", platform: "instagram", status: "live", visits: 2, signups: 1, members: 1 });
  expect(result.landingPages[0]).toMatchObject({ path: "/compare", platform: "instagram" });
  expect(result.totals).toMatchObject({ visits: 5, signups: 1, members: 1, spend: 1000 });
  expect(result.daily.map(point => point.day)).toEqual(["2026-10-10", "2026-10-11"]);
});

test("deduplicates browsers across platforms and never attributes earlier direct views to later referrals", () => {
  const result = attribute({ since: "2026-10-01T00:00:00Z", profiles: [], subscriptions: [], promotions: [], visits: [
    visit({ created_at: "2026-10-10T10:00:00Z" }),
    visit({ created_at: "2026-10-10T10:01:00Z", utm_source: "instagram" }),
    visit({ created_at: "2026-10-10T10:02:00Z", utm_source: "telegram", session_id: "s2" }),
  ] });
  expect(result.totals).toMatchObject({ visitors: 1, visits: 2, sessions: 2 });
  expect(result.platforms.find(row => row.platform === "instagram")?.visits).toBe(1);
  expect(result.platforms).toHaveLength(12);
  expect(result.landingPages.some(row => row.platform === "instagram")).toBe(false);
});

test("explicit non-social UTM overrides a social referrer and daily counts use IST", () => {
  expect(classifyPlatform({ utm_source: "newsletter", referrer_host: "instagram.com" })).toBeNull();
  expect(classifyPlatform({ utm_source: "other", referrer_host: null })).toBe("other");
  const result = attribute({ since: "2026-10-01T00:00:00Z", profiles: [], subscriptions: [], promotions: [], visits: [visit({ created_at: "2026-10-10T19:00:00Z", utm_source: "instagram" })] });
  expect(result.daily[0].day).toBe("2026-10-11");
});

test.each(["google.com", "www.google.co.in", "google.co.uk", "images.google.com", "www.google.com.au", "google.com."])("recognizes search host %s", host => {
  expect(classifyPlatform({ utm_source: null, referrer_host: host })).toBe("google_search");
});
test.each(["google.evil", "google.com.evil.test", "notgoogle.com", "mail.google.com", "accounts.google.com", "docs.google.com"])("does not mislabel %s as search", host => {
  expect(classifyPlatform({ utm_source: null, referrer_host: host })).toBeNull();
});
test("Google campaign tags distinguish search from email/display and override referrers", () => {
  for (const medium of ["organic", "cpc", "ppc", "paid_search"]) expect(classifyPlatform({ utm_source: "GOOGLE", utm_medium: medium, referrer_host: "facebook.com" })).toBe("google_search");
  for (const medium of ["email", "display", null]) expect(classifyPlatform({ utm_source: "google", utm_medium: medium, referrer_host: "google.com" })).toBeNull();
  const url = new URL(utmLink("https://example.test/?keep=yes#article", "google_search", "ad", "Search Launch"));
  expect(url.searchParams.get("utm_source")).toBe("google");
  expect(url.searchParams.get("utm_medium")).toBe("cpc");
  expect(url.searchParams.get("keep")).toBe("yes");
  expect(url.hash).toBe("#article");
  expect(() => utmLink("javascript:alert(1)", "instagram", "post", "launch")).toThrow();
  expect(() => utmLink("https://example.test", "google_search", "article", "organic")).toThrow();
});
test("Google visits, campaigns, signups, charts and evidence share chronological attribution", () => {
  const result = attribute({ since: "2026-10-01T00:00:00Z", until: "2026-11-01T00:00:00Z", promotions: [], profiles: [{ id: "u1", created_at: "2026-10-10T10:02:00Z" }], subscriptions: [], visits: [
    visit({ utm_source: "google", utm_medium: "cpc", utm_campaign: "launch" }),
    visit({ created_at: "2026-10-10T10:01:00Z", path: "/learning", utm_campaign: "Follow-Up", user_id: "u1" }),
    visit({ created_at: "2026-10-10T10:03:00Z", utm_source: "newsletter" }),
    visit({ created_at: "2026-10-10T10:04:00Z" }),
  ] });
  expect(result.platforms.find(p => p.platform === "google_search")).toMatchObject({ visits: 2, visitors: 1, signups: 1, taggedViews: 2, paidTaggedViews: 2, referrerViews: 0 });
  expect(result.campaigns.find(p => p.campaign === "follow-up")).toMatchObject({ visits: 1, signups: 1 });
  expect(result.daily[0].google_search).toBe(2);
  expect(result.landingPages[0].platform).toBe("google_search");
});
test("a missing clap count is unavailable, not a fabricated zero rate", () => {
  expect(derivedRates("medium", { reads: 5 }, 0).find(r => r.label === "Claps per read")?.value).toBeNull();
});
