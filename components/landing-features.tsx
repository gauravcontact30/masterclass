"use client";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookMarked, Check, Compass, Download, GitBranch, History, Images, Layers, ListTree, MessageCircleQuestion, Search, Sparkles, Star, type LucideIcon } from "lucide-react";
import { useLanguage } from "./language-provider";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-features.module.css";
import { ListenButton } from "./listen-button";
import { CoverCarousel, type CarouselSlide } from "./landing-carousel";

/*
 * One landing section per Learning Dashboard feature the rest of the page does not already show: AI Search,
 * featured lessons with their study packs, and notes and bookmarks. Each is its own <section>: what it does, four
 * details, how it works in three steps and a way in, beside a picture painted through Vercel AI Gateway
 * (scripts/generate-feature-images.ts) with a carousel floating on it that moves every 15 seconds: what AI Search
 * does, the featured lessons (ending with today's AI pulse headline) or what notes and bookmarks do, each card with
 * its own painted cover. Coffee & Code reuses FeatureSection. Learner features only.
 */
export type Copy = [en: string, hi: string];
export type Feature = {
  id: string; icon: LucideIcon; kicker: Copy; title: Copy; emphasis: Copy; lede: Copy;
  details: { icon: LucideIcon; title: Copy; body: Copy }[]; steps: Copy[];
  image: { src: string; focus: string }; badge: { icon: LucideIcon; label: Copy };
  cta: { href: string; label: Copy }; note: Copy;
};

