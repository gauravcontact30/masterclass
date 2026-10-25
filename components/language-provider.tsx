"use client";
import { createContext, useContext, useSyncExternalStore, useEffect, useCallback, useState } from "react";
import { LANGUAGES, type Language } from "@/lib/domain";
import {
  en,
  hi,
  translations,
  SUPPORTED_LANGUAGES,
  COUNTRY_TO_LANGUAGE,
  type TranslationKey,
  type SupportedLanguage,
} from "@/lib/i18n";

export interface LanguageContextValue {
  language: Language;
  setLanguage: (value: Language, persist?: boolean) => void;
  t: (key: TranslationKey) => string;
  languages: readonly SupportedLanguage[];
  detectedCountry: string | null;
  isDetected: boolean;
}

const Context = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => en[key] ?? key,
  languages: SUPPORTED_LANGUAGES,
  detectedCountry: null,
  isDetected: false,
});

let memoryLanguage: Language = "en";

export function detectBrowserLocale(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("India")) return "hi";
    if (tz.includes("Tokyo") || tz.includes("Japan")) return "ja";
    if (tz.includes("Shanghai") || tz.includes("Chongqing") || tz.includes("Hong_Kong") || tz.includes("Taipei")) return "zh";
    if (tz.includes("Berlin") || tz.includes("Vienna") || tz.includes("Zurich")) return "de";
    if (tz.includes("Paris") || tz.includes("Brussels") || tz.includes("Monaco")) return "fr";
    if (
      tz.includes("Madrid") || tz.includes("Mexico") || tz.includes("Buenos_Aires") ||
      tz.includes("Bogota") || tz.includes("Santiago") || tz.includes("Lima") || tz.includes("Caracas")
    ) {
      return "es";
    }

    const navLangs = navigator.languages?.length ? navigator.languages : [navigator.language || ""];
    for (const raw of navLangs) {
      const code = raw.toLowerCase();
      if (code.startsWith("hi") || code.startsWith("mr") || code.startsWith("gu") || code.startsWith("bn") || code.startsWith("pa")) return "hi";
      if (code.startsWith("ja")) return "ja";
      if (code.startsWith("zh")) return "zh";
      if (code.startsWith("de")) return "de";
      if (code.startsWith("fr")) return "fr";
      if (code.startsWith("es")) return "es";
    }
  } catch {
    /* fallback to en */
  }
  return "en";
}

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
    if (saved && (LANGUAGES as readonly string[]).includes(saved)) {
      return saved as Language;
    }
    if (process.env.NODE_ENV !== "test" && typeof window !== "undefined") {
      const detected = detectBrowserLocale();
      memoryLanguage = detected;
      return detected;
    }
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

  // Non-blocking geolocation check to detect native country/language when user hasn't explicitly locked a preference
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    try {
      const isManual = localStorage.getItem("masterclass:language-manual") === "1";
      if (isManual) return;
    } catch {
      /* storage inaccessible */
    }

    const controller = new AbortController();
    fetch("/api/geo", { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        if (data.country) setDetectedCountry(data.country);
        const geoLang = data.language as Language | undefined;
        if (geoLang && (LANGUAGES as readonly string[]).includes(geoLang)) {
          const manual = localStorage.getItem("masterclass:language-manual") === "1";
          const currentSaved = localStorage.getItem("masterclass:language");
          if (!manual && !currentSaved && geoLang !== memoryLanguage) {
            memoryLanguage = geoLang;
            try {
              localStorage.setItem("masterclass:language", geoLang);
            } catch {}
            window.dispatchEvent(new Event("masterclass-language"));
          }
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const setLanguage = useCallback((value: Language, persist = true) => {
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

  const t = useCallback((key: TranslationKey): string => {
    const dict = translations[language] ?? en;
    return dict[key] ?? en[key] ?? (key as string);
  }, [language]);

  return (
    <Context.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        detectedCountry,
        isDetected: Boolean(detectedCountry),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useLanguage = () => useContext(Context);
