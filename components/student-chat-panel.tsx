"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, BookOpen, Check, Code2, Copy, GraduationCap, Moon, Play, RefreshCw, RotateCcw, Square, Sun, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { chatHistory, type StudyChatEvent, type StudyChatReply, type StudyChatRequest } from "@/lib/study-chat";
import { runJavaScriptPuzzle, type PuzzleResult } from "@/lib/javascript-sandbox";
import { useLanguage } from "./language-provider";
import type { StudyBuddyRequest } from "@/lib/study-buddy-bridge";
import styles from "./student-chatbot.module.css";

type Mode = StudyChatRequest["mode"];
type Message = { role: "user" | "assistant"; content: string; sources?: StudyChatReply["sources"]; notes?: boolean; streaming?: boolean };
const starter = 'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");';
const suggestions: Record<Mode, string[]> = {
  study: ["Summarize JavaScript closures", "Explain SQL joins with an example", "Help me plan a week of exam revision"],
  interview: ["How should I explain the event loop in an interview?", "What is the difference between an interface and a type alias?", "Ask me a React interview question"],
  javascript: ["Explain the difference between == and ===", "Give me a closure puzzle to solve"],
};
/** One-click follow-ups under the latest answer: each sends a short request about the answer above it. */
const FOLLOW_UPS: [label: string, prompt: string][] = [
  ["Simpler", "Explain that again more simply, as if I am new to the topic."],
  ["Example", "Give me one more worked example of that."],
  ["Quiz me", "Quiz me on that: ask three short questions one at a time, wait for my answer to each, then tell me what I got right."],
  ["Interview angle", "How would an interviewer ask about that, and what is a strong answer?"],
  ["हिंदी में", "Explain that in simple Hindi."],
];
const STORE = "study-buddy:v1";
const MAX_KEPT = 40;
/** The first piece of a reply must arrive within this; the whole reply within REPLY_MS. */
const FIRST_BYTE_MS = 25000, REPLY_MS = 60000;
const ERRORS: Record<string, string> = {
  rate_limited: "You are asking quickly. Wait a minute, then try again.",
  tutor_unavailable: "Study Buddy is unavailable right now. Please try again shortly.",
  reply_interrupted: "The reply stopped partway. Retry to get the full answer.",
  request_too_large: "That conversation is too long. Start a new one.",
};

