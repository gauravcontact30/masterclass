import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, Braces, ChevronRight, BadgeCheck, ClipboardList, Clock3, Crosshair, GraduationCap, Sparkles, FlaskConical, Footprints, GitFork, Lightbulb, ListChecks, MessageSquareText, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { CodeFiles } from "./code-files";
import { DeepCourseObjective } from "./deep-course-objective";
import { CoursePanelLayout, ModuleDone, ModulesToggle, OtherCourses, PanelCollapse, type SideFamily } from "./deep-course-side";
import { DeepCourseProgress, DeepTopicCard, DeepTopicChecklist, OpenInCompiler } from "./deep-topic-progress";
import { PreparingTopic } from "./deep-course-generating";
import { deepCourseHref } from "@/lib/deep-courses";
import { COURSE_CATALOG } from "@/lib/deep-courses/catalog";
import { familyOfTrack, TRACK_FAMILIES } from "@/lib/pro-learn/families";
import { topicTint } from "@/lib/deep-courses/progress";
import type { CourseTopic, DeepCourse, LabExample, TopicEssentials, TopicLab } from "@/lib/deep-courses/types";
import styles from "./deep-course.module.css";

function modulesOf(course: DeepCourse) {
  const names = [...new Set(course.topics.map(topic => topic.module))];
  return names.map(name => ({ name, topics: course.topics.filter(topic => topic.module === name) }));
}

/** Other courses for the sidebar, by family in catalogue order; this course's family comes first as "Related". */
function otherFamilies(course: DeepCourse): SideFamily[] {
  const own = familyOfTrack(course.id)?.id;
  const families = TRACK_FAMILIES.map(family => ({
    id: family.id, name: family.name, icon: family.icon, related: family.id === own,
    courses: COURSE_CATALOG.filter(other => other.family === family.id && other.id !== course.id)
      .map(other => ({ id: other.id, name: other.name, glyph: other.glyph, focus: other.focus, handwritten: other.handwritten })),
  })).filter(family => family.courses.length);
  return [...families.filter(family => family.related), ...families.filter(family => !family.related)];
}

function Sidebar({ course, active }: { course: DeepCourse; active?: string }) {
  const modules = modulesOf(course);
  const activeModule = course.topics.find(topic => topic.id === active)?.module;
  return <nav className={styles.side} aria-label={`${course.name} topics`}>
    <div className={styles.sideTop}>
      <Link href={deepCourseHref(course.id)} className={styles.sideCourse} aria-current={active ? undefined : "page"}><span aria-hidden="true">{course.glyph}</span>{course.name}</Link>
      {modules.length > 1 && <ModulesToggle key={active ?? ""} allOpen={!activeModule}/>}
      <PanelCollapse/>
    </div>
    {/* Modules collapse; the one holding the open topic starts expanded (every module on the course overview). */}
    {modules.map((module, moduleIndex) => <details key={module.name} className={styles.sideModule} data-module="" open={activeModule ? module.name === activeModule : true}>
      <summary><ChevronRight size={14} className={styles.sideChevron} aria-hidden="true"/><span className={styles.sideModuleName}>Module {moduleIndex + 1} · {module.name}</span>
        <ModuleDone courseId={course.id} topicIds={module.topics.map(topic => topic.id)}/></summary>
      {/* Topics are numbered through the whole course and tinted like their cards, so the two always match. */}
      <ol>{module.topics.map(topic => { const number = course.topics.indexOf(topic); const tone = topicTint(number); return <li key={topic.id} style={{ "--tint": tone.tint, "--ink": tone.ink } as React.CSSProperties}>
        <Link href={deepCourseHref(course.id, topic.id)} aria-current={topic.id === active ? "page" : undefined}><span className={styles.sideNumber}>{String(number + 1).padStart(2, "0")}</span><span>{topic.title}</span></Link>
      </li>; })}</ol>
    </details>)}
    <OtherCourses currentId={course.id} families={otherFamilies(course)}/>
  </nav>;
}

