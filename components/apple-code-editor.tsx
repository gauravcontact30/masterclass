"use client";

import { useState } from "react";
import { Check, Copy, FileCode2, Info, ListTree, Code2 } from "lucide-react";
import { useLanguage } from "./language-provider";
import { resolveCodeExample, type CodeLine, type CodeExample } from "@/lib/dashboard-code-examples";
import styles from "./apple-code-editor.module.css";
import { isCodeExampleTab } from "@/lib/code-example-tabs";
import { codeLineNotes } from "@/lib/code-line-notes";
import { CodeLineComment } from "./code-line-comment";

export type AppleCodeEditorProps = {
  category?: string;
  tab?: string;
};

export function AppleCodeEditor({ category, tab }: AppleCodeEditorProps) {
  const { language } = useLanguage();
  const hi = language === "hi";

  const example: CodeExample = resolveCodeExample(category, tab);
  const notes = codeLineNotes(example.lines.map(line => line.code).join("\n"), example.filename);

  const [copied, setCopied] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"ide" | "guide">("ide");

  async function handleCopy() {
    try {
      const fullText = example.lines.map(l => l.code).join("\n");
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access error
    }
  }

  const activeLineData = example.lines.find(l => l.lineNum === selectedLine) || example.lines[0];

  return (
    <section className={styles.wrapper} aria-label={hi ? "कोड उदाहरण और समझ" : "Code Example and Line-by-Line Understanding"}>
      <div className={styles.ideContainer}>
        {/* Apple Window Chrome / Titlebar */}
        <div className={styles.windowBar}>
          {/* Traffic Lights */}
          <div className={styles.trafficLights} aria-hidden="true">
            <span className={styles.lightRed} />
            <span className={styles.lightYellow} />
            <span className={styles.lightGreen} />
          </div>

          {/* Active File Tab */}
          {isCodeExampleTab(example.filename) && <div className={styles.activeTab} title={example.filename}>
            <FileCode2 size={14} className={styles.tabIcon} aria-hidden="true" />
            <span>{example.filename}</span>
          </div>}

          {/* Window Actions */}
          <div className={styles.windowActions}>
            <span className={styles.langPill}>{example.language}</span>

            <button
              type="button"
              className={styles.modeToggleBtn}
              onClick={() => setViewMode(prev => prev === "ide" ? "guide" : "ide")}
              title={viewMode === "ide" ? (hi ? "विस्तृत लाइन-बाय-लाइन गाइड देखें" : "Switch to Line-by-Line Guide") : (hi ? "आईडीई व्यू पर वापस जाएं" : "Switch to IDE View")}
            >
              {viewMode === "ide" ? <ListTree size={13} aria-hidden="true" /> : <Code2 size={13} aria-hidden="true" />}
              <span>{viewMode === "ide" ? (hi ? "लाइन गाइड" : "Line Guide") : (hi ? "आईडीई व्यू" : "IDE View")}</span>
            </button>

            <button
              type="button"
              className={styles.copyBtn}
              data-copied={copied ? "true" : undefined}
              onClick={handleCopy}
              aria-label={copied ? (hi ? "कॉपी हो गया" : "Code copied") : (hi ? "कोड कॉपी करें" : "Copy code")}
            >
              {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              <span>{copied ? (hi ? "कॉपी हुआ!" : "Copied!") : (hi ? "कॉपी करें" : "Copy")}</span>
            </button>
          </div>
        </div>

        {/* Editor Body */}
        {viewMode === "ide" ? (
          <div className={styles.editorBody}>
            <table className={styles.codeTable} role="presentation">
              <tbody>
                {example.lines.map((line: CodeLine, index) => {
                  const isSelected = line.lineNum === selectedLine;
                  return (
                    <tr
                      key={line.lineNum}
                      className={styles.codeRow}
                      data-selected={isSelected ? "true" : undefined}
                      onClick={() => setSelectedLine(line.lineNum)}
                      title={hi ? `लाइन ${line.lineNum} का विवरण देखें` : `Inspect line ${line.lineNum} explanation`}
                    >
                      <td className={styles.lineNum}>{String(line.lineNum).padStart(2, "0")}</td>
                      <td className={styles.lineCode}>
                        <CodeSyntaxFormatter code={line.code} />
                        <CodeLineComment note={notes[index] ? line.comment[language] || notes[index] : null} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.breakdownList}>
            {example.lines.map((line: CodeLine, index) => (
              <div key={line.lineNum} className={styles.breakdownItem}>
                <span className={styles.breakdownLineNum}>L{String(line.lineNum).padStart(2, "0")}</span>
                <span className={styles.breakdownCode}>
                  <CodeSyntaxFormatter code={line.code} />
                </span>
                <span className={styles.breakdownExplanation}>
                  {notes[index] ? line.comment[language] || notes[index] : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code-Level Understanding Drawer */}
      {activeLineData && notes[example.lines.indexOf(activeLineData)] && (
        <div className={styles.understandingDrawer} aria-label={hi ? "लाइन-स्तरीय समझ" : "Line-Level Understanding"}>
          <div className={styles.understandingHeader}>
            <div className={styles.understandingTitle}>
              <Info size={15} color="#0366d6" aria-hidden="true" />
              <span>{hi ? "लाइन-स्तरीय समझ (Code-Level Understanding)" : "Line-by-Line Code Understanding"}</span>
            </div>
            <span className={styles.activeLinePill}>
              {hi ? `लाइन ${activeLineData.lineNum} / ${example.lines.length}` : `Line ${activeLineData.lineNum} of ${example.lines.length}`}
            </span>
          </div>

          <div className={styles.activeCodeSnippet}>
            <code>{activeLineData.code}</code>
          </div>

          <p className={styles.explanationText}>
            <strong>{hi ? "व्याख्या: " : "Explanation: "}</strong>
            {activeLineData.comment[language]}
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * Lightweight syntax token formatter separating comments from executable code.
 */
function CodeSyntaxFormatter({ code }: { code: string }) {
  // Check if line contains a comment
  const commentIndex = code.indexOf("//");

  if (commentIndex === -1) {
    return <span>{code}</span>;
  }

  const codePart = code.slice(0, commentIndex);
  const commentPart = code.slice(commentIndex);

  return (
    <>
      <span>{codePart}</span>
      <span className={styles.comment}>{commentPart}</span>
    </>
  );
}
