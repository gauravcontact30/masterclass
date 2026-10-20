"use client";

import { useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};
import Image from "next/image";
import type { LibraryEntry } from "@/lib/landing-library";
import dynamic from "next/dynamic";
import type { TechnologyInfo } from "@/lib/technology-catalog";

// The catalog (~80 KB) and its modal load on the first pill click, not with the landing page.
const TechnologyModal = dynamic(() => import("./technology-modal").then(mod => mod.TechnologyModal), { ssr: false });
import { useLanguage } from "./language-provider";
import styles from "./landing-home.module.css";

type TechPill = { id: string; label: string; hi?: string; icon: string };

const TECH_PILLS: TechPill[] = [
  { id: "react", label: "React", icon: "react" },
  { id: "nextjs", label: "Next.js", icon: "nextjs" },
  { id: "typescript", label: "TypeScript", icon: "typescript" },
  { id: "python", label: "Python", icon: "python" },
  { id: "docker", label: "Docker", icon: "docker" },
  { id: "aws", label: "AWS", icon: "aws" },
  { id: "agentic-ai", label: "Agentic AI", hi: "एजेंटिक AI", icon: "claude" },
  { id: "javascript", label: "JavaScript", icon: "javascript" },
  { id: "tailwind", label: "Tailwind CSS", icon: "tailwind" },
  { id: "nodejs", label: "Node.js", icon: "nodejs" },
  { id: "postgresql", label: "PostgreSQL", icon: "postgresql" },
  { id: "zustand", label: "Zustand", icon: "zustand" },
  { id: "tanstack", label: "TanStack", icon: "tanstack" },
  { id: "vitest", label: "Vitest", icon: "vitest" },
  { id: "playwright", label: "Playwright", icon: "playwright" },
  { id: "graphql", label: "GraphQL", icon: "graphql" },
  { id: "redis", label: "Redis", icon: "redis" },
  { id: "git", label: "Git", icon: "git" },
  { id: "kubernetes", label: "Kubernetes", icon: "kubernetes" },
  { id: "fastapi", label: "FastAPI", icon: "fastapi" },
  { id: "mongodb", label: "MongoDB", icon: "mongodb" },
  { id: "supabase", label: "Supabase", icon: "supabase" },
  { id: "rust", label: "Rust", icon: "rust" },
  { id: "go", label: "Go", icon: "go" },
  { id: "linux", label: "Linux", icon: "linux" },
  { id: "angular", label: "Angular", icon: "angular" },
  { id: "vue", label: "Vue.js", icon: "vue" },
  { id: "flutter", label: "Flutter", icon: "flutter" },
  { id: "django", label: "Django", icon: "django" },
  { id: "express", label: "Express", icon: "express" },
  { id: "nestjs", label: "NestJS", icon: "nestjs" },
];

/**
 * A fast, calm marquee ribbon of technologies right below the hero slider.
 * Styled in light pastel pills with individual colors and official PNG icons,
 * perfectly centered and aligned with technology names.
 * Clicking any pill opens a professional detailed modal dialog.
 */
export function SubjectRibbon({ entries }: { entries?: LibraryEntry[] }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [activeTech, setActiveTech] = useState<TechnologyInfo | null>(null);
  // The second copy only makes the marquee loop seamlessly. It is aria-hidden and decorative, so it is added after
  // hydration instead of doubling the ribbon's server HTML (31 pills and 31 images).
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  const handlePillClick = async (techId: string, label: string) => {
    const { TECHNOLOGIES_CATALOG } = await import("@/lib/technology-catalog");
    const found = TECHNOLOGIES_CATALOG[techId];
    if (found) {
      setActiveTech(found);
    } else {
      // Fallback in case an entry isn't in catalog
      setActiveTech({
        id: techId,
        name: label,
        icon: techId,
        category: { en: "Technology Track", hi: "तकनीक ट्रैक" },
        tagline: {
          en: `Hands-on guides and real-world code architecture with ${label}.`,
          hi: `${label} के साथ व्यावहारिक मार्गदर्शिका और वास्तविक कोड आर्किटेक्चर।`,
        },
        summary: {
          en: `Explore comprehensive lessons, interactive quizzes, interview preparation, and worked projects for ${label} in MasterClass.`,
          hi: `MasterClass में ${label} के लिए विस्तृत पाठ, इंटरएक्टिव क्विज़, इंटरव्यू अभ्यास और प्रोजेक्ट्स देखें।`,
        },
        command: `npx ${techId}@latest`,
        topicsCount: 30,
        keyFeatures: [
          { en: `Core concepts and architecture patterns for ${label}`, hi: `${label} के मूल सिद्धांत और आर्किटेक्चर पैटर्न` },
          { en: "Production-ready best practices and deployment workflows", hi: "प्रोडक्शन-रेडी सर्वोत्तम अभ्यास और डिप्लॉयमेंट कार्यप्रणाली" },
          { en: "Interactive code examples and step-by-step guides", hi: "इंटरैक्टिव कोड उदाहरण और चरणबद्ध गाइड" },
          { en: "Common pitfalls and performance tuning techniques", hi: "सामान्य गलतियाँ और परफ़ॉर्मेंस सुधारने की तकनीकें" },
        ],
        interviewTopics: [
          { en: `Key architectural trade-offs in ${label}`, hi: `${label} में मुख्य आर्किटेक्चरल समझौते` },
          { en: "Debugging common production bottlenecks", hi: "प्रोडक्शन की समस्याओं को डीबग करना" },
        ],
        officialDocUrl: "https://courses#technology",
      });
    }
  };

  return (
    <>
      <section
        className={styles.ribbon}
        aria-label={hi ? "लोकप्रिय तकनीकें और कौशल" : "Popular technologies and skills"}
      >
        <div className={styles.ribbonTrack}>
          {(hydrated ? [0, 1] : [0]).map(copy => (
            <ul
              key={copy}
              className={styles.ribbonSet}
              aria-hidden={copy === 1 || undefined}
            >
              {TECH_PILLS.map((item, index) => (
                <li
                  key={`${copy}-${item.id}`}
                  data-tone={index % 15}
                  title={hi && item.hi ? item.hi : item.label}
                >
                  <button
                    type="button"
                    className={styles.ribbonPillButton}
                    onClick={() => void handlePillClick(item.id, item.label)}
                    tabIndex={copy === 1 ? -1 : undefined}
                    aria-haspopup="dialog"
                  >
                    <span className={styles.pillIconBadge} aria-hidden="true">
                      <Image
                        src={`/images/tech/${item.icon}.png`}
                        alt=""
                        width={14}
                        height={14}
                      />
                    </span>
                    <span className={styles.pillLabel}>
                      {hi && item.hi ? item.hi : item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {activeTech && (
        <TechnologyModal
          tech={activeTech}
          onClose={() => setActiveTech(null)}
        />
      )}
    </>
  );
}
