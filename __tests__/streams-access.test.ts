import { playlist } from "@/lib/streams";
import { STREAM_SOURCES } from "@/lib/server/stream-sources";

/*
 * The Streams entitlement rule on the server (lib/server/streams-access.ts): the first step of every course is free,
 * every other step needs a membership (Tech plan, or the course's own portal plan), exam courses only where exam
 * content is offered, and the player address never leaves the server for anyone else.
 */
const currentUser = jest.fn(); const account = jest.fn(); const indiaAccess = jest.fn(); const holdingsOf = jest.fn(); const isSuperAdminUser = jest.fn();
jest.mock("@/lib/server/auth", () => ({ currentUser: () => currentUser() }));
jest.mock("@/lib/server/repository", () => ({ account: (id: string) => account(id) }));
jest.mock("@/lib/server/audience", () => ({ indiaAccess: () => indiaAccess() }));
jest.mock("@/lib/server/portal", () => ({ holdingsOf: (id: string) => holdingsOf(id), accountIdFor: (id: string, portal: string) => `${portal}:${id}` }));
jest.mock("@/lib/study/preparations", () => ({ isSuperAdminUser: (user: unknown) => isSuperAdminUser(user) }));
jest.mock("@/lib/server/http", () => ({ HttpError: jest.requireActual("@/lib/server/http-error").HttpError }));

import { streamAccess, streamPlayback } from "@/lib/server/streams-access";

const tiers = (map: Record<string, string>) => account.mockImplementation(async (id: string) => ({ tier: map[id] ?? "free" }));
const status = (promise: Promise<unknown>) => promise.then(() => 200, (error: { status?: number }) => error.status);
beforeEach(() => { jest.clearAllMocks(); indiaAccess.mockResolvedValue(true); holdingsOf.mockResolvedValue({ portals: ["tech"], legacyExams: false }); isSuperAdminUser.mockReturnValue(false); tiers({}); });

const react = playlist("react").steps; const physics = playlist("board12-physics").steps; const ielts = playlist("ielts").steps;

test("the first step of a course is free for everyone, with its player address from the server", async () => {
  currentUser.mockResolvedValue(null);
  const { src, free } = await streamPlayback(react[0].id);
  expect(free).toBe(true);
  expect(src).toBe(`https://www.youtube-nocookie.com/embed/${STREAM_SOURCES[react[0].id].video}?autoplay=1&rel=0&playsinline=1&iv_load_policy=3`);
});

test("every other step: 401 without a session, 402 on a free plan, the address for a member", async () => {
  currentUser.mockResolvedValue(null);
  expect(await status(streamPlayback(react[1].id))).toBe(401);
  currentUser.mockResolvedValue({ id: "u1" });
  tiers({ u1: "free" });
  expect(await status(streamPlayback(react[1].id))).toBe(402);
  tiers({ u1: "pro" });
  expect((await streamPlayback(react[1].id)).src).toContain(STREAM_SOURCES[react[1].id].video);
  tiers({ u1: "trial" }); // the new-account trial counts, as everywhere else in the app
  expect(await status(streamPlayback(react[5].id))).toBe(200);
});

test("a portal membership opens its own category only", async () => {
  currentUser.mockResolvedValue({ id: "u2" });
  holdingsOf.mockResolvedValue({ portals: ["tech", "ielts"], legacyExams: false });
  tiers({ u2: "free", "ielts:u2": "pro" });
  expect(await status(streamPlayback(ielts[3].id))).toBe(200);
  expect(await status(streamPlayback(react[3].id))).toBe(402);
  expect(await status(streamPlayback(physics[3].id))).toBe(402);
  expect(await streamAccess()).toEqual({ signedIn: true, member: { tech: false, board: false, exams: false, ielts: true } });
});

test("exam courses are served only where exam content is offered; super admins watch everything; unknown steps are 404", async () => {
  currentUser.mockResolvedValue({ id: "admin" }); isSuperAdminUser.mockReturnValue(true);
  expect(await status(streamPlayback(physics[4].id))).toBe(200);
  indiaAccess.mockResolvedValue(false);
  expect(await status(streamPlayback(physics[0].id))).toBe(403);
  expect(await status(streamPlayback("mcbDoesNotExist"))).toBe(404);
});
