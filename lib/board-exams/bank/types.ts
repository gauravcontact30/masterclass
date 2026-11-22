/** A Question Bank row: [chapter, question, answer, marks, boards?]. Board letters: u = UP Board, c = CBSE, i = ICSE/ISC; absent means all three. */
export type BankRow = [ch: string, q: string, a: string, marks: number, b?: string];
