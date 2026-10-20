"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bot, Boxes, Cloud, Database, FlaskConical, GitCompareArrows, Layers, Monitor, Server, type LucideIcon } from "lucide-react";
import { COMPARISONS, loadComparisonBank, techPicture, type Comparison, type ComparisonGroup } from "@/lib/comparisons";
import { COMPARISON_DOCS } from "@/lib/comparisons-official";
import type { OfficialTechDocs } from "@/lib/tech-docs-official";
import type { QuestionSet } from "@/lib/interview-questions";
import { learningImageUrl } from "@/lib/learning-image";
import { AUTOPLAY_MS, Controls, Dots } from "./landing-ai-pulse";
import { InterviewQuestions } from "./interview-accordion";
import { Editable, useContentItem, useContentText, useVisibleContent } from "./content-editing";
import { contentKey } from "@/lib/content-overrides";

const compareKey = (item: Comparison) => contentKey("compare", item.id);
import { Pager } from "./super-admin-pager";
import { Combobox } from "./ui/combobox";
import { useLanguage } from "./language-provider";
import { usePagedCarousel } from "./use-paged-carousel";
import { DashboardMore } from "./dashboard-more";
const DashboardLessons = dynamic(() => import("./dashboard-lessons").then(module => module.DashboardLessons));
import home from "./landing-home.module.css";
import interview from "./landing-interview.module.css";
import styles from "./landing-comparisons.module.css";

type Text = (en: string, hindi: string) => string;
/** Eight light tones the slides cycle through, shared with the interview carousel's stylesheet. */
const TONES = 8;
const two = (n: number) => String(n).padStart(2, "0");
const GROUP_ICON: Record<ComparisonGroup, LucideIcon> = {
  "AI & agents": Bot, Frontend: Monitor, "State & data fetching": Layers, "Backend & APIs": Server, Testing: FlaskConical,
  "Data & storage": Database, "Cloud & DevOps": Cloud, "Python & data": Boxes, Architecture: GitCompareArrows,
};

/**
 * Tech Topics comparisons: one slide per "what is the difference…" question, with its picture, a one-line definition
 * and short description of each technology, an at-a-glance table and 40+ difference questions with answers.
 * Autoplay turns a slide every two minutes and holds while the reader hovers or reads; a picker jumps to any
 * comparison. Questions load per slide, when it is near. The same section runs on the landing page and /dashboard.
 * `preview` (the landing page, or a learner without a membership) shows only the first comparison and links on.
 */
