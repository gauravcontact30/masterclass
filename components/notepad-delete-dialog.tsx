"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, FileText, GitBranch, Image as ImageIcon, Table2, Trash2, X } from "lucide-react";
import { documentText, type NotepadFile } from "@/lib/notepad-library";
import styles from "./super-admin-notepad.module.css";

/**
 * Confirms deleting a My documents file: what is being deleted (name, type, last edit, size and contents), that it
 * cannot be recovered, and two clear choices. Focus starts on Cancel, Escape or a click outside cancels, and Tab
 * stays inside the dialog.
 */
export function NotepadDeleteDialog({ file, onCancel, onConfirm }: { file: NotepadFile; onCancel: () => void; onConfirm: () => void }) {
  const cancel = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const title = file.title || "Untitled document";
  const words = documentText(file.html).split(/\s+/).filter(Boolean).length;
  const extras = [
    /<img\b/i.test(file.html) && { icon: ImageIcon, label: "Images" },
    /<table\b/i.test(file.html) && { icon: Table2, label: "Tables" },
    file.html.includes("data-notepad-diagram") && { icon: GitBranch, label: "Diagrams" },
  ].filter(Boolean) as { icon: typeof ImageIcon; label: string }[];

  useEffect(() => {
    cancel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onCancel(); return; }
      if (event.key !== "Tab" || !box.current) return;
      const buttons = [...box.current.querySelectorAll<HTMLButtonElement>("button")];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return <div className={styles.deleteConfirmOverlay} onClick={onCancel}>
    <div ref={box} className={styles.deleteConfirmBox} role="alertdialog" aria-modal="true" aria-labelledby="notepad-delete-title" aria-describedby="notepad-delete-warning" onClick={event => event.stopPropagation()}>
      <header className={styles.deleteHead}>
        <span className={styles.deleteBadge} aria-hidden="true"><Trash2 size={22} /></span>
        <div>
          <h2 id="notepad-delete-title">Delete this document?</h2>
          <p>It will be removed from My documents in this browser.</p>
        </div>
        <button type="button" className={styles.deleteClose} onClick={onCancel} aria-label="Close"><X size={16} /></button>
      </header>

      <div className={styles.deleteDoc}>
        <span className={styles.deleteDocIcon} aria-hidden="true"><FileText size={18} /></span>
        <div className={styles.deleteDocText}>
          <b>{title}</b>
          <small>{file.kind} · edited {new Date(file.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })} · {words.toLocaleString("en-IN")} {words === 1 ? "word" : "words"}</small>
          {extras.length > 0 && <span className={styles.deleteDocTags}>{extras.map(({ icon: Icon, label }) => <span key={label}><Icon size={12} aria-hidden="true" />{label}</span>)}</span>}
        </div>
      </div>

      <p id="notepad-delete-warning" className={styles.deleteWarning}>
        <AlertTriangle size={16} aria-hidden="true" />
        <span>This can’t be undone. Download it first if you may need it again.</span>
      </p>

      <footer className={styles.deleteActions}>
        <button ref={cancel} type="button" className={styles.deleteCancelBtn} onClick={onCancel}>Keep document</button>
        <button type="button" className={styles.deleteConfirmBtn} onClick={onConfirm}><Trash2 size={15} aria-hidden="true" />Delete permanently</button>
      </footer>
    </div>
  </div>;
}
