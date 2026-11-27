"use client";
import { useState, type CSSProperties } from "react";
import Link from "@/components/site-link";
import { ArrowRight, BookmarkCheck, CirclePlay, Crown, Gift, GraduationCap, Library, ListChecks, Lock, MonitorPlay, NotebookPen, SkipForward, TriangleAlert } from "lucide-react";
import { useLanguage } from "./language-provider";
import { useIndiaAccess } from "./audience-provider";
import { StepList, StreamPlayer, useStreamProgress } from "./streams-player";
import { QualityBadge } from "./streams-explorer";
import { StreamsShelf } from "./streams-shelf";
import { StreamsRails } from "./streams-rails";
import { activeGroups, clockTime, courseTime, findStep, isSample, landingTechs, playlist, quality, SAMPLE_STEPS, streamsHref, streamTotals, techInfo, techsIn, type StreamGroup, type StreamStep, type StreamTech } from "@/lib/streams";
import styles from "./streams.module.css";

/**
 * MCB Streams on the landing page (2026-11-26), right under the slider. A course library (search, category chips, pages)
 * lists every complete course; choosing one brings its section to the top of "Complete courses" (numbered pages of
 * three courses), where each course shows its three sample steps, which play here, and a card for the rest of the
 * course on /streams. Exam
 * categories appear only with exam access. Nothing loads from the video host until play.
 */
const COURSES_PER_PAGE = 3;