export function LandingComparisons({ expanded = false, preview = false, locked = false, official = null }: Readonly<{ expanded?: boolean; preview?: boolean; locked?: boolean; official?: OfficialTechDocs | null }>) {
  const { language } = useLanguage(); const hi = language === "hi"; const text: Text = (en, hindi) => hi ? hindi : en;
  const items = useVisibleContent(COMPARISONS, compareKey);
  const section = useContentItem("section:tech-comparisons", "section");
  const { track, nearViewport, page, pages, playing, setPlaying, running, goTo, holdProps } = usePagedCarousel<HTMLUListElement>(preview ? 1 : items.length, 1, AUTOPLAY_MS);
  const shown = preview ? items.slice(0, 1) : items;
  const groups = [...new Set(items.map(item => item.group))];
  const pickerPage = Math.floor(page / 5) + 1;
  const pickerStart = (pickerPage - 1) * 5;
  if (section.hidden) return null;
  return <section id="tech-comparisons" className={interview.section} aria-labelledby="comparisons-title" {...section.props}>{section.toolbar}<div className={home.inner}>
    <div className={interview.head} data-learning-header>
      <div className={interview.headCopy} data-learning-copy>
        <p className={interview.kicker}><GitCompareArrows size={14} aria-hidden="true" />{text("Tech Topics", "टेक टॉपिक्स")}<span>{items.length} {text("comparisons", "तुलनाएँ")}</span></p>
        <h2 id="comparisons-title">{text("What is the difference ", "असल में अंतर ")}<em>{text("between them, really?", "क्या है?")}</em></h2>
        <p className={interview.lede} data-learning-intro>{text(
          "The comparisons interviewers and teams ask about most, from LangChain, LangGraph and LangSmith to Redux, Zustand and Redux Toolkit. Each one defines every technology in a line, compares them at a glance and answers 40+ difference questions.",
          "इंटरव्यू और टीमों में सबसे ज़्यादा पूछी जाने वाली तुलनाएँ, LangChain, LangGraph और LangSmith से Redux, Zustand और Redux Toolkit तक। हर तुलना में हर तकनीक की एक पंक्ति की परिभाषा, एक नज़र में तालिका और 40+ अंतर प्रश्नों के उत्तर।")}</p>
      </div>
      {<Controls text={text} playing={playing} onPlay={() => setPlaying(p => !p)} page={page} pages={pages} goTo={goTo} previous={text("Previous comparison", "पिछली तुलना")} next={text("Next comparison", "अगली तुलना")} />}
    </div>
    {!preview && <><div className={styles.picker}>
      <span id="comparison-jump-label">{text("Jump to a comparison", "किसी तुलना पर जाएँ")}</span>
      {/* shadcn Combobox (Popover + Command): grouped by topic and searchable, so 37 comparisons stay quick to reach. */}
      <Combobox value={items[page]?.id ?? ""} onChange={id => { const index = items.findIndex(item => item.id === id); if (index >= 0) goTo(index); }}
        groups={groups.map(group => ({ label: group, options: items.filter(item => item.group === group).map(item => ({ value: item.id, label: item.question })) }))}
        placeholder={text("Choose a comparison", "तुलना चुनें")} searchPlaceholder={text("Search comparisons, e.g. Redux", "तुलना खोजें, जैसे Redux")} emptyText={text("No comparison matches that search.", "इस खोज से कोई तुलना नहीं मिली।")}
        clearLabel={text("Clear", "साफ़ करें")} ariaLabel={text("Jump to a comparison", "किसी तुलना पर जाएँ")} icon={GitCompareArrows} />
    </div>
    <nav className={styles.visualPicker} aria-label={text("Browse illustrated comparisons", "चित्रों के साथ तुलनाएँ देखें")}>
      {items.slice(pickerStart, pickerStart + 5).map((item, offset) => { const index = pickerStart + offset; return <button key={item.id} type="button" aria-current={index === page ? "true" : undefined} onClick={() => goTo(index)}>
        <ChainPicture sources={[learningImageUrl("topics", ["comparisons", item.id]), ...item.techs.map(tech => techPicture(tech.name)).filter((id): id is string => !!id).map(id => learningImageUrl("topics", ["interview", id]))]} alt="" icon={<GitCompareArrows size={24} aria-hidden="true" />}><span className={styles.previewLabel}>{item.techs.map(tech => tech.name).join(" / ")}</span></ChainPicture>
      </button>; })}
    </nav>
    <div className={styles.pickerPager}><Pager page={pickerPage} pages={Math.ceil(items.length / 5)} total={items.length} size={5} onPage={next => goTo((next - 1) * 5)} /></div></>}
    <ul ref={track} className={interview.track} aria-roledescription="carousel" aria-label={text("Technology comparisons", "तकनीकी तुलनाएँ")} {...holdProps}>
      {shown.map((item, i) => <ComparisonSlide key={item.id} item={item} index={i} total={items.length} near={nearViewport && Math.abs(i - page) <= 1} text={text} official={official} />)}
    </ul>
    {!preview && <Dots pages={pages} page={page} running={running} goTo={goTo} label={n => text(`Show comparison ${n}`, `तुलना ${n} दिखाएँ`)} />}
    {preview && <DashboardMore href={locked ? "/dashboard/plans" : "/dashboard"} title={locked ? text(`Subscribe to open all ${items.length} comparisons`, `सभी ${items.length} तुलनाएँ खोलने के लिए सदस्यता लें`) : text(`See all ${items.length} comparisons`, `सभी ${items.length} तुलनाएँ देखें`)} detail={text("Every comparison, its picker, table and 40+ questions are in your dashboard.", "हर तुलना, उसका चयनकर्ता, तालिका और 40+ प्रश्न आपके डैशबोर्ड में हैं।")} />}
    {expanded && <DashboardLessons section="topics" />}
  </div></section>;
}

