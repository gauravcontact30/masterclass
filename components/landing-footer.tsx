"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, BookOpen, Globe2 } from "lucide-react";
import { Wordmark } from "./brand-mark";
import { useLanguage } from "./language-provider";
import styles from "./landing-footer.module.css";
import navigationStyles from "./navigation-link.module.css";
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
    <div className={styles.intro}><div className={styles.brand}><Link href="/" aria-label="Master Class Buddy home"><Wordmark/></Link><p><ExpandedText text={text("A clear path from your next lesson to your next goal.","अगले पाठ से अगले लक्ष्य तक एक स्पष्ट अध्ययन पथ।")} /></p></div><Link className={styles.invite} href="/learning/plans"><BookOpen size={19}/><span><strong><ExpandedText text={text("Make room for learning","सीखने के लिए समय बनाएँ")} /></strong><small><ExpandedText text={text("Choose your preparation and membership","अपनी तैयारी और सदस्यता चुनें")} /></small></span><ArrowUpRight size={18}/></Link></div>
    <div className={styles.columns}>{groups.map(group=><nav key={group.title} aria-label={group.title}><h3>{group.title}</h3><FooterLinks links={group.links} column={groups.indexOf(group)} /></nav>)}</div>
    <div className={styles.bottom}><small>© {year} MasterClass. <ExpandedText text={text("All rights reserved.","सर्वाधिकार सुरक्षित।")} /></small><span><Globe2 size={14}/> {language === "hi" ? "हिन्दी / English" : "English / Multilingual"} <i/> {useLanguage().t("learn")}</span><button onClick={moveTop}><ExpandedText text={text("Move to top","ऊपर जाएँ")} /><ArrowUp size={15}/></button></div>
  </div></footer>;
}

type Pill = { top: number; right: number; bottom: number; left: number; visible: boolean; tone: string };
/** Each link has its own hover colour; all keep the light link text at 4.5:1 or better. */
const TONES = ["#bb5834", "#2f7a4f", "#5b45a8", "#1d5a85", "#9a2f55", "#11706a", "#8a5a00"];

/**
 * A footer column's links with the header's hover effect: one pill, in a different colour for each link, that
 * slides to the hovered or focused link (a full-size layer revealed with
 * clip-path, so it moves without layout) and fades out when the pointer leaves.
 */
function FooterLinks({ links, column = 0 }: { links: string[][]; column?: number }) {
  const pillRef = useRef<HTMLSpanElement>(null);
  const [pill, setPill] = useState<Pill>({ top: 0, right: 0, bottom: 0, left: 0, visible: false, tone: TONES[0] });
  const moveTo = useCallback((link: HTMLElement | null, index = 0) => {
    const layer = pillRef.current;
    if (!link || !layer) { setPill(current => ({ ...current, visible: false })); return; }
    // Measured against the pill's own layer, which overhangs the list so no pill is ever cut off.
    const box = layer.getBoundingClientRect(), at = link.getBoundingClientRect();
    setPill({ top: at.top - box.top, left: at.left - box.left, right: box.right - at.right, bottom: box.bottom - at.bottom, visible: true, tone: TONES[(column * 3 + index) % TONES.length] });
  }, [column]);
  return <ul className={styles.links} onMouseLeave={() => moveTo(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) moveTo(null); }}>
    <span ref={pillRef} className={styles.pill} aria-hidden="true" data-visible={pill.visible || undefined}
      style={{ clipPath: `inset(${pill.top}px ${pill.right}px ${pill.bottom}px ${pill.left}px round 999px)`, backgroundColor: pill.tone }} />
    {links.map(([label, href], index) => <li key={label}><Link className={navigationStyles.link} href={href}
      onMouseEnter={event => moveTo(event.currentTarget, index)} onFocus={event => moveTo(event.currentTarget, index)}>{label}</Link></li>)}
  </ul>;
}
