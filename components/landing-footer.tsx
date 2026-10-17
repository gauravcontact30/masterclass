"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, BookOpen, Globe2 } from "lucide-react";
import { Wordmark } from "./brand-mark";
import { useLanguage } from "./language-provider";
import styles from "./landing-footer.module.css";
import navigationStyles from "./navigation-link.module.css";
export function LandingFooter() {
  const {language}=useLanguage();const hi=language==="hi";const text=(en:string,hindi:string)=>hi?hindi:en;
  const groups=[
    {title:text("School & boards","स्कूल और बोर्ड"),links:[["CBSE","/dashboard/cbse"],["NCERT","/dashboard/ncert"],["ICSE","/dashboard/icse"],["ISC","/dashboard/isc"],[text("Classes 6–12","कक्षा 6–12"),"/courses#cbse"]]},
    {title:text("Exam preparation","परीक्षा की तैयारी"),links:[["SSC","/dashboard/ssc"],[text("NDA & defence","NDA और रक्षा"),"/dashboard/defence"],[text("Banking & railways","बैंकिंग और रेलवे"),"/courses#ssc"],["JEE / IIT","/dashboard/engineering"],["NEET","/dashboard/medical"]]},
    {title:text("Courses & skills","कोर्स और कौशल"),links:[[text("System Design","सिस्टम डिज़ाइन"),"/dashboard/system-design"],[text("Technology courses","तकनीकी कोर्स"),"/dashboard/technology"],[text("English & IELTS","अंग्रेज़ी और IELTS"),"/dashboard/languages"],[text("Interview prep","इंटरव्यू की तैयारी"),"#interview-prep"],[text("Course overview","कोर्स परिचय"),"/courses"]]},
    {title:text("Free library","मुफ़्त लाइब्रेरी"),links:[[text("Interview questions","इंटरव्यू प्रश्न"),"/interview-questions"],[text("Comparisons","तुलनाएँ"),"/compare"],[text("Workflow blueprints","वर्कफ़्लो ब्लूप्रिंट"),"/workflows"],[text("Technology handbooks","तकनीकी हैंडबुक"),"/learn"],[text("API reference","API संदर्भ"),"/api-reference"],[text("English vocabulary","अंग्रेज़ी शब्दावली"),"/vocabulary"]]},
    {title:text("Your learning space","आपका अध्ययन क्षेत्र"),links:[[text("Dashboard","डैशबोर्ड"),"/dashboard"],[text("My Library","मेरी लाइब्रेरी"),"/dashboard?tab=library"],[text("Monthly / yearly plans","मासिक / वार्षिक योजनाएँ"),"#pricing"],[text("Sign in","साइन इन"),"/sign-in"],[text("All courses","सभी कोर्स"),"/courses"]]},
    {title:text("Company","कंपनी"),links:[[text("About us","हमारे बारे में"),"/about"],[text("Contact us","संपर्क करें"),"/contact"],[text("Privacy policy","गोपनीयता नीति"),"/privacy"],[text("Terms & conditions","नियम और शर्तें"),"/terms"],[text("Cancellation & refunds","रद्दीकरण और रिफ़ंड"),"/refund-policy"]]},
  ];
  function moveTop(){const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;window.scrollTo({top:0,behavior:reduced?"instant":"smooth"});document.getElementById("main-content")?.focus({preventScroll:true});}
  return <footer id="site-footer" className={styles.footer}><div className={styles.inner}>
    <div className={styles.intro}><div className={styles.brand}><Link href="/" aria-label="MasterClass home"><Wordmark/></Link><p><ExpandedText text={text("A clear path from your next lesson to your next goal.","अगले पाठ से अगले लक्ष्य तक एक स्पष्ट अध्ययन पथ।")} /></p></div><Link className={styles.invite} href="/dashboard?tab=plans"><BookOpen size={19}/><span><strong><ExpandedText text={text("Make room for learning","सीखने के लिए समय बनाएँ")} /></strong><small><ExpandedText text={text("Choose your preparation and membership","अपनी तैयारी और सदस्यता चुनें")} /></small></span><ArrowUpRight size={18}/></Link></div>
    <div className={styles.columns}>{groups.map(group=><nav key={group.title} aria-label={group.title}><h3><ExpandedText text={group.title} /></h3><FooterLinks links={group.links} /></nav>)}</div>
    <div className={styles.bottom}><small>© {new Date().getFullYear()} MasterClass. <ExpandedText text={text("All rights reserved.","सर्वाधिकार सुरक्षित।")} /></small><span><Globe2 size={14}/> English / हिन्दी <i/> Learn in App</span><button onClick={moveTop}><ExpandedText text={text("Move to top","ऊपर जाएँ")} /><ArrowUp size={15}/></button></div>
  </div></footer>;
}

type Pill = { top: number; right: number; bottom: number; left: number; visible: boolean };

/**
 * A footer column's links with the header's hover effect: one orange pill that
 * slides to the hovered or focused link (a full-size layer revealed with
 * clip-path, so it moves without layout) and fades out when the pointer leaves.
 */
function FooterLinks({ links }: { links: string[][] }) {
  const pillRef = useRef<HTMLSpanElement>(null);
  const [pill, setPill] = useState<Pill>({ top: 0, right: 0, bottom: 0, left: 0, visible: false });
  const moveTo = useCallback((link: HTMLElement | null) => {
    const layer = pillRef.current;
    if (!link || !layer) { setPill(current => ({ ...current, visible: false })); return; }
    // Measured against the pill's own layer, which overhangs the list so no pill is ever cut off.
    const box = layer.getBoundingClientRect(), at = link.getBoundingClientRect();
    setPill({ top: at.top - box.top, left: at.left - box.left, right: box.right - at.right, bottom: box.bottom - at.bottom, visible: true });
  }, []);
  return <ul className={styles.links} onMouseLeave={() => moveTo(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) moveTo(null); }}>
    <span ref={pillRef} className={styles.pill} aria-hidden="true" data-visible={pill.visible || undefined}
      style={{ clipPath: `inset(${pill.top}px ${pill.right}px ${pill.bottom}px ${pill.left}px round 999px)` }} />
    {links.map(([label, href]) => <li key={label}><Link className={navigationStyles.link} href={href}
      onMouseEnter={event => moveTo(event.currentTarget)} onFocus={event => moveTo(event.currentTarget)}><ExpandedText text={label} /></Link></li>)}
  </ul>;
}
