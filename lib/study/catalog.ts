import { bi, type StudyCourse, type StudySubject } from "./types";
import { SYSTEM_DESIGN_COURSES } from "./system-design-catalog";

export const SUBJECTS = {
  english: bi("English", "अंग्रेज़ी"), vocabulary: bi("Vocabulary", "शब्दावली"), ielts: bi("IELTS", "IELTS"), synonyms: bi("Synonyms", "पर्यायवाची"), antonyms: bi("Antonyms", "विलोम शब्द"),
  "system-design": bi("System Design", "सिस्टम डिज़ाइन"),
};
/*
 * MasterClass Buddy currently serves tech professionals, so the school courses (CBSE, NCERT, ICSE and ISC, Class 6 to
 * Class 12) and the government and entrance exam courses were removed on 2026-10-24. They come back by adding their
 * courses here and their categories in ./preparations.ts; git history has the earlier lists.
 */
const exam = (id: string, title: string, hindi: string, subjects: StudySubject[], sourceUrl: string, aliases: string[] = []): StudyCourse => ({ id, title: bi(title, hindi), category: "exam", subjects, sourceUrl, aliases,
  scope: bi("Foundational preparation and original practice, not a complete official exam syllabus or an official question paper.", "आधारभूत तैयारी और मौलिक अभ्यास; पूर्ण आधिकारिक पाठ्यक्रम या आधिकारिक प्रश्न पत्र नहीं।") });
/** Language preparation: IELTS Academic with vocabulary, synonyms and antonyms. */
export const LANGUAGE_COURSES: StudyCourse[] = [
  exam("ielts", "IELTS Academic · Language practice", "IELTS Academic · भाषा अभ्यास", ["ielts", "vocabulary", "synonyms", "antonyms", "english"], "https://ielts.org/take-a-test/preparation-resources/sample-test-questions", ["language"]),
];
export const STUDY_COURSES = [...LANGUAGE_COURSES, ...SYSTEM_DESIGN_COURSES];
export function findStudyCourse(id: string) { return STUDY_COURSES.find(course => course.id === id); }
