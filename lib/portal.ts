/*
 * The site's three portals, one per audience. Each has its own sign-up, sign-in, dashboard, blog and membership, and
 * an account in one gives no access to the others (migrations 0054 and 0055, lib/server/portal.ts).
 *   - Tech Pro: tech professionals, college students and IT employees, worldwide (/learning, Tech Buzz).
 *   - Board Scholars: Class 10 and 12 students on UP Board, CBSE and ICSE / ISC, India only (/exams/board-exams).
 *   - Exam Aspirants: government and competitive exam candidates, India only (/exams/competitive-exams).
 * Safe to import from client components.
 */
export type Portal = "tech" | "boards" | "competitive";
/** The two India-only exam portals. Both live under /exams and share the Exams session cookie. */
export type ExamPortal = Exclude<Portal, "tech">;
export const PORTAL_ORDER: readonly Portal[] = ["tech", "boards", "competitive"];
export const isPortal = (value: unknown): value is Portal => value === "tech" || value === "boards" || value === "competitive";
export const isExamPortal = (value: unknown): value is ExamPortal => value === "boards" || value === "competitive";

export type PortalInfo = {
  /** The name of the portal's members, used on buttons and headings ("Create my Board Scholars account"). */
  name: string;
  /** Who the portal is for, in one line. */
  audience: string;
  /** What the portal opens and where it is available. */
  tagline: string;
  home: string; signIn: string; signUp: string; blog: string; blogName: string; plans: string;
};
export const PORTALS: Record<Portal, PortalInfo> = {
  tech: {
    name: "Tech Pro", audience: "Tech professionals, college students and IT corporate employees", tagline: "Learning Dashboard and Tech Buzz · Worldwide",
    home: "/learning", signIn: "/sign-in", signUp: "/sign-up", blog: "/tech-buzz", blogName: "Tech Buzz", plans: "/learning/plans",
  },
  boards: {
    name: "Board Scholars", audience: "Class 10 and 12 students: UP Board, CBSE and ICSE / ISC", tagline: "Board Exams for Class 10 and 12 · UP Board, CBSE, ICSE",
    home: "/exams/board-exams", signIn: "/exams/board-exams/sign-in", signUp: "/exams/board-exams/sign-up", blog: "/exams/board-exams/blog", blogName: "Scholars Journal", plans: "/exams/board-exams/plans",
  },
  competitive: {
    name: "Exam Aspirants", audience: "Government and competitive exam candidates: NDA, Banks, Railways, SSC, UPSC and more", tagline: "Competitive and government job exams · TET included",
    home: "/exams/competitive-exams", signIn: "/exams/competitive-exams/sign-in", signUp: "/exams/competitive-exams/sign-up", blog: "/exams/competitive-exams/blog", blogName: "Aspirants Digest", plans: "/exams/competitive-exams/plans",
  },
};
/** The other portals, for the "looking for …?" links. */
export const otherPortals = (portal: Portal): Portal[] => PORTAL_ORDER.filter(other => other !== portal);
/** The exam portal a path belongs to, or null for the shared /exams pages (the chooser) and every non-exam path. */
export const examPortalOfPath = (pathname: string): ExamPortal | null =>
  /^\/exams\/board-exams(\/|$)/.test(pathname) ? "boards" : /^\/exams\/competitive-exams(\/|$)/.test(pathname) ? "competitive" : null;
/** The portal a page belongs to, by its path. The shared /exams chooser counts as neither exam portal. */
export const portalOfPath = (pathname: string): Portal => examPortalOfPath(pathname) ?? "tech";

/** Marks this browser as signed in to the exam portals; holds the login identity it was issued for. httpOnly. */
export const EXAMS_COOKIE = "mc_exams_session";
/** Client requests made from an exam portal's pages carry this header ("boards" or "competitive"), so shared APIs act on that account. */
export const PORTAL_HEADER = "x-portal";
