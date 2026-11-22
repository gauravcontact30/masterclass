/*
 * Quick Q&A sets for the Board Exams and Competitive Exams pages: 200+ one-line questions with short answers per
 * exam or subject. A set is written as plain text so it stays easy to read and extend:
 *   # Topic name          starts a topic
 *   Question? | Answer    one question and its answer
 */
export type QuickItem = { id: string; topic: string; q: string; a: string };

export function quick(prefix: string, text: string): QuickItem[] {
  const items: QuickItem[] = [];
  let topic = "General";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) { topic = line.slice(2).trim(); continue; }
    const cut = line.indexOf(" | ");
    if (cut < 0) continue;
    items.push({ id: `${prefix}-k${items.length + 1}`, topic, q: line.slice(0, cut).trim(), a: line.slice(cut + 3).trim() });
  }
  return items;
}
