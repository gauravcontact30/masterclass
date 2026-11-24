"use client";
import { useState } from "react";
import Link from "@/components/site-link";
import { ArrowRight, Clock3, Code2, FileText, MessagesSquare } from "lucide-react";
import { TECH_TRACKS } from "@/lib/landing-showcase/tech";
import { ShowcaseAccordion, ShowcaseCarousel, ShowcasePicker, StarRating, useShowcase } from "./landing-showcase-carousel";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-showcase.module.css";

/*
 * Section 1 of the three showcases under the landing slider (user request 2026-11-24): Tech, for every visitor.
 * A dark "interview studio": the carousel of six technologies turns every five seconds; beside it a paginated row of
 * technology pills and an editor-style panel with the technology's most-asked questions and a mock interview paper,
 * every question with its model answer in an accordion.
 */
export function LandingTechShowcase() {
  const { ref, index, seen, go, pause, playing, setPlaying, running, panelProps } = useShowcase(TECH_TRACKS.length);
  const [view, setView] = useState<"answers" | "paper">("answers");
  const track = TECH_TRACKS[index];
  return <section id="showcase-tech" ref={ref} className={`${frame.section} ${styles.section}`} data-theme="studio" aria-labelledby="showcase-tech-title"><div className={home.inner}>
    <header className={styles.head}>
      <p className={styles.kicker}><Code2 size={14} aria-hidden="true" />Tech<span>Interview studio</span></p>
      <h2 id="showcase-tech-title">Crack the tech interview, <em>one question at a time.</em></h2>
      <p className={styles.lede}>Real interview questions for six of the most hired-for skills, each rated by how often it is asked, with model answers and a mock interview paper you can practise against the clock.</p>
    </header>
    <div className={styles.split}>
      <ShowcaseCarousel slides={TECH_TRACKS} label="Technologies" index={index} seen={seen} go={go} playing={playing} setPlaying={setPlaying} running={running} />
      <div className={styles.panel} {...panelProps}>
        <ShowcasePicker items={TECH_TRACKS.map(t => ({ id: t.id, label: t.kicker.replace("Automation · ", ""), sub: t.facts[1] }))} index={index} onPick={go} label="Technology" />
        <article className={styles.editor} aria-label={`${track.kicker} interview preparation`}>
          <div className={styles.editorBar}>
            <span className={styles.editorDots} aria-hidden="true"><i /><i /><i /></span>
            <div className={styles.tabs} role="tablist" aria-label="View">
              <button type="button" role="tab" aria-selected={view === "answers"} onClick={() => setView("answers")}><MessagesSquare size={14} aria-hidden="true" />Most asked<b>{track.answers.length}</b></button>
              <button type="button" role="tab" aria-selected={view === "paper"} onClick={() => setView("paper")}><FileText size={14} aria-hidden="true" />Mock interview paper<b>{track.paper.questions.length}</b></button>
            </div>
          </div>
          <div className={styles.editorBody} key={`${track.id}-${view}`} role="tabpanel">
            {view === "answers" ? <>
              <p className={styles.file}>{track.id}/most-asked.md <span>Rated by how often each is asked</span></p>
              <ShowcaseAccordion onOpen={pause} items={track.answers.map((item, i) => ({ id: `${track.id}-a${i}`, q: item.q, points: item.points,
                meta: <><StarRating count={item.stars} /><b data-level={item.level}>{item.level}</b><small>{item.tag}</small></> }))} />
            </> : <>
              <p className={styles.file}>{track.id}/mock-paper.md <span><Clock3 size={13} aria-hidden="true" />{track.paper.minutes} min · {track.paper.questions.length} questions</span></p>
              <ShowcaseAccordion onOpen={pause} answerLabel="What a strong answer covers" items={track.paper.questions.map((item, i) => ({ id: `${track.id}-p${i}`, q: item.q, points: item.points,
                meta: <><b data-level={item.level}>{item.level}</b><small>Question {i + 1} of {track.paper.questions.length}</small></> }))} />
            </>}
          </div>
        </article>
        <div className={styles.actions}>
          <Link className={styles.cta} href={track.href}>All {track.kicker} questions<ArrowRight size={16} aria-hidden="true" /></Link>
          <Link className={styles.ghost} href="/learning">Open the Tech dashboard</Link>
        </div>
      </div>
    </div>
  </div></section>;
}
