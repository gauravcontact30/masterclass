"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Languages, Route, ShieldCheck } from "lucide-react";
import { ExpandedText } from "./expanded-text";
import { useLanguage } from "./language-provider";
import { useReveal } from "./use-reveal";
import styles from "./landing-study-engine.module.css";

/**
 * "How an answer is made": a Claude Code style session beside the three rules
 * every generated answer follows. The terminal is a picture of the flow, so it
 * is aria-hidden; the list beside it carries the same facts as real text.
 * Lines appear one after another once the section is in view (CSS only, and
 * static under reduced motion), so this section adds no timers or state.
 */
export function LandingStudyEngine() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const [ref, reveal] = useReveal<HTMLElement>();
  const steps = [
    { Icon: BookOpenCheck, title: text("Your library first", "पहले आपकी लाइब्रेरी"), body: text("Every question is matched against published notes, handbooks and API references before any model is asked.", "किसी मॉडल से पूछने से पहले हर प्रश्न को प्रकाशित नोट्स, हैंडबुक और API संदर्भों से मिलाया जाता है।") },
    { Icon: Route, title: text("The right model for the question", "प्रश्न के लिए सही मॉडल"), body: text("Version-sensitive questions go to a search-grounded model; if one provider is down, the next configured one answers.", "संस्करण से जुड़े प्रश्न खोज-आधारित मॉडल को जाते हैं; एक प्रदाता बंद हो तो अगला उपलब्ध प्रदाता उत्तर देता है।") },
    { Icon: ShieldCheck, title: text("Sources you can check", "जाँचने योग्य स्रोत"), body: text("Grounded answers name the sites they read, so you can verify a fact before you learn it.", "खोज-आधारित उत्तर पढ़ी गई साइटों के नाम बताते हैं, ताकि आप सीखने से पहले तथ्य जाँच सकें।") },
    { Icon: Languages, title: text("English or Hindi", "अंग्रेज़ी या हिन्दी"), body: text("Ask in either language; code, formulas and API names stay exact.", "किसी भी भाषा में पूछें; कोड, सूत्र और API नाम सटीक रहते हैं।") },
  ];
  const models = ["Claude", "Perplexity", "OpenRouter", "Vercel AI Gateway", "Portkey", "Gemini", "Groq", "Mistral"];

  return <section ref={ref} id="study-engine" className={styles.section} data-reveal={reveal} aria-labelledby="study-engine-title"><div className={styles.inner}>
    <header className={styles.head}>
      <h2 id="study-engine-title"><ExpandedText text={text("Ask once. Get an answer you can check.", "एक बार पूछें। जाँचने योग्य उत्तर पाएँ।")} /></h2>
      <p><ExpandedText text={text("Study Buddy and Search answer from your library first, then from the model best suited to the question, and show where the answer came from.", "Study Buddy और Search पहले आपकी लाइब्रेरी से उत्तर देते हैं, फिर प्रश्न के लिए सबसे उपयुक्त मॉडल से, और बताते हैं कि उत्तर कहाँ से आया।")} /></p>
    </header>
    <div className={styles.grid}>
      <div className={styles.terminal} aria-hidden="true">
        <div className={styles.bar}><i /><i /><i /><span>masterclass — study buddy</span></div>
        <div className={styles.screen}>
          <p className={styles.welcome}><span className={styles.spark}>✻</span> {text("Welcome to Study Buddy", "Study Buddy में स्वागत है")}</p>
          <p className={styles.prompt}><span>&gt;</span> {text("what is the 5th term of 3, 7, 11, 15…? explain in Hindi", "3, 7, 11, 15… का पाँचवाँ पद? हिन्दी में समझाएँ")}</p>
          <p className={styles.tool}><span>⎿</span> {text("Searching your library… 3 matching notes", "आपकी लाइब्रेरी खोजी जा रही है… 3 मिलते नोट्स")}</p>
          <p className={styles.tool}><span>⎿</span> {text("Routing: Perplexity · grounded", "रूटिंग: Perplexity · खोज-आधारित")}</p>
          <p className={styles.answer}><span className={styles.dot}>●</span> aₙ = a + (n − 1)d → a₅ = 3 + 4 × 4 = <b>19</b></p>
          <p className={styles.muted}>{text("Count the four gaps, not five.", "चार अंतर गिनें, पाँच नहीं।")}</p>
          <p className={styles.sources}>{text("Sources", "स्रोत")}: ncert.nic.in · cbseacademic.nic.in</p>
          <p className={styles.cursor}><span>&gt;</span> <i /></p>
        </div>
      </div>
      <div className={styles.side}>
        <ol className={styles.steps}>{steps.map(({ Icon, title, body }) => <li key={title}><span className={styles.icon}><Icon size={18} aria-hidden="true" /></span><div><h3><ExpandedText text={title} /></h3><p><ExpandedText text={body} /></p></div></li>)}</ol>
        <div className={styles.models}><span>{text("Works with", "इनके साथ काम करता है")}</span><ul>{models.map(model => <li key={model}>{model}</li>)}</ul></div>
        <Link className={styles.action} href="/dashboard/search"><ExpandedText text={text("Try Search", "Search आज़माएँ")} /><ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </div>
  </div></section>;
}
