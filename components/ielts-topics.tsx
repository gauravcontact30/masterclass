"use client";
import Image from "@/components/responsive-image";
import { useMemo, useRef, useState } from "react";
import { ArrowDownAZ, BookOpenText, Flame, GraduationCap, LayoutGrid, Lightbulb, Mic, PenLine, X } from "lucide-react";
import { Pager } from "@/components/pager";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./ui/tabs";
import { ExamSearch } from "./exam-search";
import { useGridColumns } from "./use-grid-columns";
import { IELTS_TOPICS, type IeltsTopic } from "@/lib/ielts-topics";
import { ieltsTopicImage } from "@/lib/exam-images";
import styles from "./ielts-topics.module.css";

/*
 * IELTS Topics & Themes: every recurring IELTS theme as a picture card (pictures painted through the Vercel AI Gateway,
 * npm run images:ielts), five rows to a page, with search suggestions (topics, words and questions), filters and sort.
 * Opening a card shows its vocabulary, a Writing Task 2 question with idea points and Speaking Part 1 and 3 questions.
 */
type Part = "words" | "writing" | "speaking";
type Filter = "all" | "common" | "writing" | "speaking";
const ROWS = 5;
const FILTERS: { id: Filter; en: string; hi: string; icon: typeof LayoutGrid }[] = [
  { id: "all", en: "All topics", hi: "सभी विषय", icon: LayoutGrid }, { id: "common", en: "Most common", hi: "सबसे आम", icon: Flame },
  { id: "writing", en: "Writing Task 2", hi: "लेखन टास्क 2", icon: PenLine }, { id: "speaking", en: "Speaking", hi: "बोलना", icon: Mic },
];
const searchText = (topic: IeltsTopic) => [topic.topic, topic.task2, ...topic.ideas, ...topic.part1, ...topic.part3, ...topic.words.flat()].join(" ").toLowerCase();

function TopicArt({ topic }: { topic: string }) {
  const [failed, setFailed] = useState(false); const src = ieltsTopicImage(topic);
  return <span className={styles.art} aria-hidden="true">
    {src && !failed ? <Image src={src} alt="" width={320} height={213} sizes="(max-width: 640px) 50vw, 320px" onError={() => setFailed(true)} /> : <GraduationCap size={30} />}
  </span>;
}

