/** @jest-environment node */
import { curriculumSchema } from "@/lib/domain";
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { curriculumNotes } from "@/lib/notes";
import { getStudyNote, NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";

test("Agentic AI course card opens every guide lesson and includes the concise roadmap", () => {
  const guide = DEFAULT_GUIDES.find(item => item.id === "agentic-ai")!;
  expect(curriculumSchema.safeParse(guide.curriculum).success).toBe(true);
  const course = getStudyNote("agentic-ai-course")!;
  expect(course.title).toBe("Agentic AI: building systems that act");
  expect(course.learnInApp).toBe(true);
  expect(course.contents?.map(chapter => chapter.title)).toEqual(guide.curriculum.lessons.map(lesson => lesson.title));
  expect(NOTES_SUMMARIES.find(note => note.id === course.id)?.learnInApp).toBe(true);
  for (const chapter of course.contents!) expect(getStudyNote(chapter.id)).toBeDefined();
  const recap = guide.curriculum.lessons.at(-1)!;
  expect(recap.keyPoints?.filter(point => point.title?.startsWith("Feature:"))).toHaveLength(5);
  expect(recap.keyPoints?.filter(point => point.title?.startsWith("Topic:"))).toHaveLength(5);
  expect(recap.keyPoints?.filter(point => point.title?.startsWith("Step "))).toHaveLength(6);
  const exported = curriculumNotes(guide.curriculum, guide.curriculum.title, "en");
  for (const point of recap.keyPoints!) expect(exported).toContain(point.text);
  const note = getStudyNote(course.contents!.at(-1)!.id)!;
  for (const point of recap.keyPoints!) expect(note.points.join("\n")).toContain(point.text);
});
