"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";
import { ExpandedText } from "@/components/expanded-text";


import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import type { DocumentRecord, Topic } from "@/lib/domain";
import { requestJson } from "@/lib/client";
import { noteLines, technologyTopicNotes, type TopicNote } from "@/lib/technology-topics";
import { ServiceCatalog } from "./service-catalog";
import { CodeLab } from "./code-lab";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import styles from "./technology-topics.module.css";

export function TechnologyTopics({ documents, topics, onLearn }: { documents: DocumentRecord[]; topics: Topic[]; onLearn: (document: DocumentRecord) => void }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [loaded, setLoaded] = useState<Record<string, DocumentRecord>>({});
  const [failed, setFailed] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const missing = documents.filter(document => document.status === "ready" && !document.curriculum && !loaded[document.id]);
    if (!missing.length) return;
    void Promise.allSettled(missing.map(async document => {
      const result = await requestJson<{ document: DocumentRecord }>(`/api/documents/${document.id}`);
      if (!result.document.curriculum) throw new Error("not_ready");
      return result.document;
    })).then(results => {
      if (!active) return;
      const successes: Record<string, DocumentRecord> = {};
      const errors: string[] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") successes[result.value.id] = result.value;
        else errors.push(missing[index].id);
      });
      setLoaded(previous => ({ ...previous, ...successes }));
      setFailed(errors);
    });
    return () => { active = false; };
    // Loaded records are a cache; retry only when the document list or retry attempt changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, attempt]);
  const hydrated = useMemo(() => documents.map(document => document.curriculum ? document : loaded[document.id] ?? document), [documents, loaded]);
  const entries = useMemo(() => technologyTopicNotes(hydrated, topics, hi), [hydrated, topics, hi]);
  const loading = hydrated.some(document => document.status === "ready" && !document.curriculum && !failed.includes(document.id));

  return <div className={styles.topics}>
    <p className={styles.intro}><ExpandedText text={hi ? "हर विषय का अलग कार्ड: मुख्य बातें, उदाहरण और अभ्यास। हर श्रेणी में चार कार्ड प्रति पृष्ठ।" : "One card per topic, with key ideas, examples and practice. Four cards per category page."} /></p>
    {loading && <p role="status"><ExpandedText text={hi ? "विषय के नोट्स लोड हो रहे हैं…" : "Loading topic notes…"} /></p>}
    {!!failed.length && <div role="alert"><p><ExpandedText text={hi ? "कुछ नोट्स लोड नहीं हो सके। उपलब्ध विषय नीचे हैं।" : "Some notes could not be loaded. Available topics are shown below."} /></p><Button variant="outline" onClick={() => { setFailed([]); setAttempt(value => value + 1); }}><ExpandedText text={hi ? "फिर कोशिश करें" : "Try again"} /></Button></div>}
    {!!entries.length && <ServiceCatalog services={entries} hi={hi} grouped topics renderDetails={entry => {
      const note = entry as TopicNote;
      return <>
        {note.lesson && <details className={styles.details}>
          <AccordionSummary>{hi ? "उदाहरण और अभ्यास" : "Examples & practice"}</AccordionSummary>
          <h5>{hi ? "उदाहरण" : "Example"}</h5><ul>{noteLines(note.lesson.example).map((line, index) => <li key={index}>{line}</li>)}</ul>
          {note.lesson.code && <CodeLab title={note.lesson.title} code={note.lesson.code} />}
          <h5>{hi ? "अभ्यास" : "Practice"}</h5><ul>{noteLines(note.lesson.exercise).map((line, index) => <li key={index}>{line}</li>)}</ul>
          <h5>{hi ? "अपनी समझ जाँचें" : "Check your understanding"}</h5><ul>{noteLines(note.lesson.checkpoint).map((line, index) => <li key={index}>{line}</li>)}</ul>
          <h5>{hi ? "सामान्य गलतियाँ" : "Common mistakes"}</h5><ul>{noteLines(note.lesson.mistake).map((line, index) => <li key={index}>{line}</li>)}</ul>
        </details>}
        {note.document?.status === "ready" ? <Button variant="outline" size="sm" onClick={() => onLearn(note.document!)}><BookOpen size={14} aria-hidden="true" />{hi ? "पूरी गाइड पढ़ें" : "Read full guide"}</Button>
          : note.topic && <p className={styles.status}>{note.document ? hi ? "नोट्स अभी तैयार नहीं हैं। नीचे गाइड की स्थिति देखें।" : "Notes are not ready yet. Check the guide status below." : hi ? "इस विषय के नोट्स अभी आपकी लाइब्रेरी में नहीं हैं।" : "Notes for this topic are not in your library yet."}</p>}
      </>;
    }} />}
    {!loading && !entries.length && !failed.length && <p role="status"><ExpandedText text={hi ? "इस तकनीक के विषय अभी उपलब्ध नहीं हैं।" : "No topics are available for this technology yet."} /></p>}
  </div>;
}