export function IeltsTopics({ hi }: { hi: boolean }) {
  const tr = (en: string, hindi: string) => hi ? hindi : en;
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState<Filter>("all"); const [sort, setSort] = useState<"common" | "az">("common"); const [page, setPage] = useState(0);
  const [open, setOpen] = useState<{ topic: string; part: Part } | null>(null);
  const grid = useRef<HTMLUListElement>(null); const columns = useGridColumns(grid); const perPage = columns * ROWS;
  const texts = useMemo(() => new Map(IELTS_TOPICS.map(topic => [topic.topic, searchText(topic)])), []);
  const questions = useMemo(() => IELTS_TOPICS.flatMap(topic => [topic.task2, ...topic.part1, ...topic.part3, ...topic.words.map(([word]) => word)]), []);
  const termKey = query.trim().toLowerCase();
  const shown = useMemo(() => {
    const terms = termKey.split(/\s+/).filter(Boolean);
    const rows = IELTS_TOPICS.filter(topic => (filter !== "common" || topic.common) && (!terms.length || terms.every(term => texts.get(topic.topic)!.includes(term))));
    return sort === "az" ? rows.toSorted((a, b) => a.topic.localeCompare(b.topic)) : rows.toSorted((a, b) => Number(b.common) - Number(a.common));
  }, [filter, sort, termKey, texts]);
  const pages = Math.max(1, Math.ceil(shown.length / perPage)); const safePage = Math.min(page, pages - 1);
  const visible = shown.slice(safePage * perPage, (safePage + 1) * perPage);
  const active = open ? IELTS_TOPICS.find(topic => topic.topic === open.topic) ?? null : null;
  const reset = () => { setQuery(""); setFilter("all"); setSort("common"); setPage(0); };
  const show = (topic: string, part: Part) => { setOpen({ topic, part }); requestAnimationFrame(() => document.getElementById("ielts-topic-detail")?.scrollIntoView({ behavior: "smooth", block: "start" })); };

  return <div className={styles.wrap}>
    <div className={styles.tools}>
      <ExamSearch value={query} onChange={value => { setQuery(value); setPage(0); }} onTopic={name => { setQuery(name); setPage(0); }} topics={IELTS_TOPICS.map(topic => topic.topic)} questions={questions}
        placeholder={tr("Search topics, words or questions…", "विषय, शब्द या प्रश्न खोजें…")} label={tr("Search IELTS topics", "IELTS विषय खोजें")} />
      <div className={styles.chipRow}>
        <div className={styles.chips} role="group" aria-label={tr("Filter topics", "विषय छाँटें")}>
          {FILTERS.map(({ id, en, hi: hindi, icon: Icon }) => <button key={id} type="button" className={styles.chip} aria-pressed={filter === id} onClick={() => { setFilter(id); setPage(0); }}><Icon size={15} aria-hidden="true" />{tr(en, hindi)}</button>)}
        </div>
        <div className={styles.chips} role="group" aria-label={tr("Sort topics", "विषय क्रमबद्ध करें")}>
          <button type="button" className={styles.chip} aria-pressed={sort === "common"} onClick={() => { setSort("common"); setPage(0); }}><Flame size={15} aria-hidden="true" />{tr("Most common first", "सबसे आम पहले")}</button>
          <button type="button" className={styles.chip} aria-pressed={sort === "az"} onClick={() => { setSort("az"); setPage(0); }}><ArrowDownAZ size={15} aria-hidden="true" />{tr("A to Z", "A से Z")}</button>
        </div>
      </div>
      <p className={styles.count} aria-live="polite">{shown.length ? tr(`Showing ${safePage * perPage + 1}–${Math.min(shown.length, (safePage + 1) * perPage)} of ${shown.length} topics`, `${shown.length} में से ${safePage * perPage + 1}–${Math.min(shown.length, (safePage + 1) * perPage)} विषय`) : tr("No topic matches", "कोई विषय नहीं मिला")}
        {(query || filter !== "all" || sort !== "common") && <button type="button" className={styles.clear} onClick={reset}><X size={14} aria-hidden="true" />{tr("Clear", "हटाएँ")}</button>}</p>
    </div>

    <ul ref={grid} className={styles.grid}>{visible.map(topic => <li key={topic.topic} className={styles.card} data-open={open?.topic === topic.topic || undefined}>
      <TopicArt topic={topic.topic} />
      <div className={styles.body}>
        <h3 lang="en">{topic.topic}{topic.common && <span className={styles.common}><Flame size={11} aria-hidden="true" />{tr("Common", "आम")}</span>}</h3>
        <p className={styles.top} lang="en"><PenLine size={12} aria-hidden="true" />{topic.task2}</p>
        <div className={styles.links}>
          <button type="button" onClick={() => show(topic.topic, "words")}><BookOpenText size={13} aria-hidden="true" />{tr("Words", "शब्द")} <b>{topic.words.length}</b></button>
          <button type="button" onClick={() => show(topic.topic, "writing")}><PenLine size={13} aria-hidden="true" />{tr("Task 2", "टास्क 2")} <b>1</b></button>
          <button type="button" onClick={() => show(topic.topic, "speaking")}><Mic size={13} aria-hidden="true" />{tr("Speaking", "बोलना")} <b>{topic.part1.length + topic.part3.length}</b></button>
        </div>
      </div>
    </li>)}</ul>
    {shown.length > 0 && <div className={styles.gridFoot}>
      <p aria-live="polite">{tr(`Showing ${safePage * perPage + 1}–${Math.min(shown.length, (safePage + 1) * perPage)} of ${shown.length} topics · Page ${safePage + 1} of ${pages} · ${ROWS} rows per page`, `${shown.length} में से ${safePage * perPage + 1}–${Math.min(shown.length, (safePage + 1) * perPage)} विषय · पृष्ठ ${safePage + 1} / ${pages}`)}</p>
      <Pager page={safePage} pages={pages} label={tr("Topic pages", "विषय पृष्ठ")} onPage={next => { setPage(next); document.getElementById("ielts-topics")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
    </div>}

    {active && open && <section id="ielts-topic-detail" className={styles.detail} aria-labelledby="ielts-topic-detail-h">
      <header><h3 id="ielts-topic-detail-h" lang="en">{active.topic}</h3>
        <button type="button" className={styles.close} onClick={() => setOpen(null)} aria-label={tr("Close topic", "विषय बंद करें")}><X size={15} /></button></header>
      <Tabs key={`${active.topic}-${open.part}`} defaultValue={open.part}>
        <TabsList aria-label={tr("Topic material", "विषय सामग्री")}>
          <TabsTab value="words"><BookOpenText size={14} aria-hidden="true" />{tr("Vocabulary", "शब्दावली")}</TabsTab>
          <TabsTab value="writing"><PenLine size={14} aria-hidden="true" />{tr("Writing Task 2", "लेखन टास्क 2")}</TabsTab>
          <TabsTab value="speaking"><Mic size={14} aria-hidden="true" />{tr("Speaking", "बोलना")}</TabsTab>
        </TabsList>
        <TabsPanel value="words"><ul className={styles.words}>{active.words.map(([word, meaning, example]) => <li key={word}><b lang="en">{word}</b><span>{meaning}</span><i lang="en">{example}</i></li>)}</ul></TabsPanel>
        <TabsPanel value="writing"><div className={styles.task}>
          <p className={styles.question} lang="en">{active.task2}</p>
          <h4><Lightbulb size={14} aria-hidden="true" />{tr("Ideas to develop", "विकसित करने के विचार")}</h4>
          <ul>{active.ideas.map(idea => <li key={idea} lang="en">{idea}</li>)}</ul>
          <p className={styles.hint}>{tr("Plan for 5 minutes, write at least 250 words in 40 minutes, and give a clear position in the introduction and conclusion.", "5 मिनट योजना बनाएँ, 40 मिनट में कम से कम 250 शब्द लिखें, और भूमिका व निष्कर्ष में अपनी राय स्पष्ट रखें।")}</p>
        </div></TabsPanel>
        <TabsPanel value="speaking"><div className={styles.speaking}>
          <div><h4>{tr("Part 1 · about you", "भाग 1 · आपके बारे में")}</h4><ol>{active.part1.map(question => <li key={question} lang="en">{question}</li>)}</ol></div>
          <div><h4>{tr("Part 3 · discussion", "भाग 3 · चर्चा")}</h4><ol>{active.part3.map(question => <li key={question} lang="en">{question}</li>)}</ol></div>
        </div></TabsPanel>
      </Tabs>
    </section>}
  </div>;
}
