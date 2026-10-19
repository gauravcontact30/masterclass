"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";
import { useId, useState } from "react";
import type { WorkflowLesson } from "@/lib/workflow-learning";
import { WORKFLOW_CURRICULUM, interviewPriority, type WorkflowTopic } from "@/lib/workflow-curriculum";
import { WORKFLOW_DEFINITIONS, learningPoints } from "@/lib/workflow-presentation";
import styles from "./landing-workflows.module.css";
import { WorkflowStudyPanels } from "./workflow-study-panels";

const curricula = Object.values(WORKFLOW_CURRICULUM);
const totalQuestions = curricula.reduce((total, curriculum) => total + curriculum.topics.length, 0);
const topicCounts = curricula.map(curriculum => curriculum.topics.length);
const topicsPerCategory = Math.min(...topicCounts) === Math.max(...topicCounts)
  ? String(Math.min(...topicCounts))
  : `${Math.min(...topicCounts)}–${Math.max(...topicCounts)}`;

export function WorkflowLearning({ lessons, text }: Readonly<{ lessons: WorkflowLesson[]; text: (en: string, hi: string) => string }>) {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const term = query.trim().toLowerCase();
  const matching = lessons.map(lesson => {
    const curriculum = WORKFLOW_CURRICULUM[lesson.group];
    const matchLesson = `${lesson.group} ${lesson.title} ${lesson.summary}`.toLowerCase().includes(term);
    const topics = (curriculum?.topics ?? []).filter(topic => matchLesson || `${topic.title} ${topic.question} ${topic.answer}`.toLowerCase().includes(term));
    const sources = [...lesson.sources, ...(curriculum?.sources ?? [])].filter((source, index, all) => all.findIndex(entry => entry.url === source.url) === index);
    return { lesson, topics, sources, matchLesson };
  }).filter(({ matchLesson, topics }) => matchLesson || topics.length > 0);
  const topicCount = matching.reduce((total, item) => total + item.topics.length, 0);
  if (!lessons.length) return null;
  return <section className={styles.learningPaths} aria-label={text("Official documentation learning paths", "आधिकारिक दस्तावेज़ों से सीखें")}>
    <h3>{text("Learn and build with official docs", "आधिकारिक दस्तावेज़ों से सीखें और बनाएँ")}</h3>
    <p className={styles.curriculumSummary}><strong>{text(
      `${topicsPerCategory} topics per category across all ${curricula.length} categories — ${totalQuestions} interview questions and answers`,
      `सभी ${curricula.length} श्रेणियों में प्रत्येक के ${topicsPerCategory} विषय — ${totalQuestions} इंटरव्यू प्रश्न और उत्तर`,
    )}</strong></p>
    <p>{text("Understand the essentials. Practice interview answers. Build a working example, all here.", "पूरी चौड़ाई की गाइड, वर्कफ़्लो चित्र, इंटरव्यू उत्तर और अभ्यास यहीं पढ़ें। तकनीक और उसका अध्ययन टैब चुनें; बाहरी वेबसाइट की आवश्यकता नहीं है।")}</p>
    <div className={styles.topicSearch}>
      <label htmlFor={searchId}>{text("Search core features and interview topics", "मुख्य फ़ीचर और इंटरव्यू विषय खोजें")}</label>
      <div><input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={text("Try checkpoints, RAG, retries or React Actions", "checkpoints, RAG, retries या React Actions खोजें")} />
        {query && <button type="button" onClick={() => setQuery("")}>{text("Clear search", "खोज हटाएँ")}</button>}</div>
      <p role="status">{text(`${matching.length} learning paths · ${topicCount} interview topics`, `${matching.length} अध्ययन पथ · ${topicCount} इंटरव्यू विषय`)}</p>
    </div>
    {matching.length === 0 && <p>{text("No topics match this search in the selected category. Clear the search or choose another category.", "इस श्रेणी में कोई विषय नहीं मिला। खोज हटाएँ या दूसरी श्रेणी चुनें।")}</p>}
    <p className={styles.ratingLegend}>{text("Interview prep priority: ★★★★★ Core essentials · ★★★★☆ Extended practice. Editorial study guidance, not measured interview frequency.", "इंटरव्यू तैयारी प्राथमिकता: ★★★★★ मुख्य आधार · ★★★★☆ विस्तृत अभ्यास। ये अध्ययन सुझाव हैं, इंटरव्यू आवृत्ति के आँकड़े नहीं।")}</p>
    <div className={styles.learningGrid}>{matching.map(({ lesson, topics, sources }, index) => <details className={styles.learningCard} data-accordion="free" key={`${lesson.id}-${Boolean(term)}`} open={Boolean(term) || index === 0}>
      <AccordionSummary><span className={styles.pathLabel}>{lesson.group}</span><h4>{lesson.title}</h4><span className={styles.pathDefinition}>{WORKFLOW_DEFINITIONS[lesson.id]}</span><small>{text(`${topics.length} core features & interview topics`, `${topics.length} मुख्य फ़ीचर और इंटरव्यू विषय`)}</small></AccordionSummary>
      <div className={styles.learningBody}>
        <p>{lesson.summary}</p>
        <h5>{text("Core concepts", "मुख्य अवधारणाएँ")}</h5>
        <ul>{lesson.concepts.map(concept => <li key={concept}>{concept}</li>)}</ul>
        <WorkflowStudyPanels key={`${lesson.id}-${term}`} lesson={lesson} sources={sources} text={text}>
        <h5>{text("Core features and interview practice", "मुख्य फ़ीचर और इंटरव्यू अभ्यास")}</h5>
        <TopicList key={`${lesson.id}-${term}`} topics={topics} group={lesson.group} text={text} revealMatches={Boolean(term)} />
        </WorkflowStudyPanels>
      </div>
    </details>)}</div>
  </section>;
}

