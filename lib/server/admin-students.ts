import "server-only";
import { db } from "./db";
import { trialHours } from "./config";
import { allAuthUsers } from "./admin-users";
import { entitlementTier, trialEndsAt, type Tier } from "@/lib/domain";
import { ALL_EXAMS } from "@/lib/competitive-exams/exams";
import { BOARDS, SUBJECTS } from "@/lib/board-exams/boards";
import { STUDENT_SEGMENTS, type StudentSegment, type StudentsReport, type StudentRow, type StudentTrace, type ScopeRow } from "@/lib/admin-students";

/*
 * Super Admin → Students (2026-11-22): tracking and tracing per audience, in four sections.
 *   tech         Tech Pro accounts; activity is page views on /learning and /tech-buzz, plus practice answers (portal tech)
 *   boards       Board Scholars accounts (and legacy Exams accounts); views on /exams/board-exams, answers (portal boards)
 *   competitive  Exam Aspirants accounts (and legacy Exams); views on /exams/competitive-exams, answers except TET
 *   tet          Exam Aspirants accounts with TET activity: TET answers (scope "tet") or TET pages
 * Access follows lib/server/repository.ts account(): an active subscription, else the new-account trial, else free.
 * Reads are paged (Supabase returns at most 1000 rows a request) and capped, so a busy window stays fast.
 */
const PAGE = 1000, MAX_ROWS = 30_000, TABLE_ROWS = 500;
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type Page<T> = { data: T[] | null; error: { message: string } | null };
async function readAll<T>(build: (from: number, to: number) => PromiseLike<Page<T>>): Promise<T[] | null> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) return rows.length ? rows : null;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}
const chunks = <T,>(list: T[], size = 300) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

const CONFIG: Record<StudentSegment, { portals: string[]; answerPortal: "tech" | "boards" | "competitive"; paths: string[]; tetOnly?: boolean; excludeTet?: boolean }> = {
  tech: { portals: ["tech"], answerPortal: "tech", paths: ["/learning", "/tech-buzz"] },
  boards: { portals: ["boards", "exams"], answerPortal: "boards", paths: ["/exams/board-exams"] },
  competitive: { portals: ["competitive", "exams"], answerPortal: "competitive", paths: ["/exams/competitive-exams"], excludeTet: true },
  tet: { portals: ["competitive", "exams"], answerPortal: "competitive", paths: ["/exams/competitive-exams"], tetOnly: true },
};
const isTetPath = (path: string) => /[?&]exam=tet\b/.test(path) || /\btet\b/i.test(path.replace(/^\/exams\/competitive-exams/, ""));

/** A practice set's readable name: an exam id ("nda") or board-class-subject ("up-10-math"). */
export function scopeLabel(scope: string): string {
  const exam = ALL_EXAMS.find(item => item.id === scope);
  if (exam) return exam.name;
  const [board, cls, subject] = scope.split("-");
  const b = BOARDS.find(item => item.id === board); const s = SUBJECTS.find(item => item.id === subject);
  return b && s ? `${b.name} · Class ${cls} · ${s.name}` : scope;
}

type Account = { auth_user_id: string; account_id: string; portal: string; created_at: string; name: string | null };
type Answer = { account_id: string; scope: string; correct: boolean; answered_at: string };
type Visit = { user_id: string; path: string; created_at: string };

async function accountsOf(segment: StudentSegment): Promise<Account[] | null> {
  return readAll<Account>((from, to) => db().from("portal_account_directory").select("auth_user_id,account_id,portal,created_at,name")
    .in("portal", CONFIG[segment].portals).order("created_at", { ascending: false }).range(from, to) as unknown as PromiseLike<Page<Account>>);
}

/** Subscriptions and profile creation times. The trial runs from the profile's created_at, as in repository.account():
 *  portal_accounts rows were backfilled when migration 0054 ran, so their created_at is not when the student joined. */
