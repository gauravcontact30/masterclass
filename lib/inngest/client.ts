import { Inngest } from "inngest";
import { env } from "@/lib/env";

/**
 * Event Schemas for Type-Safe Inngest Workflows
 */
export type MasterClassEvents = {
  "masterclass/curriculum.generate": {
    data: {
      documentId: string;
      topic: string;
      category: string;
      language: "en" | "hi";
      userEmail?: string;
    };
  };
  "masterclass/user.audit": {
    data: {
      userId?: string;
      userEmail?: string;
      action: string;
      category?: string;
      timestamp: number;
      metadata?: Record<string, unknown>;
    };
  };
  "masterclass/cache.warm": {
    data: {
      category?: string;
      timestamp: number;
    };
  };
};

/**
 * Primary Inngest Client
 */
export const inngest = new Inngest({
  id: "masterclass",
  eventKey: env.INNGEST_EVENT_KEY,
});
