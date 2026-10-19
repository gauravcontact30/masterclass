export type WorkspaceTab = "dashboard" | "library" | "plans" | "settings";

export const DASHBOARD_ROUTES: Record<WorkspaceTab, string> = {
  dashboard: "/dashboard",
  library: "/dashboard/library",
  plans: "/dashboard/plans",
  settings: "/dashboard/settings",
};

/** Resolve only known legacy tabs; never redirect to an arbitrary query value. */
export function legacyDashboardRoute(tab: string | string[] | undefined): string {
  return tab === "library" || tab === "plans" || tab === "settings" ? DASHBOARD_ROUTES[tab] : DASHBOARD_ROUTES.dashboard;
}
