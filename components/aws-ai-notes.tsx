"use client";
import { ExpandedText } from "@/components/expanded-text";


import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, Sparkles } from "lucide-react";
import type { DocumentRecord } from "@/lib/domain";
import { requestJson } from "@/lib/client";
import { ServiceCatalog } from "./service-catalog";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import styles from "./aws-ai-notes.module.css";

export function AwsAiNotes({ document, aiOnly = true }: { document?: DocumentRecord; aiOnly?: boolean }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [curriculum, setCurriculum] = useState(document?.curriculum ?? null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!document || document.curriculum) return;
    let active = true;
    void requestJson<{ document: DocumentRecord }>(`/api/documents/${document.id}`)
      .then(result => { if (active) { setCurriculum(result.document.curriculum); setFailed(!result.document.curriculum); } })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [document, attempt]);
  return <section className={styles.notes} aria-labelledby="aws-ai-notes-title">
    <header className={styles.intro}>
      <span className={styles.icon}><BookOpen size={24} aria-hidden="true" /></span>
      <div><span className={styles.eyebrow}><Sparkles size={13} aria-hidden="true" /><ExpandedText text={hi ? "नोट्स · क्लाउड इंटेलिजेंस" : "NOTES · CLOUD INTELLIGENCE"} /></span>
        <h2 id="aws-ai-notes-title"><ExpandedText text={hi ? `${aiOnly ? "AWS AI" : "AWS"} सेवाएँ, सरल भाषा में` : `${aiOnly ? "AWS AI" : "AWS"} services, made clear`} /></h2>
        <p><ExpandedText text={hi ? "हर सेवा का उद्देश्य और मुख्य बातें, श्रेणी के अनुसार। हर पृष्ठ पर चार संदर्भ।" : "Purpose and key details, organized by category. Four references per category page."} /></p></div>
    </header>
    {!document ? <p role="status"><ExpandedText text={hi ? "AWS की तैयारी चुनें और अपनी लाइब्रेरी रिफ्रेश करें ताकि ये नोट्स यहाँ दिखें।" : "Choose AWS in your preparation and refresh your library to access these notes."} /></p>
      : failed ? <div role="alert"><p><ExpandedText text={hi ? "नोट्स लोड नहीं हो सके।" : "These notes could not be loaded."} /></p><Button variant="outline" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}><ExpandedText text={hi ? "फिर कोशिश करें" : "Try again"} /></Button></div>
      : !curriculum ? <p role="status"><ExpandedText text={hi ? "नोट्स लोड हो रहे हैं…" : "Loading your notes…"} /></p>
      : <><ServiceCatalog services={curriculum.services ?? []} hi={hi} grouped showReferences={false} />
        <details className={styles.sources}><summary><ExpandedText text={hi ? "आधिकारिक दस्तावेज़ और आगे की पढ़ाई" : "Official documentation & further reading"} /></summary><ul>{curriculum.sources?.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer"><ExpandedText text={source.title} /><ExternalLink size={12} aria-hidden="true" /></a></li>)}</ul></details></>}
  </section>;
}

export function AwsNotesLibrary({ documents }: { documents: DocumentRecord[] }) {
  const { language } = useLanguage();
  const [scope, setScope] = useState<"ai" | "all">("all");
  const document = documents.find(item => item.request.topicId === (scope === "ai" ? "aws-ai-services" : "aws-popular-services"));
  return <div>
    <div className={styles.scopes} role="group" aria-label={language === "hi" ? "नोट्स संग्रह" : "Notes collection"}>
      <Button variant={scope === "ai" ? "default" : "outline"} aria-pressed={scope === "ai"} onClick={() => setScope("ai")}><ExpandedText text={language === "hi" ? "AWS AI सेवाएँ" : "AWS AI services"} /></Button>
      <Button variant={scope === "all" ? "default" : "outline"} aria-pressed={scope === "all"} onClick={() => setScope("all")}><ExpandedText text={language === "hi" ? "सभी AWS सेवाएँ" : "All AWS services & capabilities"} /></Button>
    </div>
    <AwsAiNotes key={`${scope}:${document?.id ?? "empty"}`} document={document} aiOnly={scope === "ai"} />
  </div>;
}
