"use client";
import Image from "@/components/responsive-image";
import { createElement, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BookOpenCheck, Brain, Scale, ScrollText, SearchCheck, Check, CheckCircle2, ChevronLeft, ChevronRight, Code2, Eye, EyeOff, GraduationCap, Lightbulb, ListChecks, MessageSquareText, RotateCcw, Sparkles, Target, Terminal, Timer, Trophy, Workflow, X } from "lucide-react";
import { CERTIFICATION_BRANDS } from "@/lib/certification-brands";
import type { Difficulty, ObjectiveQuestion, QuestionCode, StepContent, StepRevision, SubjectiveQuestion, TrackContent } from "@/lib/certification-content-types";
import { AwsServiceIcon } from "./aws-service-icon";
import { CodeFiles } from "./code-files";
import { ListenButton } from "./listen-button";
import styles from "./certification-study.module.css";

/*
 * The study material behind each step of the Certifications page: a lesson (overview, objectives, concepts,
 * must-remember facts, an example, pitfalls, a workflow, the services it uses and a picture), an exam revision pack
 * (how the step is tested, look-alike choices, answer cues, a worked scenario, memory aids, a cheat sheet and a self-check), the step's objective
 * questions as a quiz and its subjective questions with model answers, and a mock exam drawn from the whole track.
 * The material is fetched per track from app/api/certifications/[track] when the track is opened.
 */
export type ContentState = { status: "loading" } | { status: "ready"; content: TrackContent } | { status: "locked" } | { status: "pending" } | { status: "error" };

export function useTrackContent(track: string): ContentState {
  const [state, setState] = useState<{ track: string; value: ContentState }>({ track, value: { status: "loading" } });
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/certifications/${track}`, { signal: controller.signal })
      .then(async response => setState({ track, value: response.status === 401 || response.status === 402 ? { status: "locked" } : response.status === 404 ? { status: "pending" } : response.ok ? { status: "ready", content: await response.json() } : { status: "error" } }))
      .catch(error => { if (!controller.signal.aborted) setState({ track, value: { status: "error" } }); return error; });
    return () => controller.abort();
  }, [track]);
  return state.track === track ? state.value : { status: "loading" };
}

const LETTERS = ["A", "B", "C", "D"];
const DIFFICULTY: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

/** A real brand mark (simple-icons) or an AWS service glyph, with its name. */
export function ServiceIcon({ id }: { id: string }) {
  if (id.startsWith("aws:")) {
    const [name, category] = id.slice(4).split("|");
    return <span className={styles.service} title={name}><span className={styles.serviceMark} data-aws=""><AwsServiceIcon name={name} category={category} size={15} /></span>{name.replace(/^(Amazon|AWS) /, "")}</span>;
  }
  const brand = CERTIFICATION_BRANDS[id.slice(6)];
  if (!brand) return null;
  return <span className={styles.service} title={brand.title}><span className={styles.serviceMark} style={{ color: `#${brand.hex}` }}><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor"><path d={brand.path} /></svg></span>{brand.title}</span>;
}

type StepTab = "lesson" | "revision" | "objective" | "subjective";

/** The lesson read aloud: overview, objectives, concepts, workflow, must-remember facts and traps. */
const lessonLecture = (step: StepContent, number: number) => [step.overview, `By the end of step ${number} you can: ${step.objectives.join(". ")}`,
  `Key concepts. ${step.concepts.map(concept => `${concept.term}: ${concept.explanation}`).join(". ")}`,
  `Workflow, ${step.workflow.title}. ${step.workflow.steps.map((item, at) => `${at + 1}. ${item.label}: ${item.detail}`).join(". ")}`,
  `Must remember for the exam. ${step.keyFacts.join(". ")}`, `Common mistakes and traps. ${step.pitfalls.join(". ")}`].join(". ");
const revisionLecture = (revision: StepRevision, number: number) => [`How the exam tests step ${number}. ${revision.examFocus}`,
  `Which one to choose. ${revision.compare.map(row => `${row.a} or ${row.b}: ${row.difference} Pick ${row.a} when ${row.chooseA} Pick ${row.b} when ${row.chooseB}`).join(". ")}`,
  `If the question says. ${revision.cues.map(cue => `${cue.cue}: pick ${cue.pick}, because ${cue.why}`).join(". ")}`,
  `Worked exam scenario. ${revision.scenario.situation} ${revision.scenario.reasoning.join(" ")} Best answer: ${revision.scenario.answer}`,
  `Memory aids. ${revision.memoryAids.join(". ")}`, `Cheat sheet. ${revision.cheatSheet.join(". ")}`].join(". ");

