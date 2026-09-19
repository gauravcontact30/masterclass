import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Techy } from "@/components/techy";
import { TECHY_TOPICS, TECHY_EXAMPLES, TECHY_VOCABULARY } from "@/lib/techy-content";

test("every topic supplies a complete question bank and connected code files", () => {
  expect(TECHY_TOPICS).toHaveLength(15);
  expect(new Set(TECHY_TOPICS.map(topic => topic.id)).size).toBe(15);
  for (const topic of TECHY_TOPICS) {
    expect(topic.questions.length).toBeGreaterThanOrEqual(20);
    expect(topic.questions.length).toBeLessThanOrEqual(25);
    expect(new Set(topic.questions.map(item => item.question)).size).toBe(topic.questions.length);
    for (const question of topic.questions) {
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options[question.correct]).toBeTruthy();
      expect(question.answer.length).toBeGreaterThan(25);
      expect(question.priority).toBeGreaterThanOrEqual(1);
      expect(question.priority).toBeLessThanOrEqual(5);
    }
    expect(TECHY_EXAMPLES[topic.id].files.length).toBeGreaterThanOrEqual(2);
    expect(TECHY_EXAMPLES[topic.id].setup).toBeTruthy();
  }
  expect(TECHY_VOCABULARY).toHaveLength(20);
});

test("recall cards hide answers and reset the reveal on navigation", async () => {
  const user = userEvent.setup(); render(<Techy/>);
  expect(screen.queryByText(TECHY_TOPICS[0].features[0])).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reveal answer" }));
  expect(screen.getByText(TECHY_TOPICS[0].features[0])).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.queryByText(TECHY_TOPICS[0].features[1])).not.toBeInTheDocument();
  expect(screen.getByText("Card 2 of 4")).toBeVisible();
  await user.click(screen.getByRole("button", { name: /Subjective Test/ }));
  await user.type(screen.getByRole("textbox", { name: /Your answer/ }), "Objects belong in buckets.");
  await user.click(screen.getByRole("button", { name: "Reveal answer" }));
  expect(screen.getByText(TECHY_TOPICS[0].questions[0].answer)).toBeVisible();
  expect(screen.getByLabelText("Study priority: 5 out of 5 stars")).toBeVisible();
});

test("quiz scores once, preserves answers across sections and supports restart", async () => {
  const user = userEvent.setup(); render(<Techy/>);
  await user.click(screen.getByRole("button", { name: /Objective Quiz/ }));
  await user.click(screen.getByRole("button", { name: "A Amazon S3" }));
  expect(screen.getByText("1 correct · 1/20 answered")).toBeVisible();
  expect(screen.getByRole("button", { name: "B Amazon EBS" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Next" }));
  const second = TECHY_TOPICS[0].questions[1];
  await user.click(screen.getByRole("button", { name: `A ${second.options[0]}` }));
  expect(screen.getByText(/REVIEW THIS ONE/)).toBeVisible();
  expect(screen.getByText("1 correct · 2/20 answered")).toBeVisible();
  await user.click(screen.getByRole("button", { name: /Key features/ }));
  await user.click(screen.getByRole("button", { name: /Objective Quiz/ }));
  expect(screen.getByRole("button", { name: "A Amazon S3" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Restart quiz" }));
  expect(screen.getByText("0 correct · 0/20 answered")).toBeVisible();
  expect(screen.getByRole("button", { name: "A Amazon S3" })).toBeEnabled();
});

test("code explorer and tabs stay synchronized and vocabulary has all four fields", async () => {
  const user = userEvent.setup(); render(<Techy/>);
  await user.click(screen.getByRole("button", { name: /Code examples/ }));
  await user.click(screen.getByRole("button", { name: "Explore code" }));
  const files = within(screen.getByRole("navigation", { name: "Codebase files" }));
  await user.click(files.getByRole("button", { name: "read.mjs" }));
  expect(screen.getByLabelText("Source code for src/read.mjs")).toHaveTextContent("readObject");
  expect(screen.getByRole("button", { name: "read.mjs", pressed: true })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /Corporate English/ }));
  await user.click(screen.getByRole("button", { name: "Reveal answer" }));
  for (const title of ["Meaning", "Synonyms", "Antonyms", "Sentence"]) expect(screen.getByText(title)).toBeVisible();
});

test("search handles no results and changing topic resets the active deck", async () => {
  const user = userEvent.setup(); render(<Techy/>);
  const search = screen.getByRole("searchbox", { name: "Search Techy topics" });
  await user.type(search, "no-matching-topic");
  expect(screen.getByText(/No topics match/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Clear search" }));
  await user.type(search, "TypeScript");
  await user.click(screen.getByRole("button", { name: /Languages TypeScript/ }));
  expect(screen.getByRole("region", { name: "TypeScript flashcards" })).toBeVisible();
  expect(screen.getByText("Card 1 of 4")).toBeVisible();
});

test("JavaScript has a dedicated predict-the-output puzzle deck", async () => {
  const user = userEvent.setup(); render(<Techy/>);
  await user.click(screen.getByRole("button", { name: /Languages JavaScript & Code Puzzles/ }));
  await user.click(screen.getByRole("button", { name: /Code puzzles/ }));
  expect(screen.getByRole("heading", { name: "Microtask before timer" })).toBeVisible();
  expect(screen.queryByText("A, D, C, B")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reveal answer" }));
  expect(screen.getByText("A, D, C, B")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Card 2 of 8")).toBeVisible();
});
