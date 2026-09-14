import type { NoteSection } from "./notes-directory";
import type { StudyNote } from "./notes-study";

export const contentIdentity = (text: string) => text.normalize("NFC").replace(/^\s*[-•]\s*/, "").trim().replace(/\s+/g, " ").replace(/[.!。]+$/, "").toLocaleLowerCase();

/** Exact prose duplicates only: keep distinct code, numbers and qualifications. */
export function uniqueLearningPoints(points: string[], alreadyShown: string[] = []) {
  const seen = new Set(alreadyShown.flatMap(text => text.split("\n")).map(contentIdentity));
  return points.flatMap(point => point.split("\n")).map(point => point.replace(/^\s*[-•]\s*/, "").trim()).filter(point => !/^Apply it in practice:\s*\S+(?:\s+\S+){0,2}[.!]?$/i.test(point)).map(point => point.replace(/^(?:Remember the mechanism|Apply it in practice|An important boundary):\s*/i, "")).filter(point => {
    const key = contentIdentity(point);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function conciseStudyNote(note: StudyNote): StudyNote {
  const points = uniqueLearningPoints(note.points, [note.description]);
  const seen = [note.description, ...points,
    ...note.interview.flatMap(question => question.points.flatMap(point => point.split("\n").map(line => line.replace(/^\s*[-•]\s*/, "").trim()))),
    ...note.vocabulary.flatMap(word => [word.meaning, `Example: ${word.example}`, `Synonyms: ${word.synonyms.join(", ") || "None listed"}`, `Antonyms: ${word.antonyms.join(", ") || "None listed"}`]),
  ];
  const codes = new Set<string>();
  function sections(items: NoteSection[]) {
    return items.map(section => {
      const points = uniqueLearningPoints(section.points, seen);
      seen.push(...points);
      const code = section.code && !codes.has(section.code.trim()) ? section.code : undefined;
      if (code) codes.add(code.trim());
      return { ...section, points, code };
    }).filter(section => section.points.length || section.code);
  }
  // Keep worked examples with their code; remove copies from later sections.
  const examples = sections(note.examples);
  const content = sections(note.sections);
  const useCases = sections(note.useCases);
  return { ...note, points, examples, sections: content, useCases,
    interview: note.interview.map(question => ({ ...question, points: uniqueLearningPoints(question.points) })),
  };
}
