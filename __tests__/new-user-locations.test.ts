import { newUserLocations } from "@/lib/new-user-locations";
import { distanceKm, nearbyCity, stateLabel } from "@/lib/nearby-city";

describe("nearby city", () => {
  test("names the nearest major city other than the visitor's own, with its distance", () => {
    // Pune's centre: Mumbai is the nearest other major city (~120 km).
    const near = nearbyCity(18.52, 73.86, "Pune");
    expect(near).toMatchObject({ name: "Mumbai", country: "IN" });
    expect(near!.km).toBeGreaterThan(100);
    expect(near!.km).toBeLessThan(140);
  });
  test("skips the listed city the coordinates sit in, even when the visit's city name differs", () => {
    expect(nearbyCity(28.61, 77.21, "New Delhi")?.name).not.toBe("Delhi");
  });
  test("returns nothing without coordinates or when no major city is within reach", () => {
    expect(nearbyCity(null, null)).toBeNull();
    expect(nearbyCity(0, -150)).toBeNull();
  });
  test("distance is symmetric and roughly right", () => {
    expect(Math.round(distanceKm(28.61, 77.21, 19.08, 72.88))).toBeGreaterThan(1100);
    expect(distanceKm(1, 2, 3, 4)).toBeCloseTo(distanceKm(3, 4, 1, 2));
  });
  test("Indian region codes read as state names; others pass through", () => {
    expect(stateLabel("MH", "IN")).toBe("Maharashtra");
    expect(stateLabel("CA", "US")).toBe("CA");
    expect(stateLabel(null, "IN")).toBeNull();
  });
});

describe("new user locations", () => {
  const users = [
    { id: "a", name: "Asha", created_at: "2026-10-18T10:00:00Z" },
    { id: "b", name: null, created_at: "2026-10-19T10:00:00Z" },
    { id: "c", name: "Chetan", created_at: "2026-10-17T10:00:00Z" },
  ];
  const visits = [
    { user_id: "a", created_at: "2026-10-18T10:01:00Z" },
    { user_id: "a", created_at: "2026-10-18T10:02:00Z", country: "IN", region: "MH", city: "Pune", postal_code: "411001", latitude: 18.52, longitude: 73.86 },
    { user_id: "a", created_at: "2026-10-19T09:00:00Z", country: "IN", region: "KA", city: "Bengaluru" },
    { user_id: "b", created_at: "2026-10-19T10:05:00Z", country: "IN", region: "UP", city: "Lucknow" },
  ];
  const report = newUserLocations(users, visits);

  test("each user's first located visit, newest users first", () => {
    expect(report.users.map(u => u.id)).toEqual(["b", "a", "c"]);
    expect(report.users[1]).toMatchObject({ country: "India", state: "Maharashtra", city: "Pune", postalCode: "411001", firstSeenAt: "2026-10-18T10:02:00Z", nearby: { name: "Mumbai" } });
  });
  test("no location is invented: missing data stays empty", () => {
    expect(report.users[0]).toMatchObject({ name: "Unnamed learner", city: "Lucknow", postalCode: null, nearby: null });
    expect(report.users[2]).toMatchObject({ country: null, state: null, city: null, firstSeenAt: null, nearby: null });
  });
  test("tallies per level for the cards", () => {
    expect(report).toMatchObject({ total: 3, located: 2 });
    expect(report.countries).toEqual([{ name: "India", count: 2 }]);
    expect(report.states).toEqual([{ name: "Maharashtra, India", count: 1 }, { name: "Uttar Pradesh, India", count: 1 }]);
    expect(report.postalAreas).toEqual([{ name: "411001 · Pune", count: 1 }]);
    expect(report.nearby).toEqual([{ name: "Mumbai", count: 1 }]);
  });
});
