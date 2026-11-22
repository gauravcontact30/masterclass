import "server-only";
import { headers } from "next/headers";

type HeaderReader = Pick<Headers, "get">;
const countryCode = (value: string | null | undefined) => {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) && code !== "XX" ? code : null;
};

/**
 * Trust only the configured ingress, which must overwrite the country header and protect the origin.
 * Vercel supplies its own country header automatically. Other deployments fail closed until configured.
 * Never fall back to another provider's header, cookies, language, currency or a query parameter.
 */
export function visitorCountry(source: HeaderReader): string | null {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_VISITOR_COUNTRY) {
    return countryCode(process.env.DEV_VISITOR_COUNTRY);
  }
  if (process.env.VERCEL === "1") return countryCode(source.get("x-vercel-ip-country"));
  if (process.env.TRUSTED_GEO_PROVIDER === "vercel") return countryCode(source.get("x-vercel-ip-country"));
  if (process.env.TRUSTED_GEO_PROVIDER === "cloudflare") return countryCode(source.get("cf-ipcountry"));
  return null;
}

export const isIndiaVisitor = (source: HeaderReader): boolean => visitorCountry(source) === "IN";
export async function indiaAccess(): Promise<boolean> { return isIndiaVisitor(await headers()); }
