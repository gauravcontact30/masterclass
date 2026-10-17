"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  CircleHelp,
  Copy,
  Flame,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Split,
  Target,
  Timer,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { type ContentSource, type QuizQuestion } from "@/lib/pro-learn/types";
import { PRO_LEVELS, PRO_TRACKS, trackById } from "@/lib/pro-learn/tracks";
import { ProHero, readList, Select, SourceBadge, TrackSelect, useProLevel, useProTrack, writeList } from "./pro-learn-shared";
import baseStyles from "./pro-learn.module.css";
import styles from "./pro-quiz.module.css";
import { BrandOrGlyph } from "./topic-media";
import { LearningPath, StatStrip, StudyNote } from "./learning-studio";
import { FlashcardDeck, type StudyCard } from "./study-cards";
import { TechnologySections } from "./technology-sections";

const HISTORY_KEY = "masterclass:quiz-history";
const SOUND_KEY = "masterclass:quiz-sound";
const COUNTS = ["3", "5", "10", "15", "20"] as const;
const letter = (index: number) => String.fromCharCode(65 + index);

type Attempt = { trackId: string; topic: string; score: number; total: number; date: string; streak?: number; xp?: number };
type QuizMode = "practice" | "timed";

type Session = {
  questions: QuizQuestion[];
  source: ContentSource;
  trackId: string;
  topic: string;
  level: string;
  index: number;
  picked: number | null;
  score: number;
  answers: number[];
  mode: QuizMode;
  streak: number;
  bestStreak: number;
  xp: number;
  flagged: number[];
  eliminated: number[];
  used5050: boolean;
  showingHint: boolean;
  timeRemaining: number;
  totalDurationSeconds: number;
};

/* --------------------------------------------------------------------------
   Audio Synthesizer (Pure Web Audio API, Zero External Assets)
   -------------------------------------------------------------------------- */
function playSound(type: "correct" | "wrong" | "finish" | "tick" | "lifeline", enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    if (type === "correct") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(174.61, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "finish") {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.07, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.4);
      });
    } else if (type === "lifeline") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "tick") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Ignore audio context issues in headless/restricted environments
  }
}

/* --------------------------------------------------------------------------
   Confetti Explosion (Pure Canvas, 0 External Dependencies)
   -------------------------------------------------------------------------- */
function fireConfetti(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; tilt: number; tiltAngle: number; tiltAngleInc: number }[] = [];
  const colors = ["#b5573a", "#5c7a3f", "#8a6512", "#2a5f82", "#e3b3a6", "#d7e3c0", "#ffe36e"];
  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 220,
      y: canvas.height * 0.45 + (Math.random() - 0.5) * 120,
      vx: (Math.random() - 0.5) * 18,
      vy: Math.random() * -14 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleInc: Math.random() * 0.07 + 0.05,
    });
  }
  let frame = 0;
  const anim = () => {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38;
      p.vx *= 0.985;
      p.tiltAngle += p.tiltAngleInc;
      p.tilt = Math.sin(p.tiltAngle) * 14;
      if (p.y < canvas.height + 20) alive = true;
      ctx.beginPath();
      ctx.lineWidth = p.size;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.size / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.size / 2);
      ctx.stroke();
    }
    if (alive && frame < 180) {
      requestAnimationFrame(anim);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  requestAnimationFrame(anim);
}

/* --------------------------------------------------------------------------
   Formatted Technical Code / Inline Renderer
   -------------------------------------------------------------------------- */
