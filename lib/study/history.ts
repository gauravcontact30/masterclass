import "server-only";
import type { StudyPack, StudyQuestion } from "./types";
import { appearanceSchema } from "./schemas";
const sourceUrl = "https://jeeadv.ac.in/past_qps/2025_1_English.pdf";
/** Two independently solved, paraphrased questions verified against the official paper. */
export function addVerifiedHistory(pack: StudyPack): StudyPack {
  if (pack.course.id !== "jee-advanced") return pack;
  const hi = pack.language === "hi"; const say = (en: string, hindi: string) => hi ? hindi : en;
  const examples = [
    { number: "Mathematics Q1", page: 1, title: say("Polynomial comparison", "बहुपद तुलना"), prompt: say("Take real-coefficient polynomials f(x)=a₁+10x+a₂x²+a₃x³+x⁴ and g(x)=b₁+3x+b₂x²+b₃x³+x⁴ that never intersect on ℝ. Find the cubic coefficient after computing f(x+1)−g(x+2).", "वास्तविक गुणांक वाले f(x)=a₁+10x+a₂x²+a₃x³+x⁴ और g(x)=b₁+3x+b₂x²+b₃x³+x⁴, ℝ पर कभी बराबर नहीं होते। f(x+1)−g(x+2) में x³ का गुणांक निकालें।"), options: ["8", "2", "−4", "−6"], correct: 2,
      explanation: say("The quartic terms cancel in f−g. If a₃≠b₃, the difference is a real cubic and must have a real zero, contradicting the hypothesis. Thus a₃=b₃. The shifted quartics contribute 4−8=−4 to x³; the cubic terms contribute a₃−b₃=0. Answer: −4.", "f−g में x⁴ कट जाता है। a₃≠b₃ हो तो वास्तविक घन बहुपद का वास्तविक शून्य अवश्य होगा, जो शर्त के विरुद्ध है। अतः a₃=b₃। shifted x⁴ से x³ में 4−8=−4 और घन पदों से 0 मिलता है। उत्तर −4।") },
    { number: "Mathematics Q4", page: 2, title: say("Integer orthogonal matrices", "पूर्णांक लांबिक आव्यूह"), prompt: say("For P=diag(2,2,3), count integer 3×3 matrices Q satisfying QᵀQ=I and PQ=QP.", "P=diag(2,2,3) के लिए QᵀQ=I और PQ=QP पूरा करने वाले पूर्णांक 3×3 आव्यूह Q गिनें।"), options: ["32", "8", "16", "24"], correct: 2,
      explanation: say("Each integer column of an orthogonal matrix has squared length 1, so it has exactly one entry ±1. Such matrices are signed permutations. Commuting with P preserves the two-dimensional eigenvalue-2 subspace and the eigenvalue-3 axis. There are 2!×2² choices in the first block and 2 signs on the final axis: 16.", "लांबिक आव्यूह के हर पूर्णांक स्तंभ की वर्ग लंबाई 1 है, इसलिए एक ही प्रविष्टि ±1 होगी। ये signed permutation हैं। P से क्रमविनिमेयता eigenvalue 2 के द्विविमीय स्थान और eigenvalue 3 अक्ष को सुरक्षित रखती है। पहले block में 2!×2² और अंतिम अक्ष पर 2 चिह्न: कुल 16।") },
  ];
  const questions: StudyQuestion[] = examples.map((item, index) => ({ id: `jee-2025-p1-q${index ? 4 : 1}`, unitId: `jee-history-${index}`, type: "objective", prompt: item.prompt, options: item.options, correct: item.correct, answer: item.options[item.correct], explanation: item.explanation, marks: 3, rubric: [], importance: "high", importanceReason: say("Verified historical example; useful for algebraic reasoning, not a forecast.", "सत्यापित पुराना उदाहरण; बीजीय तर्क के लिए उपयोगी, भविष्यवाणी नहीं।"), origin: "past-paper-adaptation", appearances: [appearanceSchema.parse({ exam: "JEE Advanced", year: 2025, paper: "Paper 1", questionNumber: item.number, sourceUrl, sourcePage: item.page, verified: true })] }));
  const extraLessons = examples.map((item, index) => ({ id: `jee-history-${index}`, title: item.title, keyPoints: [
    { tone: "key" as const, title: say("Historical problem · paraphrased", "पुराना प्रश्न · पुनर्लिखित"), text: item.prompt },
    { tone: "key" as const, title: say("Worked reasoning", "हल का तर्क"), text: item.explanation },
    { tone: "tip" as const, title: say("Answer", "उत्तर"), text: item.options[item.correct] },
    { tone: "key" as const, title: say("Verified location", "सत्यापित स्थान"), text: `JEE Advanced 2025 · Paper 1 · ${item.number} · ${say("PDF page", "स्रोत पृष्ठ")} ${item.page}` },
    { tone: "warning" as const, title: say("Ask rating limits", "आवृत्ति की सीमा"), text: say("Observed in one reviewed paper. One appearance is not evidence that a question is frequently asked across examinations.", "एक जाँचे प्रश्न पत्र में पाया गया। एक बार आना कई परीक्षाओं में बारंबार पूछे जाने का प्रमाण नहीं।") },
    { tone: "tip" as const, title: say("Self-check", "स्वयं जाँचें"), text: say("Reconstruct the argument without viewing the solution, then explain which hypothesis is essential.", "हल देखे बिना तर्क बनाएँ और बताएँ कौन-सी शर्त आवश्यक है।") },
  ] }));
  return { ...pack,
    lessons: pack.access.preview ? pack.lessons : [...pack.lessons, ...extraLessons], questions: pack.access.preview ? pack.questions : [...pack.questions, ...questions],
    reviewedPaperIds: pack.access.preview ? [] : ["JEE Advanced:2025:Paper 1"],
    access: { ...pack.access, totalLessons: pack.access.totalLessons + 2, totalQuestions: pack.access.totalQuestions + 2 },
    coverage: `${pack.coverage} ${say("Two verified, paraphrased Mathematics questions from JEE Advanced 2025 Paper 1 are included in the full guide. The reviewed corpus is one paper, not a complete archive.", "पूर्ण गाइड में JEE Advanced 2025 Paper 1 के दो सत्यापित पुनर्लिखित गणित प्रश्न हैं। जाँचा संग्रह एक प्रश्न पत्र है, पूर्ण archive नहीं।")}`,
    sources: [...pack.sources, { title: say("Verified question source · JEE Advanced 2025 Paper 1", "सत्यापित प्रश्न स्रोत · JEE Advanced 2025 Paper 1"), url: sourceUrl }],
  };
}
