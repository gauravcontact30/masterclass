/** @jest-environment node */
import { trialEndsAt } from "@/lib/domain";
import { quota, trialHours } from "@/lib/server/config";

jest.mock("server-only", () => ({}));
afterEach(() => { delete process.env.TRIAL_HOURS; delete process.env.TRIAL_GENERATIONS; });

test("the trial ends a set number of hours after the profile was created", () => {
  expect(trialEndsAt("2026-10-18T10:00:00.000Z", 24)).toBe("2026-10-19T10:00:00.000Z");
  expect(trialEndsAt("2026-10-18T10:00:00.000Z", 0)).toBeNull();
  expect(trialEndsAt(null, 24)).toBeNull();
  expect(trialEndsAt("not a date", 24)).toBeNull();
});

test("TRIAL_HOURS defaults to 24 and rejects nonsense", () => {
  expect(trialHours()).toBe(24);
  process.env.TRIAL_HOURS = "48"; expect(trialHours()).toBe(48);
  process.env.TRIAL_HOURS = "0"; expect(trialHours()).toBe(0);
  process.env.TRIAL_HOURS = "-5"; expect(trialHours()).toBe(24);
  process.env.TRIAL_HOURS = "abc"; expect(trialHours()).toBe(24);
});

test("a trial gets a small generation quota; an unpaid account gets none", () => {
  expect(quota("trial")).toBe(3);
  process.env.TRIAL_GENERATIONS = "5"; expect(quota("trial")).toBe(5);
  expect(quota("free")).toBe(0);
});
