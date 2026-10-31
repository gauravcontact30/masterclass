"use client";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent, type RefObject } from "react";
import Image from "@/components/responsive-image";
import Link from "next/link";
import { Check, Flag, Hammer, Layers, Loader2, RotateCcw, Sparkles, type LucideIcon } from "lucide-react";
import type { LearningPath, PathStage } from "@/lib/learning-path";
import { PLAN_LENGTHS, stageSpans } from "@/lib/learning-path-stages";
import { requestJson } from "@/lib/client";
import { useLanguage } from "./language-provider";
import type { FreshGoal } from "@/lib/landing-fresh-types";
import { pickDaily, rotateDaily } from "@/lib/daily-rotation";
import { stageWeeks } from "./learning-path-view";
import home from "./landing-home.module.css";
import styles from "./landing-path-finder.module.css";

/** The lines the ready-made goals are grouped by, like lines on a transit map; "popular" is today's mix. */
type Line = "ai" | "frontend" | "backend" | "cloud" | "data" | "mobile" | "quality" | "interview";
const LINES: { id: Line; en: string; hi: string }[] = [
  { id: "ai", en: "AI & agents", hi: "AI और एजेंट" },
  { id: "frontend", en: "Frontend", hi: "फ्रंटएंड" },
  { id: "backend", en: "Backend", hi: "बैकएंड" },
  { id: "cloud", en: "Cloud & DevOps", hi: "क्लाउड और DevOps" },
  { id: "data", en: "Data & ML", hi: "डेटा और ML" },
  { id: "mobile", en: "Mobile", hi: "मोबाइल" },
  { id: "quality", en: "Testing & security", hi: "टेस्टिंग और सुरक्षा" },
  { id: "interview", en: "Interviews", hi: "इंटरव्यू" },
];
type Goal = [label: string, labelHi: string, goal: string, goalHi: string, line?: Line, icon?: string];
/** Ready-made goals, each named by its technology and filed under a line; `icon` names a picture in /images/tech.
 *  Today's AI-written goals (lib/server/landing-fresh.ts) lead the popular mix when the nightly job has run. */
