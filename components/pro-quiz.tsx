"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookA, CircleHelp, RotateCcw, Sparkles, Target } from "lucide-react";
import { PRO_LEVELS, PRO_TRACKS, trackById, type ContentSource, type QuizQuestion } from "@/lib/pro-learn/types";
import { ProHero, readList, Select, SourceBadge, TrackSelect, useProLevel, useProTrack, writeList } from "./pro-learn-shared";
import styles from "./pro-learn.module.css";
import { LearningPath, StatStrip, StudyNote } from "./learning-studio";
import { FlashcardDeck, type StudyCard } from "./study-cards";
import { TechnologySections } from "./technology-sections";

const HISTORY_KEY = "masterclass:quiz-history";
const COUNTS = ["3", "5", "10", "15", "20"] as const;
const letter = (index: number) => String.fromCharCode(65 + index);
type Attempt = { trackId: string; topic: string; score: number; total: number; date: string };
type Session = { questions: QuizQuestion[]; source: ContentSource; trackId: string; topic: string; level: string; index: number; picked: number | null; score: number; answers: number[] };

export function ProQuiz({ aiReady, libraryTracks }: { aiReady: boolean; libraryTracks: string[] }) {
  const params = useSearchParams();
  const [track, setTrack] = useProTrack(params.get("track"));
  const [level, setLevel] = useProLevel();
  const [count, setCount] = useState<typeof COUNTS[number]>("5");
  const [topic, setTopic] = useState(params.get("topic") ?? "");
  const [status, setStatus] = useState<{ state: "idle" | "loading" | "error"; message?: string }>({ state: "idle" });
  const [session, setSession] = useState<Session | null>(null);
  const [finished, setFinished] = useState(false);
  const [history, setHistory] = useState<Attempt[]>([]);
  const revealRef = useRef<HTMLDivElement>(null);
  // Without AI only tracks backed by an authored question bank can produce a quiz.
  const tracks = aiReady ? PRO_TRACKS : PRO_TRACKS.filter(item => libraryTracks.includes(item.id));
  const selected = tracks.some(item => item.id === track.id) ? track : tracks[0] ?? track;

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Score history lives in this browser only.
  useEffect(() => { setHistory(readList<Attempt>(HISTORY_KEY).filter(attempt => trackById(attempt.trackId))); }, []);

  async function start(trackId = selected.id, total = Number(count), quizLevel: string = level, quizTopic = topic.trim()) {
    setStatus({ state: "loading" }); setFinished(false);
    try {
      const response = await fetch("/api/pro-learn/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackId, count: total, level: quizLevel, topic: quizTopic }) });
      const data = await response.json() as { questions?: QuizQuestion[]; source?: ContentSource; error?: string };
      if (!response.ok || !data.questions?.length) throw new Error(data.error === "ai_unavailable" ? "Quizzes for this technology need AI generation, which is not available right now. Choose a technology with a question bank." : data.error === "rate_limited" ? "You are generating quizzes quickly. Please wait a minute and try again." : "The quiz could not be prepared. Please try again.");
      setSession({ questions: data.questions, source: data.source ?? "ai", trackId, topic: quizTopic, level: quizLevel, index: 0, picked: null, score: 0, answers: [] });
      setStatus({ state: "idle" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { setStatus({ state: "error", message: error instanceof Error ? error.message : "Something went wrong." }); }
  }
  function pick(option: number) {
    if (!session || session.picked !== null) return;
    const correct = session.questions[session.index].answer === option;
    setSession({ ...session, picked: option, score: session.score + (correct ? 1 : 0), answers: [...session.answers, option] });
    requestAnimationFrame(() => revealRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }
  function next() {
    if (!session) return;
    if (session.index < session.questions.length - 1) { setSession({ ...session, index: session.index + 1, picked: null }); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const attempt: Attempt = { trackId: session.trackId, topic: session.topic, score: session.score, total: session.questions.length, date: new Date().toISOString().slice(0, 10) };
    const updated = [attempt, ...history]; setHistory(updated); writeList(HISTORY_KEY, updated, 30); setFinished(true);
  }

  if (session && finished) {
    const sessionTrack = trackById(session.trackId) ?? selected, percent = Math.round(session.score / session.questions.length * 100);
    const missed = session.questions.filter((question, index) => session.answers[index] !== question.answer);
    // Everything answered is worth re-reading; a perfect run reviews the whole set instead of nothing.
    const review = missed.length ? missed : session.questions;
    const cards: StudyCard[] = review.map((question, index) => {
      const position = session.questions.indexOf(question), picked = session.answers[position];
      return {
        id: `${position}-${index}`,
        eyebrow: picked === question.answer ? "Answered correctly" : "Worth another look",
        front: question.q,
        prompt: "Answer it again from memory before you turn the card — recalling a second time is what fixes it.",
        back: <>
          <p><b>{letter(question.answer)}. {question.options[question.answer]}</b></p>
          <p>{question.explain}</p>
          {!!question.vocab.length && <p>Words to know: {question.vocab.map(word => word.word).join(", ")}.</p>}
        </>,
        meta: picked === question.answer ? ["You answered correctly"] : [`You chose ${letter(picked)}. ${question.options[picked] ?? "—"}`],
      };
    });
    return <div className={styles.root}>
      <ProHero eyebrow="Quiz complete" title={`${sessionTrack.name} quiz`} icon={sessionTrack.icon}>
        {session.topic ? `Focused on ${session.topic}. ` : ""}{missed.length ? "The questions you missed are the fastest place to improve — review them below." : "A clean run. Review the set once more to lock it in."}
      </ProHero>
      <section className={`${styles.card} ${styles.scoreCard}`} aria-label="Your score">
        <div className={styles.scoreMain}>
          <p className={styles.eyebrow}>Your score</p>
          <p className={styles.score}>{session.score}<small>/{session.questions.length}</small></p>
          <p className={styles.scoreVerdict}>{percent >= 80 ? "Excellent — you have this well covered." : percent >= 50 ? "Solid. Review the explanations to close the gaps." : "Worth another pass — read the explanations and retry."}</p>
          <div className={styles.featuredActions}>
            <button className={`${styles.btn} ${styles.primary}`} onClick={() => void start(session.trackId, session.questions.length, session.level, session.topic)}><RotateCcw size={15}/>Retry</button>
            <button className={`${styles.btn} ${styles.outline}`} onClick={() => { setSession(null); setFinished(false); }}>New quiz</button>
          </div>
        </div>
        <ol className={styles.scoreTrail} aria-label="Answer breakdown">
          {session.questions.map((question, index) => <li key={index} data-correct={session.answers[index] === question.answer}><span>{index + 1}</span></li>)}
        </ol>
      </section>
      <FlashcardDeck key={`review-${session.index}-${review.length}`} cards={cards} accent={missed.length ? "clay" : "olive"}
        label="Quiz review flashcards" eyebrow={missed.length ? "Close the gap" : "Lock it in"} title={missed.length ? "Review what you missed." : "One more pass."}
        description={`${review.length} card${review.length === 1 ? "" : "s"} from this quiz. Re-answer each one from memory, then turn it over to compare with the explanation.`}
        icon={<Target size={13}/>} frontLabel="QUIZ QUESTION" backLabel="CORRECT ANSWER" revealLabel="Reveal the answer" againLabel="Review again" knownLabel="I have it now"
        countLabel={(known, total) => `${known} of ${total} re-answered from memory`}/>
    </div>;
  }

  if (session) {
    const question = session.questions[session.index], sessionTrack = trackById(session.trackId) ?? selected;
    const revealed = session.picked !== null, isCorrect = session.picked === question.answer;
    const last = session.index === session.questions.length - 1;
    return <div className={styles.root}>
      <div className={styles.sectionHead} style={{ marginTop: 0 }}>
        <div><h2>{sessionTrack.icon} {sessionTrack.name} quiz</h2><p>Question {session.index + 1} of {session.questions.length} · {session.level}{session.topic ? ` · ${session.topic}` : ""}</p></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}><SourceBadge source={session.source}/><button className={`${styles.btn} ${styles.outline} ${styles.small}`} onClick={() => setSession(null)}>Exit</button></div>
      </div>
      <div className={styles.progress} role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={session.questions.length} aria-valuenow={session.index}><i style={{ width: `${Math.round(session.index / session.questions.length * 100)}%` }}/></div>
      <section className={styles.card} aria-labelledby="quiz-question">
        <p className={styles.eyebrow}>Question {session.index + 1} / {session.questions.length}</p>
        <h3 id="quiz-question" className={styles.question}>{question.q}</h3>
        <div className={styles.options} role="group" aria-label="Answer options">{question.options.map((option, index) => {
          const state = revealed ? index === question.answer ? "correct" : index === session.picked ? "wrong" : undefined : undefined;
          return <button key={option} className={styles.option} data-state={state} disabled={revealed} aria-pressed={session.picked === index} onClick={() => pick(index)}><span className={styles.marker}>{String.fromCharCode(65 + index)}</span><span>{option}</span></button>;
        })}</div>
      </section>
      {revealed && <div ref={revealRef}>
        <section className={`${styles.card} ${styles.answerCard}`} data-correct={isCorrect} role="status">
          <div className={styles.answerHead}><span className={styles.verdict}>{isCorrect ? "✓ Correct" : "✗ Not quite"}</span><span>Correct answer — <b>{String.fromCharCode(65 + question.answer)}. {question.options[question.answer]}</b></span></div>
          <p style={{ lineHeight: 1.7, color: "var(--read)" }}>{question.explain}</p>
        </section>
        {!!question.vocab.length && <>
          <div className={styles.sectionHead} style={{ marginTop: 20 }}><div><h2 style={{ fontSize: 20 }}><BookA size={18} style={{ verticalAlign: "-3px", marginRight: 6 }}/>Words to know</h2></div></div>
          <div className={styles.grid}>{question.vocab.map(word => <article key={word.word} className={`${styles.card} ${styles.vocab}`}>
            <h4>{word.word}</h4>
            {word.sentence && <p style={{ fontStyle: "italic", color: "var(--muted)" }}>“{word.sentence}”</p>}
            {word.meaning && <div className={styles.vocabRow}><span>Meaning</span><span>{word.meaning}</span></div>}
            {!!word.synonyms.length && <div className={styles.vocabRow}><span>Synonyms</span><span>{word.synonyms.map(item => <span key={item} className={styles.tag}>{item}</span>)}</span></div>}
            {!!word.antonyms.length && <div className={styles.vocabRow}><span>Antonyms</span><span>{word.antonyms.map(item => <span key={item} className={styles.tag} data-kind="ant">{item}</span>)}</span></div>}
            {!!word.examples.length && <div className={styles.vocabRow}><span>Examples</span><span>{word.examples.map(item => <span key={item} style={{ display: "block" }}>“{item}”</span>)}</span></div>}
          </article>)}</div>
        </>}
        <button className={`${styles.btn} ${styles.primary}`} style={{ marginTop: 16 }} onClick={next}>{last ? "See results" : "Next question"}<ArrowRight size={15}/></button>
      </div>}
    </div>;
  }

  return <div className={styles.root}>
    <LearningPath active="quiz"/>
    <ProHero eyebrow="Professional learning / Quiz" title="Test what you know" icon={<CircleHelp size={28} color="#c6613f"/>}>
      Pick a technology, a length and a difficulty, then answer one question at a time with instant explanations{aiReady ? " and the words worth knowing." : "."}
    </ProHero>
    {!!history.length && <StatStrip items={[
      { value: `${history.length}`, label: "Quizzes taken" },
      { value: `${Math.round(history.reduce((sum, attempt) => sum + attempt.score / attempt.total, 0) / history.length * 100)}`, unit: "%", label: "Average score" },
      { value: `${history.reduce((sum, attempt) => sum + attempt.total, 0)}`, label: "Questions answered" },
      { value: `${new Set(history.map(attempt => attempt.trackId)).size}`, label: "Technologies practised" },
    ]}/>}
    <div className={styles.sectionHead} style={{ marginTop: history.length ? 28 : 0 }}><div><h2>Find your practice rhythm</h2><p>Choose a session, then tailor it to your learning goals.</p></div><span className={styles.cat}>No timer. Just progress.</span></div>
    <div className={styles.modeGrid} role="group" aria-label="Practice mode">{[
      { count: "3", label: "Quick warm-up", title: "A little, every day", text: "Three questions to reconnect with what you know.", icon: "01", minutes: "≈ 2 min" },
      { count: "5", label: "Focused practice", title: "Find your knowledge gaps", text: "Five questions with explanations that make it click.", icon: "02", minutes: "≈ 5 min" },
      { count: "15", label: "Deep dive", title: "Put yourself to the test", text: "Fifteen questions for a more thorough practice session.", icon: "03", minutes: "≈ 15 min" },
    ].map(mode => <button key={mode.count} className={styles.modeCard} aria-pressed={count === mode.count} onClick={() => setCount(mode.count as typeof COUNTS[number])}><span className={styles.modeTop}><span>{mode.label}</span><b>{mode.icon}</b></span><h3>{mode.title}</h3><p>{mode.text}</p><span className={styles.modeFoot}>{mode.count} questions<span className={styles.modeTime}>{mode.minutes}</span><ArrowRight size={16}/></span></button>)}</div>
    <section className={styles.card} aria-label="Quiz setup">
      <div className={styles.setupTitle}><span className={styles.eyebrow}>YOUR SESSION</span><h2>Make this practice yours</h2></div>
      <div className={styles.setupRow}>
        <TrackSelect value={selected.id} tracks={tracks} onChange={setTrack}/>
        <Select label="Questions" value={count} options={COUNTS} onChange={value => setCount(value as typeof COUNTS[number])}/>
        <Select label="Difficulty" value={level} options={PRO_LEVELS} onChange={setLevel}/>
        {aiReady && <Label className={styles.field}><span>Focus topic (optional)</span><Input className={styles.input} value={topic} maxLength={160} onChange={event => setTopic(event.target.value)} placeholder={`e.g. ${selected.syllabus[0] ?? "core concepts"}`}/></Label>}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 18 }}>
        <button className={`${styles.btn} ${styles.primary}`} disabled={status.state === "loading" || !tracks.length} onClick={() => void start()}>{status.state === "loading" ? <><span className={styles.spinner}/>Building your quiz…</> : <><Sparkles size={15}/>Start quiz</>}</button>
        {!aiReady && <span className={styles.sourceBadge}>Using the MasterClass question bank</span>}
      </div>
      {status.state === "error" && <p className={styles.notice} data-tone="error" role="alert" style={{ marginTop: 14 }}>{status.message}</p>}
    </section>
    <div className={styles.sectionHead}>
      <div><h2>Pick a technology</h2><p>{aiReady ? "Every track can be quizzed. Open a family to choose one." : "Only tracks with an authored question bank can be quizzed right now."}</p></div>
      <span className={styles.cat}>{tracks.length} available</span>
    </div>
    <TechnologySections idPrefix="quiz-track" tracks={tracks} selected={selected.id} onSelect={setTrack}/>
    <StudyNote label="LEARN WITH INTENTION" title="An incorrect answer is a useful discovery.">Try recalling the answer before choosing an option. Read the explanation, then connect it to something you have built.</StudyNote>
    {!!history.length && <>
      <div className={styles.sectionHead}><div><h2>Recent scores</h2><p>Saved in this browser.</p></div></div>
      <div className={styles.grid}>{history.slice(0, 6).map((attempt, index) => <div key={`${attempt.date}-${index}`} className={`${styles.card} ${styles.statCard}`}><span className={styles.eyebrow}>{trackById(attempt.trackId)?.name ?? "Quiz"}</span><strong>{attempt.score}<small style={{ fontSize: 16, color: "var(--faint)" }}>/{attempt.total}</small></strong><span style={{ color: "var(--muted)", fontSize: 13 }}>{attempt.topic || "General"} · {attempt.date}</span></div>)}</div>
    </>}
  </div>;
}
