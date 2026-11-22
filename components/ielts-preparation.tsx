"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { BookOpen, Calculator, LayoutGrid, CalendarCheck, CheckCircle2, ChevronDown, ClipboardCheck, Clock, ExternalLink, Headphones, Lightbulb, MessageSquareText, Mic, PenLine, Play, RotateCcw, Shuffle, Sparkles, Square, Target, XCircle } from "lucide-react";
import { RouteH1 } from "@/components/route-heading";
import { useLanguage } from "./language-provider";
import { LanguageSwitch } from "./language-switch";
import {
  FACTS, FORMAT, LINKING, LISTENING, LISTENING_TIPS, MISTAKES, OFFICIAL_LINKS, RAW_TABLES, READING, READING_TIPS, SKILLS, SPEAKING_CRITERIA,
  SPEAKING_CUE_CARDS, SPEAKING_PART1, STRATEGIES, STUDY_PLAN, TEST_DAY, TOPIC_VOCAB, UPGRADES, WRITING, WRITING_CRITERIA,
  overallBand, rawToBand, type Skill, type TestType, type WritingTask,
} from "@/lib/ielts-content";
import { IeltsTopics } from "./ielts-topics";
import { IELTS_TOPICS } from "@/lib/ielts-topics";
import styles from "./ielts-preparation.module.css";

const SKILL_ICON: Record<Skill, typeof Headphones> = { Listening: Headphones, Reading: BookOpen, Writing: PenLine, Speaking: Mic };
const SKILL_TONE: Record<Skill, string> = { Listening: "#2f6fb0", Reading: "#2f7d5b", Writing: "#b7791f", Speaking: "#c0475f" };
const SECTIONS = [
  { id: "ielts-overview", en: "Overview", hi: "परिचय" },
  { id: "ielts-practice", en: "Practice lab", hi: "अभ्यास" },
  { id: "ielts-bands", en: "Band calculator", hi: "बैंड कैलकुलेटर" },
  { id: "ielts-topics", en: "Topics & Themes", hi: "विषय और थीम" },
  { id: "ielts-strategies", en: "Strategies", hi: "रणनीतियाँ" },
  { id: "ielts-language", en: "Vocabulary", hi: "शब्दावली" },
  { id: "ielts-plan", en: "Study plan", hi: "अध्ययन योजना" },
  { id: "ielts-test-day", en: "Test day", hi: "परीक्षा दिवस" },
] as const;
const BANDS = Array.from({ length: 19 }, (_, index) => index / 2);
const PLAN_KEY = "mc:ielts:plan:v1";
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const countWords = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;

/** A countdown that ticks once a second while running, stops at zero and then calls `onDone`. */
function useCountdown(initial: number, onDone?: () => void) {
  const [seconds, setSeconds] = useState(initial);
  const [running, setRunning] = useState(false);
  const left = useRef(initial);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      left.current = Math.max(0, left.current - 1);
      setSeconds(left.current);
      if (left.current === 0) { setRunning(false); done.current?.(); }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  return {
    seconds, running,
    start: (from = initial) => { left.current = from; setSeconds(from); setRunning(true); },
    stop: () => setRunning(false),
    reset: (to = initial) => { left.current = to; setRunning(false); setSeconds(to); },
  };
}
const noSubscribe = () => () => {};

/**
 * The IELTS preparation hub inside the Learning Dashboard (/learning/ielts): the test format, an interactive practice
 * lab for all four skills, a band calculator, question-type strategies, topic vocabulary, a four-week study plan and a
 * test-day checklist. Practice material is original, not official IELTS questions; links go to ielts.org for those.
 */
