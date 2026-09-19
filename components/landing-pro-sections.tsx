"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookText, Braces, CheckCircle2, Code2, Eye, EyeOff, Languages, ListChecks, MessageSquareText, Puzzle, Search, Server, X } from "lucide-react";
import type { LandingProPreview } from "@/lib/landing-pro-preview";
import { ExpandedText } from "./expanded-text";
import { useLanguage } from "./language-provider";
import styles from "./landing-pro-sections.module.css";

/** Short pill label and logo (public/images/tech) per Techy topic id. */
const TECH_PILLS: Record<string, { label: string; icon: string }> = {
  aws: { label: "AWS", icon: "aws" }, "agentic-ai": { label: "Agentic AI", icon: "claude" }, nextjs: { label: "Next.js", icon: "nextjs" },
  tanstack: { label: "TanStack", icon: "tanstack" }, zustand: { label: "Zustand", icon: "zustand" }, vitest: { label: "Vitest", icon: "vitest" },
  playwright: { label: "Playwright", icon: "playwright" }, react: { label: "React", icon: "react" }, typescript: { label: "TypeScript", icon: "typescript" },
  docker: { label: "Docker", icon: "docker" }, python: { label: "Python", icon: "python" }, javascript: { label: "JS Puzzles", icon: "javascript" },
  "aws-ai": { label: "AWS AI", icon: "aws" }, "aws-all": { label: "AWS Atlas", icon: "aws" }, "aws-devops": { label: "AWS DevOps", icon: "aws" },
};

function useText() {
  const { language } = useLanguage();
  return { locale: language === "hi" ? "hi-IN" : "en-IN", text: (en: string, hindi: string) => language === "hi" ? hindi : en };
}

