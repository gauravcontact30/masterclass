"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { useLanguage } from "./language-provider";
import styles from "./landing-discovery.module.css";

const slides = [
  { image: "school", label: ["SCHOOL & BOARD PREPARATION", "स्कूल और बोर्ड तैयारी"], title: ["Small steps. Strong foundations.", "छोटे कदम। मज़बूत आधार।"], body: ["Build understanding with school notes, worked answers and practice for your chosen board and class.", "अपने बोर्ड और कक्षा के नोट्स, हल सहित उत्तर और अभ्यास से समझ बढ़ाएँ।"], tags: "CBSE · NCERT · ICSE · ISC", alt: "Two students learning together with a tablet and notebooks in a library" },
  { image: "exams", label: ["GOVERNMENT & ENTRANCE EXAMS", "सरकारी और प्रवेश परीक्षाएँ"], title: ["One ambition. A clearer direction.", "एक लक्ष्य। स्पष्ट दिशा।"], body: ["Choose your examination. Bring foundation concepts, objective questions and timed practice into one focused dashboard.", "अपनी परीक्षा चुनें। आधारभूत अवधारणाएँ, वस्तुनिष्ठ प्रश्न और समयबद्ध अभ्यास एक डैशबोर्ड में पाएँ।"], tags: "SSC · NDA · Banking · JEE · NEET", alt: "A student preparing for competitive examinations at her study desk" },
  { image: "systems", label: ["TECHNOLOGY & SYSTEM DESIGN", "तकनीक और सिस्टम डिज़ाइन"], title: ["Learn the code. Understand the system.", "कोड सीखें। सिस्टम समझें।"], body: ["Explore practical software guides and architecture case studies, from messaging and e-commerce to payments and AI automation.", "व्यावहारिक सॉफ्टवेयर गाइड और आर्किटेक्चर पढ़ें—मैसेजिंग, ई-कॉमर्स, भुगतान और AI ऑटोमेशन तक।"], tags: "Code · Architecture · APIs · Interviews", alt: "Two engineers exploring code and an architecture diagram together" },
  { image: "language", label: ["ENGLISH & LANGUAGE SKILLS", "अंग्रेज़ी और भाषा कौशल"], title: ["Find your words. Build your confidence.", "शब्द सीखें। आत्मविश्वास बढ़ाएँ।"], body: ["Develop vocabulary, grammar and IELTS foundations with clear explanations and purposeful practice. Learn in English or Hindi.", "स्पष्ट व्याख्या और अभ्यास से शब्दावली, व्याकरण और IELTS के आधार सीखें। अंग्रेज़ी या हिन्दी में पढ़ें।"], tags: "English · Vocabulary · IELTS · हिन्दी", alt: "A learner practising spoken English with headphones and a tablet" },
];
const subscribeMotion = (notify: () => void) => { const query = window.matchMedia?.("(prefers-reduced-motion: reduce)"); query?.addEventListener?.("change", notify); return () => query?.removeEventListener?.("change", notify); };
const motionSnapshot = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
export function LandingHero() {
  const { language } = useLanguage(); const hi = language === "hi"; const lang = hi ? 1 : 0;
  const reduced = useSyncExternalStore(subscribeMotion, motionSnapshot, () => false);
  const [index, setIndex] = useState(0); const [paused, setPaused] = useState(false); const [hover, setHover] = useState(false); const [focus, setFocus] = useState(false);
  const rotating = !paused && !reduced && !hover && !focus;
  useEffect(() => { if (!rotating) return; const timer = setTimeout(() => setIndex(value => (value + 1) % slides.length), 6500); return () => clearTimeout(timer); }, [rotating, index]);
  return <section id="top" className={styles.hero} aria-label={hi ? "अध्ययन पथ स्लाइड शो" : "Learning paths slideshow"} aria-roledescription="carousel" data-rotating={rotating} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setFocus(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false); }}>
    <div className={styles.controls}><button aria-label={hi ? "पिछली स्लाइड" : "Previous slide"} onClick={() => setIndex(value => (value + 3) % 4)}><ChevronLeft size={17}/></button>{slides.map((slide, i) => <button key={slide.image} className={styles.dot} aria-label={hi ? `स्लाइड ${i + 1}` : `Go to slide ${i + 1}`} aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)} />)}<button aria-label={hi ? "अगली स्लाइड" : "Next slide"} onClick={() => setIndex(value => (value + 1) % 4)}><ChevronRight size={17}/></button><button aria-label={paused ? hi ? "स्लाइड शो चलाएँ" : "Play slideshow" : hi ? "स्लाइड शो रोकें" : "Pause slideshow"} onClick={() => setPaused(value => !value)}>{paused ? <Play size={15}/> : <Pause size={15}/>}</button></div>
    <div aria-live={rotating ? "off" : "polite"}>{slides.map((slide, i) => <article key={slide.image} className={styles.slide} hidden={i !== index} role="group" aria-roledescription="slide" aria-label={`${i + 1} / 4`}>
      <Image src={`/images/learning/${slide.image}.png`} alt={slide.alt} fill sizes="100vw" preload={i === 0} className={styles.image}/><div className={styles.shade}/><div className={styles.copy}><span className={styles.eyebrow}><ExpandedText text={slide.label[lang]} /></span>{i === 0 ? <h1><ExpandedText text={slide.title[lang]} /></h1> : <h2><ExpandedText text={slide.title[lang]} /></h2>}<p><ExpandedText text={slide.body[lang]} /></p><div className={styles.actions}><Link href="/dashboard?tab=plans"><ExpandedText text={hi ? "तैयारी और सदस्यता चुनें" : "Choose preparation & membership"} /><ArrowRight size={17}/></Link><a href="#paths"><ExpandedText text={hi ? "अध्ययन पथ देखें" : "Explore learning paths"} /><ArrowUpRight size={16}/></a></div><small><ExpandedText text={slide.tags} /></small><span className={styles.membership}><ExpandedText text={hi ? "मासिक / वार्षिक सदस्यता · केवल Learn in App" : "Monthly / yearly membership · Learn in App"} /></span></div>
    </article>)}</div>
  </section>;
}
type Category = { name: string; hi: string; group: "school" | "exams" | "tech" | "design" | "language"; topics: string[] };
const categories: Category[] = [
  { name: "Mathematics", hi: "गणित", group: "school", topics: ["Arithmetic", "Algebra", "Geometry", "Probability"] },
  { name: "Physics", hi: "भौतिक विज्ञान", group: "school", topics: ["Motion", "Forces", "Energy", "Electricity"] },
  { name: "Chemistry", hi: "रसायन विज्ञान", group: "school", topics: ["Atoms", "Moles", "Reactions", "Chemical bonding"] },
  { name: "SSC & Government Exams", hi: "SSC और सरकारी परीक्षाएँ", group: "exams", topics: ["Quantitative aptitude", "Reasoning", "English", "General awareness"] },
  { name: "JEE / IIT & NEET", hi: "JEE / IIT और NEET", group: "exams", topics: ["Mathematics", "Physics", "Chemistry", "Biology"] },
  { name: "System Design", hi: "सिस्टम डिज़ाइन", group: "design", topics: ["WhatsApp", "Instagram", "E-commerce", "Payments", "AI automation"] },
  { name: "React & Next.js", hi: "React और Next.js", group: "tech", topics: ["Components", "Hooks", "Routing", "Server rendering"] },
  { name: "Python", hi: "Python", group: "tech", topics: ["Functions", "Types", "Classes", "Testing"] },
  { name: "Cloud & DevOps", hi: "Cloud और DevOps", group: "tech", topics: ["AWS", "CI/CD", "Infrastructure", "Observability"] },
  { name: "English & IELTS", hi: "अंग्रेज़ी और IELTS", group: "language", topics: ["Grammar", "Writing", "Reading", "Speaking"] },
  { name: "Vocabulary", hi: "शब्दावली", group: "language", topics: ["Context", "Synonyms", "Antonyms", "Word families"] },
];
export function CourseMarquee() {
  const { language } = useLanguage(); const hi = language === "hi"; const [selected, setSelected] = useState<Category | null>(null); const [paused, setPaused] = useState(false);
  const points = selected ? [
    [hi ? "अध्ययन क्षेत्र" : "Topics to explore", selected.topics.join(" · ")],
    [hi ? "समझ की शुरुआत" : "Build understanding", hi ? "मुख्य विचार, नियम और उदाहरण क्रम से पढ़ें।" : "Work through core ideas, rules and examples in a clear sequence."],
    [hi ? "अभ्यास में लागू करें" : "Apply what you learn", selected.group === "tech" ? hi ? "कोड उदाहरण, फाइल संरचना और API विवरण से अभ्यास करें।" : "Explore code examples with project files and API explanations." : selected.group === "design" ? hi ? "आवश्यकताएँ, डेटा मॉडल, API, विफलता और स्केलिंग पर तर्क करें।" : "Reason about requirements, data models, APIs, failures and scaling." : hi ? "हल सहित प्रश्नों से तरीका समझें और अपना उत्तर जाँचें।" : "Use worked questions to understand the method and review your answer."],
    [hi ? "गलतियों से सीखें" : "Review common mistakes", hi ? "उत्तर के पीछे का कारण समझें और अपनी पुनरावृत्ति के लिए नोट्स रखें।" : "Understand the reasoning behind an answer and keep personal revision notes."],
    [hi ? "अपना अध्ययन क्षेत्र" : "Your focused dashboard", hi ? "सदस्यता लेते समय तैयारी चुनें; डैशबोर्ड में वही पथ दिखेंगे।" : "Select your preparation when subscribing; your dashboard shows those paths."],
    [hi ? "प्रकाशित कवरेज" : "Published coverage", hi ? "यह कोर्स परिचय है। स्कूल और परीक्षा गाइड अभी आधारभूत सामग्री देते हैं; पूरा पाठ्यक्रम अभी उपलब्ध नहीं है।" : "This is a course overview. School and exam guides currently provide foundations; complete syllabus coverage is not yet available."],
  ] : [];
  return <><section className={styles.marquee} aria-label={hi ? "कोर्स श्रेणियाँ" : "Course categories"}><div className={styles.marqueeLabel}><Sparkles size={16}/><span><ExpandedText text={hi ? "अपना अगला विषय खोजें" : "Find your next subject"} /></span><button aria-label={paused ? hi ? "श्रेणियाँ चलाएँ" : "Play categories" : hi ? "श्रेणियाँ रोकें" : "Pause categories"} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={14}/> : <Pause size={14}/>}</button></div><div className={styles.marqueeWindow}><div className={styles.track} data-paused={paused || !!selected}>{[0, 1].map(copy => <div className={styles.categorySet} key={copy} aria-hidden={copy === 1 ? true : undefined}>{categories.map(item => <button key={item.name} tabIndex={copy ? -1 : 0} onClick={() => setSelected(item)}><ExpandedText text={hi ? item.hi : item.name} /><ArrowUpRight size={14}/></button>)}</div>)}</div></div></section>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className={styles.modal}><span className={styles.eyebrow}><ExpandedText text={hi ? "कोर्स परिचय · LEARN IN APP" : "COURSE OVERVIEW · LEARN IN APP"} /></span><DialogTitle>{hi ? selected?.hi : selected?.name}</DialogTitle><DialogDescription><ExpandedText text={hi ? "सदस्यता चुनने से पहले अध्ययन पथ समझें।" : "Explore this learning path before choosing your membership."} /></DialogDescription><h3><ExpandedText text={hi ? "मुख्य बिंदु" : "Key points"} /></h3><div className={`${styles.points} learning-key-points`}>{points.map(([title, body], i) => <article key={title}><span><ExpandedText text={String(i + 1).padStart(2, "0")} /></span><div><h4><ExpandedText text={title} /></h4><p><ExpandedText text={body} /></p></div></article>)}</div><Link className={styles.modalCta} href="/dashboard?tab=plans"><ExpandedText text={hi ? "मासिक / वार्षिक सदस्यता चुनें" : "Choose monthly / yearly membership"} /><ArrowRight size={17}/></Link></DialogContent></Dialog>
  </>;
}
