"use client";
import { useCallback, useEffect, useState } from "react";
import { requestJson } from "./client";

type Answers = Record<string, number>;
/** Answers already loaded this visit, per scope, so paging or re-filtering a list does not fetch them again. */
const cache = new Map<string, Answers>();

/**
 * The signed-in exam account's saved answers for one question set (app/api/exams/answers), and a function that records
 * a new one. Recording updates the page at once and saves in the background; signed out, offline or before the table
 * exists, the answer still shows and simply is not kept.
 */
export function useExamAnswers(scope: string): [Answers, (item: string, choice: number, correct: boolean) => void, () => void] {
  const [state, setState] = useState<{ scope: string; answers: Answers }>(() => ({ scope, answers: cache.get(scope) ?? {} }));
  useEffect(() => {
    if (cache.has(scope)) return;
    let live = true;
    requestJson<{ answers: Answers }>(`/api/exams/answers?scope=${encodeURIComponent(scope)}`)
      .then(({ answers }) => { const merged = { ...answers, ...cache.get(scope) }; cache.set(scope, merged); if (live) setState({ scope, answers: merged }); })
      .catch(() => {});
    return () => { live = false; };
  }, [scope]);
  const answers = state.scope === scope ? state.answers : cache.get(scope) ?? {};
  const record = useCallback((item: string, choice: number, correct: boolean) => {
    const next = { ...(cache.get(scope) ?? {}), [item]: choice };
    cache.set(scope, next); setState({ scope, answers: next });
    void requestJson("/api/exams/answers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, item, choice, correct }) }).catch(() => {});
  }, [scope]);
  const reset = useCallback(() => {
    cache.set(scope, {}); setState({ scope, answers: {} });
    void requestJson("/api/exams/answers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope }) }).catch(() => {});
  }, [scope]);
  return [answers, record, reset];
}
