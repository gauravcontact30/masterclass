import { lessonSchema } from "@/lib/domain";
import { AWS_SERVICE_LESSONS } from "@/lib/generation/guides/aws-service-lessons";
import { DEVOPS_SERVICE_LESSONS } from "@/lib/generation/guides/devops-service-lessons";

test.each([...AWS_SERVICE_LESSONS, ...DEVOPS_SERVICE_LESSONS].map(l => [l.title, l] as const))("%s", (_t, lesson) => {
  const parsed = lessonSchema.safeParse(lesson);
  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues, null, 2));
  expect(lesson.keyPoints!.length).toBeGreaterThanOrEqual(8);
  expect(new Set(lesson.keyPoints!.map(p => p.tone)).size).toBe(3);
  expect(lesson.vocabulary!.length).toBeGreaterThanOrEqual(5);
  expect(lesson.interview!.length).toBeGreaterThanOrEqual(2);
  lesson.interview!.forEach(q => expect(q.similar.length).toBeGreaterThanOrEqual(1));
  expect(lesson.objectiveQuestions!.length).toBeGreaterThanOrEqual(3);
  lesson.objectiveQuestions!.forEach(q => expect(q.options.length).toBe(4));
  expect(lesson.codeExamples).toBeDefined();
  expect(lesson.useCase).toBeDefined();
});