const GOALS: Goal[] = [
  ["Next.js", "Next.js", "get a frontend developer job with React and Next.js", "React और Next.js से फ्रंटएंड डेवलपर की नौकरी पाना", "frontend", "nextjs"],
  ["LangChain", "LangChain", "build AI agents with Python and LangChain", "Python और LangChain से AI एजेंट बनाना", "ai", "langchain"],
  ["Node.js", "Node.js", "become a backend developer with Node.js", "Node.js के साथ बैकएंड डेवलपर बनना", "backend", "nodejs"],
  ["AWS", "AWS", "move into DevOps and AWS", "DevOps और AWS में जाना", "cloud", "aws"],
  ["TypeScript", "TypeScript", "become a full-stack developer with TypeScript, React and Node.js", "TypeScript, React और Node.js से फ़ुल-स्टैक डेवलपर बनना", "frontend", "typescript"],
  ["SQL", "SQL", "start a career in data engineering with Python and SQL", "Python और SQL से डेटा इंजीनियरिंग में करियर शुरू करना", "data", "postgresql"],
  ["Playwright", "Playwright", "become a QA automation engineer with Playwright", "Playwright से QA ऑटोमेशन इंजीनियर बनना", "quality", "playwright"],
  ["React", "React", "crack a React interview", "React इंटरव्यू पास करना", "interview", "react"],
  ["Python", "Python", "learn Python from scratch", "शुरू से Python सीखना", "backend", "python"],
  ["OWASP security", "OWASP सुरक्षा", "learn web app security with the OWASP Top 10", "OWASP Top 10 से वेब ऐप सुरक्षा सीखना", "quality"],
  ["Claude", "Claude", "build generative AI apps with Claude", "Claude से जनरेटिव AI ऐप बनाना", "ai", "claude"],
  ["Flutter", "Flutter", "build mobile apps with Flutter", "Flutter से मोबाइल ऐप बनाना", "mobile", "flutter"],
  ["LangGraph", "LangGraph", "build stateful multi-agent workflows with LangGraph", "LangGraph से स्टेटफ़ुल मल्टी-एजेंट वर्कफ़्लो बनाना", "ai", "langgraph"],
  ["LangSmith", "LangSmith", "trace and evaluate LLM apps with LangSmith", "LangSmith से LLM ऐप्स को ट्रेस और इवैल्युएट करना", "ai", "langsmith"],
  ["Langflow", "Langflow", "prototype AI agents visually with Langflow", "Langflow से AI एजेंट का विज़ुअल प्रोटोटाइप बनाना", "ai", "langflow"],
  ["n8n", "n8n", "automate business workflows with n8n and AI agents", "n8n और AI एजेंट से बिज़नेस वर्कफ़्लो ऑटोमेट करना", "ai", "n8n"],
  ["Agentic AI", "एजेंटिक AI", "become an agentic AI engineer", "एजेंटिक AI इंजीनियर बनना", "ai", "agentic-ai"],
  ["RAG", "RAG", "build a RAG chatbot over my own documents", "अपने दस्तावेज़ों पर RAG चैटबॉट बनाना", "ai"],
  ["Angular", "Angular", "become an Angular developer", "Angular डेवलपर बनना", "frontend", "angular"],
  ["Vue.js", "Vue.js", "build modern frontends with Vue.js", "Vue.js से आधुनिक फ्रंटएंड बनाना", "frontend", "vue"],
  ["Zustand", "Zustand", "manage React state cleanly with Zustand and TanStack Query", "Zustand और TanStack Query से React स्टेट साफ़ ढंग से संभालना", "frontend", "zustand"],
  ["FastAPI", "FastAPI", "build Python APIs with FastAPI", "FastAPI से Python API बनाना", "backend", "fastapi"],
  ["Django", "Django", "build web apps with Python and Django", "Python और Django से वेब ऐप बनाना", "backend", "django"],
  ["NestJS", "NestJS", "build structured Node.js backends with NestJS", "NestJS से व्यवस्थित Node.js बैकएंड बनाना", "backend", "nestjs"],
  ["Go", "Go", "build fast backend services with Go", "Go से तेज़ बैकएंड सर्विसेज़ बनाना", "backend", "go"],
  ["Rust", "Rust", "learn systems programming with Rust", "Rust से सिस्टम प्रोग्रामिंग सीखना", "backend", "rust"],
  ["Java", "Java", "become a Java backend developer with Spring Boot", "Spring Boot से Java बैकएंड डेवलपर बनना", "backend"],
  ["GraphQL", "GraphQL", "build a GraphQL API", "GraphQL API बनाना", "backend", "graphql"],
  ["Docker", "Docker", "containerise my apps with Docker", "Docker से अपने ऐप कंटेनर में चलाना", "cloud", "docker"],
  ["Kubernetes", "Kubernetes", "deploy and scale apps on Kubernetes", "Kubernetes पर ऐप डिप्लॉय और स्केल करना", "cloud", "kubernetes"],
  ["Terraform", "Terraform", "manage cloud infrastructure as code with Terraform", "Terraform से क्लाउड इंफ्रास्ट्रक्चर को कोड की तरह संभालना", "cloud"],
  ["GitHub Actions", "GitHub Actions", "set up CI/CD with GitHub Actions", "GitHub Actions से CI/CD सेट करना", "cloud", "git"],
  ["Azure", "Azure", "become a cloud engineer on Microsoft Azure", "Microsoft Azure पर क्लाउड इंजीनियर बनना", "cloud"],
  ["Linux", "Linux", "learn Linux and shell scripting", "Linux और शेल स्क्रिप्टिंग सीखना", "cloud", "linux"],
  ["PostgreSQL", "PostgreSQL", "master PostgreSQL and database design", "PostgreSQL और डेटाबेस डिज़ाइन में महारत पाना", "data", "postgresql"],
  ["Redis", "Redis", "speed up apps with Redis caching", "Redis कैशिंग से ऐप तेज़ करना", "data", "redis"],
  ["pandas", "pandas", "become a data analyst with Python and pandas", "Python और pandas से डेटा एनालिस्ट बनना", "data", "python"],
  ["PyTorch", "PyTorch", "start in machine learning with PyTorch", "PyTorch से मशीन लर्निंग शुरू करना", "data"],
  ["Kafka", "Kafka", "build event-driven systems with Kafka", "Kafka से इवेंट-ड्रिवन सिस्टम बनाना", "data"],
  ["React Native", "React Native", "build cross-platform mobile apps with React Native", "React Native से क्रॉस-प्लेटफ़ॉर्म मोबाइल ऐप बनाना", "mobile", "react"],
  ["Vitest", "Vitest", "write reliable unit tests with Vitest and Testing Library", "Vitest और Testing Library से भरोसेमंद यूनिट टेस्ट लिखना", "quality", "vitest"],
  ["System Design", "सिस्टम डिज़ाइन", "crack a system design interview", "सिस्टम डिज़ाइन इंटरव्यू पास करना", "interview", "system-design"],
  ["DSA", "DSA", "prepare for coding interviews with data structures and algorithms", "डेटा स्ट्रक्चर और एल्गोरिद्म से कोडिंग इंटरव्यू की तैयारी करना", "interview"],
  ["JavaScript", "JavaScript", "crack a JavaScript interview", "JavaScript इंटरव्यू पास करना", "interview", "javascript"],
];
/** How many goals the popular mix shows. */
const POPULAR = 8;
/** What each of the three stages is for; the model and the rules both plan to this shape. */
const STAGES: { icon: LucideIcon; en: string; hi: string }[] = [
  { icon: Layers, en: "Foundation", hi: "बुनियाद" },
  { icon: Hammer, en: "Practice", hi: "अभ्यास" },
  { icon: Flag, en: "Project", hi: "प्रोजेक्ट" },
];
const note = (id: string) => `/learning/notes?technology=${id}`;
const t = (id: string, title: string) => ({ id, title, href: note(id) });
/** Shown before the first plan, quieter than a real one, so a visitor sees what the planner returns; one a day. */
const SAMPLES: { label: [string, string]; en: PathStage[]; hi: PathStage[] }[] = [
  { label: ["frontend developer", "फ्रंटएंड डेवलपर"],
    en: [
      { stage: 1, from: 1, to: 2, focus: "Modern JavaScript and Git", technologies: [t("javascript", "JavaScript"), t("git", "Git & GitHub")], tasks: ["Work through the JavaScript notes and run each example", "Commit every exercise to a GitHub repository"], outcome: "You can write and explain everyday JavaScript" },
      { stage: 2, from: 3, to: 3, focus: "Typed React components", technologies: [t("typescript", "TypeScript"), t("react", "React 19+")], tasks: ["Build five small components with typed props", "Take the React quiz and review every miss"], outcome: "You can build an interactive page in React" },
      { stage: 3, from: 4, to: 4, focus: "Portfolio app with Next.js", technologies: [t("nextjs", "Next.js 16+")], tasks: ["Ship a small Next.js app with two routes", "Practice ten React interview questions"], outcome: "A live project you can walk an interviewer through" },
    ],
    hi: [
      { stage: 1, from: 1, to: 2, focus: "आधुनिक JavaScript और Git", technologies: [t("javascript", "JavaScript"), t("git", "Git & GitHub")], tasks: ["JavaScript नोट्स पढ़ें और हर उदाहरण चलाएँ", "हर अभ्यास GitHub पर सहेजें"], outcome: "रोज़मर्रा का JavaScript लिख और समझा सकेंगे" },
      { stage: 2, from: 3, to: 3, focus: "टाइप्ड React कंपोनेंट", technologies: [t("typescript", "TypeScript"), t("react", "React 19+")], tasks: ["टाइप्ड props वाले पाँच छोटे कंपोनेंट बनाएँ", "React क्विज़ दें और गलतियाँ दोबारा देखें"], outcome: "React में एक इंटरैक्टिव पेज बना सकेंगे" },
      { stage: 3, from: 4, to: 4, focus: "Next.js से पोर्टफ़ोलियो ऐप", technologies: [t("nextjs", "Next.js 16+")], tasks: ["दो रूट वाला छोटा Next.js ऐप बनाएँ", "React के दस इंटरव्यू प्रश्नों का अभ्यास करें"], outcome: "एक चालू प्रोजेक्ट, जिसे इंटरव्यू में समझा सकें" },
    ] },
  { label: ["AI agent builder", "AI एजेंट बिल्डर"],
    en: [
      { stage: 1, from: 1, to: 2, focus: "Python and calling a model", technologies: [t("python", "Python"), t("langchain", "LangChain")], tasks: ["Work through the Python notes on functions and async", "Call a chat model and stream its answer"], outcome: "You can script a model call and read its output" },
      { stage: 2, from: 3, to: 3, focus: "Tools, memory and retrieval", technologies: [t("langgraph", "LangGraph")], tasks: ["Give an agent two tools and log each step", "Add retrieval over your own notes"], outcome: "An agent that looks things up before it answers" },
      { stage: 3, from: 4, to: 4, focus: "A deployed study assistant", technologies: [t("agentic-ai", "Agentic AI")], tasks: ["Ship the agent behind a small web page", "Practice ten agentic AI interview questions"], outcome: "A working agent you can demo and explain" },
    ],
    hi: [
      { stage: 1, from: 1, to: 2, focus: "Python और मॉडल को कॉल करना", technologies: [t("python", "Python"), t("langchain", "LangChain")], tasks: ["functions और async पर Python नोट्स पढ़ें", "एक चैट मॉडल को कॉल करें और उत्तर स्ट्रीम करें"], outcome: "मॉडल कॉल की स्क्रिप्ट लिख और उसका आउटपुट पढ़ सकेंगे" },
      { stage: 2, from: 3, to: 3, focus: "टूल, मेमोरी और रिट्रीवल", technologies: [t("langgraph", "LangGraph")], tasks: ["एजेंट को दो टूल दें और हर कदम लॉग करें", "अपने नोट्स पर रिट्रीवल जोड़ें"], outcome: "ऐसा एजेंट जो उत्तर देने से पहले जानकारी खोजे" },
      { stage: 3, from: 4, to: 4, focus: "डिप्लॉय किया गया स्टडी असिस्टेंट", technologies: [t("agentic-ai", "Agentic AI")], tasks: ["एजेंट को एक छोटे वेब पेज के पीछे चलाएँ", "Agentic AI के दस इंटरव्यू प्रश्नों का अभ्यास करें"], outcome: "एक चालू एजेंट, जिसे दिखा और समझा सकें" },
    ] },
  { label: ["DevOps engineer", "DevOps इंजीनियर"],
    en: [
      { stage: 1, from: 1, to: 2, focus: "Linux, Git and containers", technologies: [t("git", "Git & GitHub"), t("docker", "Docker")], tasks: ["Containerise a small app with a Dockerfile", "Write a compose file for the app and its database"], outcome: "You can build and run any app in a container" },
      { stage: 2, from: 3, to: 3, focus: "Cloud basics on AWS", technologies: [t("aws", "AWS")], tasks: ["Deploy the container to a managed service", "Set up logs and one alarm"], outcome: "Your app runs in the cloud and you can see its health" },
      { stage: 3, from: 4, to: 4, focus: "A CI/CD pipeline", technologies: [t("github-actions", "GitHub Actions")], tasks: ["Test and deploy on every push", "Practice ten DevOps interview questions"], outcome: "A pipeline you can draw and defend in an interview" },
    ],
    hi: [
      { stage: 1, from: 1, to: 2, focus: "Linux, Git और कंटेनर", technologies: [t("git", "Git & GitHub"), t("docker", "Docker")], tasks: ["Dockerfile से एक छोटा ऐप कंटेनर में चलाएँ", "ऐप और डेटाबेस के लिए compose फ़ाइल लिखें"], outcome: "कोई भी ऐप कंटेनर में बना और चला सकेंगे" },
      { stage: 2, from: 3, to: 3, focus: "AWS पर क्लाउड की बुनियाद", technologies: [t("aws", "AWS")], tasks: ["कंटेनर को एक मैनेज्ड सेवा पर डिप्लॉय करें", "लॉग और एक अलार्म सेट करें"], outcome: "आपका ऐप क्लाउड पर चलेगा और उसकी सेहत दिखेगी" },
      { stage: 3, from: 4, to: 4, focus: "एक CI/CD पाइपलाइन", technologies: [t("github-actions", "GitHub Actions")], tasks: ["हर push पर टेस्ट और डिप्लॉय करें", "DevOps के दस इंटरव्यू प्रश्नों का अभ्यास करें"], outcome: "ऐसी पाइपलाइन जिसे इंटरव्यू में बना और समझा सकें" },
    ] },
  { label: ["data engineer", "डेटा इंजीनियर"],
    en: [
      { stage: 1, from: 1, to: 2, focus: "SQL and Python for data", technologies: [t("sql", "SQL"), t("python", "Python")], tasks: ["Write joins and window functions on a sample dataset", "Load a CSV with Python and clean it"], outcome: "You can query, join and clean real data" },
      { stage: 2, from: 3, to: 3, focus: "Pipelines and scheduling", technologies: [t("postgresql", "PostgreSQL")], tasks: ["Build a daily job that loads new rows", "Add checks that stop bad data"], outcome: "A pipeline that runs on its own and fails loudly" },
      { stage: 3, from: 4, to: 4, focus: "A small analytics warehouse", technologies: [t("aws", "AWS")], tasks: ["Model a fact table and two dimensions", "Practice ten data engineering interview questions"], outcome: "A project that shows data from source to dashboard" },
    ],
    hi: [
      { stage: 1, from: 1, to: 2, focus: "डेटा के लिए SQL और Python", technologies: [t("sql", "SQL"), t("python", "Python")], tasks: ["नमूना डेटा पर joins और window functions लिखें", "Python से CSV लोड करें और साफ़ करें"], outcome: "असली डेटा को क्वेरी, जोड़ और साफ़ कर सकेंगे" },
      { stage: 2, from: 3, to: 3, focus: "पाइपलाइन और शेड्यूलिंग", technologies: [t("postgresql", "PostgreSQL")], tasks: ["नई पंक्तियाँ लोड करने वाला रोज़ का जॉब बनाएँ", "ख़राब डेटा रोकने वाली जाँच जोड़ें"], outcome: "ऐसी पाइपलाइन जो खुद चले और गड़बड़ी साफ़ बताए" },
      { stage: 3, from: 4, to: 4, focus: "एक छोटा एनालिटिक्स वेयरहाउस", technologies: [t("aws", "AWS")], tasks: ["एक fact टेबल और दो dimensions बनाएँ", "डेटा इंजीनियरिंग के दस इंटरव्यू प्रश्नों का अभ्यास करें"], outcome: "स्रोत से डैशबोर्ड तक डेटा दिखाने वाला प्रोजेक्ट" },
    ] },
];
/** The panel's colour for the day and its three stage cards' light tints (landing-path-finder.module.css). */
const THEMES: { panel: string; tints: [string, string, string] }[] = [
  { panel: "pine", tints: ["mint", "sky", "butter"] },
  { panel: "indigo", tints: ["lavender", "peach", "sky"] },
  { panel: "plum", tints: ["rose", "butter", "mint"] },
  { panel: "ocean", tints: ["aqua", "sand", "lavender"] },
  { panel: "cocoa", tints: ["peach", "sage", "sky"] },
  { panel: "navy", tints: ["sky", "mint", "rose"] },
  { panel: "olive", tints: ["butter", "aqua", "peach"] },
];
const noSubscribe = () => () => {};
const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (update: () => void) => { const query = window.matchMedia?.(motionQuery); query?.addEventListener("change", update); return () => query?.removeEventListener("change", update); };
/** What the planner does while it works, ticked off in turn (about a second each) until the plan arrives. */
const PLANNING: [string, string][] = [["Reading your goal", "आपका लक्ष्य पढ़ रहे हैं"], ["Picking topics from MasterClass", "MasterClass से विषय चुन रहे हैं"], ["Ordering the three stages", "तीन चरण क्रम में लगा रहे हैं"]];

