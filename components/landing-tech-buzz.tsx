import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import type { CSSProperties } from "react";
import { ArrowRight, BadgeCheck, CalendarSync, CheckCircle2, Clock3, Code2, Newspaper, Sparkles, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { istWeek } from "@/lib/ist-week";
import type { LandingBuzz, LandingTopic } from "@/lib/landing-buzz-types";
import { RemoteCoverImage } from "./remote-cover-image";
import { BuzzQueue } from "./landing-buzz-queue";
import { BuzzTopics } from "./landing-buzz-topics";
import { FeatureSection, type Copy, type Feature } from "./landing-features";
import { ListenButton } from "./listen-button";
import carousel from "./landing-carousel.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-tech-buzz.module.css";

const SLIDES = 8;
const INTERVAL = 7_000;
const PILLS = 4, PILL_TONES = 6;
const COVER_SIZES = "(max-width: 900px) 92vw, 540px";
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const shortDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

const starsOf = (story: LandingBuzz) => story.rating?.count ? story.rating.average : story.stars;

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
 * (FeatureSection), its text set as an article (pitch, four details, how it works, the way into /tech-buzz) beside a
 * reading list on a stack of paper (user requests 2026-11-03): a line summing up the newest stories, the current story's cover with its headline, subtitle,
 * star rating and the likes, dislikes and claps readers gave it, and a row per story to jump to. BuzzQueue runs it
 * (autoplay, pause on hover/focus, arrows); the cards are plain server-rendered markup. With no covers the section falls
 * back to the café photo. Stories carry card fields only (lib/server/landing-buzz.ts), so the paywall holds. `week` is
 * the server's IST week, so "this week" agrees between the cached HTML and hydration.
 */
export function LandingTechBuzz({ stories = [], topics = [], week, hi = false }: Readonly<{ stories?: LandingBuzz[]; topics?: LandingTopic[]; week: number; hi?: boolean }>) {
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
  const isNew = (story: LandingBuzz) => istWeek(Date.parse(story.publishedAt)) === week;
  const label = hi ? "Tech Buzz की नई कहानियाँ" : "Newest Tech Buzz stories";
  const idBase = "buzz-story";
  // The summary line says only what these stories add up to: nothing is shown that the cards below could not back up.
  const minutes = slides.reduce((sum, story) => sum + story.minutes, 0);
  const rated = slides.flatMap(story => { const value = starsOf(story); return value ? [value] : []; });
  const fresh = slides.filter(isNew).length;
  const average = rated.length ? (rated.reduce((sum, value) => sum + value, 0) / rated.length).toFixed(1) : null;
  const summary = [
    fresh ? `${slides.length} newest stories, ${fresh} from this week.` : `The ${slides.length} newest stories.`,
    average ? `${minutes} minutes of reading, rated ${average} out of 5 on average.` : `${minutes} minutes of reading.`,
  ].join(" ");
  const visual = slides.length > 0 && <div className={styles.stack}>
    <i className={styles.ring} aria-hidden="true" />
    <BuzzQueue count={slides.length} label={label} hi={hi} interval={INTERVAL}
      head={<div className={styles.head}><div className={styles.headTitle}>{hi ? "पढ़ने की सूची" : "The reading list"}</div>{!hi && <p>{summary}</p>}</div>}
      covers={slides.map((story, at) => <article key={story.slug} id={`${idBase}-${at}`} className={`${carousel.slide} ${styles.slide}`} data-active={at === 0 || undefined} inert={at !== 0} aria-roledescription="slide" aria-label={`${at + 1} / ${slides.length}: ${story.title}`}>
        <div className={styles.cover}>
          <RemoteCoverImage src={story.cover!} alt={`Cover: ${story.title}`} fill style={{ objectFit: "cover" }} sizes={COVER_SIZES} loading={at === 0 ? undefined : "lazy"} />
          <div className={styles.tags}>
            {isNew(story) && <span className={`${styles.tag} ${styles.fresh}`}>{hi ? "नया" : "New"}</span>}
            <span className={styles.tag}>{story.topic}</span>
            <span className={`${styles.tag} ${styles.when}`}><Clock3 size={12} aria-hidden="true" />{shortDate(story.publishedAt)}, {story.minutes} min</span>
          </div>
          <div className={styles.title}>{story.title}</div>
        </div>
        <div className={styles.body}>
          {story.subtitle && <p className={styles.text}>{story.subtitle}</p>}
          <div className={styles.foot}>
            <Rating story={story} />
            <ul className={styles.reactions} aria-label={hi ? "पाठकों की प्रतिक्रिया" : "Reader reactions"}>
              <li title={`${story.likes ?? 0} likes`}><ThumbsUp size={13} aria-hidden="true" />{compact.format(story.likes ?? 0)}<span className={styles.srOnly}> likes</span></li>
              <li title={`${story.dislikes ?? 0} dislikes`}><ThumbsDown size={13} aria-hidden="true" />{compact.format(story.dislikes ?? 0)}<span className={styles.srOnly}> dislikes</span></li>
              <li title={`${story.claps ?? 0} claps`}><span aria-hidden="true">👏</span>{compact.format(story.claps ?? 0)}<span className={styles.srOnly}> claps</span></li>
            </ul>
            <Link className={carousel.readMore} href={`/tech-buzz/${story.slug}`}><b aria-hidden="true">✻</b>{hi ? "कहानी पढ़िए" : "Read story"}<ArrowRight size={13} aria-hidden="true" /></Link>
          </div>
        </div>
      </article>)}
      rows={slides.map((story, at) => { const stars = starsOf(story); return <li key={story.slug} className={styles.row} data-active={at === 0 || undefined} data-near={at < 4 || undefined}>
        <button type="button" data-at={at} aria-controls={`${idBase}-${at}`} aria-current={at === 0 || undefined}>
          {/* Same picture and sizes as the story's cover above, so this reuses that download. */}
          <span className={styles.cardPicture}>
            <RemoteCoverImage src={story.cover!} alt="" fill style={{ objectFit: "cover" }} sizes={COVER_SIZES} loading="lazy" />
            {slides.length > 1 && <i className={styles.progress} style={{ animationDuration: `${INTERVAL}ms` }} aria-hidden="true" />}
          </span>
          <span className={styles.cardLogo} aria-hidden="true">{story.logo ? <Image src={story.logo} alt="" width={20} height={20} /> : <Newspaper size={16} />}</span>
          <span className={styles.cardBody}>
            <span className={styles.cardTopic}>{story.topic}</span>
            <span className={styles.cardTitle}>{story.title}</span>
            <span className={styles.cardFoot}>
              <span><Clock3 size={12} aria-hidden="true" />{story.minutes} min</span>
              {stars ? <span><Star size={12} fill="currentColor" aria-hidden="true" />{stars.toFixed(1)}</span> : null}
            </span>
          </span>
        </button>
      </li>; })} />
  </div>;

  // The text column reads as one of the articles it advertises (components/tech-buzz-article-view.tsx): headline,
  // standfirst, the desk's byline, a body with subheads and a pull quote, the takeaways box, tags and a way in.
  const pick = ([en, hindi]: Copy) => hi ? hindi : en;
  const [freshEvery, reviewed, code, react] = feature.details;
  const title = pick(feature.title) + pick(feature.emphasis);
  const listen = [title, pick(feature.lede), ...feature.details.map(detail => `${pick(detail.title)}. ${pick(detail.body)}`), ...feature.steps.map(pick)].join(" ");
  const readMinutes = Math.max(1, Math.ceil(listen.split(/\s+/).length / 200));
  const latest = stories.reduce((newest, story) => story.publishedAt > newest ? story.publishedAt : newest, "");
  // Fours of the technologies written about, a colour each. A short last set borrows from the middle of the list, as the
  // first set follows it and every change must show four different ones; too few for two full sets stay as one.
  const middle = Math.floor(topics.length / 2);
  const topicSets = Array.from({ length: topics.length < PILLS * 2 ? Math.min(topics.length, 1) : Math.ceil(topics.length / PILLS) }, (_, set) => Array.from({ length: Math.min(PILLS, topics.length) }, (_, at) => {
    const item = set * PILLS + at;
    return item < topics.length ? item : middle + item - topics.length;
  }));
  const copy = <article className={styles.article} aria-labelledby={`${feature.id}-title`}>
    <p className={frame.kicker}><Newspaper size={14} aria-hidden="true" />{pick(feature.kicker)}</p>
    <h2 id={`${feature.id}-title`} className={styles.headline}>{title}</h2>
    <p className={styles.standfirst}>{pick(feature.lede)}</p>
    <div className={styles.byline}>
      <Image className={styles.avatar} src="/images/brand/mcb-avatar.svg" alt="" width={44} height={44} />
      <div className={styles.bylineText}>
        <div className={styles.author}>MCB Editorial<CheckCircle2 size={14} role="img" aria-label="Verified author" /></div>
        <p>{readMinutes} min read{latest && <> · {hi ? "ताज़ा कहानी" : "Latest story"} <time dateTime={latest}>{shortDate(latest)}</time></>}</p>
      </div>
      <div className={styles.bylineActions}>
        {average && <span className={styles.starBadge} title={`Stories here are rated ${average} out of 5 on average`}><Star size={13} fill="#f59e0b" color="#f59e0b" aria-hidden="true" />{average}</span>}
        <ListenButton id={`feature:${feature.id}`} title={pick(feature.kicker)} text={listen} compact />
      </div>
    </div>
    <div className={styles.prose}>
      <section><div className={styles.subhead}>{pick(freshEvery.title)}</div><p className={styles.lead}>{pick(freshEvery.body)}</p></section>
      <section><div className={styles.subhead}>{pick(code.title)}</div><p>{pick(code.body)}</p></section>
      <blockquote className={styles.pull}><p>{pick(reviewed.body)}</p><cite>{pick(reviewed.title)}</cite></blockquote>
      <section><div className={styles.subhead}>{pick(react.title)}</div><p>{pick(react.body)}</p></section>
    </div>
    <div className={styles.takeaways}>
      <div className={styles.takeawaysHead}><Sparkles size={16} aria-hidden="true" />{hi ? "यह कैसे काम करता है" : "How it works"}</div>
      <ol>{feature.steps.map(step => <li key={step[0]}>{pick(step)}</li>)}</ol>
    </div>
    {topics.length > 0 && <BuzzTopics count={topicSets.length} label={hi ? "इन तकनीकों पर कहानियाँ" : "Technologies we write about"} hi={hi}>
      {topicSets.map((set, at) => <ul key={at} className={styles.topicSet} data-active={at === 0 || undefined}>
        {set.map(item => <li key={topics[item].name} className={styles[`tone${item % PILL_TONES}`]} title={`${topics[item].stories} ${topics[item].stories === 1 ? "story" : "stories"} on ${topics[item].name}`}><Image src={topics[item].logo} alt="" width={16} height={16} /><span>{topics[item].name}</span></li>)}
      </ul>)}
    </BuzzTopics>}
    <div className={styles.closing}>
      <Link className={frame.cta} href={feature.cta.href}>{pick(feature.cta.label)}<ArrowRight size={16} aria-hidden="true" /></Link>
      <small>{pick(feature.note)}</small>
    </div>
  </article>;

  return <FeatureSection feature={feature} index={0} total={1} hi={hi} topLevel visual={visual || undefined} copy={copy} />;
}
