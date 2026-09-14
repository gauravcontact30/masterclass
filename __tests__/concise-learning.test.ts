import { conciseStudyNote, uniqueLearningPoints } from "@/lib/concise-learning";
import { lessonKeyPoints } from "@/lib/learning-content";
import type { StudyNote } from "@/lib/notes-study";
import type { Lesson } from "@/lib/domain";

test("deduplicates formatting variations without conflating technical facts", () => {
  expect(uniqueLearningPoints(["• Use TLS.", "Use TLS", "Remember the mechanism: Use TLS.", "Apply it in practice: A string", "Use TLS 1.3", "C++", "C#"], ["Unrelated"])).toEqual(["Use TLS.", "Use TLS 1.3", "C++", "C#"]);
});

test("a lesson keeps each fact and code block once without mutating its source", () => {
  const note: StudyNote = {
    id: "test", technology: "node", title: "Event loop", category: "Runtime", kinds: [], description: "Callbacks run on the event loop.",
    points: ["Callbacks run on the event loop.", "Avoid blocking work.", "Avoid blocking work."],
    examples: [{ title: "Example", points: ["Read files asynchronously."], code: "await readFile(path);" }],
    sections: [{ title: "Example again", points: ["Read files asynchronously."], code: "await readFile(path);" }, { title: "Boundary", points: ["Handle failures."] }],
    useCases: [{ title: "Repeated", points: ["Read files asynchronously."] }], interview: [], questions: [], vocabulary: [],
  };
  const original = JSON.stringify(note);
  const clean = conciseStudyNote(note);
  expect(clean.points).toEqual(["Avoid blocking work."]);
  expect(clean.examples).toHaveLength(1);
  expect(clean.sections).toEqual([{ title: "Boundary", points: ["Handle failures."], code: undefined }]);
  expect(clean.useCases).toEqual([]);
  expect(conciseStudyNote(clean)).toEqual(clean);
  expect(JSON.stringify(note)).toBe(original);
});

test("key point cards do not repeat the explanation or warning", () => {
  const lesson = { explanation: "Use asynchronous I/O.", example: "Read a file.", mistake: "Do not block the loop.", keyPoints: [
    { tone: "key", title: "Idea", text: "Use asynchronous I/O." },
    { tone: "warning", title: "Warning", text: "Do not block the loop." },
    { tone: "tip", title: "Extra detail", text: "Close resources after use." },
  ] } as Lesson;
  expect(lessonKeyPoints(lesson, "en").map(point => point.text)).toEqual(["Close resources after use."]);
});
