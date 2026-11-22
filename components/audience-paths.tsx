"use client";
import { useIndiaAccess } from "./audience-provider";
import { useLanguage } from "./language-provider";

export type AudienceLink = { href: string; label: string; hint: string; prefetch?: boolean };
export type AudienceGroup = { id: "tech" | "boards" | "government"; title: string; note: string; scope: "world" | "india"; links: AudienceLink[] };

/** The audience groups behind "Learning paths": worldwide tech learning, plus India-only exam prep once geo allows it. */
export function useAudienceGroups(): AudienceGroup[] {
  const india = useIndiaAccess(); const { language } = useLanguage(); const hi = language === "hi";
  const groups: AudienceGroup[] = [{
    id: "tech", scope: "world",
    title: hi ? "टेक पेशेवर और कॉलेज विद्यार्थी" : "Tech professionals & college students",
    note: hi ? "दुनिया भर में उपलब्ध" : "Available worldwide",
    links: [
      { href: "/learning", label: hi ? "लर्निंग डैशबोर्ड" : "Learning Dashboard", hint: hi ? "कोर्स, नोट्स और प्रगति एक जगह" : "Courses, notes and progress in one place" },
      { href: "/tech-buzz", label: "Tech Buzz", hint: hi ? "टेक में इस हफ़्ते क्या बदला" : "What changed in tech this week" },
      { href: "/learning/ielts", label: hi ? "IELTS की तैयारी" : "IELTS preparation", hint: hi ? "चारों मॉड्यूल का अभ्यास" : "Practise all four modules" },
    ],
  }];
  if (india) groups.push(
    {
      id: "boards", scope: "india",
      title: hi ? "बोर्ड परीक्षा के विद्यार्थी" : "Board exam aspirants",
      note: hi ? "भारत में कक्षा 10 और 12 के लिए UP Board, CBSE और ICSE / ISC" : "UP Board, CBSE and ICSE / ISC for Class 10 and 12 in India",
      links: [{ href: "/exams/board-exams", label: hi ? "बोर्ड परीक्षाओं की तैयारी" : "Prepare for board exams", hint: hi ? "अध्यायवार नोट्स और अभ्यास" : "Chapter-wise notes and practice", prefetch: false }],
    },
    {
      id: "government", scope: "india",
      title: hi ? "भारतीय सरकारी नौकरी के अभ्यर्थी" : "Indian government job seekers",
      note: hi ? "Defence, Banks, Railways, Police, IAS, PCS और UPSC" : "Defence, Banks, Railways, Police, IAS, PCS and UPSC",
      links: [{ href: "/exams/competitive-exams", label: hi ? "सरकारी परीक्षाओं की तैयारी" : "Prepare for government exams", hint: hi ? "Defence, Banks, Railways, Police, UPSC" : "Defence, Banks, Railways, Police, UPSC", prefetch: false }],
    });
  return groups;
}
