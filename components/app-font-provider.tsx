"use client";

import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { READING_FONTS, DEFAULT_READING_FONT_ID, type FontOption } from "@/lib/tech-buzz-public";
import { loadGoogleFont } from "@/lib/google-fonts";

const APP_FONT_STORAGE_KEY = "masterclass:app-font-family";

interface AppFontContextType {
  appFontId: string;
  currentFont: FontOption;
  setAppFont: (fontId: string) => void;
  resetAppFont: () => void;
}

const AppFontContext = createContext<AppFontContextType | undefined>(undefined);

export function AppFontProvider({ children }: { children: ReactNode }) {
  const [appFontId, setAppFontIdState] = useState<string>("inter");

  // Hydrate user font preference on client mount to eliminate SSR mismatch console errors
  useEffect(() => {
    try {
      const saved = localStorage.getItem(APP_FONT_STORAGE_KEY);
      if (saved && READING_FONTS.some(f => f.id === saved)) {
        setAppFontIdState(saved);
      }
    } catch {
      /* ignore storage access error */
    }
  }, []);

  const currentFont = useMemo(() => {
    return READING_FONTS.find(f => f.id === appFontId) ?? READING_FONTS.find(f => f.id === "inter") ?? READING_FONTS[0];
  }, [appFontId]);

  // Apply font to entire application DOM
  useEffect(() => {
    if (typeof document === "undefined" || !currentFont) return;

    // Load Google font stylesheet dynamically
    loadGoogleFont(currentFont.name);

    // Apply font variables to root HTML and body for 100% global coverage
    const root = document.documentElement;
    root.style.setProperty("--font-sans", currentFont.stack);
    root.style.setProperty("--app-font", currentFont.stack);
    root.style.setProperty("--font-heading", currentFont.stack);
    root.style.setProperty("--reading-font", currentFont.stack);
    document.body.style.fontFamily = currentFont.stack;
  }, [currentFont]);

  const setAppFont = (fontId: string) => {
    setAppFontIdState(fontId);
    const font = READING_FONTS.find(f => f.id === fontId);
    if (font) {
      loadGoogleFont(font.name);
    }
    try {
      localStorage.setItem(APP_FONT_STORAGE_KEY, fontId);
    } catch {
      /* ignore storage error */
    }
  };

  const resetAppFont = () => {
    setAppFont("inter");
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
    const fallbackFont = READING_FONTS.find(f => f.id === "inter") ?? READING_FONTS[0];
    return {
      appFontId: "inter",
      currentFont: fallbackFont,
      setAppFont: () => {},
      resetAppFont: () => {},
    };
  }
  return context;
}
