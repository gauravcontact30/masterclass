"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Code2, Lightbulb, Target, Brain, MessageCircle, RotateCcw, SendHorizontal } from "lucide-react";
import type { ContentSource, MentorMessage } from "@/lib/pro-learn/types";
import { ProMarkdown } from "./pro-markdown";
import { ProHero, SourceBadge, TrackSelect, useProLevel, useProTrack } from "./pro-learn-shared";
import styles from "./pro-learn.module.css";
import { LearningPath } from "./learning-studio";
import { TechnologySections } from "./technology-sections";
import { PRO_TRACKS } from "@/lib/pro-learn/tracks";

type ChatEntry = MentorMessage & { source?: ContentSource; failed?: boolean };
// The API accepts at most 12 alternating turns that start with the learner.
function history(entries: ChatEntry[]): MentorMessage[] {
  let turns = entries.filter(entry => !entry.failed).map(({ role, content }) => ({ role, content }));
  turns = turns.slice(-11);
  while (turns[0]?.role === "assistant") turns = turns.slice(1);
  return turns;
}

export function ProMentor({ aiReady }: { aiReady: boolean }) {
  const params = useSearchParams();
  const [track, setTrack] = useProTrack(params.get("track"));
  const [level] = useProLevel();
  const [draft, setDraft] = useState(params.get("q") ?? "");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Each card is a coaching mode: what you bring, what the mentor does, and what you leave with.
  const presets = [
    { label: "Explain like a senior engineer", icon: BookOpen, blurb: "Build intuition with a clear, practical example.", outcome: "You leave with a mental model", prompt: `Explain a core ${track.name} concept of your choice as a senior engineer would — intuition first, then a practical example.` },
    { label: "Review my code", icon: Code2, blurb: "Find bugs and make your implementation stronger.", outcome: "You leave with concrete fixes", prompt: "I'll paste code next. Review it for bugs, performance and readability with concrete fixes." },
    { label: "Project idea", icon: Lightbulb, blurb: "Turn your skills into something worth shipping.", outcome: "You leave with a build plan", prompt: `Suggest a small but portfolio-worthy ${track.name} project I can build this week, with key steps.` },
    { label: "Quiz me (5 Q)", icon: Brain, blurb: "Strengthen recall, one question at a time.", outcome: "You leave knowing your gaps", prompt: `Quiz me with 5 progressively harder ${track.name} questions, one at a time.` },
    { label: "Interview drill", icon: Target, blurb: "Practise explaining your thinking with confidence.", outcome: "You leave sounding clearer", prompt: `Ask me one ${track.name} interview question and coach my answer.` },
  ];

  useEffect(() => { const chat = chatRef.current; if (chat) chat.scrollTop = chat.scrollHeight; }, [entries, busy]);
  useEffect(() => { if (params.get("q")) inputRef.current?.focus(); }, [params]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: ChatEntry[] = [...entries.filter(entry => !entry.failed), { role: "user", content }];
    setEntries(next); setDraft(""); setBusy(true);
    try {
      const response = await fetch("/api/pro-learn/mentor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackId: track.id, level, messages: history(next) }) });
      const data = await response.json() as { answer?: string; source?: ContentSource; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error === "rate_limited" ? "You are sending messages quickly. Please wait a minute." : "The mentor could not answer right now. Please try again.");
      setEntries([...next, { role: "assistant", content: data.answer, source: data.source }]);
    } catch (error) {
      setEntries([...next, { role: "assistant", content: error instanceof Error ? error.message : "Something went wrong.", failed: true }]);
    } finally { setBusy(false); inputRef.current?.focus(); }
  }

  return <div className={styles.root}>
    <LearningPath active="mentors"/>
    <ProHero eyebrow="Professional learning / Mentors" title="A little guidance. A big breakthrough." icon={<MessageCircle size={26} color="#c6613f"/>} aside={<TrackSelect value={track.id} onChange={id => { setTrack(id); setEntries([]); }}/>}>
      Ask anything about {track.focus}. {aiReady ? "Answers are tuned to your track and level." : "Answers come from MasterClass study notes while AI mentoring is unavailable."}
    </ProHero>
    <div className={styles.sectionHead}><div><h2>How would you like to grow?</h2><p>Your {track.name} learning companion. Choose a starting point.</p></div><span className={styles.sourceBadge}>{aiReady ? "AI mentor" : "Study notes companion"}</span></div>
    <div className={styles.mentorGrid} role="group" aria-label="Conversation starters">{presets.map(({ label, icon: Icon, blurb, outcome, prompt }, index) => <button key={label} className={styles.mentorCard} disabled={busy} onClick={() => void send(prompt)}>
      <span className={styles.mentorTop}><span className={styles.mentorIcon}><Icon size={21}/></span><b>0{index + 1}</b></span>
      <h3>{label}</h3>
      <p>{blurb}</p>
      <span className={styles.mentorOutcome}>{outcome}</span>
      <span className={styles.modeFoot}>Start a conversation<ArrowRight size={15}/></span>
    </button>)}</div>
    <div className={styles.sectionHead}>
      <div><h2>Change the mentor&apos;s specialism</h2><p>Every track has its own mentor. Pick the one closest to what you are building.</p></div>
      <span className={styles.cat}>{PRO_TRACKS.length} specialisms</span>
    </div>
    <TechnologySections idPrefix="mentor-track" tracks={PRO_TRACKS} selected={track.id} onSelect={id => { setTrack(id); setEntries([]); }}/>

    <section className={styles.card} style={{ marginTop: 22 }} aria-label="Mentor conversation">
      <div className={styles.chatHeading}><span className={styles.mentorIcon}><MessageCircle size={20}/></span><div><h2>Your learning space</h2><p>{track.name} &middot; {level} &middot; {aiReady ? "AI-guided conversation" : "Library-backed guidance"}</p></div></div>
      <div className={styles.chat} ref={chatRef} role="log" aria-live="polite" aria-busy={busy}>
        {!entries.length && <div className={`${styles.empty} ${styles.mentorWelcome}`}><span className={styles.welcomeMark}><MessageCircle size={30}/></span><h3>Great questions lead to breakthroughs.</h3><p>Bring a tricky concept, a piece of code, or an idea.<br/>We will work through it, one step at a time.</p></div>}
        {entries.map((entry, index) => <div key={index} className={styles.message} data-role={entry.role}>
          <span className={styles.avatar} aria-hidden="true">{entry.role === "user" ? "YOU" : "MC"}</span>
          <div className={styles.bubble}>
            <span className={styles.srOnly}>{entry.role === "user" ? "You said:" : "Mentor replied:"}</span>
            {entry.role === "user" ? entry.content : entry.failed ? <p className={styles.notice} data-tone="error">{entry.content}</p> : <><ProMarkdown text={entry.content}/>{entry.source === "library" && <div style={{ marginTop: 8 }}><SourceBadge source="library"/></div>}</>}
          </div>
        </div>)}
        {busy && <div className={styles.message} data-role="assistant"><span className={styles.avatar} aria-hidden="true">MC</span><div className={styles.bubble}><span className={styles.typing} aria-label="Mentor is typing"><i/><i/><i/></span></div></div>}
      </div>
      <form className={styles.composer} onSubmit={event => { event.preventDefault(); void send(draft); }}>
        <Label className={styles.srOnly} htmlFor="mentor-input">Message the mentor</Label>
        <Textarea id="mentor-input" ref={inputRef} rows={1} maxLength={6000} value={draft} placeholder="Ask anything… (Enter to send, Shift+Enter for a new line)" onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(draft); } }}/>
        {!!entries.length && <Button type="button" className={`${styles.btn} ${styles.outline}`} onClick={() => setEntries([])} aria-label="Start a new conversation" disabled={busy}><RotateCcw size={16}/></Button>}
        <Button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={busy || !draft.trim()} aria-label="Send message"><SendHorizontal size={16}/></Button>
      </form>
    </section>
  </div>;
}
