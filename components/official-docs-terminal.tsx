"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import type { DocsProject } from "@/lib/official-docs-projects";
import styles from "./official-docs-cards.module.css";

export function OfficialDocsTerminal({ project, commandLabel = "command" }: { project: DocsProject; commandLabel?: string }) {
  const [copied, setCopied] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  return <div className={styles.terminalWindow}>
    <div className={styles.windowBar}><span className={styles.trafficLights} aria-hidden="true"><i /><i /><i /></span><Terminal size={14} aria-hidden="true" /> Terminal</div>
    <ol className={styles.commands}>{project.commands.map((item, index) => <li key={`${index}-${item.command}`}>
      <p><strong>{item.description}</strong></p>
      <div className={styles.commandRow}>
        <pre tabIndex={0}><code>{item.command}</code></pre>
        <button type="button" aria-label={`Copy ${commandLabel} ${index + 1}`} onClick={async () => {
          try { await navigator.clipboard.writeText(item.command); setCopied(index); setFailed(false); }
          catch { setCopied(null); setFailed(true); }
        }}>{copied === index ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied === index ? "Copied" : "Copy"}</button>
      </div>
    </li>)}</ol>
    {(failed || copied !== null) && <p className={styles.copyStatus} role="status">{failed ? "Copy unavailable. Select and copy the command manually." : `Command ${(copied ?? 0) + 1} copied.`}</p>}
  </div>;
}