const TOPICS_PER_BATCH = 10;

function TopicList({ topics, group, text, revealMatches }: Readonly<{ topics: WorkflowTopic[]; group: string; text: (en: string, hi: string) => string; revealMatches: boolean }>) {
  const [visible, setVisible] = useState(TOPICS_PER_BATCH);
  const remaining = topics.length - visible;
  return <>
    <div className={styles.topicList}>{topics.slice(0, visible).map((topic, index) => <details className={styles.topic} data-accordion="free" key={topic.title} open={revealMatches || index === 0}>
      <AccordionSummary><span className={styles.topicTitle}>{topic.title}</span><span className={styles.priority} role="img" aria-label={text(`Interview prep priority: ${interviewPriority(group, topic.title)} out of 5 stars`, `इंटरव्यू तैयारी प्राथमिकता: 5 में से ${interviewPriority(group, topic.title)} सितारे`)} title={interviewPriority(group, topic.title) === 5 ? text("Core essentials — prepare first", "मुख्य आधार — पहले तैयार करें") : text("Extended practice — deepen your understanding", "विस्तृत अभ्यास — समझ बढ़ाएँ")}><span aria-hidden="true">{interviewPriority(group, topic.title) === 5 ? "★★★★★" : "★★★★☆"}</span></span></AccordionSummary>
      <div><p><strong>{topic.question}</strong></p><ul className={styles.learningPoints}>{learningPoints(topic.answer).map((point, index) => <li key={index}>{point}</li>)}</ul></div>
    </details>)}</div>
    <div className={styles.topicPagination}>
      <span>{text(`Showing ${Math.min(visible, topics.length)} of ${topics.length} topics`, `${topics.length} में से ${Math.min(visible, topics.length)} विषय`)}</span>
      {remaining > 0 && <button type="button" onClick={() => setVisible(count => count + TOPICS_PER_BATCH)} aria-label={text(`Show more topics for ${group}`, `${group} के और विषय दिखाएँ`)}>{text(`Show ${Math.min(TOPICS_PER_BATCH, remaining)} more`, `${Math.min(TOPICS_PER_BATCH, remaining)} और दिखाएँ`)}</button>}
      {remaining > 0 && <button type="button" onClick={() => setVisible(topics.length)} aria-label={text(`Show all topics for ${group}`, `${group} के सभी विषय दिखाएँ`)}>{text(`Show all ${topics.length}`, `सभी ${topics.length} दिखाएँ`)}</button>}
    </div>
  </>;
}
