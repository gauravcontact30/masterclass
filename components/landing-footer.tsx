"use client";
import { ExpandedText } from "@/components/expanded-text";

import Link from "next/link";
import { ArrowUp, Globe2 } from "lucide-react";
import { Wordmark } from "./brand-mark";
import { FooterLinks } from "./footer-links";
import { LandingFooterContact, LandingFooterFacts } from "./landing-footer-contact";
import { useLanguage } from "./language-provider";
import styles from "./landing-footer.module.css";
export function LandingFooter({ year }: { year?: number }) {
  const {language}=useLanguage();const hi=language==="hi";const text=(en:string,hindi:string)=>hi?hindi:en;
  const groups=[
    {title:text("Professional learning","प्रोफ़ेशनल लर्निंग"),links:[[text("Official Docs","ऑफ़िशियल डॉक्स"),"/learning/official-docs"],[text("API Docs","API डॉक्स"),"/learning/api-docs"],[text("Techy code lab","Techy कोड लैब"),"/learning/techy"],[text("Lessons","पाठ"),"/learning/lessons"],[text("Certifications","सर्टिफ़िकेशन"),"/learning/certifications"]]},
    {title:text("AI & agents","AI और एजेंट"),links:[[text("Agentic workflows","एजेंटिक वर्कफ़्लो"),"/learning/workflow"],[text("On The Go guides","On The Go गाइड"),"/learning/step-by-step"],[text("AI search","AI खोज"),"/learning/search"],[text("Mentors","मेंटर"),"/learning/mentors"],[text("Interview practice","इंटरव्यू अभ्यास"),"/learning/interview"]]},
    {title:text("Courses & skills","कोर्स और कौशल"),links:[[text("System Design","सिस्टम डिज़ाइन"),"/learning/system-design"],[text("Technology courses","तकनीकी कोर्स"),"/learning/technology"],[text("English & IELTS","अंग्रेज़ी और IELTS"),"/learning/languages"],[text("Interview prep","इंटरव्यू की तैयारी"),"#interview-prep"],[text("Course overview","कोर्स परिचय"),"/courses"]]},
    {title:text("Free library","मुफ़्त लाइब्रेरी"),links:[[text("Interview questions","इंटरव्यू प्रश्न"),"/interview-questions"],[text("Comparisons","तुलनाएँ"),"/compare"],[text("Workflow blueprints","वर्कफ़्लो ब्लूप्रिंट"),"/workflows"],[text("Technology handbooks","तकनीकी हैंडबुक"),"/learn"],[text("API reference","API संदर्भ"),"/api-reference","plain"],[text("English vocabulary","अंग्रेज़ी शब्दावली"),"/vocabulary"]]},
    {title:text("Your learning space","आपका अध्ययन क्षेत्र"),links:[[text("Dashboard","डैशबोर्ड"),"/learning"],[text("My Library","मेरी लाइब्रेरी"),"/learning/library"],[text("Monthly / yearly plans","मासिक / वार्षिक योजनाएँ"),"#pricing"],[text("Sign in","साइन इन"),"/sign-in"],[text("All courses","सभी कोर्स"),"/courses"]]},
    {title:text("Company","कंपनी"),links:[[text("About us","हमारे बारे में"),"/about"],[text("Contact us","संपर्क करें"),"/contact"],[text("Privacy policy","गोपनीयता नीति"),"/privacy"],[text("Terms & conditions","नियम और शर्तें"),"/terms"],[text("Cancellation & refunds","रद्दीकरण और रिफ़ंड"),"/refund-policy"]]},
  ];
  function moveTop(){const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;window.scrollTo({top:0,behavior:reduced?"instant":"smooth"});document.getElementById("main-content")?.focus({preventScroll:true});}
  return <footer id="site-footer" className={styles.footer}><div className={styles.inner}>
    <div className={styles.intro}><div className={styles.brand}><Link href="/" aria-label="MasterClass Buddy home"><Wordmark/></Link><p><ExpandedText text={text("A clear path from your next lesson to your next goal.","अगले पाठ से अगले लक्ष्य तक एक स्पष्ट अध्ययन पथ।")} /></p></div><div className={styles.cards}><LandingFooterContact /><LandingFooterFacts /></div></div>
    <div className={styles.columns}>{groups.map(group=><nav key={group.title} aria-label={group.title}><div className={styles.columnTitle}>{group.title}</div><FooterLinks links={group.links} column={groups.indexOf(group)} /></nav>)}</div>
    <div className={styles.bottom}><small>© {year} MasterClass. <ExpandedText text={text("All rights reserved.","सर्वाधिकार सुरक्षित।")} /></small><span><Globe2 size={14}/> {language === "hi" ? "हिन्दी / English" : "English / Multilingual"} <i/> {useLanguage().t("learn")}</span><button onClick={moveTop}><ExpandedText text={text("Move to top","ऊपर जाएँ")} /><ArrowUp size={15}/></button></div>
  </div></footer>;
}
