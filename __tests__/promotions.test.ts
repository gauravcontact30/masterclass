/** @jest-environment node */
import { attribute, campaignSlug, classifyPlatform, utmLink, type Promotion, type VisitRow } from "@/lib/promotions";

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
  expect(classifyPlatform({ utm_source: null, referrer_host: "google.com" })).toBeNull();
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
    subscriptions: [{ user_id: "u1", status: "active", tier: "monthly" }],
  });
  const instagram = result.platforms.find(p => p.platform === "instagram")!;
  expect(instagram).toMatchObject({ visits: 3, visitors: 2, sessions: 2, signups: 1, members: 1, spend: 1000, promotions: 1, live: 1, costPerSignup: 1000 });
  // An existing account arriving from Telegram is a visit, not a new sign-up.
  expect(result.platforms.find(p => p.platform === "telegram")).toMatchObject({ visits: 1, signups: 0 });
  expect(result.platforms.map(p => p.platform)).toEqual(expect.arrayContaining(["instagram", "facebook", "linkedin", "telegram"]));
  expect(result.campaigns[0]).toMatchObject({ campaign: "react-week", platform: "instagram", status: "live", visits: 2, signups: 1, members: 1 });
  expect(result.landingPages[0]).toMatchObject({ path: "/compare", platform: "instagram" });
  expect(result.totals).toMatchObject({ visits: 4, signups: 1, members: 1, spend: 1000 });
  expect(result.daily.map(point => point.day)).toEqual(["2026-10-10", "2026-10-11"]);
});
