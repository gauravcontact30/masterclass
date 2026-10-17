"use client";

import Image from "next/image";
import Link from "next/link";
import type { LandingLibrary } from "@/lib/landing-library";
import { useLanguage } from "./language-provider";
import { useReveal } from "./use-reveal";
import styles from "./landing-overview.module.css";

/** What a tile shows when it flips: a title, a few points and where to go next, on its own light colour. */
type Back = { tone: "mint" | "sky" | "lavender" | "butter" | "rose" | "aqua"; title: string; points: string[]; link: { href: string; label: string } };
type Tile =
  | { kind: "text"; tone: "sage" | "highlight" | "blush"; title: string; body: string; back: Back }
  | { kind: "photo"; tone: "navy" | "kraft"; src: string; focus: string; caption: string; back: Back };

/**
 * "One dashboard" overview under the subject marquee: a three-line statement
 * with one action; on the right, three staggered columns alternating colour
 * cards (paper, clay orange, clay tint), each naming a core tool with
 * live counts, and learner photographs on navy or kraft. Every tile flips on
 * hover, focus or tap to a back in its own light colour with the details.
 */
export function LandingOverview({ counts }: { counts?: LandingLibrary["counts"] }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const format = (value: number) => new Intl.NumberFormat(hi ? "hi-IN" : "en-IN").format(value);
  const n = (value: number | undefined, fallback: string) => value ? format(value) : fallback;
  const [ref, reveal] = useReveal<HTMLElement>();

  // Three columns, top to bottom; the middle one starts with a photo so the grid staggers.
  const columns: Tile[][] = [
    [
      { kind: "text", tone: "sage", title: text("Class Room", "क्लास रूम"), body: text("Topic explanations with worked answers and diagrams, and a Hindi toggle whenever you want it.", "हल सहित उत्तर और आरेखों वाली विषय व्याख्याएँ, और जब चाहें हिन्दी टॉगल।"),
        back: { tone: "mint", title: text("Inside Class Room", "क्लास रूम में क्या है"), points: [text("CBSE, ICSE, NCERT and state boards, Classes 6–12", "CBSE, ICSE, NCERT और राज्य बोर्ड, कक्षा 6–12"), text("Worked answers with labelled diagrams", "लेबल वाले आरेखों के साथ हल सहित उत्तर"), text("Switch any topic to Hindi in one tap", "किसी भी विषय को एक टैप में हिन्दी में बदलें")], link: { href: "/courses#cbse", label: text("See school courses", "स्कूल कोर्स देखें") } } },
      { kind: "photo", tone: "navy", src: "/images/landing/slide-classroom.webp", focus: "55% 40%", caption: text("Study at your desk", "अपनी मेज़ पर पढ़ाई"),
        back: { tone: "sky", title: text("Study at your desk", "अपनी मेज़ पर पढ़ाई"), points: [text("Focused notes for every chapter", "हर अध्याय के लिए सटीक नोट्स"), text("Revision cards and bookmarks saved as you go", "पढ़ते-पढ़ते सहेजे गए रिवीज़न कार्ड और बुकमार्क"), text("Timed practice when you are ready", "तैयार हों तो समयबद्ध अभ्यास")], link: { href: "/courses", label: text("Browse courses", "कोर्स देखें") } } },
    ],
    [
      { kind: "photo", tone: "kraft", src: "/images/landing/slide-commute.webp", focus: "60% 35%", caption: text("Learn on the commute", "सफ़र में सीखें"),
        back: { tone: "lavender", title: text("Learn on the commute", "सफ़र में सीखें"), points: [text("Short lessons that fit a bus ride", "बस के सफ़र में पूरे होने वाले छोटे पाठ"), text("Flashcards and quick quizzes on any phone", "किसी भी फ़ोन पर फ़्लैशकार्ड और छोटे क्विज़"), text("Pick up where you stopped", "जहाँ छोड़ा था वहीं से शुरू करें")], link: { href: "#vocabulary", label: text("Try today's words", "आज के शब्द आज़माएँ") } } },
      { kind: "text", tone: "highlight", title: "On The Go", body: text(`Step-by-step build guides for ${n(counts?.technology, "60+")} technologies, with every command and the complete code.`, `${n(counts?.technology, "60+")} तकनीकों के लिए कदम-दर-कदम गाइड, हर कमांड और पूरे कोड के साथ।`),
        back: { tone: "butter", title: text("Build it yourself", "खुद बनाकर सीखें"), points: [text("Every command, ready to copy", "हर कमांड, कॉपी के लिए तैयार"), text("The complete code for each step", "हर चरण का पूरा कोड"), text("Workflow blueprints from real industries", "असली उद्योगों के वर्कफ़्लो ब्लूप्रिंट")], link: { href: "#workflows", label: text("See the blueprints", "ब्लूप्रिंट देखें") } } },
    ],
    [
      { kind: "text", tone: "blush", title: text("Vocabulary", "शब्दावली"), body: text(`${n(counts?.word, "2,000+")} English words with Hindi meanings, synonyms and antonyms.`, `${n(counts?.word, "2,000+")} अंग्रेज़ी शब्द, हिन्दी अर्थ, पर्यायवाची और विलोम सहित।`),
        back: { tone: "rose", title: text("Words that stick", "याद रहने वाले शब्द"), points: [text("A Hindi meaning for every word", "हर शब्द का हिन्दी अर्थ"), text("Synonyms, antonyms and example sentences", "पर्यायवाची, विलोम और उदाहरण वाक्य"), text("New Word power cards every day", "हर दिन नए वर्ड पावर कार्ड")], link: { href: "#vocabulary", label: text("Open Word power", "वर्ड पावर खोलें") } } },
      { kind: "photo", tone: "navy", src: "/images/landing/slide-interview.webp", focus: "50% 38%", caption: text("Walk in interview-ready", "इंटरव्यू के लिए तैयार"),
        back: { tone: "aqua", title: text("Walk in interview-ready", "इंटरव्यू के लिए तैयार"), points: [text("Most-asked subjective and objective questions", "सबसे ज़्यादा पूछे जाने वाले विषयगत और वस्तुनिष्ठ प्रश्न"), text("Rated by how often they come up", "कितनी बार पूछे जाते हैं, उसकी रेटिंग"), text("Model answers you can open one by one", "एक-एक करके खुलने वाले मॉडल उत्तर")], link: { href: "#interview-prep", label: text("Practise questions", "प्रश्नों का अभ्यास करें") } } },
    ],
  ];

  return <section ref={ref} id="overview" data-own-heading className={styles.overview} data-reveal={reveal} aria-labelledby="overview-title">
    <div className={styles.inner}>
      <div className={styles.copy}>
        <h2 id="overview-title">
          <span>{text("One dashboard.", "एक डैशबोर्ड।")}</span>
          <span>{text("Two languages.", "दो भाषाएँ।")}</span>
          <span>{text("A clear next step.", "अगला कदम साफ़।")}</span>
        </h2>
        <p>{text("MasterClass brings school, competitive exams and technology careers into one bilingual study space.", "MasterClass स्कूल, प्रतियोगी परीक्षाओं और तकनीकी करियर को एक द्विभाषी अध्ययन क्षेत्र में लाता है।")}</p>
        <Link className={styles.cta} href="/sign-up">{text("Start learning", "सीखना शुरू करें")}</Link>
      </div>

      <div className={styles.grid}>
        {columns.map((column, c) => <div key={c} className={styles.column}>
          {column.map((tile, t) => <div key={t} className={styles.flip} data-kind={tile.kind} tabIndex={0} role="group" aria-label={tile.kind === "text" ? tile.title : tile.caption} style={{ "--i": c * 2 + t } as React.CSSProperties}>
            <div className={styles.flipInner}>
              {tile.kind === "text"
                ? <article className={`${styles.face} ${styles.card}`} data-tone={tile.tone}>
                  <h3>{tile.title}</h3>
                  <p>{tile.body}</p>
                </article>
                : <div className={`${styles.face} ${styles.photo}`} data-tone={tile.tone}>
                  <Image src={tile.src} alt="" fill sizes="(max-width: 760px) 50vw, (max-width: 1080px) 33vw, 360px" style={{ objectPosition: tile.focus }} />
                </div>}
              <div className={`${styles.face} ${styles.back}`} data-back={tile.back.tone}>
                <h3>{tile.back.title}</h3>
                <ul>{tile.back.points.map(point => <li key={point}>{point}</li>)}</ul>
                <Link href={tile.back.link.href}>{tile.back.link.label}<span aria-hidden="true">→</span></Link>
              </div>
            </div>
          </div>)}
        </div>)}
      </div>
    </div>
  </section>;
}