const FEATURES: Feature[] = [
  {
    id: "ai-search", icon: Search, kicker: ["AI Search", "AI सर्च"],
    title: ["Ask anything. ", "कुछ भी पूछें। "], emphasis: ["Get an answer card, not a pile of links.", "लिंक का ढेर नहीं, एक उत्तर कार्ड पाएँ।"],
    lede: ["Type a question about any technology you are learning and Search answers it as a card: the answer first, its key points, and the related topics from the same area so you always know what to read next.", "जिस भी तकनीक को आप सीख रहे हैं, उसके बारे में प्रश्न लिखें और सर्च उसका उत्तर एक कार्ड के रूप में देता है: पहले उत्तर, फिर मुख्य बिंदु, और उसी क्षेत्र के संबंधित विषय ताकि आपको हमेशा पता रहे कि आगे क्या पढ़ना है।"],
    details: [
      { icon: Sparkles, title: ["Answer first", "पहले उत्तर"], body: ["The card opens with the answer itself, then the key points that make it stick.", "कार्ड सीधे उत्तर से शुरू होता है, फिर वे मुख्य बिंदु जो उसे याद रखने में मदद करते हैं।"] },
      { icon: ListTree, title: ["Related topics", "संबंधित विषय"], body: ["Every answer lists what else its area covers, so one question leads to the next.", "हर उत्तर बताता है कि उसके क्षेत्र में और क्या है, ताकि एक प्रश्न अगले तक ले जाए।"] },
      { icon: Compass, title: ["Explore by technology", "तकनीक के अनुसार खोजें"], body: ["Browse topics technology by technology when you do not know what to ask yet.", "जब पता न हो कि क्या पूछें, तो तकनीक के अनुसार विषय देखें।"] },
      { icon: History, title: ["Your history, kept", "आपका इतिहास सुरक्षित"], body: ["Earlier questions stay one click away, and asking again reuses the answer.", "पिछले प्रश्न एक क्लिक पर रहते हैं, और दोबारा पूछने पर वही उत्तर तुरंत मिलता है।"] },
    ],
    steps: [["Ask in plain words", "सरल शब्दों में पूछें"], ["Read the answer card", "उत्तर कार्ड पढ़ें"], ["Open a related topic", "संबंधित विषय खोलें"]],
    image: { src: "/images/landing/feature-search.webp", focus: "40% 45%" }, badge: { icon: Sparkles, label: ["AI answer card", "AI उत्तर कार्ड"] },
    cta: { href: "/sign-up", label: ["Try AI Search", "AI सर्च आज़माएँ"] }, note: ["Included in every membership", "हर सदस्यता में शामिल"],
  },
  {
    id: "lesson-packs", icon: Sparkles, kicker: ["Featured lessons", "विशेष पाठ"],
    title: ["New lessons arrive ", "नए पाठ आते हैं "], emphasis: ["with interview questions built in.", "इंटरव्यू प्रश्नों के साथ।"],
    lede: ["Fresh lessons appear across the dashboard as cards with a cover picture, a short description and the date they were published. Read more opens the whole lesson in a calm reading window, with everything you need to revise it for an interview.", "नए पाठ डैशबोर्ड पर कार्ड के रूप में आते हैं: कवर चित्र, छोटा विवरण और प्रकाशन की तारीख के साथ। “और पढ़ें” पूरा पाठ एक शांत पढ़ने वाली विंडो में खोलता है, साथ में वह सब कुछ जो इंटरव्यू के लिए दोहराने में चाहिए।"],
    details: [
      { icon: MessageCircleQuestion, title: ["Most-asked questions", "सबसे ज़्यादा पूछे जाने वाले प्रश्न"], body: ["The questions interviewers ask about the topic, with to-the-point answers.", "विषय पर इंटरव्यू में पूछे जाने वाले प्रश्न, सटीक उत्तरों के साथ।"] },
      { icon: Layers, title: ["Step-by-step workflow", "चरण-दर-चरण वर्कफ़्लो"], body: ["How the idea works in practice, in the order you would use it.", "विचार असल में कैसे काम करता है, उसी क्रम में जिसमें आप उसे इस्तेमाल करेंगे।"] },
      { icon: GitBranch, title: ["A diagram", "एक डायग्राम"], body: ["The parts of the topic and how they connect, drawn for you.", "विषय के हिस्से और वे कैसे जुड़ते हैं, आपके लिए बना हुआ।"] },
      { icon: Images, title: ["Illustrations", "चित्र"], body: ["Pictures that explain the idea rather than decorate the page.", "चित्र जो पन्ना सजाने के बजाय विचार समझाते हैं।"] },
    ],
    steps: [["Spot a new lesson card", "नया पाठ कार्ड देखें"], ["Read the whole lesson", "पूरा पाठ पढ़ें"], ["Revise with the Q&A", "प्रश्नोत्तर से दोहराएँ"]],
    image: { src: "/images/landing/feature-lessons.webp", focus: "50% 50%" }, badge: { icon: MessageCircleQuestion, label: ["Interview Q&A inside", "अंदर इंटरव्यू प्रश्नोत्तर"] },
    cta: { href: "/sign-up", label: ["Read the latest lessons", "नए पाठ पढ़ें"] }, note: ["New lessons are added regularly", "नए पाठ नियमित रूप से जुड़ते हैं"],
  },
  {
    id: "notes-bookmarks", icon: BookMarked, kicker: ["Notes & bookmarks", "नोट्स और बुकमार्क"],
    title: ["Revise from ", "दोहराइए "], emphasis: ["what you already saved.", "जो आपने पहले सहेजा।"],
    lede: ["Topic notes are short, focused and ranked by how much they matter for interviews and certification exams. Bookmark anything as you go, and when it is time to revise, everything you saved is waiting in one list.", "विषय नोट्स छोटे, केंद्रित और इंटरव्यू व सर्टिफ़िकेशन परीक्षा में उनके महत्व के अनुसार क्रम में हैं। पढ़ते-पढ़ते कुछ भी बुकमार्क करें, और दोहराने के समय आपका सहेजा सब कुछ एक ही सूची में मिलेगा।"],
    details: [
      { icon: BookMarked, title: ["Focused topic notes", "केंद्रित विषय नोट्स"], body: ["Each chapter and topic boiled down to what you need to remember.", "हर अध्याय और विषय उतना ही, जितना याद रखना ज़रूरी है।"] },
      { icon: Star, title: ["Priority stars", "प्राथमिकता सितारे"], body: ["Five-star topics come first, so a short evening still covers what matters most.", "पाँच सितारा विषय पहले आते हैं, ताकि छोटी-सी शाम में भी सबसे ज़रूरी चीज़ें पूरी हों।"] },
      { icon: Check, title: ["Bookmarks everywhere", "हर जगह बुकमार्क"], body: ["Save lessons, questions and topics from anywhere on the dashboard.", "डैशबोर्ड पर कहीं से भी पाठ, प्रश्न और विषय सहेजें।"] },
      { icon: Download, title: ["Take notes with you", "नोट्स साथ ले जाएँ"], body: ["Download study notes to revise offline, on the commute or right before an interview.", "स्टडी नोट्स डाउनलोड करें और सफ़र में या इंटरव्यू से ठीक पहले ऑफ़लाइन दोहराएँ।"] },
    ],
    steps: [["Read a topic", "विषय पढ़ें"], ["Bookmark what matters", "ज़रूरी चीज़ें बुकमार्क करें"], ["Revise from one list", "एक सूची से दोहराएँ"]],
    image: { src: "/images/landing/feature-notes.webp", focus: "60% 50%" }, badge: { icon: Star, label: ["Revise what matters first", "पहले ज़रूरी चीज़ें दोहराएँ"] },
    cta: { href: "/sign-up", label: ["Start your notes", "अपने नोट्स शुरू करें"] }, note: ["English and Hindi", "अंग्रेज़ी और हिन्दी"],
  },
];

