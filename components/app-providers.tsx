"use client";
import { LanguageProvider } from "./language-provider";
export function AppProviders({ children }: { children: React.ReactNode }) { return <LanguageProvider>{children}</LanguageProvider>; }
