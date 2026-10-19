import { countryLabel, locationLabel, locationBreakdowns, type LocationVisit } from "@/lib/visitor-location";
const visit = (values: Partial<LocationVisit> = {}): LocationVisit => ({ visitor_id: "one", session_id: "session", user_id: "user", country: "IN", region: "MH", city: "Mumbai", created_at: "2026-10-19T05:00:00Z", ...values });

test("deduplicates visitors across cities in the same state and country", () => {
  const data = locationBreakdowns([visit(), visit({ city: "Pune" }), visit({ visitor_id: "two" }), visit({ country: "US", region: "MH" })]);
  expect(data.countries.find(row => row.country === "India")).toMatchObject({ visitors: 2, views: 3, sessions: 2, signedIn: 1 });
  expect(data.regions).toHaveLength(2);
  expect(data.regions.find(row => row.country === "India")).toMatchObject({ region: "MH", visitors: 2, views: 3 });
  expect(data.cities).toHaveLength(3);
});

test("unknown locations stay unknown and timestamps compare chronologically", () => {
  const data = locationBreakdowns([visit({ country: null, region: null, city: null }), visit({ created_at: "2026-10-19T11:00:00+05:30" }), visit()]);
  expect(data.locatedViews).toBe(2);
  expect(data.countries.find(row => row.country === "Not available")?.visitors).toBe(1);
  expect(data.countries.find(row => row.country === "India")?.lastSeen).toBe("2026-10-19T11:00:00+05:30");
  expect(locationLabel({ city: "Mumbai", region: "MH", country: "IN" })).toBe("Mumbai, MH, India");
  expect(countryLabel(null)).toBe("Not available");
});
