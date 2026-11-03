import Link from "@/components/site-link";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { relatedBuzz, type LandingBuzz } from "@/lib/landing-buzz-types";
import styles from "./landing-buzz-strip.module.css";

const shortDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/**
 * "Fresh from Tech Buzz": the newest published stories related to what a landing section is about (its technologies or
 * identifiers), each linking to the story on /tech-buzz. With nothing related, it says so and shows the newest stories.
 */
export function BuzzStrip({ stories, keywords, label }: Readonly<{ stories: LandingBuzz[] | undefined; keywords: string[]; label: string }>) {
  if (!stories?.length) return null;
  const { stories: shown, matched } = relatedBuzz(stories, keywords, 3);
  return <aside className={styles.strip} aria-label={label}>
    <p className={styles.head}><Newspaper size={15} aria-hidden="true" /><b>{matched ? "Fresh from Tech Buzz" : "Newest on Tech Buzz"}</b><span>{matched ? `stories about ${label}` : "nothing on this topic yet, so here is the latest"}</span></p>
    <ul>{shown.map((story, i) => <li key={story.slug} style={{ "--i": i } as React.CSSProperties}>
      <Link href={`/tech-buzz/${story.slug}`}>
        <small>{story.topic} · {story.minutes} min read · {shortDate(story.publishedAt)}</small>
        <strong>{story.title}</strong>
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </li>)}</ul>
  </aside>;
}
