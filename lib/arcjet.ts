import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { env } from "./env";

/**
 * Primary Arcjet Security Client
 * Configured with Bot Detection, Shield Defense, and Sliding Window Rate Limiting.
 */
export const aj = env.ARCJET_KEY
  ? arcjet({
      key: env.ARCJET_KEY,
      rules: [
        // Shield protects against common attacks like SQL injection and XSS
        shield({
          mode: "LIVE",
        }),
        // Bot detection allows search engine crawlers while blocking malicious scraping bots
        detectBot({
          mode: "LIVE",
          allow: [
            "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc.
            "CATEGORY:MONITOR", // Uptime checkers
          ],
        }),
        // Sliding window rate limit: max 100 requests per 60 seconds per IP
        slidingWindow({
          mode: "LIVE",
          interval: "60s",
          max: 100,
        }),
      ],
    })
  : null;

export type ArcjetDecision = {
  isDenied: () => boolean;
  isAllowed: () => boolean;
  reason?: {
    isRateLimit?: () => boolean;
    isBot?: () => boolean;
    isShield?: () => boolean;
  };
};

/**
 * Helper to protect API routes or server actions with Arcjet
 */
export async function protectWithArcjet(req: Request): Promise<{ allowed: boolean; status?: number; reason?: string }> {
  if (!aj) {
    return { allowed: true };
  }

  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return { allowed: false, status: 429, reason: "Too Many Requests. Please slow down." };
      }
      if (decision.reason.isBot()) {
        return { allowed: false, status: 403, reason: "Automated Bot Traffic Detected." };
      }
      return { allowed: false, status: 403, reason: "Request Blocked by Security Shield." };
    }

    return { allowed: true };
  } catch {
    // Fail open in case of upstream network error to keep the app resilient
    return { allowed: true };
  }
}
