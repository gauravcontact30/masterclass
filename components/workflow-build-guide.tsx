"use client";

import { useState } from "react";
import { Check, CheckCircle2, ChevronDown, Copy, FileCode2, Terminal } from "lucide-react";
import { getBuildSteps, workflowFolder, type BuildStep, type WorkflowUsecase } from "@/lib/workflow-usecases";
import styles from "./workflow-build-guide.module.css";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={styles.copy}
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
    >
      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function StepBody({ step, index, folder }: { step: BuildStep; index: number; folder: string }) {
  return (
    <div className={styles.body}>
      <p className={styles.explanation}>{step.explanation}</p>
      <div className={styles.codeBlock}>
        <div className={styles.codeBar}>
          {step.file ? <FileCode2 size={13} aria-hidden="true" /> : <Terminal size={13} aria-hidden="true" />}
          <span>{step.file ? `${folder}/${step.file}` : step.language === "bash" ? "Terminal" : "Reference"}</span>
          <CopyButton text={step.code} label={`Copy code for step ${index + 1}`} />
        </div>
        <pre tabIndex={0}>
          <code>{step.code}</code>
        </pre>
      </div>
      {step.run && (
        <div className={styles.run}>
          <span className={styles.runLabel}>Run</span>
          <code>{step.run}</code>
          <CopyButton text={step.run} label={`Copy run command for step ${index + 1}`} />
        </div>
      )}
      <p className={styles.checkpoint}>
        <CheckCircle2 size={15} aria-hidden="true" />
        <span>
          <strong>You should see: </strong>
          {step.checkpoint}
        </span>
      </p>
    </div>
  );
}

/**
 * Ordered, copyable build walkthrough for one workflow. Hand-authored builds
 * show their own steps; older workflows get steps derived from their files.
 */
export function WorkflowBuildGuide({ workflow, headingId }: { workflow: WorkflowUsecase; headingId: string }) {
  const steps = getBuildSteps(workflow);
  const folder = workflowFolder(workflow);
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const allOpen = open.size === steps.length;
  const authored = !!workflow.buildSteps?.length;

  function toggle(index: number) {
    setOpen(previous => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className={styles.guide}>
      <div className={styles.toolbar}>
        <p>
          {steps.length} steps · {workflow.type === "single" ? "single agent" : "multi agent"} ·{" "}
          {authored ? "written as a guided build" : "built from this workflow's files"}
        </p>
        <button
          type="button"
          className={styles.toggleAll}
          onClick={() => setOpen(allOpen ? new Set() : new Set(steps.map((_, index) => index)))}
        >
          {allOpen ? "Collapse all steps" : "Expand all steps"}
        </button>
      </div>
      <ol className={styles.steps} aria-labelledby={headingId}>
        {steps.map((step, index) => {
          const isOpen = open.has(index);
          const panelId = `${folder}-build-step-${index}`;
          return (
            <li key={`${step.title}-${index}`} className={styles.step} data-open={isOpen || undefined}>
              <button
                type="button"
                className={styles.stepHeader}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span className={styles.number} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.titles}>
                  <span className={styles.stepTitle}>
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </span>
                  <span className={styles.goal}>{step.goal}</span>
                </span>
                <span className={styles.layer} data-layer={step.layer}>
                  {step.layer}
                </span>
                <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
              </button>
              <div id={panelId} hidden={!isOpen}>
                {isOpen && <StepBody step={step} index={index} folder={folder} />}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