async function accessOf(ids: string[]) {
  const subs = new Map<string, { tier: Tier; status: string; current_period_end: string | null; grace_until: string | null }>();
  const created = new Map<string, string>();
  for (const part of chunks(ids)) {
    const [{ data }, { data: profiles }] = await Promise.all([
      db().from("subscriptions").select("user_id,tier,status,current_period_end,grace_until").in("user_id", part),
      db().from("profiles").select("id,created_at").in("id", part),
    ]);
    for (const row of data ?? []) subs.set(String(row.user_id), row as never);
    for (const row of profiles ?? []) if (row.created_at) created.set(String(row.id), String(row.created_at));
  }
  return { subs, created };
}

function accessFor(subscription: Parameters<typeof entitlementTier>[0], createdAt: string) {
  const paid = entitlementTier(subscription);
  if (paid !== "free") return { access: paid as StudentRow["access"], trialEndsAt: null };
  const ends = trialEndsAt(createdAt, trialHours());
  return { access: (ends && Date.parse(ends) > Date.now() ? "trial" : "free") as StudentRow["access"], trialEndsAt: ends };
}

export async function studentsReport(segment: StudentSegment, days: number): Promise<StudentsReport> {
  const config = CONFIG[segment]; const since = daysAgo(days);
  const accounts = await accountsOf(segment);
  if (!accounts) return { segment, label: STUDENT_SEGMENTS[segment].label, windowDays: days, available: false, summary: null, scopes: [], students: [], generatedAt: new Date().toISOString() };
  const accountIds = accounts.map(row => row.account_id);
  const authIds = [...new Set(accounts.map(row => row.auth_user_id))];

  // Practice answers in the window for this audience's accounts.
  const answers: Answer[] = [];
  for (const part of chunks(accountIds)) {
    const rows = await readAll<Answer>((from, to) => {
      let query = db().from("exam_answers").select("account_id,scope,correct,answered_at").eq("portal", config.answerPortal).in("account_id", part).gte("answered_at", since);
      if (config.tetOnly) query = query.eq("scope", "tet"); else if (config.excludeTet) query = query.neq("scope", "tet");
      return query.order("answered_at", { ascending: false }).range(from, to) as unknown as PromiseLike<Page<Answer>>;
    });
    answers.push(...(rows ?? []));
  }
  // Page views in the window on this audience's pages, by the signed-in identity.
  const visits: Visit[] = [];
  for (const part of chunks(authIds)) {
    const rows = await readAll<Visit>((from, to) => db().from("site_visits").select("user_id,path,created_at").eq("event", "page_view").eq("is_bot", false)
      .in("user_id", part).gte("created_at", since).or(config.paths.map(path => `path.like.${path}%`).join(",")).order("created_at", { ascending: false }).range(from, to) as unknown as PromiseLike<Page<Visit>>);
    visits.push(...(rows ?? []).filter(visit => config.tetOnly ? isTetPath(visit.path) : config.excludeTet ? !isTetPath(visit.path) : true));
  }

  const byAccount = new Map<string, Answer[]>(); for (const answer of answers) byAccount.set(answer.account_id, [...(byAccount.get(answer.account_id) ?? []), answer]);
  const byUser = new Map<string, Visit[]>(); for (const visit of visits) byUser.set(visit.user_id, [...(byUser.get(visit.user_id) ?? []), visit]);
  // TET is a subject inside Exam Aspirants: its students are the accounts with TET activity.
  const inSegment = config.tetOnly ? accounts.filter(row => byAccount.has(row.account_id) || byUser.has(row.auth_user_id)) : accounts;

  const [{ subs, created }, authUsers] = await Promise.all([accessOf(inSegment.map(row => row.account_id)), allAuthUsers().catch(() => [])]);
  const emailOf = new Map(authUsers.map(user => [user.id, user.email ?? ""]));

  const students: StudentRow[] = inSegment.map(row => {
    const own = byAccount.get(row.account_id) ?? []; const seen = byUser.get(row.auth_user_id) ?? [];
    const correct = own.filter(answer => answer.correct).length;
    const scopes = new Map<string, number>(); for (const answer of own) scopes.set(answer.scope, (scopes.get(answer.scope) ?? 0) + 1);
    const focus = [...scopes].sort((a, b) => b[1] - a[1])[0]?.[0];
    const last = [own[0]?.answered_at, seen[0]?.created_at].filter(Boolean).sort().at(-1) ?? null;
    const joinedAt = created.get(row.account_id) ?? row.created_at;
    return {
      accountId: row.account_id, authUserId: row.auth_user_id, name: row.name, email: emailOf.get(row.auth_user_id) ?? "", joinedAt,
      ...accessFor(subs.get(row.account_id) ?? null, joinedAt),
      lastActive: last, views: seen.length, answers: own.length, accuracy: own.length ? Math.round(correct / own.length * 100) : null,
      focus: focus ? scopeLabel(focus) : null,
    };
  }).sort((a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? "") || b.joinedAt.localeCompare(a.joinedAt));

  const scopeStats = new Map<string, { answers: number; correct: number; students: Set<string> }>();
  for (const answer of answers) {
    const entry = scopeStats.get(answer.scope) ?? { answers: 0, correct: 0, students: new Set<string>() };
    entry.answers += 1; if (answer.correct) entry.correct += 1; entry.students.add(answer.account_id); scopeStats.set(answer.scope, entry);
  }
  const scopes: ScopeRow[] = [...scopeStats].map(([scope, entry]) => ({ scope, label: scopeLabel(scope), answers: entry.answers, students: entry.students.size, accuracy: Math.round(entry.correct / entry.answers * 100) }))
    .sort((a, b) => b.answers - a.answers).slice(0, 20);

  const totalCorrect = answers.filter(answer => answer.correct).length;
  return {
    segment, label: STUDENT_SEGMENTS[segment].label, windowDays: days, available: true,
    summary: {
      students: students.length, newInWindow: students.filter(row => row.joinedAt >= since).length,
      trial: students.filter(row => row.access === "trial").length, paying: students.filter(row => row.access === "monthly" || row.access === "yearly").length,
      expired: students.filter(row => row.access === "free").length, active: students.filter(row => row.lastActive && row.lastActive >= since).length,
      answers: answers.length, accuracy: answers.length ? Math.round(totalCorrect / answers.length * 100) : null, views: visits.length,
    },
    scopes, students: students.slice(0, TABLE_ROWS), generatedAt: new Date().toISOString(),
  };
}

