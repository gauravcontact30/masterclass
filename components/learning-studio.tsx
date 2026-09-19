"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Layers, MessageCircle, Target, type LucideIcon } from "lucide-react";
import type { ProLesson } from "@/lib/pro-learn/types";
import { FlashcardDeck, type StudyCard } from "./study-cards";
import styles from "./pro-learn.module.css";

const destinations: { id: string; label: string; caption: string; icon: LucideIcon }[] = [
  { id: "lessons", label: "Learn", caption: "Read and understand", icon: BookOpen },
  { id: "quiz", label: "Recall", caption: "Check what stuck", icon: Brain },
  { id: "interview", label: "Practise", caption: "Answer under pressure", icon: Target },
  { id: "mentors", label: "Go deeper", caption: "Ask what is unclear", icon: MessageCircle },
];

/** The four stages of the loop, shown on every professional learning page. */
export function LearningPath({ active }: { active: string }) {
  return <nav className={styles.learningPath} aria-label="Your learning journey">
    {destinations.map(({ id, label, caption, icon: Icon }, index) => <Link key={id} href={`/dashboard/${id}`} aria-current={active === id ? "page" : undefined}>
      <span className={styles.pathNumber}>0{index + 1}</span>
      <Icon size={16} aria-hidden="true"/>
      <span className={styles.pathText}><b>{label}</b><small>{caption}</small></span>
      <ArrowRight size={14} aria-hidden="true"/>
    </Link>)}
  </nav>;
}

export function StudyNote({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return <aside className={styles.studyNote}>
    <span className={styles.noteIcon}><Brain size={22}/></span>
    <div><span className={styles.eyebrow}>{label}</span><h3>{title}</h3><p>{children}</p></div>
  </aside>;
}

/** A compact row of headline numbers under a page hero. */
export function StatStrip({ items }: { items: { value: string; unit?: string; label: string }[] }) {
  return <dl className={styles.statStrip}>
    {items.map(item => <div key={item.label}>
      <dt>{item.label}</dt>
      <dd>{item.value}{item.unit && <span>{item.unit}</span>}</dd>
    </div>)}
  </dl>;
}

/** Lesson takeaways turned into a recall deck, so reading is followed by retrieval. */
export function RecallDeck({ lessons }: { lessons: ProLesson[] }) {
  const cards: StudyCard[] = lessons.filter(lesson => lesson.takeaways.length).map(lesson => ({
    id: lesson.id,
    eyebrow: lesson.tag,
    front: lesson.title,
    prompt: "What are the key ideas here? Name one place you would actually use this, then turn the card.",
    back: <ul>{lesson.takeaways.map(point => <li key={point}>{point}</li>)}</ul>,
    meta: [lesson.level, `${lesson.minutes} min read`],
  }));
  if (!cards.length) return null;
  return <FlashcardDeck
    cards={cards}
    label="Lesson flashcards"
    eyebrow="The recall studio"
    title="Make it stick."
    description="Close the lesson. Explain the idea in your own words, then turn the card and compare. Anything you send back reappears before the deck is done."
    icon={<Layers size={13}/>}
    frontLabel="RECALL PROMPT"
    backLabel="KEY TAKEAWAYS"
    revealLabel="Reveal takeaways"
    againLabel="Practise again"
    knownLabel="Got it"
  />;
}
