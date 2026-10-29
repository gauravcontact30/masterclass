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
import { DeepCourseShelf } from "./deep-course-shelf";
import { LockedMoreContext } from "./dashboard-more";
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
export function DashboardLearning({ daily, today = 0, techDocs, concepts, locked = false, overrides, canEdit = false }: Readonly<{ daily: DashboardDaily | null; /** istDay(): picks the day's interview technologies in the locked preview. */ today?: number; techDocs?: OfficialTechDocs | null; concepts?: Record<string, TechConcept[]>; locked?: boolean; overrides?: ContentOverrides; canEdit?: boolean }>) {
  const font = landingFont(useLanguage().language === "hi");
  // Super Admin edits (migration 0032) apply here for everyone; only the Super Admin gets the edit switch.
  // After the trial (`locked`), every section shows the landing page's preview and its "see all" link opens the plans
  // (components/workspace.tsx puts them under this sheet), so the reader sees what membership opens before the price.
  return <ContentProvider overrides={overrides} canEdit={canEdit}><LockedMoreContext value={locked}><div className={`${home.home} ${font.variable} ${font.className} ${styles.learning}`}>
    {/* Order (2026-10-28): the in-depth courses first (the "What next" coach was removed), then today's pulse, the
        highest-intent practice (interview prep, blueprints), reference depth (comparisons, docs), and the day's words last. */}
    <DeepCourseShelf id="dashboard-deep-courses" inSheet />
    {daily && <LandingAiPulse expanded={!locked} preview={locked} cards={daily.pulse} day={daily.day} locked={daily.locked.pulse} />}
    <LandingInterview expanded={!locked} preview={locked} day={today} />
    <LandingWorkflows workflows={WORKFLOWS} expanded={!locked} preview={locked} />
    {/* Without a membership (trial over), the full Tech Topics and Technology docs stay behind the plans screen. */}
    <LandingComparisons expanded={!locked} preview={locked} locked={locked} official={techDocs} />
    <LandingTechDocs official={techDocs} preview={locked} locked={locked} concepts={locked ? undefined : concepts} />
    {daily && <LandingVocabulary preview={locked} words={daily.words} day={daily.day} locked={daily.locked.word} />}
  </div></LockedMoreContext></ContentProvider>;
}
