"use client";
import { LanguageProvider } from "./language-provider";
import { Toaster } from "./ui/sonner";
import { LearningMarksProvider } from "./learning-marks";
export function AppProviders({ children }: { children: React.ReactNode }) { return <LanguageProvider><LearningMarksProvider>{children}</LearningMarksProvider><Toaster position="bottom-right" richColors closeButton/></LanguageProvider>; }
