"use client";
import { LanguageProvider } from "./language-provider";
import { BookmarksProvider } from "./bookmarks";
import { Toaster } from "./ui/sonner";
import { LearningMarksProvider } from "./learning-marks";
import { InterviewFocusProvider } from "./interview-focus";
import { RetiredTechnologyCleanup } from "./retired-technology-cleanup";
import { VocabularyLookupProvider } from "./vocabulary-lookup-provider";
import { AppTooltips } from "./app-tooltips";
import { AppFontProvider } from "./app-font-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AppFontProvider>
        <RetiredTechnologyCleanup />
        <InterviewFocusProvider>
          <LearningMarksProvider>
            <BookmarksProvider>
              <VocabularyLookupProvider>
                {children}
                <AppTooltips />
              </VocabularyLookupProvider>
            </BookmarksProvider>
          </LearningMarksProvider>
        </InterviewFocusProvider>
        <Toaster position="bottom-right" closeButton />
      </AppFontProvider>
    </LanguageProvider>
  );
}
