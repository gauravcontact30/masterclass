"use client";
import {useId, useState} from 'react';
import {CheckCircle2, ChevronDown, Lightbulb, MessageSquareText, Target, CornerDownRight} from 'lucide-react';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Label} from '@/components/ui/label';
import type {GeneratedApiDetail} from '@/lib/pro-learn/types';
import type {ObjectiveQuestion} from '@/lib/api-learning-schema';
import styles from './api-project.module.css';
export function ApiInterviewPractice({detail}:{detail:GeneratedApiDetail}) {
  return <div className={styles.interview}>
    <header className={styles.practiceHeading}><span className={styles.sectionIcon}><MessageSquareText size={20} aria-hidden="true"/></span><div><h3>Subjective questions &amp; answers</h3><p>Build a clear explanation, then explore a follow-up.</p></div><span className={styles.count}>{detail.subjective.length} questions</span></header>
    <div className={styles.questions}>{detail.subjective.map((item,index)=><details className={styles.question} key={item.question}><summary><span className={styles.questionNumber}>{String(index+1).padStart(2,'0')}</span><span>{item.question}</span><ChevronDown className={styles.disclosure} size={17} aria-hidden="true"/></summary><div className={styles.answerBody}><div className={styles.answerTitle}><Lightbulb size={15} aria-hidden="true"/>Answer</div><p>{item.answer}</p>{item.followUp&&<div className={styles.followUp}><strong><CornerDownRight size={15} aria-hidden="true"/>Similar question</strong><p>{item.followUp}</p></div>}</div></details>)}</div>
    <ObjectiveQuestions questions={detail.objective}/>
  </div>;
}

/** Multiple-choice practice: choosing an option reveals whether it was right and why. */
export function ObjectiveQuestions({questions,heading=true}:{questions:readonly ObjectiveQuestion[];heading?:boolean}) {
  const id=useId();
  const [answers,setAnswers]=useState<Record<number,number>>({});
  return <>
    {heading&&<header className={styles.practiceHeading}><span className={styles.sectionIcon} data-tone="sage"><Target size={20} aria-hidden="true"/></span><div><h3>Objective questions &amp; answers</h3><p>Choose an answer to reveal the reasoning.</p></div><span className={styles.count}>{Object.keys(answers).length}/{questions.length} answered</span></header>}
    <div className={styles.questions}>{questions.map((item,index)=><div className={styles.objective} key={item.question}><h4 id={`${id}-${index}`}><span className={styles.questionNumber}>{String(index+1).padStart(2,'0')}</span>{item.question}</h4><RadioGroup aria-labelledby={`${id}-${index}`} value={answers[index]===undefined?null:String(answers[index])} onValueChange={value=>setAnswers({...answers,[index]:Number(value)})}>{item.options.map((option,choice)=><Label className={styles.answerOption} data-selected={answers[index]===choice} key={choice}><RadioGroupItem value={String(choice)}/><span className={styles.optionLetter} aria-hidden="true">{String.fromCharCode(65+choice)}</span><span>{option}</span></Label>)}</RadioGroup>{answers[index]!==undefined&&<div className={styles.feedback} data-correct={answers[index]===item.answer} role="status"><CheckCircle2 size={18} aria-hidden="true"/><div><strong>{answers[index]===item.answer?'Correct.':'Try reviewing this concept.'} Answer: {item.options[item.answer]}</strong><p>{item.explanation}</p></div></div>}</div>)}</div>
  </>;
}
