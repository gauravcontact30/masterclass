"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUp, BookOpen, Code2, GraduationCap, Play, RotateCcw, Square, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { chatHistory, type StudyChatReply, type StudyChatRequest } from "@/lib/study-chat";
import { runJavaScriptPuzzle, type PuzzleResult } from "@/lib/javascript-sandbox";
import styles from "./student-chatbot.module.css";

type Mode = StudyChatRequest["mode"];
type Message = { role: "user" | "assistant"; content: string; reply?: StudyChatReply };
const starter = 'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");';
const suggestions: Record<Mode, string[]> = {
  study: ["Summarize JavaScript closures", "Explain SQL joins with an example", "Help me plan a week of exam revision"],
  interview: ["How should I explain the event loop in an interview?", "What is the difference between an interface and a type alias?", "Ask me a React interview question"],
  javascript: ["Explain the difference between == and ===", "Give me a closure puzzle to solve"],
};

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith("`") ? <code key={index}>{part.slice(1, -1)}</code> : part);
}
function Answer({ text, loadCode }: { text: string; loadCode: (code: string) => void }) {
  const parts = text.split(/```([^\n`]*)\n([\s\S]*?)```/g);
  return <>{parts.map((part, index) => {
    if (index % 3 === 1) return null;
    if (index % 3 === 2) return <div className={styles.codeBlock} key={index}><pre><code>{part}</code></pre>{/^(javascript|js|mjs|ecmascript)?$/i.test(parts[index - 1].trim()) && <button onClick={() => loadCode(part)}>Open in JavaScript lab</button>}</div>;
    return <div className={styles.prose} key={index}>{inline(part)}</div>;
  })}</>;
}

export default function StudentChatPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [mode, setMode] = useState<Mode>("study");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [code, setCode] = useState(starter);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const stopRun = useRef<(() => void) | null>(null);
  const transcript = useRef<HTMLDivElement | null>(null);
  const composer = useRef<HTMLTextAreaElement | null>(null);
  const busy = Boolean(pending);

  useEffect(() => () => { requestRef.current?.abort(); stopRun.current?.(); }, []);
  useEffect(() => {
    if (!open) { requestRef.current?.abort(); stopRun.current?.(); }
  }, [open]);
  useEffect(() => { if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight; }, [messages, pending, error]);

  async function ask(content: string, selectedMode = mode) {
    const question = content.trim();
    if (!question || question.length > 6000 || requestRef.current) return;
    const controller = new AbortController(); requestRef.current = controller;
    setPending(question); setDraft(""); setError("");
    const history = chatHistory([...messages.map(({ role, content }) => ({ role, content })), { role: "user", content: question }]);
    const timeout = setTimeout(() => controller.abort("timeout"), 30000);
    try {
      const response = await fetch("/api/study-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: selectedMode, messages: history }), signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 429 ? "You’ve reached the message limit. Please try again in a little while." : "Study Buddy couldn’t answer right now. Your question is saved below—please retry.");
      const reply: StudyChatReply = await response.json();
      if (controller.signal.aborted) return;
      if (typeof reply.answer !== "string" || !Array.isArray(reply.sources)) throw new Error("The reply could not be read. Please try again.");
      setMessages(previous => [...previous, { role: "user" as const, content: question }, { role: "assistant" as const, content: reply.answer, reply }].slice(-40));
    } catch (failure) {
      setDraft(question);
      if (!controller.signal.aborted || controller.signal.reason === "timeout") setError(controller.signal.reason === "timeout" ? "The reply took too long. Please retry your question." : failure instanceof Error ? failure.message : "Could not connect. Please try again.");
    } finally {
      clearTimeout(timeout); requestRef.current = null; setPending("");
    }
  }
  function submit(event: FormEvent) { event.preventDefault(); void ask(draft); }
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
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={styles.panel} showCloseButton={false}>
      <header className={styles.header}>
        <span className={styles.avatar}><GraduationCap size={24} /></span>
        <div><DialogTitle className={styles.title}>Study Buddy</DialogTitle><DialogDescription className={styles.subtitle}>Your space to ask, learn and practice.</DialogDescription></div>
        <button aria-label="Start a new conversation" title="New conversation" disabled={busy || running} onClick={reset}><RotateCcw size={17} /></button>
        <button aria-label="Close Study Buddy" onClick={() => onOpenChange(false)}><X size={20} /></button>
      </header>
      <div className={styles.modes} aria-label="Choose study mode">
        {([ ["study", "Study help", BookOpen], ["interview", "Interview prep", GraduationCap], ["javascript", "JavaScript lab", Code2] ] as const).map(([value, label, Icon]) => <button key={value} aria-pressed={mode === value} onClick={() => { setMode(value); stopRun.current?.(); }}><Icon size={15} />{label}</button>)}
      </div>
      <div className={styles.body} ref={transcript}>
        {messages.length === 0 && !pending && <section className={styles.welcome}>
          <span className={styles.eyebrow}>A LITTLE CLARITY GOES A LONG WAY</span>
          <h3>{mode === "interview" ? "Walk into your next interview prepared." : mode === "javascript" ? "Predict it. Run it. Understand it." : "What are you learning today?"}</h3>
          <p>Get a clear summary, work through a tricky concept, or practice an answer out loud.</p>
          <div className={styles.suggestions}>{suggestions[mode].map(question => <button key={question} disabled={busy} onClick={() => void ask(question)}>{question}<ArrowUp size={14} /></button>)}</div>
        </section>}
        <div role="log" aria-label="Study conversation" aria-live="polite" aria-relevant="additions" className={styles.messages}>
          {messages.map((message, index) => <article key={index} className={message.role === "user" ? styles.userMessage : styles.answer} aria-label={message.role === "user" ? "Your question" : "Study Buddy answer"}>
            <span className={styles.messageLabel}>{message.role === "user" ? "You" : message.reply?.mode === "notes" ? "Study Buddy · From app notes" : "Study Buddy · AI answer"}</span>
            <Answer text={message.content} loadCode={snippet => { setMode("javascript"); setCode(snippet.slice(0, 12000)); setOutput([]); setResult(null); }} />
            {message.reply?.sources.length ? <div className={styles.sources}><span>Related app notes</span>{message.reply.sources.map(source => <Link key={source.href} href={source.href} onClick={() => onOpenChange(false)}>{source.title}</Link>)}</div> : null}
          </article>)}
          {pending && <><article className={styles.userMessage}><span className={styles.messageLabel}>You</span><div className={styles.prose}>{pending}</div></article><p role="status" className={styles.thinking}>Working through your question…</p></>}
        </div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {mode === "javascript" && <section className={styles.lab} aria-label="JavaScript puzzle lab">
          <div className={styles.labHeading}><Code2 size={17} /><h3>JavaScript puzzle lab</h3></div>
          <p>Standalone JavaScript, promises and timers. No DOM, network or Node modules. Runs stop after 3 seconds.</p>
          <label htmlFor="study-puzzle-code">Your code</label>
          <textarea id="study-puzzle-code" value={code} onChange={event => setCode(event.target.value)} maxLength={12000} rows={7} spellCheck={false} disabled={running} />
          <div className={styles.labActions}><button onClick={run} disabled={running || !code.trim()}><Play size={14} />Run JavaScript</button>{running && <button onClick={() => stopRun.current?.()}><Square size={14} />Stop run</button>}</div>
          <div className={styles.output} aria-label="JavaScript console output"><span role="status">{running ? "Running…" : result ? ({ complete: "Run complete", error: "Run failed", timeout: "Stopped: 3-second time limit", stopped: "Run stopped" })[result.status] : "Console output"}</span><pre>{output.join("\n") || (result ? "No console output. Use console.log() to inspect a value." : "Your results will appear here.")}</pre></div>
          {result && <button className={styles.explain} disabled={busy} onClick={() => void ask(`Explain this JavaScript puzzle and its observed sandbox output. The run status was ${result.status}. ${code.length > 4000 ? "Code excerpt (truncated):" : "Code:"}\n\`\`\`javascript\n${code.slice(0, 4000)}\n\`\`\`\nObserved output (possibly truncated):\n${output.join("\n").slice(0, 1200) || "No output"}`, "javascript")}>Help me understand this result</button>}
        </section>}
      </div>
      <form className={styles.composer} onSubmit={submit}>
        <label className={styles.composerLabel} htmlFor="study-chat-question">Ask a study question</label>
        <div className={styles.inputRow}><textarea id="study-chat-question" ref={composer} placeholder={mode === "interview" ? "Ask an interview question…" : "Ask about a topic, an assignment or a puzzle…"} value={draft} onChange={event => setDraft(event.target.value)} maxLength={6000} rows={2} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void ask(draft); } }} />
          {busy ? <button type="button" aria-label="Stop reply" onClick={() => requestRef.current?.abort()}><Square size={18} /></button> : <button type="submit" aria-label="Send question" disabled={!draft.trim()}><ArrowUp size={20} /></button>}
        </div>
        <p>AI answers can be mistaken. Check important details. Don’t share private information.</p>
      </form>
    </DialogContent>
  </Dialog>;
}
