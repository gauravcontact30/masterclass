import { ArrowRight, Check, Lock } from "lucide-react";
import Link from "@/components/site-link";
import styles from "./api-tech-guide.module.css";

export const MEMBER_FEATURES = ["Parameters and return values", "Worked code examples", "Common mistakes", "Real use cases", "Interview practice", "Every API, every technology"];

/** The one message non-members see wherever API Docs stops: in-depth pages are for subscribers. */
export function ApiMemberNotice({ href = "/learning/plans", compact = false }: Readonly<{ href?: string; compact?: boolean }>) {
  return <aside className={styles.notice} data-compact={compact || undefined} aria-label="Membership">
    <span className={styles.noticeIcon} aria-hidden="true"><Lock size={18} /></span>
    <div>
      <p className={styles.noticeTitle}>In-depth API docs are for subscribers.</p>
      <p>You can read a short description of five APIs per technology. Subscribe to open every API in full.</p>
      {!compact && <ul className={styles.noticeList}>{MEMBER_FEATURES.map(item => <li key={item}><Check size={14} aria-hidden="true" />{item}</li>)}</ul>}
    </div>
    <Link className={styles.noticeCta} href={href}>Subscribe<ArrowRight size={15} aria-hidden="true" /></Link>
  </aside>;
}
