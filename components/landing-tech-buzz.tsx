import Image from "@/components/responsive-image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, BadgeCheck, CalendarSync, Clock3, Code2, Newspaper, ThumbsDown, ThumbsUp } from "lucide-react";
import { istWeek } from "@/lib/ist-week";
import { isUnsplash, unoptimizedRemote, unsplashLoader } from "@/lib/image-loaders";
import type { LandingBuzz } from "@/lib/landing-buzz-types";
import { CarouselShell } from "./carousel-shell";
import { FeatureSection, type Feature } from "./landing-features";
import carousel from "./landing-carousel.module.css";
import styles from "./landing-tech-buzz.module.css";

const SLIDES = 8;
const INTERVAL = 7_000;
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const shortDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** Readers' stars when the story has ratings, else the senior reviewer's (lib/tech-buzz-reviews.ts), else none. */
function Rating({ story }: Readonly<{ story: LandingBuzz }>) {
  const readers = story.rating?.count ? story.rating : null;
  const value = readers?.average ?? story.stars ?? 0;
  if (!value) return null;
  const label = readers ? `Rated ${value.toFixed(1)} out of 5 by ${readers.count.toLocaleString("en-IN")} readers` : `Reviewer rating ${value.toFixed(1)} out of 5`;
  return <p className={styles.rating} title={label}>
    <span className={styles.stars} aria-hidden="true">★★★★★<span style={{ "--fill": `${(value / 5) * 100}%` } as CSSProperties}>★★★★★</span></span>
    <b>{value.toFixed(1)}</b><small>{readers ? `(${compact.format(readers.count)} ratings)` : "reviewer"}</small>
    <span className={styles.srOnly}>{label}</span>
  </p>;
}

/**
 * Tech Buzz on the landing page, straight under the festive sale (user requests 2026-11-01): the Certifications form
 * (FeatureSection: pitch, four details, how it works, the way into /tech-buzz) beside the café photo of the blog, with
 * an autoplay card carousel of the newest stories floating on it: cover, title, subtitle, star rating and the likes,
 * dislikes and claps readers gave it. CarouselShell runs it (autoplay, pause on hover/focus, arrows, dots); the cards
 * are plain server-rendered markup. Stories carry card fields only (lib/server/landing-buzz.ts), so the paywall holds.
 * `week` is the server's IST week, so "this week" agrees between the cached HTML and hydration.
 */
