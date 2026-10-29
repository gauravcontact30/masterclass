"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookText, Braces, Check, ChevronLeft, ChevronRight, Code2, FileCode2, Languages, ListChecks, MessageSquareText, Puzzle, Search, Server, X } from "lucide-react";
import type { LandingProPreview } from "@/lib/landing-pro-preview";
import { ExpandedText } from "./expanded-text";
import { useLanguage } from "./language-provider";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-pro-sections.module.css";

/** Short pill label and logo (public/images/tech) per Techy topic id. */
const TECH_PILLS: Record<string, { label: string; icon: string }> = {
  aws: { label: "AWS", icon: "aws" }, "agentic-ai": { label: "Agentic AI", icon: "claude" }, nextjs: { label: "Next.js", icon: "nextjs" },
  tanstack: { label: "TanStack", icon: "tanstack" }, zustand: { label: "Zustand", icon: "zustand" }, vitest: { label: "Vitest", icon: "vitest" },
  playwright: { label: "Playwright", icon: "playwright" }, react: { label: "React", icon: "react" }, typescript: { label: "TypeScript", icon: "typescript" },
  docker: { label: "Docker", icon: "docker" }, python: { label: "Python", icon: "python" }, javascript: { label: "JS Puzzles", icon: "javascript" },
  "aws-ai": { label: "AWS AI", icon: "aws" }, "aws-all": { label: "AWS Atlas", icon: "aws" }, "aws-devops": { label: "AWS DevOps", icon: "aws" },
};
const TECHY_PAGE_SIZE = 6;

function useText() {
  const { language } = useLanguage();
  return { locale: language === "hi" ? "hi-IN" : "en-IN", text: (en: string, hindi: string) => language === "hi" ? hindi : en };
}

/**
 * Techy, shown the way it feels to use: a terminal-style session on one real topic. Pick a topic, read its summary
 * and key feature, then try today's interview question before revealing the model answer. Beside it, the six
 * ways each topic can be practised in the dashboard.
 */