export function LandingTechy({ data }: { data: LandingProPreview["techy"] }) {
  const { text, locale } = useText();
  const [topicId, setTopicId] = useState(data.topics[0]?.id);
  const [revealed, setRevealed] = useState(false);
  const topic = data.topics.find(item => item.id === topicId) ?? data.topics[0];
  const count = (value: number) => value.toLocaleString(locale);
  const modes = [
    { icon: BookText, title: text("Key features", "मुख्य विशेषताएँ"), body: text("Four crisp ideas per topic before you go deeper.", "गहराई से पहले हर विषय के चार स्पष्ट विचार।") },
    { icon: MessageSquareText, title: text("Subjective test", "विषयनिष्ठ परीक्षा"), body: text("Answer out loud, then compare with a short model answer.", "खुद उत्तर दें, फिर संक्षिप्त आदर्श उत्तर से मिलाएँ।") },
    { icon: ListChecks, title: text("Objective quiz", "वस्तुनिष्ठ क्विज़"), body: text("The same concepts as multiple choice, with explanations.", "वही अवधारणाएँ बहुविकल्पीय रूप में, व्याख्या सहित।") },
    { icon: Code2, title: text("Code examples", "कोड उदाहरण"), body: text("Connected multi-file projects in an editor-style reader.", "एडिटर जैसे रीडर में जुड़ी हुई मल्टी-फ़ाइल परियोजनाएँ।") },
    { icon: Puzzle, title: text("Code puzzles", "कोड पहेलियाँ"), body: text(`${count(data.puzzleCount)} predict-the-output challenges to sharpen your reading.`, `कोड पढ़ने की समझ के लिए ${count(data.puzzleCount)} आउटपुट पहेलियाँ।`) },
    { icon: Languages, title: text("Corporate English", "कॉर्पोरेट अंग्रेज़ी"), body: text(`${count(data.vocabularyCount)} workplace words with synonyms and real sentences.`, `पर्यायवाची और वाक्यों सहित ${count(data.vocabularyCount)} कार्यस्थल शब्द।`) },
  ];
  if (!topic) return null;
  return <section id="techy" className={styles.techy} aria-labelledby="landing-techy-title">
    <div className={styles.container}>
      <div className={styles.intro}>
        <div><span className={styles.eyebrow}><span className={styles.spark} aria-hidden="true"/>{text("TECHY · FOR TECH PROFESSIONALS", "TECHY · टेक प्रोफ़ेशनल्स के लिए")}</span><h2 id="landing-techy-title">{text("Walk into the interview", "इंटरव्यू में जाएँ")} <em>{text("already fluent.", "पूरी तैयारी के साथ।")}</em></h2></div>
        <div className={styles.introAside}><p><ExpandedText text={text("A curated library for engineers who ship: the frameworks, cloud services and testing tools teams actually hire for—explained, questioned and coded.", "काम करने वाले इंजीनियरों के लिए चुनी हुई लाइब्रेरी: वे फ़्रेमवर्क, क्लाउड सेवाएँ और टेस्टिंग टूल जिनके लिए टीमें भर्ती करती हैं—समझाए, पूछे और कोड किए गए।")} /></p>
          <dl className={styles.stats}><div><dt>{text("Topics", "विषय")}</dt><dd>{count(data.topics.length)}</dd></div><div><dt>{text("Practice questions", "अभ्यास प्रश्न")}</dt><dd>{count(data.questionCount)}</dd></div><div><dt>{text("Learning modes", "सीखने के तरीके")}</dt><dd>{count(modes.length)}</dd></div></dl>
        </div>
      </div>
      <div className={styles.techyGrid}>
        <ul className={styles.modes}>{modes.map(mode => <li key={mode.title}><span className={styles.modeIcon}><mode.icon size={18} aria-hidden="true"/></span><div><h3>{mode.title}</h3><p>{mode.body}</p></div></li>)}</ul>
        <article className={styles.preview} aria-label={text("Techy topic preview", "Techy विषय पूर्वावलोकन")}>
          <header className={styles.previewBar}><span className={styles.dots} aria-hidden="true"><i/><i/><i/></span><span>techy / {topic.id}</span><small>{text("Preview", "पूर्वावलोकन")}</small></header>
          <div className={styles.chips} role="group" aria-label={text("Choose a topic", "विषय चुनें")}>
            {/* Two identical sets translate by half the track for a seamless loop; the copy is hidden from assistive tech and the tab order. */}
            <div className={styles.chipTrack}>{[0, 1].map(copy => <div className={styles.chipSet} key={copy} aria-hidden={copy === 1 || undefined}>{data.topics.map((item, index) => <button key={item.id} data-tone={index % 15} tabIndex={copy === 1 ? -1 : undefined} aria-pressed={item.id === topic.id} onClick={() => { setTopicId(item.id); setRevealed(false); }} title={item.title} aria-label={item.title}>{TECH_PILLS[item.id] && <Image src={`/images/tech/${TECH_PILLS[item.id].icon}.png`} alt="" width={14} height={14} />}{TECH_PILLS[item.id]?.label ?? item.title}</button>)}</div>)}</div>
          </div>
          <div className={styles.previewBody}>
            <p className={styles.category}>{topic.category} · {text(`${count(topic.questionCount)} questions`, `${count(topic.questionCount)} प्रश्न`)}</p>
            <h3>{topic.title}</h3>
            <p className={styles.summary}><ExpandedText text={topic.summary} /></p>
            <p className={styles.feature}><CheckCircle2 size={16} aria-hidden="true"/><ExpandedText text={topic.feature} /></p>
            <div className={styles.question}>
              <span>{text("INTERVIEW QUESTION 01", "इंटरव्यू प्रश्न 01")}</span>
              <h4><ExpandedText text={topic.question} /></h4>
              <button className={styles.reveal} aria-expanded={revealed} aria-controls="landing-techy-answer" onClick={() => setRevealed(value => !value)}>{revealed ? <EyeOff size={15} aria-hidden="true"/> : <Eye size={15} aria-hidden="true"/>}{revealed ? text("Hide answer", "उत्तर छिपाएँ") : text("Reveal model answer", "आदर्श उत्तर देखें")}</button>
              <p id="landing-techy-answer" className={styles.answer} hidden={!revealed}><ExpandedText text={topic.answer} /></p>
            </div>
          </div>
        </article>
      </div>
      <div className={styles.actions}><Link className={styles.primary} href="/dashboard/techy">{text("Open Techy", "Techy खोलें")}<ArrowRight size={16} aria-hidden="true"/></Link><small>{text("Included with your account · sign in to start practising", "आपके खाते में शामिल · अभ्यास के लिए साइन इन करें")}</small></div>
    </div>
  </section>;
}

