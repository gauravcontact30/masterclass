"use client";
import { useId, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { Check, Flag, Hammer, Layers, Loader2, RotateCcw, Sparkles, type LucideIcon } from "lucide-react";
import type { LearningPath, PathStage } from "@/lib/learning-path";
import { PLAN_LENGTHS, stageSpans } from "@/lib/learning-path-stages";
import { requestJson } from "@/lib/client";
import { useLanguage } from "./language-provider";
import { stageWeeks } from "./learning-path-view";
import home from "./landing-home.module.css";
import styles from "./landing-path-finder.module.css";

/** Ready-made goals; the first SHOWN are always visible, the rest behind "More ideas". */
const GOALS: [label: string, labelHi: string, goal: string, goalHi: string][] = [
  ["Frontend job", "फ्रंटएंड नौकरी", "get a frontend developer job", "फ्रंटएंड डेवलपर की नौकरी पाना"],
  ["AI agents", "AI एजेंट", "build AI agents with Python", "Python से AI एजेंट बनाना"],
  ["Node.js backend", "Node.js बैकएंड", "become a backend developer with Node.js", "Node.js के साथ बैकएंड डेवलपर बनना"],
  ["DevOps and AWS", "DevOps और AWS", "move into DevOps and AWS", "DevOps और AWS में जाना"],
  ["Full-stack developer", "फ़ुल-स्टैक डेवलपर", "become a full-stack developer with React and Node.js", "React और Node.js से फ़ुल-स्टैक डेवलपर बनना"],
  ["Data engineering", "डेटा इंजीनियरिंग", "start a career in data engineering with Python and SQL", "Python और SQL से डेटा इंजीनियरिंग में करियर शुरू करना"],
  ["Test automation", "टेस्ट ऑटोमेशन", "become a QA automation engineer with Playwright", "Playwright से QA ऑटोमेशन इंजीनियर बनना"],
  ["React interview", "React इंटरव्यू", "crack a React and Next.js interview", "React और Next.js इंटरव्यू पास करना"],
  ["Python from zero", "शुरू से Python", "learn Python from scratch", "शुरू से Python सीखना"],
  ["Cybersecurity basics", "साइबर सुरक्षा की बुनियाद", "learn cybersecurity basics for web apps", "वेब ऐप्स के लिए साइबर सुरक्षा की बुनियाद सीखना"],
  ["Generative AI apps", "जनरेटिव AI ऐप", "build generative AI apps with LangChain and Claude", "LangChain और Claude से जनरेटिव AI ऐप बनाना"],
  ["Mobile apps", "मोबाइल ऐप", "build mobile apps with Flutter", "Flutter से मोबाइल ऐप बनाना"],
];
const SHOWN = 7;
/** What each of the three stages is for; the model and the rules both plan to this shape. */
const STAGES: { icon: LucideIcon; en: string; hi: string }[] = [
  { icon: Layers, en: "Foundation", hi: "बुनियाद" },
  { icon: Hammer, en: "Practice", hi: "अभ्यास" },
  { icon: Flag, en: "Project", hi: "प्रोजेक्ट" },
];
const note = (id: string) => `/dashboard/notes?technology=${id}`;
const t = (id: string, title: string) => ({ id, title, href: note(id) });
/** Shown before the first plan, quieter than a real one, so a visitor sees what the planner returns. */
const SAMPLE: { en: PathStage[]; hi: PathStage[] } = {
  en: [
    { stage: 1, from: 1, to: 2, focus: "Modern JavaScript and Git", technologies: [t("javascript", "JavaScript"), t("git", "Git & GitHub")], tasks: ["Work through the JavaScript notes and run each example", "Commit every exercise to a GitHub repository"], outcome: "You can write and explain everyday JavaScript" },
    { stage: 2, from: 3, to: 3, focus: "Typed React components", technologies: [t("typescript", "TypeScript"), t("react", "React 19+")], tasks: ["Build five small components with typed props", "Take the React quiz and review every miss"], outcome: "You can build an interactive page in React" },
    { stage: 3, from: 4, to: 4, focus: "Portfolio app with Next.js", technologies: [t("nextjs", "Next.js 16+")], tasks: ["Ship a small Next.js app with two routes", "Practice ten React interview questions"], outcome: "A live project you can walk an interviewer through" },
  ],
  hi: [
    { stage: 1, from: 1, to: 2, focus: "आधुनिक JavaScript और Git", technologies: [t("javascript", "JavaScript"), t("git", "Git & GitHub")], tasks: ["JavaScript नोट्स पढ़ें और हर उदाहरण चलाएँ", "हर अभ्यास GitHub पर सहेजें"], outcome: "रोज़मर्रा का JavaScript लिख और समझा सकेंगे" },
    { stage: 2, from: 3, to: 3, focus: "टाइप्ड React कंपोनेंट", technologies: [t("typescript", "TypeScript"), t("react", "React 19+")], tasks: ["टाइप्ड props वाले पाँच छोटे कंपोनेंट बनाएँ", "React क्विज़ दें और गलतियाँ दोबारा देखें"], outcome: "React में एक इंटरैक्टिव पेज बना सकेंगे" },
    { stage: 3, from: 4, to: 4, focus: "Next.js से पोर्टफ़ोलियो ऐप", technologies: [t("nextjs", "Next.js 16+")], tasks: ["दो रूट वाला छोटा Next.js ऐप बनाएँ", "React के दस इंटरव्यू प्रश्नों का अभ्यास करें"], outcome: "एक चालू प्रोजेक्ट, जिसे इंटरव्यू में समझा सकें" },
  ],
};
const noSubscribe = () => () => {};

/**
 * The landing page's route planner: the visitor completes "I want to ___ in N weeks" and gets a three-stage plan
 * (foundation, practice, project) through this app's own catalog (/api/learning-path), shown as three light cards
 * on a route line. Before the first plan the cards show an example. Topic links go through sign-in, and "Start this
 * plan free" carries the goal to sign-up so the dashboard opens with the same plan.
 */
export function LandingPathFinder() {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const id = useId();
  // False in the server HTML: until React hydrates, a click would fall through to a native submit that reloads the page.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState<number>(4);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error" | "limited">("idle");
  const [moreGoals, setMoreGoals] = useState(false);
  const request = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function plan(value: string, length = weeks) {
    if (value.trim().length < 3) { input.current?.focus(); return; }
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setGoal(value); setState("loading");
    try {
      const result = await requestJson<LearningPath>("/api/learning-path", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal: value.trim(), weeks: length, language }), signal: controller.signal });
      if (!controller.signal.aborted) { setPath(result); setState("idle"); }
    } catch (error) { if (!controller.signal.aborted) setState(error instanceof Error && error.message === "rate_limited" ? "limited" : "error"); }
  }
  const submit = (event: FormEvent) => { event.preventDefault(); void plan(goal); };
  // A new length re-plans the same goal at once; before any plan it reshapes the example.
  const chooseLength = (n: number) => { setWeeks(n); if (path || state === "error") void plan(goal || path?.goal || "", n); };
  const reset = () => { request.current?.abort(); setPath(null); setState("idle"); setGoal(""); input.current?.focus(); };

  const loading = state === "loading";
  let mode: "result" | "loading" | "sample" = "sample";
  if (path) mode = "result"; else if (loading) mode = "loading";
  const placeholders = stageSpans(weeks).map(([from, to], i): PathStage => ({ stage: (i + 1) as 1 | 2 | 3, from, to, focus: "", technologies: [], tasks: [], outcome: "" }));
  const spans = stageSpans(weeks);
  let stages: PathStage[] = SAMPLE[hi ? "hi" : "en"].map((stage, i) => ({ ...stage, from: spans[i][0], to: spans[i][1] }));
  if (path) stages = path.stages; else if (loading) stages = placeholders;
  let heading = text(`Example: frontend developer in ${weeks} weeks`, `उदाहरण: ${weeks} हफ़्तों में फ्रंटएंड डेवलपर`);
  if (path) heading = text(`Your ${path.weeks}-week route`, `आपका ${path.weeks} हफ़्तों का रास्ता`);
  else if (loading) heading = text("Mapping your route…", "आपका रास्ता बन रहा है…");

  return <section id="path-finder" className={styles.section} aria-labelledby={`${id}-title`}><div className={home.inner}>
    <div className={styles.panel}>
      <div className={styles.intro}>
        <h2 id={`${id}-title`}>{text("Plan your route", "अपना रास्ता तय कीजिए")}</h2>
        <p>{text("Say where you want to get to. AI turns it into three stages, foundation, practice and a project, using the notes, quizzes and interview questions already in MasterClass.", "बताइए आप कहाँ पहुँचना चाहते हैं। AI उसे तीन चरणों में बाँटता है: बुनियाद, अभ्यास और प्रोजेक्ट, MasterClass के नोट्स, क्विज़ और इंटरव्यू प्रश्नों से।")}</p>
      </div>

      <form className={styles.composer} onSubmit={submit} method="post">
        <p className={styles.sentence}>
          <label htmlFor={`${id}-goal`}>{text("I want to", "मैं चाहता/चाहती हूँ")}</label>
          <input ref={input} id={`${id}-goal`} className={styles.goal} value={goal} onChange={e => setGoal(e.target.value)} minLength={3} maxLength={300} autoComplete="off"
            placeholder={text("crack a React interview", "React इंटरव्यू पास करना")} />
        </p>
        <div className={styles.controls}>
          <fieldset className={styles.length}>
            <legend className={styles.srOnly}>{text("Plan length in weeks", "योजना की अवधि (हफ़्ते)")}</legend>
            {!hi && <span aria-hidden="true">in</span>}
            {PLAN_LENGTHS.map(n => <label key={n} data-active={weeks === n}>
              <input type="radio" name={`${id}-weeks`} value={n} checked={weeks === n} disabled={loading} onChange={() => chooseLength(n)} />{n}
            </label>)}
            <span aria-hidden="true">{text("weeks", "हफ़्तों में")}</span>
          </fieldset>
          <button type="submit" className={styles.plan} disabled={loading || !hydrated}>
            {loading ? <Loader2 size={16} className={styles.spin} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            {loading ? text("Planning…", "बन रहा है…") : text("Plan my route", "रास्ता बनाइए")}
          </button>
        </div>
        <div className={styles.tries}>
          <span>{text("Or try", "या आज़माएँ")}</span>
          <ul id={`${id}-goals`}>
            {(moreGoals ? GOALS : GOALS.slice(0, SHOWN)).map(([label, labelHi, en, hindi]) => {
              const value = hi ? hindi : en;
              return <li key={label}><button type="button" aria-pressed={path?.goal === value} disabled={loading || !hydrated} onClick={() => void plan(value)}>{hi ? labelHi : label}</button></li>;
            })}
            <li><button type="button" className={styles.more} aria-expanded={moreGoals} aria-controls={`${id}-goals`} onClick={() => setMoreGoals(open => !open)}>
              {moreGoals ? text("Fewer ideas", "कम विचार") : text(`More ideas (${GOALS.length - SHOWN})`, `और विचार (${GOALS.length - SHOWN})`)}
            </button></li>
          </ul>
        </div>
      </form>

      <div className={styles.route} data-mode={mode} aria-live="polite" aria-busy={loading}>
        <div className={styles.routeHead}>
          <div>
            <h3>{heading}</h3>
            {path && <p>{path.summary}</p>}
          </div>
          {path && <button type="button" className={styles.reset} onClick={reset}><RotateCcw size={14} aria-hidden="true" />{text("New goal", "नया लक्ष्य")}</button>}
        </div>
        {state === "error" && <p className={styles.problem}>{text("The route could not be planned just now. Press Plan my route again in a moment.", "अभी रास्ता नहीं बन सका। थोड़ी देर बाद फिर से 'रास्ता बनाइए' दबाएँ।")}</p>}
        {state === "limited" && <p className={styles.problem}>{text("That is the hourly limit for visitors. Create a free account to keep planning.", "विज़िटर के लिए यह घंटे की सीमा है। आगे के लिए मुफ़्त खाता बनाइए।")}</p>}
        <ol className={styles.stages}>
          {stages.map((stage, i) => {
            const meta = STAGES[i]; const Icon = meta.icon;
            return <li key={stage.stage} className={styles.stage} style={{ "--i": i } as CSSProperties} data-stage={stage.stage}>
              <span className={styles.marker} aria-hidden="true"><Icon size={16} /></span>
              <article className={styles.card}>
                <header className={styles.cardHead}>
                  <span className={styles.stageName}>{hi ? `चरण ${stage.stage}: ${meta.hi}` : `Stage ${stage.stage}: ${meta.en}`}</span>
                  <span className={styles.weeks}>{stageWeeks(stage, hi)}</span>
                </header>
                {mode === "loading" ? <div className={styles.skeleton} aria-hidden="true"><i /><i /><i /></div> : <>
                  <h4>{stage.focus}</h4>
                  {stage.technologies.length > 0 && <ul className={styles.topics} aria-label={text("Topics", "विषय")}>
                    {stage.technologies.map(item => <li key={item.id}>{mode === "sample" ? <span>{item.title}</span> : <Link href={`/sign-in?redirect=${encodeURIComponent(item.href)}`} prefetch={false}>{item.title}</Link>}</li>)}
                  </ul>}
                  <ul className={styles.tasks}>{stage.tasks.map(task => <li key={task}><Check size={14} aria-hidden="true" />{task}</li>)}</ul>
                  <p className={styles.outcome}><span>{text("By the end", "आख़िर तक")}</span>{stage.outcome}</p>
                </>}
              </article>
            </li>;
          })}
        </ol>
        {path && <div className={styles.finish}>
          <Link className={styles.start} href={`/sign-up?goal=${encodeURIComponent(path.goal)}`}>{text("Start this plan free", "यह योजना मुफ़्त शुरू करें")}</Link>
          <small>{path.source === "ai" ? text("Planned by AI from MasterClass notes. Adjust the pace to suit you.", "AI ने MasterClass नोट्स से बनाया। अपनी गति से बदलें।") : text("Planned from your goal's keywords because AI planning is unavailable right now.", "AI अभी उपलब्ध न होने से आपके लक्ष्य के शब्दों से बनाया।")}</small>
        </div>}
      </div>
    </div>
  </div></section>;
}
