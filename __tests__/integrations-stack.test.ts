/** @jest-environment node */
import { env } from "@/lib/env";
import { cacheGet, cacheSet, cacheDelete, cacheFetch, checkRateLimit } from "@/lib/redis";
import { inngest } from "@/lib/inngest/client";
import { inngestFunctions } from "@/lib/inngest/functions";
import { protectWithArcjet } from "@/lib/arcjet";
import { studyGoalSchema } from "@/components/conform-form";

describe("Upgraded Architecture Integrations", () => {
  describe("T3 Environment (@t3-oss/env-nextjs)", () => {
    it("should expose validated environment variables", () => {
      expect(env).toBeDefined();
      expect(typeof env.NODE_ENV).toBe("string");
    });
  });

  describe("Redis & Upstash Caching and Rate Limiting", () => {
    it("should perform cache write, read, and delete operations", async () => {
      const key = "test:cache:key";
      await cacheSet(key, { message: "Hello Upstash Redis" }, 60);

      const cached = await cacheGet<{ message: string }>(key);
      expect(cached).toEqual({ message: "Hello Upstash Redis" });

      await cacheDelete(key);
      const deleted = await cacheGet(key);
      expect(deleted).toBeNull();
    });

    it("should fetch with cache-aside pattern", async () => {
      const key = "test:fetch:key";
      let calls = 0;
      const fetcher = async () => {
        calls++;
        return { data: "computed", timestamp: 12345 };
      };

      const first = await cacheFetch(key, fetcher, 60);
      const second = await cacheFetch(key, fetcher, 60);

      expect(calls).toBe(1);
      expect(first).toEqual(second);
      await cacheDelete(key);
    });

    it("should enforce sliding window rate limits", async () => {
      const ip = "test-client-ip";
      const first = await checkRateLimit(ip, 5, 10);
      expect(first.success).toBe(true);
      expect(first.remaining).toBe(4);
    });
  });

  describe("Inngest Event Engine", () => {
    it("should instantiate client with masterclass ID", () => {
      expect(inngest.id).toBe("masterclass");
      expect(inngestFunctions.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Arcjet Security", () => {
    it("should allow safe requests in fallback mode", async () => {
      const req = new Request("http://localhost:3000/api/test");
      const decision = await protectWithArcjet(req);
      expect(decision.allowed).toBe(true);
    });
  });

  describe("Conform & Zod Validation", () => {
    it("should validate study goal schemas correctly", () => {
      const valid = studyGoalSchema.safeParse({
        topicName: "Next.js 16 Microservices",
        targetCategory: "technology",
        dailyMinutes: 60,
      });
      expect(valid.success).toBe(true);
    });

    it("should reject invalid values", () => {
      const invalid = studyGoalSchema.safeParse({
        topicName: "No", // too short (< 3 chars)
        targetCategory: "invalid-category",
        dailyMinutes: 5, // minimum 15 mins
      });
      expect(invalid.success).toBe(false);
    });
  });
});