export function LandingApiDocs({ data }: { data: LandingProPreview["api"] }) {
  const { text, locale } = useText();
  const [query, setQuery] = useState("");
  const [packageId, setPackageId] = useState(data.packages.find(pkg => pkg.id === "nextjs")?.id ?? data.packages[0]?.id);
  const normalized = query.trim().toLowerCase();
  const matches = data.packages.filter(pkg => !normalized || pkg.name.toLowerCase().includes(normalized) || pkg.sample.some(entry => entry.name.toLowerCase().includes(normalized)));
  const selected = data.packages.find(pkg => pkg.id === packageId) ?? matches[0];
  const typeOf = (kind: string) => data.types.find(type => type.k === kind);
  const usedKinds = new Set(selected?.sample.map(entry => entry.kind));
  const count = (value: number) => value.toLocaleString(locale);
  const points = [
    { icon: Search, title: text("Search across every stack", "हर स्टैक में खोजें"), body: text("Filter by package, identifier type and status in one place.", "पैकेज, पहचानकर्ता प्रकार और स्थिति से एक जगह फ़िल्टर करें।") },
    { icon: Braces, title: text("Signatures you can read", "पढ़ने योग्य सिग्नेचर"), body: text("Parameters, return values, key points and focused usage code.", "पैरामीटर, रिटर्न वैल्यू, मुख्य बिंदु और केंद्रित उपयोग कोड।") },
    { icon: Server, title: text("Linked to the source", "मूल स्रोत से जुड़ा"), body: text("Every entry points to official docs for version-specific detail.", "हर प्रविष्टि संस्करण-विशेष जानकारी के लिए आधिकारिक डॉक्स से जुड़ी है।") },
  ];
  return <section id="api-docs" className={styles.api} aria-labelledby="landing-api-title">
    <div className={styles.container}>
      <div className={styles.intro}>
        <div><span className={styles.eyebrow}><span className={styles.spark} aria-hidden="true"/>{text("API DOCS · DEVELOPER REFERENCE", "API DOCS · डेवलपर संदर्भ")}</span><h2 id="landing-api-title">{text("Every identifier,", "हर पहचानकर्ता,")} <em>{text("one calm reference.", "एक शांत संदर्भ में।")}</em></h2></div>
        <div className={styles.introAside}><p>{text("Hooks, classes, functions and CLI commands from AI tooling to databases, testing and cloud—organised so you find the right API in seconds.", "AI टूलिंग से डेटाबेस, टेस्टिंग और क्लाउड तक hooks, classes, functions और CLI कमांड—व्यवस्थित, ताकि सही API सेकंडों में मिले।")}</p>
          <dl className={styles.stats}><div><dt>{text("Technologies", "तकनीकें")}</dt><dd>{count(data.packages.length)}</dd></div><div><dt>{text("Identifiers", "पहचानकर्ता")}</dt><dd>{count(data.identifierCount)}</dd></div><div><dt>{text("Identifier types", "प्रकार")}</dt><dd>{count(data.types.length)}</dd></div></dl>
        </div>
      </div>
      <div className={styles.apiGrid}>
        <article className={styles.console} aria-label={text("API reference preview", "API संदर्भ पूर्वावलोकन")}>
          <header className={styles.previewBar}><span className={styles.dots} aria-hidden="true"><i/><i/><i/></span><span>api-docs / {selected?.id ?? ""}</span><small>{text("Preview", "पूर्वावलोकन")}</small></header>
          <div className={styles.consoleBody}>
            <div className={styles.packageColumn}>
              <Label className={styles.search}><Search size={15} aria-hidden="true"/><Input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={text("Filter technologies…", "तकनीक खोजें…")} aria-label={text("Filter technologies", "तकनीक खोजें")}/>{query && <button onClick={() => setQuery("")} aria-label={text("Clear search", "खोज साफ़ करें")}><X size={14}/></button>}</Label>
              <div className={styles.packageList} role="group" aria-label={text("Technologies", "तकनीकें")}>{matches.map(pkg => <button key={pkg.id} aria-pressed={pkg.id === selected?.id} onClick={() => setPackageId(pkg.id)} style={{ "--accent": pkg.accent } as CSSProperties}><span aria-hidden="true">{pkg.icon}</span>{pkg.name}<small>{count(pkg.count)}</small></button>)}{!matches.length && <p className={styles.noMatch} role="status">{text("No technology matches that search.", "इस खोज से कोई तकनीक नहीं मिली।")}</p>}</div>
            </div>
            {selected && <div className={styles.entries}>
              <div className={styles.entriesHead}><h3><span aria-hidden="true">{selected.icon}</span>{selected.name}</h3><span role="status">{text(`${count(selected.count)} identifiers`, `${count(selected.count)} पहचानकर्ता`)}</span></div>
              <ul className={styles.entryList}>{selected.sample.map(entry => { const type = typeOf(entry.kind); return <li key={entry.name}><span className={styles.badge} style={{ "--badge": type?.c ?? "#87867f" } as CSSProperties} title={type?.label}>{entry.kind}</span><code>{entry.name}</code><small>{type?.label}</small></li>; })}</ul>
              <div className={styles.legend}>{data.types.filter(type => usedKinds.has(type.k)).map(type => <span key={type.k}><i style={{ background: type.c }} aria-hidden="true"/>{type.label}</span>)}</div>
            </div>}
          </div>
        </article>
        <ul className={styles.apiPoints}>{points.map(point => <li key={point.title}><span className={styles.modeIcon}><point.icon size={18} aria-hidden="true"/></span><div><h3>{point.title}</h3><p>{point.body}</p></div></li>)}
          <li className={styles.apiCta}><Link className={styles.primary} href="/dashboard/api-docs">{text("Browse the API reference", "API संदर्भ देखें")}<ArrowUpRight size={16} aria-hidden="true"/></Link><small>{text(`${count(data.statusCount)} status labels: stable, preview, experimental and deprecated`, `${count(data.statusCount)} स्थिति लेबल: स्थिर, प्रीव्यू, प्रायोगिक और अप्रचलित`)}</small></li>
        </ul>
      </div>
    </div>
  </section>;
}
