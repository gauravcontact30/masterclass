"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { en, SUPPORTED_LANGUAGES, usableLanguage, type TranslationKey, type SupportedLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/languages";
/** The Hindi interface strings (~58 KB) load only for readers who choose Hindi, not in every visitor's first bundle. */
type Dictionary = Record<string, string>;
let hindiCache: Promise<Dictionary> | null = null;
const loadHindi = () => hindiCache ??= import("@/lib/locales/ui-hi.json").then(module => module.default as Dictionary, () => { hindiCache = null; return {}; });
export interface LanguageContextValue {
  language: Language;
  setLanguage: (value: Language, persist?: boolean) => void;
  t: (key: TranslationKey) => string;
  languages: readonly SupportedLanguage[];
}
const Context = createContext<LanguageContextValue>({ language: "en", setLanguage: () => {}, t: key => en[key] ?? key, languages: SUPPORTED_LANGUAGES });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, change] = useState<Language>("en");
  const [hindi, setHindi] = useState<Dictionary | null>(null);
  // The saved choice is read after hydration (the server always renders English), so this setState is intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { change(usableLanguage(localStorage.getItem("mc-language"))); } catch {} }, []);
  useEffect(() => { document.documentElement.lang = language === "hi" ? "hi" : "en"; }, [language]);
  useEffect(() => { if (language !== "hi" || hindi) return; let live = true; void loadHindi().then(data => { if (live) setHindi(data); }); return () => { live = false; }; }, [language, hindi]);
  const value = useMemo<LanguageContextValue>(() => ({
    language, languages: SUPPORTED_LANGUAGES,
    setLanguage: (next, persist = true) => { const selected = usableLanguage(next); change(selected); if (persist) try { localStorage.setItem("mc-language", selected); } catch {} },
    t: key => language === "hi" && hindi ? hindi[en[key]] ?? en[key] ?? key : en[key] ?? key,
  }), [language, hindi]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useLanguage = () => useContext(Context);