export function StepStudy({ step, number, listenId }: { step: StepContent; number: number; listenId: string }) {
  const [tab, setTab] = useState<StepTab>("lesson");
  const tabs: { id: StepTab; label: string; icon: typeof BookOpenCheck; count?: number }[] = [
    { id: "lesson", label: "Lesson", icon: BookOpenCheck },
    ...(step.revision ? [{ id: "revision" as const, label: "Exam revision", icon: ScrollText }] : []),
    { id: "objective", label: "Objective questions", icon: ListChecks, count: step.objective.length },
    { id: "subjective", label: "Subjective questions", icon: MessageSquareText, count: step.subjective.length },
  ];
  return <div className={styles.study}>
    <div className={styles.tabs} role="tablist" aria-label={`Step ${number} study material`}>
      {tabs.map(({ id, label, icon, count }) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{createElement(icon, { size: 14, "aria-hidden": true })}{label}{count != null && <b>{count}</b>}</button>)}
    </div>
    <div role="tabpanel" aria-label={tabs.find(item => item.id === tab)!.label}>
      {(tab === "lesson" || tab === "revision") && <p className={styles.listenRow}>
        {tab === "lesson" ? <ListenButton id={`${listenId}:lesson`} title={`Step ${number} lesson`} text={() => lessonLecture(step, number)} compact />
          : <ListenButton id={`${listenId}:revision`} title={`Step ${number} exam revision`} text={() => revisionLecture(step.revision!, number)} compact />}
        {tab === "lesson" ? "Listen to the lesson" : "Listen to the revision pack"}</p>}
      {tab === "lesson" && <Lesson step={step} number={number} />}
      {tab === "revision" && step.revision && <Revision revision={step.revision} number={number} />}
      {tab === "objective" && <ObjectiveList questions={step.objective} />}
      {tab === "subjective" && <SubjectiveList questions={step.subjective} listenId={listenId} />}
    </div>
  </div>;
}

const EXTENSIONS: Record<string, string> = { python: "py", typescript: "ts", javascript: "js", tsx: "tsx", bash: "sh", shell: "sh", yaml: "yaml", json: "json", sql: "sql", hcl: "tf", terraform: "tf", dockerfile: "Dockerfile", go: "go", java: "java" };
/** A one-file snippet as an editor file, named by its language so the editor highlights it. */
const snippetFile = (code: { language: string; code: string }, name: string) => {
  const language = code.language.toLowerCase(), extension = EXTENSIONS[language] ?? "txt";
  return [{ path: extension === "Dockerfile" ? "Dockerfile" : `${name}.${extension}`, code: code.code, note: "" }];
};

/** The step's sample project in the light Apple-style editor: the file tree, one tab per file, and how to run it. */
function Project({ step }: { step: StepContent }) {
  const project = step.project;
  if (!project) return <CodeFiles files={snippetFile(step.example, "example")} skin="apple" annotate={false} label={step.example.caption} />;
  const files = project.files.map(file => ({ path: file.path, code: file.code, note: "" }));
  const first = project.files.find(file => !/readme\.md$/i.test(file.path))?.path;
  return <section className={styles.project} aria-label={`Sample project ${project.title}`}>
    <h5 className={styles.label}><Code2 size={14} aria-hidden="true" />Sample project · {project.title}</h5>
    <p className={styles.projectSummary}>{project.summary}</p>
    <CodeFiles files={files} skin="apple" annotate={false} label={project.title} initialPath={first} />
    <div className={styles.run}><Terminal size={14} aria-hidden="true" /><pre><code>{project.run}</code></pre></div>
  </section>;
}

/** The code a question is about, in the same light editor. */
function QuestionSnippet({ code }: { code?: QuestionCode }) {
  if (!code?.code.trim()) return null;
  return <CodeFiles files={snippetFile(code, "snippet")} skin="apple" annotate={false} label="Code in this question" className={styles.snippet} />;
}

