import "server-only";
import { Suspense } from "react";
import lessonsData from "@/lib/pro-learn/lessons.json";
import type { ProLesson } from "@/lib/pro-learn/types";
import { ProInterview } from "@/components/pro-interview";
import { ProLessons } from "@/components/pro-lessons";
import { DeepCourseShelf } from "@/components/deep-course-shelf";
import { ProMentor } from "@/components/pro-mentor";
import { ProQuiz } from "@/components/pro-quiz";
import { aiAvailable, libraryQuizTracks } from "./pro-learn-ai";

export type ProSection = "lessons" | "quiz" | "interview" | "mentors";
export const PRO_SECTION_TITLES: Record<ProSection, string> = { lessons: "Lessons", quiz: "Quiz", interview: "Interview", mentors: "Mentors" };

/** Server-rendered content for a professional learning section. */
export function proSectionContent(section: ProSection) {
  const aiReady = aiAvailable();
  const content = section === "lessons" ? <><DeepCourseShelf/><ProLessons lessons={lessonsData as ProLesson[]} aiReady={aiReady}/></>
    : section === "quiz" ? <ProQuiz aiReady={aiReady} libraryTracks={libraryQuizTracks()}/>
    : section === "interview" ? <ProInterview aiReady={aiReady}/>
    : <ProMentor aiReady={aiReady}/>;
  return <Suspense fallback={<p role="status">Loading {PRO_SECTION_TITLES[section].toLowerCase()}…</p>}>{content}</Suspense>;
}
