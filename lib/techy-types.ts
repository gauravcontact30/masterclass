export type TechyQuestion = { id: string; question: string; answer: string; priority: number; options: string[]; correct: number };
export type TechyTopic = { id: string; title: string; category: string; summary: string; features: string[]; source: string; questions: TechyQuestion[] };

// Each authored row contains a prompt, explanation, correct option and three
// plausible distractors. Rotation keeps the correct option from always being A.
export function questions(topic: string, rows: string): TechyQuestion[] {
  return rows.trim().split("\n").map((row, index) => {
    const [question, answer, right, ...wrong] = row.split("|");
    if (!question || !answer || !right || wrong.length !== 3) throw new Error(`Invalid Techy card: ${topic}/${index}`);
    const options = [right, ...wrong];
    const shift = index % 4;
    return { id: `${topic}-${index + 1}`, question, answer, priority: index < 8 ? 5 : index < 15 ? 4 : 3, options: [...options.slice(shift), ...options.slice(0, shift)], correct: (4 - shift) % 4 };
  });
}