/** Today's AI pulse headline, for the carousel's "AI latest" card (it changes every day). */
export type LatestPulse = { title: string; text: string; image?: string | null; day: string };
type Lesson = { id: string; title: string; text: Copy; minutes: number };
// The carousel's lessons; covers are painted by scripts/generate-lesson-covers.ts.
const LESSONS: Lesson[] = [
  { id: "react-hooks", title: "React hooks, explained simply", text: ["State, effects, refs and memo: which hook to reach for, and why.", "स्टेट, इफ़ेक्ट, रेफ़ और मेमो: कब कौन-सा हुक, और क्यों।"], minutes: 8 },
  { id: "nextjs", title: "Next.js 16+", text: ["Cache Components, the proxy file and Turbopack by default: what changed and how to use it.", "Cache Components, proxy फ़ाइल और डिफ़ॉल्ट Turbopack: क्या बदला और कैसे इस्तेमाल करें।"], minutes: 10 },
  { id: "aws", title: "AWS popular services", text: ["EC2, S3, Lambda, DynamoDB and RDS: what each one is for and when to choose it.", "EC2, S3, Lambda, DynamoDB और RDS: हर एक किसलिए है और कब चुनें।"], minutes: 9 },
  { id: "agentic-ai", title: "Agentic AI concepts", text: ["Planning, tools, memory and reflection: how AI agents turn a goal into steps.", "योजना, टूल, मेमोरी और आत्म-समीक्षा: AI एजेंट लक्ष्य को कदमों में कैसे बदलते हैं।"], minutes: 9 },
  { id: "langchain", title: "LangChain", text: ["Prompts, models, retrievers and chains: build LLM apps from reusable parts.", "प्रॉम्प्ट, मॉडल, रिट्रीवर और चेन: दोबारा इस्तेमाल होने वाले हिस्सों से LLM ऐप बनाएँ।"], minutes: 8 },
  { id: "langgraph", title: "LangGraph", text: ["Stateful graphs with loops and checkpoints for agents you can control.", "लूप और चेकपॉइंट वाले स्टेटफ़ुल ग्राफ़, ऐसे एजेंटों के लिए जिन्हें आप नियंत्रित कर सकें।"], minutes: 8 },
  { id: "langsmith", title: "LangSmith", text: ["Trace every run, compare prompts and evaluate answers before you ship.", "हर रन ट्रेस करें, प्रॉम्प्ट की तुलना करें और शिप करने से पहले उत्तर जाँचें।"], minutes: 7 },
  { id: "langflow", title: "LangFlow", text: ["Drag, connect and test LLM pipelines visually, then take them to code.", "LLM पाइपलाइन को खींचकर, जोड़कर और परखकर दृश्य रूप में बनाएँ, फिर कोड में ले जाएँ।"], minutes: 7 },
  { id: "system-design", title: "System Design", text: ["Load balancers, caching, sharding and queues: design systems that scale.", "लोड बैलेंसर, कैशिंग, शार्डिंग और क्यू: बड़े पैमाने के सिस्टम डिज़ाइन करें।"], minutes: 12 },
  { id: "n8n", title: "n8n", text: ["Automate work with triggers, nodes and AI steps, self-hosted or in the cloud.", "ट्रिगर, नोड और AI कदमों से काम स्वचालित करें, ख़ुद होस्ट करें या क्लाउड में।"], minutes: 7 },
];

