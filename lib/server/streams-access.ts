import "server-only";
import { currentUser } from "./auth";
import { account } from "./repository";
import { indiaAccess } from "./audience";
import { HttpError } from "./http";
import { STREAM_SOURCES } from "./stream-sources";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { accountIdFor, holdingsOf } from "./portal";
import { findStep, isFree, techInfo, type StreamGroup } from "@/lib/streams";
import type { Portal } from "@/lib/portal";

/*
 * Who may watch which Streams step (user rule 2026-11-26): the first step of every course is free for everyone; every
 * other step needs a membership. A membership is a plan that is not "free" (a paid plan or the new-account trial,
 * as everywhere else in the app: lib/server/repository.ts account()) on the Tech account, or on the account of the portal
 * a course belongs to (Board Exams: boards, Government Exams: competitive, IELTS: ielts). Super admins see everything.
 * Board and government-exam courses are only served where exam content is offered (lib/server/audience.ts).
 *
 * The browser never holds a video's address: steps carry opaque ids (lib/streams-videos.ts) and the address comes from
 * here, through /api/streams/play, only for a viewer entitled to that step.
 */
export type StreamAccess = { signedIn: boolean; member: Record<StreamGroup, boolean> };
const NONE: Record<StreamGroup, boolean> = { tech: false, board: false, exams: false, ielts: false };
const PORTAL_OF: Record<Exclude<StreamGroup, "tech">, Portal> = { board: "boards", exams: "competitive", ielts: "ielts" };
const EXAM_GROUPS = new Set<StreamGroup>(["board", "exams"]);

/** What the current viewer may watch beyond the free first steps, per category. */
export async function streamAccess(): Promise<StreamAccess> {
  const user = await currentUser();
  if (!user) return { signedIn: false, member: NONE };
  if (isSuperAdminUser(user)) return { signedIn: true, member: { tech: true, board: true, exams: true, ielts: true } };
  const [techTier, holdings] = await Promise.all([account(user.id).then(a => a.tier), holdingsOf(user.id)]);
  const tech = techTier !== "free";
  const paidPortal = async (portal: Portal) => {
    if (!holdings?.portals.includes(portal)) return false;
    return (await account(accountIdFor(user.id, portal, holdings))).tier !== "free";
  };
  const [boards, competitive, ielts] = await Promise.all([paidPortal(PORTAL_OF.board), paidPortal(PORTAL_OF.exams), paidPortal(PORTAL_OF.ielts)]);
  return { signedIn: true, member: { tech, board: tech || boards, exams: tech || competitive, ielts: tech || ielts } };
}

/** The privacy-enhanced embed, playing at once, with no other videos suggested at the end. */
const embedSrc = (video: string) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video)}?autoplay=1&rel=0&playsinline=1&iv_load_policy=3`;

/**
 * The player address for a step, or an HttpError: 404 for an unknown step, 403 for an exam course outside the region
 * that offers it, 401 to sign in and 402 to subscribe.
 */
export async function streamPlayback(stepId: string): Promise<{ src: string; free: boolean }> {
  const step = findStep(stepId);
  const source = step && STREAM_SOURCES[step.id];
  if (!step || !source) throw new HttpError(404, "not_found");
  const group = techInfo(step.tech).group;
  if (EXAM_GROUPS.has(group) && !await indiaAccess()) throw new HttpError(403, "region_unavailable");
  if (isFree(step)) return { src: embedSrc(source.video), free: true };
  const access = await streamAccess();
  if (!access.signedIn) throw new HttpError(401, "signin_required");
  if (!access.member[group]) throw new HttpError(402, "subscription_required");
  return { src: embedSrc(source.video), free: false };
}