export function LandingTechy({ data }: { data: LandingProPreview["techy"] }) {
  const { text, locale } = useText();
  const [topicId, setTopicId] = useState(data.topics[0]?.id);
  const [revealed, setRevealed] = useState(false);
  const [topicPage, setTopicPage] = useState(0);
  const topicPages = Math.ceil(data.topics.length / TECHY_PAGE_SIZE);
  const currentPage = Math.min(topicPage, Math.max(0, topicPages - 1));
  const topic = data.topics.find(item => item.id === topicId) ?? data.topics[0];
  const count = (value: number) => value.toLocaleString(locale);
  const modes = [
    { icon: BookText, title: text("Key features", "मुख्य विशेषताएँ"), body: text("Four crisp ideas per topic before you go deeper.", "गहराई से पहले हर विषय के चार स्पष्ट विचार।") },
    { icon: MessageSquareText, title: text("Subjective test", "विषयनिष्ठ परीक्षा"), body: text("Answer out loud, then compare with a short model answer.", "खुद उत्तर दें, फिर संक्षिप्त आदर्श उत्तर से मिलाएँ।") },
    { icon: ListChecks, title: text("Objective quiz", "वस्तुनिष्ठ क्विज़"), body: text("The same concepts as multiple choice, with explanations.", "वही अवधारणाएँ बहुविकल्पीय रूप में, व्याख्या सहित।") },
    { icon: Code2, title: text("Code examples", "कोड उदाहरण"), body: text("Connected multi-file projects in an editor-style reader.", "एडिटर जैसे रीडर में जुड़ी हुई मल्टी-फ़ाइल परियोजनाएँ।") },
    { icon: Puzzle, title: text("Code puzzles", "कोड पहेलियाँ"), body: text("Predict the output, then see why it prints what it does.", "आउटपुट का अनुमान लगाएँ, फिर देखें कि वह ऐसा क्यों छपता है।") },
    { icon: Languages, title: text("Corporate English", "कॉर्पोरेट अंग्रेज़ी"), body: text("Workplace words with synonyms and real sentences.", "पर्यायवाची और असली वाक्यों सहित कार्यस्थल के शब्द।") },
  ];
  if (!topic) return null;
  const pick = (id: string) => { setTopicId(id); setRevealed(false); };
  return <section id="techy" className={frame.section} data-ground="wash" aria-labelledby="landing-techy-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><Code2 size={14} aria-hidden="true" />Techy<span>{text(`${count(data.topics.length)} topics`, `${count(data.topics.length)} विषय`)}</span></p>
        <h2 id="landing-techy-title">{text("Walk into the interview ", "इंटरव्यू में जाएँ ")}<em>{text("already fluent.", "पूरी तैयारी के साथ।")}</em></h2>
      </div>
      <div>
        <p className={frame.lede}><ExpandedText text={text("The frameworks, cloud services and testing tools teams hire for, each one explained, questioned and coded. Try a real topic below: read it, answer today's interview question, then check yourself against the model answer.", "वे फ़्रेमवर्क, क्लाउड सेवाएँ और टेस्टिंग टूल जिनके लिए टीमें भर्ती करती हैं, हर एक समझाया, पूछा और कोड किया गया। नीचे एक असली विषय आज़माएँ: पढ़ें, आज का इंटरव्यू प्रश्न हल करें, फिर आदर्श उत्तर से मिलाएँ।")} /></p>
        <dl className={frame.facts}>
          <div><dt>{text("Practice questions", "अभ्यास प्रश्न")}</dt><dd>{count(data.questionCount)}</dd></div>
          <div><dt>{text("Code puzzles", "कोड पहेलियाँ")}</dt><dd>{count(data.puzzleCount)}</dd></div>
          <div><dt>{text("Workplace words", "कार्यस्थल शब्द")}</dt><dd>{count(data.vocabularyCount)}</dd></div>
        </dl>
      </div>
    </header>
    <div className={styles.techyGrid}>
      <article className={styles.terminal} aria-label={text("Techy topic preview", "Techy विषय पूर्वावलोकन")}>
        <div className={styles.termBar}><span className={styles.dots} aria-hidden="true"><i/><i/><i/></span><span className={styles.termPath}>~/techy/{topic.id}</span></div>
        <div className={styles.topics} role="group" aria-label={text("Choose a topic", "विषय चुनें")}>
          {data.topics.slice(currentPage * TECHY_PAGE_SIZE, (currentPage + 1) * TECHY_PAGE_SIZE).map(item => <button type="button" key={item.id} aria-pressed={item.id === topic.id} onClick={() => pick(item.id)} title={item.title} aria-label={item.title}>
            {TECH_PILLS[item.id] && <Image src={`/images/tech/${TECH_PILLS[item.id].icon}.png`} alt={`${TECH_PILLS[item.id].label} logo`} aria-hidden="true" width={14} height={14} />}
            {TECH_PILLS[item.id]?.label ?? item.title}
          </button>)}
        </div>
        {topicPages > 1 && <nav className={styles.topicPagination} aria-label={text("Techy topic pages", "Techy विषय पृष्ठ")}>
          <button type="button" disabled={currentPage === 0} onClick={() => setTopicPage(currentPage - 1)} aria-label={text("Previous Techy topics", "पिछले Techy विषय")} title={text("Previous Techy topics", "पिछले Techy विषय")}><ChevronLeft size={16} aria-hidden="true" /></button>
          {Array.from({ length: topicPages }, (_, index) => <button type="button" key={index} aria-label={text(`Techy topics page ${index + 1}`, `Techy विषय पृष्ठ ${index + 1}`)} aria-current={currentPage === index ? "page" : undefined} onClick={() => setTopicPage(index)}>{index + 1}</button>)}
          <span role="status">{text(`Page ${currentPage + 1} of ${topicPages}`, `पृष्ठ ${currentPage + 1} / ${topicPages}`)}</span>
          <button type="button" disabled={currentPage === topicPages - 1} onClick={() => setTopicPage(currentPage + 1)} aria-label={text("Next Techy topics", "अगले Techy विषय")} title={text("Next Techy topics", "अगले Techy विषय")}><ChevronRight size={16} aria-hidden="true" /></button>
        </nav>}
        <div className={styles.screen} key={topic.id}>
          <p className={styles.prompt} aria-hidden="true"><b>❯</b> techy open {topic.id}</p>
          <p className={styles.meta}>{topic.category} · {text(`${count(topic.questionCount)} questions`, `${count(topic.questionCount)} प्रश्न`)}</p>
          <h3>{topic.title}</h3>
          <p className={styles.summary}><ExpandedText text={topic.summary} /></p>
          {topic.feature && <p className={styles.feature}><Check size={15} aria-hidden="true" /><ExpandedText text={topic.feature} /></p>}
          <div className={styles.question}>
            <p className={styles.qLabel}>{text(`Interview question ${count(topic.questionNumber)} of ${count(topic.questionCount)}`, `इंटरव्यू प्रश्न ${count(topic.questionNumber)} / ${count(topic.questionCount)}`)}</p>
            <h4><ExpandedText text={topic.question} /></h4>
            <button type="button" className={styles.reveal} aria-expanded={revealed} aria-controls="landing-techy-answer" onClick={() => setRevealed(value => !value)}><b aria-hidden="true">❯</b>{revealed ? text("Hide answer", "उत्तर छिपाएँ") : text("Reveal model answer", "आदर्श उत्तर देखें")}</button>
            <p id="landing-techy-answer" className={styles.answer} hidden={!revealed}><ExpandedText text={topic.answer} /></p>
          </div>
        </div>
      </article>
      <div className={styles.modes}>
        <h3>{text("Six ways to practise every topic", "हर विषय के अभ्यास के छह तरीके")}</h3>
        <ul>{modes.map(mode => <li key={mode.title}><span aria-hidden="true"><mode.icon size={17} /></span><div><h4>{mode.title}</h4><p>{mode.body}</p></div></li>)}</ul>
      </div>
    </div>
    <div className={frame.actions}><Link className={frame.cta} href="/learning/techy">{text("Open Techy", "Techy खोलें")}<ArrowRight size={16} aria-hidden="true" /></Link><small>{text("Included with your account. Sign in to start practising.", "आपके खाते में शामिल। अभ्यास के लिए साइन इन करें।")}</small></div>
  </div></section>;
}

