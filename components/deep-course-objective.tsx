"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ObjectiveQuestion } from "@/lib/deep-courses/types";
import styles from "./deep-course.module.css";

const LETTERS = ["A", "B", "C", "D"];

/** One MCQ: pick an option to check it; the explanation appears once an answer is chosen. */
export function DeepCourseObjective({ question, number }: { question: ObjectiveQuestion; number: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return <li className={styles.mcq}>
    <p className={styles.mcqQ}><span>Q{number}.</span> {question.q}</p>
    <div className={styles.mcqOptions} role="group" aria-label={`Question ${number} options`}>
      {question.options.map((option, index) => {
        const state = !answered ? undefined : index === question.answer ? "right" : index === picked ? "wrong" : undefined;
        return <button key={option} type="button" className={`${styles.mcqOption} ${state === "right" ? styles.right : state === "wrong" ? styles.wrong : ""}`}
          aria-pressed={picked === index} disabled={answered} onClick={() => setPicked(index)}>
          <span className={styles.letter}>{LETTERS[index]}</span><span>{option}</span>
          {state === "right" && <Check size={15} aria-label="Correct answer"/>}{state === "wrong" && <X size={15} aria-label="Your answer"/>}
        </button>;
      })}
    </div>
    {answered && <p className={styles.mcqExplain} role="status">
      <b>{picked === question.answer ? "Correct." : `Answer: ${LETTERS[question.answer]}.`}</b> {question.explain}
      <button type="button" onClick={() => setPicked(null)}>Try again</button>
    </p>}
  </li>;
}
