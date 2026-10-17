"use client";

import learningCard from "./learning-card.module.css";
import { LearningPicture } from "@/components/learning-picture";
import { learningImageUrl } from "@/lib/learning-image";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, GraduationCap, MessageCircle, Sparkles } from "lucide-react";
import { type GeneratedLesson, type LessonSection, type ProLesson } from "@/lib/pro-learn/types";
import { PRO_LEVELS, PRO_TRACKS, type ProTrack } from "@/lib/pro-learn/tracks";
import { CodeBlock } from "./pro-markdown";
import { dayIndex, ProHero, readList, TrackSelect, useProLevel, useProTrack, writeList } from "./pro-learn-shared";
import styles from "./pro-learn.module.css";
import { BrandOrGlyph } from "./topic-media";
import { LearningResources } from "./learning-resources";
import { LearningPath, RecallDeck, StatStrip } from "./learning-studio";
import { TechnologySections } from "./technology-sections";
import { AiProviderPicker, useAiProvider } from "./ai-provider-picker";

const DONE_KEY = "masterclass:lessons-done";
const LIBRARY_KEY = "masterclass:lessons-generated";
type SavedLesson = ProLesson & { generated: true };

// Completion is stored per browser; subscribing keeps every card in sync after a toggle.
const doneListeners = new Set<() => void>();
function useDone(): [Set<string>, (key: string) => void] {
  const raw = useSyncExternalStore(listener => { doneListeners.add(listener); return () => doneListeners.delete(listener); }, () => { try { return localStorage.getItem(DONE_KEY) ?? "[]"; } catch { return "[]"; } }, () => "[]");
  const done = useMemo(() => new Set<string>(JSON.parse(raw)), [raw]);
  return [done, key => { const next = new Set(done); if (next.has(key)) next.delete(key); else next.add(key); try { localStorage.setItem(DONE_KEY, JSON.stringify([...next])); } catch { /* optional */ } doneListeners.forEach(listener => listener()); }];
}

