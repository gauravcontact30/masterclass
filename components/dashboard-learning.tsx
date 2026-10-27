"use client";
import type { DailyWord, LockedTeaser, PulseCard } from "@/lib/landing-daily-types";
import { landingFont } from "./landing-fonts";
import { useLanguage } from "./language-provider";
import { LandingAiPulse } from "./landing-ai-pulse";
import { LandingVocabulary } from "./landing-vocabulary";
import { LandingWorkflows } from "./landing-workflows";
import { WORKFLOWS } from "@/lib/landing-workflows";
import { LandingInterview } from "./landing-interview";
import { LandingComparisons } from "./landing-comparisons";
import { LandingTechDocs } from "./landing-tech-docs";
import { DashboardCoach } from "./dashboard-coach";
import { ContentProvider } from "./content-editing";
import type { ContentOverrides } from "@/lib/content-overrides";
import type { OfficialTechDocs } from "@/lib/tech-docs-official";
import type { TechConcept } from "@/lib/tech-docs";
import home from "./landing-home.module.css";
import styles from "./dashboard-learning.module.css";

export type DashboardDaily = { day: string; pulse: PulseCard[]; words: DailyWord[]; locked: { pulse: LockedTeaser | null; word: LockedTeaser | null } };

/**
 * The full learning sections inside /learning: AI & agentic pulse, Word power, Workflow blueprints (with every
 * most-asked interview question) and Interview prep. The landing page previews three cards of each and links
 * here (components/dashboard-more.tsx), so these render the same components, in the landing page's tokens and font.
 */
export function DashboardLearning({ daily, techDocs, concepts, locked = false, overrides, canEdit = false }: Readonly<{ daily: DashboardDaily | null; techDocs?: OfficialTechDocs | null; concepts?: Record<string, TechConcept[]>; locked?: boolean; overrides?: ContentOverrides; canEdit?: boolean }>) {
  const font = landingFont(useLanguage().language === "hi");
  // Super Admin edits (migration 0032) apply here for everyone; only the Super Admin gets the edit switch.
  return <ContentProvider overrides={overrides} canEdit={canEdit}><div className={`${home.home} ${font.variable} ${font.className} ${styles.learning}`}>
    {/* Order (2026-10-20): today's pulse first (the reason to come back daily), then the highest-intent practice
        (interview prep, blueprints), then reference depth (comparisons, docs), and the day's words last. */}
    <DashboardCoach />
    {daily && <LandingAiPulse expanded cards={daily.pulse} day={daily.day} locked={daily.locked.pulse} />}
    <LandingInterview expanded />
    <LandingWorkflows workflows={WORKFLOWS} expanded />
    {/* Without a membership (trial over), the full Tech Topics and Technology docs stay behind the plans screen. */}
    <LandingComparisons expanded={!locked} preview={locked} locked={locked} official={techDocs} />
    <LandingTechDocs official={techDocs} preview={locked} locked={locked} concepts={locked ? undefined : concepts} />
    {daily && <LandingVocabulary words={daily.words} day={daily.day} locked={daily.locked.word} />}
  </div></ContentProvider>;
}
