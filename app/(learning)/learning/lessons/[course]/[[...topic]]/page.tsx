import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { DeepCourseView } from "@/components/deep-course-view";
import { GeneratingCourse } from "@/components/deep-course-generating";
import { deepCourseMeta, isCourseId } from "@/lib/deep-courses";
import { generatedCourseMeta } from "@/lib/deep-courses/catalog";
import { loadDeepCourse } from "@/lib/deep-courses/load";
import { cachedGeneratedCourse } from "@/lib/server/course-generator";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import type { DeepCourse } from "@/lib/deep-courses/types";
import { signInFor } from "@/lib/safe-redirect";

type Params = Promise<{ course: string; topic?: string[] }>;

/**
 * An in-depth course (/learning/lessons/core-java) or one of its topics (/learning/lessons/core-java/oop). The six
 * hand-written courses load from lib/deep-courses; every other technology's course is written on first open
 * (lib/server/course-generator.ts) and read from Supabase afterwards.
 */
async function courseFor(id: string): Promise<{ course: DeepCourse; ready: boolean; missingTable?: boolean } | null> {
  if (isCourseId(id)) return { course: await loadDeepCourse(id), ready: true };
  if (!generatedCourseMeta(id)) return null;
  try {
    const loaded = await cachedGeneratedCourse(id);
    return loaded ? { course: loaded.course, ready: loaded.state === "ready" } : null;
  } catch {
    // Migration 0044 not applied yet: show the course as not available rather than failing the page.
    return { course: { ...generatedCourseMeta(id)!, intro: [], topics: [] }, ready: false, missingTable: true };
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { course, topic } = await params;
  const meta = deepCourseMeta(course) ?? generatedCourseMeta(course);
  if (!meta) return { title: "Lessons · Professional Learn" };
  if (!topic?.[0]) return { title: `${meta.name} · In-depth course` };
  const found = (await courseFor(course))?.course.topics.find(item => item.id === topic[0]);
  return { title: found ? `${found.title} · ${meta.name}` : `${meta.name} · In-depth course` };
}

export default async function DeepCoursePage({ params }: { params: Params }) {
  const { course: courseId, topic } = await params;
  if (topic && topic.length > 1) notFound();
  if (!isCourseId(courseId) && !generatedCourseMeta(courseId)) notFound();
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser(`/learning/lessons/${courseId}${topic?.[0] ? `/${topic[0]}` : ""}`) : null;
  if (authConfigured() && !user) redirect(signInFor(`/learning/lessons/${courseId}${topic?.[0] ? `/${topic[0]}` : ""}`));
  const found = await courseFor(courseId);
  if (!found) notFound();
  const { course, ready, missingTable } = found;
  if (ready && topic?.[0] && !course.topics.some(item => item.id === topic[0])) notFound();
  const content = ready
    ? <DeepCourseView course={course} topicId={topic?.[0]}/>
    : <GeneratingCourse trackId={course.id} name={course.name} glyph={course.glyph} unavailable={missingTable}/>;
  return <Workspace initialCategory="lessons" autoCollapse authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={content}/>;
}
