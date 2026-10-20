"use client";
import Link from "next/link";
import { Clock, Coffee, Lock } from "lucide-react";
import type { BlogTeaser } from "@/lib/coffee-and-code";
import { contentKey } from "@/lib/content-overrides";
import { Editable, useContentEditing, useContentItem } from "./content-editing";
import { useLanguage } from "./language-provider";
import home from "./landing-home.module.css";
import styles from "./landing-coffee.module.css";

/**
 * The landing preview of Coffee & Code: the newest articles as light cards with their title and one line, and a
 * sign-in link to the full article (code, questions and answers, images) in the dashboard. Super Admin removals
 * and edits apply here too.
 */
export function LandingCoffee({ posts }: Readonly<{ posts: BlogTeaser[] }>) {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const { overrides } = useContentEditing();
  const section = useContentItem("section:coffee-and-code", "section");
  const shown = posts.filter(post => !overrides[contentKey("blog", post.slug)]?.deleted);
  if (section.hidden || !shown.length) return null;
  return <section id="coffee-and-code" className={styles.section} aria-labelledby="coffee-landing-title" {...section.props}>{section.toolbar}<div className={home.inner}>
    <header className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><Coffee size={20} /></span>
      <div>
        <h2 id="coffee-landing-title">{text("Coffee & Code", "Coffee & Code")}</h2>
        <p>{text("Short engineering articles from the dashboard: one idea, real code and the interview questions about it. Members and trial users read every article in full.", "डैशबोर्ड के छोटे इंजीनियरिंग लेख: एक विचार, असली कोड और उससे जुड़े इंटरव्यू प्रश्न। सदस्य और ट्रायल उपयोगकर्ता हर लेख पूरा पढ़ते हैं।")}</p>
      </div>
    </header>
    <ul className={styles.cards}>
      {shown.map(post => { const k = contentKey("blog", post.slug); return <li key={post.slug} className={styles.card} data-tone={post.tone}>
        <p className={styles.topic}>{post.topic}</p>
        <h3><Editable k={k} f="title">{post.title}</Editable></h3>
        <p className={styles.dek}><Editable k={k} f="dek" multiline>{post.dek}</Editable></p>
        <div className={styles.foot}>
          <span><Clock size={13} aria-hidden="true" />{text(`${post.minutes} min read`, `${post.minutes} मिनट`)}</span>
          <Link href={`/sign-in?redirect=${encodeURIComponent(`/dashboard/coffee-and-code/${post.slug}`)}`} prefetch={false}><Lock size={13} aria-hidden="true" />{text("Read in dashboard", "डैशबोर्ड में पढ़ें")}</Link>
        </div>
      </li>; })}
    </ul>
  </div></section>;
}
