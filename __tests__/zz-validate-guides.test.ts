import { curriculumSchema } from "@/lib/domain";
import { TECHNOLOGY_GUIDES } from "@/lib/generation/guides";
import { enrichLearningNotes } from "@/lib/learning-content";

/**
 * Every hand-authored technology guide, checked against the curriculum schema
 * and against the richness bar the reader renders: each lesson carries a
 * diagram, key points in all three tones, a worked example with code, an
 * exercise, a checkpoint and a mistake, and every vocabulary entry carries at
 * least five synonyms and five antonyms so the vocabulary builder's two lists
 * are never thin.
 */
/**
 * javascript-puzzles is built from predict-the-output exercises through
 * topicLesson(), which produces code-first lessons with no figure. Every other
 * guide is documentation-style and carries a diagram per lesson.
 */
const WITHOUT_DIAGRAMS = new Set(["javascript-puzzles"]);

describe.each(TECHNOLOGY_GUIDES.map(guide => [guide.id, guide] as const))("%s", (_id, guide) => {
  test("validates against the curriculum schema", () => {
    const parsed = curriculumSchema.safeParse(guide.curriculum);
    if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues, null, 2));
  });

  test("technology and topic ids are set", () => {
    expect({ technologyId: guide.technologyId.length > 0, topicId: guide.topicId.length > 0 }).toEqual({ technologyId: true, topicId: true });
  });

  test("every lesson carries a diagram, key points, code and practice", () => {
    // Key points are asserted on the enriched curriculum, which is what the
    // reader renders: promoted mistakes and explanations fill the card set out.
    for (const lesson of enrichLearningNotes(guide.curriculum, "en").lessons) {
      expect({
        title: lesson.title,
        diagram: WITHOUT_DIAGRAMS.has(guide.id) ? true : Boolean(lesson.diagram),
        code: lesson.code.length > 0,
        exercise: lesson.exercise.length > 0,
        checkpoint: lesson.checkpoint.length > 0,
        mistake: lesson.mistake.length > 0,
      }).toEqual({ title: lesson.title, diagram: true, code: true, exercise: true, checkpoint: true, mistake: true });
      expect(lesson.keyPoints!.length).toBeGreaterThanOrEqual(3);
      expect(new Set(lesson.keyPoints!.map(point => point.tone)).size).toBe(3);
    }
  });

  test("vocabulary entries carry five or more synonyms and antonyms", () => {
    for (const lesson of guide.curriculum.lessons) {
      for (const word of lesson.vocabulary ?? []) {
        expect({ word: word.word, synonyms: word.synonyms.length >= 5, antonyms: word.antonyms.length >= 5 })
          .toEqual({ word: word.word, synonyms: true, antonyms: true });
      }
    }
  });
});