/**
 * The goal box's placeholder types out one example goal after another while the box is empty and unfocused, so a
 * visitor sees the kind of sentence to write. Still for reduced motion: the first example stays.
 * It writes the input's placeholder directly: as React state it re-rendered the whole planner 20-35 times a second
 * for as long as the page was open, which kept the main thread busy and pushed back Time to Interactive.
 */
function useTypedExample(input: RefObject<HTMLInputElement | null>, examples: string[], run: boolean) {
  useEffect(() => {
    const element = input.current;
    if (!element || !run || examples.length < 2) return;
    let goal = 0, shown = examples[0].length, erasing = true, timer = 0;
    const tick = () => {
      const target = examples[goal];
      if (erasing) { shown -= 1; if (shown <= 0) { erasing = false; goal = (goal + 1) % examples.length; } }
      else if (shown < examples[goal].length) shown += 1;
      else { erasing = true; timer = window.setTimeout(tick, 2200); return; }
      element.placeholder = (erasing ? target : examples[goal]).slice(0, Math.max(0, shown));
      timer = window.setTimeout(tick, erasing ? 28 : 55);
    };
    timer = window.setTimeout(tick, 2200);
    return () => { window.clearTimeout(timer); element.placeholder = examples[0]; };
  }, [input, examples, run]);
}