type Card = { id: string; title: Copy; text: Copy };
// The AI Search carousel; covers are painted by scripts/generate-lesson-covers.ts (search:<id>).
const SEARCH: Card[] = [
  { id: "plain-words", title: ["Ask in plain words", "सरल शब्दों में पूछें"], text: ["Type the question the way you would ask a friend; no keywords to guess.", "प्रश्न वैसे ही लिखें जैसे किसी दोस्त से पूछते; कीवर्ड का अंदाज़ा नहीं लगाना।"] },
  { id: "answer-card", title: ["An answer card, not links", "लिंक नहीं, एक उत्तर कार्ड"], text: ["The answer comes first, then the key points that make it stick.", "पहले उत्तर आता है, फिर वे मुख्य बिंदु जो उसे याद रखने में मदद करते हैं।"] },
  { id: "related-topics", title: ["Related topics", "संबंधित विषय"], text: ["Every answer shows what else its area covers, so one question leads to the next.", "हर उत्तर बताता है कि उसके क्षेत्र में और क्या है, ताकि एक प्रश्न अगले तक ले जाए।"] },
  { id: "by-technology", title: ["Explore by technology", "तकनीक के अनुसार खोजें"], text: ["Not sure what to ask yet? Browse topics technology by technology.", "अभी पता नहीं क्या पूछें? तकनीक के अनुसार विषय देखें।"] },
  { id: "history-kept", title: ["Your history, kept", "आपका इतिहास सुरक्षित"], text: ["Earlier questions stay one click away, and asking again is instant.", "पिछले प्रश्न एक क्लिक पर रहते हैं, और दोबारा पूछना तुरंत होता है।"] },
  { id: "two-languages", title: ["English or Hindi", "अंग्रेज़ी या हिन्दी"], text: ["Ask in either language and read the answer in the one you prefer.", "किसी भी भाषा में पूछें और उत्तर अपनी पसंद की भाषा में पढ़ें।"] },
];
// The Notes & bookmarks carousel; covers are painted by scripts/generate-lesson-covers.ts (notes:<id>).
const NOTES: Card[] = [
  { id: "topic-notes", title: ["Focused topic notes", "केंद्रित विषय नोट्स"], text: ["Every topic boiled down to what you need to remember, with diagrams and examples.", "हर अध्याय उतना ही, जितना याद रखना ज़रूरी है, आरेख और उदाहरणों के साथ।"] },
  { id: "priority-stars", title: ["Five-star topics first", "पहले पाँच सितारा विषय"], text: ["Topics are ranked by how often they come up in interviews and certification exams.", "विषय इस क्रम में हैं कि वे इंटरव्यू और सर्टिफ़िकेशन परीक्षा में कितनी बार आते हैं।"] },
  { id: "bookmarks", title: ["Bookmark from anywhere", "कहीं से भी बुकमार्क करें"], text: ["Save lessons, questions and topics with one tap while you read.", "पढ़ते-पढ़ते एक टैप में पाठ, प्रश्न और विषय सहेजें।"] },
  { id: "revision-list", title: ["One revision list", "एक दोहराने की सूची"], text: ["Everything you saved waits in one list, ready the evening before the interview.", "आपका सहेजा सब कुछ एक सूची में, इंटरव्यू से पहले की शाम के लिए तैयार।"] },
  { id: "offline-notes", title: ["Revise offline", "ऑफ़लाइन दोहराएँ"], text: ["Download study notes for the commute, a flight or the wait before an interview.", "सफ़र, फ़्लाइट या इंटरव्यू से पहले के इंतज़ार के लिए स्टडी नोट्स डाउनलोड करें।"] },
  { id: "two-languages", title: ["English and Hindi", "अंग्रेज़ी और हिन्दी"], text: ["Read the same notes in English or Hindi, whichever helps you remember.", "वही नोट्स अंग्रेज़ी या हिन्दी में पढ़ें, जिसमें आपको बेहतर याद रहे।"] },
];

