"use client";
import { ExpandedText } from "@/components/expanded-text";


import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronRight, CreditCard, HelpCircle, Plus, Sparkles } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./membership-faq.module.css";

export function MembershipFaq() {
  const { language } = useLanguage();
  const text = (en: string, hi: string) => language === "hi" ? hi : en;
  const base = useId();
  const [selection, setSelection] = useState<{ topic: string; open: number | null }>({ topic: "start", open: 0 });
  const topics = [
    { id: "start", label: text("Getting started", "शुरुआत करें"), Icon: Sparkles },
    { id: "learning", label: text("Learning & coverage", "पढ़ाई और कवरेज"), Icon: BookOpen },
    { id: "membership", label: text("Membership", "सदस्यता"), Icon: CreditCard },
  ];
  const questions = [
    { topic: "start", question: text("How do I choose my learning path?", "अपना अध्ययन पथ कैसे चुनूँ?"), answer: text("Choose your exams, school board and class, or technology courses during setup. Your dashboard and learning library will show those selections. You can update your preparation in Membership as your goals change.", "शुरुआत में अपनी परीक्षा, स्कूल बोर्ड और कक्षा या तकनीकी कोर्स चुनें। डैशबोर्ड और सीखने की लाइब्रेरी में वही चयन दिखेंगे। लक्ष्य बदलने पर सदस्यता में तैयारी अपडेट कर सकते हैं।") },
    { topic: "start", question: text("Can I learn in Hindi?", "क्या मैं हिन्दी में पढ़ सकता हूँ?"), answer: text("Yes. English is the default; use the language control to switch to Hindi. School foundations and system-design guidance are bilingual. Code, API names and English-language exercises keep their necessary technical or English text.", "हाँ। अंग्रेज़ी डिफ़ॉल्ट है; भाषा नियंत्रण से हिन्दी चुनें। स्कूल के आधार और सिस्टम डिज़ाइन मार्गदर्शन द्विभाषी हैं। कोड, API नाम और अंग्रेज़ी अभ्यास का आवश्यक पाठ मूल भाषा में रहता है।") },
    { topic: "learning", question: text("Are the four school pathways separate?", "क्या चारों स्कूल पथ अलग हैं?"), answer: text("Yes. CBSE, NCERT, ICSE and ISC each have a dedicated dashboard page. NCERT is a textbook and resource pathway. Language supplements are labelled separately from board-exam subjects.", "हाँ। CBSE, NCERT, ICSE और ISC के अलग डैशबोर्ड पृष्ठ हैं। NCERT पाठ्यपुस्तक और संसाधन पथ है। भाषा पूरक सामग्री बोर्ड विषयों से अलग बताई जाती है।") },
    { topic: "learning", question: text("What is covered in the study guides?", "अध्ययन गाइड में क्या शामिल है?"), answer: text("School and exam guides currently offer foundation lessons and original practice. Check View coverage on each guide for its scope. A complete verified previous-year paper archive is not yet published; historical years and ask ratings require identified source papers.", "स्कूल और परीक्षा गाइड अभी आधारभूत पाठ और मौलिक अभ्यास देते हैं। हर गाइड में कवरेज देखें। पूर्ण सत्यापित पुराने प्रश्न पत्र संग्रह अभी प्रकाशित नहीं है; वर्ष और आवृत्ति के लिए पहचाने गए स्रोत प्रश्न पत्र आवश्यक हैं।") },
    { topic: "learning", question: text("What does System Design include?", "सिस्टम डिज़ाइन में क्या है?"), answer: text("Twelve educational case studies cover messaging, social feeds, media sharing, food delivery, college management, e-commerce, payments, AI automation, ride-hailing, streaming, short links and ticket booking. Each includes eight chapters and design-review questions. These are proposed educational designs, not disclosures of private company architecture.", "बारह शैक्षिक अध्ययन मैसेजिंग, सोशल फ़ीड, मीडिया, डिलीवरी, कॉलेज, ई-कॉमर्स, भुगतान, AI, राइड, स्ट्रीमिंग, छोटे लिंक और टिकट बुकिंग पर हैं। प्रत्येक में आठ अध्याय और समीक्षा प्रश्न हैं। ये शैक्षिक प्रस्तावित डिज़ाइन हैं, निजी कंपनी संरचना का खुलासा नहीं।") },
    { topic: "membership", question: text("When does my membership access begin?", "सदस्यता की पहुँच कब शुरू होती है?"), answer: text("Choose your preparation and a monthly or yearly plan. Access begins after payment verification. Your selected preparation determines the learning content available in your dashboard.", "अपनी तैयारी और मासिक या वार्षिक योजना चुनें। भुगतान सत्यापन के बाद पहुँच शुरू होती है। चुनी तैयारी के अनुसार डैशबोर्ड में अध्ययन सामग्री उपलब्ध होगी।") },
    { topic: "membership", question: text("Can I cancel my renewal?", "क्या मैं नवीनीकरण रद्द कर सकता हूँ?"), answer: text("You can cancel renewal from Membership. Your access continues through the period you have already paid for.", "सदस्यता से नवीनीकरण रद्द कर सकते हैं। जिस अवधि का भुगतान किया है, उसके अंत तक पहुँच जारी रहती है।") },
  ];
  const visible = questions.filter(item => item.topic === selection.topic);
  const selectedTopic = topics.find(topic => topic.id === selection.topic)!;
  const descriptions: Record<string, string> = {
    start: text("Find your path and feel at home.", "अपना रास्ता चुनें और शुरुआत करें।"),
    learning: text("Know what is inside your library.", "जानें आपकी लाइब्रेरी में क्या है।"),
    membership: text("Plans, access and renewal, explained.", "योजनाएँ, पहुँच और नवीनीकरण समझें।"),
  };
  return <section id="faq" className={styles.section} aria-labelledby={`${base}-title`}>
    <div className={styles.inner}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}><HelpCircle size={14} aria-hidden="true" /><ExpandedText text={text("MEMBERSHIP, MADE CLEAR", "सदस्यता को समझें")} /></span>
        <h2 id={`${base}-title`}><ExpandedText text={text("Your membership questions,", "आपकी सदस्यता के सवाल,")} /><br /><em><ExpandedText text={text("answered.", "यहाँ हैं जवाब।")} /></em></h2>
        <p><ExpandedText text={text("From your first lesson to your next learning goal. Find the details you need to get started with confidence.", "पहले पाठ से अगले लक्ष्य तक। भरोसे के साथ शुरुआत करने के लिए ज़रूरी जानकारी पाएँ।")} /></p>
      </header>
      <div className={styles.workspace}>
        <aside className={styles.navigation}>
          <p className={styles.navigationLabel}><ExpandedText text={text("EXPLORE BY TOPIC", "विषय के अनुसार देखें")} /></p>
          <div className={styles.topics} role="group" aria-label={text("Question topics", "सवालों के विषय")}>
            {topics.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={selection.topic === id} onClick={() => setSelection({ topic: id, open: 0 })}>
              <span className={styles.topicIcon}><Icon size={18} aria-hidden="true" /></span><span><ExpandedText text={label} /></span><ChevronRight className={styles.topicArrow} size={16} aria-hidden="true" />
            </button>)}
          </div>
          <div className={styles.guidance}>
            <span className={styles.guidanceIcon}><BookOpen size={21} aria-hidden="true" /></span>
            <h3><ExpandedText text={text("Your next chapter starts here.", "आपका अगला अध्याय यहीं से।")} /></h3>
            <p><ExpandedText text={text("Choose the preparation and plan that fit your goals.", "अपने लक्ष्यों के अनुसार तैयारी और योजना चुनें।")} /></p>
            <Link href="/dashboard?tab=plans"><ExpandedText text={text("Explore membership", "सदस्यता देखें")} /><ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </aside>
        <div className={styles.answers}>
          <div className={styles.answersHeader}><div><h3><ExpandedText text={selectedTopic.label} /></h3><p><ExpandedText text={descriptions[selection.topic]} /></p></div><span className={styles.count}><ExpandedText text={text(`${visible.length} questions`, `${visible.length} सवाल`)} /></span></div>
          <div className={styles.list}>
            {visible.map((item, index) => {
              const open = selection.open === index;
              const id = `${base}-${selection.topic}-${index}`;
              return <article className={styles.item} data-open={open} key={item.question}>
                <h4><button id={`${id}-button`} type="button" aria-expanded={open} aria-controls={`${id}-answer`} onClick={() => setSelection({ ...selection, open: open ? null : index })}>
                  <span className={styles.number} aria-hidden="true"><ExpandedText text={String(index + 1).padStart(2, "0")} /></span><span className={styles.question}><ExpandedText text={item.question} /></span><span className={styles.toggle}><Plus size={18} aria-hidden="true" /></span>
                </button></h4>
                <div id={`${id}-answer`} role="region" aria-labelledby={`${id}-button`} hidden={!open} className={styles.answer}><p><ExpandedText text={item.answer} /></p></div>
              </article>;
            })}
          </div>
          <div className={styles.note}><Check size={16} aria-hidden="true" /><p><ExpandedText text={text("A little clarity now. More time for learning later.", "अभी सवालों के जवाब। आगे सीखने के लिए ज़्यादा समय।")} /></p></div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <p><strong><ExpandedText text={text("See the learning experience for yourself.", "सीखने का अनुभव खुद देखें।")} /></strong><span><ExpandedText text={text("Try a sample question before you choose a plan.", "योजना चुनने से पहले एक नमूना प्रश्न आज़माएँ।")} /></span></p>
        <a href="#practice"><ExpandedText text={text("Try a sample lesson", "नमूना पाठ आज़माएँ")} /><ArrowRight size={17} aria-hidden="true" /></a>
      </div>
    </div>
  </section>;
}
