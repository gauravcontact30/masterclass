"use client";
import { ExpandedText } from "@/components/expanded-text";


import { useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { uniqueLibraryDocuments } from "@/lib/library";
import preview from "@/lib/catalog-preview.json";
import { LEARNING_CATEGORIES, learningCategoryId } from "@/lib/learning-categories";
import { TechnologyTopics } from "./technology-topics";
import { Library, type LibraryProps } from "./library";
import { LearningCard } from "./learning-library-parts";
import { LearningSearch } from "./learning-filters";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import styles from "./library.module.css";

export function NotesLibrary(props: LibraryProps) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const base = useId();
  const section = useRef<HTMLElement>(null);
  const [localQuery, setLocalQuery] = useState("");
  // The dashboard passes its shared search panel query; standalone use keeps its own search box.
  const query = props.externalQuery ?? localQuery;
  const setQuery = props.onQueryChange ?? setLocalQuery;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectTechnology = (id: string | null) => { setSelectedId(id); section.current?.scrollIntoView({ block: "start" }); };
  const documents = useMemo(() => uniqueLibraryDocuments(props.documents), [props.documents]);
  const technologies = useMemo(() => {
    const catalog = new Map((props.technologies ?? []).map(technology => [technology.id, technology]));
    // Saved notes remain discoverable while the catalog loads or if an entry is retired.
    for (const document of documents) {
      const id = document.request.technologyId;
      if (!catalog.has(id)) catalog.set(id, preview.technologies.find(technology => technology.id === id) ?? { id, title: id.replace(/[-_]/g, " "), title_hi: "", category: "" });
    }
    return [...catalog.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [props.technologies, documents]);
  const selected = technologies.find(technology => technology.id === selectedId);
  const selectedDocuments = useMemo(() => documents.filter(document => document.request.technologyId === selectedId), [documents, selectedId]);
  const selectedTopics = useMemo(() => (props.topics ?? []).filter(topic => topic.technology_id === selectedId), [props.topics, selectedId]);
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = technologies.filter(technology => {
    const category = LEARNING_CATEGORIES.find(category => category.id === learningCategoryId(technology.id, technology))!;
    const text = [technology.id, technology.title, technology.title_hi, technology.category, category.title.en, category.title.hi].join(" ").toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });

  return <section ref={section} id="notes-technologies" className={styles.library} aria-labelledby={`${base}-title`}>
    <div className={styles.header}>
      <h2 id={`${base}-title`} className={styles.heading}>
        <ExpandedText text={selected ? (hi ? selected.title_hi || selected.title : selected.title) : hi ? "सभी तकनीकों के नोट्स" : "All technology notes"} />
        {!selected && <span className={styles.total}>{technologies.length}</span>}
      </h2>
      {selected && <Button variant="outline" onClick={() => selectTechnology(null)}><ArrowLeft size={14} aria-hidden="true" /><ExpandedText text={hi ? "सभी तकनीकें" : "All technologies"} /></Button>}
    </div>
    {selected ? <>
      <TechnologyTopics key={selected.id} documents={selectedDocuments} topics={selectedTopics} onLearn={props.onLearn} />
      <Library {...props} key={selected.id} documents={selectedDocuments} />
    </> : <>
      <p className={styles.hint}><ExpandedText text={hi ? "अपने नोट्स पढ़ने के लिए कोई तकनीक चुनें।" : "Choose a technology to explore its notes."} /></p>
      {props.externalQuery === undefined && <LearningSearch value={query} onChange={setQuery} label={hi ? "तकनीक खोजें" : "Search technologies"} />}
      <p className={styles.summary} role="status" aria-live="polite"><ExpandedText text={props.loading ? (hi ? "तकनीकें लोड हो रही हैं…" : "Loading technologies…") : hi ? `${visible.length} तकनीकें` : `${visible.length} ${visible.length === 1 ? "technology" : "technologies"}`} /></p>
      <ul className={styles.grid}>
        {visible.map(technology => {
          const title = hi ? technology.title_hi || technology.title : technology.title;
          const category = LEARNING_CATEGORIES.find(category => category.id === learningCategoryId(technology.id, technology))!;
          const count = documents.filter(document => document.request.technologyId === technology.id).length;
          const titleId = `${base}-${technology.id}`;
          return <li key={technology.id} className={styles.item}>
            <LearningCard title={title} titleId={titleId} accentId={technology.id} label={title}>
              <h3 id={titleId} className={styles.title}><ExpandedText text={title} /></h3>
              <p className={styles.sub}><ExpandedText text={category.title[language]} /></p>
              <p className={styles.hint}><ExpandedText text={count ? hi ? `${count} नोट्स उपलब्ध` : `${count} ${count === 1 ? "guide" : "guides"} available` : hi ? "आपकी लाइब्रेरी में अभी कोई नोट्स नहीं हैं।" : "No notes in your library yet."} /></p>
              <div className={styles.actions}><Button size="sm" className={styles.learn} onClick={() => selectTechnology(technology.id)} aria-label={hi ? `${title} के नोट्स देखें` : `View ${title} notes`}><BookOpen size={14} aria-hidden="true" /><ExpandedText text={hi ? "नोट्स देखें" : "View notes"} /></Button></div>
            </LearningCard>
          </li>;
        })}
      </ul>
      {!props.loading && !visible.length && <div className={styles.empty}>
        <h3><ExpandedText text={query.trim() ? hi ? "कोई तकनीक नहीं मिली" : "No technologies found" : hi ? "अभी कोई तकनीक उपलब्ध नहीं है" : "No technologies available yet"} /></h3>
        {query.trim() ? <Button variant="outline" onClick={() => setQuery("")}><ExpandedText text={hi ? "खोज साफ़ करें" : "Clear search"} /></Button> : <p><ExpandedText text={hi ? "अपनी लाइब्रेरी रिफ़्रेश करके फिर कोशिश करें।" : "Refresh your library to try again."} /></p>}
      </div>}
    </>}
  </section>;
}
