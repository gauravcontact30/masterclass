"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GraduationCap, MessageCircle } from "lucide-react";
import { STUDY_BUDDY_EVENT, type StudyBuddyRequest } from "@/lib/study-buddy-bridge";
import styles from "./student-chatbot.module.css";

const StudentChatPanel = dynamic(() => import("./student-chat-panel"), { ssr: false });

export function StudentChatbot() {
  const pathname = usePathname();
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
  if (pathname !== "/" && pathname !== "/dashboard" && !pathname?.startsWith("/dashboard/")) return null;
  return <>
    <button className={styles.launcher} onClick={() => { setLoaded(true); setOpen(true); }} aria-label="Open Study Buddy" aria-haspopup="dialog" aria-expanded={open}>
      <GraduationCap size={22} /><span>Study Buddy<small>Ask. Understand. Practice.</small></span><MessageCircle size={18} />
    </button>
    {loaded && <StudentChatPanel open={open} onOpenChange={setOpen} prompt={prompt} />}
  </>;
}
