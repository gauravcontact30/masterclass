"use client";
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2, RefreshCw, Target, X } from "lucide-react";
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

function Quiz({ questions, hi }: Readonly<{ questions: CoachQuestion[]; hi: boolean }>) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const score = questions.filter((q, i) => picked[i] === q.answer).length;
  const done = Object.keys(picked).length === questions.length;
  return <div className={styles.quiz}>
    <h3>{hi ? "5 मिनट का क्विज़" : "Five-minute check"}{done && <small>{hi ? `${score}/${questions.length} सही` : `${score}/${questions.length} correct`}</small>}</h3>
    <ol>
      {questions.map((q, i) => <li key={q.question}>
        <p className={styles.question}>{q.question}</p>
        <div className={styles.options} role="group" aria-label={q.question}>
          {q.options.map((option, o) => {
            const answered = i in picked; const right = o === q.answer; const chosen = picked[i] === o;
            return <button key={option} type="button" disabled={answered} data-state={answered ? (right ? "right" : chosen ? "wrong" : "idle") : "idle"} onClick={() => setPicked(p => ({ ...p, [i]: o }))}>
              {answered && right && <Check size={13} aria-hidden="true" />}{answered && chosen && !right && <X size={13} aria-hidden="true" />}{option}
            </button>;
          })}
        </div>
        {i in picked && <p className={styles.explain}>{q.explanation}</p>}
      </li>)}
    </ol>
  </div>;
}
