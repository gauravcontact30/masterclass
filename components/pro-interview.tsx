"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Sparkles, Star, Timer, X } from "lucide-react";
import type { ContentSource, GeneratedInterview } from "@/lib/pro-learn/types";
import { INTERVIEW_BANK, INTERVIEW_COMPANIES, INTERVIEW_LEVELS, type InterviewItem } from "@/lib/pro-learn/tracks";
import { ProMarkdown } from "./pro-markdown";
import { dayIndex, ProHero, Select, SourceBadge } from "./pro-learn-shared";
import styles from "./pro-learn.module.css";
import { LearningPath, StudyNote } from "./learning-studio";
import { FlashcardDeck, type StudyCard } from "./study-cards";
import { groupQuestionsByArea } from "@/lib/pro-learn/families";

import { BrandMark } from "./topic-media";

const CATEGORIES = ["All", ...new Set(INTERVIEW_BANK.map(item => item.cat))];
/** A drill stays short enough to finish in one sitting, so it draws from the top of the filtered bank. */
const DRILL_SIZE = 12;

function QuestionCard({ item, onCompany }: { item: InterviewItem; onCompany: (company: string) => void }) {
  return <details className={styles.ivCard}>
    <summary><span className={styles.ivQuestion}><span className={styles.questionLabel}>PRACTICE QUESTION</span>{item.q}</span><span className={styles.ivTags}><span className={styles.cat}>{item.cat}</span><span className={styles.level} data-level={item.lvl}>{item.lvl}</span><span className={styles.revealLabel}>Explore answer +</span></span></summary>
    <div className={styles.ivAnswer}><ProMarkdown text={item.a}/><div className={styles.companies}><span>Asked at</span>{item.co.map(company => <button key={company} onClick={() => onCompany(company)} aria-label={`Show questions asked at ${company}`}>{company}</button>)}</div></div>
  </details>;
}

