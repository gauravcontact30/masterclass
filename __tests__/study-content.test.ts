import { STUDY_COURSES, SCHOOL_COURSES, EXAM_COURSES } from "@/lib/study/catalog";
import { SYSTEM_DESIGN_COURSES } from "@/lib/study/system-design-catalog";
import { buildStudyPack } from "@/lib/study/content";
import { STUDY_UNITS } from "@/lib/study/units";
import { askRating, gradePaper } from "@/lib/study/types";
import { canReadStudy, canReadTechnology, isSuperAdminUser, PREPARATIONS, courseCategory } from "@/lib/study/preparations";
import { preparationSchema } from "@/lib/study/preparation-schema";

test("every catalog course has bilingual lessons, answer keys, review rubrics and honest coverage", () => {
  expect(SCHOOL_COURSES).toHaveLength(168); expect(EXAM_COURSES).toHaveLength(20); expect(SYSTEM_DESIGN_COURSES).toHaveLength(12);
  expect(new Set(STUDY_COURSES.map(course => course.id)).size).toBe(STUDY_COURSES.length);
  expect(new Set(STUDY_UNITS.map(unit => unit.id)).size).toBe(STUDY_UNITS.length);
  for (const language of ["en", "hi"] as const) for (const course of STUDY_COURSES) {
    const pack = buildStudyPack(course, language, "monthly", "student");
    expect(pack.lessons.length).toBeGreaterThanOrEqual(3);
    expect(pack.coverage).toBeTruthy(); expect(pack.sources.length).toBeGreaterThan(0);
    expect(new Set(pack.questions.map(q => q.id)).size).toBe(pack.questions.length);
    for (const lesson of pack.lessons) { expect(lesson.keyPoints.length).toBeGreaterThanOrEqual(6); for (const point of lesson.keyPoints) expect(point.text.trim()).not.toBe(""); }
    if (language === "hi") expect(pack.lessons.some(lesson => /[\u0900-\u097f]/.test(lesson.title))).toBe(true);
    for (const question of pack.questions) {
      expect(question.answer).toBeTruthy(); expect(question.explanation).toBeTruthy();
      if (question.type === "objective") expect(question.options?.[question.correct!]).toBe(question.answer);
      else expect(question.rubric.length).toBeGreaterThan(0);
      if (question.origin === "original") expect(question.appearances).toEqual([]);
    }
    for (const paper of pack.papers) {
      const answers = Object.fromEntries(pack.questions.filter(q => paper.questionIds.includes(q.id)).map(q => [q.id, q.correct!]));
      const result = gradePaper(paper, pack.questions, answers);
      expect(result.score).toBe(result.maximum); expect(result.wrong).toBe(0);
      expect(() => gradePaper(paper, pack.questions, { forged: 0 })).toThrow("invalid_answers");
      expect(() => gradePaper(paper, pack.questions, { [paper.questionIds[0]]: 9 })).toThrow("invalid_answers");
    }
  }
});
test("unsubscribed accounts have no preview and paid members receive complete published packs", () => {
  for (const course of STUDY_COURSES) {
    expect(() => buildStudyPack(course, "en", "free", "unsubscribed")).toThrow("subscription_required");
    const paid = buildStudyPack(course, "en", "yearly", "paid");
    expect(paid.access.preview).toBe(false);
    expect(paid.lessons).toHaveLength(paid.access.totalLessons);
    expect(buildStudyPack(course, "en", "free", "admin", true).lessons).toEqual(paid.lessons);
  }
});

test("study and technology access follows explicit choices; role requires a verified exact email", () => {
  const access = { selections: ["cbse-10", "nda", "system-design", "tech:react"], isSuperAdmin: false };
  const visible = STUDY_COURSES.filter(course => canReadStudy(access, course));
  expect(visible).toHaveLength(8 + 1 + 12);
  expect(visible.every(course => course.board === "cbse" && course.grade === 10 || course.id === "nda" || course.category === "course")).toBe(true);
  expect(canReadTechnology(access, "react")).toBe(true); expect(canReadTechnology(access, "python")).toBe(false);
  expect(isSuperAdminUser({ email: "garvcontact30@gmail.com" })).toBe(false);
  expect(isSuperAdminUser({ email: "garvcontact30@gmail.com.evil", email_confirmed_at: "2026-01-01" })).toBe(false);
  expect(isSuperAdminUser({ email: "GARVCONTACT30@GMAIL.COM", email_confirmed_at: "2026-01-01" })).toBe(true);
  expect(preparationSchema.safeParse([]).success).toBe(false);
  expect(preparationSchema.safeParse(["nda", "nda"]).success).toBe(false);
  expect(preparationSchema.safeParse(["isSuperAdmin"]).success).toBe(false);
  expect(preparationSchema.safeParse(PREPARATIONS.map(item => item.id)).success).toBe(true);
  expect(courseCategory(EXAM_COURSES.find(course => course.id === "nda")!)).toBe("defence");
});
test("ask ratings never invent a denominator or predict a future examination", () => {
  expect(askRating([], [])).toEqual({ occurrences: 0, reviewed: 0, percent: null });
  const appearance = { exam: "Example", year: 2025, paper: "1", questionNumber: "2", sourceUrl: "https://example.org/paper", sourcePage: 1, verified: true as const };
  expect(askRating([appearance, appearance], ["Example:2025:1", "Example:2024:1"])).toEqual({ occurrences: 1, reviewed: 2, percent: 50 });
});
