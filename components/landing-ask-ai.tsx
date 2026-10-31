"use client";
import { useId, useState, type FormEvent } from "react";
import { ArrowUp, GraduationCap, Sparkles } from "lucide-react";
import { askStudyBuddy, type StudyBuddyMode } from "@/lib/study-buddy-bridge";
import { useLanguage } from "./language-provider";
import { HINDI_ENABLED } from "@/lib/i18n";
import home from "./landing-home.module.css";
import styles from "./landing-ask-ai.module.css";

const STARTERS: { en: string; hi: string; mode: StudyBuddyMode }[] = [
  { en: "Explain JavaScript closures like I am new to them", hi: "JavaScript closures को आसान भाषा में समझाइए", mode: "study" },
  { en: "Quiz me on SQL joins", hi: "SQL joins पर मुझसे क्विज़ पूछिए", mode: "study" },
  { en: "How do I answer “Tell me about a project” in an interview?", hi: "इंटरव्यू में “अपने प्रोजेक्ट के बारे में बताइए” का जवाब कैसे दूँ?", mode: "interview" },
  { en: "Summarize how a RAG pipeline works before my AI interview", hi: "AI इंटरव्यू से पहले RAG पाइपलाइन कैसे काम करती है, इसका सार बताइए", mode: "study" },
];

/**
 * "Try the AI tutor now": a question box on the landing page that opens Study Buddy with the answer already
 * streaming, so a visitor experiences the product before signing up. No model code here: it hands the question
 * to components/student-chatbot.tsx through lib/study-buddy-bridge.ts.
 */
export function LandingAskAi() {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const [question, setQuestion] = useState("");
  const id = useId();
  const send = (value: string, mode: StudyBuddyMode = "study") => { if (value.trim()) { askStudyBuddy({ question: value, mode }); setQuestion(""); } };
  const submit = (event: FormEvent) => { event.preventDefault(); send(question); };
  return <section id="ask-ai" className={styles.section} aria-labelledby={`${id}-title`}><div className={home.inner}>
    <div className={styles.card}>
      <div className={styles.copy}>
        <p className={styles.kicker}><Sparkles size={14} aria-hidden="true" />{text("AI tutor · free to try", "AI ट्यूटर · मुफ़्त में आज़माएँ")}</p>
        <h2 id={`${id}-title`}>{text("Stuck on something? ", "कहीं अटके हैं? ")}<em>{text("Ask Study Buddy.", "Study Buddy से पूछिए।")}</em></h2>
        <p className={styles.lede}>{text(`Clear explanations, worked examples, quick quizzes and interview answers${HINDI_ENABLED ? ", in English or Hindi" : ""}. Answers appear as they are written, with links to the matching notes.`, "साफ़ व्याख्या, हल किए उदाहरण, छोटे क्विज़ और इंटरव्यू उत्तर, अंग्रेज़ी या हिन्दी में। उत्तर लिखते-लिखते दिखते हैं, साथ में संबंधित नोट्स के लिंक।")}</p>
      </div>
      <form className={styles.form} onSubmit={submit}>
        <label htmlFor={`${id}-q`} className={styles.label}>{text("Your question", "आपका प्रश्न")}</label>
        <div className={styles.row}>
          <GraduationCap size={18} aria-hidden="true" />
          <input id={`${id}-q`} value={question} onChange={e => setQuestion(e.target.value)} maxLength={600} placeholder={text("Ask about any topic, assignment or interview question…", "किसी भी विषय, असाइनमेंट या इंटरव्यू प्रश्न के बारे में पूछें…")} />
          <button type="submit" disabled={!question.trim()} aria-label={text("Ask Study Buddy", "Study Buddy से पूछें")}><ArrowUp size={18} aria-hidden="true" /></button>
        </div>
        <ul className={styles.starters} aria-label={text("Try one of these", "इनमें से कोई आज़माएँ")}>
          {STARTERS.map(s => <li key={s.en}><button type="button" onClick={() => send(hi ? s.hi : s.en, s.mode)}>{hi ? s.hi : s.en}</button></li>)}
        </ul>
      </form>
    </div>
  </div></section>;
}
