"use client";
import { createContext, useContext } from "react";
import { en, SUPPORTED_LANGUAGES, type TranslationKey, type SupportedLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/languages";

export interface LanguageContextValue {
  language: Language;
  setLanguage: (value: Language, persist?: boolean) => void;
  t: (key: TranslationKey) => string;
  languages: readonly SupportedLanguage[];
}

/*
 * The site is in English only (user rule 2026-11-02): nothing can change the language, whatever an account or this
 * browser saved earlier. The value never changes, so no component re-renders because of it.
 */
const VALUE: LanguageContextValue = {
  language: "en",
  setLanguage: () => {},
  t: key => en[key] ?? (key as string),
  languages: SUPPORTED_LANGUAGES,
};
const Context = createContext<LanguageContextValue>(VALUE);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <Context.Provider value={VALUE}>{children}</Context.Provider>;
}

export const useLanguage = () => useContext(Context);
