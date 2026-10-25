import { DASHBOARD_ROUTES, legacyDashboardRoute } from "@/lib/dashboard-routes";

test.each(Object.entries(DASHBOARD_ROUTES))("legacy %s resolves to its clean page", (tab, path) => {
  expect(legacyDashboardRoute(tab)).toBe(path);
  expect(path).not.toMatch(/[?#]/);
});

test.each([undefined, "unknown", "https://example.com", ["plans", "library"]])("invalid legacy values stay on the dashboard", value => {
  expect(legacyDashboardRoute(value)).toBe("/learning");
});
