"use client";

import { useEffect, useState, useId, type CSSProperties } from "react";
import { Sparkles, Code2, ChevronDown } from "lucide-react";
import { useLanguage } from "./language-provider";
import { resolvePageHighlight } from "@/lib/dashboard-highlights";
import { AppleCodeEditor } from "./apple-code-editor";
import { ConformStudyGoalForm } from "./conform-form";
import styles from "./dashboard-learning-highlights.module.css";

const STORE_KEY = "masterclass:highlights-expanded";

interface DashboardLearningHighlightsProps {
  category?: string;
  tab?: string;
  activePreparation?: {
    label: {
      en: string;
      hi: string;
    };
  };
}

export function DashboardLearningHighlights({
  category,
  tab,
  activePreparation,
}: DashboardLearningHighlightsProps) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const headingId = useId();

  const [expanded, setExpanded] = useState<boolean>(true);
  const [showPlanner, setShowPlanner] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved !== null) {
        setExpanded(saved === "true");
      }
    } catch {
      // localStorage unavailable in sandboxed environments
    }
  }, []);

  function toggleExpanded() {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORE_KEY, String(next));
      } catch {
        // Ignore write failures
      }
      return next;
    });
  }

  const config = resolvePageHighlight(category, tab, activePreparation);

  const containerStyle = {
    "--hl-bg": config.tone.bg,
    "--hl-ink": config.tone.ink,
    "--hl-border": config.tone.border,
    "--hl-badge-bg": config.tone.badgeBg,
    "--hl-badge-ink": config.tone.badgeInk,
  } as CSSProperties;

  return (
    <section
      className={styles.container}
      style={containerStyle}
      aria-labelledby={headingId}
    >
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              <span className={styles.sparkleIcon} aria-hidden="true">✦</span>
              {config.badge[language]}
            </span>
          </div>
          <h2 id={headingId} className={styles.title}>
            {config.heading[language]}
          </h2>
          <p className={styles.subheading}>
            {config.subheading[language]}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-controls={`${headingId}-content`}
            title={expanded ? (hi ? "छिपाएं" : "Collapse panel") : (hi ? "विस्तार करें" : "Expand panel")}
          >
            <span>{expanded ? (hi ? "छिपाएं" : "Collapse") : (hi ? "विस्तार करें" : "Expand")}</span>
            <ChevronDown
              size={15}
              className={styles.chevronIcon}
              data-expanded={expanded ? "true" : "false"}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div id={`${headingId}-content`} className={styles.body}>
          {/* Apple-Style Light Code Editor with Line-by-Line Understanding */}
          <div>
            <div className={styles.sectionTitleRow}>
              <Code2 size={15} aria-hidden="true" />
              <span>{hi ? "कोड उदाहरण एवं लाइन-स्तरीय समझ (Code Example & IDE)" : "Interactive Code Example & Line-by-Line IDE"}</span>
            </div>
            <AppleCodeEditor category={category} tab={tab} />
          </div>

          {/* Infrastructure Architecture Badges & Conform Planner Trigger */}
          <div className={styles.infraBar}>
            <span className={styles.infraPill}><span className={styles.infraDot} />Upstash Redis</span>
            <span className={styles.infraPill}><span className={styles.infraDot} />Inngest Workflows</span>
            <span className={styles.infraPill}><span className={styles.infraDot} />Arcjet Defense</span>
            <span className={styles.infraPill}><span className={styles.infraDot} />Next.js 16 Edge</span>
            <span className={styles.infraPill}><span className={styles.infraDot} />Conform + Zod</span>
            <span className={styles.infraPill}><span className={styles.infraDot} />T3 Env</span>
            <button
              type="button"
              className={styles.plannerToggleBtn}
              onClick={() => setShowPlanner(prev => !prev)}
              aria-expanded={showPlanner}
            >
              <Sparkles size={13} aria-hidden="true" />
              <span>{showPlanner ? (hi ? "प्लानर छिपाएं" : "Hide Goal Planner") : (hi ? "दैनिक लक्ष्य तय करें (Conform)" : "Set Daily Target (Conform & Zod)")}</span>
            </button>
          </div>

          {showPlanner && (
            <ConformStudyGoalForm defaultCategory={category || "technology"} />
          )}
        </div>
      )}
    </section>
  );
}
