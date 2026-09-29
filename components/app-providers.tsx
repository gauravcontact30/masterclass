"use client";
import { LanguageProvider } from "./language-provider";
import { BookmarksProvider } from "./bookmarks";
import { Toaster } from "./ui/sonner";
import { LearningMarksProvider } from "./learning-marks";
import { InterviewFocusProvider } from "./interview-focus";
import { RetiredTechnologyCleanup } from "./retired-technology-cleanup";
import { VocabularyLookupProvider } from "./vocabulary-lookup-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <RetiredTechnologyCleanup />
      <InterviewFocusProvider>
        <LearningMarksProvider>
          <BookmarksProvider>
            <VocabularyLookupProvider>
              {children}
            </VocabularyLookupProvider>
          </BookmarksProvider>
        </LearningMarksProvider>
      </InterviewFocusProvider>
      <Toaster position="bottom-right" richColors closeButton />
    </LanguageProvider>
  );
}