export function LandingTechBuzz({ stories = [], week, hi = false }: Readonly<{ stories?: LandingBuzz[]; week: number; hi?: boolean }>) {
  const thisWeek = stories.filter(story => istWeek(Date.parse(story.publishedAt)) === week).length;
  const feature: Feature = {
    id: "tech-buzz", icon: Newspaper, kicker: ["Tech Buzz", "Tech Buzz"],
    title: ["The tech stories worth your coffee, ", "वे टेक कहानियाँ जो आपकी कॉफ़ी के लायक हैं, "], emphasis: ["explained by engineers.", "इंजीनियरों की ज़ुबानी।"],
    lede: ["Agentic AI, LangChain, Next.js, cloud and the rest of the stack: what shipped, why it matters and the code behind it, written fresh and rated by a senior reviewer before it goes live.", "Agentic AI, LangChain, Next.js, क्लाउड और बाकी स्टैक: क्या आया, क्यों मायने रखता है और उसके पीछे का कोड, प्रकाशन से पहले वरिष्ठ समीक्षक द्वारा रेट किया गया।"],
    details: [
      { icon: CalendarSync, title: ["Fresh every week", "हर हफ़्ते नया"], body: ["New stories across AI, agents, web, cloud and system design, so there is always something current to read.", "AI, एजेंट, वेब, क्लाउड और सिस्टम डिज़ाइन पर नई कहानियाँ।"] },
      { icon: BadgeCheck, title: ["Reviewed before it ships", "प्रकाशन से पहले समीक्षा"], body: ["A senior full-stack reviewer stars every story; anything at 2.5 stars or below never goes live.", "हर कहानी को वरिष्ठ समीक्षक स्टार देते हैं; 2.5 या कम वाली कभी प्रकाशित नहीं होती।"] },
      { icon: Code2, title: ["The code behind the news", "खबर के पीछे का कोड"], body: ["Worked examples and diagrams, not just headlines, so you can try the idea the same day.", "सिर्फ़ सुर्ख़ियाँ नहीं, उदाहरण और डायग्राम भी।"] },
      { icon: ThumbsUp, title: ["Rate, like and clap", "रेट, लाइक और क्लैप"], body: ["Readers' stars, likes and claps surface the stories worth your time first.", "पाठकों के स्टार, लाइक और क्लैप से सबसे अच्छी कहानियाँ ऊपर आती हैं।"] },
    ],
    steps: [["Pick a story or a topic", "कहानी या विषय चुनें"], ["Read the free preview", "मुफ़्त झलक पढ़ें"], ["Join to read in full and react", "पूरा पढ़ने और रिएक्ट करने के लिए जुड़ें"]],
    image: { src: "/images/landing/hero-buzz-cafe.webp", focus: "72% 50%" },
    badge: { icon: Newspaper, label: thisWeek ? [`${thisWeek} stories this week`, `इस हफ़्ते ${thisWeek} कहानियाँ`] : [`${stories.length} newest stories`, `${stories.length} नई कहानियाँ`] },
    cta: { href: "/tech-buzz", label: ["Read Tech Buzz", "Tech Buzz पढ़िए"] }, note: ["Free previews for everyone", "सबके लिए मुफ़्त झलक"],
  };

  const slides = stories.filter(story => story.cover).slice(0, SLIDES);
  const label = hi ? "Tech Buzz की नई कहानियाँ" : "Newest Tech Buzz stories";
  const idBase = "carousel-tech-buzz";
  const float = slides.length > 0 && <CarouselShell count={slides.length} titles={slides.map(story => story.title)} label={label} idBase={idBase} hi={hi} interval={INTERVAL}>
    {slides.map((story, at) => <article key={story.slug} id={`${idBase}-${at}`} className={`${carousel.slide} ${styles.slide}`} data-active={at === 0 || undefined} inert={at !== 0} aria-roledescription="slide" aria-label={`${at + 1} / ${slides.length}: ${story.title}`}>
      <div className={styles.cover}>
        <Image src={story.cover!} alt={`Cover: ${story.title}`} fill style={{ objectFit: "cover" }} sizes="(max-width: 560px) 90vw, 380px"
          loader={isUnsplash(story.cover!) ? unsplashLoader : undefined} unoptimized={unoptimizedRemote(story.cover!)} loading={at === 0 ? undefined : "lazy"} />
        <span className={styles.topic}>{story.logo && <Image src={story.logo} alt={`${story.technology} logo`} aria-hidden="true" width={16} height={16} />}{story.topic}</span>
        <span className={styles.time}><Clock3 size={11} aria-hidden="true" />{story.minutes} min</span>
        {istWeek(Date.parse(story.publishedAt)) === week && <span className={styles.fresh}>{hi ? "नया" : "New"}</span>}
        <i className={styles.progress} style={{ animationDuration: `${INTERVAL}ms` }} aria-hidden="true" />
      </div>
      <div className={styles.body}>
        <div className={styles.title}>{story.title}</div>
        {story.subtitle && <p className={styles.text}>{story.subtitle}</p>}
        <Rating story={story} />
        <div className={styles.foot}>
          <ul className={styles.reactions} aria-label={hi ? "पाठकों की प्रतिक्रिया" : "Reader reactions"}>
            <li title={`${story.likes ?? 0} likes`}><ThumbsUp size={13} aria-hidden="true" />{compact.format(story.likes ?? 0)}<span className={styles.srOnly}> likes</span></li>
            <li title={`${story.dislikes ?? 0} dislikes`}><ThumbsDown size={13} aria-hidden="true" />{compact.format(story.dislikes ?? 0)}<span className={styles.srOnly}> dislikes</span></li>
            <li title={`${story.claps ?? 0} claps`}><span aria-hidden="true">👏</span>{compact.format(story.claps ?? 0)}<span className={styles.srOnly}> claps</span></li>
          </ul>
          <Link className={carousel.readMore} href={`/tech-buzz/${story.slug}`}><b aria-hidden="true">✻</b>{hi ? "कहानी पढ़िए" : "Read story"}<ArrowRight size={13} aria-hidden="true" /></Link>
        </div>
        <small className={styles.date}>{shortDate(story.publishedAt)}</small>
      </div>
    </article>)}
  </CarouselShell>;

  return <FeatureSection feature={feature} index={0} total={1} hi={hi} topLevel float={float || undefined} />;
}
