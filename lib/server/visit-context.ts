import "server-only";
import { createHmac } from "node:crypto";

/** Browser, OS and device class from a User-Agent, coarse on purpose: enough for the activity breakdowns, nothing identifying. */
export function parseUserAgent(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
  const os = /Windows NT/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPad/.test(ua) ? "iPadOS" : /iPhone|iPod/.test(ua) ? "iOS"
    : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "Other";
  const device = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua) ? "Tablet" : /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua) ? "Mobile" : "Desktop";
  const isBot = !ua || /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|preview|headless|lighthouse|pagespeed|python-requests|curl\/|wget|httpclient|axios|node-fetch|uptime|monitor/i.test(ua);
  return { browser, os, device, isBot };
}

/** The client IP with its host part zeroed (last IPv4 octet, last 80 IPv6 bits), so a row never holds a full address. */
export function maskIp(ip: string) {
  if (ip.includes(".")) return ip.split(".").slice(0, 3).concat("0").join(".");
  if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":") + "::";
  return "";
}

/** A keyed hash of the full IP, to count distinct networks without storing the address. */
export function hashIp(ip: string) {
  const key = process.env.VISIT_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "visits";
  return createHmac("sha256", key).update(ip).digest("base64url").slice(0, 22);
}

/** Where the request came from, from the hosting platform's geolocation headers (Vercel), when present. */
export function geo(headers: Headers) {
  const read = (name: string) => { const value = headers.get(name); if (!value) return null; try { return decodeURIComponent(value).slice(0, 80); } catch { return value.slice(0, 80); } };
  return { country: read("x-vercel-ip-country"), region: read("x-vercel-ip-country-region"), city: read("x-vercel-ip-city") };
}

/**
 * The postal code and approximate coordinates of the request's network (Vercel headers), when present. These locate a
 * city or ISP hub, never a street or village; columns from migration 0030.
 */
export function geoPoint(headers: Headers) {
  const coordinate = (name: string, limit: number) => { const value = Number(headers.get(name)); return headers.get(name) && Number.isFinite(value) && Math.abs(value) <= limit ? value : null; };
  const postal = headers.get("x-vercel-ip-postal-code")?.trim().slice(0, 20) || null;
  return { postal_code: postal, latitude: coordinate("x-vercel-ip-latitude", 90), longitude: coordinate("x-vercel-ip-longitude", 180) };
}

export function clientIp(headers: Headers) {
  return (headers.get("x-forwarded-for")?.split(",")[0] ?? headers.get("x-real-ip") ?? "").trim();
}