function Lesson({ step, number }: { step: StepContent; number: number }) {
  return <div className={styles.lesson}>
    <div className={styles.lead} data-picture={step.image ? "" : undefined}>
      {step.image && <div className={styles.picture}><Image src={step.image} alt="" fill sizes="(max-width: 760px) 92vw, 420px" /></div>}
      <div>
        <p className={styles.overview}>{step.overview}</p>
        <h5 className={styles.label}><Target size={14} aria-hidden="true" />By the end of step {number} you can</h5>
        <ul className={styles.objectives}>{step.objectives.map((item, at) => <li key={at}><CheckCircle2 size={15} aria-hidden="true" />{item}</li>)}</ul>
        {step.icons.length > 0 && <div className={styles.services} aria-label="Services and tools in this step">{step.icons.map(id => <ServiceIcon key={id} id={id} />)}</div>}
      </div>
    </div>

    <h5 className={styles.label}><Lightbulb size={14} aria-hidden="true" />Key concepts</h5>
    <dl className={styles.concepts}>{step.concepts.map((concept, at) => <div key={at}><dt>{concept.term}</dt><dd>{concept.explanation}</dd></div>)}</dl>

    <h5 className={styles.label}><Workflow size={14} aria-hidden="true" />Workflow · {step.workflow.title}</h5>
    <ol className={styles.flow}>{step.workflow.steps.map((item, at) => <li key={at}>
      <span className={styles.flowNumber} aria-hidden="true">{at + 1}</span>
      <b>{item.label}</b><small>{item.detail}</small>
      {at < step.workflow.steps.length - 1 && <ArrowRight className={styles.flowArrow} size={15} aria-hidden="true" />}
    </li>)}</ol>

    <div className={styles.columns}>
      <section className={styles.facts} aria-label="Must remember for the exam">
        <h5 className={styles.label}><Sparkles size={14} aria-hidden="true" />Must remember for the exam</h5>
        <ul>{step.keyFacts.map((fact, at) => <li key={at}>{fact}</li>)}</ul>
      </section>
      <section className={styles.pitfalls} aria-label="Common mistakes and exam traps">
        <h5 className={styles.label}><AlertTriangle size={14} aria-hidden="true" />Common mistakes and traps</h5>
        <ul>{step.pitfalls.map((item, at) => <li key={at}>{item}</li>)}</ul>
      </section>
    </div>

    <Project step={step} />
  </div>;
}

/** The last-days-before-the-exam pack: how the step is tested, then the choices, cues and rules that decide answers. */
function Revision({ revision, number }: { revision: StepRevision; number: number }) {
  const [ready, setReady] = useState<Set<number>>(new Set());
  const toggle = (at: number) => setReady(current => { const next = new Set(current); if (next.has(at)) next.delete(at); else next.add(at); return next; });
  return <div className={styles.lesson}>
    <p className={styles.examFocus}><Target size={16} aria-hidden="true" /><span><b>How the exam tests step {number}.</b> {revision.examFocus}</span></p>

    <h5 className={styles.label}><Scale size={14} aria-hidden="true" />Which one to choose</h5>
    <div className={styles.compare}>{revision.compare.map((row, at) => <section key={at} aria-label={`${row.a} or ${row.b}`}>
      <h6><span>{row.a}</span><i>vs</i><span>{row.b}</span></h6>
      <p>{row.difference}</p>
      <dl><div><dt>Pick {row.a}</dt><dd>{row.chooseA}</dd></div><div><dt>Pick {row.b}</dt><dd>{row.chooseB}</dd></div></dl>
    </section>)}</div>

    <h5 className={styles.label}><SearchCheck size={14} aria-hidden="true" />If the question says…</h5>
    <ul className={styles.cues}>{revision.cues.map((cue, at) => <li key={at}><q>{cue.cue}</q><ArrowRight size={14} aria-hidden="true" /><span><b>{cue.pick}</b><small>{cue.why}</small></span></li>)}</ul>

    <section className={styles.scenario} aria-label="Worked exam scenario">
      <h5 className={styles.label}><GraduationCap size={14} aria-hidden="true" />Worked exam scenario</h5>
      <p className={styles.situation}>{revision.scenario.situation}</p>
      <ol>{revision.scenario.reasoning.map((line, at) => <li key={at}>{line}</li>)}</ol>
      <p className={styles.verdict}><CheckCircle2 size={15} aria-hidden="true" /><span><b>Best answer.</b> {revision.scenario.answer}</span></p>
    </section>

    <div className={styles.columns}>
      <section className={styles.cheat} aria-label="Cheat sheet">
        <h5 className={styles.label}><ScrollText size={14} aria-hidden="true" />Cheat sheet for the night before</h5>
        <ul>{revision.cheatSheet.map((line, at) => <li key={at}>{line}</li>)}</ul>
      </section>
      <div className={styles.stack}>
        <section className={styles.aids} aria-label="Memory aids">
          <h5 className={styles.label}><Brain size={14} aria-hidden="true" />Memory aids</h5>
          <ul>{revision.memoryAids.map((line, at) => <li key={at}>{line}</li>)}</ul>
        </section>
        <section className={styles.ready} aria-label="Am I exam-ready?">
          <h5 className={styles.label}><ListChecks size={14} aria-hidden="true" />Am I ready? {ready.size} of {revision.selfCheck.length}</h5>
          <ul>{revision.selfCheck.map((line, at) => <li key={at}><label><input type="checkbox" checked={ready.has(at)} onChange={() => toggle(at)} />{line}</label></li>)}</ul>
          {ready.size === revision.selfCheck.length && <p className={styles.readyNote}><Trophy size={14} aria-hidden="true" />Step {number} is exam-ready. Try its questions next.</p>}
        </section>
      </div>
    </div>
  </div>;
}

