"use client";
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Trophy,
  X,
  XCircle
} from "lucide-react";
import type { Coach, CoachQuestion } from "@/lib/study-coach";
import type { LearningPath } from "@/lib/learning-path";
import { requestJson } from "@/lib/client";
import { useLanguage } from "./language-provider";
import { LearningPathView } from "./learning-path-view";
import home from "./landing-home.module.css";
import styles from "./dashboard-coach.module.css";

type CoachReply = { coach: Coach; starter: LearningPath | null; goal: string | null };
const KEY = "mc:coach:v1";
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

function cached(language: string): CoachReply | null {
  try { const raw = JSON.parse(sessionStorage.getItem(KEY) ?? "null"); return raw?.day === today() && raw.language === language ? raw.reply : null; } catch { return null; }
}

/**
 * "What next": three next steps and a short quiz from the learner's own lessons and progress (/api/study/coach),
 * plus the starter plan for the goal they gave at sign-up. Kept for the browser session, so the model is asked
 * about once per visit, not on every dashboard navigation.
 */
export function DashboardCoach() {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const id = useId();
  const [reply, setReply] = useState<CoachReply | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  // 0 on mount: the session's cached answer is used if there is one; each Refresh asks again.
  const [refreshes, setRefreshes] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const held = refreshes ? null : cached(language);
    (held ? Promise.resolve(held) : requestJson<CoachReply>("/api/study/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language }), signal: controller.signal }))
      .then(next => {
        if (controller.signal.aborted) return;
        setReply(next); setState("ready");
        if (!held) try { sessionStorage.setItem(KEY, JSON.stringify({ day: today(), language, reply: next })); } catch { /* storage unavailable */ }
      })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, [language, refreshes]);
  const refresh = () => { setState("loading"); setRefreshes(n => n + 1); };

  return <section className={styles.section} aria-labelledby={`${id}-title`}><div className={home.inner}>
    <header className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><Target size={18} /></span>
      <div>
        <h2 id={`${id}-title`}>{text("What next", "आगे क्या")}</h2>
        <p>{text("Your AI study coach reads your lessons and progress and picks today's steps.", "आपका AI कोच आपके पाठ और प्रगति देखकर आज के कदम चुनता है।")}</p>
      </div>
      <button type="button" onClick={refresh} disabled={state === "loading"} aria-label={text("Refresh suggestions", "सुझाव फिर से बनाएँ")}><RefreshCw size={15} aria-hidden="true" /></button>
    </header>
    <div aria-live="polite">
      {state === "loading" && <p className={styles.status}><Loader2 size={15} className={styles.spin} aria-hidden="true" />{text("Looking at your progress…", "आपकी प्रगति देखी जा रही है…")}</p>}
      {state === "error" && <p className={styles.status}>{text("Suggestions are unavailable right now. Try Refresh in a moment.", "सुझाव अभी उपलब्ध नहीं हैं। थोड़ी देर बाद फिर कोशिश करें।")}</p>}
      {state === "ready" && reply && <>
        <p className={styles.greeting}>{reply.coach.greeting}</p>
        <ol className={styles.steps}>
          {reply.coach.next.map((step, index) => <li key={step.title}>
            <span className={styles.number} aria-hidden="true">{index + 1}</span>
            <div><Link href={step.href} prefetch={false}>{step.title}<ArrowUpRight size={13} aria-hidden="true" /></Link><p>{step.why}</p></div>
          </li>)}
        </ol>
        {reply.coach.quiz.length > 0 && <Quiz questions={reply.coach.quiz} hi={hi} />}
        {reply.starter && <details className={styles.starter} open={reply.coach.next.length === 0}>
          <summary>{text(`Your starter plan: “${reply.goal}”`, `आपकी शुरुआती योजना: “${reply.goal}”`)}</summary>
          <LearningPathView path={reply.starter} hi={hi} signedIn />
        </details>}
        <p className={styles.source}>{reply.coach.source === "ai" ? text("Suggested by AI from your own lessons. Only titles and counts are used.", "AI द्वारा आपके पाठों से सुझाया गया। केवल शीर्षक और गिनती उपयोग होती है।") : text("Suggested from your progress (AI is unavailable right now).", "आपकी प्रगति से सुझाया गया (AI अभी उपलब्ध नहीं)।")}</p>
      </>}
    </div>
  </div></section>;
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

function Quiz({ questions, hi }: Readonly<{ questions: CoachQuestion[]; hi: boolean }>) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const answeredCount = Object.keys(picked).length;
  const score = questions.filter((q, i) => picked[i] === q.answer).length;
  const done = answeredCount === questions.length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className={styles.quiz}>
      {/* Quiz Header Bar */}
      <div className={styles.quizHeader}>
        <div className={styles.quizHeaderTitleGroup}>
          <div className={styles.quizIconBadge}>
            <Timer size={19} className={styles.quizTimerIcon} />
          </div>
          <div>
            <div className={styles.quizHeadingRow}>
              <h3 className={styles.quizTitle}>
                {hi ? "5 मिनट का क्विज़" : "Five-minute check"}
              </h3>
              <span className={styles.quizLiveBadge}>
                <Sparkles size={11} />
                <span>{hi ? "दैनिक माइक्रो-स्प्रिंट" : "Daily Micro-Sprint"}</span>
              </span>
            </div>
            <p className={styles.quizSubtitle}>
              {hi
                ? "आपके हालिया पाठों पर आधारित त्वरित अवधारणा परीक्षण।"
                : "Rapid retention check calibrated to your active study materials."}
            </p>
          </div>
        </div>

        {/* Sprint Score & Progress Tracker */}
        <div className={styles.quizTracker}>
          <div className={styles.quizTrackerText}>
            {done ? (
              <span className={styles.quizScorePillDone}>
                <Trophy size={13} />
                <span>
                  {hi
                    ? `${score}/${questions.length} सही (${Math.round((score / questions.length) * 100)}%)`
                    : `${score}/${questions.length} Correct (${Math.round((score / questions.length) * 100)}%)`}
                </span>
              </span>
            ) : (
              <span className={styles.quizScorePillActive}>
                <span>
                  {hi
                    ? `${answeredCount}/${questions.length} हल किए`
                    : `${answeredCount}/${questions.length} answered`}
                </span>
                <span className={styles.quizDot}>•</span>
                <span>~2m sprint</span>
              </span>
            )}
            {answeredCount > 0 && (
              <button
                type="button"
                onClick={() => setPicked({})}
                className={styles.quizResetBtn}
                title={hi ? "फिर से प्रयास करें" : "Reset sprint"}
                aria-label={hi ? "प्रश्नोत्तरी रीसेट करें" : "Reset sprint"}
              >
                <RotateCcw size={12} />
                <span>{hi ? "रीसेट" : "Reset"}</span>
              </button>
            )}
          </div>

          <div
            className={styles.quizProgressBarTrack}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles.quizProgressBarFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions Stack */}
      <div className={styles.quizQuestionsList}>
        {questions.map((q, i) => {
          const isAnswered = i in picked;
          const isRight = isAnswered && picked[i] === q.answer;

          return (
            <article key={q.question} className={styles.questionCard} data-answered={isAnswered || undefined}>
              {/* Question Card Header */}
              <div className={styles.questionCardHeader}>
                <span className={styles.questionIndexBadge}>
                  {hi ? `प्रश्न ${String(i + 1).padStart(2, "0")}` : `QUESTION ${String(i + 1).padStart(2, "0")}`}
                </span>
                {isAnswered && (
                  <span
                    className={
                      isRight
                        ? styles.questionResultBadgeRight
                        : styles.questionResultBadgeWrong
                    }
                  >
                    {isRight ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>{hi ? "सही उत्तर" : "Correct (+100)"}</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={12} />
                        <span>{hi ? "गलत उत्तर" : "Incorrect"}</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Question Statement */}
              <p className={styles.questionText}>{q.question}</p>

              {/* Option Choice Grid */}
              <div
                className={styles.optionsGrid}
                role="group"
                aria-label={q.question}
              >
                {q.options.map((option, o) => {
                  const letter = OPTION_LETTERS[o] ?? String.fromCharCode(65 + o);
                  const isChosen = picked[i] === o;
                  const isCorrectAnswer = o === q.answer;

                  let optionState: "idle" | "right" | "wrong" | "dimmed" = "idle";
                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      optionState = "right";
                    } else if (isChosen) {
                      optionState = "wrong";
                    } else {
                      optionState = "dimmed";
                    }
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isAnswered}
                      data-state={optionState}
                      className={styles.optionChoiceBtn}
                      onClick={() => setPicked(p => ({ ...p, [i]: o }))}
                    >
                      <span className={styles.optionLetterBadge}>{letter}</span>
                      <span className={styles.optionText}>{option}</span>
                      {isAnswered && isCorrectAnswer && (
                        <Check size={14} className={styles.optionCheckIcon} aria-hidden="true" />
                      )}
                      {isAnswered && isChosen && !isCorrectAnswer && (
                        <X size={14} className={styles.optionWrongIcon} aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Verified Takeaway Box */}
              {isAnswered && (
                <div className={styles.explainCard}>
                  <div className={styles.explainHeader}>
                    <Lightbulb size={14} className={styles.explainIcon} />
                    <span className={styles.explainTitle}>
                      {hi ? "अवधारणा सारांश" : "Concept Takeaway"}
                    </span>
                  </div>
                  <p className={styles.explainBody}>{q.explanation}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Completion Banner */}
      {done && (
        <div className={styles.quizCompletionBanner}>
          <div className={styles.completionLeft}>
            <div className={styles.completionTrophy}>
              <Trophy size={22} />
            </div>
            <div>
              <h4 className={styles.completionTitle}>
                {score === questions.length
                  ? hi
                    ? "शानदार! पूर्ण अंक"
                    : "Outstanding Retention!"
                  : hi
                    ? "चेक पूरा हुआ!"
                    : "Sprint Complete!"}
              </h4>
              <p className={styles.completionText}>
                {score === questions.length
                  ? hi
                    ? `आपने सभी ${questions.length} प्रश्नों के सही उत्तर दिए हैं। उत्कृष्ट अवधारणा समझ!`
                    : `You answered all ${questions.length} questions correctly. Excellent mastery over today's topics.`
                  : hi
                    ? `आपने ${score}/${questions.length} अंक प्राप्त किए। ऊपर दी गई व्याख्याओं से अपनी समझ मजबूत करें।`
                    : `You scored ${score}/${questions.length}. Review the key takeaways above to solidify the concepts.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPicked({})}
            className={styles.completionRetakeBtn}
          >
            <RotateCcw size={14} />
            <span>{hi ? "फिर से प्रयास करें" : "Retake Sprint"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