function FormattedCodeText({ text }: { text: string }) {
  if (!text) return null;
  if (!text.includes("`")) return <>{text}</>;
  if (text.includes("```")) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0]?.trim() ?? "";
          const hasLang = /^[a-z0-9_-]+$/i.test(firstLine);
          const codeBody = hasLang ? lines.slice(1).join("\n") : lines.join("\n");
          return <pre key={i} className={styles.codeBlock}><code>{codeBody}</code></pre>;
        }
        return <FormattedCodeText key={i} text={part} />;
      })}
    </>;
  }
  const segments = text.split(/(`[^`]+`)/g);
  return <>
    {segments.map((seg, i) => {
      if (seg.startsWith("`") && seg.endsWith("`")) {
        return <code key={i} className={styles.inlineCode}>{seg.slice(1, -1)}</code>;
      }
      return <span key={i}>{seg}</span>;
    })}
  </>;
}

/* --------------------------------------------------------------------------
   Main ProQuiz Component
   -------------------------------------------------------------------------- */
export function ProQuiz({ aiReady, libraryTracks }: { aiReady: boolean; libraryTracks: string[] }) {
  const params = useSearchParams();
  const [track, setTrack] = useProTrack(params.get("track"));
  const [level, setLevel] = useProLevel();
  const [count, setCount] = useState<typeof COUNTS[number]>("5");
  const [topic, setTopic] = useState(params.get("topic") ?? "");
  const [quizMode, setQuizMode] = useState<QuizMode>("practice");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(SOUND_KEY);
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });
  const [status, setStatus] = useState<{ state: "idle" | "loading" | "error"; message?: string }>({ state: "idle" });
  const [session, setSession] = useState<Session | null>(null);
  const [finished, setFinished] = useState(false);
  const [history, setHistory] = useState<Attempt[]>(() => {
    if (typeof window === "undefined") return [];
    return readList<Attempt>(HISTORY_KEY).filter(attempt => trackById(attempt.trackId));
  });
  const [reviewFilter, setReviewFilter] = useState<"all" | "missed" | "flagged">("all");
  const [copiedSummary, setCopiedSummary] = useState(false);

  const revealRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const tracks = aiReady ? PRO_TRACKS : PRO_TRACKS.filter(item => libraryTracks.includes(item.id));
  const selected = tracks.some(item => item.id === track.id) ? track : tracks[0] ?? track;

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem(SOUND_KEY, String(next)); } catch {}
      return next;
    });
  };

  // Start a new quiz session
  async function start(
    trackId = selected.id,
    total = Number(count),
    quizLevel: string = level,
    quizTopic = topic.trim(),
    mode: QuizMode = quizMode,
    customQuestions?: QuizQuestion[]
  ) {
    setStatus({ state: "loading" });
    setFinished(false);
    try {
      let questions: QuizQuestion[] = [];
      let source: ContentSource = "ai";

      if (customQuestions?.length) {
        questions = customQuestions;
        source = "library";
      } else {
        const response = await fetch("/api/pro-learn/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackId, count: total, level: quizLevel, topic: quizTopic }),
        });
        const data = await response.json() as { questions?: QuizQuestion[]; source?: ContentSource; error?: string };
        if (!response.ok || !data.questions?.length) {
          throw new Error(
            data.error === "ai_unavailable"
              ? "Quizzes for this technology need AI generation, which is not available right now. Choose a technology with a question bank."
              : data.error === "rate_limited"
              ? "You are generating quizzes quickly. Please wait a minute and try again."
              : "The quiz could not be prepared. Please try again."
          );
        }
        questions = data.questions;
        source = data.source ?? "ai";
      }

      setSession({
        questions,
        source,
        trackId,
        topic: quizTopic,
        level: quizLevel,
        index: 0,
        picked: null,
        score: 0,
        answers: [],
        mode,
        streak: 0,
        bestStreak: 0,
        xp: 0,
        flagged: [],
        eliminated: [],
        used5050: false,
        showingHint: false,
        timeRemaining: mode === "timed" ? 35 : 0,
        totalDurationSeconds: 0,
      });

      setStatus({ state: "idle" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      playSound("tick", soundEnabled);
    } catch (error) {
      setStatus({ state: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  // Answer pick handler
  const pick = useCallback((option: number) => {
    if (!session || session.picked !== null) return;
    const isCorrect = session.questions[session.index].answer === option;
    const newStreak = isCorrect ? session.streak + 1 : 0;
    const bestStreak = Math.max(session.bestStreak, newStreak);
    const addedXp = isCorrect ? 100 + (newStreak > 1 ? newStreak * 25 : 0) : 0;

    playSound(isCorrect ? "correct" : "wrong", soundEnabled);

    setSession({
      ...session,
      picked: option,
      score: session.score + (isCorrect ? 1 : 0),
      answers: [...session.answers, option],
      streak: newStreak,
      bestStreak,
      xp: session.xp + addedXp,
    });

    requestAnimationFrame(() => revealRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }, [session, soundEnabled]);

  // Next question or complete quiz
  const next = useCallback(() => {
    if (!session) return;
    if (session.index < session.questions.length - 1) {
      setSession({
        ...session,
        index: session.index + 1,
        picked: null,
        eliminated: [],
        showingHint: false,
        timeRemaining: session.mode === "timed" ? 35 : 0,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      playSound("tick", soundEnabled);
      return;
    }

    // Quiz completed
    const attempt: Attempt = {
      trackId: session.trackId,
      topic: session.topic,
      score: session.score,
      total: session.questions.length,
      date: new Date().toISOString().slice(0, 10),
      streak: session.bestStreak,
      xp: session.xp,
    };
    const updated = [attempt, ...history];
    setHistory(updated);
    writeList(HISTORY_KEY, updated, 30);
    setFinished(true);
    playSound("finish", soundEnabled);

    // Fire celebratory confetti if good score
    if (session.score / session.questions.length >= 0.75) {
      setTimeout(() => fireConfetti(canvasRef.current), 150);
    }
  }, [session, history, soundEnabled]);

  // Lifeline: 50:50 (eliminate 2 wrong choices)
  const use5050 = () => {
    if (!session || session.picked !== null || session.used5050) return;
    const question = session.questions[session.index];
    const wrongIndices = [0, 1, 2, 3].filter(idx => idx !== question.answer);
    // Shuffle and pick 2
    const eliminated = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setSession({ ...session, eliminated, used5050: true });
    playSound("lifeline", soundEnabled);
    toast.info("50:50 Lifeline: Two incorrect options eliminated!");
  };

  // Lifeline: Hint
  const toggleHint = useCallback(() => {
    setSession(prev => prev ? { ...prev, showingHint: !prev.showingHint } : null);
    playSound("tick", soundEnabled);
  }, [soundEnabled]);

  // Flag Question for review
  const toggleFlag = useCallback((qIndex: number) => {
    setSession(prev => {
      if (!prev) return null;
      const flagged = prev.flagged.includes(qIndex)
        ? prev.flagged.filter(item => item !== qIndex)
        : [...prev.flagged, qIndex];
      return { ...prev, flagged };
    });
    playSound("tick", soundEnabled);
  }, [soundEnabled]);

  // Timed exam countdown effect
  useEffect(() => {
    if (!session || finished || session.mode !== "timed" || session.picked !== null) return;
    timerRef.current = setInterval(() => {
      setSession(prev => {
        if (!prev || prev.picked !== null) return prev;
        if (prev.timeRemaining <= 1) {
          // Time expired for this question
          playSound("wrong", soundEnabled);
          return {
            ...prev,
            picked: -1, // Timed out
            answers: [...prev.answers, -1],
            streak: 0,
            timeRemaining: 0,
          };
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
          totalDurationSeconds: prev.totalDurationSeconds + 1,
        };
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, finished, soundEnabled]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!session || finished) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      if (session.picked === null) {
        if (key === "A" || key === "1") pick(0);
        else if (key === "B" || key === "2") pick(1);
        else if (key === "C" || key === "3") pick(2);
        else if (key === "D" || key === "4") pick(3);
        else if (key === "H") toggleHint();
        else if (key === "F") toggleFlag(session.index);
      } else {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          next();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, finished, pick, next, toggleHint, toggleFlag]);

  // Copy shareable score summary
  const copyScoreSummary = () => {
    if (!session) return;
    const percent = Math.round((session.score / session.questions.length) * 100);
    const sessionTrack = trackById(session.trackId) ?? selected;
    const stars = percent === 100 ? "⭐⭐⭐⭐⭐" : percent >= 80 ? "⭐⭐⭐⭐" : percent >= 60 ? "⭐⭐⭐" : "⭐⭐";
    const text = `🏆 MasterClass Quiz: ${sessionTrack.name}\n${stars} Score: ${session.score}/${session.questions.length} (${percent}%)\n🔥 Best Streak: ${session.bestStreak}\n⭐ XP Earned: +${session.xp}\nLevel: ${session.level} ${session.topic ? `· Topic: ${session.topic}` : ""}\nhttps://masterclass.dev/dashboard/quiz`;

    void navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    toast.success("Score card copied to clipboard!");
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Clear past quiz attempts
  const clearHistory = () => {
    if (!window.confirm("Clear all your local quiz history?")) return;
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
    toast.info("Quiz history cleared.");
  };

  /* ========================================================================
     VIEW 1: QUIZ FINISHED / RESULTS SUMMARY
     ======================================================================== */
  if (session && finished) {
    const sessionTrack = trackById(session.trackId) ?? selected;
    const percent = Math.round((session.score / session.questions.length) * 100);
    const missed = session.questions.filter((question, index) => session.answers[index] !== question.answer);
    const review = missed.length ? missed : session.questions;

    // Build flashcards for spaced repetition (strictly adhering to existing test assertions)
    const cards: StudyCard[] = review.map((question, index) => {
      const position = session.questions.indexOf(question);
      const picked = session.answers[position];
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

    const circumference = 2 * Math.PI * 80;
    const strokeOffset = circumference - (percent / 100) * circumference;

    const filteredQuestions = session.questions.filter((q, idx) => {
      if (reviewFilter === "missed") return session.answers[idx] !== q.answer;
      if (reviewFilter === "flagged") return session.flagged.includes(idx);
      return true;
    });

    return (
      <div className={styles.root}>
        <canvas ref={canvasRef} className={styles.confettiCanvas} aria-hidden="true" />

        <ProHero
          eyebrow="Quiz complete"
          title={`${sessionTrack.name} quiz`}
          icon={<BrandOrGlyph label={sessionTrack.name} glyph={sessionTrack.icon} size={20} />}
        >
          {session.topic ? `Focused on ${session.topic}. ` : ""}
          {missed.length
            ? "The questions you missed are the fastest place to improve — review them below."
            : "A clean run. Review the set once more to lock it in."}
        </ProHero>

        {/* Score Showcase Section (maintains aria-label="Your score" for test compatibility) */}
        <section className={styles.scoreShowcase} aria-label="Your score">
          <div className={styles.scoreHero}>
            {/* Circular Progress Gauge */}
            <div className={styles.gaugeContainer} aria-hidden="true">
              <svg className={styles.gaugeSvg} viewBox="0 0 200 200">
                <circle className={styles.gaugeBg} cx="100" cy="100" r="80" />
                <circle
                  className={styles.gaugeFill}
                  cx="100"
                  cy="100"
                  r="80"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                />
              </svg>
              <div className={styles.gaugeContent}>
                <div className={styles.gaugeScoreNum}>
                  {session.score}
                  <span className={styles.gaugeTotalNum}>/{session.questions.length}</span>
                </div>
                <div className={styles.gaugePercent}>{percent}%</div>
              </div>
            </div>

            {/* Score Summary & Verdict */}
            <div className={styles.scoreSummary}>
              <span className={styles.scoreVerdictBadge}>
                {percent >= 80 ? <Trophy size={14} /> : percent >= 60 ? <Sparkles size={14} /> : <Target size={14} />}
                {percent === 100
                  ? "Flawless Mastery"
                  : percent >= 80
                  ? "Advanced Proficiency"
                  : percent >= 60
                  ? "Solid Foundation"
                  : "Needs Reinforcement"}
              </span>
              <h3 className={styles.scoreVerdictTitle}>
                {percent >= 80
                  ? "Excellent — you have this well covered."
                  : percent >= 50
                  ? "Solid. Review the explanations to close the gaps."
                  : "Worth another pass — read the explanations and retry."}
              </h3>
              <p className={styles.scoreVerdictDesc}>
                {percent >= 80
                  ? `Outstanding execution in ${sessionTrack.name}. Keep your streak sharp with regular spaced retrieval.`
                  : `You got ${session.score} out of ${session.questions.length} correct. Spaced repetition flashcards are ready below.`}
              </p>

              {/* Action Buttons */}
              <div className={styles.scoreActionRow}>
                <button
                  className={`${styles.btn} ${styles.primary}`}
                  onClick={() => void start(session.trackId, session.questions.length, session.level, session.topic, session.mode)}
                >
                  <RotateCcw size={15} />
                  Retry
                </button>

                {missed.length > 0 && (
                  <button
                    className={`${styles.btn} ${styles.outline}`}
                    onClick={() => void start(session.trackId, missed.length, session.level, session.topic, "practice", missed)}
                  >
                    <Target size={15} />
                    Retake Missed Only ({missed.length})
                  </button>
                )}

                <button className={`${styles.btn} ${styles.outline}`} onClick={copyScoreSummary}>
                  {copiedSummary ? <Check size={15} color="#4d7335" /> : <Copy size={15} />}
                  {copiedSummary ? "Copied!" : "Share score"}
                </button>

                <button
                  className={`${styles.btn} ${styles.outline}`}
                  onClick={() => {
                    setSession(null);
                    setFinished(false);
                  }}
                >
                  New quiz
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className={styles.scoreMetricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Score</span>
              <strong className={styles.metricValue}>{session.score} / {session.questions.length}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Accuracy</span>
              <strong className={styles.metricValue}>{percent}%</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Best Streak</span>
              <strong className={styles.metricValue} style={{ color: "var(--cc-clay)" }}>
                {session.bestStreak} 🔥
              </strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>XP Earned</span>
              <strong className={styles.metricValue} style={{ color: "var(--cc-amber)" }}>
                +{session.xp} ⭐
              </strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Flagged Qs</span>
              <strong className={styles.metricValue}>{session.flagged.length} 🔖</strong>
            </div>
          </div>

          {/* Answer Breakdown Trail (strict preservation for tests) */}
          <div style={{ display: "grid", gap: 10 }}>
            <span className={styles.metricLabel}>Question Breakdown</span>
            <ol className={styles.scoreTrail} aria-label="Answer breakdown">
              {session.questions.map((question, index) => (
                <li key={index} data-correct={session.answers[index] === question.answer}>
                  <span>{index + 1}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Detailed Question Review List */}
        <section className={styles.questionCard} aria-label="Detailed Question Review">
          <div className={styles.reviewFilterRow}>
            <div>
              <h3 style={{ fontFamily: "var(--cc-serif)", fontSize: 20 }}>Question by Question Review</h3>
              <p style={{ color: "var(--cc-muted)", fontSize: 13.5 }}>Inspect your answer, mistakes, and in-depth explanations.</p>
            </div>
            <div className={styles.reviewTabs} role="tablist" aria-label="Filter review">
              <button
                className={styles.reviewTabBtn}
                data-active={reviewFilter === "all"}
                onClick={() => setReviewFilter("all")}
              >
                All ({session.questions.length})
              </button>
              <button
                className={styles.reviewTabBtn}
                data-active={reviewFilter === "missed"}
                onClick={() => setReviewFilter("missed")}
              >
                Missed ({missed.length})
              </button>
              <button
                className={styles.reviewTabBtn}
                data-active={reviewFilter === "flagged"}
                onClick={() => setReviewFilter("flagged")}
              >
                Flagged ({session.flagged.length})
              </button>
            </div>
          </div>

          <div className={styles.reviewList}>
            {filteredQuestions.map((q) => {
              const qIdx = session.questions.indexOf(q);
              const userPick = session.answers[qIdx];
              const isCorrect = userPick === q.answer;
              return (
                <article key={qIdx} className={styles.reviewItemCard}>
                  <div className={styles.reviewItemTop}>
                    <span style={{ fontWeight: 700, color: isCorrect ? "var(--cc-olive)" : "var(--cc-rust)" }}>
                      {isCorrect ? "✓ Question " : "✗ Question "} {qIdx + 1}
                    </span>
                    {session.flagged.includes(qIdx) && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--cc-amber)", fontSize: 12 }}>
                        <Bookmark size={12} fill="currentColor" /> Flagged for review
                      </span>
                    )}
                  </div>
                  <h4 className={styles.reviewItemQ}><FormattedCodeText text={q.q} /></h4>
                  <div className={styles.reviewAnswerDiff}>
                    <div>
                      <span style={{ color: "var(--cc-muted)", fontSize: 12 }}>YOUR ANSWER: </span>
                      <b style={{ color: isCorrect ? "var(--cc-olive)" : "var(--cc-rust)" }}>
                        {userPick === -1 ? "Timed Out" : `${letter(userPick)}. ${q.options[userPick] ?? "None"}`}
                      </b>
                    </div>
                    {!isCorrect && (
                      <div>
                        <span style={{ color: "var(--cc-muted)", fontSize: 12 }}>CORRECT ANSWER: </span>
                        <b style={{ color: "var(--cc-olive)" }}>
                          {letter(q.answer)}. {q.options[q.answer]}
                        </b>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 13.5, color: "var(--cc-ink-muted)", lineHeight: 1.6 }}>{q.explain}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Spaced Repetition Flashcards Deck (strictly preserved for tests) */}
        <FlashcardDeck
          key={`review-${session.index}-${review.length}`}
          cards={cards}
          accent={missed.length ? "clay" : "olive"}
          label="Quiz review flashcards"
          eyebrow={missed.length ? "Close the gap" : "Lock it in"}
          title={missed.length ? "Review what you missed." : "One more pass."}
          description={`${review.length} card${review.length === 1 ? "" : "s"} from this quiz. Re-answer each one from memory, then turn it over to compare with the explanation.`}
          icon={<Target size={13} />}
          frontLabel="QUIZ QUESTION"
          backLabel="CORRECT ANSWER"
          revealLabel="Reveal the answer"
          againLabel="Review again"
          knownLabel="I have it now"
          countLabel={(known, total) => `${known} of ${total} re-answered from memory`}
        />
      </div>
    );
  }

  /* ========================================================================
     VIEW 2: ACTIVE QUIZ IN PROGRESS
     ======================================================================== */
  if (session) {
    const question = session.questions[session.index];
    const sessionTrack = trackById(session.trackId) ?? selected;
    const revealed = session.picked !== null;
    const isCorrect = session.picked === question.answer;
    const last = session.index === session.questions.length - 1;
    const isFlagged = session.flagged.includes(session.index);

    return (
      <div className={styles.root}>
        {/* Sticky Active Quiz HUD */}
        <header className={styles.quizHud}>
          <div className={styles.hudTop}>
            <div className={styles.hudTrackInfo}>
              <span className={styles.hudTrackBadge}>
                <BrandOrGlyph label={sessionTrack.name} glyph={sessionTrack.icon} size={16} />
                <b>{sessionTrack.name}</b>
              </span>
              <span style={{ fontSize: 13, color: "var(--cc-muted)" }}>
                Question {session.index + 1} of {session.questions.length} · {session.level}
                {session.topic ? ` · ${session.topic}` : ""}
              </span>
            </div>

            <div className={styles.hudStats}>
              {session.streak > 1 && (
                <span className={styles.streakPill}>
                  <Flame size={14} /> {session.streak} Streak!
                </span>
              )}
              {session.xp > 0 && (
                <span className={styles.xpPill}>
                  <Zap size={14} /> +{session.xp} XP
                </span>
              )}
              {session.mode === "timed" && (
                <span className={styles.timerPill} data-urgent={session.timeRemaining <= 10}>
                  <Timer size={14} /> {session.timeRemaining}s
                </span>
              )}

              <div className={styles.hudTools}>
                <button
                  type="button"
                  className={styles.hudIconBtn}
                  title={soundEnabled ? "Mute audio" : "Enable sound"}
                  aria-label={soundEnabled ? "Mute audio" : "Enable sound"}
                  onClick={toggleSound}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <SourceBadge source={session.source} />
                <button
                  className={`${styles.btn} ${styles.outline} ${styles.small}`}
                  onClick={() => {
                    if (window.confirm("Exit this quiz? Progress will be lost.")) {
                      setSession(null);
                    }
                  }}
                >
                  Exit
                </button>
              </div>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={session.questions.length}
            aria-valuenow={session.index}
          >
            <i
              className={styles.progressTrack}
              style={{ width: `${Math.round(((session.index + (revealed ? 1 : 0)) / session.questions.length) * 100)}%` }}
            />
          </div>

          {/* Mini-map Question Navigator */}
          <nav className={styles.miniMap} aria-label="Question navigator">
            {session.questions.map((_, idx) => {
              const state =
                session.index === idx
                  ? "active"
                  : session.answers[idx] !== undefined
                  ? session.answers[idx] === session.questions[idx].answer
                    ? "correct"
                    : "wrong"
                  : "pending";
              return (
                <button
                  key={idx}
                  type="button"
                  className={styles.miniMapBubble}
                  data-state={state}
                  data-flagged={session.flagged.includes(idx)}
                  title={`Question ${idx + 1}`}
                  onClick={() => {
                    if (revealed || session.answers[idx] !== undefined) {
                      setSession({ ...session, index: idx, picked: session.answers[idx] ?? null });
                    }
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Current Question Card */}
        <section className={styles.questionCard} aria-labelledby="quiz-question">
          <div className={styles.questionMetaRow}>
            <span className={styles.questionEyebrow}>
              Question {session.index + 1} / {session.questions.length}
            </span>

            {/* In-quiz Lifelines & Flag */}
            <div className={styles.lifelineGroup}>
              {!revealed && (
                <>
                  <button
                    type="button"
                    className={styles.lifelineBtn}
                    disabled={session.used5050}
                    title="Eliminate two wrong choices"
                    onClick={use5050}
                  >
                    <Split size={14} /> 50:50 Lifeline
                  </button>

                  <button
                    type="button"
                    className={styles.lifelineBtn}
                    data-active={session.showingHint}
                    title="Toggle concept clue"
                    onClick={toggleHint}
                  >
                    <Lightbulb size={14} /> {session.showingHint ? "Hide Hint" : "Need a Hint?"}
                  </button>
                </>
              )}

              <button
                type="button"
                className={styles.lifelineBtn}
                data-active={isFlagged}
                title={isFlagged ? "Unflag question" : "Flag question for review"}
                onClick={() => toggleFlag(session.index)}
              >
                {isFlagged ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isFlagged ? "Flagged" : "Flag"}
              </button>
            </div>
          </div>

          {/* Question Title (Heading strictly preserving question.q for tests) */}
          <h3 id="quiz-question" className={styles.questionHeading}>
            <FormattedCodeText text={question.q} />
          </h3>

          {/* Hint Callout */}
          {session.showingHint && (
            <div className={styles.hintBanner} role="note">
              <Lightbulb size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Conceptual Clue:</strong>
                <p style={{ marginTop: 4 }}>
                  Recall the underlying execution model of {sessionTrack.name}. Think about how state mutations, runtime cycles, or API boundaries behave in this context.
                </p>
              </div>
            </div>
          )}

          {/* Options Group */}
          <div className={styles.optionsGroup} role="group" aria-label="Answer options">
            {question.options.map((option, index) => {
              const state = revealed
                ? index === question.answer
                  ? "correct"
                  : index === session.picked
                  ? "wrong"
                  : undefined
                : undefined;
              const isEliminated = session.eliminated.includes(index);

              return (
                <button
                  key={option}
                  className={styles.optionButton}
                  data-state={state}
                  data-eliminated={isEliminated}
                  disabled={revealed || isEliminated}
                  aria-pressed={session.picked === index}
                  onClick={() => pick(index)}
                >
                  <span className={styles.optionMarker}>
                    {state === "correct" ? "✓" : state === "wrong" ? "✗" : letter(index)}
                  </span>
                  <span style={{ flex: 1 }}><FormattedCodeText text={option} /></span>
                  <span className={styles.shortcutBadge}>[{letter(index)}]</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Revealed Answer & Explanation Panel */}
        {revealed && (
          <div ref={revealRef}>
            <section
              className={styles.answerCard}
              data-correct={isCorrect}
              role="status"
              aria-label="Answer explanation"
            >
              <div className={styles.answerHead}>
                <span className={styles.verdictBadge}>
                  {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  {isCorrect ? "✓ Correct" : "✗ Not quite"}
                </span>
                <span className={styles.correctAnswerCallout}>
                  Correct answer — <b>{letter(question.answer)}. {question.options[question.answer]}</b>
                </span>
              </div>
              <p className={styles.explanationText}><FormattedCodeText text={question.explain} /></p>
            </section>

            {/* Deep-dive Vocab Terms */}
            {!!question.vocab.length && (
              <div className={styles.vocabSection}>
                <h4 style={{ fontFamily: "var(--cc-serif)", fontSize: 19 }}>
                  Words to know in this context
                </h4>
                <div className={styles.vocabGrid}>
                  {question.vocab.map(word => (
                    <article key={word.word} className={styles.vocabCard}>
                      <h4>{word.word}</h4>
                      {word.sentence && (
                        <p style={{ fontStyle: "italic", color: "var(--cc-muted)" }}>“{word.sentence}”</p>
                      )}
                      {word.meaning && (
                        <div className={styles.vocabRow}>
                          <span className={styles.vocabLabel}>Meaning</span>
                          <span>{word.meaning}</span>
                        </div>
                      )}
                      {!!word.synonyms.length && (
                        <div className={styles.vocabRow}>
                          <span className={styles.vocabLabel}>Synonyms</span>
                          <div>
                            {word.synonyms.map(item => (
                              <span key={item} className={styles.tagPill}>{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {!!word.antonyms.length && (
                        <div className={styles.vocabRow}>
                          <span className={styles.vocabLabel}>Antonyms</span>
                          <div>
                            {word.antonyms.map(item => (
                              <span key={item} className={styles.tagPill} data-kind="ant">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Next Action Button */}
            <div className={styles.quizActionStrip}>
              <span style={{ fontSize: 13, color: "var(--cc-muted)" }}>
                Tip: Press <kbd style={{ padding: "2px 6px", background: "var(--cc-ground)", border: "1px solid var(--cc-line)", borderRadius: 4 }}>Enter ↵</kbd> on your keyboard to proceed
              </span>
              <button className={`${styles.btn} ${styles.primary}`} onClick={next}>
                {last ? "See results" : "Next question"}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ========================================================================
     VIEW 3: QUIZ HUB / SETUP SCREEN
     ======================================================================== */
  const pastAverage = history.length
    ? Math.round(history.reduce((sum, a) => sum + a.score / a.total, 0) / history.length * 100)
    : 0;

  return (
    <div className={styles.root}>
      <LearningPath active="quiz" />

      {/* Hero Header */}
      <ProHero
        eyebrow="Professional learning / Quiz"
        title="Test what you know"
        icon={<CircleHelp size={28} color="#b5573a" />}
      >
        Pick a technology, session length, and difficulty. Answer questions with instant explanations, code breakdowns, and technical vocabulary{aiReady ? " powered by AI." : "."}
      </ProHero>

      {/* Performance Stats Strip */}
      {!!history.length && (
        <StatStrip
          items={[
            { value: `${history.length}`, label: "Quizzes taken" },
            { value: `${pastAverage}`, unit: "%", label: "Average score" },
            { value: `${history.reduce((sum, a) => sum + a.total, 0)}`, label: "Questions answered" },
            { value: `${new Set(history.map(a => a.trackId)).size}`, label: "Technologies practised" },
          ]}
        />
      )}

      {/* Practice Rhythm Selector (Maintains strict test button names) */}
      <div className={styles.sectionHeader} style={{ marginTop: history.length ? 24 : 0 }}>
        <div className={styles.sectionHeaderLeft}>
          <span className={styles.sectionEyebrow}><Sparkles size={13} /> PRACTICE RHYTHM</span>
          <h2 className={styles.sectionTitle}>Find your practice rhythm</h2>
          <p className={styles.sectionSubtitle}>Choose a session length tailored to your daily schedule and retention goals.</p>
        </div>
        <span className={styles.sectionTag}>No timer. Just progress.</span>
      </div>

      <div className={styles.modeGrid} role="group" aria-label="Practice mode">
        {[
          { count: "3", label: "Quick warm-up", title: "A little, every day", text: "Three high-yield questions to reconnect with core principles, strengthen active recall, and maintain steady daily momentum.", icon: "01", minutes: "≈ 2 min" },
          { count: "5", label: "Focused practice", title: "Find your knowledge gaps", text: "Five targeted questions paired with detailed architectural rationales that clarify subtle edge cases and misconceptions.", icon: "02", minutes: "≈ 5 min" },
          { count: "10", label: "Speed sprint", title: "Challenge your pace", text: "Ten consecutive problems designed to test rapid recognition, technical fluency, and cognitive agility under steady momentum.", icon: "03", minutes: "≈ 7 min" },
          { count: "15", label: "Deep dive", title: "Put yourself to the test", text: "Fifteen comprehensive questions spanning end-to-end framework concepts, lifecycle rules, and senior engineering tradeoffs.", icon: "04", minutes: "≈ 15 min" },
        ].map(mode => (
          <button
            key={mode.count}
            type="button"
            className={styles.modeCard}
            aria-pressed={count === mode.count}
            onClick={() => {
              setCount(mode.count as typeof COUNTS[number]);
              playSound("tick", soundEnabled);
            }}
          >
            <span className={styles.modeTop}>
              <span>{mode.label}</span>
              <span className={styles.modeIconBubble}>{mode.icon}</span>
            </span>
            <h3>{mode.title}</h3>
            <p>{mode.text}</p>
            <span className={styles.modeFoot}>
              {mode.count} questions
              <span className={styles.modeTime}>{mode.minutes}</span>
              <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>

      {/* Main Quiz Configuration Card */}
      <section className={styles.questionCard} aria-label="Quiz setup">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span className={styles.questionEyebrow}>CUSTOM SESSION BUILDER</span>
            <h2 style={{ fontFamily: "var(--cc-serif)", fontSize: 24, marginTop: 4 }}>Make this practice yours</h2>
            <p style={{ color: "var(--cc-muted)", fontSize: 13.5, marginTop: 4 }}>Configure your technology track, difficulty tier, session volume, and optional focus topic.</p>
          </div>

          {/* Mode Segmented Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className={baseStyles.seg} role="group" aria-label="Session style">
              <button
                type="button"
                aria-pressed={quizMode === "practice"}
                onClick={() => setQuizMode("practice")}
              >
                Zen Practice
              </button>
              <button
                type="button"
                aria-pressed={quizMode === "timed"}
                onClick={() => setQuizMode("timed")}
              >
                Timed Sprint ⚡
              </button>
            </div>

            <button
              type="button"
              className={styles.hudIconBtn}
              title={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
              aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
              onClick={toggleSound}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

        {/* Dropdowns Row (Preserves TrackSelect and Select with aria-label) */}
        <div className={baseStyles.setupRow}>
          <TrackSelect value={selected.id} tracks={tracks} onChange={setTrack} />
          <Select
            label="Questions"
            value={count}
            options={COUNTS}
            onChange={value => setCount(value as typeof COUNTS[number])}
          />
          <Select label="Difficulty" value={level} options={PRO_LEVELS} onChange={setLevel} />

          {aiReady && (
            <Label className={baseStyles.field}>
              <span>Focus topic (optional)</span>
              <Input
                className={baseStyles.input}
                value={topic}
                maxLength={160}
                onChange={event => setTopic(event.target.value)}
                placeholder={`e.g. ${selected.syllabus[0] ?? "core concepts"}`}
              />
            </Label>
          )}
        </div>

        {/* Quick Topic Chips from syllabus */}
        {selected.syllabus && selected.syllabus.length > 0 && (
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cc-muted)" }}>Quick topic shortcuts:</span>
            <div className={styles.topicPills}>
              {selected.syllabus.slice(0, 6).map(sub => (
                <button
                  key={sub}
                  type="button"
                  className={styles.topicPill}
                  onClick={() => setTopic(sub)}
                >
                  + {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start Button & Mode Info */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
          <button
            className={`${styles.btn} ${styles.primary}`}
            disabled={status.state === "loading" || !tracks.length}
            onClick={() => void start()}
          >
            {status.state === "loading" ? (
              <>
                <span className={baseStyles.spinner} /> Building your quiz…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Start quiz
              </>
            )}
          </button>

          {!aiReady && (
            <span className={baseStyles.sourceBadge}>Using the MasterClass question bank</span>
          )}

          <span style={{ fontSize: 13, color: "var(--cc-muted)" }}>
            {quizMode === "timed" ? "⏱️ 35 seconds per question challenge" : "🧘 Untimed practice with instant feedback"}
          </span>
        </div>

        {/* Error Notice */}
        {status.state === "error" && (
          <p className={baseStyles.notice} data-tone="error" role="alert" style={{ marginTop: 14 }}>
            {status.message}
          </p>
        )}
      </section>

      {/* Featured Quick Challenge Presets */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderLeft}>
          <span className={styles.sectionEyebrow}><Target size={13} /> CURATED DRILLS</span>
          <h2 className={styles.sectionTitle}>Featured quick challenges</h2>
          <p className={styles.sectionSubtitle}>Specialized question sets pre-calibrated for rigorous technical assessment.</p>
        </div>
      </div>

      <div className={styles.presetGrid}>
        {[
          { trackId: "react", title: "React 19 Hooks Mastery", desc: "Evaluate your practical grasp of useActionState, optimistic mutations, server transitions, and concurrent rendering safeguards.", count: "5", level: "Intermediate", topic: "Hooks & State" },
          { trackId: "typescript", title: "TypeScript Generics & Types", desc: "Test complex conditional types, distributive inference, mapped modifiers, template literals, and type narrowing semantics.", count: "5", level: "Advanced", topic: "Generics & Utilities" },
          { trackId: "nextjs", title: "Next.js App Router Sprint", desc: "Master server vs client boundaries, suspense streaming, layout compositions, route handlers, and static caching semantics.", count: "5", level: "Intermediate", topic: "App Router & SSR" },
          { trackId: "python", title: "Python Algorithmic Logic", desc: "Strengthen comprehension of generator pipelines, memory-efficient comprehensions, decorators, and data structure internals.", count: "5", level: "Intermediate", topic: "Data Structures & Logic" },
        ].filter(p => tracks.some(t => t.id === p.trackId)).map(preset => (
          <button
            key={preset.title}
            type="button"
            className={styles.presetCard}
            onClick={() => {
              setTrack(preset.trackId);
              setCount(preset.count as typeof COUNTS[number]);
              setLevel(preset.level);
              setTopic(preset.topic);
              void start(preset.trackId, Number(preset.count), preset.level, preset.topic);
            }}
          >
            <div className={styles.presetTop}>
              <span style={{ fontWeight: 700, color: "var(--cc-clay)" }}>{preset.level}</span>
              <span style={{ color: "var(--cc-faint)" }}>{preset.count} Qs</span>
            </div>
            <h4>{preset.title}</h4>
            <p>{preset.desc}</p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--cc-clay)", marginTop: "auto" }}>
              Launch challenge <ArrowRight size={13} />
            </span>
          </button>
        ))}
      </div>

      {/* Pick a Technology Browser */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderLeft}>
          <span className={styles.sectionEyebrow}><Sparkles size={13} /> TECHNOLOGY FAMILIES</span>
          <h2 className={styles.sectionTitle}>Pick a technology to practice</h2>
          <p className={styles.sectionSubtitle}>
            {aiReady
              ? "Every track can be quizzed with real-time question synthesis. Open a family below to begin."
              : "Only tracks with an authored question bank can be quizzed right now."}
          </p>
        </div>
        <span className={styles.sectionTag}>{tracks.length} available</span>
      </div>

      <TechnologySections idPrefix="quiz-track" tracks={tracks} selected={selected.id} onSelect={setTrack} />

      <StudyNote label="LEARN WITH INTENTION" title="An incorrect answer is a useful discovery.">
        Try recalling the answer before choosing an option. Read the explanation, then connect it to something you have built.
      </StudyNote>

      {/* Recent History Grid */}
      {!!history.length && (
        <section aria-label="Recent scores history">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <span className={styles.sectionEyebrow}><Trophy size={13} /> PERFORMANCE ARCHIVE</span>
              <h2 className={styles.sectionTitle}>Recent practice history</h2>
              <p className={styles.sectionSubtitle}>Saved locally in this browser. Review past accuracy, streak milestones, and session scores.</p>
            </div>
            <button
              type="button"
              className={`${styles.btn} ${styles.outline} ${styles.small}`}
              onClick={clearHistory}
            >
              <Trash2 size={13} /> Clear history
            </button>
          </div>

          <div className={baseStyles.grid} style={{ marginTop: 14 }}>
            {history.slice(0, 6).map((attempt, index) => {
              const attemptTrack = trackById(attempt.trackId);
              const attemptPercent = Math.round((attempt.score / attempt.total) * 100);
              return (
                <div key={`${attempt.date}-${index}`} className={styles.historyCardItem}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cc-clay)" }}>
                      {attemptTrack?.icon} {attemptTrack?.name ?? "Quiz"}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: attemptPercent >= 80 ? "var(--cc-olive-soft)" : "var(--cc-clay-soft)", color: attemptPercent >= 80 ? "var(--cc-olive-deep)" : "var(--cc-clay-deep)" }}>
                      {attemptPercent}%
                    </span>
                  </div>
                  <strong>
                    {attempt.score}
                    <small style={{ fontSize: 16, color: "var(--cc-faint)" }}>/{attempt.total}</small>
                  </strong>
                  <span style={{ color: "var(--cc-muted)", fontSize: 13 }}>
                    {attempt.topic || "Core concepts"} · {attempt.date}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