export function IeltsPreparation() {
  const { language } = useLanguage(); const hi = language === "hi";
  const tr = (en: string, hindi: string) => hi ? hindi : en;
  const [type, setType] = useState<TestType>("academic");
  const [skill, setSkill] = useState<Skill>("Listening");

  return <section className={styles.page} aria-labelledby="ielts-title">
    {/* Hero: who it is for, the test type switch and the key facts. */}
    <header className={styles.hero}>
      <div className={styles.heroText}>
        <p className={styles.kicker}><Sparkles size={14} aria-hidden="true" />{tr("For students and professionals worldwide", "दुनिया भर के विद्यार्थियों और पेशेवरों के लिए")}</p>
        <RouteH1 id="ielts-title">IELTS <span>{tr("preparation hub", "तैयारी केंद्र")}</span></RouteH1>
        <p className={styles.lede}>{tr("Learn the format, practise every skill with instant feedback, and follow a clear plan to your target band. Practice is in English, with optional Hindi guidance.", "परीक्षा का प्रारूप समझें, तुरंत फ़ीडबैक के साथ हर कौशल का अभ्यास करें और लक्ष्य बैंड तक एक स्पष्ट योजना अपनाएँ। अभ्यास अंग्रेज़ी में है, हिन्दी मार्गदर्शन वैकल्पिक है।")}</p>
        <LanguageSwitch />
      </div>
      <div className={styles.types} role="group" aria-label="IELTS test type">
        <button type="button" aria-pressed={type === "academic"} onClick={() => setType("academic")}>
          <b>Academic</b><small>{tr("Higher education and professional registration", "उच्च शिक्षा और पेशेवर पंजीकरण")}</small>
        </button>
        <button type="button" aria-pressed={type === "general"} onClick={() => setType("general")}>
          <b>General Training</b><small>{tr("Everyday English, training and migration", "रोज़मर्रा की अंग्रेज़ी, प्रशिक्षण और प्रवास")}</small>
        </button>
      </div>
      <dl className={styles.facts}>{FACTS.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    </header>

    <nav className={styles.sectionNav} aria-label={tr("IELTS hub sections", "IELTS केंद्र के भाग")}>
      {SECTIONS.map(section => <a key={section.id} href={`#${section.id}`}>{hi ? section.hi : section.en}</a>)}
    </nav>

    {/* 1. Format overview */}
    <section id="ielts-overview" className={styles.block} aria-labelledby="ielts-overview-h">
      <SectionHead id="ielts-overview-h" icon={<Target size={16} />} kicker={tr("The test at a glance", "परीक्षा एक नज़र में")} title={tr("Four skills, one band score", "चार कौशल, एक बैंड स्कोर")}
        lede={tr("Listening and Speaking are the same in both tests; Reading and Writing differ. Confirm the test type your university, employer or visa authority needs.", "Listening और Speaking दोनों में समान हैं; Reading और Writing अलग हैं। अपनी संस्था से आवश्यक परीक्षा प्रकार की पुष्टि करें।")} />
      <ul className={styles.formatGrid}>
        {SKILLS.map(item => { const Icon = SKILL_ICON[item]; const f = FORMAT[item]; return <li key={item} style={{ "--tone": SKILL_TONE[item] } as CSSProperties}>
          <span className={styles.formatIcon} aria-hidden="true"><Icon size={18} /></span>
          <h3>{item}{hi && <small lang="hi">{f.hi}</small>}</h3>
          <p className={styles.formatMeta}><span><Clock size={12} aria-hidden="true" />{f.minutes}</span><span>{f.parts}</span><span>{f.questions}</span></p>
          <p>{f.tests}</p>
          <p className={styles.formatDiff}>{f.diff}</p>
        </li>; })}
      </ul>
    </section>

    {/* 2. Practice lab */}
    <section id="ielts-practice" className={styles.block} aria-labelledby="ielts-practice-h">
      <SectionHead id="ielts-practice-h" icon={<Sparkles size={16} />} kicker={tr("Practice lab", "अभ्यास प्रयोगशाला")} title={tr("Practise with instant feedback", "तुरंत फ़ीडबैक के साथ अभ्यास")}
        lede={tr(`Original exercises in the IELTS style. Reading and Writing follow your ${type === "academic" ? "Academic" : "General Training"} choice above.`, `IELTS शैली के मौलिक अभ्यास। Reading और Writing ऊपर चुने गए ${type === "academic" ? "Academic" : "General Training"} के अनुसार हैं।`)} />
      <div className={styles.skillTabs} role="group" aria-label="IELTS skills">
        {SKILLS.map(item => { const Icon = SKILL_ICON[item]; return <button type="button" key={item} aria-pressed={skill === item} onClick={() => setSkill(item)} style={{ "--tone": SKILL_TONE[item] } as CSSProperties}>
          <Icon size={16} aria-hidden="true" />{item}
        </button>; })}
      </div>
      <div className={styles.lab} style={{ "--tone": SKILL_TONE[skill] } as CSSProperties}>
        {skill === "Listening" && <ListeningLab tr={tr} />}
        {skill === "Reading" && <ReadingLab key={type} type={type} tr={tr} />}
        {skill === "Writing" && <WritingLab type={type} tr={tr} />}
        {skill === "Speaking" && <SpeakingLab tr={tr} />}
      </div>
    </section>

    {/* 3. Band calculator */}
    <section id="ielts-bands" className={styles.block} aria-labelledby="ielts-bands-h">
      <SectionHead id="ielts-bands-h" icon={<Calculator size={16} />} kicker={tr("Scoring", "अंक")} title={tr("Work out your band score", "अपना बैंड स्कोर निकालें")}
        lede={tr("Your overall band is the average of the four skills, rounded to the nearest half band.", "आपका कुल बैंड चारों कौशलों का औसत है, जिसे निकटतम आधे बैंड तक पूर्णांकित किया जाता है।")} />
      <BandCalculator type={type} tr={tr} />
    </section>

    {/* Topics & Themes: picture cards for every recurring Writing Task 2 and Speaking theme. */}
    <section id="ielts-topics" className={styles.block} aria-labelledby="ielts-topics-h">
      <SectionHead id="ielts-topics-h" icon={<LayoutGrid size={16} />} kicker={tr("Topics & Themes", "विषय और थीम")} title={tr(`${IELTS_TOPICS.length} IELTS topics with words, essays and speaking`, `${IELTS_TOPICS.length} IELTS विषय: शब्द, निबंध और बोलना`)}
        lede={tr("The themes that keep coming back in Writing Task 2 and Speaking. Search, filter and open a topic for its vocabulary, an essay question with ideas, and Part 1 and Part 3 questions.", "लेखन टास्क 2 और स्पीकिंग में बार-बार आने वाले विषय। खोजें, छाँटें और किसी विषय को खोलकर उसकी शब्दावली, निबंध प्रश्न व विचार, और भाग 1 व 3 के प्रश्न देखें।")} />
      <IeltsTopics hi={hi} />
    </section>

    {/* 4. Strategies */}
    <section id="ielts-strategies" className={styles.block} aria-labelledby="ielts-strategies-h">
      <SectionHead id="ielts-strategies-h" icon={<Lightbulb size={16} />} kicker={tr("Question types", "प्रश्न प्रकार")} title={tr("Strategies that save marks", "अंक बचाने वाली रणनीतियाँ")}
        lede={tr("How to approach the question types you will meet in each paper.", "हर पेपर में आने वाले प्रश्न प्रकारों को कैसे हल करें।")} />
      <div className={styles.strategyGrid}>
        {SKILLS.map(item => { const Icon = SKILL_ICON[item]; return <details key={item} className={styles.strategy} style={{ "--tone": SKILL_TONE[item] } as CSSProperties} open={item === "Listening"}>
          <summary><span className={styles.formatIcon} aria-hidden="true"><Icon size={16} /></span>{item}<ChevronDown size={16} aria-hidden="true" className={styles.chevron} /></summary>
          <dl>{STRATEGIES[item].map(row => <div key={row.type}><dt>{row.type}</dt><dd>{row.how}</dd></div>)}</dl>
        </details>; })}
      </div>
      <h3 className={styles.subhead}>{tr("Common mistakes to avoid", "आम गलतियाँ जिनसे बचें")}</h3>
      <ul className={styles.mistakes}>{MISTAKES.map(item => <li key={item.mistake}><XCircle size={16} aria-hidden="true" /><div><b>{item.mistake}</b><span>{item.fix}</span></div></li>)}</ul>
    </section>

    {/* 5. Vocabulary and language */}
    <section id="ielts-language" className={styles.block} aria-labelledby="ielts-language-h">
      <SectionHead id="ielts-language-h" icon={<MessageSquareText size={16} />} kicker={tr("Language bank", "भाषा भंडार")} title={tr("Vocabulary for common IELTS topics", "IELTS के सामान्य विषयों की शब्दावली")}
        lede={tr("Learn words with the phrases they are used in. Collocations raise your lexical resource score more than rare words.", "शब्दों को उनके वाक्यांशों के साथ सीखें। सही collocations दुर्लभ शब्दों से अधिक अंक दिलाते हैं।")} />
      <VocabularyBank />
      <div className={styles.languageGrid}>
        <div className={styles.card}>
          <h3>{tr("Linking words by purpose", "उद्देश्य के अनुसार जोड़ने वाले शब्द")}</h3>
          <dl className={styles.linking}>{LINKING.map(group => <div key={group.purpose}><dt>{group.purpose}</dt><dd>{group.phrases.map(phrase => <span key={phrase}>{phrase}</span>)}</dd></div>)}</dl>
        </div>
        <div className={styles.card}>
          <h3>{tr("Upgrade everyday words", "सामान्य शब्दों को बेहतर बनाएँ")}</h3>
          <ul className={styles.upgrades}>{UPGRADES.map(([plain, better]) => <li key={plain}><s>{plain}</s><span aria-hidden="true">→</span><b>{better}</b></li>)}</ul>
          <p className={styles.small}>{tr("Use a formal choice only when it fits the sentence naturally; accuracy matters more than difficulty.", "औपचारिक शब्द तभी प्रयोग करें जब वह वाक्य में स्वाभाविक लगे।")}</p>
        </div>
      </div>
    </section>

    {/* 6. Study plan */}
    <section id="ielts-plan" className={styles.block} aria-labelledby="ielts-plan-h">
      <SectionHead id="ielts-plan-h" icon={<CalendarCheck size={16} />} kicker={tr("Four-week plan", "चार सप्ताह की योजना")} title={tr("A study plan you can tick off", "एक योजना जिसे आप पूरा कर सकें")}
        lede={tr("Tick tasks as you finish them. Your progress is saved in this browser.", "काम पूरा होने पर टिक करें। आपकी प्रगति इसी ब्राउज़र में सहेजी जाती है।")} />
      <StudyPlan tr={tr} />
    </section>

    {/* 7. Test day and official resources */}
    <section id="ielts-test-day" className={styles.block} aria-labelledby="ielts-test-day-h">
      <SectionHead id="ielts-test-day-h" icon={<ClipboardCheck size={16} />} kicker={tr("Test day", "परीक्षा दिवस")} title={tr("Be ready on the day", "परीक्षा के दिन के लिए तैयार रहें")}
        lede={tr("Check the latest rules with your test centre when you book.", "बुकिंग के समय अपने परीक्षा केंद्र से नवीनतम नियम जाँच लें।")} />
      <div className={styles.languageGrid}>
        <ul className={`${styles.card} ${styles.checklist}`}>{TEST_DAY.map(item => <li key={item}><CheckCircle2 size={16} aria-hidden="true" />{item}</li>)}</ul>
        <div className={`${styles.card} ${styles.official}`}>
          <h3>{tr("Official practice and formats", "आधिकारिक अभ्यास और प्रारूप")}</h3>
          <p className={styles.small}>{tr("Use official sample questions for timed practice once you know the format.", "प्रारूप समझने के बाद समयबद्ध अभ्यास के लिए आधिकारिक नमूना प्रश्नों का उपयोग करें।")}</p>
          {OFFICIAL_LINKS.map(link => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ExternalLink size={13} aria-hidden="true" /></a>)}
        </div>
      </div>
    </section>
  </section>;
}

type Tr = (en: string, hindi: string) => string;

function SectionHead({ id, icon, kicker, title, lede }: { id: string; icon: ReactNode; kicker: string; title: string; lede: string }) {
  return <header className={styles.sectionHead}>
    <p className={styles.kicker}><span aria-hidden="true">{icon}</span>{kicker}</p>
    <h2 id={id}>{title}</h2>
    <p>{lede}</p>
  </header>;
}

/* ── Listening: browser text-to-speech, typed answers checked against accepted forms, transcripts after. ───────── */
function ListeningLab({ tr }: { tr: Tr }) {
  const supported = useSyncExternalStore(noSubscribe, () => "speechSynthesis" in window, () => false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  const play = (id: string, script: string) => {
    window.speechSynthesis.cancel();
    if (speaking === id) { setSpeaking(null); return; }
    const speech = new SpeechSynthesisUtterance(script); speech.lang = "en-GB"; speech.rate = .9;
    speech.onend = () => setSpeaking(current => current === id ? null : current);
    setSpeaking(id); window.speechSynthesis.speak(speech);
  };
  return <>
    <LabIntro title="Listening · practice" text={tr("Read the questions first, then play the audio once, as in the real test. The audio uses your browser's English voice.", "पहले प्रश्न पढ़ें, फिर असली परीक्षा की तरह ऑडियो एक बार सुनें। ऑडियो आपके ब्राउज़र की अंग्रेज़ी आवाज़ में है।")} />
    {!supported && <p className={styles.notice}>{tr("Voice playback is unavailable in this browser. Read the transcript instead, or use the official sample tests below.", "इस ब्राउज़र में आवाज़ उपलब्ध नहीं है। पाठ पढ़ें या नीचे आधिकारिक नमूना परीक्षा देखें।")}</p>}
    {LISTENING.map(exercise => { const done = checked[exercise.id]; const score = exercise.blanks.filter(blank => blank.accept.test((answers[`${exercise.id}:${blank.label}`] ?? "").trim())).length;
      return <article key={exercise.id} className={styles.exercise}>
        <header><h3>{exercise.title}</h3><p>{exercise.context}</p></header>
        <button type="button" className={styles.primary} disabled={!supported} onClick={() => play(exercise.id, exercise.script)} aria-pressed={speaking === exercise.id}>
          {speaking === exercise.id ? <Square size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{speaking === exercise.id ? tr("Stop audio", "ऑडियो रोकें") : tr("Play English audio", "अंग्रेज़ी ऑडियो सुनें")}
        </button>
        <div className={styles.blanks}>{exercise.blanks.map(blank => { const key = `${exercise.id}:${blank.label}`; const right = blank.accept.test((answers[key] ?? "").trim());
          return <label key={key} data-state={done ? (right ? "right" : "wrong") : undefined}>{blank.label}
            <input value={answers[key] ?? ""} autoComplete="off" spellCheck={false} onChange={event => { setAnswers(current => ({ ...current, [key]: event.target.value })); setChecked(current => ({ ...current, [exercise.id]: false })); }} />
            {done && <small>{right ? tr("Correct", "सही") : `${tr("Answer", "उत्तर")}: ${blank.answer}`}</small>}
          </label>; })}</div>
        <div className={styles.row}>
          <button type="button" onClick={() => setChecked(current => ({ ...current, [exercise.id]: true }))}>{tr("Check answers", "उत्तर जाँचें")}</button>
          {done && <p role="status" className={styles.score}>{score} / {exercise.blanks.length} {tr("correct", "सही")}</p>}
        </div>
        {done && <p className={styles.tip}><Lightbulb size={14} aria-hidden="true" />{exercise.tip}</p>}
        <details className={styles.transcript}><summary>{tr("Show transcript", "अंग्रेज़ी पाठ देखें")}</summary><p lang="en">{exercise.script}</p></details>
      </article>; })}
    <Tips items={LISTENING_TIPS} tr={tr} />
  </>;
}

/* ── Reading: True / False / Not given plus a gap fill, from the passage for the chosen test type. ─────────────── */
function ReadingLab({ type, tr }: { type: TestType; tr: Tr }) {
  const set = READING[type];
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [gap, setGap] = useState(""); const [gapChecked, setGapChecked] = useState(false);
  const score = set.tfng.filter((item, index) => answers[index] === item.answer).length;
  return <>
    <LabIntro title="Reading · practice" text={tr("Answer using only evidence from the passage. Do not use your own knowledge.", "केवल दिए गए पाठ के प्रमाण से उत्तर दें। अपनी जानकारी का उपयोग न करें।")} />
    <article className={styles.exercise}>
      <header><h3>{set.title}</h3><p>{set.source}</p></header>
      <blockquote lang="en">{set.passage}</blockquote>
      <h4>{tr("Do the statements agree with the information in the passage?", "क्या कथन पाठ की जानकारी से मेल खाते हैं?")}</h4>
      {set.tfng.map((item, index) => <fieldset key={item.q} className={styles.tfng}><legend lang="en"><span>{index + 1}</span>{item.q}</legend>
        <div className={styles.options}>{(["True", "False", "Not given"] as const).map(option => <button type="button" key={option} aria-pressed={answers[index] === option}
          data-state={answers[index] === option ? (option === item.answer ? "right" : "wrong") : undefined} onClick={() => setAnswers(current => ({ ...current, [index]: option }))}>{option}</button>)}</div>
        {answers[index] && <p role="status" className={styles.feedback} data-state={answers[index] === item.answer ? "right" : "wrong"}>
          {answers[index] === item.answer ? <CheckCircle2 size={14} aria-hidden="true" /> : <XCircle size={14} aria-hidden="true" />}
          <span><b>{answers[index] === item.answer ? tr("Correct", "सही") : tr("Review", "फिर विचार करें")} — {item.answer}.</b> {item.why}</span></p>}
      </fieldset>)}
      {Object.keys(answers).length === set.tfng.length && <p className={styles.score} role="status">{score} / {set.tfng.length} {tr("correct", "सही")}</p>}
      <h4>{tr("Sentence completion", "वाक्य पूर्ति")}</h4>
      <label className={styles.gap} data-state={gapChecked ? (set.completion.accept.test(gap.trim()) ? "right" : "wrong") : undefined}><span lang="en">{set.completion.prompt}</span>
        <input value={gap} autoComplete="off" onChange={event => { setGap(event.target.value); setGapChecked(false); }} />
      </label>
      <div className={styles.row}><button type="button" onClick={() => setGapChecked(true)}>{tr("Check answer", "उत्तर देखें")}</button></div>
      {gapChecked && <p role="status" className={styles.feedback} data-state={set.completion.accept.test(gap.trim()) ? "right" : "wrong"}>
        <span><b>{set.completion.accept.test(gap.trim()) ? tr("Correct", "सही") : `${tr("Answer", "उत्तर")}: ${set.completion.answer}.`}</b> {set.completion.why}</span></p>}
    </article>
    <Tips items={READING_TIPS} tr={tr} />
  </>;
}

/* ── Writing: Task 1 / Task 2 for the chosen test type, a separate draft each, word target, timer and a plan. ──── */
function WritingLab({ type, tr }: { type: TestType; tr: Tr }) {
  const [task, setTask] = useState<WritingTask>("task1");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const current = WRITING[type][task]; const key = `${type}:${task}`; const draft = drafts[key] ?? ""; const words = countWords(draft);
  const timer = useCountdown(current.minutes * 60);
  const reached = words >= current.words;
  return <>
    <LabIntro title="Writing · practice" text={tr("Plan for a few minutes, then write. This is original practice, not an official question or a predicted band score.", "कुछ मिनट योजना बनाएँ, फिर लिखें। यह मौलिक अभ्यास है, आधिकारिक प्रश्न या अंक-पूर्वानुमान नहीं।")} />
    <div className={styles.taskTabs} role="group" aria-label="Writing task">
      {(["task1", "task2"] as const).map(item => <button type="button" key={item} aria-pressed={task === item} onClick={() => { setTask(item); timer.reset(WRITING[type][item].minutes * 60); }}>
        {item === "task1" ? "Task 1" : "Task 2"}<span aria-hidden="true">{WRITING[type][item].minutes} min · {WRITING[type][item].words}+ {tr("words", "शब्द")}</span>
      </button>)}
    </div>
    <article className={styles.exercise}>
      <blockquote lang="en">{current.prompt}</blockquote>
      <div className={styles.writingGrid}>
        <div>
          <label htmlFor="ielts-writing" className={styles.fieldLabel}>{tr("Write your answer in English", "अपना उत्तर अंग्रेज़ी में लिखें")}</label>
          <textarea id="ielts-writing" rows={12} value={draft} spellCheck={false} onChange={event => setDrafts(currentDrafts => ({ ...currentDrafts, [key]: event.target.value }))} />
          <div className={styles.meter} aria-hidden="true"><i style={{ width: `${Math.min(100, (words / current.words) * 100)}%` }} data-done={reached || undefined} /></div>
          <p aria-live="polite" className={styles.small}>{words} {tr("words", "शब्द")} · {reached ? tr("minimum reached", "न्यूनतम पूरा") : tr(`Practise writing at least ${current.words} words.`, `कम से कम ${current.words} शब्द लिखने का अभ्यास करें।`)}</p>
        </div>
        <aside className={styles.writingSide}>
          <div className={styles.timer}>
            <p role="timer" aria-live="off"><Clock size={15} aria-hidden="true" />{clock(timer.seconds)}</p>
            <div className={styles.row}>
              {timer.running ? <button type="button" onClick={timer.stop}>{tr("Pause", "रोकें")}</button> : <button type="button" className={styles.primary} onClick={() => timer.start(timer.seconds || current.minutes * 60)}>{tr("Start timer", "टाइमर शुरू करें")}</button>}
              <button type="button" onClick={() => timer.reset(current.minutes * 60)} aria-label={tr("Reset timer", "टाइमर रीसेट करें")}><RotateCcw size={14} aria-hidden="true" /></button>
            </div>
          </div>
          <h4>{tr("Suggested plan", "सुझाई गई योजना")}</h4>
          <ol className={styles.plan}>{current.plan.map(step => <li key={step}>{step}</li>)}</ol>
        </aside>
      </div>
      <h4>{tr("Self-check against the four criteria", "चार मानदंडों पर स्वयं जाँचें")}</h4>
      <ul className={styles.criteria}>{WRITING_CRITERIA.map(item => <li key={item.name}><b>{item.name}</b><span>{item.note}</span></li>)}</ul>
    </article>
  </>;
}

/* ── Speaking: Part 1 questions, a Part 2 cue card with 1-minute preparation then a 2-minute talk, Part 3 questions. */
function SpeakingLab({ tr }: { tr: Tr }) {
  const [topic, setTopic] = useState(0);
  const [card, setCard] = useState(0);
  const [phase, setPhase] = useState<"idle" | "prepare" | "speak" | "done">("idle");
  const phaseRef = useRef(phase);
  const go = (next: typeof phase) => { phaseRef.current = next; setPhase(next); };
  const startTalk = useRef<() => void>(() => {});
  // Preparation ends → the 2-minute talk starts; the talk ends → done.
  const timer = useCountdown(60, () => { if (phaseRef.current === "prepare") { go("speak"); startTalk.current(); } else if (phaseRef.current === "speak") go("done"); });
  useEffect(() => { startTalk.current = () => timer.start(120); });
  const cue = SPEAKING_CUE_CARDS[card]; const part1 = SPEAKING_PART1[topic];
  const begin = () => { go("prepare"); timer.start(60); };
  const reset = () => { go("idle"); timer.reset(60); };
  return <>
    <LabIntro title="Speaking · practice" text={tr("Answer out loud, in full sentences. Use your own experience instead of a memorised script.", "पूरे वाक्यों में ज़ोर से उत्तर दें। रटे हुए उत्तर के बजाय अपने अनुभव का उपयोग करें।")} />
    <div className={styles.speakGrid}>
      <article className={styles.exercise}>
        <header><h3>Part 1 · {part1.topic}</h3><p>{tr("4–5 minutes of short questions about familiar topics.", "परिचित विषयों पर 4–5 मिनट के छोटे प्रश्न।")}</p></header>
        <ol className={styles.questions}>{part1.questions.map(question => <li key={question} lang="en">{question}</li>)}</ol>
        <button type="button" onClick={() => setTopic(index => (index + 1) % SPEAKING_PART1.length)}><Shuffle size={14} aria-hidden="true" />{tr("Another topic", "दूसरा विषय")}</button>
      </article>
      <article className={`${styles.exercise} ${styles.cueCard}`} data-phase={phase}>
        <header><h3>Part 2 · {tr("Cue card", "क्यू कार्ड")}</h3><p>{tr("1 minute to prepare, then speak for up to 2 minutes.", "1 मिनट तैयारी, फिर 2 मिनट तक बोलें।")}</p></header>
        <div className={styles.card} lang="en"><b>{cue.title}</b><p>You should say:</p><ul>{cue.points.map(point => <li key={point}>{point}</li>)}</ul></div>
        <div className={styles.timer} data-phase={phase}>
          <p role="timer" aria-live="off"><Clock size={15} aria-hidden="true" />{clock(timer.seconds)}</p>
          <p className={styles.phase} aria-live="polite">{phase === "prepare" ? tr("Preparation: make notes", "तैयारी: नोट्स बनाएँ") : phase === "speak" ? tr("Speak now", "अब बोलें") : phase === "done" ? tr("Time is up. Well done!", "समय समाप्त। बहुत बढ़िया!") : tr("Ready when you are", "जब तैयार हों")}</p>
          <div className={styles.row}>
            <button type="button" className={styles.primary} disabled={timer.running} onClick={begin}>{tr("Start preparation timer", "तैयारी का समय शुरू करें")}</button>
            <button type="button" onClick={reset}>{tr("Reset", "रीसेट करें")}</button>
            <button type="button" onClick={() => { setCard(index => (index + 1) % SPEAKING_CUE_CARDS.length); reset(); }}><Shuffle size={14} aria-hidden="true" />{tr("New card", "नया कार्ड")}</button>
          </div>
        </div>
      </article>
      <article className={styles.exercise}>
        <header><h3>Part 3 · {tr("Discussion", "चर्चा")}</h3><p>{tr("4–5 minutes of deeper questions linked to your Part 2 topic.", "Part 2 के विषय से जुड़े 4–5 मिनट के गहरे प्रश्न।")}</p></header>
        <ol className={styles.questions}>{cue.part3.map(question => <li key={question} lang="en">{question}</li>)}</ol>
      </article>
    </div>
    <h4 className={styles.subhead}>{tr("How speaking is assessed", "बोलने का मूल्यांकन कैसे होता है")}</h4>
    <ul className={styles.criteria}>{SPEAKING_CRITERIA.map(item => <li key={item.name}><b>{item.name}</b><span>{item.note}</span></li>)}</ul>
  </>;
}

/* ── Band calculator: overall band from four skills, and an approximate raw-score converter. ───────────────────── */
function BandCalculator({ type, tr }: { type: TestType; tr: Tr }) {
  const [scores, setScores] = useState<Record<Skill, number>>({ Listening: 6.5, Reading: 6.5, Writing: 6, Speaking: 6.5 });
  const overall = overallBand(SKILLS.map(item => scores[item]));
  const average = SKILLS.reduce((sum, item) => sum + scores[item], 0) / 4;
  const [table, setTable] = useState<"listening" | "reading">("listening");
  const [correct, setCorrect] = useState(30);
  const tableKey = table === "listening" ? "listening" : type === "academic" ? "academicReading" : "generalReading";
  const band = rawToBand(tableKey, correct);
  return <div className={styles.calcGrid}>
    <div className={styles.card}>
      <h3>{tr("Overall band", "कुल बैंड")}</h3>
      <div className={styles.bandInputs}>{SKILLS.map(item => <label key={item} style={{ "--tone": SKILL_TONE[item] } as CSSProperties}>{item}
        <select value={scores[item]} onChange={event => setScores(current => ({ ...current, [item]: Number(event.target.value) }))}>{BANDS.map(value => <option key={value} value={value}>{value.toFixed(1)}</option>)}</select>
      </label>)}</div>
      <p className={styles.bandResult} aria-live="polite"><span>{tr("Overall", "कुल")}</span><b>{overall.toFixed(1)}</b></p>
      <p className={styles.small}>{tr(`Average ${average.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}. An average ending in .25 rounds up to the next half band and one ending in .75 rounds up to the next whole band.`, `औसत ${average.toFixed(2)}। .25 पर समाप्त औसत अगले आधे बैंड तक और .75 पर समाप्त औसत अगले पूर्ण बैंड तक बढ़ता है।`)}</p>
    </div>
    <div className={styles.card}>
      <h3>{tr("Raw score to band", "सही उत्तर से बैंड")}</h3>
      <label className={styles.fieldLabel}>{tr("Paper", "पेपर")}
        <select value={table} onChange={event => setTable(event.target.value as "listening" | "reading")}>
          <option value="listening">{RAW_TABLES.listening.label}</option>
          <option value="reading">{RAW_TABLES[type === "academic" ? "academicReading" : "generalReading"].label}</option>
        </select>
      </label>
      <label className={styles.fieldLabel}>{tr("Correct answers out of 40", "40 में से सही उत्तर")}: <b>{correct}</b>
        <input type="range" min={0} max={40} value={correct} onChange={event => setCorrect(Number(event.target.value))} />
      </label>
      <p className={styles.bandResult} aria-live="polite"><span>{tr("About", "लगभग")}</span><b>{band == null ? tr("below 4", "4 से कम") : band.toFixed(1)}</b></p>
      <p className={styles.small}>{tr("Approximate. Official conversion tables vary slightly from test to test.", "अनुमानित। आधिकारिक तालिका हर परीक्षा में थोड़ी बदलती है।")}</p>
    </div>
  </div>;
}

function VocabularyBank() {
  const [topic, setTopic] = useState(TOPIC_VOCAB[0].topic);
  const active = TOPIC_VOCAB.find(group => group.topic === topic) ?? TOPIC_VOCAB[0];
  return <div className={styles.vocab}>
    <div className={styles.vocabTabs} role="group" aria-label="Vocabulary topics">
      {TOPIC_VOCAB.map(group => <button type="button" key={group.topic} aria-pressed={group.topic === topic} onClick={() => setTopic(group.topic)}>{group.topic}</button>)}
    </div>
    <ul className={styles.vocabGrid}>{active.words.map(item => <li key={item.word}><b lang="en">{item.word}</b><span>{item.meaning}</span><i lang="en">{item.example}</i></li>)}</ul>
  </div>;
}

function StudyPlan({ tr }: { tr: Tr }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restores the saved checklist after hydration.
    try { const saved = window.localStorage.getItem(PLAN_KEY); if (saved) setDone(JSON.parse(saved)); } catch { /* storage blocked: start empty */ }
  }, []);
  const toggle = (id: string) => setDone(current => { const next = { ...current, [id]: !current[id] }; try { window.localStorage.setItem(PLAN_KEY, JSON.stringify(next)); } catch { /* not saved */ } return next; });
  const total = STUDY_PLAN.reduce((sum, week) => sum + week.tasks.length, 0);
  const finished = useMemo(() => Object.values(done).filter(Boolean).length, [done]);
  return <>
    <div className={styles.progress}><div aria-hidden="true"><i style={{ width: `${(finished / total) * 100}%` }} /></div><p>{finished} / {total} {tr("tasks done", "काम पूरे")}</p></div>
    <ol className={styles.weeks}>{STUDY_PLAN.map((week, weekIndex) => <li key={week.week} className={styles.card}>
      <p className={styles.weekLabel}>{week.week}</p><h3>{week.focus}</h3>
      <ul>{week.tasks.map((task, taskIndex) => { const id = `${weekIndex}-${taskIndex}`; return <li key={id}>
        <label><input type="checkbox" checked={!!done[id]} onChange={() => toggle(id)} /><span>{task}</span></label>
      </li>; })}</ul>
    </li>)}</ol>
  </>;
}

function LabIntro({ title, text }: { title: string; text: string }) {
  return <header className={styles.labIntro}><h3>{title}</h3><p>{text}</p></header>;
}
function Tips({ items, tr }: { items: string[]; tr: Tr }) {
  return <aside className={styles.tips}><h4><Lightbulb size={15} aria-hidden="true" />{tr("Tips", "सुझाव")}</h4><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></aside>;
}
