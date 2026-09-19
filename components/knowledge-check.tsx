"use client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { uniqueLearningPoints } from "@/lib/concise-learning";
import { ExpandedText } from "@/components/expanded-text";


import { useId, useState } from "react";
import { BookOpenCheck, Check, RotateCcw } from "lucide-react";
import { optionLetter, type ObjectiveQuestion } from "@/lib/domain";
import { Button } from "./ui/button";
import styles from "./knowledge-check.module.css";

// Re-exported so the notes reader keeps importing its option labels from one place.
export { optionLetter };

export function AnswerPanels({ shortAnswer, explanation, hi = false }: { shortAnswer: string; explanation: string; hi?: boolean }) {
  const detail = uniqueLearningPoints([explanation], [shortAnswer.replace(/^[A-Z]\.\s*/, "")]).join("\n");
  return <div className={styles.answers}>
    <section className={styles.short}><h4><Check size={15} aria-hidden="true" /><ExpandedText text={hi ? "संक्षिप्त उत्तर" : "Short answer"} /></h4><p><ExpandedText text={shortAnswer} /></p></section>
    {detail && <section className={styles.detail}><h4><BookOpenCheck size={15} aria-hidden="true" /><ExpandedText text={hi ? "विस्तृत व्याख्या" : "Detailed explanation"} /></h4><p><ExpandedText text={detail} /></p></section>}
  </div>;
}

export function KnowledgeCheck({ question, hi = false }: { question: ObjectiveQuestion; hi?: boolean }) {
  const id = useId();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  return <div className={styles.check}>
    <span className={styles.eyebrow}><ExpandedText text={hi ? "रुकें और सोचें" : "PAUSE & PRACTISE"} /></span>
    <fieldset className={styles.fieldset}><legend><ExpandedText text={question.question} /></legend>
      <RadioGroup name={id} aria-label={question.question} disabled={checked} value={choice===null?null:String(choice)} onValueChange={value=>setChoice(Number(value))} className={styles.options}>{question.options.map((option, index) => <Label key={index} className={styles.option} data-selected={choice === index} data-result={checked ? index === question.correct ? "correct" : index === choice ? "incorrect" : undefined : undefined}>
        <RadioGroupItem value={String(index)} />
        <span className={styles.letter}><ExpandedText text={optionLetter(index)} /></span><span><ExpandedText text={option} /></span>
        {checked && index === question.correct && <Check size={16} aria-label={hi ? "सही विकल्प" : "Correct option"} />}
      </Label>)}</RadioGroup>
    </fieldset>
    <div className={styles.actions}>
      {!checked ? <Button disabled={choice === null} onClick={() => setChecked(true)}><ExpandedText text={hi ? "उत्तर जाँचें" : "Check answer"} /></Button> : <Button variant="outline" onClick={() => { setChecked(false); setChoice(null); }}><RotateCcw size={14} aria-hidden="true" /><ExpandedText text={hi ? "फिर कोशिश करें" : "Try again"} /></Button>}
      <span role="status" aria-live="polite"><ExpandedText text={checked ? choice === question.correct ? hi ? "सही! अब कारण समझें।" : "Correct. Now explore why." : hi ? "अभी सही नहीं। नीचे व्याख्या देखें।" : "Not quite. Read the explanation below." : hi ? "एक विकल्प चुनें, फिर अपना तर्क जाँचें।" : "Choose one option, then check your reasoning."} /></span>
    </div>
    {checked && <AnswerPanels shortAnswer={`${optionLetter(question.correct)}. ${question.shortAnswer}`} explanation={question.explanation} hi={hi} />}
  </div>;
}
