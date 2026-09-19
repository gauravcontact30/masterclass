"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { GraduationCap } from "lucide-react";
import { INTERVIEW_FOCUS_STORAGE_KEY, hiddenSectionTitles, showsSection, type StudySectionId } from "@/lib/interview-focus";
import styles from "./interview-focus.module.css";

const EVENT = "masterclass-interview-focus";
const Context = createContext<{ focused: boolean; setFocused: (value: boolean) => void }>({ focused: false, setFocused: () => {} });

let memory = false;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(INTERVIEW_FOCUS_STORAGE_KEY) === "on";
  } catch {
    return memory;
  }
}

export function InterviewFocusProvider({ children }: { children: React.ReactNode }) {
  const focused = useSyncExternalStore(subscribe, snapshot, () => false);
  const setFocused = useCallback((value: boolean) => {
    memory = value;
    try {
      localStorage.setItem(INTERVIEW_FOCUS_STORAGE_KEY, value ? "on" : "off");
    } catch {
      /* Private browsing: the toggle still works for this page. */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return <Context.Provider value={{ focused, setFocused }}>{children}</Context.Provider>;
}

export const useInterviewFocus = () => useContext(Context);

/** True when a section should render under the current mode. */
export function useSectionVisible(id: StudySectionId) {
  return showsSection(id, useInterviewFocus().focused);
}

export function InterviewFocusToggle() {
  const { focused, setFocused } = useInterviewFocus();
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        role="switch"
        aria-checked={focused}
        onClick={() => setFocused(!focused)}
      >
        <GraduationCap size={15} aria-hidden="true" />
        <span>Interview focus</span>
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </button>
      <p className={styles.hint} role="status">
        {focused
          ? `Showing interview-critical material only. Hidden: ${hiddenSectionTitles().join(", ").toLowerCase()}.`
          : "Showing every section. Turn on to keep only what interviews ask about."}
      </p>
    </div>
  );
}
