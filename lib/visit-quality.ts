/*
 * Which recorded visits are not a person on the site. An audit of the visit table on 2026-10-24 found two kinds the
 * user-agent check misses:
 *  - headless browsers in data centres (link scanners and preview renderers in Ashburn, Council Bluffs, Fort Worth),
 *    which report an 800×600 screen, a "UTC" or "Etc/Unknown" timezone or a POSIX locale such as "en-US@posix";
 *  - the site's own development server, whose beacons arrive from a loopback or private address.
 * /api/track marks the first as bots and drops the second; the Live visitor stream also hides rows recorded before
 * this rule existed. A real visitor's browser reports their own timezone and screen, so none of these match a person.
 */
export type VisitSignals = { timezone?: string | null; language?: string | null; screen?: string | null; device?: string | null; ip_masked?: string | null };

const HEADLESS_SCREENS = new Set(["800x600", "0x0", "1x1"]);

/** A browser that is almost certainly automated, from what it reported about itself. */
export function looksAutomated(visit: VisitSignals): boolean {
  if (visit.screen && HEADLESS_SCREENS.has(visit.screen)) return true;
  if (visit.language?.includes("@posix")) return true;
  if (visit.timezone === "Etc/Unknown") return true;
  // A desktop browser set to bare UTC is a server, not a person's computer (phones always report a real zone).
  return (visit.timezone === "UTC" || visit.timezone === "Etc/UTC") && visit.device === "Desktop";
}

/**
 * Whether a beacon comes from the site's own machines: a loopback or private address, or no address at all outside
 * production (the local dev server sends no forwarding header). TRACK_LOCAL=1 records them anyway.
 */
export function isOwnTraffic(ip: string | null | undefined): boolean {
  if (process.env.TRACK_LOCAL === "1") return false;
  return isLocalAddress(ip) || (!ip && process.env.NODE_ENV !== "production");
}

/** Columns a report must read to judge its rows with isAudience; drop them before anything reaches the browser. */
export const SIGNAL_COLUMNS = "screen,language,timezone,ip_masked";

/**
 * Whether a stored page view is a person, by the same rule the Live visitor stream and the activity reports in
 * supabase/migrations/0046 apply: not an automated browser, and (in production) not the site's own machines.
 */
export function isAudience(visit: VisitSignals): boolean {
  return !looksAutomated(visit) && (process.env.TRACK_LOCAL === "1" || process.env.NODE_ENV !== "production" || !isLocalAddress(visit.ip_masked));
}

/** A loopback or private network address (masked or full): the site's own machines, not the audience. */
export function isLocalAddress(ip: string | null | undefined): boolean {
  if (!ip) return false;
  return /^(::1|::ffff:127\.|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|fc|fd|fe80:)/i.test(ip) || ip === "::1::";
}