function ComparisonSlide({ item, index, total, near, text, official }: Readonly<{ item: Comparison; index: number; total: number; near: boolean; text: Text; official: OfficialTechDocs | null }>) {
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [failed, setFailed] = useState(false);
  // The bank loads once, the first time the slide is on screen or next to it.
  useEffect(() => {
    if (!near || set) return;
    let live = true;
    loadComparisonBank(item.id).then(loaded => { if (live) setSet(loaded); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [near, set, item.id]);
  const Icon = GROUP_ICON[item.group];
  const k = compareKey(item);
  const card = useContentItem(k, "comparison");
  const question = useContentText(k, "question", item.question), summary = useContentText(k, "summary", item.summary);
  // Only the visible slide and its neighbours render in full (table, technology cards, pictures). The other 30+
  // are light shells, which cut this section from ~4,000 DOM nodes and 136 images to a few hundred, the largest
  // share of the landing page's hydration work. A shell fills in as the reader (or autoplay) arrives.
  if (!near) return <li className={interview.slide} data-tone={index % TONES} aria-roledescription="slide" aria-label={`${index + 1} / ${total}: ${item.question}`}>
    <article className={interview.cover}><div className={interview.coverBody}><h3>{question}</h3><p className={interview.tagline}>{summary}</p></div></article>
  </li>;
  return <li className={interview.slide} data-tone={index % TONES} aria-roledescription="slide" aria-label={`${index + 1} / ${total}: ${item.question}`} {...card.props}>{card.toolbar}
    <article className={interview.cover}>
      <ChainPicture sources={[learningImageUrl("topics", ["comparisons", item.id]), ...item.techs.map(tech => techPicture(tech.name)).filter((id): id is string => !!id).map(id => learningImageUrl("topics", ["interview", id]))]} alt={`Illustration comparing ${item.techs.map(tech => tech.name).join(", ")}`} icon={<Icon size={48} strokeWidth={1.3} aria-hidden="true" />}>
        <span className={interview.tag}><Icon size={12} aria-hidden="true" />{item.group}</span>
        <span className={interview.index} aria-hidden="true">{two(index + 1)}</span>
      </ChainPicture>
      <div className={interview.coverBody}>
        <h3><Editable k={k} f="question">{item.question}</Editable></h3>
        <p className={interview.tagline}><Editable k={k} f="summary" multiline>{item.summary}</Editable></p>
        <ul className={styles.techs}>{item.techs.map((tech, k) => <li key={tech.name} data-tint={(index + k) % 6}>
          <TechThumb id={techPicture(tech.name)} name={tech.name} />
          <b>{tech.name}</b>
          <span className={styles.definition}>{tech.definition}</span>
          <span className={styles.description}>{tech.description}</span>
        </li>)}</ul>
        {item.source && <p className={styles.source}>{item.source}</p>}
      </div>
    </article>
    <div className={`${interview.panel} ${styles.tallPanel}`}>
      <div className={styles.glance}>
        <h4>{text("At a glance", "एक नज़र में")}</h4>
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={text(`${item.question} at a glance`, `${item.question} एक नज़र में`)}><table>
          <thead><tr><th scope="col"><span className={styles.srOnly}>{text("Aspect", "पहलू")}</span></th>{item.techs.map(tech => <th key={tech.name} scope="col">{tech.name}</th>)}</tr></thead>
          <tbody>{item.aspects.map(([aspect, ...values]) => <tr key={aspect}><th scope="row">{aspect}</th>{values.map((value, k) => <td key={k}>{value}</td>)}</tr>)}</tbody>
        </table></div>
      </div>
      {set && set.subjective.length > 0
        ? <InterviewQuestions key={item.id} set={set} text={text} scroll heading={<h4>{text(`${set.subjective.length} difference questions`, `${set.subjective.length} अंतर प्रश्न`)}</h4>} />
        : <div className={interview.loading} role="status">{failed ? text("These questions could not load. Check your connection and try again.", "ये प्रश्न लोड नहीं हो सके। कनेक्शन जाँचें और फिर कोशिश करें।") : set ? text("Questions for this comparison are being written.", "इस तुलना के प्रश्न तैयार किए जा रहे हैं।") : text("Loading the questions…", "प्रश्न लोड हो रहे हैं…")}</div>}
      <OfficialDocs item={item} official={official} text={text} />
      <Link className={styles.more} href={`/compare/${item.id}`}>{text("Read the full comparison", "पूरी तुलना पढ़ें")} →</Link>
    </div>
  </li>;
}

/**
 * The slide cover: the comparison's own picture first, then each compared technology's Interview prep picture,
 * moving to the next source when one is missing; with none left it becomes a tinted panel with the group icon.
 */
function ChainPicture({ sources, alt, icon, children }: Readonly<{ sources: (string | null)[]; alt: string; icon: ReactNode; children: ReactNode }>) {
  const usable = sources.filter((src): src is string => !!src);
  const [index, setIndex] = useState(0);
  const src = usable[index];
  return <div className={interview.picture} data-empty={!src}>
    {src ? /* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP from the storage bucket, as on the interview slides. */
      <img key={src} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setIndex(i => i + 1)} /> : <span className={interview.placeholder}>{icon}</span>}
    {children}
  </div>;
}

/** A small picture of one technology, reused from its Interview prep slide; it hides itself when there is none. */
function TechThumb({ id, name }: Readonly<{ id: string | null; name: string }>) {
  const [failed, setFailed] = useState(false);
  const src = id ? learningImageUrl("topics", ["interview", id]) : null;
  if (!src || failed) return null;
  // eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP thumbnail from the storage bucket.
  return <img className={styles.thumb} src={src} alt={`Illustration of ${name}`} width={320} height={160} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

/**
 * Each compared technology's official documentation: the page's own title, summary and sections, read from the
 * official website (lib/tech-docs-official.ts). Without fetched data it still links to the docs, with the slide's
 * one-line definition.
 */
function OfficialDocs({ item, official, text }: Readonly<{ item: Comparison; official: OfficialTechDocs | null; text: Text }>) {
  const docs = item.techs.map(tech => ({ tech, url: COMPARISON_DOCS[tech.name] })).filter((d): d is { tech: Comparison["techs"][number]; url: string } => !!d.url);
  if (!docs.length) return null;
  const host = (url: string) => new URL(url).host.replace(/^www\./, "");
  return <div className={styles.officialDocs}>
    <h4>{text("Official documentation", "आधिकारिक दस्तावेज़")}</h4>
    <ul>{docs.map(({ tech, url }, k) => { const page = official?.pages[url]; return <li key={tech.name} data-tint={k % 6}>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <b>{tech.name}</b>
        <span className={styles.docTitle}>{page?.complete ? page.title : text("Official docs", "आधिकारिक डॉक्स")}</span>
        <span className={styles.docText}>{page?.description || tech.definition}</span>
        {!!page?.sections.length && <span className={styles.docSections}>{page.sections.slice(0, 3).map(s => <i key={s}>{s}</i>)}</span>}
        <small>{host(url)} ↗</small>
      </a>
    </li>; })}</ul>
  </div>;
}