/** One student's trail: their latest page views on this audience's pages and their latest practice answers, newest first. */
export async function studentTrace(segment: StudentSegment, accountId: string): Promise<StudentTrace> {
  const config = CONFIG[segment];
  const { data: link } = await db().from("portal_accounts").select("auth_user_id,portal").eq("account_id", accountId).maybeSingle();
  if (!link || !config.portals.includes(String(link.portal))) return { events: [] };
  const [visits, answers] = await Promise.all([
    db().from("site_visits").select("path,title,created_at,duration_ms,device,city").eq("user_id", link.auth_user_id).eq("event", "page_view")
      .or(config.paths.map(path => `path.like.${path}%`).join(",")).order("created_at", { ascending: false }).limit(80),
    (() => { let query = db().from("exam_answers").select("scope,item_key,correct,choice,answered_at").eq("portal", config.answerPortal).eq("account_id", accountId);
      if (config.tetOnly) query = query.eq("scope", "tet"); else if (config.excludeTet) query = query.neq("scope", "tet");
      return query.order("answered_at", { ascending: false }).limit(80); })(),
  ]);
  const events: StudentTrace["events"] = [
    ...(visits.data ?? []).filter(row => config.tetOnly ? isTetPath(String(row.path)) : config.excludeTet ? !isTetPath(String(row.path)) : true)
      .map(row => ({ kind: "view" as const, at: String(row.created_at), title: row.title ? String(row.title) : String(row.path), detail: [row.path, row.city, row.device].filter(Boolean).join(" · ") })),
    ...(answers.data ?? []).map(row => ({ kind: "answer" as const, at: String(row.answered_at), title: scopeLabel(String(row.scope)),
      detail: `${row.choice === -1 ? "Revealed the answer" : row.correct ? "Correct" : "Incorrect"} · question ${row.item_key}`, correct: row.choice === -1 ? null : Boolean(row.correct) })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100);
  return { events };
}
