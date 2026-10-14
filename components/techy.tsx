"use client";
import { isCodeExampleTab } from "@/lib/code-example-tabs";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import dynamic from "next/dynamic";
import { TECHY_PUZZLES } from "@/lib/techy-additional-examples";
import type { ServiceScope } from "@/lib/techy-services";
const TechyServices = dynamic(() => import("./techy-services").then(module => module.TechyServices), { loading: () => <p role="status">Loading service atlas?</p> });
import { ArrowLeft, ArrowRight, Check, Code2, Copy, FileCode2, Folder, Layers, RotateCcw, Search } from "lucide-react";
import { TECHY_TOPICS, TECHY_VOCABULARY, TECHY_EXAMPLES, type TechyTopic } from "@/lib/techy-content";
import { highlightLines } from "@/lib/code-highlight";
import { codeLineNotes } from "@/lib/code-line-notes";
import { CodeLineComment } from "./code-line-comment";
import type { TechyExample } from "@/lib/techy-examples";
import styles from "./techy.module.css";
import { LearningPicture } from "./learning-picture";
import { learningImageUrl } from "@/lib/learning-image";
import { DashboardPageHeader } from "./dashboard-page-header";

const sections = ["Key features", "Subjective Test", "Objective Quiz", "Code examples", "Corporate English"] as const;
type Section = typeof sections[number] | "Service atlas" | "Code puzzles";

function CodeEditor({ example }: { example: TechyExample }) {
  const [path, setPath] = useState(example.files[0].path);
  const [copyStatus, setCopyStatus] = useState("");
  const file = example.files.find(item => item.path === path) ?? example.files[0];
  const notes = codeLineNotes(file.code, file.path, file.language);
  const directories = [...new Set(example.files.map(item => item.path.includes("/") ? item.path.slice(0, item.path.lastIndexOf("/")) : "Project root"))];
  function select(next: string) { setPath(next); setCopyStatus(""); }
  async function copy() {
    try { await navigator.clipboard.writeText(file.code); setCopyStatus("Copied"); }
    catch { setCopyStatus("Copy unavailable. Select the code to copy manually."); }
  }
  return <div className={styles.editor}>
    <div className={styles.editorBar}><span className={styles.traffic} aria-hidden="true"><i/><i/><i/></span><span>{example.title}</span><Code2 size={15}/></div>
    <div className={styles.editorBody}>
      <nav className={styles.files} aria-label="Codebase files"><small>EXPLORER</small>{directories.map(directory => <div key={directory}><strong><Folder size={13}/>{directory}</strong>{example.files.filter(item => (item.path.includes("/") ? item.path.slice(0, item.path.lastIndexOf("/")) : "Project root") === directory).map(item => <button key={item.path} aria-current={path === item.path ? "true" : undefined} onClick={() => select(item.path)} title={item.path}><FileCode2 size={13}/>{item.path.split("/").pop()}</button>)}</div>)}</nav>
      <div className={styles.codeArea}>
        <div className={styles.fileTabs} aria-label="Open files">{example.files.filter(item => isCodeExampleTab(item.path)).map(item => <button key={item.path} aria-pressed={path === item.path} onClick={() => select(item.path)} title={item.path}><FileCode2 size={13}/>{item.path.split("/").pop()}</button>)}</div>
        <div className={styles.codeMeta}><span>{file.path}</span><button onClick={() => void copy()} aria-label="Copy current file">{copyStatus === "Copied" ? <Check size={14}/> : <Copy size={14}/>} {copyStatus === "Copied" ? "Copied" : "Copy"}</button></div>
        <pre className={styles.code} aria-label={`Source code for ${file.path}`} tabIndex={0}><code>{highlightLines(file.code, file.language).map((line, index) => <span className={styles.codeLine} key={index}><span className={styles.lineNumber} aria-hidden="true">{index + 1}</span><span>{line.map((token, part) => <span key={part} className={token.tone ? styles[token.tone] : undefined}>{token.text}</span>) || " "}{"\n"}<CodeLineComment note={notes[index]} /></span></span>)}</code></pre>
      </div>
    </div>
    <div className={styles.editorFooter}><span>{file.language} · UTF-8</span><span role="status">{copyStatus || `${example.files.length} connected files`}</span></div>
  </div>;
}

