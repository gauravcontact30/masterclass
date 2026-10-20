"use client";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { LearningPath, PathStage } from "@/lib/learning-path";
import styles from "./learning-path.module.css";

/** "Weeks 1–2" / "Week 3", for every surface that shows a plan's stages. */
export const stageWeeks = (stage: PathStage, hi: boolean) => stage.from === stage.to
  ? (hi ? `हफ़्ता ${stage.from}` : `Week ${stage.from}`)
  : (hi ? `हफ़्ते ${stage.from}–${stage.to}` : `Weeks ${stage.from}–${stage.to}`);

/**
 * A three-stage plan from /api/learning-path, shown by the sign-up plan preview and the dashboard coach. Technology
 * chips link to the matching notes; `limit` shows only the first stages (sign-up preview).
 */
export function LearningPathView({ path, hi, limit, signedIn = false }: Readonly<{ path: LearningPath; hi: boolean; limit?: number; signedIn?: boolean }>) {
  const stages = limit ? path.stages.slice(0, limit) : path.stages;
  const more = path.stages.length - stages.length;
  return <div className={styles.path}>
    <p className={styles.summary}>{path.summary}</p>
    <ol className={styles.weeks}>
      {stages.map(stage => <li key={stage.stage} className={styles.week}>
        <p className={styles.weekLabel}>{stageWeeks(stage, hi)}</p>
        <h3>{stage.focus}</h3>
        {stage.technologies.length > 0 && <ul className={styles.chips} aria-label={hi ? "इस चरण के विषय" : "Topics in this stage"}>
          {stage.technologies.map(t => <li key={t.id}><Link href={signedIn ? t.href : `/sign-in?redirect=${encodeURIComponent(t.href)}`} prefetch={false}>{t.title}<ArrowUpRight size={12} aria-hidden="true" /></Link></li>)}
        </ul>}
        <ul className={styles.tasks}>{stage.tasks.map(task => <li key={task}>{task}</li>)}</ul>
        <p className={styles.outcome}><CheckCircle2 size={14} aria-hidden="true" />{stage.outcome}</p>
      </li>)}
    </ol>
    {more > 0 && <p className={styles.more}>{hi ? `+${more} और चरण, खाता बनने के बाद डैशबोर्ड पर।` : `+${more} more stage${more === 1 ? "" : "s"} on your dashboard once you join.`}</p>}
    <p className={styles.source}>{path.source === "ai" ? (hi ? "AI ने इस ऐप के नोट्स से बनाया। अपनी गति के अनुसार बदलें।" : "Planned by AI from this app's notes. Adjust it to your pace.") : (hi ? "विषय-आधारित प्लान (AI अभी उपलब्ध नहीं)।" : "Keyword-based plan (AI planning is unavailable right now).")}</p>
  </div>;
}
