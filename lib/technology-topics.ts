import type { DocumentRecord, Lesson, ServiceEntry, Topic } from "./domain";

export type TopicNote = ServiceEntry & { document?: DocumentRecord; lesson?: Lesson; topic?: Topic };
export const noteLines = (text: string) => text.split("\n").map(line => line.trim().replace(/^[-•]\s*/, "")).filter(Boolean);

/** Each saved lesson and each remaining catalog topic gets its own reference card. */
export function technologyTopicNotes(documents: DocumentRecord[], topics: Topic[], hi: boolean): TopicNote[] {
  const entries: TopicNote[] = [];
  const coveredTopics = new Set<string>();
  for (const document of documents) {
    if (!document.curriculum) continue;
    coveredTopics.add(document.request.topicId);
    for (const lesson of document.curriculum.lessons) {
      const explanation = noteLines(lesson.explanation);
      const seen = new Set([explanation[0]?.toLocaleLowerCase()]);
      const points = [
        ...explanation.slice(1).map(text => ({ text, title: "" })),
        ...(lesson.keyPoints ?? []),
      ].flatMap(point => {
        const key = point.text.toLocaleLowerCase();
        if (seen.has(key)) return [];
        seen.add(key);
        return [point.title ? `${point.title}: ${point.text}` : point.text];
      });
      entries.push({
        name: lesson.title,
        category: `${document.title} · ${document.request.language === "hi" ? "हिन्दी" : "English"}`,
        summary: explanation[0] ?? lesson.title,
        points,
        document, lesson,
      });
    }
  }
  for (const topic of topics) {
    if (coveredTopics.has(topic.id)) continue;
    const title = hi ? topic.title_hi || topic.title : topic.title;
    entries.push({
      name: title,
      category: hi ? "पाठ्यक्रम के विषय" : "Catalog topics",
      summary: hi ? "इस विषय के नोट्स और आधिकारिक संदर्भ देखें।" : "Explore this topic through its notes and official references.",
      points: [],
      topic,
      document: documents.find(document => document.request.topicId === topic.id),
    });
  }
  return entries;
}
