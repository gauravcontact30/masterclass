import "server-only";
import { db } from "./db";
import { PORTALS, PORTAL_ORDER, type Portal } from "@/lib/portal";
import { postsFor } from "@/lib/exams-blog";
import { EXAMS } from "@/lib/competitive-exams/exams";
import { OBJECTIVE_MINIMUM } from "@/lib/competitive-exams/practice";
import { BOARDS, SUBJECTS } from "@/lib/board-exams/boards";

/*
 * Super Admin → Portals: one report per audience (Tech Pro, Board Scholars, Exam Aspirants, IELTS Achievers). Accounts come from
 * portal_accounts (migrations 0054 and 0055); legacy 'exams' accounts, which open both exam portals, are reported on
 * their own line so no account is counted twice. Traffic counts page views by path, from site_visits.
 */
const AREAS: Record<Portal, { pages: string; blog: string }> = {
  tech: { pages: "/learning", blog: "/tech-buzz" },
  boards: { pages: "/exams/board-exams", blog: "/exams/board-exams/blog" },
  competitive: { pages: "/exams/competitive-exams", blog: "/exams/competitive-exams/blog" },
  ielts: { pages: "/ielts/dashboard", blog: "/ielts-preparation" },
};
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

async function headCount(build: () => PromiseLike<{ count: number | null; error: unknown }>) {
  const { count, error } = await build();
  return error ? null : count ?? 0;
}
const accountCount = (portal: string, since?: string) => headCount(() => {
  let query = db().from("portal_accounts").select("account_id", { count: "exact", head: true }).eq("portal", portal);
  if (since) query = query.gte("created_at", since);
  return query;
});
const viewCount = (prefix: string, since: string, exclude?: string) => headCount(() => {
  let query = db().from("site_visits").select("id", { count: "exact", head: true }).eq("event", "page_view").eq("is_bot", false).like("path", `${prefix}%`).gte("created_at", since);
  if (exclude) query = query.not("path", "like", `${exclude}%`);
  return query;
});

/** Objective answers saved in the window (app/api/exams/answers); null before migration 0056 is applied. */
const answerCount = (portal: Portal, since: string) => headCount(() => db().from("exam_answers").select("item_key", { count: "exact", head: true }).eq("portal", portal).gte("answered_at", since));

export type PortalReport = {
  portal: Portal; name: string; audience: string; home: string; blogName: string;
  accounts: number | null; new7: number | null; new30: number | null; paying: number | null;
  views7: number | null; blogViews7: number | null;
  content: { label: string; value: string }[];
  recent: { name: string | null; created_at: string }[];
};

export async function portalReports(days: number): Promise<{ portals: PortalReport[]; legacyExams: number | null; windowDays: number; generatedAt: string }> {
  const since = daysAgo(days);
  // Active memberships, each attributed to the portal of the account that holds it.
  const subs = await db().from("subscriptions").select("user_id").eq("status", "active");
  const payingIds = (subs.data ?? []).map(row => String(row.user_id));
  const owners = payingIds.length ? await db().from("portal_accounts").select("account_id,portal").in("account_id", payingIds) : { data: [], error: null };
  const portalOfAccount = new Map((owners.data ?? []).map(row => [String(row.account_id), String(row.portal)]));
  const paying = (portal: Portal) => subs.error || owners.error ? null : payingIds.filter(id => (portalOfAccount.get(id) ?? "tech") === portal).length;

  const content: Record<Portal, { label: string; value: string }[]> = {
    tech: [{ label: "Blog", value: PORTALS.tech.blogName }, { label: "Dashboard", value: "Learning Dashboard" }],
    boards: [{ label: "Boards", value: String(BOARDS.length) }, { label: "Subjects", value: String(SUBJECTS.length) }, { label: "Classes", value: "10 and 12" }, { label: "Journal posts", value: String(postsFor("boards").length) }],
    competitive: [{ label: "Exams", value: String(EXAMS.length) }, { label: "Objective questions", value: `${(EXAMS.length * OBJECTIVE_MINIMUM).toLocaleString("en-IN")}+` }, { label: "Digest posts", value: String(postsFor("competitive").length) }],
    ielts: [{ label: "Questions with answers", value: "860+" }, { label: "Papers", value: "39 (sample, mock, 12 years, 15 practice tests)" }, { label: "Guide", value: PORTALS.ielts.blogName }],
  };
  const portals = await Promise.all(PORTAL_ORDER.map(async (portal): Promise<PortalReport> => {
    const info = PORTALS[portal]; const area = AREAS[portal];
    const [accounts, new7, new30, views7, blogViews7, recent, answers] = await Promise.all([
      accountCount(portal), accountCount(portal, daysAgo(7)), accountCount(portal, daysAgo(30)),
      viewCount(area.pages, since, portal === "tech" ? undefined : area.blog), viewCount(area.blog, since),
      db().from("portal_account_directory").select("name,created_at").eq("portal", portal).order("created_at", { ascending: false }).limit(10),
      answerCount(portal, since),
    ]);
    const practice = { label: `Practice answers (${days} days)`, value: answers === null ? "Needs migration 0056" : answers.toLocaleString("en-IN") };
    return {
      portal, name: info.name, audience: info.audience, home: info.home, blogName: info.blogName,
      accounts, new7, new30, paying: paying(portal), views7, blogViews7, content: [...content[portal], practice],
      recent: (recent.data ?? []).map(row => ({ name: row.name ? String(row.name) : null, created_at: String(row.created_at) })),
    };
  }));
  return { portals, legacyExams: await accountCount("exams"), windowDays: days, generatedAt: new Date().toISOString() };
}
