import { contentIdentity } from "./concise-learning";
import type { CodeExample, Curriculum, ExampleFile, KeyPoint, Lesson } from "./domain";

const lines = (text: string) => text.split("\n").map(line => line.replace(/^\s*[-•]\s*/, "").trim()).filter(Boolean);

/** Keep authored key points only when they add information to the lesson. */
export function lessonKeyPoints(lesson: Lesson, language: "en" | "hi"): KeyPoint[] {
  void language;
  const seen = new Set([lesson.explanation, lesson.example, lesson.mistake,
    ...Object.values(lesson.useCase ?? {}),
    ...(lesson.apiReference ?? []).flatMap(api => [api.notes ?? "", api.returns, `Returns: ${api.returns}${api.notes ? ` ${api.notes}` : ""}`]),
  ].flatMap(lines).map(contentIdentity));
  return (lesson.keyPoints ?? []).filter(point => {
    const key = contentIdentity(point.text);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function fileLanguage(path: string): ExampleFile["language"] {
  const extension = path.split(".").pop()?.toLowerCase();
  return ({ ts: "typescript", tsx: "tsx", js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "jsx", py: "python", json: "json", yaml: "yaml", yml: "yaml", sh: "bash", css: "css", html: "html", md: "markdown", tf: "hcl" } as Record<string, ExampleFile["language"]>)[extension ?? ""] ?? (path.endsWith("Dockerfile") ? "dockerfile" : "text");
}

/** Preserve explicit file markers in the original lessons, including nested route paths. */
export function snippetFiles(code: string, technology: string, description: string): ExampleFile[] {
  const fallback = /python/.test(technology) ? "example.py" : /react|next|zustand|tanstack/.test(technology) ? "example.tsx" : /devops|aws|claude/.test(technology) ? "example.txt" : "example.ts";
  const files: ExampleFile[] = [];
  let path = fallback;
  let buffer: string[] = [];
  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content) {
      const existing = files.find(file => file.path === path);
      if (existing) existing.code += `\n\n${content}`;
      else files.push({ path, language: fileLanguage(path), code: content, description });
    }
    buffer = [];
  };
  for (const line of code.split("\n")) {
    const marker = line.match(/^\s*(?:\/\/|#)\s+((?:[\w@.()[\]-]+\/)*[\w.[\]-]+\.(?:tsx?|jsx?|mjs|cjs|py|json|ya?ml|md|sh|css|html|tf))(?=\s|$)/);
    if (marker) { flush(); path = marker[1]; }
    else buffer.push(line);
  }
  flush();
  return files;
}

/** Backwards compatibility: old excerpts stay labelled as excerpts, never as runnable projects. */
export function lessonCodeExamples(lesson: Lesson, technology: string, language: "en" | "hi"): CodeExample[] {
  if (lesson.codeExamples?.length) return lesson.codeExamples;
  if (!lesson.code) return [];
  const hi = language === "hi";
  // Every distinct code block the lesson already carries becomes its own worked
  // example: the lesson's own listing, then each interview question that ships
  // code. That turns a lesson with three answered questions into four examples
  // rather than two, without inventing code the lesson never contained.
  const seen = new Set([lesson.code]);
  const examples: CodeExample[] = [{
    kind: "concept", title: hi ? "समझें और पढ़ें" : "Read the implementation",
    description: [lesson.example, lesson.useCase ? `${hi ? "वास्तविक उपयोग" : "Where this is used"}: ${lesson.useCase.scenario}` : ""].filter(Boolean).join("\n\n"),
    files: snippetFiles(lesson.code, technology, lesson.title),
    setup: [], expectedOutput: "", apiReference: lesson.apiReference, completeness: "snippet",
  }];
  for (const question of lesson.interview ?? []) {
    if (!question.code || seen.has(question.code) || examples.length >= 6) continue;
    seen.add(question.code);
    examples.push({
      kind: "application", title: question.question,
      description: [question.definition, question.answer].join("\n\n"),
      files: snippetFiles(question.syntax ? `${question.syntax}\n\n${question.code}` : question.code, technology, question.definition),
      setup: [], expectedOutput: "", completeness: "snippet",
    });
  }
  return examples;
}

/** Shared by the reader and text export, including already saved documents. */
export function enrichLearningNotes(deck: Curriculum, language: "en" | "hi"): Curriculum {
  return { ...deck, lessons: deck.lessons.map(lesson => ({ ...lesson, keyPoints: lessonKeyPoints(lesson, language) })) };
}