/**
 * API Docs as a working command palette: filter technologies and identifiers in one field, pick a technology,
 * then narrow its identifiers by type. Every row is a real entry from the dashboard's reference.
 */
export function LandingApiDocs({ data }: { data: LandingProPreview["api"] }) {
  const { text, locale } = useText();
  const [query, setQuery] = useState("");
  // The server puts today's technology first (landingProPreview rotates them daily).
  const [packageId, setPackageId] = useState(data.packages[0]?.id);
  const [kind, setKind] = useState<string>("all");
  const normalized = query.trim().toLowerCase();
  const matches = data.packages.filter(pkg => !normalized || pkg.name.toLowerCase().includes(normalized) || pkg.sample.some(entry => entry.name.toLowerCase().includes(normalized)));
  const selected = matches.find(pkg => pkg.id === packageId) ?? matches[0];
  const typeOf = (k: string) => data.types.find(type => type.k === k);
  const usedKinds = data.types.filter(type => selected?.sample.some(entry => entry.kind === type.k));
  const activeKind = usedKinds.some(type => type.k === kind) ? kind : "all";
  const nameMatches = !!selected && !!normalized && !selected.name.toLowerCase().includes(normalized);
  const entries = (selected?.sample ?? []).filter(entry => (activeKind === "all" || entry.kind === activeKind) && (!nameMatches || entry.name.toLowerCase().includes(normalized)));
  const count = (value: number) => value.toLocaleString(locale);
  const choose = (id: string) => { setPackageId(id); setKind("all"); };
  const points = [
    { icon: Search, title: text("Search across every stack", "हर स्टैक में खोजें"), body: text("Filter by technology, identifier type and status in one place.", "तकनीक, पहचानकर्ता प्रकार और स्थिति से एक जगह फ़िल्टर करें।") },
    { icon: Braces, title: text("Signatures you can read", "पढ़ने योग्य सिग्नेचर"), body: text("Parameters, return values, key points and focused usage code.", "पैरामीटर, रिटर्न वैल्यू, मुख्य बिंदु और केंद्रित उपयोग कोड।") },
    { icon: Server, title: text("Linked to the source", "मूल स्रोत से जुड़ा"), body: text("Every entry points to its official docs for version-specific detail.", "हर प्रविष्टि संस्करण-विशेष जानकारी के लिए आधिकारिक डॉक्स से जुड़ी है।") },
  ];
  return <section id="api-docs" className={frame.section} data-ground="paper" aria-labelledby="landing-api-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><FileCode2 size={14} aria-hidden="true" />API Docs<span>{text(`${count(data.identifierCount)} identifiers`, `${count(data.identifierCount)} पहचानकर्ता`)}</span></p>
        <h2 id="landing-api-title">{text("Every identifier, ", "हर पहचानकर्ता, ")}<em>{text("one calm reference.", "एक शांत संदर्भ में।")}</em></h2>
      </div>
      <div>
        <p className={frame.lede}>{text("Hooks, classes, functions and CLI commands, from AI tooling to databases, testing and cloud, organised so you find the right API in seconds. Search the real index below.", "AI टूलिंग से डेटाबेस, टेस्टिंग और क्लाउड तक hooks, classes, functions और CLI कमांड, व्यवस्थित ताकि सही API सेकंडों में मिले। नीचे असली सूची खोजें।")}</p>
        <dl className={frame.facts}>
          <div><dt>{text("Technologies", "तकनीकें")}</dt><dd>{count(data.packages.length)}</dd></div>
          <div><dt>{text("Identifier types", "प्रकार")}</dt><dd>{count(data.types.length)}</dd></div>
          <div><dt>{text("Status labels", "स्थिति लेबल")}</dt><dd>{count(data.statusCount)}</dd></div>
        </dl>
      </div>
    </header>
    <article className={styles.palette} aria-label={text("API reference preview", "API संदर्भ पूर्वावलोकन")}>
      <div className={styles.paletteSearch}>
        <Search size={18} aria-hidden="true" />
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={text("Filter technologies or identifiers, e.g. useState", "तकनीक या पहचानकर्ता खोजें, जैसे useState")} aria-label={text("Filter technologies", "तकनीक खोजें")} />
        {query && <button type="button" onClick={() => setQuery("")} aria-label={text("Clear search", "खोज साफ़ करें")}><X size={15} /></button>}
      </div>
      <div className={styles.paletteBody}>
        <div className={styles.packages} role="group" aria-label={text("Technologies", "तकनीकें")}>
          {matches.map(pkg => <button type="button" key={pkg.id} aria-pressed={pkg.id === selected?.id} onClick={() => choose(pkg.id)} style={{ "--accent": pkg.accent } as CSSProperties}><span aria-hidden="true">{pkg.icon}</span><b>{pkg.name}</b><small>{count(pkg.count)}</small></button>)}
          {!matches.length && <p className={styles.noMatch} role="status">{text("No technology matches that search.", "इस खोज से कोई तकनीक नहीं मिली।")}</p>}
        </div>
        {selected && <div className={styles.entries}>
          <div className={styles.entriesHead}>
            <h3><span aria-hidden="true">{selected.icon}</span>{selected.name}</h3>
            <span role="status">{text(`${count(selected.count)} identifiers`, `${count(selected.count)} पहचानकर्ता`)}</span>
          </div>
          {usedKinds.length > 1 && <div className={styles.kinds} role="group" aria-label={text("Identifier type", "पहचानकर्ता प्रकार")}>
            <button type="button" aria-pressed={activeKind === "all"} onClick={() => setKind("all")}>{text("All types", "सभी प्रकार")}</button>
            {usedKinds.map(type => <button type="button" key={type.k} aria-pressed={activeKind === type.k} onClick={() => setKind(type.k)} style={{ "--badge": type.c } as CSSProperties}><i aria-hidden="true" />{type.label}</button>)}
          </div>}
          <ul className={styles.entryList}>{entries.map(entry => { const type = typeOf(entry.kind); return <li key={entry.name} style={{ "--badge": type?.c ?? "#87867f" } as CSSProperties}><span className={styles.badge} title={type?.label}>{entry.kind}</span><code>{entry.name}</code><small>{type?.label}</small></li>; })}</ul>
          {!entries.length && <p className={styles.noMatch} role="status">{text("No identifier in this sample matches. The full reference has the rest.", "इस नमूने में कोई पहचानकर्ता नहीं मिला। पूरे संदर्भ में बाकी हैं।")}</p>}
        </div>}
      </div>
      <ul className={styles.points}>{points.map(point => <li key={point.title}><point.icon size={17} aria-hidden="true" /><div><h4>{point.title}</h4><p>{point.body}</p></div></li>)}</ul>
    </article>
    <div className={frame.actions}><Link className={frame.cta} href="/learning/api-docs">{text("Browse the API reference", "API संदर्भ देखें")}<ArrowUpRight size={16} aria-hidden="true" /></Link><small>{text("Each entry is marked stable, preview, experimental or deprecated.", "हर प्रविष्टि स्थिर, प्रीव्यू, प्रायोगिक या अप्रचलित चिह्नित है।")}</small></div>
  </div></section>;
}
