"use client";
import type { DailyWord, LockedTeaser, PulseCard } from "@/lib/landing-daily-types";
import { anek } from "./landing-fonts";
import { LandingAiPulse } from "./landing-ai-pulse";
import { LandingVocabulary } from "./landing-vocabulary";
import { LandingWorkflows } from "./landing-workflows";
import { LandingInterview } from "./landing-interview";
import { LandingComparisons } from "./landing-comparisons";
import { LandingTechDocs } from "./landing-tech-docs";
import type { OfficialTechDocs } from "@/lib/tech-docs-official";
import type { TechConcept } from "@/lib/tech-docs";
import home from "./landing-home.module.css";
import styles from "./dashboard-learning.module.css";

export type DashboardDaily = { day: string; pulse: PulseCard[]; words: DailyWord[]; locked: { pulse: LockedTeaser | null; word: LockedTeaser | null } };

/**
 * The full learning sections inside /dashboard: AI & agentic pulse, Word power, Workflow blueprints (with every
 * most-asked interview question) and Interview prep. The landing page previews three cards of each and links
 * here (components/dashboard-more.tsx), so these render the same components, in the landing page's tokens and font.
 */
export function DashboardLearning({ daily, techDocs, concepts, locked = false }: Readonly<{ daily: DashboardDaily | null; techDocs?: OfficialTechDocs | null; concepts?: Record<string, TechConcept[]>; locked?: boolean }>) {
  return <div className={`${home.home} ${anek.variable} ${anek.className} ${styles.learning}`}>
    {daily && <>
      <LandingAiPulse expanded cards={daily.pulse} day={daily.day} locked={daily.locked.pulse} />
      <LandingVocabulary words={daily.words} day={daily.day} locked={daily.locked.word} />
    </>}
    <LandingWorkflows expanded />
    <LandingInterview expanded />
    {/* Without a membership (trial over), the full Tech Topics and Technology docs stay behind the plans screen. */}
    <LandingComparisons expanded={!locked} preview={locked} locked={locked} official={techDocs} />
    <LandingTechDocs official={techDocs} preview={locked} locked={locked} concepts={locked ? undefined : concepts} />
  </div>;
}
