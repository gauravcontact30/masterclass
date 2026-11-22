/** Shared URL policy. Country decisions live on the server, never in browser preferences. */
export function isIndiaOnlyPath(pathname: string): boolean {
  return /^\/(?:exams|api\/exams|board-exams|competitive-exams|tet-exam|learning\/(?:board-exams|competitive-exams))(?:\/|$)/.test(pathname);
}

/** Portal values (header or query) of the India-only exam portals; "exams" is the name used before the split. */
const EXAM_PORTAL_VALUES = new Set(["boards", "competitive", "exams"]);
export function isIndiaOnlyRequest(url: URL, headers: Pick<Headers, "get">): boolean {
  return isIndiaOnlyPath(url.pathname)
    || (url.pathname.startsWith("/api/") && EXAM_PORTAL_VALUES.has(headers.get("x-portal") ?? ""))
    || (/^\/portal\/(?:enter|join)\/?$/.test(url.pathname) && EXAM_PORTAL_VALUES.has(url.searchParams.get("portal") ?? ""));
}

export const GOVERNMENT_EXAM_IDS: readonly string[] = ["nda", "defence", "banks", "railways", "ssc", "upsc", "cbi", "income-tax", "ib", "police", "state-psc", "insurance", "epfo", "coast-guard", "tet", "isro", "gate", "ugc-net"];
