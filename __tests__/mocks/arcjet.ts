/**
 * Jest Mock for @arcjet/next
 */
export default function arcjet(config: any) {
  return {
    protect: async (_req: any) => ({
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

export function detectBot(opts: any) {
  return { type: "detectBot", ...opts };
}

export function shield(opts: any) {
  return { type: "shield", ...opts };
}

export function slidingWindow(opts: any) {
  return { type: "slidingWindow", ...opts };
}
