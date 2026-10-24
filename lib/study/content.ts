import "server-only";
import { STUDY_UNITS } from "./units";
import type { Language, Tier } from "@/lib/domain";
import type { StudyCourse, StudyPack, StudyQuestion, StudyLesson } from "./types";
import { buildSystemDesignPack } from "./system-design";

/** Shared concepts are deliberately labelled as foundation coverage, never a full exam syllabus. */
export function buildStudyPack(course: StudyCourse, language: Language, tier: Tier, viewerKey: string, admin = false): StudyPack {
  if (course.category === "course") return buildSystemDesignPack(course, language, tier, viewerKey, admin);
  const hi = language === "hi";
  const say = (en: string, hindi: string) => hi ? hindi : en;
  const units = course.subjects.flatMap(subject => {
    return STUDY_UNITS.filter(unit => unit.subject === subject).slice(-6);
  });
  const lessons: StudyLesson[] = units.map(unit => ({ id: unit.id, title: unit.title[language], keyPoints: [
    { tone: "key", title: say("Core idea", "मुख्य विचार"), text: unit.idea[language] },
    { tone: "key", title: say("Rule / syntax", "नियम / संरचना"), text: unit.rule[language] },
    { tone: "key", title: say("Worked question", "हल सहित प्रश्न"), text: unit.example[language] },
    { tone: "tip", title: say("Step-by-step answer", "क्रमबद्ध उत्तर"), text: unit.solution[language] },
    { tone: "warning", title: say("Common mistake", "सामान्य गलती"), text: unit.mistake[language] },
    { tone: "tip", title: say("Explain your reasoning", "अपना तर्क समझाएँ"), text: say(`Explain how this rule leads to the answer: ${unit.rule.en}`, `समझाएँ कि इस नियम से उत्तर कैसे मिलता है: ${unit.rule.hi}`) },
  ] }));
  const questions: StudyQuestion[] = units.flatMap((unit, index) => {
    // Rotate choices consistently in both languages; never make every answer A.
    const offset = index % unit.options.length;
    const options = unit.options.map((_, i) => unit.options[(i + offset) % unit.options.length][language]);
    const common = { unitId: unit.id, explanation: unit.solution[language], importance: index % 3 === 0 ? "high" as const : "medium" as const,
      importanceReason: say("Editorial priority: this concept supports the worked problem and later applications; not a forecast of examination frequency.", "संपादकीय प्राथमिकता: यह अवधारणा प्रश्न और आगे के अनुप्रयोगों का आधार है; परीक्षा में आने की भविष्यवाणी नहीं।"), origin: "original" as const, appearances: [] };
    return [
      { ...common, id: `${unit.id}-objective`, type: "objective" as const, prompt: unit.question[language], options, correct: (unit.correct - offset + options.length) % options.length, answer: unit.options[unit.correct][language], marks: 1, rubric: [] },
      { ...common, id: `${unit.id}-subjective`, type: "subjective" as const, prompt: say(`Explain ${unit.title.en.toLowerCase()}. Solve the following and justify each step: ${unit.example.en}`, `${unit.title.hi} समझाएँ। निम्न प्रश्न हल करें और चरणों का कारण दें: ${unit.example.hi}`), answer: `${unit.idea[language]}\n${unit.rule[language]}\n${unit.solution[language]}`, marks: 3, rubric: [say("1 mark: state the relevant concept or rule.", "1 अंक: संबंधित अवधारणा या नियम लिखें।"), say("1 mark: apply it to the given information.", "1 अंक: दी गई जानकारी पर लागू करें।"), say("1 mark: justify the conclusion with correct units or usage.", "1 अंक: सही इकाई या प्रयोग सहित निष्कर्ष दें।")] },
    ];
  });
  if (tier === "free" && !admin) throw new Error("subscription_required");
  const preview = false;
  const visibleLessons = lessons;
  const visibleQuestions = questions;
  const objective = visibleQuestions.filter(q => q.type === "objective").map(q => q.id);
  const pack: StudyPack = { course, language, title: course.title[language], lessons: visibleLessons, questions: visibleQuestions,
    papers: ["practice", "sample"].map((kind, index) => ({ id: `${course.id}-${kind}`, title: say(index ? "Sample concept drill" : "Foundation practice test", index ? "नमूना अवधारणा अभ्यास" : "आधारभूत अभ्यास परीक्षा"), kind: kind as "practice" | "sample", minutes: Math.max(2, objective.length * 2), questionIds: index ? objective.filter((_, i) => i % 2 === 0) : objective, marksPerCorrect: 1, negativeMarks: 0, instructions: say("Original, short practice drill. +1 correct, 0 incorrect or unanswered. This is not an official full-length exam paper.", "मौलिक लघु अभ्यास। सही +1, गलत या अनुत्तरित 0। यह आधिकारिक पूर्ण प्रश्न पत्र नहीं है।") })),
    access: { tier, preview, totalLessons: lessons.length, totalQuestions: questions.length, viewerKey },
    coverage: say(`${lessons.length} foundation lessons and ${questions.length} original questions. ${course.scope.en} Full syllabus coverage and a verified past-paper archive are not yet available.`, `${lessons.length} आधारभूत पाठ और ${questions.length} मौलिक प्रश्न। ${course.scope.hi} पूर्ण पाठ्यक्रम और सत्यापित पुराने प्रश्न पत्रों का संग्रह अभी उपलब्ध नहीं है।`),
    sources: [{ title: say("Official syllabus / examination resources", "आधिकारिक पाठ्यक्रम / परीक्षा संसाधन"), url: course.sourceUrl }],
  };
  return pack;
}
