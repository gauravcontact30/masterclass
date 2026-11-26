"use client";
import { type CSSProperties } from "react";
import Link from "@/components/site-link";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock, Crown, Gift, ListVideo } from "lucide-react";
import { McbCover } from "./streams-cover";
import { canWatch, useStreamAccess } from "./streams-access";
import { pageWindow } from "./streams-explorer";
import { TECH_ICON } from "./streams-icons";
import { clockTime, courseTime, isSample, playlist, SAMPLE_STEPS, STREAM_GROUPS, type StreamStep, type StreamTech } from "@/lib/streams";
import styles from "./streams-rails.module.css";

/**
 * Complete courses on the landing page (2026-11-26): one section per course with a preview of its first three steps
 * (the first is free; the others play for members), and a card that opens the whole course on /streams. Courses come a few at a time, in numbered pages.
 */
export function StreamsRails({ techs, page, onPage, perPage, onPick, active, done, tr }: {
  techs: StreamTech[]; page: number; onPage: (page: number) => void; perPage: number; onPick: (step: StreamStep) => void; active?: string; done: Record<string, true>; tr: (en: string, hi: string) => string;
}) {
  const pages = Math.max(1, Math.ceil(techs.length / perPage)); const safePage = Math.min(page, pages - 1);
  const slice = techs.slice(safePage * perPage, (safePage + 1) * perPage);
  return <div className={styles.rails}>
    <p className={styles.count} aria-live="polite">{tr(`Courses ${safePage * perPage + 1}–${safePage * perPage + slice.length} of ${techs.length}`, `${techs.length} में से ${safePage * perPage + 1}–${safePage * perPage + slice.length} कोर्स`)}</p>
    {slice.map(id => <Rail key={id} tech={id} onPick={onPick} active={active} done={done} tr={tr} />)}
    {pages > 1 && <nav className={styles.pager} aria-label={tr("Course pages", "कोर्स पेज")}>
      <button type="button" onClick={() => onPage(safePage - 1)} disabled={safePage === 0} aria-label={tr("Previous courses", "पिछले कोर्स")}><ChevronLeft size={16} aria-hidden="true" /></button>
      {pageWindow(safePage, pages).map((i, k) => i < 0 ? <span key={`gap-${k}`} aria-hidden="true">…</span>
        : <button key={i} type="button" aria-current={i === safePage ? "page" : undefined} onClick={() => onPage(i)} aria-label={tr(`Complete courses page ${i + 1}`, `पूरे कोर्स पेज ${i + 1}`)}>{i + 1}</button>)}
      <button type="button" onClick={() => onPage(safePage + 1)} disabled={safePage >= pages - 1} aria-label={tr("Next courses", "अगले कोर्स")}><ChevronRight size={16} aria-hidden="true" /></button>
    </nav>}
  </div>;
}

function Rail({ tech, onPick, active, done, tr }: { tech: StreamTech; onPick: (step: StreamStep) => void; active?: string; done: Record<string, true>; tr: (en: string, hi: string) => string }) {
  const p = playlist(tech); const Icon = TECH_ICON[tech]; const group = STREAM_GROUPS.find(g => g.id === p.info.group)!;
  const samples = p.steps.filter(isSample); const more = p.steps.length - samples.length; const stepWord = tr("Step", "चरण");
  const watched = p.steps.filter(s => done[s.id]).length; const access = useStreamAccess();
  return <section id={`course-${tech}`} className={styles.rail} style={{ "--accent": p.info.color } as CSSProperties} aria-labelledby={`course-title-${tech}`}>
    <header className={styles.head}>
      <span className={styles.icon}><Icon size={20} aria-hidden="true" /></span>
      <div className={styles.titles}>
        <p>{tr(group.name, group.hi)} · {tr("Complete course", "पूरा कोर्स")}</p>
        <h3 id={`course-title-${tech}`}>{p.info.playlist}</h3>
        <span>{p.chapters.length} {tr("chapters", "अध्याय")} · {p.steps.length} {tr("steps", "चरण")} · {courseTime(p.seconds)}{watched ? ` · ${watched} ${tr("watched", "देखे")}` : ""}</span>
      </div>
      <Link href={`/streams?playlist=${tech}`} className={styles.all}>{tr("Full course", "पूरा कोर्स")}<ArrowRight size={14} aria-hidden="true" /></Link>
    </header>
    <ol className={styles.grid} aria-label={tr(`${p.info.playlist}: sample steps`, `${p.info.playlist}: नमूना चरण`)}>
      {samples.map(step => <li key={step.id}>
        <button type="button" className={styles.step} aria-pressed={active === step.id} onClick={() => onPick(step)} aria-label={`${stepWord} ${step.step}: ${step.title}`}>
          <McbCover tech={tech} step={step} stepWord={stepWord} locked={!canWatch(step, access)} />
          <span className={styles.text}>
            <small>{tr("Chapter", "अध्याय")} {step.chapterNo} · {step.chapter.title}</small>
            <b>{step.title}</b>
            <span className={styles.meta}><span><Clock size={12} aria-hidden="true" />{clockTime(step.seconds)}</span>
              {done[step.id] ? <span className={styles.seen}><CheckCircle2 size={12} aria-hidden="true" />{tr("Watched", "देखा")}</span>
                : step.step === 1 ? <span className={styles.free}><Gift size={12} aria-hidden="true" />{tr("Free", "मुफ़्त")}</span>
                : <span className={canWatch(step, access) ? styles.member : styles.locked}><Crown size={12} aria-hidden="true" />{canWatch(step, access) ? tr("Included", "शामिल") : tr("Members", "सदस्य")}</span>}</span>
          </span>
        </button>
      </li>)}
      {more > 0 && <li>
        <Link href={`/streams?playlist=${tech}&step=${p.steps[SAMPLE_STEPS]?.id ?? ""}`} className={styles.moreCard} aria-label={tr(`${more} more steps of ${p.info.playlist} on MCB Streams`, `${p.info.playlist} के ${more} और चरण MCB Streams पर`)}>
          <span className={styles.moreIcon}><ListVideo size={26} aria-hidden="true" /></span>
          <b>+{more} {tr("more steps", "और चरण")}</b>
          <span>{tr("Watch the whole course on MCB Streams", "पूरा कोर्स MCB Streams पर देखें")}</span>
          <span className={styles.moreGo}>{tr("Continue", "जारी रखें")}<ArrowRight size={14} aria-hidden="true" /></span>
        </Link>
      </li>}
    </ol>
  </section>;
}