export function ProInterview({ aiReady }: { aiReady: boolean }) {
  const [filters, setFilters] = useState({ company: "All", category: "All", level: "All", query: "" });
  const [generator, setGenerator] = useState({ category: "All", company: "All", level: "All" });
  const [generated, setGenerated] = useState<{ state: "idle" | "loading" | "error" | "ready"; item?: GeneratedInterview; source?: ContentSource; message?: string }>({ state: "idle" });
  const questionOfDay = INTERVIEW_BANK[dayIndex() % INTERVIEW_BANK.length];
  const query = filters.query.trim().toLowerCase();
  const matches = INTERVIEW_BANK.filter(item => (filters.company === "All" || item.co.includes(filters.company)) && (filters.category === "All" || item.cat === filters.category) && (filters.level === "All" || item.lvl === filters.level) && (!query || `${item.q} ${item.cat} ${item.co.join(" ")}`.toLowerCase().includes(query)));

  async function generate() {
    setGenerated({ state: "loading" });
    try {
      const response = await fetch("/api/pro-learn/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(generator) });
      const data = await response.json() as { item?: GeneratedInterview; source?: ContentSource; error?: string };
      if (!response.ok || !data.item) throw new Error(data.error === "rate_limited" ? "Please wait a minute before generating another question." : "A question could not be generated. Please try again.");
      setGenerated({ state: "ready", item: data.item, source: data.source });
    } catch (error) { setGenerated({ state: "error", message: error instanceof Error ? error.message : "Something went wrong." }); }
  }
  function showCompany(company: string) { setFilters({ company, category: "All", level: "All", query: "" }); document.getElementById("interview-bank")?.scrollIntoView({ behavior: "smooth" }); }

  const grouped = groupQuestionsByArea(matches);
  const drillSource = matches.length ? matches : INTERVIEW_BANK;
  const drill: StudyCard[] = drillSource.slice(0, DRILL_SIZE).map((item, index) => ({
    id: `${index}-${item.q}`,
    eyebrow: item.cat,
    front: item.q,
    prompt: "Give the two-minute version out loud: clarify, state your approach, then name the trade-off. Turn the card only after you have finished.",
    back: <ProMarkdown text={item.a}/>,
    meta: [item.lvl, `Asked at ${item.co.slice(0, 2).join(", ")}`],
  }));
  const drillScope = filters.company === "All" && filters.category === "All" && filters.level === "All" && !query ? "the full bank" : "your current filters";

  return <div className={styles.root}>
    <LearningPath active="interview"/>
    <ProHero eyebrow="Interview prep · refreshes daily" title="Crack your next big-tech interview">
      A new question every day, the most-asked questions tagged by company, and {aiReady ? "an AI partner that drills you on any topic" : "a practice generator drawn from the curated bank"} — for engineers and students aiming at Google, Meta, Amazon, Microsoft, Apple, Netflix and beyond.
      <span className={styles.stats} style={{ display: "flex" }}><span><b>{INTERVIEW_BANK.length}</b>curated questions</span><span><b>{INTERVIEW_COMPANIES.length - 1}</b>companies</span><span><b>{CATEGORIES.length - 1}</b>topics</span></span>
    </ProHero>

    <StudyNote label="THE PRACTICE METHOD" title="Think out loud. Make your reasoning visible.">Clarify the problem, explain your approach, then discuss trade-offs. Try a two-minute answer before revealing the solution.</StudyNote>
    <section className={`${styles.card} ${styles.qotd}`} aria-label="Question of the day">
      <div className={styles.ivHead}><span className={styles.eyebrow}><Star size={12} style={{ verticalAlign: "-1px" }}/> Question of the day</span><span className={styles.cat}>{questionOfDay.cat}</span><span className={styles.level} data-level={questionOfDay.lvl}>{questionOfDay.lvl}</span></div>
      <details className={styles.ivCard} style={{ marginTop: 10 }}>
        <summary><span className={styles.question} style={{ margin: 0 }}>{questionOfDay.q}</span><span className={styles.cat}>Reveal answer</span></summary>
        <div className={styles.ivAnswer}><ProMarkdown text={questionOfDay.a}/><div className={styles.companies}><span>Asked at</span>{questionOfDay.co.map(company => <button key={company} onClick={() => showCompany(company)}>{company}</button>)}</div></div>
      </details>
    </section>

    <FlashcardDeck key={`${filters.company}|${filters.category}|${filters.level}|${query}|${drill.length}`} cards={drill} accent="amber"
      label="Interview drill flashcards" eyebrow="Rapid-fire drill" title="Answer before you read."
      description={`${drill.length} question${drill.length === 1 ? "" : "s"} drawn from ${drillScope}. Speak the answer, turn the card, and send back anything you could not explain cleanly.`}
      icon={<Timer size={13}/>} frontLabel="INTERVIEW QUESTION" backLabel="MODEL ANSWER" revealLabel="Reveal the model answer" againLabel="Drill again" knownLabel="I could answer that"
      countLabel={(known, total) => `${known} of ${total} answered without help`}
      footnote="Change a filter below and the drill follows it."/>

    <section className={styles.card} style={{ marginTop: 16 }} aria-labelledby="interview-generator">
      <div className={styles.ivHead}><h2 id="interview-generator" style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 22 }}>Practice with {aiReady ? "AI" : "the question bank"}</h2></div>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 14 }}>{aiReady ? "Unlimited fresh questions with model answers, tuned to a topic, company and difficulty." : "Draw a random question matching a topic, company and difficulty."}</p>
      <div className={styles.setupRow}>
        <Select label="Topic" value={generator.category} options={CATEGORIES} onChange={category => setGenerator(value => ({ ...value, category }))}/>
        <Select label="Company" value={generator.company} options={INTERVIEW_COMPANIES} onChange={company => setGenerator(value => ({ ...value, company }))}/>
        <Select label="Level" value={generator.level} options={INTERVIEW_LEVELS} onChange={level => setGenerator(value => ({ ...value, level }))}/>
        <button className={`${styles.btn} ${styles.primary}`} disabled={generated.state === "loading"} onClick={() => void generate()}>{generated.state === "loading" ? <><span className={styles.spinner}/>Generating…</> : <><Sparkles size={15}/>Generate a question</>}</button>
      </div>
      {generated.state === "error" && <p className={styles.notice} data-tone="error" role="alert" style={{ marginTop: 14 }}>{generated.message}</p>}
      {generated.state === "ready" && generated.item && <article className={styles.ivCard} style={{ marginTop: 16 }} aria-live="polite">
        <div style={{ padding: "16px 18px" }}>
          <div className={styles.ivHead}><span className={styles.cat}>{generated.item.category}</span>{generated.item.company && <span className={styles.cat}>{generated.item.company}</span>}<span className={styles.level} data-level={generated.item.level}>{generated.item.level}</span>{generated.source && <SourceBadge source={generated.source}/>}</div>
          <h3 className={styles.question} style={{ margin: "6px 0 0" }}>{generated.item.question}</h3>
        </div>
        <div className={styles.ivAnswer}>
          <ProMarkdown text={generated.item.answer}/>
          {!!generated.item.keyPoints.length && <div className={styles.keyList}><b>Key points</b><ul>{generated.item.keyPoints.map(point => <li key={point}>{point}</li>)}</ul></div>}
          {!!generated.item.followUps.length && <div className={styles.keyList}><b>Likely follow-ups</b><ul>{generated.item.followUps.map(point => <li key={point}>{point}</li>)}</ul></div>}
          <button className={`${styles.btn} ${styles.outline} ${styles.small}`} style={{ marginTop: 14 }} onClick={() => void generate()}>Generate another →</button>
        </div>
      </article>}
    </section>

    <div className={styles.sectionHead} id="interview-bank"><div><h2>Most-asked questions</h2><p>Curated from real big-tech loops — filter by company, topic and difficulty.</p></div><span className={styles.cat} role="status">{matches.length} question{matches.length === 1 ? "" : "s"}</span></div>
    <div className={styles.card} style={{ marginBottom: 14 }}>
      <div className={styles.filterRow}><span>Company</span><div className={styles.chips} role="group" aria-label="Filter by company">{INTERVIEW_COMPANIES.map(company => <button key={company} className={styles.chip} aria-pressed={filters.company === company} onClick={() => setFilters(value => ({ ...value, company }))}>{company}</button>)}</div></div>
      <div className={styles.filterRow}><span>Topic</span><div className={styles.chips} role="group" aria-label="Filter by topic">{CATEGORIES.map(category => <button key={category} className={styles.chip} aria-pressed={filters.category === category} onClick={() => setFilters(value => ({ ...value, category }))}><BrandMark label={category} size={13}/>{category}</button>)}</div></div>
      <div className={styles.filterRow} style={{ marginBottom: 0 }}><span>Level</span><div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div className={styles.seg} role="group" aria-label="Filter by level">{INTERVIEW_LEVELS.map(level => <button key={level} aria-pressed={filters.level === level} onClick={() => setFilters(value => ({ ...value, level }))}>{level}</button>)}</div>
        <Label style={{ position: "relative", flex: "1 1 220px" }}><span className={styles.srOnly}>Search questions</span><Search size={15} style={{ position: "absolute", left: 11, top: 12, color: "var(--faint)" }}/><Input type="search" className={styles.input} style={{ paddingLeft: 34 }} placeholder="Search questions…" value={filters.query} onChange={event => setFilters(value => ({ ...value, query: event.target.value }))}/>{filters.query && <button aria-label="Clear question search" onClick={() => setFilters(value => ({ ...value, query: "" }))} style={{ position: "absolute", right: 8, top: 9, border: 0, background: "none", cursor: "pointer", color: "var(--muted)" }}><X size={15}/></button>}</Label>
      </div></div>
    </div>
    {/* Grouped by what the interviewer is probing, then by topic, so a candidate can revise one area at a time. */}
    {grouped.map(({ area, categories, total }) => <section key={area.id} className={styles.ivArea} aria-label={`${area.name} interview questions`}>
      <div className={styles.ivAreaHead}>
        <div><h3>{area.name}</h3><p>{area.blurb}</p></div>
        <span className={styles.cat}>{total} Q&amp;A</span>
      </div>
      {categories.map(({ category, items }) => <div key={category} className={styles.ivCategory}>
        <div className={styles.ivCategoryHead}><h4>{category}</h4><span>{items.length} question{items.length === 1 ? "" : "s"}</span></div>
        {items.map(item => <QuestionCard key={item.q} item={item} onCompany={showCompany}/>)}
      </div>)}
    </section>)}
    {!matches.length && <div className={`${styles.card} ${styles.empty}`}><h3>No questions match these filters</h3><p>Reset a filter to All, or generate a fresh question above.</p><button className={`${styles.btn} ${styles.outline} ${styles.small}`} style={{ marginTop: 12 }} onClick={() => setFilters({ company: "All", category: "All", level: "All", query: "" })}>Reset filters</button></div>}
  </div>;
}
