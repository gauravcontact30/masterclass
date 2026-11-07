"use client";
import { GOALS, trackGoal } from "@/lib/goals";
import { useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import Link from "@/components/site-link";
import {
  ArrowRight, Award, Bookmark, BookOpenCheck, Bot, CalendarClock, Code2, FileCode2, Flame, Hand, Headphones, Layers,
  MessagesSquare, Sparkles, Star, Terminal, Workflow, type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import styles from "./welcome-modal.module.css";

/** Greets by the visitor's own clock. Computed after mount, so it never differs between server and client. */
function greeting(hour: number) {
  if (hour < 5) return "Hello, night owl";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const BUZZ_TOPICS = ["Agentic AI", "LangGraph", "Next.js 16", "React 19", "System Design", "Cloud"];
const BUZZ_POINTS: { icon: LucideIcon; text: string }[] = [
  { icon: CalendarClock, text: "Five fresh blogs every Monday, 00:00 IST" },
  { icon: Star, text: "Every story rated by developers before it runs" },
  { icon: Headphones, text: "Read it or listen to it, with a choice of voices" },
  { icon: Bookmark, text: "Follow topics, save stories and join the comments" },
];

const API_POINTS: { icon: LucideIcon; text: string }[] = [
  { icon: BookOpenCheck, text: "Written from each project's official documentation" },
  { icon: Sparkles, text: "What an API does, in one line, before the detail" },
  { icon: Code2, text: "Code tabs, examples and a Python runner in the page" },
];

const FEATURES: { icon: LucideIcon; title: string; text: string; tone: string }[] = [
  { icon: Layers, title: "Structured courses", text: "Full lessons on modern stacks.", tone: "clay" },
  { icon: Terminal, title: "Techy code lab", text: "Write and run code beside the lesson.", tone: "sky" },
  { icon: Award, title: "Mock exams", text: "Timed practice, worked answers.", tone: "sage" },
  { icon: MessagesSquare, title: "Interview prep", text: "Real questions, model answers.", tone: "violet" },
  { icon: Workflow, title: "Workflows", text: "Step-by-step blueprints of real systems.", tone: "honey" },
  { icon: Bot, title: "Study Buddy", text: "An AI tutor that answers while you read.", tone: "rose" },
];

/**
 * The welcome window: a greeting, then two spotlights (Tech Buzz and API Docs) and a grid of the core features.
 * No prices, plans or sales copy. Plain shapes only, no photos, so it stays light when it opens on its own.
 */
export default function WelcomeModalPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  // This panel only ever renders in the browser (it is lazy-loaded after the page settles), so the clock is safe here.
  const [hello] = useState(() => greeting(new Date().getHours()));
  const close = () => onOpenChange(false);
  const start = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent initialFocus={start} className={`${styles.popup} p-0 gap-0 sm:max-w-240`}>
        <div ref={start} tabIndex={-1} className={styles.body}>
          <header className={styles.hero}>
            <span className={styles.orbit} aria-hidden="true"><i /><i /><BrandMark size={34} className={styles.orbitMark} /></span>
            <div className={styles.heroTop}>
              <p className={styles.brand}><BrandMark size={20} /><span>Master Class <b>-</b> Buddy</span></p>
              <p className={styles.kicker}><Hand size={14} className={styles.wave} aria-hidden="true" />{hello}, and welcome</p>
            </div>
            <DialogTitle className={styles.title}>Glad you&apos;re here. <em>Here&apos;s what&apos;s waiting for you.</em></DialogTitle>
            <DialogDescription className={styles.lede}>
              Fresh writing on what changed in tech, a clear guide to the APIs you build with, and courses that take you all the way through.
            </DialogDescription>
          </header>

          <div className={styles.spotlights}>
            <article className={styles.buzz} aria-labelledby="welcome-buzz">
              <div className={styles.spotHead}>
                <span className={styles.spotIcon}><Flame size={17} aria-hidden="true" /></span>
                <div>
                  <p className={styles.spotKicker}>The blog</p>
                  <h3 id="welcome-buzz">Tech Buzz</h3>
                </div>
                <span className={styles.live} aria-hidden="true"><i />New this week</span>
              </div>
              <p className={styles.spotLede}>Reader-rated stories on what moved in tech, written to be finished in one sitting.</p>
              <ul className={styles.points}>
                {BUZZ_POINTS.map(item => <li key={item.text}><item.icon size={13} aria-hidden="true" />{item.text}</li>)}
              </ul>
              <div className={styles.spotFoot}>
                <div className={styles.topics} aria-label="Topics">
                  {BUZZ_TOPICS.map(topic => <span key={topic}>{topic}</span>)}
                </div>
                <Link href="/tech-buzz" className={styles.spotCta} onClick={close}>Read stories<ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
            </article>

            <article className={styles.api} aria-labelledby="welcome-api">
              <div className={styles.spotHead}>
                <span className={styles.spotIcon}><FileCode2 size={17} aria-hidden="true" /></span>
                <div>
                  <p className={styles.spotKicker}>The field guide</p>
                  <h3 id="welcome-api">API Docs</h3>
                </div>
              </div>
              <p className={styles.spotLede}>The APIs that matter, without the noise. Pick a technology and learn its building blocks.</p>
              <div className={styles.snippet} aria-hidden="true">
                <span className={styles.snippetBar}><i /><i /><i /><b>useEffect</b><em>Sync with an outside system</em></span>
                <code><span className={styles.fn}>useEffect</span>{"(() => "}<span className={styles.kw}>subscribe</span>{"(id), [id]);"}</code>
              </div>
              <ul className={styles.points}>
                {API_POINTS.map(item => <li key={item.text}><item.icon size={13} aria-hidden="true" />{item.text}</li>)}
              </ul>
              <div className={styles.spotFoot}>
                <Link href="/api-reference" className={styles.spotCta} onClick={close}>Browse API Docs<ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
            </article>
          </div>

          <section className={styles.features} aria-labelledby="welcome-features">
            <h3 id="welcome-features" className={styles.featuresTitle}>Everything else you can do here</h3>
            <ul className={styles.featureGrid}>
              {FEATURES.map(item => (
                <li key={item.title} data-tone={item.tone}>
                  <span className={styles.featureIcon}><item.icon size={15} aria-hidden="true" /></span>
                  <span><strong>{item.title}</strong><small>{item.text}</small></span>
                </li>
              ))}
            </ul>
          </section>

          <footer className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => { trackGoal(GOALS.welcomeStart); close(); }}>Start exploring<ArrowRight size={15} aria-hidden="true" /></button>
            <Link href="/#tech-docs" className={styles.secondary} onClick={() => { trackGoal(GOALS.welcomeCourses); close(); }}>See the courses</Link>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
