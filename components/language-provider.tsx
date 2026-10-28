"use client";
import { createContext, useContext, useSyncExternalStore, useEffect, useCallback, useMemo, useState } from "react";
import { LANGUAGES, type Language } from "@/lib/languages";
import {
  en,
  SUPPORTED_LANGUAGES,
  usableLanguage,
  type TranslationKey,
  type SupportedLanguage,
} from "@/lib/i18n";

export interface LanguageContextValue {
  language: Language;
  setLanguage: (value: Language, persist?: boolean) => void;
  t: (key: TranslationKey) => string;
  languages: readonly SupportedLanguage[];
}

const Context = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => en[key] ?? key,
  languages: SUPPORTED_LANGUAGES,
});
/*
 * The visitor's country (for the language picker's badge) lives in its own context. It arrives from /api/geo after
 * the page loads; inside the language value it re-rendered every component that reads the language (every landing
 * section) at that moment, for a badge only the language switcher shows.
 */
const CountryContext = createContext<string | null>(null);

let memoryLanguage: Language = "en";

/*
 * English is every visitor's language until they pick another one themselves (user rule 2026-10-26). Nothing is
 * guessed from the timezone, the browser or the visitor's country: those guesses used to switch visitors in India to
 * Hindi and save it as if they had chosen it. Only a choice made in the language switcher (or saved on the signed-in
 * account) is remembered, marked by masterclass:language-manual.
 */
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("masterclass-language", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("masterclass-language", callback);
  };
}

function snapshot(): Language {
  try {
    const saved = localStorage.getItem("masterclass:language");
    const chosen = localStorage.getItem("masterclass:language-manual") === "1";
    // Only the visitor's own choice counts; a language without localized content yet falls back to English.
    if (chosen && saved && (LANGUAGES as readonly string[]).includes(saved)) return usableLanguage(saved);
    return memoryLanguage;
  } catch {
    return memoryLanguage;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, snapshot, () => "en" as Language);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // The visitor's country is shown in the language picker only; it never changes the language.
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    const controller = new AbortController();
    fetch("/api/geo", { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.country) setDetectedCountry(data.country); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const setLanguage = useCallback((requested: Language, persist = true) => {
    const value = usableLanguage(requested);
    memoryLanguage = value;
    try {
      localStorage.setItem("masterclass:language", value);
      localStorage.setItem("masterclass:language-manual", "1");
    } catch {}
    window.dispatchEvent(new Event("masterclass-language"));
    if (persist) {
      void fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: value }),
      }).catch(() => {});
    }
  }, []);

  // English ships with every page; another language's dictionary is fetched the first time it is chosen.
  const [dictionaries, setDictionaries] = useState<Partial<Record<Language, Record<TranslationKey, string>>>>({ en });
  useEffect(() => {
    if (dictionaries[language]) return;
    let live = true;
    void import("@/lib/i18n-locales").then(module => { if (live) setDictionaries(current => ({ ...current, ...module.translations })); });
    return () => { live = false; };
  }, [language, dictionaries]);

  const t = useCallback((key: TranslationKey): string => {
    const dict = dictionaries[language] ?? en;
    return dict[key] ?? en[key] ?? (key as string);
  }, [language, dictionaries]);

  const value = useMemo(() => ({ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }), [language, setLanguage, t]);
  return <Context.Provider value={value}><CountryContext.Provider value={detectedCountry}>{children}</CountryContext.Provider></Context.Provider>;
}

export const useLanguage = () => useContext(Context);
/** The visitor's country from /api/geo, or null until it is known. */
export const useDetectedCountry = () => useContext(CountryContext);
