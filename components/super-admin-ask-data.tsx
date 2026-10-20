"use client";
import { useRef, useState, type FormEvent } from "react";
import { ArrowUp, Loader2, MessageSquareText } from "lucide-react";
import type { AdminAnswer } from "@/lib/admin-ask";
import styles from "./super-admin-ask-data.module.css";

const STARTERS = ["Which cities sent the most visitors?", "How many sign-ups per day, and which day was best?", "Which AI feature fails or falls back most?", "Where does our traffic come from?"];
const ERRORS: Record<string, string> = {
  ai_unavailable: "No AI provider is configured, so questions cannot be answered.",
  rate_limited: "Question limit reached for this hour. Try again later.",
  invalid_ai_response: "The model's answer could not be read. Ask again, or rephrase.",
};

/**
 * Super Admin "Ask your data": plain-language questions answered from this window's aggregate analytics
 * (/api/super-admin/ask). The model reads counts only, never personal data, and says when it cannot answer.
 */
export function SuperAdminAskData({ days }: Readonly<{ days: number }>) {
  const span = [1, 7, 30, 90].includes(days) ? days : 7;
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<AdminAnswer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);

  async function ask(value: string) {
    const text = value.trim(); if (text.length < 3 || busy) return;
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/super-admin/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, days: span }), signal: controller.signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "service_error");
      setAnswers(list => [body as AdminAnswer, ...list].slice(0, 5)); setQuestion("");
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "service_error"); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  const submit = (event: FormEvent) => { event.preventDefault(); void ask(question); };

  return <section className={styles.card} aria-labelledby="ask-data-title">
    <header className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><MessageSquareText size={18} /></span>
      <div><h2 id="ask-data-title">Ask your data</h2><p>Questions about the last {span} day{span === 1 ? "" : "s"}, answered by AI from aggregate counts only (no names, emails or IPs reach the model).</p></div>
    </header>
    <form className={styles.form} onSubmit={submit}>
      <label htmlFor="ask-data-q" className={styles.srOnly}>Your question</label>
      <input id="ask-data-q" value={question} onChange={e => setQuestion(e.target.value)} maxLength={400} placeholder="e.g. Which states signed up most this week?" />
      <button type="submit" disabled={busy || question.trim().length < 3} aria-label="Ask">{busy ? <Loader2 size={16} className={styles.spin} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}</button>
    </form>
    {answers.length === 0 && <ul className={styles.starters} aria-label="Example questions">{STARTERS.map(s => <li key={s}><button type="button" disabled={busy} onClick={() => void ask(s)}>{s}</button></li>)}</ul>}
    <div aria-live="polite">
      {error && <p className={styles.error}>{ERRORS[error] ?? "The question could not be answered. Try again."}</p>}
      {answers.map(answer => <article key={answer.generatedAt} className={styles.answer} data-answerable={answer.answerable}>
        <h3>{answer.question}</h3>
        <p>{answer.answer}</p>
        {answer.figures.length > 0 && <dl className={styles.figures}>{answer.figures.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>}
        {answer.followUps.length > 0 && <ul className={styles.starters} aria-label="Follow-up questions">{answer.followUps.map(f => <li key={f}><button type="button" disabled={busy} onClick={() => void ask(f)}>{f}</button></li>)}</ul>}
        <p className={styles.source}>Last {answer.days} day{answer.days === 1 ? "" : "s"} · {answer.model} · verify important numbers in the matching report.</p>
      </article>)}
    </div>
  </section>;
}
