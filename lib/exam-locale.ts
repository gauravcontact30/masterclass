/** Translate displayed text while preserving IDs, answer indices, formulas and board applicability. */
export type ExamDictionary = Record<string, string>;
const TEXT_FIELDS = new Set(["ch", "q", "a", "steps", "hint", "options", "why", "title", "lines", "subject", "name", "full", "tagline", "short", "paper", "sections", "label", "covers", "pattern", "written", "group", "topic"]);
export function localizeExamData<T>(value: T, dictionary: ExamDictionary, field = ""): T {
  if (typeof value === "string") return (TEXT_FIELDS.has(field) ? dictionary[value] ?? value : value) as T;
  if (Array.isArray(value)) return value.map(item => localizeExamData(item, dictionary, field)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeExamData(item, dictionary, key)])) as T;
  return value;
}
export function missingExamTranslations(value: unknown, dictionary: ExamDictionary, field = ""): string[] {
  if (typeof value === "string") return TEXT_FIELDS.has(field) && /[a-zA-Z]{2}/.test(value) && !dictionary[value] ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(item => missingExamTranslations(item, dictionary, field));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => missingExamTranslations(item, dictionary, key));
  return [];
}