/** Inline marks: **bold** and `code`. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith("`") && part.endsWith("`") && part.length > 2 ? <code key={index}>{part.slice(1, -1)}</code> : part);
}
/** Paragraphs, headings and bulleted or numbered lists from the tutor's plain Markdown. */
function Prose({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => { if (list) { const List = list.ordered ? "ol" : "ul"; blocks.push(<List key={blocks.length}>{list.items.map((item, i) => <li key={i}>{inline(item)}</li>)}</List>); list = null; } };
  for (const line of text.split("\n")) {
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line), numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line), heading = /^\s*#{1,4}\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    flush();
    if (heading) blocks.push(<h4 key={blocks.length}>{inline(heading[1])}</h4>);
    else if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  }
  flush();
  return <div className={styles.prose}>{blocks}</div>;
}
function Answer({ text, loadCode }: { text: string; loadCode: (code: string) => void }) {
  // An unfinished fence while streaming is closed for display, so code renders as code from its first line.
  const parts = (text.split("```").length % 2 === 0 ? `${text}\n\`\`\`` : text).split(/```([^\n`]*)\n([\s\S]*?)```/g);
  return <>{parts.map((part, index) => {
    if (index % 3 === 1) return null;
    if (index % 3 === 2) return <div className={styles.codeBlock} key={index}><pre><code>{part}</code></pre>{/^(javascript|js|mjs|ecmascript)?$/i.test(parts[index - 1].trim()) && <button onClick={() => loadCode(part)}>Open in JavaScript lab</button>}</div>;
    return part.trim() ? <Prose key={index} text={part} /> : <Fragment key={index} />;
  })}</>;
}

function restore(): { mode: Mode; messages: Message[] } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) ?? "null") as { mode?: Mode; messages?: Message[] } | null;
    if (!saved || !Array.isArray(saved.messages)) return null;
    const messages = saved.messages.filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content).map(m => ({ ...m, streaming: false }));
    return { mode: saved.mode && saved.mode in suggestions ? saved.mode : "study", messages };
  } catch { return null; }
}

const THEME_KEY = "masterclass:study-buddy-theme";
type Theme = "light" | "dark";
/** The visitor's last choice, else the system's light or dark setting. The panel only renders in the browser. */
function initialTheme(): Theme {
  try { const saved = localStorage.getItem(THEME_KEY); if (saved === "light" || saved === "dark") return saved; } catch { /* storage blocked */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function StudentChatPanel({ open, onOpenChange, prompt }: { open: boolean; onOpenChange: (open: boolean) => void; prompt?: (StudyBuddyRequest & { id: number }) | null }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  // The conversation survives closing the panel and reloading the page (this browser only). The panel is client-only
  // (next/dynamic with ssr: false), so storage can be read while initialising.
  const [saved] = useState(restore);
  const [mode, setMode] = useState<Mode>(saved?.mode ?? "study");
  const [messages, setMessages] = useState<Message[]>(saved?.messages ?? []);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const toggleTheme = () => setTheme(current => { const next = current === "dark" ? "light" : "dark"; try { localStorage.setItem(THEME_KEY, next); } catch { /* the choice lasts this visit */ } return next; });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [code, setCode] = useState(starter);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const stopRun = useRef<(() => void) | null>(null);
  const transcript = useRef<HTMLDivElement | null>(null);
  const composer = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (messages.some(m => m.streaming)) return;
    try {
      if (messages.length) localStorage.setItem(STORE, JSON.stringify({ mode, messages: messages.slice(-MAX_KEPT) }));
      else localStorage.removeItem(STORE);
    } catch { /* storage full or blocked */ }
  }, [messages, mode]);
  useEffect(() => () => { requestRef.current?.abort("closed"); stopRun.current?.(); }, []);
  useEffect(() => { if (!open) { requestRef.current?.abort("closed"); stopRun.current?.(); } }, [open]);
  useEffect(() => { const box = transcript.current; if (box) box.scrollTop = box.scrollHeight; }, [messages, error]);
  // A question handed over from elsewhere on the page (askStudyBuddy) is asked once, in its mode.
  const handled = useRef<number | null>(null);
  useEffect(() => {
    if (!prompt?.question || handled.current === prompt.id) return;
    handled.current = prompt.id;
    const nextMode = prompt.mode ?? mode;
    queueMicrotask(() => { setMode(nextMode); void ask(prompt.question!, nextMode); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per handed-over prompt only.
  }, [prompt]);

  /** Sends `content` after `base` (the conversation so far) and streams the answer into a new assistant message. */
  async function ask(content: string, selectedMode = mode, base = messages) {
    const question = content.trim();
    if (!question || question.length > 6000 || requestRef.current) return;
    const controller = new AbortController(); requestRef.current = controller;
    setError(""); setDraft(""); setBusy(true);
    const history = chatHistory([...base.map(({ role, content }) => ({ role, content })), { role: "user", content: question }]);
    const asked: Message[] = [...base, { role: "user", content: question }, { role: "assistant", content: "", streaming: true }];
    setMessages(asked.slice(-MAX_KEPT));
    const update = (change: (message: Message) => Message) => setMessages(previous => previous.map((m, i) => i === previous.length - 1 && m.role === "assistant" ? change(m) : m));
    let firstByte = setTimeout(() => controller.abort("timeout"), FIRST_BYTE_MS);
    const whole = setTimeout(() => controller.abort("timeout"), REPLY_MS);
    try {
      const response = await fetch("/api/study-chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ mode: selectedMode, messages: history, stream: true, language, page: pathname ? { path: pathname, title: document.title.slice(0, 160) } : undefined }),
      });
      if (!response.ok || !response.body) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? "service_error"); }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "", finished = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        clearTimeout(firstByte); firstByte = setTimeout(() => controller.abort("timeout"), FIRST_BYTE_MS);
        buffer += value;
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StudyChatEvent;
          if (event.type === "meta") update(m => ({ ...m, sources: event.sources }));
          else if (event.type === "delta") update(m => ({ ...m, content: m.content + event.text }));
          else if (event.type === "done") { finished = true; update(m => ({ ...m, content: event.answer, notes: event.mode === "notes", streaming: false })); }
          else if (event.type === "error") throw new Error(event.error);
        }
      }
      if (!finished) throw new Error("reply_interrupted");
    } catch (failure) {
      const reason = controller.signal.aborted ? controller.signal.reason : failure instanceof Error ? failure.message : "service_error";
      // Stop keeps whatever was written; a failure with nothing written removes the empty answer.
      setMessages(previous => {
        const last = previous.at(-1);
        if (last?.role === "assistant" && !last.content.trim()) return previous.slice(0, -1);
        return previous.map((m, i) => i === previous.length - 1 ? { ...m, streaming: false } : m);
      });
      if (reason !== "stopped" && reason !== "closed") setError(reason === "timeout" ? "The reply took too long. Please retry." : ERRORS[String(reason)] ?? "Could not connect. Please try again.");
    } finally {
      clearTimeout(firstByte); clearTimeout(whole); requestRef.current = null; setBusy(false);
    }
  }
  function submit(event: FormEvent) { event.preventDefault(); void ask(draft); }
  /** Asks the last question again, replacing its answer. */
  function regenerate() {
    const lastUser = messages.findLastIndex(m => m.role === "user");
    if (lastUser < 0 || busy) return;
    void ask(messages[lastUser].content, mode, messages.slice(0, lastUser));
  }
  function retry() {
    const last = messages.at(-1);
    if (last?.role === "user") void ask(last.content, mode, messages.slice(0, -1));
    else regenerate();
  }
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(messages[index].content); setCopied(index); setTimeout(() => setCopied(c => c === index ? null : c), 1500); } catch { /* clipboard blocked */ }
  }
  function run() {
    if (running) return;
    setOutput([]); setResult(null); setRunning(true);
    stopRun.current = runJavaScriptPuzzle(code, line => setOutput(previous => [...previous, line]), finished => {
      setResult(finished); setOutput(finished.output); setRunning(false); stopRun.current = null;
    });
  }
  function reset() {
    if (busy || running) return;
    setMessages([]); setDraft(""); setError(""); setOutput([]); setResult(null); composer.current?.focus();
    try { localStorage.removeItem(STORE); } catch { /* blocked */ }
  }
  const onPage = pathname && pathname !== "/" ? [`Explain the key ideas on this page`] : [];
  const lastAnswer = messages.findLastIndex(m => m.role === "assistant");

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={styles.panel} data-theme={theme} showCloseButton={false}>
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">✻</span>
        <div><DialogTitle className={styles.title}>Study Buddy</DialogTitle><DialogDescription className={styles.subtitle}>Your space to ask, learn and practice.</DialogDescription></div>
        <button aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={toggleTheme}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button aria-label="Start a new conversation" title="New conversation" disabled={busy || running} onClick={reset}><RotateCcw size={17} /></button>
        <button aria-label="Close Study Buddy" onClick={() => onOpenChange(false)}><X size={20} /></button>
      </header>
      <div className={styles.modes} aria-label="Choose study mode">
        {([ ["study", "Study help", BookOpen], ["interview", "Interview prep", GraduationCap], ["javascript", "JavaScript lab", Code2] ] as const).map(([value, label, Icon]) => <button key={value} aria-pressed={mode === value} onClick={() => { setMode(value); stopRun.current?.(); }}><Icon size={15} />{label}</button>)}
      </div>
      <div className={styles.body} ref={transcript}>
        {messages.length === 0 && <section className={styles.welcome}>
          <span className={styles.eyebrow}>A LITTLE CLARITY GOES A LONG WAY</span>
          <h3>{mode === "interview" ? "Walk into your next interview prepared." : mode === "javascript" ? "Predict it. Run it. Understand it." : "What are you learning today?"}</h3>
          <p>Get a clear summary, work through a tricky concept, or practice an answer out loud. Answers appear as they are written.</p>
          <div className={styles.suggestions}>{[...onPage, ...suggestions[mode]].map(question => <button key={question} disabled={busy} onClick={() => void ask(question)}>{question}<ArrowUp size={14} /></button>)}</div>
        </section>}
        <div role="log" aria-label="Study conversation" aria-live="polite" aria-relevant="additions" aria-busy={busy} className={styles.messages}>
          {messages.map((message, index) => message.role === "user"
            ? <article key={index} className={styles.userMessage} aria-label="Your question"><span className={styles.messageLabel}>You</span><div className={styles.prose}><p>{message.content}</p></div></article>
            : <article key={index} className={styles.answer} aria-label="Study Buddy answer">
              <span className={styles.messageLabel}>Study Buddy{message.notes && <small className={styles.badge}>from the app’s notes</small>}</span>
              {message.content ? <Answer text={message.content} loadCode={snippet => { setMode("javascript"); setCode(snippet.slice(0, 12000)); setOutput([]); setResult(null); }} /> : <p role="status" className={styles.thinking}>Working through your question…</p>}
              {message.streaming && message.content && <span className={styles.cursor} aria-hidden="true" />}
              {!message.streaming && message.sources?.length ? <div className={styles.sources}><span>Related app notes</span>{message.sources.map(source => <Link key={source.href} href={source.href} onClick={() => onOpenChange(false)}>{source.title}</Link>)}</div> : null}
              {!message.streaming && message.content && <div className={styles.answerActions}>
                <button type="button" onClick={() => void copy(index)} aria-label="Copy answer">{copied === index ? <Check size={13} /> : <Copy size={13} />}{copied === index ? "Copied" : "Copy"}</button>
                {index === lastAnswer && <button type="button" onClick={regenerate} disabled={busy} aria-label="Regenerate answer"><RefreshCw size={13} />Regenerate</button>}
              </div>}
              {index === lastAnswer && !message.streaming && message.content && !busy && <div className={styles.followUps} role="group" aria-label="Follow up on this answer">
                {FOLLOW_UPS.map(([label, prompt]) => <button key={label} type="button" onClick={() => void ask(prompt)}>{label}</button>)}
              </div>}
            </article>)}
        </div>
        {error && <div role="alert" className={styles.error}>{error}{!busy && messages.length > 0 && <button type="button" onClick={retry}>Retry</button>}</div>}
        {mode === "javascript" && <section className={styles.lab} aria-label="JavaScript puzzle lab">
          <div className={styles.labHeading}><Code2 size={17} /><h3>JavaScript puzzle lab</h3></div>
          <p>Standalone JavaScript, promises and timers. No DOM, network or Node modules. Runs stop after 3 seconds.</p>
          <Label htmlFor="study-puzzle-code">Your code</Label>
          <Textarea id="study-puzzle-code" value={code} onChange={event => setCode(event.target.value)} maxLength={12000} rows={7} spellCheck={false} disabled={running} />
          <div className={styles.labActions}><button onClick={run} disabled={running || !code.trim()}><Play size={14} />Run JavaScript</button>{running && <button onClick={() => stopRun.current?.()}><Square size={14} />Stop run</button>}</div>
          <div className={styles.output} aria-label="JavaScript console output"><span role="status">{running ? "Running…" : result ? ({ complete: "Run complete", error: "Run failed", timeout: "Stopped: 3-second time limit", stopped: "Run stopped" })[result.status] : "Console output"}</span><pre>{output.join("\n") || (result ? "No console output. Use console.log() to inspect a value." : "Your results will appear here.")}</pre></div>
          {result && <button className={styles.explain} disabled={busy} onClick={() => void ask(`Explain this JavaScript puzzle and its observed sandbox output. The run status was ${result.status}. ${code.length > 4000 ? "Code excerpt (truncated):" : "Code:"}\n\`\`\`javascript\n${code.slice(0, 4000)}\n\`\`\`\nObserved output (possibly truncated):\n${output.join("\n").slice(0, 1200) || "No output"}`, "javascript")}>Help me understand this result</button>}
        </section>}
      </div>
      <form className={styles.composer} onSubmit={submit}>
        <Label className={styles.composerLabel} htmlFor="study-chat-question">Ask a study question</Label>
        <div className={styles.inputRow}><Textarea id="study-chat-question" ref={composer} placeholder={mode === "interview" ? "Ask an interview question…" : "Ask about a topic, an assignment or a puzzle…"} value={draft} onChange={event => setDraft(event.target.value)} maxLength={6000} rows={2} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void ask(draft); } }} />
          {busy ? <Button type="button" aria-label="Stop reply" onClick={() => requestRef.current?.abort("stopped")}><Square size={18} /></Button> : <Button type="submit" aria-label="Send question" disabled={!draft.trim()}><ArrowUp size={20} /></Button>}
        </div>
        <p>Study Buddy can make mistakes. Check important facts against your course material.</p>
      </form>
    </DialogContent>
  </Dialog>;
}
