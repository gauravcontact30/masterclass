"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BookOpenCheck, FileText, Globe2, Languages, Mic, PenLine, Timer } from "lucide-react";
import { RouteH1 } from "@/components/route-heading";
import { buildIeltsPapers, IELTS_YEARS } from "@/lib/ielts/bank";
import { useLanguage } from "./language-provider";
import shared from "./board-exams.module.css";

/*
 * IELTS Achievers · IELTS Dashboard (/ielts/dashboard, 2026-11-24): Sample Papers (sample papers, timed mock tests,
 * 12 years of practice sets and the most asked questions, 480 questions with answers, lib/ielts/bank.ts) and the
 * Preparation Hub (format, practice, topics and band calculator, components/ielts-preparation.tsx).
 */
const ExamSamplePapers = dynamic(() => import("./exam-sample-papers").then(m => m.ExamSamplePapers), { loading: () => <Loading /> });
const IeltsPreparation = dynamic(() => import("./ielts-preparation").then(m => m.IeltsPreparation), { loading: () => <Loading /> });
function Loading() { return <div className={shared.skeleton} aria-busy="true" aria-label="Loading"><span /><span /><span /></div>; }

type View = "papers" | "hub";

export function IeltsDashboard({ initialView = "papers" }: { initialView?: View }) {
  const { language } = useLanguage(); const tr = (en: string, hindi: string) => language === "hi" ? hindi : en;
  const [view, setView] = useState<View>(initialView);
  const set = useMemo(() => view === "papers" ? buildIeltsPapers() : null, [view]);
  const pick = (next: View) => {
    setView(next);
    const url = new URL(window.location.href); url.searchParams.set("view", next); window.history.replaceState(window.history.state, "", url);
  };
  const VIEWS: { id: View; label: string; hint: string; icon: typeof FileText }[] = [
    { id: "papers", label: tr("Sample Papers", "नमूना प्रश्न-पत्र"), hint: tr(`Sample, mock & ${IELTS_YEARS.length} years · 480 Q&A`, `नमूना, मॉक और ${IELTS_YEARS.length} वर्ष · 480 प्रश्नोत्तर`), icon: FileText },
    { id: "hub", label: tr("Preparation Hub", "तैयारी केंद्र"), hint: tr("Format, practice, topics & band calculator", "प्रारूप, अभ्यास, विषय और बैंड कैलकुलेटर"), icon: BookOpenCheck },
  ];

  return <div className={shared.page}>
    <header className={shared.hero}>
      <div className={shared.heroText}>
        <p className={shared.eyebrow}><Languages size={14} aria-hidden="true" />IELTS Achievers · IELTS Dashboard</p>
        <RouteH1>{tr("IELTS preparation, ", "IELTS की तैयारी, ")}<em>{tr("paper by paper", "पेपर दर पेपर")}</em></RouteH1>
        <p>{tr(`Academic and General Training: sample papers and timed mock tests in test order, practice sets for the last ${IELTS_YEARS.length} years and the most asked questions, rated by stars. Reading, vocabulary, grammar, band scores, Writing Task 2 and Speaking Part 3, with an answer for every question.`,
          `Academic और General Training: परीक्षा के क्रम में नमूना पेपर और समयबद्ध मॉक टेस्ट, पिछले ${IELTS_YEARS.length} वर्षों के अभ्यास सेट और सितारों से रेटेड सबसे अधिक पूछे जाने वाले प्रश्न। Reading, शब्दावली, व्याकरण, बैंड स्कोर, Writing Task 2 और Speaking Part 3, हर प्रश्न के उत्तर के साथ। प्रश्न अंग्रेज़ी में हैं, क्योंकि IELTS अंग्रेज़ी की परीक्षा है।`)}</p>
        <ul className={shared.highlights} aria-label={tr("What you get", "आपको क्या मिलेगा")}>
          <li><Globe2 size={14} aria-hidden="true" />Academic · General Training</li>
          <li><Timer size={14} aria-hidden="true" />{tr("Timed mock tests", "समयबद्ध मॉक टेस्ट")}</li>
          <li><PenLine size={14} aria-hidden="true" />{tr("Writing Task 2 plans", "Writing Task 2 की योजनाएँ")}</li>
          <li><Mic size={14} aria-hidden="true" />{tr("Speaking model answers", "Speaking के आदर्श उत्तर")}</li>
        </ul>
      </div>
      <dl className={shared.stats}>
        <div><dt>{tr("Questions with answers", "उत्तर सहित प्रश्न")}</dt><dd>480</dd></div>
        <div><dt>{tr("Papers", "पेपर")}</dt><dd>{12 + IELTS_YEARS.length}</dd></div>
        <div><dt>{tr("Topics", "विषय")}</dt><dd>30</dd></div>
      </dl>
    </header>

    <section className={shared.step} aria-labelledby="ielts-view">
      <h2 id="ielts-view"><span>1</span>{tr("Choose what to study", "चुनें कि क्या पढ़ना है")}</h2>
      <div className={shared.views} role="tablist" aria-label="IELTS dashboard">
        {VIEWS.map(v => <button key={v.id} type="button" role="tab" aria-selected={v.id === view} aria-controls="ielts-panel" className={shared.view} onClick={() => pick(v.id)}>
          <v.icon size={18} aria-hidden="true" /><span><strong>{v.label}</strong><small>{v.hint}</small></span></button>)}
      </div>
    </section>

    <section id="ielts-panel" className={shared.panel} role="tabpanel" aria-label={VIEWS.find(v => v.id === view)!.label}>
      {view === "papers" && set && <>
        <div className={shared.panelHead}><h2>IELTS · {tr("Sample Papers", "नमूना प्रश्न-पत्र")}</h2><p>{set.asked.length} {tr("questions with answers", "उत्तर सहित प्रश्न")}</p></div>
        <ExamSamplePapers set={set} boardName="IELTS" title="IELTS" copy={{
          yearsTab: `Previous ${IELTS_YEARS.length} years`,
          lede: <>IELTS Academic and General Training: {set.unique} different questions across {set.sample.length + set.mock.length + set.years.length} papers of {set.sample[0]?.questions.length} questions, in test order (Reading, vocabulary, grammar and linking, band scores, Writing Task 2, Speaking Part 3), plus all {set.asked.length} questions by star rating. Original practice material, not official IELTS questions.</>,
          yearNote: paper => paper.note,
          askedNote: "Highest rated first. Five stars marks the themes candidates report most often in recent tests; it is our editorial rating, not an official count.",
          mockNote: <>Timed at {set.mock[0]?.minutes} minutes. Start the test, answer the Reading, vocabulary, grammar and band questions, write the Task 2 essay and speak the Part 3 answers aloud, then submit to see your score and every model answer.</>,
        }} />
      </>}
      {view === "hub" && <IeltsPreparation />}
    </section>
  </div>;
}
