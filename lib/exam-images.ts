import { learningImageUrl } from "./learning-image";

/*
 * Pictures for the exam portals: one per Board Exams chapter and one per Competitive Exams exam, painted offline
 * through the Vercel AI Gateway (npm run images:boards, npm run images:competitive) into the learning-images
 * bucket's "exams" folder. A card asks for its picture and hides it when the request fails, so a chapter without a
 * picture yet simply shows its icon.
 */
export const boardChapterImageParts = (cls: string, subject: string, chapter: string) => ["boards", cls, subject, chapter];
export const competitiveExamImageParts = (examId: string) => ["competitive", examId];
/** One picture per subject name, shared by every exam that teaches it (npm run images:competitive-subjects). */
export const competitiveSubjectImageParts = (subject: string) => ["competitive", "subject", subject];

export const boardChapterImage = (cls: string, subject: string, chapter: string) => learningImageUrl("exams", boardChapterImageParts(cls, subject, chapter));
export const competitiveExamImage = (examId: string) => learningImageUrl("exams", competitiveExamImageParts(examId));
/** One picture per IELTS Topics & Themes card (npm run images:ielts). */
export const ieltsTopicImageParts = (topic: string) => ["ielts", topic];
export const ieltsTopicImage = (topic: string) => learningImageUrl("exams", ieltsTopicImageParts(topic));
export const competitiveSubjectImage = (subject: string) => learningImageUrl("exams", competitiveSubjectImageParts(subject));
