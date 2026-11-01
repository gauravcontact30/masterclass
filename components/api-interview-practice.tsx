"use client";

import { AccordionSummary } from "@/components/ui/accordion-chevron";
import {useId, useRef, useState} from 'react';
import {CheckCircle2, Lightbulb, MessageSquareText, Target, CornerDownRight} from 'lucide-react';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Label} from '@/components/ui/label';
import type {GeneratedApiDetail} from '@/lib/pro-learn/types';
import type {ObjectiveQuestion} from '@/lib/api-learning-schema';
import {KeyText} from './key-text';
import {PillPager} from './pill-pager';
import {splitFollowUp,toPoints} from '@/lib/text-points';
import styles from './api-project.module.css';
const QUESTIONS_PER_PAGE=5;

/** Five questions to a page. */
function usePaged<T>(items:readonly T[]) {
  const [page,setPage]=useState(0);
  const pages=Math.max(1,Math.ceil(items.length/QUESTIONS_PER_PAGE));
  const at=Math.min(page,pages-1);
  return {first:at*QUESTIONS_PER_PAGE,visible:items.slice(at*QUESTIONS_PER_PAGE,(at+1)*QUESTIONS_PER_PAGE),setPage,pager:{page:at,pages,total:items.length,perPage:QUESTIONS_PER_PAGE}};
}
/** Moving to another page keeps the top of the list in view. */
const keepInView=(list:HTMLElement|null)=>list?.scrollIntoView({block:'nearest'});

export function ApiInterviewPractice({detail}:{detail:GeneratedApiDetail}) {
  const group=useId();
  const subjective=usePaged(detail.subjective);
  const top=useRef<HTMLDivElement>(null);
  return <div className={styles.interview}>
    <header className={styles.practiceHeading}><span className={styles.sectionIcon}><MessageSquareText size={20} aria-hidden="true"/></span><div><h3>Subjective questions &amp; answers</h3><p>Build a clear explanation, then explore a follow-up.</p></div><span className={styles.count}>{detail.subjective.length} questions</span></header>
    <div className={styles.questions} ref={top}>{subjective.visible.map((item,index)=>{const followUp=splitFollowUp(item.followUp??'');return <details name={group} className={styles.question} key={item.question}><AccordionSummary><span className={styles.questionNumber}>{String(subjective.first+index+1).padStart(2,'0')}</span><span className={styles.questionText}>{item.question}</span></AccordionSummary><div className={styles.answerBody}><div className={styles.answerTitle}><Lightbulb size={15} aria-hidden="true"/>Answer</div><ul className={styles.answerPoints}>{toPoints(item.answer).map(point=><li key={point}><KeyText text={point}/></li>)}</ul>{item.followUp&&<div className={styles.followUp}><strong><CornerDownRight size={15} aria-hidden="true"/>Follow-up</strong>{followUp.question&&<p className={styles.followUpQuestion}>{followUp.question}</p>}<p><KeyText text={followUp.answer}/></p></div>}</div></details>;})}</div>
    <PillPager className={styles.pager} {...subjective.pager} onPage={next=>{subjective.setPage(next);keepInView(top.current);}} label="Subjective questions" noun="questions"/>
    <ObjectiveQuestions questions={detail.objective}/>
  </div>;
}

/** Multiple-choice practice: choosing an option reveals whether it was right and why. */
export function ObjectiveQuestions({questions,heading=true}:{questions:readonly ObjectiveQuestion[];heading?:boolean}) {
  const id=useId();
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const paged=usePaged(questions);
  const top=useRef<HTMLDivElement>(null);
  return <>
    {heading&&<header className={styles.practiceHeading}><span className={styles.sectionIcon} data-tone="sage"><Target size={20} aria-hidden="true"/></span><div><h3>Objective questions &amp; answers</h3><p>Choose an answer to reveal the reasoning.</p></div><span className={styles.count}>{Object.keys(answers).length}/{questions.length} answered</span></header>}
    <div className={styles.questions} ref={top}>{paged.visible.map((item,position)=>{const index=paged.first+position;return <div className={styles.objective} key={item.question}><h4 id={`${id}-${index}`}><span className={styles.questionNumber}>{String(index+1).padStart(2,'0')}</span>{item.question}</h4><RadioGroup aria-labelledby={`${id}-${index}`} value={answers[index]===undefined?null:String(answers[index])} onValueChange={value=>setAnswers({...answers,[index]:Number(value)})}>{item.options.map((option,choice)=><Label className={styles.answerOption} data-selected={answers[index]===choice} key={choice}><RadioGroupItem value={String(choice)}/><span className={styles.optionLetter} aria-hidden="true">{String.fromCharCode(65+choice)}</span><span>{option}</span></Label>)}</RadioGroup>{answers[index]!==undefined&&<div className={styles.feedback} data-correct={answers[index]===item.answer} role="status"><CheckCircle2 size={18} aria-hidden="true"/><div><strong>{answers[index]===item.answer?'Correct.':'Try reviewing this concept.'} Answer: {item.options[item.answer]}</strong><p>{item.explanation}</p></div></div>}</div>;})}</div>
    <PillPager className={styles.pager} {...paged.pager} onPage={next=>{paged.setPage(next);keepInView(top.current);}} label="Objective questions" noun="questions"/>
  </>;
}
