import type { ApiReference, Curriculum } from "./domain";

export const NOTE_KINDS = ["AWS services", "Technology topics", "Methods", "Functions", "Interfaces", "Hooks", "Properties", "Classes", "Syntax", "Examples", "Vocabulary", "Synonyms", "Antonyms", "Practice", "Interview questions", "Glossary"] as const;
/** `output` is the authored result for `code`, shown when it cannot be executed here. */
export type NoteSection = { title: string; points: string[]; code?: string; output?: string };
export type NoteCard = { id: string; technology: string; title: string; category: string; kinds: string[]; points: string[]; sections: NoteSection[] };
type Guide = { id: string; request: { technologyId: string }; curriculum: Curriculum };
const lines = (text: string) => text.split("\n").map(line => line.trim().replace(/^[-•]\s*/, "")).filter(Boolean);

/** Derive the directory from the same curricula as saved notes, without user data. */
export function buildNotesDirectory(guides: Guide[]): NoteCard[] {
  return guides.flatMap(guide => {
    const { curriculum: deck } = guide;
    const base = { technology: guide.request.technologyId, category: deck.title };
    const cards: NoteCard[] = (deck.services ?? []).map((service, index) => ({
      ...base, id: `${guide.id}-service-${index}`, title: service.name,
      category: service.category, kinds: [guide.request.technologyId.startsWith("aws") ? "AWS services" : "Technology topics"],
      points: [service.summary, ...service.points], sections: [],
    }));
    deck.lessons.forEach((lesson, index) => {
      const kinds = new Set<string>(["Technology topics", "Examples", "Practice"]);
      const sections: NoteSection[] = [];
      const addApi = (api: ApiReference) => {
        for (const [pattern, label] of [[/method/i, "Methods"], [/function/i, "Functions"], [/interface/i, "Interfaces"], [/hook/i, "Hooks"], [/propert|prop\b/i, "Properties"], [/class/i, "Classes"]] as const) {
          if (pattern.test(api.kind)) kinds.add(label);
        }
        if (/^use[A-Z]/.test(api.name)) kinds.add("Hooks");
        kinds.add("Syntax");
        sections.push({ title: `${api.name} · ${api.kind}`, code: api.signature, points: [...api.params.map(param => `${param.name} (${param.type}): ${param.description}`), `Returns: ${api.returns}`, ...(api.notes ? [api.notes] : [])] });
      };
      sections.push({ title: "Examples", points: lines(lesson.example), code: lesson.code || undefined });
      if (lesson.code) kinds.add("Syntax");
      lesson.apiReference?.forEach(addApi);
      for (const example of lesson.codeExamples ?? []) {
        sections.push({ title: example.title, points: [example.description, ...example.setup, `Expected result: ${example.expectedOutput}`] });
        example.files.forEach(file => sections.push({ title: file.path, points: [file.description], code: file.code, output: example.expectedOutput || undefined }));
        example.apiReference?.forEach(addApi);
      }
      for (const word of lesson.vocabulary ?? []) {
        kinds.add("Vocabulary");
        if (word.synonyms.length) kinds.add("Synonyms");
        if (word.antonyms.length) kinds.add("Antonyms");
        sections.push({ title: word.word, points: [word.meaning, `Example: ${word.example}`, `Synonyms: ${word.synonyms.join(", ") || "None listed"}`, `Antonyms: ${word.antonyms.join(", ") || "None listed"}`] });
      }
      if (lesson.useCase) sections.push({ title: "Real-world use case", points: Object.values(lesson.useCase) });
      sections.push({ title: "Practice", points: lines(lesson.exercise) }, { title: "Check your understanding", points: lines(lesson.checkpoint) }, { title: "Common mistakes", points: lines(lesson.mistake) });
      for (const question of lesson.interview ?? []) {
        kinds.add("Interview questions");
        sections.push({ title: question.question, points: [question.definition, question.answer, ...question.similar.map(item => `${item.question} ${item.answer}`)], code: [question.syntax, question.code].filter(Boolean).join("\n\n") || undefined });
      }
      // Some guides teach interfaces in code rather than labelling an API entry.
      if (sections.some(section => /\binterface\s+\w+/.test(section.code ?? "")) || /\binterfaces?\b/i.test(lesson.title)) kinds.add("Interfaces");
      cards.push({ ...base, id: `${guide.id}-lesson-${index}`, title: lesson.title, kinds: [...kinds], points: [...new Set([...lines(lesson.explanation), ...(lesson.keyPoints ?? []).flatMap(point => [point.title ? `${point.title}: ${point.text}` : point.text, ...(point.example ? [`Example: ${point.example}`] : [])])])], sections });
    });
    for (const [index, example] of (deck.codeExamples ?? []).entries()) {
      const kinds = ["Examples", "Syntax"];
      if (example.files.some(file => /\binterface\s+\w+/.test(file.code))) kinds.push("Interfaces");
      cards.push({ ...base, id: `${guide.id}-project-${index}`, title: example.title, kinds,
        points: [example.description, ...example.setup, `Expected result: ${example.expectedOutput}`],
        sections: [
          ...example.files.map(file => ({ title: file.path, points: [file.description], code: file.code, output: example.expectedOutput || undefined })),
          ...(example.apiReference ?? []).map(api => ({ title: `${api.name} · ${api.kind}`, code: api.signature, points: [...api.params.map(param => `${param.name} (${param.type}): ${param.description}`), `Returns: ${api.returns}`, ...(api.notes ? [api.notes] : [])] })),
        ],
      });
    }
    cards.push({ ...base, id: `${guide.id}-glossary`, title: `${deck.title}: glossary`, kinds: ["Glossary", "Vocabulary"], points: deck.glossary.map(item => `${item.term}: ${item.definition}`), sections: [] });
    return cards;
  });
}

export function filterNotes(cards: NoteCard[], query: string, technology: string, kind: string) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return cards.filter(card => {
    if (technology && card.technology !== technology) return false;
    if (kind && !card.kinds.includes(kind)) return false;
    const text = [card.title, card.technology, card.category, ...card.kinds, ...card.points, ...card.sections.flatMap(section => [section.title, ...section.points, section.code ?? ""])].join(" ").toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });
}
