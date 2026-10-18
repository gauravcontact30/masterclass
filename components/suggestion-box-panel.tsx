"use client";
import { useState, type FormEvent, type RefObject } from "react";
import { Accessibility, BookOpen, Bug, CheckCircle2, Copy, Ellipsis, Lightbulb, MessageSquarePlus, Search, Send, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { SUGGESTION_CATEGORIES, suggestionError, suggestionLabel, type Suggestion, type SuggestionCategory, type SuggestionUpdate } from "@/lib/suggestions";
import { suggestionRequest, SuggestionHistory } from "./suggestion-shared";
import styles from "./suggestion-box.module.css";

export const CATEGORY_ICONS: Record<SuggestionCategory, LucideIcon> = { feature: Lightbulb, content: BookOpen, bug: Bug, accessibility: Accessibility, other: Ellipsis };

/** The guest-facing Suggestion Box dialog: share an idea, or track one with its private code. */
export default function SuggestionBoxPanel({ open, onOpenChange, returnFocus }: { open: boolean; onOpenChange: (open: boolean) => void; returnFocus?: RefObject<HTMLElement | null> }) {
  const [mode, setMode] = useState<"write" | "track">("write");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [receipt, setReceipt] = useState("");
  const [copied, setCopied] = useState(false);
  const [length, setLength] = useState(0);
  const [result, setResult] = useState<{ suggestion: Suggestion; updates: SuggestionUpdate[] } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    setBusy(true); setError("");
    try {
      const data = await suggestionRequest<{ trackingCode: string }>("/api/suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      setReceipt(data.trackingCode); setCode(data.trackingCode); form.reset(); setLength(0);
    } catch (e) { setError(suggestionError(e instanceof Error ? e.message : "")); }
    finally { setBusy(false); }
  }
  async function lookup(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(""); setResult(null);
    try { setResult(await suggestionRequest("/api/suggestions", { headers: { Authorization: `Bearer ${code.trim()}` } })); }
    catch (e) { setError(suggestionError(e instanceof Error ? e.message : "")); }
    finally { setBusy(false); }
  }
  const switchTo = (next: "write" | "track") => { setMode(next); setError(""); };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={styles.modal} finalFocus={returnFocus}>
      <DialogHeader className={styles.header}>
        <span className={styles.headerMark} aria-hidden="true"><MessageSquarePlus size={22} /></span>
        <DialogTitle className={styles.title}>Suggestion Box</DialogTitle>
        <DialogDescription className={styles.lede}>Help shape your learning experience. Everyone is welcome to contribute, no account needed.</DialogDescription>
      </DialogHeader>
      <div className={styles.tabs} role="group" aria-label="Suggestion Box mode">
        <button type="button" aria-pressed={mode === "write"} onClick={() => switchTo("write")}><Send size={14} aria-hidden="true" />Share an idea</button>
        <button type="button" aria-pressed={mode === "track"} onClick={() => switchTo("track")}><Search size={14} aria-hidden="true" />Track a suggestion</button>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {mode === "write" && (receipt ? <div className={styles.receipt}><CheckCircle2 className={styles.receiptIcon} size={28} aria-hidden="true" /><h3>Your suggestion is in the inbox.</h3><p>Save this private tracking code. Use “Track a suggestion” to see progress and replies. Anyone with this code can read your suggestion.</p><Input aria-label="Private tracking code" readOnly value={receipt} onFocus={e => e.currentTarget.select()} /><div className={styles.actions}><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(receipt); setCopied(true); } catch { setError("Select and copy the tracking code manually."); } }}><Copy size={14} />{copied ? "Copied" : "Copy code"}</Button><Button onClick={() => switchTo("track")}>Check progress</Button><Button variant="ghost" onClick={() => { setReceipt(""); setCopied(false); }}>Another suggestion</Button></div></div> :
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.twoColumns}><label>Your name<Input name="name" autoComplete="name" required maxLength={80} /></label><label>Email (optional)<Input name="email" type="email" autoComplete="email" maxLength={254} /></label></div>
          <fieldset className={styles.categories}><legend>Category</legend><div>
            {SUGGESTION_CATEGORIES.map((value, index) => { const Icon = CATEGORY_ICONS[value]; return <label key={value} data-category={value}><input type="radio" name="category" value={value} defaultChecked={index === 0} /><Icon size={15} aria-hidden="true" /><span>{suggestionLabel(value)}</span></label>; })}
          </div></fieldset>
          <label>Suggestion title<Input name="title" required minLength={5} maxLength={140} placeholder="What would you like to improve?" /></label>
          <div className={styles.field}><label>Your suggestion<Textarea name="body" required minLength={20} maxLength={5000} rows={5} aria-describedby="suggestion-body-count" onChange={e => setLength(e.target.value.trim().length)} placeholder="Tell us what would help, why it matters, and any examples." /></label><span id="suggestion-body-count" className={styles.counter} data-short={(length > 0 && length < 20) || undefined}>{length < 20 ? `${length} / 20 characters minimum` : `${length.toLocaleString()} / 5,000`}</span></div>
          <div className={styles.honeypot} aria-hidden="true"><label>Website<Input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <p className={styles.hint}>Only the admin team sees your contact details. Replies appear here using your private tracking code; email notifications are not sent.</p>
          <Button type="submit" className={styles.submit} disabled={busy}><Send size={15} />{busy ? "Submitting…" : "Submit suggestion"}</Button>
        </form>)}
      {mode === "track" && <><form onSubmit={lookup} className={styles.form}><label>Private tracking code<Input value={code} onChange={e => setCode(e.target.value)} required maxLength={101} autoComplete="off" placeholder="Paste the code saved after submitting" /></label><Button type="submit" className={styles.submit} disabled={busy || !code.trim()}><Search size={15} />{busy ? "Checking…" : "View progress & replies"}</Button></form>
        {result && <section className={styles.receipt}><span className={styles.status} data-status={result.suggestion.status}>{suggestionLabel(result.suggestion.status)}</span><h3>{result.suggestion.title}</h3><p>{result.suggestion.body}</p><SuggestionHistory updates={result.updates} />{!result.updates.length && <p>Your suggestion is awaiting review. Check back here for updates.</p>}</section>}
      </>}
    </DialogContent>
  </Dialog>;
}
