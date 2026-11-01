"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { useVisiblePlayback } from "./use-visible-playback";
import { ArrowLeft, ArrowRight, BookA, FileCode2, MessageSquareQuote, MessagesSquare, Pause, Play, Quote, Sparkles, Star, Workflow, type LucideIcon } from "lucide-react";
import { useLanguage } from "./language-provider";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./student-reviews.module.css";
// Fictional reviews requested for design. Keep the sample label until replaced with actual feedback.
// Avatars are illustrated initials, never photographs: the stock portraits in public/images/reviews show real people,
// and a real face beside an invented quote would pass the quote off as that person's (PRODUCT.md). When real reviews
// arrive, a reviewer's own consented profile picture can go in `photo`.
// Each sample names the dashboard area it describes, so the stories map onto what a member actually opens.
type Review = { id: string; name: string; initials: string; focus: [string, string]; area: { icon: LucideIcon; name: [string, string] }; quote: [string, string]; rating: number; routine: string[] };
const samples: Review[] = [
  { id: "aditi", name: "Aditi S.", initials: "AS", focus: ["Final-year B.Tech · Preparing for campus placements", "अंतिम वर्ष B.Tech · कैंपस प्लेसमेंट की तैयारी"], area: { icon: BookA, name: ["Word power", "शब्द शक्ति"] }, quote: ["Twelve words a day sounded small, but hearing each one and reading it in a real sentence made them stick. The Hindi meaning helps when an English definition alone is not enough.", "रोज़ बारह शब्द कम लगते थे, पर हर शब्द सुनकर और असली वाक्य में पढ़कर वे याद रह जाते हैं। जब केवल अंग्रेज़ी परिभाषा काफ़ी नहीं होती, तब हिन्दी अर्थ मदद करता है।"], rating: 5, routine: ["Listens to 12 words", "Reads them in sentences", "Revises on Sunday"] },
  { id: "rohan", name: "Rohan M.", initials: "RM", focus: ["Backend developer · System design rounds", "बैकएंड डेवलपर · सिस्टम डिज़ाइन राउंड"], area: { icon: Workflow, name: ["Workflow blueprints", "वर्कफ़्लो ब्लूप्रिंट"] }, quote: ["The blueprints walk through a URL shortener or a rate limiter one decision at a time, then list the mistakes people make. Reading the most-asked questions right after is exactly how I revise.", "ब्लूप्रिंट URL शॉर्टनर या रेट लिमिटर को एक-एक निर्णय के साथ समझाते हैं, फिर आम गलतियाँ बताते हैं। उसके तुरंत बाद सबसे ज़्यादा पूछे गए प्रश्न पढ़ना ही मेरा दोहराने का तरीका है।"], rating: 5, routine: ["Opens one blueprint", "Notes each trade-off", "Answers the top questions"] },
  { id: "meera", name: "Meera K.", initials: "MK", focus: ["Frontend engineer · React and Next.js", "फ़्रंटएंड इंजीनियर · React और Next.js"], area: { icon: FileCode2, name: ["API Docs", "API Docs"] }, quote: ["I keep API Docs open while I work. Finding a hook, its parameters and a short usage example in one place is quicker than jumping between three sites.", "काम करते समय मैं API Docs खुला रखती हूँ। एक ही जगह hook, उसके पैरामीटर और छोटा उदाहरण मिल जाना तीन साइटों के बीच घूमने से तेज़ है।"], rating: 4, routine: ["Searches a hook", "Reads its signature", "Copies the example"] },
  { id: "arjun", name: "Arjun P.", initials: "AP", focus: ["Career switcher · First developer role", "करियर बदलने वाले · पहली डेवलपर नौकरी"], area: { icon: MessagesSquare, name: ["Interview prep", "इंटरव्यू की तैयारी"] }, quote: ["I answer the subjective questions out loud first, then take the objective set on the same technology. Seeing where my spoken answer and the quiz disagree shows me what to study next.", "मैं पहले विषयगत प्रश्नों के उत्तर बोलकर देता हूँ, फिर उसी तकनीक का वस्तुनिष्ठ सेट हल करता हूँ। जहाँ मेरा उत्तर और क्विज़ अलग निकलते हैं, वहीं से पता चलता है कि आगे क्या पढ़ना है।"], rating: 5, routine: ["Answers out loud", "Takes the quiz", "Studies the gaps"] },
  { id: "sana", name: "Sana R.", initials: "SR", focus: ["Data analyst · Moving into AI engineering", "डेटा विश्लेषक · AI इंजीनियरिंग की ओर"], area: { icon: Sparkles, name: ["AI & agentic pulse", "AI और एजेंटिक हलचल"] }, quote: ["The pulse is my morning read. One card on LangGraph, one on RAG, one comparing two tools, so I keep up with agents without losing an hour to news.", "पल्स मेरी सुबह की पढ़ाई है। एक कार्ड LangGraph पर, एक RAG पर, एक दो टूल की तुलना पर, ताकि बिना घंटा गँवाए एजेंटों की जानकारी बनी रहे।"], rating: 5, routine: ["Reads three cards", "Follows one deeper", "Tries it in code"] },
];
/** Each story stays up for eight seconds. */
const STORY_MS = 8000;
const subscribe = (notify: () => void) => { const query = window.matchMedia?.("(prefers-reduced-motion: reduce)"); query?.addEventListener?.("change", notify); return () => query?.removeEventListener?.("change", notify); };
const snapshot = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