function Deck({ topic }: { topic: TechyTopic }) {
  const [section, setSection] = useState<Section>("Key features");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState("");
  const example = TECHY_EXAMPLES[topic.id];
  const hasAtlas = ["aws-ai", "aws-all", "aws-devops"].includes(topic.id);
  const availableSections: Section[] = [...sections, ...(topic.id === "javascript" ? ["Code puzzles" as const] : []), ...(hasAtlas ? ["Service atlas" as const] : [])];
  const count = section === "Code puzzles" ? TECHY_PUZZLES.length : section === "Key features" ? topic.features.length : section === "Corporate English" ? TECHY_VOCABULARY.length : section === "Code examples" ? 1 : topic.questions.length;
  const question = topic.questions[index];
  const word = TECHY_VOCABULARY[index];
  const selected = responses[question?.id];
  const answered = Object.keys(responses).length;
  const score = topic.questions.filter(item => responses[item.id] === item.correct).length;
  function changeSection(next: Section) { setSection(next); setIndex(0); setRevealed(false); setDraft(""); }
  function move(next: number) { setIndex(next); setRevealed(false); setDraft(""); }
  return <section className={styles.deck} aria-label={`${topic.title} flashcards`}>
    <header className={styles.deckHeading}><div><p className={styles.eyebrow}>{topic.category} / STUDY DECK</p><h2>{topic.title}</h2><p>{topic.summary}</p></div><a href={topic.source} target="_blank" rel="noreferrer">Official reference ↗</a></header>
    <LearningPicture src={learningImageUrl("guides", ["techy", topic.id])} alt={`Illustration of ${topic.title}`} />
    <div className={styles.sections} aria-label="Learning sections">{availableSections.map((item, position) => <button key={item} aria-pressed={section === item} onClick={() => changeSection(item)}><span>0{position + 1}</span>{item}</button>)}</div>
    {section === "Service atlas" ? <TechyServices key={topic.id} scope={topic.id as ServiceScope}/> : <>
    <div className={styles.deckMeta}><span><Layers size={14}/> {section} <b>· {index + 1} / {count}</b></span>{section === "Objective Quiz" ? <span aria-live="polite">{score} correct · {answered}/{topic.questions.length} answered</span> : <span>Recall first. Reveal. Repeat.</span>}</div>
    <article className={`${styles.flashcard} ${section === "Code examples" && revealed ? styles.wideCard : ""}`}>
      <div className={styles.cardTop}><span className={styles.cardLabel}>{section === "Subjective Test" ? "INTERVIEW PRACTICE" : section === "Corporate English" ? "WORKPLACE VOCABULARY" : section.toUpperCase()}</span>{section === "Subjective Test" && <span className={styles.stars} aria-label={`Study priority: ${question.priority} out of 5 stars`}>{"★".repeat(question.priority)}<span>{"☆".repeat(5 - question.priority)}</span></span>}</div>
      {section === "Code puzzles" && <><h3>{TECHY_PUZZLES[index].title}</h3><p className={styles.hint}>Predict the output before revealing the explanation.</p><pre className={styles.code}><code>{TECHY_PUZZLES[index].code}</code></pre>{revealed && <div className={styles.answer} role="status"><strong>OUTPUT</strong><p>{TECHY_PUZZLES[index].output}</p><p>{TECHY_PUZZLES[index].explanation}</p></div>}</>}
      {section === "Key features" && <><span className={styles.cardNumber}>0{index + 1}</span><h3>What should you know about {topic.title}?</h3><p className={styles.hint}>Recall a key capability before turning this card over.</p>{revealed && <div className={styles.answer} role="status"><strong>KEY FEATURE {index + 1}</strong><ul><li>{topic.features[index]}</li></ul></div>}</>}
      {section === "Subjective Test" && <><h3>{question.question}</h3><Label className={styles.draft}>Your answer <span>(optional, for this card)</span><Textarea value={draft} onChange={event => setDraft(event.target.value)} placeholder="Explain it in two or three sentences…" rows={3}/></Label>{revealed && <div className={styles.answer} role="status"><strong>SHORT ANSWER</strong><p>{question.answer}</p></div>}<p className={styles.hint}>Stars indicate editorial study priority, not measured interview frequency.</p></>}
      {section === "Objective Quiz" && <><h3>{question.question}</h3><div className={styles.options} role="group" aria-label="Answer options">{question.options.map((option, choice) => <button key={option} disabled={selected !== undefined} aria-pressed={selected === choice} data-result={selected !== undefined && choice === question.correct ? "correct" : selected === choice ? "incorrect" : undefined} onClick={() => setResponses(previous => ({ ...previous, [question.id]: choice }))}><span>{String.fromCharCode(65 + choice)}</span>{option}{selected !== undefined && choice === question.correct && <Check size={16}/>}</button>)}</div>{selected !== undefined && <div className={styles.answer} role="status"><strong>{selected === question.correct ? "CORRECT" : "REVIEW THIS ONE"} · Answer {String.fromCharCode(65 + question.correct)}</strong><p>{question.answer}</p></div>}{answered === topic.questions.length && <p className={styles.result} role="status">Quiz complete · {score}/{topic.questions.length} correct ({Math.round(score / topic.questions.length * 100)}%)</p>}</>}
      {section === "Code examples" && <><h3>{example.title}</h3><p className={styles.hint}>{example.description}</p>{revealed && <><p className={styles.setup}><strong>Try it locally</strong>{example.setup}</p><CodeEditor example={example}/></>}</>}
      {section === "Corporate English" && <><span className={styles.cardNumber}>Aa</span><h3>{word.word}</h3><p className={styles.hint}>Can you use this word in your next stand-up or review?</p>{revealed && <dl className={styles.vocabulary}><div><dt>Meaning</dt><dd>{word.meaning}</dd></div><div><dt>Synonyms</dt><dd>{word.synonyms}</dd></div><div><dt>Antonyms</dt><dd>{word.antonyms}</dd></div><div><dt>Sentence</dt><dd>“{word.sentence}”</dd></div></dl>}</>}
      {section !== "Objective Quiz" && <button className={styles.reveal} aria-expanded={revealed} onClick={() => setRevealed(value => !value)}><RotateCcw size={15}/>{revealed ? "Show question" : section === "Code examples" ? "Explore code" : "Reveal answer"}</button>}
    </article>
    <div className={styles.controls}><button disabled={index === 0} onClick={() => move(index - 1)}><ArrowLeft size={16}/>Previous</button><span className={styles.counter} aria-live="polite">Card {index + 1} of {count}</span><button disabled={index === count - 1} onClick={() => move(index + 1)}>Next<ArrowRight size={16}/></button></div>
    <div className={styles.deckBottom}><span>{section === "Corporate English" ? "A shared 20-card vocabulary deck for every technical role." : "Practice progress is kept while this topic stays open."}</span>{section === "Objective Quiz" && <button onClick={() => { setResponses({}); move(0); }}><RotateCcw size={13}/>Restart quiz</button>}</div>
    </>}
  </section>;
}

