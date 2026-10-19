import { prepareHandbooks } from "@/lib/server/prepared-catalog";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";

// Validate authored rows independently of optional generated documentation.
jest.mock("@/lib/server/official-content", () => ({ officialSearchCard: jest.fn() }));

/**
 * A Search card carries three blocks — what the topic is, what is worth knowing
 * about it, and where it is used — and none of that may be shared with another
 * card. These two handbooks are authored row by row; the assertions below are
 * what keep a later edit from filling a gap with a line borrowed from a sibling.
 */
const AUTHORED = /^(React 19\+ —|Next\.js 16\+ —)/;

const books = prepareHandbooks(TECHNOLOGY_HANDBOOKS).filter(book => AUTHORED.test(book.title));

test("both authored handbooks are present", () => {
  expect(books.map(book => book.title.split(" —")[0]).sort()).toEqual(["Next.js 16+", "React 19+"]);
});

test("every row carries its own key points and a real use case", () => {
  const thin = books.flatMap(book => book.topics
    .filter(topic => (topic.points?.length ?? 0) < 3 || !topic.useCase?.scenario)
    .map(topic => `${book.title.split(" —")[0]} / ${topic.name}`));
  expect(thin).toEqual([]);
});

test("a row's authored points lead the answer it opens", () => {
  const wrong = books.flatMap(book => book.topics
    .filter(topic => topic.prepared?.answer.keyPoints[0] !== topic.points?.[0])
    .map(topic => topic.name));
  expect(wrong).toEqual([]);
});

test("no point and no use case is repeated on another card", () => {
  const owners = new Map<string, string>();
  const repeated: string[] = [];
  for (const book of books) {
    for (const topic of book.topics) {
      const owner = `${book.title.split(" —")[0]} / ${topic.name}`;
      const lines = [...(topic.points ?? []), `${topic.useCase?.title} — ${topic.useCase?.scenario}`];
      for (const line of lines) {
        const first = owners.get(line);
        if (first && first !== owner) repeated.push(`${line} (${first} and ${owner})`);
        else owners.set(line, owner);
      }
    }
  }
  expect(repeated).toEqual([]);
});
