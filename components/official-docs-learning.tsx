import { AccordionSummary } from "@/components/ui/accordion-chevron";
import type { OfficialTechnologyDoc } from "@/lib/official-docs-data";
import { DOCS_PROJECTS } from "@/lib/official-docs-projects";
import { getDocsCodeExamples } from "@/lib/official-docs-examples";
import { CodeFiles } from "./code-files";
import { OfficialDocsTerminal } from "./official-docs-terminal";
import styles from "./official-docs-cards.module.css";
import { ListenButton } from "./listen-button";

export const LEARNING_SECTIONS = [
  ["key", "Key information"],
  ["concepts", "Key concepts"],
  ["objectives", "Learning objectives"],
  ["learning", "Key learning contents"],
  ["code", "Code example"],
  ["terminal", "Terminal commands"],
  ["objective", "Objective questions"],
  ["subjective", "Subjective questions"],
] as const;

function Difficulty({ level }: { level: 1 | 2 | 3 }) {
  return <span className={styles.rating}>
    <span aria-hidden="true">{"★".repeat(level)}{"☆".repeat(3 - level)}</span>
    Difficulty: {level}/3 · {level === 1 ? "Recall" : level === 2 ? "Explain" : "Apply"}
  </span>;
}

export function OfficialDocsLearning({ doc, idPrefix }: { doc: OfficialTechnologyDoc; idPrefix?: string }) {
  const prefix = idPrefix ?? `learning-${doc.id}`;
  const concepts = doc.keyFeatures.slice(0, 3);
  const examples = getDocsCodeExamples(doc);
  const project = examples.find(example => example.level === "Hard")?.runbook ?? DOCS_PROJECTS[doc.id];
  const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const usedPoints = new Set([
    ...doc.keyPoints.slice(0, 3),
    ...concepts.flatMap(concept => [concept.title, concept.description]),
    ...doc.architecturePoints.slice(0, 2),
    doc.bestPractices[0], doc.commonGotchas[0],
    project.summary, ...project.prerequisites, ...project.verify,
  ].filter(Boolean).map(normalize));
  const learningContents = [
    { title: "How it works", points: doc.architecturePoints },
    { title: "Remember", points: doc.bestPractices },
    { title: "Watch out", points: doc.commonGotchas },
  ].flatMap(({ title, points }) => {
    const point = points.find(point => normalize(point) && !usedPoints.has(normalize(point)));
    if (!point) return [];
    usedPoints.add(normalize(point));
    return [{ title, point }];
  });
  const sections = LEARNING_SECTIONS.filter(([id]) => id !== "learning" || learningContents.length > 0);
  return <article className={styles.learning} aria-label={`${doc.title} learning notes`}>
    <header className={styles.header}>
      <div className={styles.titleRow}><h2>{doc.title}</h2>
        <ListenButton id={`docs:${prefix}`} title={`${doc.title} learning notes`} text={() => [doc.title, doc.tagline, `Key information. ${doc.keyPoints.slice(0, 3).join(". ")}`,
          `Key concepts. ${concepts.map(concept => `${concept.title}: ${concept.description}`).join(". ")}`,
          ...learningContents.map(({ title, point }) => `${title}. ${point}`),
          `How it works. ${doc.architecturePoints.slice(0, 2).join(" ")}`, `Recommended practice. ${doc.bestPractices[0] ?? ""}`, `Common pitfall. ${doc.commonGotchas[0] ?? ""}`].join(". ")} /></div>
      <p>{doc.tagline}</p>
    </header>

    <nav className={styles.jumpLinks} aria-label={`${doc.title} learning sections`}>
      {sections.map(([id, label]) => <a key={id} href={`#${prefix}-${id}`}>{label}</a>)}
    </nav>

    <div className={styles.sections}>
      <section id={`${prefix}-key`} className={`${styles.section} ${styles.information}`} aria-labelledby={`${prefix}-key-title`}>
        <h3 id={`${prefix}-key-title`}>Key information</h3>
        <ul className={styles.points}>{doc.keyPoints.slice(0, 3).map(point => <li key={point}><strong>{point}</strong></li>)}</ul>
      </section>

      <section id={`${prefix}-concepts`} className={`${styles.section} ${styles.concepts}`} aria-labelledby={`${prefix}-concepts-title`}>
        <h3 id={`${prefix}-concepts-title`}>Key concepts</h3>
        <dl className={styles.conceptList}>{concepts.map(concept => <div key={concept.title}>
          <dt><mark>{concept.title}</mark></dt><dd>{concept.description}</dd>
        </div>)}</dl>
      </section>

      <section id={`${prefix}-objectives`} className={`${styles.section} ${styles.objectives}`} aria-labelledby={`${prefix}-objectives-title`}>
        <h3 id={`${prefix}-objectives-title`}>Learning objectives</h3>
        <p className={styles.sectionNote}>After studying this guide, you should be able to:</p>
        <ul className={styles.points}>
          {concepts.map(concept => <li key={concept.title}>Explain <strong>{concept.title}</strong> and identify its purpose.</li>)}
          <li>Apply a recommended practice and recognize a common pitfall in <strong>{doc.title}</strong>.</li>
        </ul>
      </section>

      {learningContents.length > 0 && <section id={`${prefix}-learning`} className={`${styles.section} ${styles.contents}`} aria-labelledby={`${prefix}-learning-title`}>
        <h3 id={`${prefix}-learning-title`}>Key learning contents</h3>
        {learningContents.map(({ title, point }) => <div key={title} className={styles.takeaway}><h4>{title}</h4><p>{point}</p></div>)}
      </section>}

      <section id={`${prefix}-code`} className={`${styles.section} ${styles.codeSection}`} aria-labelledby={`${prefix}-code-title`}>
        <h3 id={`${prefix}-code-title`}>Code example</h3>
        <p className={styles.sectionNote}>Practice {doc.title} through Simple, Medium, Hard, and Complex examples. Start with a focused problem, then explore the complete codebase and verification workflow.</p>
        <div className={styles.exampleCards}>
          {examples.map(example => <section key={`${doc.id}-${example.level}`} className={styles.exampleCard} data-level={example.level} aria-labelledby={`${prefix}-example-${example.level}`}>
            <span className={styles.exampleLevel}>{example.level}</span>
            <h4 id={`${prefix}-example-${example.level}`}>{example.level}: {example.title}</h4>
            <p className={styles.sectionNote}>{example.summary}</p>
            {example.level === "Hard" && <p className={styles.sectionNote}>Each tab contains the complete file. Use the Terminal commands below to set up and run this project.</p>}
            {example.level === "Complex" && <p className={styles.sectionNote}>Complete codebase: save every file in a separate project folder, including configuration and tests. Follow this card’s setup and verification steps.</p>}
            <CodeFiles skin="apple" files={example.files} label={example.level === "Hard" ? `${doc.title} codebase` : example.level === "Complex" ? `${doc.title} complex codebase` : `${doc.title} ${example.level.toLowerCase()} example`} lineComments includeConfigTabs explainFormatting={false} className={styles.projectEditor} />
            {example.runbook && example.level !== "Hard" && <div className={styles.complexRunbook}>
              <h5>Before you start</h5>
              <ul className={styles.points}>{example.runbook.prerequisites.map(point => <li key={point}>{point}</li>)}</ul>
              <h5>Run the complete project</h5>
              <OfficialDocsTerminal project={example.runbook} commandLabel={`${example.level} command`} />
              <h5>Check the result</h5>
              <ul className={styles.points}>{example.runbook.verify.map(point => <li key={point}>{point}</li>)}</ul>
            </div>}
          </section>)}
        </div>
      </section>

      <section id={`${prefix}-terminal`} className={`${styles.section} ${styles.terminalSection}`} aria-labelledby={`${prefix}-terminal-title`}>
        <h3 id={`${prefix}-terminal-title`}>Terminal commands</h3>
        <p className={styles.sectionNote}>Save the files at their displayed paths, then run these steps from the project folder in order.</p>
        <h4>Before you start</h4>
        <ul className={styles.points}>{project.prerequisites.map(point => <li key={point}>{point}</li>)}</ul>
        <OfficialDocsTerminal key={doc.id} project={project} />
        <h4>Check the result</h4>
        <ul className={styles.points}>{project.verify.map(point => <li key={point}>{point}</li>)}</ul>
      </section>

      <section id={`${prefix}-objective`} className={`${styles.section} ${styles.objective}`} aria-labelledby={`${prefix}-objective-title`}>
        <h3 id={`${prefix}-objective-title`}>Objective questions</h3>
        <p className={styles.sectionNote}>Identify the concept. Each question has one correct answer.</p>
        {concepts.map((concept, index) => <div key={concept.title} className={styles.question}>
          <Difficulty level={1} />
          <h4>{index + 1}. Which concept matches this description?</h4>
          <p>{concept.description}</p>
          <ol type="A" className={styles.options}>{concepts.map((_, offset) => {
            const option = concepts[(offset + index * 2) % concepts.length];
            return <li key={option.title}>{option.title}</li>;
          })}</ol>
          <details className={styles.answer}><AccordionSummary>Show answer {index + 1}</AccordionSummary><p><strong>Answer:</strong> <mark>{concept.title}</mark></p></details>
        </div>)}
      </section>

      <section id={`${prefix}-subjective`} className={`${styles.section} ${styles.subjective}`} aria-labelledby={`${prefix}-subjective-title`}>
        <h3 id={`${prefix}-subjective-title`}>Subjective questions</h3>
        <p className={styles.sectionNote}>Explain in your own words, then compare with the model answer. Ratings indicate study difficulty.</p>
        <div className={styles.question}>
          <Difficulty level={2} />
          <h4>1. Explain an important architectural behavior of {doc.title}.</h4>
          <details className={styles.answer}><AccordionSummary>Show model answer 1</AccordionSummary>
            <p><strong>Model answer:</strong> {doc.architecturePoints.slice(0, 2).join(" ")}</p>
          </details>
        </div>
        <div className={styles.question}>
          <Difficulty level={3} />
          <h4>2. When reviewing a {doc.title} implementation, what should you recommend and what pitfall should you flag?</h4>
          <details className={styles.answer}><AccordionSummary>Show model answer 2</AccordionSummary>
            <p><strong>Recommend:</strong> {doc.bestPractices[0]}</p>
            <p><strong>Flag:</strong> {doc.commonGotchas[0]}</p>
          </details>
        </div>
      </section>
    </div>
  </article>;
}
