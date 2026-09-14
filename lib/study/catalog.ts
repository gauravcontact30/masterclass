import { bi, type Board, type StudyCourse, type StudySubject } from "./types";
import { SYSTEM_DESIGN_COURSES } from "./system-design-catalog";

export const SUBJECTS = {
  maths: bi("Maths", "गणित"), english: bi("English", "अंग्रेज़ी"), chemistry: bi("Chemistry", "रसायन विज्ञान"), physics: bi("Physics", "भौतिक विज्ञान"),
  vocabulary: bi("Vocabulary", "शब्दावली"), ielts: bi("IELTS", "IELTS"), synonyms: bi("Synonyms", "पर्यायवाची"), antonyms: bi("Antonyms", "विलोम शब्द"),
  biology: bi("Biology", "जीव विज्ञान"), reasoning: bi("Reasoning", "तर्कशक्ति"), "general-studies": bi("General studies", "सामान्य अध्ययन"),
  "system-design": bi("System Design", "सिस्टम डिज़ाइन"),
};
export const BOARD_INFO = {
  cbse: { title: "CBSE", grades: [6, 7, 8, 9, 10, 11, 12], url: "https://cbseacademic.nic.in/curriculum_2027.html", description: bi("Central Board of Secondary Education", "केंद्रीय माध्यमिक शिक्षा बोर्ड") },
  ncert: { title: "NCERT", grades: [6, 7, 8, 9, 10, 11, 12], url: "https://ncert.nic.in/textbook.php", description: bi("Textbook and concept resources · NCERT is not an examination board", "पाठ्यपुस्तक और अवधारणा संसाधन · NCERT परीक्षा बोर्ड नहीं है") },
  icse: { title: "ICSE", grades: [6, 7, 8, 9, 10], url: "https://cisce.org/", description: bi("CISCE school preparation through Class 10", "कक्षा 10 तक CISCE विद्यालय तैयारी") },
  isc: { title: "ISC", grades: [11, 12], url: "https://cisce.org/", description: bi("CISCE senior secondary preparation · Classes 11–12", "CISCE उच्चतर माध्यमिक तैयारी · कक्षा 11–12") },
} as const;
const schoolSubjects: StudySubject[] = ["maths", "english", "chemistry", "physics", "vocabulary", "ielts", "synonyms", "antonyms"];
export const SCHOOL_COURSES: StudyCourse[] = (Object.entries(BOARD_INFO) as [Board, typeof BOARD_INFO[Board]][]).flatMap(([board, info]) => info.grades.flatMap(grade => schoolSubjects.map(subject => ({
  id: `${board}-${grade}-${subject}`, category: "school" as const, board, grade, subject, subjects: [subject], aliases: [`class ${grade}`, `${grade}th`, `${grade}वीं`, info.title], sourceUrl: info.url,
  title: bi(`${info.title} · Class ${grade} · ${SUBJECTS[subject].en}`, `${info.title} · कक्षा ${grade} · ${SUBJECTS[subject].hi}`),
  scope: ["vocabulary", "ielts", "synonyms", "antonyms"].includes(subject)
    ? bi("Supplementary language practice; not a separate board-exam subject. IELTS tasks remain in English with Hindi guidance.", "पूरक भाषा अभ्यास; अलग बोर्ड परीक्षा विषय नहीं। IELTS के कार्य अंग्रेज़ी में और मार्गदर्शन हिन्दी में हैं।")
    : grade < 11 && ["physics", "chemistry"].includes(subject)
      ? bi("Science concepts organized by discipline. Follow your school's current integrated Science syllabus.", "विज्ञान की अवधारणाएँ विषयानुसार। अपने विद्यालय का वर्तमान विज्ञान पाठ्यक्रम देखें।")
      : bi("Concept notes and original practice. Use the linked board syllabus to check current chapter coverage.", "अवधारणा नोट्स और मौलिक अभ्यास। वर्तमान अध्यायों के लिए संबंधित बोर्ड का पाठ्यक्रम देखें।"),
}))));
const exam = (id: string, title: string, hindi: string, subjects: StudySubject[], sourceUrl: string, aliases: string[] = []): StudyCourse => ({ id, title: bi(title, hindi), category: "exam", subjects, sourceUrl, aliases,
  scope: bi("Foundational preparation and original practice, not a complete official exam syllabus or an official question paper.", "आधारभूत तैयारी और मौलिक अभ्यास; पूर्ण आधिकारिक पाठ्यक्रम या आधिकारिक प्रश्न पत्र नहीं।") });