export function Techy() {
  const [topicId, setTopicId] = useState(TECHY_TOPICS[0].id);
  const [query, setQuery] = useState("");
  const topic = TECHY_TOPICS.find(item => item.id === topicId)!;
  const visible = TECHY_TOPICS.filter(item => `${item.title} ${item.category} ${item.summary}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className={styles.root}>
    <DashboardPageHeader eyebrow="Professional learning / Techy" title="A little sharper. Every single day." icon={<Code2/>} description="Your Techy notebook for modern engineering. Small cards, practical answers, and skills that stick."/>
    <div className={styles.stats}><span><strong>{TECHY_TOPICS.length}</strong> topic decks</span><span><strong>{TECHY_TOPICS.reduce((sum, item) => sum + item.questions.length, 0)}</strong> interview questions</span><span><strong>{TECHY_TOPICS.reduce((sum, item) => sum + item.questions.length, 0)}</strong> quiz questions</span><span><strong>20</strong> workplace words</span></div>
    <div className={styles.topicHeading}><div><h2>Choose your focus</h2><p>A curated modern stack · foundational to advanced</p></div><Label className={styles.search}><Search size={16}/><Input type="search" aria-label="Search Techy topics" placeholder="Find a topic…" value={query} onChange={event => setQuery(event.target.value)}/></Label></div>
    <div className={styles.topics} aria-label="Techy topics">{visible.map((item, index) => <button key={item.id} aria-pressed={topicId === item.id} className={styles.topic} onClick={() => setTopicId(item.id)}><span className={styles.topicIcon}>{item.id === "aws" ? "aws" : item.id === "agentic-ai" ? "AI" : item.id === "nextjs" ? "N" : item.id === "react" ? "⚛" : item.title.slice(0, 2)}</span><span><small>{item.category}</small><strong>{item.title}</strong><span>20 interview · 20 quiz</span></span>{topicId === item.id ? <Check size={16}/> : <span className={styles.topicIndex}>{String(index + 1).padStart(2, "0")}</span>}</button>)}</div>
    {visible.length === 0 && <div className={styles.empty} role="status">No topics match “{query}”. <button onClick={() => setQuery("")}>Clear search</button></div>}
    <Deck key={topic.id} topic={topic}/>
  </div>;
}
