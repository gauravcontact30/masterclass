"use client";
import { LanguageProvider } from "./language-provider";
import { BookmarksProvider } from "./bookmarks";
import { Toaster } from "./ui/sonner";
import { InterviewFocusProvider } from "./interview-focus";
import { RetiredTechnologyCleanup } from "./retired-technology-cleanup";
import { VocabularyLookupProvider } from "./vocabulary-lookup-provider";
import { AppTooltips } from "./app-tooltips";
import { AppFontProvider } from "./app-font-provider";
import { AudienceProvider } from "./audience-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AudienceProvider><LanguageProvider>
      <AppFontProvider>
        <RetiredTechnologyCleanup />
        <InterviewFocusProvider>
          {/* Highlights (LearningMarksProvider) wrap only the Learning Dashboard: app/(learning)/learning/layout.tsx. */}
          <BookmarksProvider>
            <VocabularyLookupProvider>
              {children}
              <AppTooltips />
            </VocabularyLookupProvider>
          </BookmarksProvider>
        </InterviewFocusProvider>
        <Toaster position="bottom-right" closeButton />
      </AppFontProvider>
    </LanguageProvider></AudienceProvider>
  );
}