const aptitude: StudySubject[] = ["maths", "reasoning", "english", "general-studies"];
export const EXAM_COURSES: StudyCourse[] = [
  exam("nda", "NDA / NA", "NDA / NA", ["maths", "english", "physics", "chemistry", "general-studies"], "https://upsc.gov.in/examinations/previous-question-papers", ["defence", "army"]),
  ...["CGL", "CHSL", "MTS", "GD", "CPO", "JE"].map(name => exam(`ssc-${name.toLowerCase()}`, `SSC ${name}`, `SSC ${name}`, aptitude, "https://ssc.gov.in/", ["government", "सरकारी", "ssc"])),
  exam("jee-main", "JEE Main · IIT pathway", "JEE Main · IIT तैयारी", ["maths", "physics", "chemistry"], "https://jeemain.nta.nic.in/", ["iit", "engineering"]),
  exam("jee-advanced", "JEE Advanced · IIT", "JEE Advanced · IIT", ["maths", "physics", "chemistry"], "https://jeeadv.ac.in/archive.html", ["iit"]),
  exam("neet", "NEET UG · Medical entrance", "NEET UG · चिकित्सा प्रवेश", ["physics", "chemistry", "biology"], "https://neet.nta.nic.in/", ["cpmt", "medical", "सीपीएमटी"]),
  exam("upsc-cse", "UPSC Civil Services", "UPSC सिविल सेवा", ["general-studies", "reasoning", "english", "maths"], "https://upsc.gov.in/examinations/previous-question-papers", ["ias", "ips", "csat"]),
  exam("cds", "UPSC CDS", "UPSC CDS", aptitude, "https://upsc.gov.in/examinations/previous-question-papers", ["defence"]),
  exam("capf", "UPSC CAPF", "UPSC CAPF", aptitude, "https://upsc.gov.in/examinations/previous-question-papers"),
  ...["PO", "Clerk"].map(name => exam(`ibps-${name.toLowerCase()}`, `IBPS ${name}`, `IBPS ${name}`, aptitude, "https://www.ibps.in/", ["banking"])),
  ...["NTPC", "Group D"].map(name => exam(`rrb-${name.toLowerCase().replaceAll(" ", "-")}`, `Railway RRB ${name}`, `रेलवे RRB ${name}`, aptitude, "https://www.rrbcdg.gov.in/", ["railway"])),
  exam("ctet", "CTET · Teaching aptitude", "CTET · शिक्षण योग्यता", ["english", "maths", "reasoning"], "https://ctet.nic.in/", ["teacher", "tet"]),
  exam("state-exams", "State government exams · Common foundations", "राज्य सरकारी परीक्षाएँ · सामान्य आधार", aptitude, "https://www.india.gov.in/topics/jobs", ["pcs", "psc", "police", "state", "government"]),
  exam("ielts", "IELTS Academic · Language practice", "IELTS Academic · भाषा अभ्यास", ["ielts", "vocabulary", "synonyms", "antonyms", "english"], "https://ielts.org/take-a-test/preparation-resources/sample-test-questions", ["language"]),
];
export const STUDY_COURSES = [...SCHOOL_COURSES, ...EXAM_COURSES, ...SYSTEM_DESIGN_COURSES];
export function findStudyCourse(id: string) { return STUDY_COURSES.find(course => course.id === id); }
