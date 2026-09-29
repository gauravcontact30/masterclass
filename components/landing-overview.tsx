"use client";

import Image from "next/image";
import Link from "next/link";
import type { LandingLibrary } from "@/lib/landing-library";
import { useLanguage } from "./language-provider";
import { useReveal } from "./use-reveal";
import styles from "./landing-overview.module.css";

type Tile =
  | { kind: "text"; tone: "sage" | "highlight" | "blush"; title: string; body: string }
  | { kind: "photo"; tone: "navy" | "kraft"; src: string; focus: string };

/**
 * "One dashboard" overview under the subject marquee: a three-line statement
 * with one action; on the right, three staggered columns alternating colour
 * cards (paper, clay orange, clay tint), each naming a core tool with
 * live counts, and learner photographs on navy or kraft.
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
      { kind: "text", tone: "sage", title: text("Class Room", "क्लास रूम"), body: text("Topic explanations with worked answers and diagrams, and a Hindi toggle whenever you want it.", "हल सहित उत्तर और आरेखों वाली विषय व्याख्याएँ, और जब चाहें हिन्दी टॉगल।") },
      { kind: "photo", tone: "navy", src: "/images/landing/slide-classroom.webp", focus: "55% 40%" },
    ],
    [
      { kind: "photo", tone: "kraft", src: "/images/landing/slide-commute.webp", focus: "60% 35%" },
      { kind: "text", tone: "highlight", title: "On The Go", body: text(`Step-by-step build guides for ${n(counts?.technology, "60+")} technologies, with every command and the complete code.`, `${n(counts?.technology, "60+")} तकनीकों के लिए कदम-दर-कदम गाइड, हर कमांड और पूरे कोड के साथ।`) },
    ],
    [
      { kind: "text", tone: "blush", title: text("Vocabulary", "शब्दावली"), body: text(`${n(counts?.word, "2,000+")} English words with Hindi meanings, synonyms and antonyms.`, `${n(counts?.word, "2,000+")} अंग्रेज़ी शब्द, हिन्दी अर्थ, पर्यायवाची और विलोम सहित।`) },
      { kind: "photo", tone: "navy", src: "/images/landing/slide-interview.webp", focus: "50% 38%" },
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
          {column.map((tile, t) => tile.kind === "text"
            ? <article key={t} className={styles.card} data-tone={tile.tone} style={{ "--i": c * 2 + t } as React.CSSProperties}>
              <h3>{tile.title}</h3>
              <p>{tile.body}</p>
            </article>
            : <div key={t} className={styles.photo} data-tone={tile.tone} style={{ "--i": c * 2 + t } as React.CSSProperties}>
              <Image src={tile.src} alt="" fill sizes="(max-width: 760px) 50vw, (max-width: 1080px) 33vw, 360px" style={{ objectPosition: tile.focus }} />
            </div>)}
        </div>)}
      </div>
    </div>
  </section>;
}
