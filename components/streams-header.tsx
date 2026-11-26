"use client";
import Link from "@/components/site-link";
import { ArrowRight, MonitorPlay } from "lucide-react";
import { Wordmark } from "@/components/brand-mark";
import { useIndiaAccess } from "./audience-provider";
import { GROUP_ICON } from "./streams-icons";
import { STREAM_GROUPS, visibleGroups } from "@/lib/streams";
import styles from "./streams-header.module.css";

/**
 * The header on /streams (MCB Streams), in the style of the Tech Buzz header: brand, the MCB Streams name, one link per
 * category (the exam categories only with exam access) and the way into the Learning Dashboard. On phones the categories
 * become a swipeable row under the brand. No script beyond the shared audience provider.
 */
export function StreamsHeader() {
  const groups = visibleGroups(useIndiaAccess());
  return <header className={styles.header}>
    <div className={styles.bar}>
      <Link href="/" prefetch={false} aria-label="MasterClass Buddy home" className={styles.brand}><Wordmark /></Link>
      <Link href="/streams" className={styles.product}><MonitorPlay size={16} aria-hidden="true" />MCB Streams</Link>
      <nav aria-label="Streams categories" className={styles.nav}>
        {groups.map(g => { const info = STREAM_GROUPS.find(x => x.id === g)!; const Icon = GROUP_ICON[g];
          return <a key={g} href={`/streams#${g}`}><Icon size={15} aria-hidden="true" />{info.name}</a>; })}
      </nav>
      <div className={styles.actions}>
        <Link href="/sign-in" prefetch={false} className={styles.signIn}>Sign in</Link>
        <Link href="/learning/streams" prefetch={false} className={styles.cta}>My playlists<ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </div>
  </header>;
}
