"use client";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Copy, MessageSquarePlus, Search, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { SUGGESTION_CATEGORIES, suggestionError, suggestionLabel, type Suggestion, type SuggestionUpdate } from "@/lib/suggestions";
import styles from "./suggestion-box.module.css";

export async function suggestionRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "service_error");
  return body;
}
export function SuggestionHistory({ updates }: { updates: SuggestionUpdate[] }) {
  return <ol className={styles.history}>{updates.map(update => <li key={update.id}><div><strong>{suggestionLabel(update.status)}</strong><time>{new Date(update.created_at).toLocaleString()}</time></div>{update.reply && <p>{update.reply}</p>}</li>)}</ol>;
}

export function SuggestionBox() {
  const [mode, setMode] = useState<"write" | "track">("write");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [receipt, setReceipt] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ suggestion: Suggestion; updates: SuggestionUpdate[] } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    setBusy(true); setError("");
    try {
      const data = await suggestionRequest<{ trackingCode: string }>("/api/suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      setReceipt(data.trackingCode); setCode(data.trackingCode); form.reset();
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
  return <Dialog><DialogTrigger className={styles.trigger}><MessageSquarePlus size={17} aria-hidden="true" /><span>Suggestion Box</span></DialogTrigger>
    <DialogContent className={styles.modal}>
      <DialogHeader><DialogTitle className={styles.title}><MessageSquarePlus size={23} />Suggestion Box</DialogTitle><DialogDescription>Help shape your learning experience. Everyone is welcome to contribute, no account needed.</DialogDescription></DialogHeader>
      <div className={styles.tabs}><Button variant={mode === "write" ? "default" : "outline"} onClick={() => { setMode("write"); setError(""); }}>Share an idea</Button><Button variant={mode === "track" ? "default" : "outline"} onClick={() => { setMode("track"); setError(""); }}><Search size={14} />Track a suggestion</Button></div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {mode === "write" && (receipt ? <div className={styles.receipt}><CheckCircle2 size={28} /><h3>Your suggestion is in the inbox.</h3><p>Save this private tracking code. Use “Track a suggestion” to see progress and replies. Anyone with this code can read your suggestion.</p><Input aria-label="Private tracking code" readOnly value={receipt} /><div className={styles.actions}><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(receipt); setCopied(true); } catch { setError("Select and copy the tracking code manually."); } }}><Copy size={14} />{copied ? "Copied" : "Copy code"}</Button><Button onClick={() => setMode("track")}>Check progress</Button><Button variant="ghost" onClick={() => { setReceipt(""); setCopied(false); }}>Another suggestion</Button></div></div> :
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.twoColumns}><label>Your name<Input name="name" autoComplete="name" required maxLength={80} /></label><label>Email (optional)<Input name="email" type="email" autoComplete="email" maxLength={254} /></label></div>
          <label>Category<select name="category">{SUGGESTION_CATEGORIES.map(value => <option key={value} value={value}>{suggestionLabel(value)}</option>)}</select></label>
          <label>Suggestion title<Input name="title" required minLength={5} maxLength={140} placeholder="What would you like to improve?" /></label>
          <label>Your suggestion<Textarea name="body" required minLength={20} maxLength={5000} rows={5} placeholder="Tell us what would help, why it matters, and any examples. (20–5,000 characters)" /></label>
          <div className={styles.honeypot} aria-hidden="true"><label>Website<Input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <p className={styles.hint}>Only the admin team sees your contact details. Replies appear here using your private tracking code; email notifications are not sent.</p>
          <Button type="submit" disabled={busy}><Send size={15} />{busy ? "Submitting…" : "Submit suggestion"}</Button>
        </form>)}
      {mode === "track" && <><form onSubmit={lookup} className={styles.form}><label>Private tracking code<Input value={code} onChange={e => setCode(e.target.value)} required maxLength={101} autoComplete="off" placeholder="Paste the code saved after submitting" /></label><Button type="submit" disabled={busy || !code.trim()}><Search size={15} />{busy ? "Checking…" : "View progress & replies"}</Button></form>
        {result && <section className={styles.receipt}><span className={styles.status}>{suggestionLabel(result.suggestion.status)}</span><h3>{result.suggestion.title}</h3><p>{result.suggestion.body}</p><SuggestionHistory updates={result.updates} />{!result.updates.length && <p>Your suggestion is awaiting review. Check back here for updates.</p>}</section>}
      </>}
    </DialogContent>
  </Dialog>;
}
