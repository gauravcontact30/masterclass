"use client";
import { useEffect, useState, type ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import { bankIds, INTERVIEW_TECHS, loadInterviewBank, type InterviewTech } from "@/lib/interview-bank";
import type { QuestionSet } from "@/lib/interview-questions";
import { learningImageUrl } from "@/lib/learning-image";
import { AUTOPLAY_MS, Controls, Dots, PREVIEW_COUNT } from "./landing-ai-pulse";
import { DashboardMore } from "./dashboard-more";
import { InterviewQuestions, StarRow } from "./interview-accordion";
import { InterviewTechNav, KIND_ICON } from "./interview-tech-nav";
import { useLanguage } from "./language-provider";
import { usePagedCarousel } from "./use-paged-carousel";
import home from "./landing-home.module.css";
import styles from "./landing-interview.module.css";

type Text = (en: string, hindi: string) => string;
/** Eight light tones the slides cycle through, defined in landing-interview.module.css. */
const TONES = 8;
const two = (n: number) => String(n).padStart(2, "0");

/**
 * Interview prep: one slide per technology, each with its picture, its most-asked subjective and objective
 * questions in an accordion, and a light tone of its own. The navigator (search, filters, pages) jumps to a technology; autoplay turns a
 * slide every two minutes and holds while the reader hovers or reads. Questions load per slide, when it is near.
 */
export function LandingInterview({ preview = false }: Readonly<{ preview?: boolean }>) {
  const { language } = useLanguage(); const hi = language === "hi"; const text: Text = (en, hindi) => hi ? hindi : en;
  // The landing page previews three technologies; /dashboard carries all of them with the navigator.
  const techs = preview ? INTERVIEW_TECHS.slice(0, PREVIEW_COUNT) : INTERVIEW_TECHS;
  const { track, page, pages, playing, setPlaying, running, goTo, holdProps } = usePagedCarousel<HTMLUListElement>(techs.length, 1, AUTOPLAY_MS);
  const current = techs[page];
  // The open library tab per tabbed technology, shared by the navigator and the slide.
  const [tabs, setTabs] = useState<Record<string, number>>({});
  const chooseTab = (id: string, tab: number) => setTabs(all => ({ ...all, [id]: tab }));
  return <section id="interview-prep" className={styles.section} aria-labelledby="interview-title"><div className={home.inner}>
    {preview && <DashboardMore href="/dashboard#interview-prep" title={text(`See all ${INTERVIEW_TECHS.length} technologies`, `सभी ${INTERVIEW_TECHS.length} तकनीकें देखें`)} detail={text("30+ subjective and 30+ objective questions for every technology, with search and filters.", "हर तकनीक के लिए 30+ विषयगत और 30+ वस्तुनिष्ठ प्रश्न, खोज और फ़िल्टर के साथ।")} />}
    <div className={styles.head}>
      <div className={styles.headCopy}>
        <p className={styles.kicker}><GraduationCap size={14} aria-hidden="true" />{text("Interview prep", "इंटरव्यू की तैयारी")}<span>{INTERVIEW_TECHS.length} {text("technologies", "तकनीकें")}</span></p>
        <h2 id="interview-title">{text("The questions interviewers ", "वे प्रश्न जो इंटरव्यू में ")}<em>{text("actually ask", "सच में पूछे जाते हैं")}</em></h2>
        <p className={styles.lede}>{text(
          "Subjective and objective questions for every technology on this platform, from LangChain and Next.js to Git and AWS, each rated by how often it comes up. Open one to see a model answer, or the right option and why.",
          "इस प्लेटफ़ॉर्म की हर तकनीक के लिए विषयगत और वस्तुनिष्ठ प्रश्न, LangChain और Next.js से Git और AWS तक, हर एक पर रेटिंग कि वह कितनी बार पूछा जाता है। मॉडल उत्तर या सही विकल्प और उसका कारण देखने के लिए प्रश्न खोलें।")}</p>
      </div>
      <Controls text={text} playing={playing} onPlay={() => setPlaying(p => !p)} page={page} pages={pages} goTo={goTo} previous={text("Previous technology", "पिछली तकनीक")} next={text("Next technology", "अगली तकनीक")} />
    </div>
    {!preview && <InterviewTechNav techs={techs} current={page} onPick={goTo} tones={TONES} text={text} tab={tabs[current?.id] ?? 0} onTab={tab => chooseTab(current.id, tab)} />}
    <p className={styles.now} aria-live="polite"><b>{current?.title}</b><span aria-hidden="true">·</span>{text(`Topic ${page + 1} of ${techs.length}`, `विषय ${page + 1} / ${techs.length}`)}</p>
    <ul ref={track} className={styles.track} aria-roledescription="carousel" aria-label={text("Interview questions by technology", "तकनीक के अनुसार इंटरव्यू प्रश्न")} {...holdProps}>
      {techs.map((tech, i) => <InterviewSlide key={tech.id} tech={tech} index={i} total={techs.length} near={Math.abs(i - page) <= 1} text={text} tab={tabs[tech.id] ?? 0} onTab={tab => chooseTab(tech.id, tab)} />)}
    </ul>
    <Dots pages={pages} page={page} running={running} goTo={goTo} label={n => text(`Show technology ${n}`, `तकनीक ${n} दिखाएँ`)} />
  </div></section>;
}

function InterviewSlide({ tech, index, total, near, text, tab, onTab }: Readonly<{ tech: InterviewTech; index: number; total: number; near: boolean; text: Text; tab: number; onTab: (tab: number) => void }>) {
  const ids = bankIds(tech);
  const [sets, setSets] = useState<Record<string, QuestionSet>>({});
  const [failed, setFailed] = useState(false);
  const id = ids[tab]; const set = sets[id] ?? null;
  // Questions load once per tab, the first time the slide is on screen or next to it with that tab open.
  useEffect(() => {
    if (!near || set) return;
    let live = true;
    loadInterviewBank(id).then(loaded => { if (live) setSets(all => ({ ...all, [id]: loaded })); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [near, set, id]);
  const Icon = KIND_ICON[tech.kind];
  const questions = set ? set.subjective.length + set.objective.length : null;
  const active = tech.tabs?.[tab];
  const title = active?.title ?? tech.title;
  const panelId = `interview-${tech.id}-panel`;
  const pick = (k: number) => { onTab(k); setFailed(false); };

  return <li className={styles.slide} data-tone={index % TONES} aria-roledescription="slide" aria-label={`${index + 1} / ${total}: ${tech.title}`}>
    <article className={styles.cover}>
      <CoverPicture src={learningImageUrl("topics", ["interview", tech.id])} alt={`Illustration of ${tech.title}`} icon={<Icon size={48} strokeWidth={1.3} aria-hidden="true" />}>
        <span className={styles.tag}><Icon size={12} aria-hidden="true" />{text("Interview prep", "इंटरव्यू")}</span>
        <span className={styles.index} aria-hidden="true">{two(index + 1)}</span>
      </CoverPicture>
      <div className={styles.coverBody}>
        <h3>{tech.title}</h3>
        {active && <p className={styles.subtitle}>{active.title}</p>}
        <p className={styles.tagline}>{active?.tagline ?? tech.tagline}</p>
        <dl className={styles.stats}>
          <div><dt>{text("Subjective", "विषयगत")}</dt><dd>{set ? set.subjective.length : "–"}</dd></div>
          <div><dt>{text("Objective", "वस्तुनिष्ठ")}</dt><dd>{set ? set.objective.length : "–"}</dd></div>
          <div><dt>{text("Total", "कुल")}</dt><dd>{questions ?? "–"}</dd></div>
        </dl>
        <p className={styles.rating}><StarRow stars={5} />{text("most asked · ", "सबसे ज़्यादा · ")}<StarRow stars={2} />{text("deep cut", "गहरा प्रश्न")}</p>
      </div>
    </article>
    <div className={styles.panel}>
      {tech.tabs && <div className={styles.tabs} role="tablist" aria-label={text(`${tech.title} tabs`, `${tech.title} टैब`)}>
        {tech.tabs.map((t, k) => <button key={t.id} type="button" role="tab" id={`${panelId}-${t.id}`} aria-selected={k === tab} aria-controls={panelId} tabIndex={k === tab ? 0 : -1}
          onClick={() => pick(k)}
          onKeyDown={event => {
            const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
            if (!step) return;
            const next = (k + step + ids.length) % ids.length; pick(next);
            (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
          }}>{t.title.replace(/^TanStack /, "")}</button>)}
      </div>}
      <div {...(tech.tabs ? { role: "tabpanel", id: panelId, "aria-labelledby": `${panelId}-${tech.tabs[tab].id}` } : {})}>
        {set
          ? <InterviewQuestions key={id} set={set} text={text} scroll heading={<h4>{text(`${title} questions`, `${title} प्रश्न`)}</h4>} />
          : <div className={styles.loading} role="status">{failed ? text("These questions could not load. Check your connection and try again.", "ये प्रश्न लोड नहीं हो सके। कनेक्शन जाँचें और फिर कोशिश करें।") : text("Loading questions…", "प्रश्न लोड हो रहे हैं…")}</div>}
      </div>
    </div>
  </li>;
}

/** The slide's picture with the tag and number laid over it; a missing one becomes a tinted panel with an icon. */
function CoverPicture({ src, alt, icon, children }: Readonly<{ src: string | null; alt: string; icon: ReactNode; children: ReactNode }>) {
  const [failed, setFailed] = useState(false);
  const empty = !src || failed;
  return <div className={styles.picture} data-empty={empty}>
    {empty ? <span className={styles.placeholder}>{icon}</span> : /* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP from the storage bucket, as on the pulse cards. */
      <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
    {children}
  </div>;
}
