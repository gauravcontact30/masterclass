import { Suspense } from "react";
import { examMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import Link from "@/components/site-link";
import { Newspaper, Wallet } from "lucide-react";
import { AuthPage, type LinkError } from "@/components/auth-page";
import { ExamsShell } from "@/components/exams-shell";
import { ExamsPlans } from "@/components/exams-plans";
import { authConfigured } from "@/lib/server/config";
import { requireExamUser } from "@/lib/server/portal";
import { examPost, postsFor } from "@/lib/exams-blog";
import { PORTALS, type ExamPortal } from "@/lib/portal";
import styles from "@/components/exams-shell.module.css";

/*
 * The pages each exam portal has of its own (Board Scholars under /exams/board-exams, Exam Aspirants under
 * /exams/competitive-exams): sign-in, sign-up, blog, blog post and plans. The route files are one line each.
 */
const LINK_ERRORS: LinkError[] = ["link_expired", "reset_expired", "link_invalid", "link_other_device", "oauth_failed", "oauth_unavailable", "no_portal_account", "portal_unavailable"];
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function AuthForm({ portal, mode, searchParams }: { portal: ExamPortal; mode: "signin" | "signup"; searchParams: SearchParams }) {
  const { email, redirect, error } = await searchParams;
  const home = PORTALS[portal].home;
  return <AuthPage portal={portal} mode={mode} enabled={authConfigured()} initialEmail={typeof email === "string" ? email.slice(0, 254) : ""}
    redirectTo={typeof redirect === "string" && redirect.startsWith(home) ? redirect : undefined} linkError={LINK_ERRORS.find(known => known === error)} />;
}
/** A portal's own sign-in or sign-up page. It opens that portal's account, separate from the other two. */
export function ExamAuthPage({ portal, mode, searchParams }: { portal: ExamPortal; mode: "signin" | "signup"; searchParams: SearchParams }) {
  return <Suspense fallback={<AuthPage portal={portal} mode={mode} enabled={authConfigured()} />}><AuthForm portal={portal} mode={mode} searchParams={searchParams} /></Suspense>;
}
export const authMetadata = (portal: ExamPortal, mode: "signin" | "signup") => ({ title: mode === "signin" ? `Sign in to ${PORTALS[portal].name}` : `Join ${PORTALS[portal].name}` });

const day = (iso: string, month: "short" | "long" = "short") => new Intl.DateTimeFormat("en-IN", { day: "numeric", month, year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));
const BLOG_INTRO: Record<ExamPortal, { heading: [string, string]; lead: string }> = {
  boards: { heading: ["Score more in boards,", "one chapter at a time."], lead: "Study method for Class 10 and 12: step marking, answer presentation, revision plans and how to read a board sample paper. Written for Board Scholars." },
  competitive: { heading: ["Crack the exam,", "not just the syllabus."], lead: "Strategy for government and competitive exams: previous-year questions, negative marking, sectional timing and current affairs. Written for Exam Aspirants." },
};
// Public and the same for everyone, so it reads no session: the header offers this portal's sign-in and sign-up.
export function ExamBlogIndex({ portal }: { portal: ExamPortal }) {
  const info = PORTALS[portal]; const intro = BLOG_INTRO[portal];
  const [featured, ...rest] = postsFor(portal);
  const categories = [...new Set(postsFor(portal).map(post => post.category))].map(name => ({ name, count: postsFor(portal).filter(post => post.category === name).length }));
  const minutes = postsFor(portal).reduce((sum, post) => sum + post.minutes, 0);
  return <ExamsShell portal={portal} active="blog">
    <div className={styles.stack}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}><Newspaper size={13} aria-hidden="true" />{info.blogName}</p>
        <h1>{intro.heading[0]} <em>{intro.heading[1]}</em></h1>
        <p>{intro.lead}</p>
        <p className={styles.status}><b>{postsFor(portal).length} articles · {minutes} minutes of reading</b><span>{categories.map(c => `${c.name} (${c.count})`).join(" · ")}</span></p>
      </header>
      {featured && <Link className={styles.card} data-featured="" href={`${info.blog}/${featured.slug}`}>
        <small>Latest · {featured.category} · {day(featured.date)} · {featured.minutes} min read</small><h2>{featured.title}</h2><p>{featured.summary}</p><small>Read the article →</small></Link>}
      <ul className={styles.cards}>{rest.map(post => <li key={post.slug}><Link className={styles.card} href={`${info.blog}/${post.slug}`}>
        <small>{post.category} · {day(post.date)} · {post.minutes} min read</small><h2>{post.title}</h2><p>{post.summary}</p></Link></li>)}</ul>
    </div>
  </ExamsShell>;
}
export const blogMetadata = (portal: ExamPortal) => examMetadata({ title: PORTALS[portal].blogName, description: BLOG_INTRO[portal].lead, path: PORTALS[portal].blog as `/${string}` });

export const blogParams = (portal: ExamPortal) => postsFor(portal).map(post => ({ slug: post.slug }));
const portalPost = (portal: ExamPortal, slug: string) => { const post = examPost(slug); return post && post.portals.includes(portal) ? post : undefined; };
export async function blogPostMetadata(portal: ExamPortal, params: Promise<{ slug: string }>) {
  const post = portalPost(portal, (await params).slug);
  return post ? examMetadata({ title: post.title, description: post.summary, path: `${PORTALS[portal].blog}/${post.slug}` as `/${string}` }) : { title: PORTALS[portal].blogName };
}
export async function ExamBlogPost({ portal, params }: { portal: ExamPortal; params: Promise<{ slug: string }> }) {
  const post = portalPost(portal, (await params).slug);
  if (!post) notFound();
  return <ExamsShell portal={portal} active="blog">
    <article className={styles.post}>
      <Link className={styles.back} href={PORTALS[portal].blog}>← All {PORTALS[portal].blogName} articles</Link>
      <p className={styles.meta}><b>{post.category}</b><span>{day(post.date, "long")}</span><span>{post.minutes} min read</span></p>
      <h1>{post.title}</h1>
      <p>{post.summary}</p>
      {post.body.map((block, index) => "h" in block ? <h2 key={index}>{block.h}</h2> : "p" in block ? <p key={index}>{block.p}</p> : <ul key={index}>{block.ul.map(line => <li key={line}>{line}</li>)}</ul>)}
    </article>
  </ExamsShell>;
}

export async function ExamPlansPage({ portal }: { portal: ExamPortal }) {
  const info = PORTALS[portal];
  const { user } = await requireExamUser(portal, info.plans, { member: false });
  return <ExamsShell portal={portal} active="plans" email={user.email}>
    <div className={styles.stack}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}><Wallet size={13} aria-hidden="true" />{info.name} membership</p>
        <h1>One plan for <em>{portal === "boards" ? "every board, class and subject." : "every government and competitive exam."}</em></h1>
        <p>A {info.name} membership opens all of {portal === "boards" ? "Board Exams" : "Competitive Exams"} for this account. It does not cover the other portals, which have their own accounts.</p>
      </header>
      <ExamsPlans portal={portal} />
    </div>
  </ExamsShell>;
}