function Section({ section }: { section: LessonSection }) {
  return <section>
    <h2>{section.h}</h2>
    {section.p.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    {!!section.list?.length && <ul>{section.list.map(item => <li key={item}>{item}</li>)}</ul>}
    {section.code && <CodeBlock code={section.code} language={/\bdef |import \w+$|print\(/m.test(section.code) ? "python" : "typescript"}/>}
    {!!section.key?.length && <div className={styles.callout} data-tone="key"><strong>Key points</strong><ul>{section.key.map(item => <li key={item}>{item}</li>)}</ul></div>}
    {!!section.warn?.length && <div className={styles.callout} data-tone="warn"><strong>Watch out</strong><ul>{section.warn.map(item => <li key={item}>{item}</li>)}</ul></div>}
  </section>;
}

function Reader({ lesson, track, siblings, done, builtIn, onToggleDone, onBack, onOpen }: { lesson: ProLesson; track: ProTrack; siblings: ProLesson[]; done: boolean; builtIn: boolean; onToggleDone?: () => void; onBack: () => void; onOpen: (lesson: ProLesson) => void }) {
  const index = siblings.findIndex(item => item.id === lesson.id);
  const previous = index > 0 ? siblings[index - 1] : null, next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
  return <div>
    <div className={styles.readerTop}>
      <button className={`${styles.btn} ${styles.outline} ${styles.small}`} onClick={onBack}><ArrowLeft size={15}/>All lessons</button>
      {onToggleDone && <button className={`${styles.btn} ${done ? styles.outline : styles.primary} ${styles.small}`} aria-pressed={done} onClick={onToggleDone}><Check size={15}/>{done ? "Completed" : "Mark complete"}</button>}
    </div>
    <article className={styles.article}>
      <p className={styles.eyebrow}><BrandOrGlyph label={track.name} glyph={track.icon} size={14}/> {track.name} · {lesson.tag}</p>
      <h1>{lesson.title}</h1>
      {builtIn && <LearningPicture src={learningImageUrl("lessons", [lesson.track, lesson.id])} alt={`Illustration of ${lesson.title}`} />}
      <div className={styles.articleMeta}><span className={styles.level} data-level={lesson.level}>{lesson.level}</span><span className={styles.cat}>{lesson.minutes} min read</span></div>
      <p className={styles.lead}>{lesson.lead || lesson.summary}</p>
      {lesson.sections.map(section => <Section key={section.h} section={section}/>)}
      <LearningResources key={track.id} technology={track.name} />
      {!!lesson.takeaways.length && <div className={styles.takeaways}><h3>Key takeaways</h3><ul>{lesson.takeaways.map(item => <li key={item}>{item}</li>)}</ul></div>}
      <div className={styles.articleFoot}>
        <Link className={`${styles.btn} ${styles.outline} ${styles.small}`} href={`/dashboard/mentors?track=${track.id}&q=${encodeURIComponent(`Go deeper on: ${lesson.title}`)}`}><MessageCircle size={15}/>Ask the mentor</Link>
        <Link className={`${styles.btn} ${styles.outline} ${styles.small}`} href={`/dashboard/quiz?track=${track.id}&topic=${encodeURIComponent(lesson.title)}`}><GraduationCap size={15}/>Quiz me on this</Link>
      </div>
      {(previous || next) && <nav className={styles.articleNav} aria-label="Lesson navigation">
        {previous ? <button onClick={() => onOpen(previous)}><small>← Previous</small><b>{previous.title}</b></button> : <span/>}
        {next ? <button onClick={() => onOpen(next)}><small>Next →</small><b>{next.title}</b></button> : <span/>}
      </nav>}
    </article>
  </div>;
}

export function ProLessons({ lessons, aiReady }: { lessons: ProLesson[]; aiReady: boolean }) {
  const params = useSearchParams();
  const [track, setTrack] = useProTrack(params.get("track"));
  const [level] = useProLevel();
  const [done, toggleDone] = useDone();
  const [filter, setFilter] = useState<"All" | typeof PRO_LEVELS[number]>("All");
  const [open, setOpen] = useState<ProLesson | null>(null);
  const [generation, setGeneration] = useState<{ topic: string; status: "loading" | "error"; message?: string } | null>(null);
  const [saved, setSaved] = useState<SavedLesson[]>([]);
  const { providers, provider, choose } = useAiProvider(aiReady);
  const requestedTopic = params.get("topic");
  const trackLessons = lessons.filter(lesson => lesson.track === track.id);
  const visible = filter === "All" ? trackLessons : trackLessons.filter(lesson => lesson.level === filter);
  const lessonCounts = useMemo(() => lessons.reduce<Record<string, number>>((totals, lesson) => ({ ...totals, [lesson.track]: (totals[lesson.track] ?? 0) + 1 }), {}), [lessons]);
  const today = dayIndex();
  const featured = trackLessons.length ? trackLessons[today % trackLessons.length] : null;
  const topicOfDay = track.syllabus.length ? track.syllabus[today % track.syllabus.length] : `Getting started with ${track.name}`;
  const savedForTrack = saved.filter(lesson => lesson.track === track.id);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser-only saved lessons load after hydration.
  useEffect(() => { setSaved(readList<SavedLesson>(LIBRARY_KEY)); }, []);
  useEffect(() => {
    const id = params.get("lesson");
    const match = id ? lessons.find(lesson => lesson.id === id && lesson.track === track.id) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Deep links open a lesson once the track resolves.
    if (match) setOpen(match);
  }, [params, lessons, track.id]);

  function openLesson(lesson: ProLesson) { setOpen(lesson); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function lessonCard(lesson: ProLesson) {
    const isDone = done.has(`${track.id}:${lesson.id}`);
    return <button key={lesson.id} className={`${styles.lessonCard} ${learningCard.card}`} data-done={isDone} onClick={() => openLesson(lesson)} aria-label={`${lesson.title}${isDone ? ", completed" : ""}`}>
      <LearningPicture variant="card" className={styles.lessonPicture} src={learningImageUrl("lessons", [lesson.track, lesson.id])} alt="" />
      <span className={styles.cardNumber}>LESSON {String(trackLessons.indexOf(lesson) + 1).padStart(2, "0")}</span>
      <span className={styles.doneMark} aria-hidden="true"><Check size={13}/></span>
      <span className={styles.lessonTag}>{lesson.tag}</span><h3>{lesson.title}</h3><p>{lesson.summary}</p>
      <span className={styles.lessonMeta}><span className={styles.level} data-level={lesson.level}>{lesson.level}</span>{lesson.minutes} min<ArrowRight size={13} style={{ marginLeft: "auto" }}/></span>
    </button>;
  }
  async function generate(topic: string) {
    setGeneration({ topic, status: "loading" });
    try {
      const response = await fetch("/api/pro-learn/lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackId: track.id, topic, level, ...(provider ? { provider } : {}) }) });
      const data = await response.json() as { lesson?: GeneratedLesson; error?: string };
      if (!response.ok || !data.lesson) throw new Error(data.error === "ai_unavailable" ? "Lesson generation is not available right now. Read one of the in-depth lessons below instead." : "The lesson could not be generated. Please try again.");
      const lesson: SavedLesson = { ...data.lesson, track: track.id, id: `gen-${Date.now()}`, generated: true, takeaways: data.lesson.takeaways };
      const next = [lesson, ...saved.filter(item => item.title !== lesson.title)];
      setSaved(next); writeList(LIBRARY_KEY, next, 30); setGeneration(null); openLesson(lesson);
    } catch (error) { setGeneration({ topic, status: "error", message: error instanceof Error ? error.message : "Something went wrong." }); }
  }

  if (open) {
    const isSaved = "generated" in open;
    return <div className={styles.root}><Reader lesson={open} track={track} siblings={isSaved ? savedForTrack : trackLessons} done={done.has(`${open.track}:${open.id}`)} builtIn={!isSaved} onToggleDone={isSaved ? undefined : () => toggleDone(`${open.track}:${open.id}`)} onBack={() => setOpen(null)} onOpen={openLesson}/></div>;
  }
  const completed = trackLessons.filter(lesson => done.has(`${track.id}:${lesson.id}`)).length;
  const topics = [...new Set(visible.map(lesson => lesson.tag))].map(name => {
    const group = visible.filter(lesson => lesson.tag === name);
    return { name, lessons: group, done: group.filter(lesson => done.has(`${track.id}:${lesson.id}`)).length };
  });
  // Topic headings only earn their space when they actually gather lessons together; a
  // track where every lesson has its own tag reads better as one grid.
  const grouped = topics.length > 1 && topics.length < visible.length;
  const nextUp = trackLessons.find(lesson => !done.has(`${track.id}:${lesson.id}`)) ?? null;
  const remaining = trackLessons.filter(lesson => !done.has(`${track.id}:${lesson.id}`)).reduce((total, lesson) => total + lesson.minutes, 0);
  return <div className={styles.root}>
    <LearningPath active="lessons"/>
    <ProHero eyebrow="Professional learning / Lessons" title={track.name} icon={<BrandOrGlyph label={track.name} glyph={track.icon} size={20}/>} aside={<TrackSelect value={track.id} onChange={id => { setTrack(id); setFilter("All"); setGeneration(null); }}/>}>
      Hand-written lessons on {track.focus}, plus fresh lessons generated on any syllabus topic — all read right here.
    </ProHero>

    <StatStrip items={[
      { value: `${completed}`, unit: `/ ${trackLessons.length}`, label: "Lessons completed" },
      { value: `${remaining}`, unit: "min", label: "Reading left" },
      { value: `${trackLessons.filter(lesson => lesson.takeaways.length).length}`, label: "Recall cards" },
      { value: `${track.syllabus.length}`, label: "Syllabus topics" },
    ]}/>
    <div className={styles.progress} role="progressbar" aria-label="Lesson completion" aria-valuemin={0} aria-valuemax={Math.max(1, trackLessons.length)} aria-valuenow={completed}><i style={{ width: `${trackLessons.length ? completed / trackLessons.length * 100 : 0}%` }}/></div>
    {nextUp && completed > 0 && <button className={styles.resume} onClick={() => openLesson(nextUp)}>
      <span className={styles.eyebrow}>Pick up where you left off</span>
      <b>{nextUp.title}</b>
      <span className={styles.resumeMeta}>{nextUp.tag} · {nextUp.minutes} min<ArrowRight size={15}/></span>
    </button>}
    {requestedTopic && !generation && <div className={styles.notice} role="status" style={{ marginBottom: 16 }}>Want a lesson on <b>{requestedTopic}</b>? <button className={`${styles.btn} ${styles.primary} ${styles.small}`} style={{ marginLeft: 8 }} onClick={() => void generate(requestedTopic)} disabled={!aiReady}><Sparkles size={14}/>Generate it</button>{!aiReady && " Generation is not available right now."}</div>}

    {featured ? <section className={styles.featured} aria-label="Featured lesson">
      <p className={styles.eyebrow}><BrandOrGlyph label={track.name} glyph={track.icon} size={14}/> {track.name} · Featured today</p>
      <h2>{featured.title}</h2>
      <p>{featured.summary}</p>
      <div className={styles.pills}><span className={styles.pill}>{featured.tag}</span><span className={styles.pill}>{featured.level}</span><span className={styles.pill}>{featured.minutes} min read</span></div>
      <div className={styles.featuredActions}><button className={`${styles.btn} ${styles.light}`} onClick={() => openLesson(featured)}><BookOpen size={16}/>Start reading</button>{aiReady && <button className={`${styles.btn} ${styles.ghost}`} onClick={() => void generate(topicOfDay)}><Sparkles size={16}/>Generate: {topicOfDay}</button>}</div>
    </section> : <section className={styles.featured} aria-label="Topic of the day">
      <p className={styles.eyebrow}><BrandOrGlyph label={track.name} glyph={track.icon} size={14}/> {track.name} · Topic of the day</p><h2>{topicOfDay}</h2>
      <p>Generate a structured lesson on today&apos;s topic, or pick another from the syllabus below.</p>
      <div className={styles.featuredActions}><button className={`${styles.btn} ${styles.light}`} disabled={!aiReady} onClick={() => void generate(topicOfDay)}><Sparkles size={16}/>Generate today&apos;s lesson</button></div>
    </section>}

    {generation && <div className={styles.notice} data-tone={generation.status === "error" ? "error" : undefined} role={generation.status === "error" ? "alert" : "status"} style={{ marginTop: 16 }}>
      {generation.status === "loading" ? <span className={styles.loading}><span className={styles.spinner}/>Writing a {level.toLowerCase()} lesson on {generation.topic}…</span> : generation.message}
    </div>}

    <RecallDeck key={track.id} lessons={trackLessons}/>

    {!!track.syllabus.length && <>
      <div className={styles.sectionHead}><div><h2>{track.name} syllabus</h2><p>{aiReady ? "Choose any topic to generate a full lesson. A new topic is highlighted each day." : "The core topics for this track."}</p></div></div>
      {aiReady && <AiProviderPicker providers={providers} provider={provider} onChoose={choose} label="Generate with"/>}
      <div className={styles.chips}>{track.syllabus.map(topic => <button key={topic} className={`${styles.chip} ${topic === topicOfDay ? styles.chipToday : ""}`} disabled={!aiReady || generation?.status === "loading"} onClick={() => void generate(topic)}>{topic}</button>)}</div>
    </>}

    {!!savedForTrack.length && <>
      <div className={styles.sectionHead}><div><h2>Your generated lessons</h2><p>Saved in this browser.</p></div></div>
      <div className={styles.grid}>{savedForTrack.map(lesson => <button key={lesson.id} className={`${styles.lessonCard} ${learningCard.card}`} onClick={() => openLesson(lesson)}><span className={styles.lessonTag}>{lesson.tag}</span><h3>{lesson.title}</h3><p>{lesson.summary}</p><span className={styles.lessonMeta}><span className={styles.level} data-level={lesson.level}>{lesson.level}</span>{lesson.minutes} min</span></button>)}</div>
    </>}

    {!!trackLessons.length && <>
      <div className={styles.sectionHead}>
        <div><h2>In-depth {track.name} lessons</h2><p>{completed} of {trackLessons.length} completed</p></div>
        <div className={styles.seg} role="group" aria-label="Filter by level">{(["All", ...PRO_LEVELS] as const).map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div>
      </div>
      {/* Grouped by topic so a long track reads as a syllabus rather than one shelf of cards. */}
      {grouped
        ? topics.map(topic => <section key={topic.name} className={styles.topicGroup} aria-label={`${topic.name} lessons`}>
          <div className={styles.topicHead}><h3>{topic.name}</h3><span>{topic.lessons.length} lesson{topic.lessons.length === 1 ? "" : "s"}{topic.done ? ` · ${topic.done} done` : ""}</span></div>
          <div className={styles.grid}>{topic.lessons.map(lesson => lessonCard(lesson))}</div>
        </section>)
        : <div className={styles.grid}>{visible.map(lesson => lessonCard(lesson))}</div>}
      {!visible.length && <p className={styles.empty}>No {filter.toLowerCase()} lessons for this track yet.</p>}
    </>}

    <div className={styles.sectionHead}>
      <div><h2>Every technology, grouped by what you build</h2><p>Twelve families across {lessons.length} lessons. Open a family to switch track.</p></div>
      <span className={styles.cat}>{PRO_TRACKS.length} tracks</span>
    </div>
    <TechnologySections idPrefix="lessons-track" tracks={PRO_TRACKS} selected={track.id} counts={lessonCounts}
      countLabel={total => `${total} lesson${total === 1 ? "" : "s"}`} emptyLabel="Syllabus only"
      onSelect={id => { setTrack(id); setFilter("All"); setGeneration(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}/>
  </div>;
}