/** One feature section: copy, details, how it works and a way in, beside its picture with `float` on it. */
export function FeatureSection({ feature, index, total, float, section }: { feature: Feature; index: number; total: number; float?: ReactNode; section?: { props?: object; toolbar?: ReactNode } }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const pick = ([en, hindi]: Copy) => hi ? hindi : en;
  const Icon = feature.icon, Badge = feature.badge.icon;
  return <section id={feature.id} className={`${frame.section} ${styles.feature}`} data-ground={index % 2 ? "wash" : "paper"} aria-labelledby={`${feature.id}-title`} {...section?.props}>{section?.toolbar}
    <div className={`${home.inner} ${styles.layout}`} data-flip={index % 2 ? "" : undefined}>
      <div className={styles.copy}>
        <p className={frame.kicker}><Icon size={14} aria-hidden="true" />{pick(feature.kicker)}{total > 1 && <span>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>}</p>
        <h2 id={`${feature.id}-title`} className={styles.title}>{pick(feature.title)}<em>{pick(feature.emphasis)}</em></h2>
        <p className={frame.lede}>{pick(feature.lede)}</p>
        <ul className={styles.details}>{feature.details.map(detail => { const DetailIcon = detail.icon; return <li key={detail.title[0]}>
          <span className={styles.detailIcon} aria-hidden="true"><DetailIcon size={17} /></span>
          <div><h3>{pick(detail.title)}</h3><p>{pick(detail.body)}</p></div>
        </li>; })}</ul>
        <div className={styles.how}>
          <p className={styles.howLabel}>{hi ? "यह कैसे काम करता है" : "How it works"}</p>
          <ol className={styles.howSteps}>{feature.steps.map((step, at) => <li key={step[0]}><span aria-hidden="true">{at + 1}</span>{pick(step)}</li>)}</ol>
        </div>
        <div className={frame.actions}><Link className={frame.cta} href={feature.cta.href}>{pick(feature.cta.label)}<ArrowRight size={16} aria-hidden="true" /></Link><ListenButton id={`feature:${feature.id}`} title={pick(feature.kicker)} text={() => [pick(feature.title) + pick(feature.emphasis), pick(feature.lede), ...feature.details.map(detail => `${pick(detail.title)}. ${pick(detail.body)}`)].join(" ")} /><small>{pick(feature.note)}</small></div>
      </div>
      <div className={styles.visual}>
        <div className={styles.photo} aria-hidden="true"><Image src={feature.image.src} alt="" fill sizes="(max-width: 900px) 92vw, 560px" style={{ objectPosition: feature.image.focus }} /></div>
        <span className={styles.badge} aria-hidden="true"><Badge size={14} />{pick(feature.badge.label)}</span>
        {float && <div className={styles.float}>{float}</div>}
      </div>
    </div>
  </section>;
}

export function LandingFeatures({ latest }: { latest?: LatestPulse | null }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const minutes = (n: number) => hi ? `${n} मिनट पढ़ें` : `${n} min read`;
  const today = (day: string) => new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${day}T12:00:00+05:30`));
  const slides: CarouselSlide[] = [
    ...LESSONS.map(lesson => ({ id: lesson.id, image: `/images/landing/lessons/${lesson.id}.webp`, kicker: hi ? "विशेष पाठ" : "Featured lesson", title: lesson.title, text: hi ? lesson.text[1] : lesson.text[0], meta: minutes(lesson.minutes), href: "/sign-up", cta: hi ? "और पढ़ें" : "Read more" })),
    ...(latest ? [{ id: `ai-latest-${latest.day}`, image: "/images/landing/lessons/ai-latest.webp", kicker: hi ? `AI ताज़ा · ${today(latest.day)}` : `AI latest · ${today(latest.day)}`, title: latest.title, text: latest.text, meta: today(latest.day), href: "/sign-up", cta: hi ? "और पढ़ें" : "Read more" }] : []),
  ];
  const cards = (list: Card[], folder: string, kicker: string): CarouselSlide[] => list.map(card => ({ id: card.id, image: `/images/landing/${folder}/${card.id}.webp`, kicker, title: hi ? card.title[1] : card.title[0], text: hi ? card.text[1] : card.text[0], href: "/sign-up", cta: hi ? "और पढ़ें" : "Read more" }));
  const notes = cards(NOTES, "notes", hi ? "नोट्स और बुकमार्क" : "Notes & bookmarks");
  const search = cards(SEARCH, "search", hi ? "AI सर्च" : "AI Search");
  const carousels: Record<string, ReactNode> = {
    "ai-search": <CoverCarousel slides={search} label={hi ? "AI सर्च" : "AI Search"} />,
    "lesson-packs": <CoverCarousel slides={slides} label={hi ? "विशेष पाठ" : "Featured lessons"} />,
    "notes-bookmarks": <CoverCarousel slides={notes} label={hi ? "नोट्स और बुकमार्क" : "Notes & bookmarks"} />,
  };
  return <>{FEATURES.map((feature, index) => <FeatureSection key={feature.id} feature={feature} index={index} total={FEATURES.length} float={carousels[feature.id]} />)}</>;
}
