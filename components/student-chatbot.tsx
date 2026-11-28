"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { STUDY_BUDDY_EVENT, type StudyBuddyRequest } from "@/lib/study-buddy-bridge";
import styles from "./student-chatbot.module.css";

const StudentChatPanel = dynamic(() => import("./student-chat-panel"), { ssr: false });

/**
 * The Study Buddy launcher and its chat panel. Rendered by the routes that offer it (the landing page and the Learning
 * Dashboard layout), not the root layout: there the route is known on the server, so the launcher is in the server
 * HTML and paints with the first frame. Mounted only after hydration (2026-11-26 measurement, 4x CPU phone profile),
 * it painted at ~5 s and, being larger than any other early text, became the landing page's mobile LCP element.
 * The panel's code still loads only on first open.
 */
export function StudentChatbot() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // A question handed over by askStudyBuddy(); the id makes the same question asked twice count twice.
  const [prompt, setPrompt] = useState<(StudyBuddyRequest & { id: number }) | null>(null);
  useEffect(() => {
    const onAsk = (event: Event) => {
      const detail = (event as CustomEvent<StudyBuddyRequest>).detail ?? {};
      setLoaded(true); setOpen(true);
      if (detail.question) setPrompt({ ...detail, id: Date.now() });
    };
    window.addEventListener(STUDY_BUDDY_EVENT, onAsk);
    return () => window.removeEventListener(STUDY_BUDDY_EVENT, onAsk);
  }, []);
  return <>
    <button data-study-buddy="" className={styles.launcher} onClick={() => { setLoaded(true); setOpen(true); }} aria-label="Open Study Buddy" aria-haspopup="dialog" aria-expanded={open}>
      <span className={styles.launcherMark} aria-hidden="true">✻</span><span>Study Buddy<small>Ask. Understand. Practice.</small></span><MessageCircle size={18} />
    </button>
    {loaded && <StudentChatPanel open={open} onOpenChange={setOpen} prompt={prompt} />}
  </>;
}
