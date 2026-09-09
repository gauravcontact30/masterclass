import { Curriculum } from "./domain";

/**
 * Plain-text, point-wise notes derived from a generated curriculum — the
 * "Copy notes" material in the dashboard library, alongside the PDF and the
 * PPTX. Every lesson field it prints (explanation, example, exercise,
 * checkpoint, mistake) already arrives bullet-formatted from the generation
 * prompt (see lib/generation/provider.ts), so this is a plain-text layout of
 * the same points the PDF pages render, not a re-summary.
 *
 * No "server-only" import: this runs in the browser, built from a document
 * already fetched over the authenticated API, so the notes can be copied
 * without a network round trip once the curriculum is in hand.
 */
export function curriculumNotes(deck: Curriculum, title: string, language: "en" | "hi"): string {
  const hi = language === "hi";
  const lines: string[] = [title, `${deck.minutes} ${hi ? "मिनट" : "minutes"}`];
  const heading = (text: string) => { lines.push(""); lines.push(text.toUpperCase()); };

  heading(hi ? "आप क्या सीखेंगे" : "What you'll learn");
  deck.objectives.forEach(o => lines.push(`- ${o}`));

  if (deck.prerequisites.length) {
    heading(hi ? "शुरू करने से पहले" : "Before you begin");
    deck.prerequisites.forEach(p => lines.push(`- ${p}`));
  }

  deck.lessons.forEach((lesson, i) => {
    heading(`${hi ? "पाठ" : "Lesson"} ${i + 1}: ${lesson.title}`);
    lines.push(hi ? "समझें:" : "The idea:", lesson.explanation);
    lines.push("", hi ? "उदाहरण:" : "Example:", lesson.example);
    if (lesson.code) lines.push("", hi ? "कोड:" : "Code:", lesson.code);
    lines.push("", hi ? "अभ्यास:" : "Try it yourself:", lesson.exercise);
    lines.push("", hi ? "समझ जाँचें:" : "Check your understanding:", lesson.checkpoint);
    lines.push("", hi ? "इस गलती से बचें:" : "Avoid this mistake:", lesson.mistake);
  });

  heading(hi ? "मिनी प्रोजेक्ट" : "Put it together");
  lines.push(deck.project);
  heading(hi ? "सारांश" : "What to remember");
  lines.push(deck.summary);
  heading(hi ? "शब्दावली" : "Glossary");
  deck.glossary.forEach(g => lines.push(`- ${g.term}: ${g.definition}`));

  return lines.join("\n");
}
