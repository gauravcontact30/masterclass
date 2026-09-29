import { curriculumSchema } from "@/lib/domain";
import { TECHNOLOGY_GUIDES } from "@/lib/generation/guides";
import { enrichLearningNotes } from "@/lib/learning-content";

/**
 * Every hand-authored technology guide, checked against the curriculum schema
 * and against the bar every lesson meets: a worked example with code, an
 * exercise, a checkpoint and a mistake, and key points drawn from the three
 * tones the reader styles. Diagrams and long synonym lists are optional: most
 * lessons after the concise-notes rewrite carry neither, so the reader treats
 * both as extras, and the checks below only require them to be well formed.
 */
/** Overview lessons that map a whole topic out rather than teach one API, so they carry no code. */
const OVERVIEW_LESSONS = new Set(["Agentic AI essentials: key features, topics and roadmap"]);
const TONES = new Set(["key", "tip", "warning"]);

describe.each(TECHNOLOGY_GUIDES.map(guide => [guide.id, guide] as const))("%s", (_id, guide) => {
  test("validates against the curriculum schema", () => {
    const parsed = curriculumSchema.safeParse(guide.curriculum);
    if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues, null, 2));
  });

  test("technology and topic ids are set", () => {
    expect({ technologyId: guide.technologyId.length > 0, topicId: guide.topicId.length > 0 }).toEqual({ technologyId: true, topicId: true });
  });

  test("every lesson carries code and practice, and well-formed key points and diagrams", () => {
    // Key points are asserted on the enriched curriculum, which is what the reader renders.
    for (const lesson of enrichLearningNotes(guide.curriculum, "en").lessons) {
      expect({
        title: lesson.title,
        code: OVERVIEW_LESSONS.has(lesson.title) || lesson.code.length > 0,
        exercise: lesson.exercise.length > 0,
        checkpoint: lesson.checkpoint.length > 0,
        mistake: lesson.mistake.length > 0,
      }).toEqual({ title: lesson.title, code: true, exercise: true, checkpoint: true, mistake: true });
      for (const point of lesson.keyPoints ?? []) expect(TONES.has(point.tone) && point.text.trim().length > 0).toBe(true);
      if (lesson.diagram) expect(JSON.stringify(lesson.diagram).length).toBeGreaterThan(2);
    }
  });

  test("vocabulary entries have a meaning and no blank synonyms or antonyms", () => {
    for (const lesson of guide.curriculum.lessons) {
      for (const word of lesson.vocabulary ?? []) {
        expect(word.meaning.trim()).not.toBe("");
        expect([...word.synonyms, ...word.antonyms].every(item => item.trim().length > 0)).toBe(true);
      }
    }
  });
});
