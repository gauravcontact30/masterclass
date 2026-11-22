"use client";
import { ExamSelect } from "./exam-select";
import { ExamContent } from "./exam-locale";
import { useDeferredValue, useId, useMemo, useState, type ReactNode } from "react";
import { Search, X, Zap } from "lucide-react";
import { Pager } from "@/components/pager";
import type { QuickItem } from "@/lib/quick-qa";
import shared from "./board-exams.module.css";
import styles from "./quick-qa.module.css";

/* The Quick Q&A list shared by the Board Exams and Competitive Exams pages: one-line questions with the short answer
   in view, searchable, filtered by topic and paged. Rendered inside those pages, so it uses their colour tokens. */
const PER_PAGE = 10;
function Mark({ text, terms }: { text: string; terms: string[] }): ReactNode {
  if (!terms.length) return text;
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part);
}

export function QuickQa({ items, panelId }: { items: QuickItem[]; /** The panel to scroll back to when the page changes. */ panelId: string }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [page, setPage] = useState(0);
  const inputId = useId(); const topicId = useId();
  const deferred = useDeferredValue(query);
  const terms = useMemo(() => deferred.toLowerCase().split(/\s+/).filter(Boolean), [deferred]);
  const topics = useMemo(() => [...new Set(items.map(item => item.topic))], [items]);
  const rows = useMemo(() => items.filter(item => (!topic || item.topic === topic) && (!terms.length || terms.every(term => `${item.q} ${item.a} ${item.topic}`.toLowerCase().includes(term)))), [items, topic, terms]);
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE)); const safePage = Math.min(page, pages - 1);
  const visible = rows.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  return <ExamContent><div className={styles.quick}>
    <p className={shared.note}><Zap size={14} aria-hidden="true" /><span>Short, to-the-point answers for last-minute revision. Cover the answer with your hand, say it aloud, then check.</span></p>
    <div className={shared.toolbar}>
      <div className={shared.search} role="search">
        <label htmlFor={inputId} className={shared.srOnly}>Search quick questions</label>
        <Search size={17} aria-hidden="true" />
        <input id={inputId} type="search" autoComplete="off" spellCheck={false} placeholder="Search quick questions and answers…" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} />
        {query && <button type="button" className={shared.clear} onClick={() => { setQuery(""); setPage(0); }} aria-label="Clear search"><X size={15} aria-hidden="true" /></button>}
      </div>
      <ExamSelect id={topicId} label="Topic" value={topic} onChange={next => { setTopic(next); setPage(0); }} options={topics} allLabel={`All topics (${items.length})`} />
    </div>
    <p className={styles.count} aria-live="polite">{rows.length} {rows.length === 1 ? "question" : "questions"}{rows.length > PER_PAGE ? ` · page ${safePage + 1} of ${pages}` : ""}</p>
    {!rows.length ? <p className={shared.empty}>No question matches. <button type="button" onClick={() => { setQuery(""); setTopic(""); setPage(0); }}>Clear search and topic</button></p>
      : <ol className={styles.list}>{visible.map((item, index) => <ExamContent key={item.id}><li>
          <span className={shared.num}>{safePage * PER_PAGE + index + 1}</span>
          <div><p className={styles.q}><Mark text={item.q} terms={terms} /><span className={shared.tag}>{item.topic}</span></p><p className={styles.a}><b>Ans.</b><span><Mark text={item.a} terms={terms} /></span></p></div>
        </li></ExamContent>)}</ol>}
    {pages > 1 && <Pager page={safePage} pages={pages} label="Quick questions pages" onPage={next => { setPage(next); document.getElementById(panelId)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />}
  </div></ExamContent>;
}
