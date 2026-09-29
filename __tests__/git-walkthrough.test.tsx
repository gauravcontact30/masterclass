import { fireEvent, render, screen, within } from "@testing-library/react";
import { AnswerSearch } from "@/components/answer-search";
import { CatalogBrowser } from "@/components/catalog-browser";
import { GIT_HANDBOOK, GIT_TITLE } from "@/lib/pro-learn/git-handbook";
import { summaryExplanation } from "@/lib/pro-learn/prepared-explanation";

jest.mock("@/components/code-lab", () => ({ CodeLab: () => null }));

beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = jest.fn();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ providers: [] }) });
});

test("Git cards and Explain this show every syntax form and the complete walkthrough", async () => {
  render(<AnswerSearch technologyHandbooks={[GIT_HANDBOOK]} />);
  fireEvent.change(screen.getByRole("searchbox", { name: `Search ${GIT_TITLE}` }), { target: { value: "git init" } });
  const lesson = screen.getByRole("region", { name: "git init walkthrough" });
  expect(within(lesson).getByText("Scenario")).toBeVisible();
  expect(within(lesson).getByText("Example")).toBeVisible();
  expect(lesson).toHaveTextContent("git init --bare <directory>.git");
  expect(lesson).toHaveTextContent("Confirm the repository has a history");
  expect(lesson.closest("button")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Explain this: git init", exact: true }));
  const dialog = await screen.findByRole("dialog");
  const modalLesson = within(dialog).getByRole("region", { name: "git init walkthrough" });
  expect(modalLesson.textContent).toBe(lesson.textContent);
});

test("a single topic never borrows technology use cases or industry problems", () => {
  render(<CatalogBrowser id="one" title="Docker" description="" noun="topics"
    items={[{ name: "Unreviewed topic", category: "Container foundations", summary: "A specific definition." }]}
    categories={[]} itemIcon={() => null} categoryIcon={() => null} question={item => item.name} onAsk={() => {}} />);
  expect(screen.queryByText("Real use cases")).not.toBeInTheDocument();
  expect(screen.queryByText("Real problems it solves, by industry")).not.toBeInTheDocument();
  expect(summaryExplanation("Unreviewed topic", "A specific definition.", "Container foundations").answer.useCases).toEqual([]);
});
