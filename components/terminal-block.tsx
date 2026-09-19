"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { shellTokens } from "@/lib/terminal-commands";
import styles from "./terminal-block.module.css";

const isComment = (line: string) => /^\s*(?:#|\/\/)/.test(line);

/**
 * Commands, shown the way macOS Terminal shows them in its light profile.
 *
 * Each command gets a prompt, but the prompt is not selectable and never
 * copied, so dragging across the block or pressing Copy yields exactly what to
 * paste into a shell. Comments keep their place but lose the prompt, because
 * they are not something to run.
 */
export function TerminalBlock({ lines, title = "Terminal" }: { lines: string[]; title?: string }) {
  const [copied, setCopied] = useState<number | "all" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const commands = lines.filter(line => !isComment(line));

  async function copy(text: string, which: number | "all") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1800);
    } catch { /* Copying is a convenience; the command is on screen either way. */ }
  }

  return <figure className={styles.term} aria-label={title}>
    <figcaption className={styles.bar}>
      <span className={styles.lights} aria-hidden="true"><i /><i /><i /></span>
      <span className={styles.title}>{title}</span>
      <button type="button" className={styles.copyAll} onClick={() => void copy(commands.join("\n"), "all")}
        aria-label={commands.length > 1 ? "Copy all commands" : "Copy command"}>
        {copied === "all" ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
        <span>{copied === "all" ? "Copied" : "Copy"}</span>
      </button>
    </figcaption>
    <div className={styles.screen}>
      {lines.map((line, index) => {
        const comment = isComment(line);
        return <div key={index} className={styles.line} data-comment={comment || undefined}>
          {!comment && <span className={styles.prompt} aria-hidden="true">$</span>}
          <code className={styles.command}>
            {shellTokens(line).map((token, position) => <span key={position} data-tone={token.tone || undefined}>{token.text}</span>)}
          </code>
          {!comment && <button type="button" className={styles.copyLine} onClick={() => void copy(line, index)} aria-label={`Copy ${line}`}>
            {copied === index ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
          </button>}
        </div>;
      })}
    </div>
    <span className={styles.srOnly} role="status" aria-live="polite">{copied === null ? "" : "Copied to clipboard"}</span>
  </figure>;
}
