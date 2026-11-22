/** @jest-environment node */
import { accountIdFor, enterPortal, examAccountOf, examPortalAccountId, examsAccountId, holdingsOf, requireExamUser } from "@/lib/server/portal";
import { db } from "@/lib/server/db";
import { headers, cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { EXAMS } from "@/lib/competitive-exams/exams";
import { BOARDS, CLASSES } from "@/lib/board-exams/boards";

jest.mock("next/headers", () => ({ headers: jest.fn(), cookies: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/server/auth", () => ({ currentUser: jest.fn() }));
jest.mock("@/lib/server/repository", () => ({ account: jest.fn() }));
const user = { id: "identity" } as User;
beforeEach(() => {
  jest.replaceProperty(process, "env", { ...process.env, VERCEL: "1", DEV_VISITOR_COUNTRY: "" });
  jest.mocked(headers).mockResolvedValue(new Headers({ "x-vercel-ip-country": "US" }) as Awaited<ReturnType<typeof headers>>);
});
afterEach(() => jest.restoreAllMocks());
test.each([["boards", "signin"], ["boards", "signup"], ["competitive", "signin"], ["competitive", "signup"]] as const)("overseas %s portal %s refuses before account reads or writes", async (portal, intent) => {
  expect(await enterPortal(user, portal, intent)).toEqual({ ok: false, reason: "region_unavailable", hasOther: false });
  expect(db).not.toHaveBeenCalled();
});
test("existing Exams cookies cannot grant access overseas", async () => {
  expect(await examAccountOf(user.id, "boards")).toBeNull();
  expect(await examAccountOf(user.id, "competitive")).toBeNull();
  expect(cookies).not.toHaveBeenCalled();
  expect(db).not.toHaveBeenCalled();
});
test("server page guard redirects overseas before retrieving content", async () => {
  await expect(requireExamUser("boards", "/exams/board-exams")).rejects.toThrow("REDIRECT:/");
  await expect(requireExamUser("competitive", "/exams/competitive-exams")).rejects.toThrow("REDIRECT:/");
  expect(db).not.toHaveBeenCalled();
});
const holding = (...portals: string[]) => jest.mocked(db).mockReturnValue({ from: () => ({ select: () => ({ eq: async () => ({ data: portals.map(portal => ({ portal })), error: null }) }) }) } as unknown as ReturnType<typeof db>);
test("a legacy Exams account keeps opening both exam portals with its one membership", async () => {
  jest.mocked(headers).mockResolvedValue(new Headers({ "x-vercel-ip-country": "IN" }) as Awaited<ReturnType<typeof headers>>);
  holding("exams");
  expect(await enterPortal(user, "boards", "signin")).toEqual({ ok: true, created: false, accountId: examsAccountId(user.id) });
  expect(await enterPortal(user, "competitive", "signin")).toEqual({ ok: true, created: false, accountId: examsAccountId(user.id) });
});
test("Board Scholars and Exam Aspirants are separate accounts with distinct ids", async () => {
  jest.mocked(headers).mockResolvedValue(new Headers({ "x-vercel-ip-country": "IN" }) as Awaited<ReturnType<typeof headers>>);
  holding("boards");
  const holdings = await holdingsOf(user.id);
  expect(holdings).toEqual({ portals: ["boards"], legacyExams: false });
  expect(await enterPortal(user, "boards", "signin")).toMatchObject({ ok: true, accountId: examPortalAccountId(user.id, "boards") });
  expect(await enterPortal(user, "competitive", "signin")).toEqual({ ok: false, reason: "no_portal_account", hasOther: true });
  const ids = new Set([user.id, examsAccountId(user.id), accountIdFor(user.id, "boards", holdings), examPortalAccountId(user.id, "competitive")]);
  expect(ids.size).toBe(4);
});
test("Tech account entry remains available overseas", async () => {
  jest.mocked(db).mockReturnValue({ from: () => ({ select: () => ({ eq: async () => ({ data: [{ portal: "tech" }], error: null }) }) }) } as unknown as ReturnType<typeof db>);
  expect(await enterPortal(user, "tech", "signin")).toMatchObject({ ok: true, accountId: "identity" });
});
test("government catalogue includes every requested recruitment family", () => {
  expect(EXAMS.map(exam => exam.id)).toEqual(expect.arrayContaining(["defence", "banks", "railways", "police", "upsc", "state-psc"]));
  expect(EXAMS.some(exam => ["jee", "neet", "cat", "clat", "cuet"].includes(exam.id))).toBe(false);
});
test("board audience is limited to the requested boards and grades", () => {
  expect(BOARDS.map(board => board.id)).toEqual(["up", "cbse", "icse"]);
  expect(CLASSES.map(grade => grade.id)).toEqual(["10", "12"]);
});