function Overview({ course }: { course: DeepCourse }) {
  const modules = modulesOf(course);
  const minutes = course.topics.reduce((total, topic) => total + topic.minutes, 0);
  const questions = course.topics.reduce((total, topic) => total + topic.subjective.length + topic.objective.length, 0);
  return <div className={styles.main}>
    <header className={styles.hero} style={{ "--tint": course.tint } as React.CSSProperties}>
      <p className={styles.eyebrow}><Link href="/learning/lessons">Lessons</Link> / In-depth course</p>
      <h1><span aria-hidden="true">{course.glyph}</span> {course.name}</h1>
      {course.intro.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <dl className={styles.stats}>
        <div><dt>Topics</dt><dd>{course.topics.length}</dd></div>
        <div><dt>Modules</dt><dd>{modules.length}</dd></div>
        <div><dt>Study time</dt><dd>{Math.round(minutes / 60 * 10) / 10} h</dd></div>
        <div><dt>Practice questions</dt><dd>{questions}</dd></div>
      </dl>
      <DeepCourseProgress courseId={course.id} topicIds={course.topics.map(topic => topic.id)} />
      {!!course.sources?.length && <p className={styles.sources}>Researched from the official documentation: {course.sources.map(source => source.site).filter((site, i, all) => all.indexOf(site) === i).join(", ")}.</p>}
      {course.topics[0] && <Link className={styles.start} href={deepCourseHref(course.id, course.topics[0].id)}>Start with “{course.topics[0].title}”<ArrowRight size={15} aria-hidden="true"/></Link>}
    </header>
    {modules.map((module, moduleIndex) => <section key={module.name} className={styles.moduleBlock} aria-labelledby={`module-${moduleIndex}`}>
      <h2 id={`module-${moduleIndex}`}><span>Module {moduleIndex + 1}</span>{module.name}</h2>
      <div className={styles.topicGrid}>{module.topics.map(topic => <DeepTopicCard key={topic.id} courseId={course.id} index={course.topics.indexOf(topic)} href={deepCourseHref(course.id, topic.id)}
        topic={{ id: topic.id, title: topic.title, module: topic.module, level: topic.level, minutes: topic.minutes, summary: topic.summary, takeaway: topic.essentials?.core }} />)}</div>
    </section>)}
  </div>;
}

function Topic({ course, topic }: { course: DeepCourse; topic: CourseTopic }) {
  const index = course.topics.findIndex(item => item.id === topic.id);
  return <article className={styles.main}>
    <header className={styles.topicHead}>
      <p className={styles.eyebrow}><Link href={deepCourseHref(course.id)}>{course.name}</Link> / {topic.module} / Topic {index + 1} of {course.topics.length}</p>
      <h1>{topic.title}</h1>
      <p className={styles.summary}>{topic.summary}</p>
      <p className={styles.meta}><i data-level={topic.level}>{topic.level}</i><span><Clock3 size={14} aria-hidden="true"/>{topic.minutes} min</span></p>
      {topic.pending && <PreparingTopic title={topic.title} />}
      {!topic.pending && <nav className={styles.jump} aria-label="On this page">
        <a href="#learn">What you will learn</a>{topic.essentials && <a href="#essentials">Essentials</a>}<a href="#description">Description</a><a href="#usage">Usage</a>
        {topic.lab && <><a href="#steps">Step by step</a><a href="#syntax">Syntax</a><a href="#example">Example &amp; output</a><a href="#simple">Simple</a><a href="#moderate">Moderate</a><a href="#complex">Complex</a></>}
        <a href="#code">Complete codebase</a>
        {topic.lab && <><a href="#assignments">Assignments</a><a href="#alternates">Alternate ways</a></>}
        <a href="#tips">Tips</a><a href="#subjective">Subjective Q&amp;A</a><a href="#objective">Objective MCQs</a>
      </nav>}
    </header>
    {!topic.pending && <TopicBody course={course} topic={topic} index={index} />}
    <TopicPager course={course} index={index} />
  </article>;
}

/** Each part of a topic is its own light card, tinted so a reader can tell the parts apart at a glance. */
const TONES = {
  description: "lavender", usage: "sky", steps: "mint", syntax: "butter", example: "peach", simple: "mint", moderate: "sky", complex: "lavender",
  code: "slate", assignments: "rose", alternates: "sage", tips: "butter", subjective: "sky", objective: "mint",
} as const;

function TopicBody({ course, topic, index }: { course: DeepCourse; topic: CourseTopic; index: number }) {
  return <>
    <DeepTopicChecklist courseId={course.id} topicId={topic.id} index={index} />

    <WhatYouWillLearn topic={topic} />

    {topic.essentials && <Essentials essentials={topic.essentials} />}

    <section id="description" className={styles.block} data-tone={TONES.description}>
      <h2><BookOpenText size={18} aria-hidden="true"/>Description</h2>
      <ul className={styles.points}>{topic.description.map(paragraph => <li key={paragraph}>{paragraph}</li>)}</ul>
    </section>
    <section id="usage" className={styles.block} data-tone={TONES.usage}>
      <h2><Wrench size={18} aria-hidden="true"/>Usage</h2>
      <ul className={styles.usage}>{topic.usage.map(item => <li key={item}>{item}</li>)}</ul>
    </section>
    {topic.lab && <LabSteps lab={topic.lab} />}
    {topic.lab && <LabSyntax lab={topic.lab} />}
    {topic.lab && <LabExampleBlock id="example" heading="Example and its output" icon={<FlaskConical size={18} aria-hidden="true"/>} example={topic.lab.example} />}
    {topic.lab && <LabExampleBlock id="simple" heading="Simple example" level="Simple" icon={<FlaskConical size={18} aria-hidden="true"/>} example={topic.lab.simple} />}
    {topic.lab && <LabExampleBlock id="moderate" heading="Moderate example" level="Moderate" icon={<FlaskConical size={18} aria-hidden="true"/>} example={topic.lab.moderate} />}
    {topic.lab && <LabExampleBlock id="complex" heading="Complex example" level="Complex" icon={<FlaskConical size={18} aria-hidden="true"/>} example={topic.lab.complex} />}
    <section id="code" className={styles.block} data-tone={TONES.code}>
      <h2><span className={styles.codeIcon} aria-hidden="true">{"</>"}</span>Complete codebase</h2>
      <p className={styles.hint}>The whole topic as one project: the example project first, then the syntax, every worked example and each alternate way in its own folder. Switch files with the tabs or the file tree; each tab is a complete file you can copy.</p>
      <CodeFiles skin="apple" label={`${topic.title} codebase`} annotate={false} files={codebaseOf(topic)} initialPath={topic.files[0]?.path}/>
    </section>
    {topic.lab && <LabAssignments lab={topic.lab} />}
    {topic.lab && <LabAlternates lab={topic.lab} />}
    <section id="tips" className={styles.block} data-tone={TONES.tips}>
      <h2><Lightbulb size={18} aria-hidden="true"/>Tips</h2>
      <ul className={styles.tips}>{topic.tips.map(item => <li key={item}>{item}</li>)}</ul>
    </section>
    <section id="subjective" className={styles.block} data-tone={TONES.subjective}>
      <h2><MessageSquareText size={18} aria-hidden="true"/>Interview &amp; exam questions — Subjective</h2>
      <p className={styles.hint}>Try answering aloud or on paper first, then open the model answer.</p>
      <ol className={styles.qa}>{topic.subjective.map((item, number) => <li key={item.q}><details>
        <summary><span>Q{number + 1}.</span> {item.q}</summary>
        <div className={styles.answer}>{item.a.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      </details></li>)}</ol>
    </section>
    <section id="objective" className={styles.block} data-tone={TONES.objective}>
      <h2><ListChecks size={18} aria-hidden="true"/>Interview &amp; exam questions — Objective</h2>
      <p className={styles.hint}>Choose an option to check it.</p>
      <ol className={styles.mcqs}>{topic.objective.map((question, number) => <DeepCourseObjective key={question.q} question={question} number={number + 1}/>)}</ol>
    </section>
  </>;
}

/**
 * The topic's learning summary, drawn like a Tech Buzz story's "What you will learn": the key points to remember as a
 * numbered list (the essentials' key points, or the usage when a topic has none), the editor's score from the
 * pre-publish review and the official documentation it was researched from (named, never linked).
 */
function WhatYouWillLearn({ topic }: { topic: CourseTopic }) {
  const points = topic.essentials?.keyPoints.length ? topic.essentials.keyPoints : topic.usage;
  const score = topic.review?.score;
  const sources = topic.review?.sources ?? [];
  if (!points.length) return null;
  return <section id="learn" className={styles.learn} aria-labelledby="learn-title">
    <div className={styles.learnHead}>
      <h2 id="learn-title"><GraduationCap size={15} aria-hidden="true"/>What you will learn</h2>
      {score ? <span className={styles.learnScore} title="Score from the editor's review before publishing; lessons need 4 out of 5 to go live">
        <span aria-hidden="true">{"★".repeat(Math.round(score))}{"☆".repeat(5 - Math.round(score))}</span> {score.toFixed(1)}/5 editor review
      </span> : null}
    </div>
    <ol className={styles.learnList}>{points.map(point => <li key={point}>{point}</li>)}</ol>
    {sources.length ? <div className={styles.learnSources}>
      <span>Researched from the official documentation</span>
      <ul>{sources.map(source => <li key={`${source.site}${source.title}`}>{source.title} <small>({source.site})</small></li>)}</ul>
    </div> : null}
  </section>;
}

const extensionOf = (file: string) => file.match(/\.[a-z0-9]+$/i)?.[0] ?? ".txt";
/** File name of an assignment's solution, in the language of the topic's main example. */
const solutionFile = (lab: TopicLab, at: number) => `solution-${at + 1}${extensionOf(lab.example.file)}`;

/**
 * Every piece of code a topic teaches, as one multi-file project for the Apple-style editor: the example project's own
 * files at the root, then the syntax, each worked example, the alternate ways and the assignment solutions in folders,
 * so files with the same name (Main.java, main.py) never collide.
 */
function codebaseOf(topic: CourseTopic) {
  const files = topic.files.map(file => ({ path: file.path, code: file.code, note: file.note ?? "" }));
  const lab = topic.lab;
  if (!lab) return files;
  const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "example";
  const name = (file: string) => file.split("/").pop() || file;
  files.push({ path: `syntax/${name(lab.syntax.file)}`, code: lab.syntax.code, note: "" });
  for (const [folder, example] of [["example", lab.example], ["simple", lab.simple], ["moderate", lab.moderate], ["complex", lab.complex]] as const) {
    files.push({ path: `examples/${folder}/${name(example.file)}`, code: example.code, note: example.title });
  }
  lab.alternates.forEach((item, at) => files.push({ path: `alternates/${at + 1}-${slug(item.title)}/${name(item.file)}`, code: item.code, note: item.why }));
  lab.assignments.forEach((item, at) => { if (item.code) files.push({ path: `solutions/${solutionFile(lab, at)}`, code: item.code, note: item.q }); });
  // A path written twice keeps its first file.
  return files.filter((file, at) => files.findIndex(other => other.path === file.path) === at);
}

/**
 * The topic as a revision sheet: the key takeaway and the answer to give in an interview, each on its own light card.
 * Only the essence is here; the key points are in "What you will learn" and the full explanation follows.
 */
function Essentials({ essentials }: { essentials: TopicEssentials }) {
  return <section id="essentials" className={styles.essentials} aria-labelledby="essentials-title">
    <header className={styles.essentialsHead}>
      <h2 id="essentials-title"><Crosshair size={18} aria-hidden="true"/>Essentials</h2>
      <p>Revise this before an exam or an interview: the whole topic on one screen.</p>
    </header>
    <div className={styles.takeawayCard}>
      <h3><Sparkles size={15} aria-hidden="true"/>Key takeaway</h3>
      <p>{essentials.core}</p>
    </div>
    <div className={styles.interviewCard}>
      <h3><BadgeCheck size={15} aria-hidden="true"/>Interview answer</h3>
      <p>{essentials.answer}</p>
      <small>Answer in this order: what it is, how it works, when to use it.</small>
    </div>
  </section>;
}

function TopicPager({ course, index }: { course: DeepCourse; index: number }) {
  const previous = course.topics[index - 1], next = course.topics[index + 1];
  return <nav className={styles.pager} aria-label="Topic navigation">
    {previous ? <Link href={deepCourseHref(course.id, previous.id)}><small><ArrowLeft size={13} aria-hidden="true"/>Previous</small><b>{previous.title}</b></Link> : <span/>}
    {next ? <Link href={deepCourseHref(course.id, next.id)} className={styles.pagerNext}><small>Next<ArrowRight size={13} aria-hidden="true"/></small><b>{next.title}</b></Link> : <Link href={deepCourseHref(course.id)} className={styles.pagerNext}><small>Finished</small><b>Back to the {course.name} overview</b></Link>}
  </nav>;
}

function LabSteps({ lab }: { lab: TopicLab }) {
  return <section id="steps" className={styles.block} data-tone={TONES.steps}>
    <h2><Footprints size={18} aria-hidden="true"/>Step by step</h2>
    <ol className={styles.steps}>{lab.steps.map(step => <li key={step}>{step}</li>)}</ol>
  </section>;
}

function LabSyntax({ lab }: { lab: TopicLab }) {
  return <section id="syntax" className={styles.block} data-tone={TONES.syntax}>
    <h2><Braces size={18} aria-hidden="true"/>Syntax</h2>
    <CodeFiles skin="apple" label="Syntax" annotate={false} files={[{ path: lab.syntax.file, code: lab.syntax.code, note: "" }]}/>
    <ul className={styles.usage}>{lab.syntax.notes.map(note => <li key={note}>{note}</li>)}</ul>
  </section>;
}

/** One runnable example: the code, what it prints, and a button that opens it in the online compiler. */
function LabExampleBlock({ id, heading, level, icon, example }: { id: string; heading: string; level?: "Simple" | "Moderate" | "Complex"; icon: ReactNode; example: LabExample }) {
  return <section id={id} className={styles.block} data-tone={TONES[id as keyof typeof TONES]}>
    <h2>{icon}{heading}{level && <i className={styles.levelChip} data-grade={level}>{level}</i>}</h2>
    <p className={styles.exampleTitle}>{example.title}</p>
    {example.explain && <p>{example.explain}</p>}
    <CodeFiles skin="apple" label={example.title} annotate={false} files={[{ path: example.file, code: example.code, note: "" }]}/>
    <div className={styles.resultHead}><span>Result / Output</span><OpenInCompiler files={[{ name: example.file, code: example.code }]} /></div>
    <pre className={styles.result}>{example.output}</pre>
  </section>;
}

function LabAssignments({ lab }: { lab: TopicLab }) {
  return <section id="assignments" className={styles.block} data-tone={TONES.assignments}>
    <h2><ClipboardList size={18} aria-hidden="true"/>Assignment questions with answers</h2>
    <p className={styles.hint}>Solve each one yourself first, then open the answer to compare.</p>
    <ol className={styles.qa}>{lab.assignments.map((item, number) => <li key={item.q}><details>
      <summary><span>A{number + 1}.</span> {item.q}</summary>
      <div className={styles.answer}>
        {item.a.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        {item.code && <CodeFiles skin="apple" label={`Solution ${number + 1}`} annotate={false} files={[{ path: `solutions/${solutionFile(lab, number)}`, code: item.code, note: "" }]}/>}
      </div>
    </details></li>)}</ol>
  </section>;
}

function LabAlternates({ lab }: { lab: TopicLab }) {
  return <section id="alternates" className={styles.block} data-tone={TONES.alternates}>
    <h2><GitFork size={18} aria-hidden="true"/>Do it the same in a different way</h2>
    <p className={styles.hint}>The same result, written another way, and when you would choose it.</p>
    {lab.alternates.map(item => <div key={item.title} className={styles.alternate}>
      <h3>{item.title}</h3>
      <p>{item.why}</p>
      <CodeFiles skin="apple" label={item.title} annotate={false} files={[{ path: item.file, code: item.code, note: "" }]}/>
      <div className={styles.resultHead}><span/><OpenInCompiler files={[{ name: item.file, code: item.code }]} /></div>
    </div>)}
  </section>;
}

/** A course overview, or one of its topics when `topicId` is given. */
export function DeepCourseView({ course, topicId }: { course: DeepCourse; topicId?: string }) {
  const topic = topicId ? course.topics.find(item => item.id === topicId) : undefined;
  return <CoursePanelLayout side={<Sidebar course={course} active={topic?.id}/>} glyph={course.glyph} name={course.name}>
    {topic ? <Topic course={course} topic={topic}/> : <Overview course={course}/>}
  </CoursePanelLayout>;
}
