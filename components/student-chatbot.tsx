"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { MessageCircle } from "lucide-react";
import { STUDY_BUDDY_EVENT, type StudyBuddyRequest } from "@/lib/study-buddy-bridge";
import styles from "./student-chatbot.module.css";

const noSubscribe = () => () => {};
const StudentChatPanel = dynamic(() => import("./student-chat-panel"), { ssr: false });

export function StudentChatbot() {
  const pathname = usePathname();
  // The root layout is prerendered once for every route, before the path is known, so the server always renders this
  // as nothing. Rendering the button from the first client render made React report a hydration mismatch (#418) on
  // every page load; it now appears right after hydration instead.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
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
  if (!hydrated || (pathname !== "/" && pathname !== "/learning" && !pathname?.startsWith("/learning/"))) return null;
  return <>
    <button className={styles.launcher} onClick={() => { setLoaded(true); setOpen(true); }} aria-label="Open Study Buddy" aria-haspopup="dialog" aria-expanded={open} suppressHydrationWarning>
      <span className={styles.launcherMark} aria-hidden="true">✻</span><span>Study Buddy<small>Ask. Understand. Practice.</small></span><MessageCircle size={18} />
    </button>
    {loaded && <StudentChatPanel open={open} onOpenChange={setOpen} prompt={prompt} />}
  </>;
}
