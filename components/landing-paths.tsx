"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { BookA, Check, ChevronRight, Clock, Code2, GraduationCap, Info, Landmark, Lock, NotebookPen, Search, type LucideIcon } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./landing-paths.module.css";

type PathId = "school" | "exams" | "courses";
type Path = { id: PathId; icon: LucideIcon; title: string; short: string; body: string; tags: string[]; href: string; route: string };
type Text = (en: string, hindi: string) => string;

/**
 * The three learning paths beside a light tablet that shows the dashboard
 * open in a browser. Picking a path on the left changes what the tablet's
 * screen shows: a worked Class 10 answer, a timed SSC question, or a Next.js
 * build guide. The tablet is an illustration (hidden from assistive tech);
 * the tab panel on the left carries the same facts in text. The tab ids keep
 * the old #school / #exams / #courses anchors working.
 */
export function LandingPaths() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const text: Text = (en, hindi) => hi ? hindi : en;
  const paths: Path[] = [
    { id: "school", icon: GraduationCap, route: "/dashboard/cbse",
      title: text("School & boards", "स्कूल और बोर्ड"), short: text("School", "स्कूल"), body: text("Classes 6–12: maths, English, physics and chemistry foundations, with vocabulary and language practice.", "कक्षा 6–12: गणित, अंग्रेज़ी, भौतिकी और रसायन के आधार, साथ में शब्दावली और भाषा अभ्यास।"),
      tags: ["CBSE", "NCERT", "ICSE", "ISC"], href: "/courses#cbse" },
    { id: "exams", icon: Landmark, route: "/dashboard/ssc",
      title: text("Government & entrance exams", "सरकारी और प्रवेश परीक्षाएँ"), short: text("Exams", "परीक्षाएँ"), body: text("Core concepts and timed practice for SSC, civil services, defence, banking, railways, teaching, JEE and NEET.", "SSC, सिविल सेवा, रक्षा, बैंकिंग, रेलवे, शिक्षण, JEE और NEET के लिए मूल अवधारणाएँ और समयबद्ध अभ्यास।"),
      tags: ["SSC", "UPSC", "JEE", "NEET"], href: "/courses#ssc" },
    { id: "courses", icon: Code2, route: "/dashboard/step-by-step",
      title: text("Technology & system design", "तकनीक और सिस्टम डिज़ाइन"), short: text("Technology", "तकनीक"), body: text("Technology handbooks, build guides, interview practice and system-design case studies.", "तकनीकी हैंडबुक, बिल्ड गाइड, इंटरव्यू अभ्यास और सिस्टम डिज़ाइन केस स्टडी।"),
      tags: ["On The Go", "Techy", "API Docs", "IELTS"], href: "/courses#technology" },
  ];
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Footer links point at #school and #exams: open the matching tab when the hash names one.
  useEffect(() => {
    const ids = ["school", "exams", "courses"];
    const sync = () => { const index = ids.indexOf(window.location.hash.slice(1)); if (index >= 0) setActive(index); };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = ({ ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 } as Record<string, number>)[event.key];
    const target = step ? (active + step + paths.length) % paths.length : event.key === "Home" ? 0 : event.key === "End" ? paths.length - 1 : -1;
    if (target < 0) return;
    event.preventDefault();
    setActive(target);
    tabRefs.current[target]?.focus();
  };
  const path = paths[active];

  return <section id="paths" className={styles.paths} aria-labelledby="paths-title"><div className={styles.inner}>
    <div className={styles.left}>
      <header className={styles.head}>
        <h2 id="paths-title">{text("One membership, three ways in", "एक सदस्यता, तीन रास्ते")}</h2>
        <p>{text("Choose an exam, a board and class, or a technology track. The paths you pick become your own study space.", "परीक्षा, बोर्ड और कक्षा या तकनीकी ट्रैक चुनें। चुने गए पथ आपका अपना अध्ययन क्षेत्र बनते हैं।")}</p>
      </header>

      <div className={styles.tabs} role="tablist" aria-orientation="vertical" aria-label={text("Learning paths", "सीखने के पथ")}>
        {paths.map((item, index) => <button key={item.id} ref={node => { tabRefs.current[index] = node; }} id={item.id} type="button" role="tab"
          aria-selected={index === active} aria-controls={`path-${item.id}-panel`} tabIndex={index === active ? 0 : -1}
          className={styles.tab} onClick={() => setActive(index)} onKeyDown={onKey}>
          <span className={styles.tabIcon}><item.icon size={18} strokeWidth={1.9} aria-hidden="true" /></span><span>{item.short}</span>
          <ChevronRight className={styles.chevron} size={18} aria-hidden="true" />
        </button>)}
      </div>

      {paths.map((item, index) => <div key={item.id} id={`path-${item.id}-panel`} role="tabpanel" aria-labelledby={item.id} hidden={index !== active} className={styles.panel}>
        <h3>{item.title}</h3>
        <p className={styles.detail}>{item.body}</p>
        <ul className={styles.tags} aria-label={text("Includes", "शामिल")}>{item.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        <Link href={item.href} className={styles.link}>{text("See what’s covered", "कवरेज देखें")}</Link>
      </div>)}
    </div>

    <div className={styles.stage} aria-hidden="true">
      <div className={styles.tablet}>
        <div className={styles.screen}>
          <div className={styles.browser}>
            <span className={styles.lights}><i /><i /><i /></span>
            <span className={styles.url}><Lock size={10} strokeWidth={2.4} />{path.route}</span>
          </div>
          <div className={styles.app}>
            <aside className={styles.sidebar}>
              <b className={styles.brand}>Master<em>Class</em></b>
              <span className={styles.navLabel}>{text("Preparations", "तैयारी")}</span>
              {paths.map(item => <span key={item.id} className={styles.navItem} data-on={item.id === path.id || undefined}><item.icon size={12} strokeWidth={2} />{item.short}</span>)}
              <span className={styles.navLabel}>{text("Tools", "टूल")}</span>
              <span className={styles.navItem}><Search size={12} strokeWidth={2} />Search</span>
              <span className={styles.navItem}><BookA size={12} strokeWidth={2} />{text("Vocabulary", "शब्दावली")}</span>
              <span className={styles.navItem}><NotebookPen size={12} strokeWidth={2} />{text("Notes", "नोट्स")}</span>
            </aside>
            <div key={path.id} className={styles.main}>
              {/* The dashboard's breadcrumb bar, as on every dashboard page. */}
              <div className={styles.appTop}><span>MasterClass <b>/ {path.short}</b></span><span className={styles.avatar}>A</span></div>
              <Screen id={path.id} text={text} />
            </div>
          </div>
        </div>
      </div>
    </div>

    <p className={styles.coverage}><Info size={16} aria-hidden="true" /><span>{text("School and exam resources currently cover foundation concepts and original practice; check coverage before subscribing. NCERT is a resource organisation, not an exam board. ICSE runs through Class 10 and ISC covers Classes 11–12.", "स्कूल और परीक्षा संसाधन अभी आधारभूत अवधारणाएँ और मौलिक अभ्यास देते हैं; सदस्यता से पहले कवरेज देखें। NCERT संसाधन संस्था है, परीक्षा बोर्ड नहीं। ICSE कक्षा 10 तक और ISC कक्षा 11–12 के लिए है।")}</span></p>
  </div></section>;
}

/** What the dashboard shows for each path: real words, never placeholder bars. */
function Screen({ id, text }: { id: PathId; text: Text }) {
  if (id === "school") return <>
    <div className={styles.titleRow}><div><small>CBSE · {text("Class 10", "कक्षा 10")}</small><b>{text("Science: Light", "विज्ञान: प्रकाश")}</b></div><span className={styles.toggle}><span>EN</span><span data-on>हि</span></span></div>
    <div className={styles.chapters}>
      <span data-done><Check size={10} strokeWidth={3} />{text("Reflection", "परावर्तन")}</span>
      <span data-on>{text("Refraction", "अपवर्तन")}</span>
      <span>{text("Lenses", "लेंस")}</span>
    </div>
    <div className={styles.card}>
      <b>{text("Why does a pencil look bent in water?", "पानी में पेंसिल मुड़ी हुई क्यों दिखती है?")}</b>
      <p lang="hi">प्रकाश पानी से हवा में जाते समय मुड़ जाता है (अपवर्तन), इसलिए पेंसिल का डूबा हुआ भाग अपनी जगह से ऊपर दिखता है।</p>
      <div className={styles.diagram}><i className={styles.water} /><i className={styles.pencil} /></div>
    </div>
  </>;
  if (id === "exams") return <>
    <div className={styles.titleRow}><div><small>SSC CGL</small><b>{text("Daily practice", "रोज़ का अभ्यास")}</b></div><span className={styles.timer}><Clock size={11} strokeWidth={2.4} />12:40</span></div>
    <div className={styles.progress}><i style={{ width: "28%" }} /><small>{text("Question 7 of 25", "प्रश्न 7 / 25")}</small></div>
    <div className={styles.card}>
      <b>{text("If 3x + 5 = 20, what is the value of x?", "यदि 3x + 5 = 20 है, तो x का मान क्या है?")}</b>
      <ul className={styles.options}>
        <li><span>A</span>3</li>
        <li data-right><span>B</span>5<Check size={12} strokeWidth={3} /></li>
        <li><span>C</span>7</li>
        <li><span>D</span>15</li>
      </ul>
    </div>
  </>;
  return <>
    <div className={styles.titleRow}><div><small>On The Go</small><b>{text("Next.js: build a blog", "Next.js: ब्लॉग बनाएँ")}</b></div><span className={styles.pill}>{text("3 of 9 steps", "9 में से 3 कदम")}</span></div>
    <ol className={styles.steps}>
      <li data-done><b>{text("Create the app", "ऐप बनाएँ")}</b><code>npx create-next-app@latest my-blog</code></li>
      <li data-done><b>{text("Add a posts page", "पोस्ट पेज जोड़ें")}</b><code>app/posts/page.tsx</code></li>
      <li data-on><b>{text("Load posts on the server", "सर्वर पर पोस्ट लोड करें")}</b><code>{"const posts = await getPosts();"}</code></li>
    </ol>
  </>;
}
