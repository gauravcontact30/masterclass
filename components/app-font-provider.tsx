"use client";

import { createContext, startTransition, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { READING_FONTS, type FontOption } from "@/lib/tech-buzz-public";
import { loadGoogleFont } from "@/lib/google-fonts";
import { APP_FONT_STORAGE_KEY, APP_FONT_STACK_KEY, DEFAULT_APP_FONT_ID, appFontRecord, appFontStack } from "@/lib/app-font";

interface AppFontContextType {
  appFontId: string;
  currentFont: FontOption;
  setAppFont: (fontId: string) => void;
  resetAppFont: () => void;
}

const AppFontContext = createContext<AppFontContextType | undefined>(undefined);
const DEFAULT_ID = DEFAULT_APP_FONT_ID;

/**
 * The application font. Inter by default for every visitor (app/layout.tsx renders html[data-app-font="inter"]);
 * a font picked in Application Typography replaces it. `html[data-app-font]` drives the override in globals.css,
 * which sets every element (code excepted) to --app-font.
 * The inline script in app/layout.tsx applies a saved choice before first paint, so a reload never flashes the
 * default faces; this provider only keeps the DOM in step after hydration and on change.
 */
export function AppFontProvider({ children }: { children: ReactNode }) {
  const [appFontId, setAppFontIdState] = useState<string>(DEFAULT_ID);
  const [chosen, setChosen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(APP_FONT_STORAGE_KEY);
      const font = saved ? READING_FONTS.find(f => f.id === saved) : undefined;
      if (font) {
        // The pre-paint script already shows this font; a transition keeps the context change from forcing the
        // still-hydrating page into a synchronous re-render (components/bookmarks.tsx).
        startTransition(() => { setAppFontIdState(font.id); setChosen(true); });
        // Choices saved before the pre-paint script existed have no record yet.
        localStorage.setItem(APP_FONT_STACK_KEY, appFontRecord(font));
      }
    } catch {
      /* ignore storage access error */
    }
  }, []);

  const currentFont = useMemo(() => {
    return READING_FONTS.find(f => f.id === appFontId) ?? READING_FONTS.find(f => f.id === DEFAULT_ID) ?? READING_FONTS[0];
  }, [appFontId]);

  useEffect(() => {
    if (typeof document === "undefined" || !currentFont || !chosen) return;
    if (currentFont.id !== DEFAULT_ID) loadGoogleFont(currentFont.name);
    const root = document.documentElement;
    root.style.setProperty("--app-font", appFontStack(currentFont.stack, currentFont.id));
    root.setAttribute("data-app-font", currentFont.id);
  }, [currentFont, chosen]);

  const setAppFont = (fontId: string) => {
    const font = READING_FONTS.find(f => f.id === fontId);
    if (!font) return;
    setAppFontIdState(fontId);
    setChosen(true);
    if (font.id !== DEFAULT_ID) loadGoogleFont(font.name);
    try {
      localStorage.setItem(APP_FONT_STORAGE_KEY, fontId);
      localStorage.setItem(APP_FONT_STACK_KEY, appFontRecord(font));
    } catch {
      /* ignore storage error */
    }
  };

  const resetAppFont = () => {
    setAppFontIdState(DEFAULT_ID);
    setChosen(false);
    // Back to the server-rendered default: Inter.
    const root = document.documentElement;
    root.style.removeProperty("--app-font");
    root.setAttribute("data-app-font", DEFAULT_ID);
    try {
      localStorage.removeItem(APP_FONT_STORAGE_KEY);
      localStorage.removeItem(APP_FONT_STACK_KEY);
    } catch {
      /* ignore storage error */
    }
  };

  return (
    <AppFontContext.Provider value={{ appFontId, currentFont, setAppFont, resetAppFont }}>
      {children}
    </AppFontContext.Provider>
  );
}

export function useAppFont() {
  const context = useContext(AppFontContext);
  if (!context) {
    // Graceful fallback if outside provider
    const fallbackFont = READING_FONTS.find(f => f.id === DEFAULT_ID) ?? READING_FONTS[0];
    return {
      appFontId: DEFAULT_ID,
      currentFont: fallbackFont,
      setAppFont: () => {},
      resetAppFont: () => {},
    };
  }
  return context;
}