const PAGE = 5;
function Pages({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  if (pages < 2) return null;
  return <nav className={styles.pages} aria-label="Question pages">
    <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={15} /></button>
    {Array.from({ length: pages }, (_, at) => <button key={at} type="button" aria-current={page === at + 1 ? "page" : undefined} onClick={() => onPage(at + 1)}>{at + 1}</button>)}
    <button type="button" disabled={page === pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={15} /></button>
  </nav>;
}

function Choice({ question, number, picked, onPick }: { question: ObjectiveQuestion; number: number; picked: number | undefined; onPick: (option: number) => void }) {
  const answered = picked != null;
  return <li className={styles.mcq} data-result={answered ? (picked === question.answer ? "right" : "wrong") : undefined}>
    <p className={styles.q}><span className={styles.qNumber}>Q{number}</span>{question.question}<span className={styles.level} data-level={question.difficulty}>{DIFFICULTY[question.difficulty]}</span></p>
    <QuestionSnippet code={question.code} />
    <div className={styles.options} role="group" aria-label={`Options for question ${number}`}>
      {question.options.map((option, at) => <button key={at} type="button" disabled={answered} onClick={() => onPick(at)}
        data-state={answered ? (at === question.answer ? "correct" : at === picked ? "picked" : undefined) : undefined}>
        <span className={styles.letter}>{LETTERS[at]}</span>{option}
        {answered && at === question.answer && <Check size={15} className={styles.mark} aria-label="Correct answer" />}
        {answered && at === picked && at !== question.answer && <X size={15} className={styles.mark} aria-label="Your answer" />}
      </button>)}
    </div>
    {answered && <p className={styles.explanation}><b>{picked === question.answer ? "Correct." : `Answer: ${LETTERS[question.answer]}.`}</b> {question.explanation}</p>}
  </li>;
}

function ObjectiveList({ questions }: { questions: ObjectiveQuestion[] }) {
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const answered = Object.keys(picked).length, right = Object.entries(picked).filter(([at, option]) => questions[Number(at)].answer === option).length;
  const pages = Math.ceil(questions.length / PAGE);
  return <div>
    <div className={styles.score}><span>{answered ? `${right} of ${answered} correct` : "Pick an option to check your answer."}</span>{answered > 0 && <button type="button" onClick={() => setPicked({})}><RotateCcw size={13} aria-hidden="true" />Reset</button>}</div>
    <ol className={styles.questions}>{questions.slice((page - 1) * PAGE, page * PAGE).map((question, at) => { const index = (page - 1) * PAGE + at; return <Choice key={index} question={question} number={index + 1} picked={picked[index]} onPick={option => setPicked(current => ({ ...current, [index]: option }))} />; })}</ol>
    <Pages page={page} pages={pages} onPage={setPage} />
  </div>;
}

function SubjectiveList({ questions, listenId }: { questions: SubjectiveQuestion[]; listenId: string }) {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const pages = Math.ceil(questions.length / PAGE);
  return <div>
    <p className={styles.score}><span>Answer out loud or on paper first, then compare with the model answer.</span></p>
    <ol className={styles.questions}>{questions.slice((page - 1) * PAGE, page * PAGE).map((question, at) => {
      const index = (page - 1) * PAGE + at, shown = open.has(index);
      return <li key={index} className={styles.subjective}>
        <p className={styles.q}><span className={styles.qNumber}>Q{index + 1}</span>{question.question}<span className={styles.level} data-level={question.difficulty}>{DIFFICULTY[question.difficulty]}</span></p>
        <QuestionSnippet code={question.code} />
        <button type="button" className={styles.reveal} aria-expanded={shown} onClick={() => setOpen(current => { const next = new Set(current); if (next.has(index)) next.delete(index); else next.add(index); return next; })}>{shown ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}{shown ? "Hide model answer" : "Show model answer"}</button>
        {shown && <div className={styles.answer}><ListenButton className={styles.answerListen} id={`${listenId}:answer:${index}`} title={`Model answer, question ${index + 1}`} text={() => [question.question, `Model answer. ${question.answer}`, `Key points to hit. ${question.keyPoints.join(". ")}`].join(" ")} compact /><p>{question.answer}</p><h6>Key points to hit</h6><ul>{question.keyPoints.map((point, at) => <li key={at}>{point}</li>)}</ul></div>}
      </li>;
    })}</ol>
    <Pages page={page} pages={pages} onPage={setPage} />
  </div>;
}

const MOCK_SIZE = 20, PASS = 75;
/** A mock exam: 20 objective questions drawn from every step of the track, one at a time, scored at the end. */
export function MockExam({ content, title }: { content: TrackContent; title: string }) {
  const pool = useMemo(() => content.steps.flatMap((step, at) => step.objective.map(question => ({ ...question, step: at + 1 }))), [content]);
  const [exam, setExam] = useState<{ questions: (ObjectiveQuestion & { step: number })[]; answers: number[]; at: number; started: number; finished: number } | null>(null);
  const start = () => {
    const shuffled = [...pool].map(question => ({ question, key: Math.random() })).sort((a, b) => a.key - b.key).slice(0, MOCK_SIZE).map(entry => entry.question);
    setExam({ questions: shuffled, answers: [], at: 0, started: Date.now(), finished: 0 });
  };
  // The finish time is taken when the last answer is given, never during render.
  const answer = (option: number) => setExam(current => current && { ...current, answers: [...current.answers, option], at: Math.min(current.at + 1, current.questions.length - 1),
    finished: current.answers.length + 1 === current.questions.length ? Date.now() : current.finished });
  const total = content.steps.reduce((sum, step) => sum + step.objective.length, 0), written = content.steps.reduce((sum, step) => sum + step.subjective.length, 0);
  if (!exam) return <section className={styles.mock} aria-labelledby="mock-title">
    <div className={styles.mockIntro}>
      <span className={styles.mockMark} aria-hidden="true"><GraduationCap size={22} /></span>
      <div><h4 id="mock-title">Mock exam · {title}</h4><p>{MOCK_SIZE} random objective questions from all {content.steps.length} steps. Practice pass mark {PASS}%. The bank has {total} objective and {written} subjective questions with answers.</p></div>
      <button type="button" className={styles.primary} onClick={start}><Timer size={15} aria-hidden="true" />Start mock exam</button>
    </div>
  </section>;
  const done = exam.answers.length === exam.questions.length;
  if (done) {
    const right = exam.questions.filter((question, at) => exam.answers[at] === question.answer).length, percent = Math.round((right / exam.questions.length) * 100);
    const minutes = Math.max(1, Math.round((exam.finished - exam.started) / 60_000));
    const weak = [...new Set(exam.questions.filter((question, at) => exam.answers[at] !== question.answer).map(question => question.step))].sort((a, b) => a - b);
    return <section className={styles.mock} aria-labelledby="mock-title">
      <div className={styles.result} data-pass={percent >= PASS || undefined}>
        <Trophy size={26} aria-hidden="true" />
        <div><h4 id="mock-title">{percent >= PASS ? "Passed" : "Not yet"} · {percent}%</h4><p>{right} of {exam.questions.length} correct in about {minutes} min.{weak.length ? ` Revise step${weak.length > 1 ? "s" : ""} ${weak.join(", ")}.` : " No weak steps this time."}</p></div>
        <button type="button" className={styles.primary} onClick={start}><RotateCcw size={15} aria-hidden="true" />New mock exam</button>
      </div>
      <h5 className={styles.label}>Review your wrong answers</h5>
      <ol className={styles.questions}>{exam.questions.map((question, at) => exam.answers[at] === question.answer ? null : <Choice key={at} question={question} number={at + 1} picked={exam.answers[at]} onPick={() => {}} />)}</ol>
    </section>;
  }
  const question = exam.questions[exam.at];
  return <section className={styles.mock} aria-labelledby="mock-title">
    <div className={styles.mockHead}><h4 id="mock-title">Mock exam · question {exam.at + 1} of {exam.questions.length}</h4><span>Step {question.step}</span></div>
    <div className={styles.mockBar} role="progressbar" aria-label="Mock exam progress" aria-valuemin={0} aria-valuemax={exam.questions.length} aria-valuenow={exam.at}><span style={{ width: `${(exam.at / exam.questions.length) * 100}%` }} /></div>
    <p className={styles.q}>{question.question}</p>
    <QuestionSnippet key={exam.at} code={question.code} />
    <div className={styles.options} role="group" aria-label="Options">
      {question.options.map((option, at) => <button key={at} type="button" onClick={() => answer(at)}><span className={styles.letter}>{LETTERS[at]}</span>{option}</button>)}
    </div>
    <button type="button" className={styles.quit} onClick={() => setExam(null)}>Quit mock exam</button>
  </section>;
}