/**
 * The landing page's route planner: the visitor completes "I want to ___ in N weeks" and gets a three-stage plan
 * (foundation, practice, project) through this app's own catalog (/api/learning-path), shown as three light cards
 * on a route line. Before the first plan the cards show an example. Topic links go through sign-in, and "Start this
 * plan free" goes to sign-up. The example, the order of the ready-made goals and the colours change daily (`day`, istDay).
 */
export function LandingPathFinder({ day = 0, fresh }: { day?: number; fresh?: FreshGoal[] }) {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const id = useId();
  const sample = pickDaily(SAMPLES, day); const theme = pickDaily(THEMES, day);
  // Today's mix: the AI-written goals first (when the nightly job has run), then the ready-made ones in today's order.
  const popular = useMemo(() => {
    const today: Goal[] = [...(fresh ?? []).map((goal): Goal => [goal.tech, goal.hiTech, goal.goal, goal.hiGoal]), ...rotateDaily(GOALS, day)];
    return today.filter((goal, at) => today.findIndex(other => other[0].toLowerCase() === goal[0].toLowerCase()) === at).slice(0, POPULAR);
  }, [fresh, day]);
  const [line, setLine] = useState<Line | "popular">("popular");
  const goals = line === "popular" ? popular : GOALS.filter(goal => goal[4] === line);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia?.(motionQuery).matches ?? false, () => true);
  const [focused, setFocused] = useState(false);
  const examples = useMemo(() => popular.map(goal => hi ? goal[3] : goal[2]), [popular, hi]);
  // False in the server HTML: until React hydrates, a click would fall through to a native submit that reloads the page.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState<number>(4);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error" | "limited">("idle");
  const [phase, setPhase] = useState(0);
  const request = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useTypedExample(input, examples, hydrated && !reduced && !focused && !goal);
  useEffect(() => {
    if (state !== "loading") return;
    const timer = window.setInterval(() => setPhase(at => Math.min(at + 1, PLANNING.length - 1)), 1100);
    return () => window.clearInterval(timer);
  }, [state]);

  async function plan(value: string, length = weeks) {
    if (value.trim().length < 3) { input.current?.focus(); return; }
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setGoal(value); setState("loading"); setPhase(0);
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
  let stages: PathStage[] = sample[hi ? "hi" : "en"].map((stage, i) => ({ ...stage, from: spans[i][0], to: spans[i][1] }));
  if (path) stages = path.stages; else if (loading) stages = placeholders;
  let heading = text(`Example: ${sample.label[0]} in ${weeks} weeks`, `उदाहरण: ${weeks} हफ़्तों में ${sample.label[1]}`);
  if (path) heading = text(`Your ${path.weeks}-week route`, `आपका ${path.weeks} हफ़्तों का रास्ता`);
  else if (loading) heading = text("Mapping your route…", "आपका रास्ता बन रहा है…");

  return <section id="path-finder" className={styles.section} data-theme={theme.panel} aria-labelledby={`${id}-title`}><div className={home.inner}>
    <div className={styles.panel}>
      <div className={styles.intro}>
        <h2 id={`${id}-title`}>{text("Plan your route", "अपना रास्ता तय कीजिए")}</h2>
        <p>{text("Say where you want to get to. AI turns it into three stages, foundation, practice and a project, using the notes, quizzes and interview questions already in MasterClass.", "बताइए आप कहाँ पहुँचना चाहते हैं। AI उसे तीन चरणों में बाँटता है: बुनियाद, अभ्यास और प्रोजेक्ट, MasterClass के नोट्स, क्विज़ और इंटरव्यू प्रश्नों से।")}</p>
      </div>

      <form className={styles.composer} onSubmit={submit} method="post">
        <p className={styles.sentence}>
          <label htmlFor={`${id}-goal`}>{text("I want to", "मैं चाहता/चाहती हूँ")}</label>
          <input ref={input} id={`${id}-goal`} className={styles.goal} value={goal} onChange={e => setGoal(e.target.value)} minLength={3} maxLength={300} autoComplete="off"
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={examples[0] || text("crack a React interview", "React इंटरव्यू पास करना")} />
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
          <div className={styles.triesHead}>
            <span id={`${id}-try`}>{text("Or try a ready-made goal", "या कोई तैयार लक्ष्य आज़माएँ")}</span>
            <small>{text(`${GOALS.length} goals on ${LINES.length} lines`, `${LINES.length} लाइनों पर ${GOALS.length} लक्ष्य`)}</small>
          </div>
          {/* The goals are grouped by line, like a transit map: today's popular mix, then one line per field. */}
          <div className={styles.lines} role="group" aria-label={text("Goal lines", "लक्ष्य की लाइनें")}>
            {[{ id: "popular" as const, en: "Popular this week", hi: "इस हफ़्ते लोकप्रिय" }, ...LINES].map((option, at) => <button key={option.id} type="button" data-line={at} aria-pressed={line === option.id} aria-controls={`${id}-goals`} onClick={() => setLine(option.id)}>
              <i aria-hidden="true" />{hi ? option.hi : option.en}<b>{option.id === "popular" ? popular.length : GOALS.filter(goal => goal[4] === option.id).length}</b>
            </button>)}
          </div>
          <ul id={`${id}-goals`} key={line} aria-labelledby={`${id}-try`}>
            {goals.map(([label, labelHi, en, hindi, goalLine, icon], at) => {
              const value = hi ? hindi : en;
              // Each pill carries its line's colour and the technology's icon; the goal it plans is its tooltip.
              return <li key={label} style={{ "--at": at } as CSSProperties}><button type="button" data-line={goalLine ? LINES.findIndex(option => option.id === goalLine) + 1 : 0} title={value} aria-pressed={path?.goal === value} disabled={loading || !hydrated} onClick={() => void plan(value)}>
                {icon ? <Image src={`/images/tech/${icon}.png`} alt={`${label} logo`} aria-hidden="true" width={16} height={16} /> : <span className={styles.dot} aria-hidden="true" />}{hi ? labelHi : label}
              </button></li>;
            })}
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
        {loading && <ol className={styles.planning}>{PLANNING.map(([en, hindi], at) => <li key={en} data-state={at < phase ? "done" : at === phase ? "now" : "next"}>
          {at < phase ? <Check size={14} aria-hidden="true" /> : <i aria-hidden="true" />}{hi ? hindi : en}
        </li>)}</ol>}
        {state === "error" && <p className={styles.problem}>{text("The route could not be planned just now. Press Plan my route again in a moment.", "अभी रास्ता नहीं बन सका। थोड़ी देर बाद फिर से 'रास्ता बनाइए' दबाएँ।")}</p>}
        {state === "limited" && <p className={styles.problem}>{text("That is the hourly limit for visitors. Create a free account to keep planning.", "विज़िटर के लिए यह घंटे की सीमा है। आगे के लिए मुफ़्त खाता बनाइए।")}</p>}
        {/* A new plan remounts the route, so the line draws again stop by stop and each card arrives as it is reached. */}
        <ol className={styles.stages} key={path ? `${path.goal}:${path.weeks}` : mode}>
          {stages.map((stage, i) => {
            const meta = STAGES[i]; const Icon = meta.icon;
            return <li key={stage.stage} className={styles.stage} style={{ "--i": i } as CSSProperties} data-stage={stage.stage} data-tint={theme.tints[i]}>
              <span className={styles.marker} aria-hidden="true"><Icon size={16} /></span>
              <article className={styles.card}>
                <header className={styles.cardHead}>
                  <span className={styles.stageName}>{hi ? `चरण ${stage.stage}: ${meta.hi}` : `Stage ${stage.stage}: ${meta.en}`}</span>
                  <span className={styles.weeks}>{stageWeeks(stage, hi)}</span>
                </header>
                {mode === "loading" ? <div className={styles.skeleton} aria-hidden="true"><i /><i /><i /></div> : <>
                  <h4>{stage.focus}</h4>
                  {stage.technologies.length > 0 && <ul className={styles.topics} aria-label={text("Topics", "विषय")}>
                    {stage.technologies.map(item => <li key={item.id}>{mode === "sample" ? <span>{item.title}</span> : <Link href={item.href} prefetch={false}>{item.title}</Link>}</li>)}
                  </ul>}
                  <ul className={styles.tasks}>{stage.tasks.map(task => <li key={task}><Check size={14} aria-hidden="true" />{task}</li>)}</ul>
                  <p className={styles.outcome}><span>{text("By the end", "आख़िर तक")}</span>{stage.outcome}</p>
                </>}
              </article>
            </li>;
          })}
        </ol>
        {path && <div className={styles.finish}>
          <Link className={styles.start} href="/sign-up">{text("Start this plan free", "यह योजना मुफ़्त शुरू करें")}</Link>
          <small>{path.source === "ai" ? text("Planned by AI from MasterClass notes. Adjust the pace to suit you.", "AI ने MasterClass नोट्स से बनाया। अपनी गति से बदलें।") : text("Planned from your goal's keywords because AI planning is unavailable right now.", "AI अभी उपलब्ध न होने से आपके लक्ष्य के शब्दों से बनाया।")}</small>
        </div>}
      </div>
    </div>
  </div></section>;
}
