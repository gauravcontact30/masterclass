/**
 * Jest Mock for @arcjet/next
 */
export default function arcjet(_config?: Record<string, unknown>) {
  return {
    protect: async (_req?: unknown) => ({
      isDenied: () => false,
      isAllowed: () => true,
      reason: {
        isRateLimit: () => false,
        isBot: () => false,
        isShield: () => false,
      },
    }),
  };
}

export function detectBot(opts?: Record<string, unknown>) {
  return { type: "detectBot", ...(opts ?? {}) };
}

export function shield(opts?: Record<string, unknown>) {
  return { type: "shield", ...(opts ?? {}) };
}

export function slidingWindow(opts?: Record<string, unknown>) {
  return { type: "slidingWindow", ...(opts ?? {}) };
}