export function LandingStreams() {
  const { language } = useLanguage(); const hi = language === "hi"; const tr = (en: string, hindi: string) => hi ? hindi : en;
  const india = useIndiaAccess(); const groups = activeGroups(india); const techs = techsIn(groups);
  const [group, setGroup] = useState<StreamGroup | "all">("all");
  const [focus, setFocus] = useState<StreamTech | null>(null);
  const [coursePage, setCoursePage] = useState(0);
  const [stepId, setStepId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const { progress } = useStreamProgress();

  // The stage plays a free step: the one chosen, or the first step of the course in focus (or of the first featured course).
  const chosen = findStep(stepId ?? undefined);
  const stageTech = chosen && techs.includes(chosen.tech) ? chosen.tech : focus && techs.includes(focus) ? focus : landingTechs(india)[0];
  const list = playlist(stageTech); const samples = list.steps.filter(isSample);
  const step = chosen && chosen.tech === stageTech ? chosen : samples[0];
  const totals = streamTotals(techs); const stepWord = tr("Step", "चरण");
  const activeGroup = group !== "all" && groups.includes(group) ? group : "all";
  const inGroup = activeGroup === "all" ? techs : techs.filter(t => techInfo(t).group === activeGroup);
  // Featured courses lead "All"; a course just chosen leads whatever is shown.
  const ordered = [...new Set([...(focus && inGroup.includes(focus) ? [focus] : []), ...(activeGroup === "all" ? landingTechs(india) : []), ...inGroup])];
  const last = findStep(progress.last?.lesson);
  const next = list.steps[list.steps.findIndex(s => s.id === step.id) + 1];

  const scrollTo = (id: string, block: ScrollLogicalPosition = "start") => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block }));
  const open = (tech: StreamTech) => { setFocus(tech); setStepId(null); setPlaying(false); setCoursePage(0); scrollTo(`course-${tech}`); };
  const pick = (next: StreamStep) => { if (!isSample(next)) return; setFocus(next.tech); setStepId(next.id); setPlaying(true); scrollTo("streams-stage", "center"); };

  return <section id="streams" className={styles.landing} aria-labelledby="streams-title">
    <div className={styles.head}>
      <p className={styles.kicker}><MonitorPlay size={15} aria-hidden="true" />{tr("MCB Streams · by Master Class Buddy", "MCB Streams · Master Class Buddy द्वारा")}</p>
      <h2 id="streams-title" data-h2="">{tr("Complete courses, ", "पूरे कोर्स, ")}<em>{tr("step by step.", "चरण दर चरण।")}</em></h2>
      <p className={styles.lede}>{tr("Study one step at a time, from the first lesson to exam-ready, with notes beside every video. Every step plays in Full HD or better.",
        "पहले पाठ से परीक्षा की तैयारी तक, एक-एक चरण पढ़ें, हर वीडियो के साथ नोट्स। हर चरण फ़ुल HD या बेहतर में।")}</p>
      <ul className={styles.stats}>
        <li><b>{totals.playlists}</b>{tr("complete courses", "पूरे कोर्स")}</li><li><b>{totals.lessons}</b>{tr("steps", "चरण")}</li>
        <li><b>{courseTime(totals.seconds).replace(/ \d+ min$/, "")}</b>{tr("of learning", "की पढ़ाई")}</li><li><b>{totals.uhd}</b>{tr("in 4K Ultra HD", "4K अल्ट्रा HD में")}</li>
      </ul>
      <div className={styles.headActions}>
        <Link className={styles.cta} href="/streams">{tr("Explore every MCB course", "MCB के सभी कोर्स देखें")}<ArrowRight size={16} aria-hidden="true" /></Link>
        {last && techs.includes(last.tech) && <Link className={styles.ghost} href={streamsHref(last.tech, last.id)}><CirclePlay size={16} aria-hidden="true" />{tr("Continue: ", "जारी रखें: ")}{last.title}</Link>}
      </div>
    </div>

    <StreamsShelf techs={techs} groups={groups} group={activeGroup} onGroup={g => { setGroup(g); setCoursePage(0); }} onOpen={open} tr={tr} done={progress.done} />

    <div id="streams-stage" className={styles.stage} style={{ "--accent": list.info.color } as CSSProperties}>
      <div className={styles.main}>
        <StreamPlayer step={step} playing={playing} onPlay={() => setPlaying(true)} label={tr("Play", "चलाएँ")} stepWord={stepWord} />
      </div>
      <aside className={styles.side} aria-label={tr("First steps", "पहले चरण")}>
        <div className={styles.courseHead}><b>{list.info.playlist}</b><small><Gift size={13} aria-hidden="true" /> {tr(`First step free · ${list.steps.length} steps`, `पहला चरण मुफ़्त · ${list.steps.length} चरण`)}</small></div>
        <StepList steps={samples} active={step.id} done={progress.done} onPick={s => { setStepId(s.id); setPlaying(true); }} label={tr("First steps", "पहले चरण")} stepWord={stepWord} />
        <p className={styles.locked}><Lock size={14} aria-hidden="true" />{tr(`${list.steps.length - samples.length} more steps in the full MCB course`, `पूरे MCB कोर्स में ${list.steps.length - samples.length} और चरण`)}</p>
        <Link className={styles.cta} href={`/streams?playlist=${stageTech}&step=${list.steps[SAMPLE_STEPS]?.id ?? ""}`}>{tr("Continue the full course", "पूरा कोर्स जारी रखें")}<ArrowRight size={16} aria-hidden="true" /></Link>
      </aside>
    </div>

    <div className={styles.lessonRow} style={{ "--accent": list.info.color } as CSSProperties}>
      <article className={styles.lessonCard} aria-labelledby="streams-lesson-title">
        <p className={styles.meta}><span>{list.info.name}</span><span>{stepWord} {step.step} / {list.steps.length}</span><span>{step.chapter.title}</span><span>{clockTime(step.seconds)}</span><QualityBadge value={quality(step.id)} /></p>
        <h3 id="streams-lesson-title">{step.title}</h3>
        <p className={styles.lessonSummary}><GraduationCap size={16} aria-hidden="true" />{step.chapter.summary}</p>
        <div className={styles.learnBlock}>
          <p className={styles.learnHead}><ListChecks size={15} aria-hidden="true" />{tr("What you'll learn in this step", "इस चरण में आप क्या सीखेंगे")}</p>
          <ol className={styles.learnList}>{step.points.map((point, n) => <li key={point}><span className={styles.learnNo} aria-hidden="true">{String(n + 1).padStart(2, "0")}</span><span>{point}</span></li>)}</ol>
        </div>
        {list.info.status && <p className={styles.warn}><TriangleAlert size={15} aria-hidden="true" />{list.info.status}</p>}
        {step.chapter.note && <p className={styles.note}>{step.chapter.note}</p>}
        {next && <p className={styles.upNext}><SkipForward size={14} aria-hidden="true" /><span>{tr("Up next", "आगे")}</span><b>{stepWord} {next.step}: {next.title}</b></p>}
      </article>
      <aside className={styles.railsHead} aria-label={tr("The MCB course library", "MCB कोर्स लाइब्रेरी")}>
        <p className={styles.kicker}><Library size={15} aria-hidden="true" />{tr("The MCB course library", "MCB कोर्स लाइब्रेरी")}</p>
        <h3>{tr("Complete courses, ", "पूरे कोर्स, ")}<em>{tr("crafted by Master Class Buddy.", "Master Class Buddy द्वारा तैयार।")}</em></h3>
        <p>{tr("Every course is organised chapter by chapter by the MCB team, with study notes beside each video and your progress saved as you learn. Start any course free with its first step; MCB members unlock every step that follows.",
          "हर कोर्स को MCB टीम ने अध्याय-दर-अध्याय व्यवस्थित किया है, हर वीडियो के साथ स्टडी नोट्स, और आपकी प्रगति सहेजी जाती है। किसी भी कोर्स का पहला चरण मुफ़्त देखें; MCB सदस्य आगे के सभी चरण देख सकते हैं।")}</p>
        <ul className={styles.perks}>
          <li><Gift size={15} aria-hidden="true" />{tr("First step free", "पहला चरण मुफ़्त")}</li>
          <li><Crown size={15} aria-hidden="true" />{tr("Every step for members", "सदस्यों के लिए हर चरण")}</li>
          <li><NotebookPen size={15} aria-hidden="true" />{tr("Notes with every video", "हर वीडियो के साथ नोट्स")}</li>
          <li><BookmarkCheck size={15} aria-hidden="true" />{tr("Pick up where you left off", "जहाँ छोड़ा, वहीं से शुरू")}</li>
        </ul>
      </aside>
    </div>

    <div id="streams-courses" className={styles.railsAnchor} />
    <StreamsRails techs={ordered} page={coursePage} onPage={p => { setCoursePage(p); scrollTo("streams-courses"); }} perPage={COURSES_PER_PAGE} onPick={pick} active={step.id} done={progress.done} tr={tr} />
  </section>;
}
