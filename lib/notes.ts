import { Curriculum, labelledOption, optionLetter, Language } from "./domain";
import { enrichLearningNotes } from "./learning-content";

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
export function curriculumNotes(deck: Curriculum, title: string, language: Language): string {
  deck = enrichLearningNotes(deck, language);
  const hi = language === "hi";
  const lines: string[] = [title, `${deck.minutes} ${hi ? "मिनट" : "minutes"}`];
  const heading = (text: string) => { lines.push(""); lines.push(text.toUpperCase()); };

  heading(hi ? "आप क्या सीखेंगे" : "What you'll learn");
  deck.objectives.forEach(o => lines.push(`- ${o}`));

  if (deck.prerequisites.length) {
    heading(hi ? "शुरू करने से पहले" : "Before you begin");
    deck.prerequisites.forEach(p => lines.push(`- ${p}`));
  }

  if (deck.services?.length) {
    heading(hi ? "सेवाएँ, बिंदुवार" : "Services, explained pointwise");
    for (const service of deck.services) {
      lines.push("", `${service.name} (${service.category})`, service.summary);
      service.points.forEach(point => lines.push(`- ${point}`));
    }
  }
  if (deck.codeExamples?.length) {
    heading(hi ? "इस विषय के दो प्रोजेक्ट" : "Two projects for this topic");
    for (const example of deck.codeExamples) {
      lines.push("", example.title, example.description, "", hi ? "प्रोजेक्ट संरचना:" : "Project structure:");
      example.files.forEach(file => lines.push(`  project/${file.path}`));
      example.files.forEach(file => lines.push("", `--- project/${file.path} (${file.language}) ---`, file.description, file.code));
      lines.push("", hi ? "सेटअप और चलाएँ:" : "Set up & run:", ...example.setup.map((step, index) => `${index + 1}. ${step}`));
      lines.push("", hi ? "अपेक्षित परिणाम:" : "Expected result:", example.expectedOutput);
      for (const api of example.apiReference ?? []) {
        lines.push(`${api.name} (${api.kind}): ${api.signature}`);
        api.params.forEach(param => lines.push(`  ${param.name} (${param.type}): ${param.description}`));
        lines.push(`  ${hi ? "रिटर्न" : "Returns"}: ${api.returns}`);
        if (api.notes) lines.push(`  ${api.notes}`);
      }
    }
  }

  deck.lessons.forEach((lesson, i) => {
    heading(`${hi ? "पाठ" : "Lesson"} ${i + 1}: ${lesson.title}`);
    if (lesson.diagram) {
      lines.push(hi ? "यह कैसे काम करता है:" : "How it fits together:");
      lesson.diagram.items.forEach((item, index) => lines.push(`${"  ".repeat(item.depth ?? 0)}${lesson.diagram!.kind === "flow" ? `${index + 1}. ` : "- "}${item.label}${item.detail ? ` — ${item.detail}` : ""}`));
      lines.push(lesson.diagram.caption, "");
    }
    lines.push(hi ? "समझें:" : "The idea:", lesson.explanation);
    if (lesson.keyPoints?.length) {
      lines.push("", hi ? "मुख्य बातें:" : "Key points:");
      lesson.keyPoints.forEach(p => {
        lines.push(`- [${p.tone.toUpperCase()}] ${p.title ? `${p.title}: ` : ""}${p.text}`);
        if (p.example) lines.push(`    e.g. ${p.example}`);
      });
    }
    lines.push("", hi ? "उदाहरण:" : "Example:", lesson.example);
    if (lesson.useCase) lines.push("", hi ? "वास्तविक उपयोग:" : "Real-world use case:", `- Scenario: ${lesson.useCase.scenario}`, `- Example: ${lesson.useCase.example}`, `- Usage: ${lesson.useCase.usage}`);
    if (lesson.code) lines.push("", hi ? "कोड:" : "Code:", lesson.code);
    for (const example of lesson.codeExamples ?? []) {
      lines.push("", `${example.kind === "concept" ? "01" : "02"}. ${example.title}`, example.description, "", hi ? "प्रोजेक्ट संरचना:" : "Project structure:");
      example.files.forEach(file => lines.push(`  project/${file.path}`));
      for (const file of example.files) lines.push("", `--- project/${file.path} (${file.language}) ---`, file.description, file.code);
      if (example.setup.length) lines.push("", hi ? "सेटअप और चलाएँ:" : "Set up & run:", ...example.setup.map((step, index) => `${index + 1}. ${step}`));
      if (example.expectedOutput) lines.push("", hi ? "अपेक्षित परिणाम:" : "Expected result:", example.expectedOutput);
      for (const api of example.apiReference ?? []) {
        lines.push("", `${api.name} (${api.kind}): ${api.signature}`);
        api.params.forEach(param => lines.push(`  ${param.name} (${param.type}): ${param.description}`));
        lines.push(`  ${hi ? "रिटर्न" : "Returns"}: ${api.returns}`);
        if (api.notes) lines.push(`  ${api.notes}`);
      }
    }
    if (lesson.apiReference?.length) {
      lines.push("", hi ? "API संदर्भ:" : "API reference:");
      lesson.apiReference.forEach(a => {
        lines.push(`- ${a.name} (${a.kind}): ${a.signature}`);
        a.params.forEach(p => lines.push(`    ${p.name} (${p.type}): ${p.description}`));
        lines.push(`    Returns: ${a.returns}`);
        if (a.notes) lines.push(`    ${a.notes}`);
      });
    }
    lines.push("", hi ? "अभ्यास:" : "Try it yourself:", lesson.exercise);
    lines.push("", hi ? "समझ जाँचें:" : "Check your understanding:", lesson.checkpoint);
    for (const question of lesson.objectiveQuestions ?? []) {
      lines.push("", question.question, ...question.options.map((option, index) => labelledOption(index, option)));
      lines.push(hi ? "संक्षिप्त उत्तर:" : "Short answer:", `${optionLetter(question.correct)}. ${question.shortAnswer}`, hi ? "विस्तृत व्याख्या:" : "Detailed explanation:", question.explanation);
    }
    lines.push("", hi ? "इस गलती से बचें:" : "Avoid this mistake:", lesson.mistake);
    if (lesson.vocabulary?.length) {
      lines.push("", hi ? "शब्दावली भवन:" : "Vocabulary builder:");
      lesson.vocabulary.forEach(v => lines.push(`- ${v.word}: ${v.meaning} (e.g. "${v.example}") — synonyms: ${v.synonyms.join(", ")}; antonyms: ${v.antonyms.join(", ")}`));
    }
    if (lesson.interview?.length) {
      lines.push("", hi ? "इंटरव्यू प्रश्न:" : "Interview questions:");
      lesson.interview.forEach((q, n) => {
        lines.push("", `Q${n + 1}. ${q.question}`, `    ${hi ? "परिभाषा" : "Definition"}: ${q.definition}`, `    ${hi ? "उत्तर" : "Answer"}: ${q.answer}`);
        if (q.syntax) lines.push(`    ${hi ? "सिंटैक्स" : "Syntax"}:`, ...q.syntax.split("\n").map(l => `      ${l}`));
        if (q.code) lines.push(`    ${hi ? "कोड" : "Code"}:`, ...q.code.split("\n").map(l => `      ${l}`));
        q.similar.forEach(s => lines.push(`    - ${s.question}`, `      ${s.answer}`));
      });
    }
  });

  heading(hi ? "मिनी प्रोजेक्ट" : "Put it together");
  lines.push(deck.project);
  heading(hi ? "सारांश" : "What to remember");
  lines.push(deck.summary);
  heading(hi ? "शब्दावली" : "Glossary");
  deck.glossary.forEach(g => lines.push(`- ${g.term}: ${g.definition}`));
  return lines.join("\n");
}
