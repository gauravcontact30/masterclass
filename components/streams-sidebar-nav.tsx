"use client";
import { Suspense, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/components/site-link";
import { useIndiaAccess } from "./audience-provider";
import { useLanguage } from "./language-provider";
import { GROUP_ICON, TECH_ICON } from "./streams-icons";
import { findStep, isTech, playlist, STREAM_GROUPS, streamsHref, techInfo, techsIn, visibleGroups, type StreamGroup, type StreamTech } from "@/lib/streams";
import styles from "./streams-sidebar-nav.module.css";

/**
 * Streams' categories and playlists under the sidebar's Streams link, on /learning/streams with the sidebar expanded:
 * Tech, Board Exams, Government Exams and IELTS (the exam categories only with exam access), with the open category's
 * playlists listed. What is open comes from the URL (?group=, ?tech= or the playlist of ?lesson=), which the dashboard
 * keeps current as you move.
 */
export function StreamsSidebarNav() {
  return <Suspense fallback={<Nav tech={null} group={null} />}><FromUrl /></Suspense>;
}

function FromUrl() {
  const params = useSearchParams(); const tech = params.get("tech"); const group = params.get("group");
  const current = findStep(params.get("lesson") ?? undefined)?.tech ?? (isTech(tech) ? tech : null);
  return <Nav tech={current} group={STREAM_GROUPS.find(g => g.id === group)?.id ?? null} />;
}

function Nav({ tech, group }: { tech: StreamTech | null; group: StreamGroup | null }) {
  const india = useIndiaAccess(); const { language } = useLanguage(); const groups = visibleGroups(india); const techs = techsIn(groups);
  const openGroup = tech ? techInfo(tech).group : group ?? "tech";
  return <ul className={styles.nav} aria-label="Streams playlists">
    {groups.map(g => { const info = STREAM_GROUPS.find(x => x.id === g)!; const GroupIcon = GROUP_ICON[g]; const inGroup = techs.filter(t => techInfo(t).group === g);
      return <li key={g}>
        <Link className={styles.group} href={`/learning/streams?group=${g}`} aria-current={!tech && group === g ? "page" : undefined} aria-expanded={openGroup === g}>
          <GroupIcon size={14} aria-hidden="true" /><span className={styles.name}>{language === "hi" ? info.hi : info.name}</span><small>{inGroup.length}</small>
        </Link>
        {openGroup === g && <ul className={styles.items}>
          {inGroup.map(id => { const p = playlist(id); const Icon = TECH_ICON[id]; return <li key={id}>
            <Link href={streamsHref(id)} aria-current={tech === id ? "page" : undefined} style={{ "--accent": p.info.color } as CSSProperties} title={p.info.playlist}>
              <span className={styles.icon}><Icon size={13} aria-hidden="true" /></span><span className={styles.name}>{p.info.name}</span><small>{p.steps.length}</small>
            </Link>
          </li>; })}
        </ul>}
      </li>; })}
  </ul>;
}