/**
 * Sample student stories as a deck of cards: the story in front, the next two fanned behind it, turning every eight
 * seconds with a ring that fills as it goes. Swipe, the arrow keys or the index move it; it holds while hovered,
 * focused, paused, off screen, or when reduced motion is preferred (WCAG 2.2.2).
 */
export function StudentReviews() {
  const section = useRef<HTMLElement>(null); const visible = useVisiblePlayback(section);
  const { language } = useLanguage(); const hi = language === "hi"; const lang = hi ? 1 : 0;
  const reduced = useSyncExternalStore(subscribe, snapshot, () => false);
  const [index, setIndex] = useState(0); const [paused, setPaused] = useState(false); const [hover, setHover] = useState(false); const [focus, setFocus] = useState(false);
  const swipe = useRef<number | null>(null);
  const rotating = visible && !reduced && !paused && !hover && !focus;
  const go = (step: number) => setIndex(value => (value + step + samples.length) % samples.length);
  useEffect(() => { if (!rotating) return; const timer = setTimeout(() => setIndex(value => (value + 1) % samples.length), STORY_MS); return () => clearTimeout(timer); }, [index, rotating]);
  const onPointerDown = (event: PointerEvent) => { if (event.pointerType !== "mouse") swipe.current = event.clientX; };
  const onPointerUp = (event: PointerEvent) => { if (swipe.current == null) return; const dx = event.clientX - swipe.current; swipe.current = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); };
  const item = samples[index];
  return <section ref={section} id="reviews" className={frame.section} data-ground="paper" aria-label={hi ? "नमूना छात्र समीक्षा" : "Sample student reviews"} aria-roledescription="carousel"
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setFocus(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false); }}><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><MessageSquareQuote size={14} aria-hidden="true" />{hi ? "छात्रों की कहानियाँ" : "Student stories"}<span>{hi ? "नमूना समीक्षाएँ" : "Sample reviews"}</span></p>
        <h2>{hi ? "छोटे कदम। " : "Small steps. "}<em>{hi ? "बढ़ता आत्मविश्वास।" : "Growing confidence."}</em></h2>
      </div>
      <p className={frame.lede}>{hi ? "ये नमूना समीक्षाएँ दिखाती हैं कि डैशबोर्ड का हर क्षेत्र रोज़ की पढ़ाई में कैसे काम आ सकता है। ये असली छात्रों के उद्धरण नहीं हैं; असली प्रतिक्रिया मिलने पर इन्हें बदल दिया जाएगा।" : "These sample stories show how each area of the dashboard can fit into a week of study, and the routine behind each one. They are illustrations, not quotes from real students, and will be replaced with real feedback as it arrives."}</p>
    </header>
    <div className={styles.layout}>
      <div className={styles.stage} onKeyDown={event => { if (event.key === "ArrowRight") go(1); if (event.key === "ArrowLeft") go(-1); }}>
        <div className={styles.deck} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null; }} aria-live={rotating ? "off" : "polite"}>
          {/* The next two stories fan out behind the front card, so the deck reads as more to come. */}
          <span className={styles.behind} data-depth="2" aria-hidden="true" />
          <span className={styles.behind} data-depth="1" aria-hidden="true" />
          <article key={item.id} className={styles.card} data-tone={index % 5} role="group" aria-roledescription="slide" aria-label={hi ? `नमूना समीक्षा ${index + 1} / ${samples.length}` : `Sample review ${index + 1} of ${samples.length}`}>
            <div className={styles.cardTop}>
              <span className={styles.area}><item.area.icon size={14} aria-hidden="true" />{item.area.name[lang]}</span>
              <div role="img" aria-label={hi ? `नमूना रेटिंग ${item.rating} / 5` : `Sample rating ${item.rating} out of 5`} className={styles.stars}>{[1, 2, 3, 4, 5].map(star => <Star key={star} size={15} fill={star <= item.rating ? "currentColor" : "none"} aria-hidden="true" />)}</div>
            </div>
            <Quote size={34} strokeWidth={1.3} aria-hidden="true" className={styles.mark} />
            <blockquote>{item.quote[lang]}</blockquote>
            <ol className={styles.routine} aria-label={hi ? "उनकी दिनचर्या" : "Their routine"}>{item.routine.map((step, i) => <li key={step} style={{ "--i": i } as React.CSSProperties}><b>{i + 1}</b>{step}</li>)}</ol>
            <div className={styles.profile}>
              <span className={styles.avatar} data-tone={index % 3} aria-hidden="true">{item.initials}</span>
              <div><strong>{item.name}</strong><span>{item.focus[lang]}</span></div>
              <small className={styles.sample}>{hi ? "नमूना" : "Sample"}</small>
            </div>
          </article>
        </div>
        <div className={styles.controls}>
          <button type="button" aria-label={hi ? "पिछली समीक्षा" : "Previous review"} onClick={() => go(-1)}><ArrowLeft size={17} /></button>
          <button type="button" className={styles.ring} data-running={rotating || undefined} aria-label={paused ? (hi ? "समीक्षा चलाएँ" : "Play reviews") : (hi ? "समीक्षा रोकें" : "Pause reviews")} onClick={() => setPaused(value => !value)}>
            <svg className={styles.ringSvg} viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" /><circle key={`${index}-${rotating}`} cx="18" cy="18" r="16" className={styles.ringFill} style={{ animationDuration: `${STORY_MS}ms` }} /></svg>
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button type="button" aria-label={hi ? "अगली समीक्षा" : "Next review"} onClick={() => go(1)}><ArrowRight size={17} /></button>
          <span className={styles.counter} aria-hidden="true">{String(index + 1).padStart(2, "0")} <i>/ {String(samples.length).padStart(2, "0")}</i></span>
          <small className={styles.hint}>{reduced ? (hi ? "स्वचालित घुमाव बंद (कम गति)" : "Auto-advance off (reduced motion)") : paused ? (hi ? "रुका हुआ" : "Paused") : (hi ? "हर 8 सेकंड में अगली कहानी" : "Next story every 8 seconds · swipe or use ← →")}</small>
        </div>
      </div>
      <div className={styles.index} role="group" aria-label={hi ? "समीक्षा चुनें" : "Choose a review"}>{samples.map((story, i) => <button type="button" key={story.id} aria-pressed={index === i} onClick={() => setIndex(i)}>
        <span className={styles.selectorAvatar} data-tone={i % 3} aria-hidden="true">{story.initials}</span>
        <span className={styles.who}><b>{story.name}</b><small>{story.focus[lang]}</small></span>
        <span className={styles.whoArea}><story.area.icon size={15} aria-hidden="true" /><span>{story.area.name[lang]}</span></span>
        {index === i && <i key={`${index}-${rotating}`} className={styles.bar} data-running={rotating || undefined} style={{ animationDuration: `${STORY_MS}ms` }} aria-hidden="true" />}
      </button>)}</div>
    </div>
  </div></section>;
}
