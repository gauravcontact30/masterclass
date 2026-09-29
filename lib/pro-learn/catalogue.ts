import type { AwsCategory, AwsHighlight } from "./aws-highlights";

/**
 * A browsable catalogue: one tab on a search-style page.
 *
 * The same shape the AWS, glossary and handbook sections already have, named so
 * a caller can hand over a whole tab without the page knowing what is in it.
 * `questionPrefix` is the sentence stem a card turns into a question, so each
 * catalogue asks in its own terms — "Explain, for CBSE Class 9 Maths, …".
 */
export type Catalogue = {
  id: string;
  title: string;
  description: string;
  /** Plural noun for the count line, e.g. "topics". */
  noun: string;
  questionPrefix: string;
  topics: AwsHighlight[];
  categories: AwsCategory[];
};

/** Build a catalogue, counting its categories in first-seen order. */
export function catalogue(
  id: string, title: string, description: string, noun: string, questionPrefix: string, topics: AwsHighlight[],
): Catalogue {
  const counts = new Map<string, number>();
  for (const topic of topics) counts.set(topic.category, (counts.get(topic.category) ?? 0) + 1);
  return { id, title, description, noun, questionPrefix, topics, categories: [...counts].map(([name, count]) => ({ name, count })) };
}
