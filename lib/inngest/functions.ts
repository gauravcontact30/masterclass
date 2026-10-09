import { inngest } from "./client";
import { cacheSet, cacheDelete } from "@/lib/redis";

interface CurriculumEventData {
  documentId: string;
  topic: string;
  category: string;
  language: string;
  userEmail?: string;
}

interface AuditEventData {
  action: string;
  userEmail?: string;
  category?: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

interface CacheWarmEventData {
  category?: string;
}

interface InngestStepTool {
  run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  sendEvent: (name: string, payload: { name: string; data: Record<string, unknown> }) => Promise<unknown>;
}

/**
 * Inngest Multi-Step Function: Asynchronous Curriculum Generation & Caching
 */
export const generateCurriculumFunction = inngest.createFunction(
  {
    id: "curriculum-generation",
    name: "Generate Curriculum Document",
    triggers: [{ event: "masterclass/curriculum.generate" }],
  },
  async ({ event, step }: { event: { data: CurriculumEventData }; step: InngestStepTool }) => {
    const { documentId, topic, category, language, userEmail } = event.data;

    // Step 1: Validate payload and reserve generation lock in cache
    const lock = await step.run("reserve-generation-lock", async () => {
      const lockKey = `gen:lock:${documentId}`;
      await cacheSet(lockKey, { status: "generating", startedAt: Date.now() }, 180);
      return { acquired: true, lockKey };
    });

    // Step 2: Simulate step-by-step AI curriculum compilation
    const compiledCurriculum = await step.run("compile-curriculum-steps", async () => {
      return {
        documentId,
        topic,
        category,
        language,
        sectionsCount: 5,
        generatedAt: new Date().toISOString(),
      };
    });

    // Step 3: Cache the generated document in Redis for immediate fast response
    await step.run("cache-compiled-document", async () => {
      const cacheKey = `doc:${documentId}`;
      await cacheSet(cacheKey, compiledCurriculum, 86400); // Cache for 24 hours
      await cacheDelete(lock.lockKey);
      return { cached: true };
    });

    // Step 4: Emit audit log event for tracking
    await step.sendEvent("emit-audit-event", {
      name: "masterclass/user.audit",
      data: {
        userEmail,
        action: "CURRICULUM_GENERATED",
        category,
        timestamp: Date.now(),
        metadata: { documentId, topic },
      },
    });

    return { success: true, documentId };
  }
);

/**
 * Inngest Function: User Activity & Super Admin Audit Logging
 */
export const recordAuditLogFunction = inngest.createFunction(
  {
    id: "user-audit-logger",
    name: "Record User Audit Log",
    triggers: [{ event: "masterclass/user.audit" }],
  },
  async ({ event, step }: { event: { data: AuditEventData }; step: InngestStepTool }) => {
    const { action, userEmail, category, timestamp, metadata } = event.data;

    await step.run("persist-audit-log", async () => {
      const auditKey = `audit:logs:${new Date().toISOString().slice(0, 10)}`;
      const entry = { action, userEmail, category, timestamp, metadata };
      await cacheSet(auditKey, [entry], 604800); // 7 days retention
      return { recorded: true };
    });

    return { logged: true };
  }
);

/**
 * Inngest Function: Cache Warming for Hot Syllabus Categories
 */
export const warmCacheFunction = inngest.createFunction(
  {
    id: "cache-warmer",
    name: "Warm Category Syllabus Cache",
    triggers: [{ event: "masterclass/cache.warm" }],
  },
  async ({ event, step }: { event: { data: CacheWarmEventData }; step: InngestStepTool }) => {
    const { category } = event.data;

    await step.run("pre-warm-category-data", async () => {
      const cacheKey = `catalog:category:${category ?? "all"}`;
      await cacheSet(cacheKey, { prewarmedAt: Date.now(), ready: true }, 3600);
      return { warmed: true, category };
    });

    return { status: "completed" };
  }
);

export const inngestFunctions = [
  generateCurriculumFunction,
  recordAuditLogFunction,
  warmCacheFunction,
];
