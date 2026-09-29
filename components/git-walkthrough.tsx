"use client";

import type { SearchAnswer } from "@/lib/pro-learn/types";
import { splitCommands } from "@/lib/terminal-commands";
import { TerminalBlock } from "./terminal-block";
import { CodeFiles } from "./code-files";
import styles from "./git-walkthrough.module.css";

/** The same complete lesson is used on the catalogue card and in Explain this. */
export function GitWalkthrough({ answer, embedded = false }: { answer: SearchAnswer; embedded?: boolean }) {
  const [syntax, ...steps] = answer.steps;
  return <section className={styles.lesson} data-embedded={embedded || undefined} aria-label={`${answer.headline} walkthrough`}>
    <h4>Scenario</h4>
    {answer.useCases.map(use => <div key={use.title}><strong>{use.title}</strong><p>{use.scenario}</p></div>)}
    <div className={styles.setup}>
      <strong>Before you start</strong>
      <ul>
        <li>Run these examples in Git Bash on Windows, or a macOS/Linux shell with Git installed.</li>
        <li>Use a practice repository and the files, branches and commits named in each step.</li>
        <li>Replace sample URLs, identities and commit hashes with your own.</li>
        <li>Alternative commands are choices, not a script to run all at once.</li>
      </ul>
    </div>
    {syntax && <>
      <h4>Syntax</h4><p>{syntax.detail} These forms describe the command; use the concrete examples below when running it.</p>
      <TerminalBlock title="Git syntax reference" lines={syntax.code.split("\n")} />
    </>}
    <h4>Example</h4>
    <p>Step by step: copy each command into your terminal, run it, and check the result described before continuing.</p>
    <div className={styles.steps}>
      {steps.map((step, index) => <section key={`${index}-${step.title}`} className={styles.step}>
        <h5><span>{index + 1}</span>{step.title}</h5>
        <p>{step.detail}</p>
        {step.code && (splitCommands(step.code).some(segment => segment.kind === "shell")
          ? <TerminalBlock title={`Terminal · Step ${index + 1}`} lines={step.code.split("\n")} />
          : <CodeFiles label="Git editor" files={[{ path: "git-rebase-todo", code: step.code, note: "Edit this file in the editor opened by Git, then save and close it." }]} />)}
      </section>)}
    </div>
    {!!answer.caveats.length && <aside className={styles.caution}><strong>Before you finish</strong>{answer.caveats.map((entry, index) => <p key={index}>{typeof entry === "string" ? entry : entry.text}</p>)}</aside>}
  </section>;
}
