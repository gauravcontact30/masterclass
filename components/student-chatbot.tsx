"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GraduationCap, MessageCircle } from "lucide-react";
import styles from "./student-chatbot.module.css";

const StudentChatPanel = dynamic(() => import("./student-chat-panel"), { ssr: false });

export function StudentChatbot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (pathname !== "/" && pathname !== "/dashboard" && !pathname?.startsWith("/dashboard/")) return null;
  return <>
    <button className={styles.launcher} onClick={() => { setLoaded(true); setOpen(true); }} aria-label="Open Study Buddy" aria-haspopup="dialog" aria-expanded={open}>
      <GraduationCap size={22} /><span>Study Buddy<small>Ask. Understand. Practice.</small></span><MessageCircle size={18} />
    </button>
    {loaded && <StudentChatPanel open={open} onOpenChange={setOpen} />}
  </>;
}
