import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfficialDocsLearning, LEARNING_SECTIONS } from "@/components/official-docs-learning";
import { OfficialDocs } from "@/components/official-docs";
import { OFFICIAL_DOCS } from "@/lib/official-docs-data";

test("every technology has concise concepts, objectives, rated questions and answers", () => {
  const { rerender } = render(<OfficialDocsLearning doc={OFFICIAL_DOCS[0]} />);
  for (const doc of OFFICIAL_DOCS) {
    rerender(<OfficialDocsLearning key={doc.id} doc={doc} />);
    const notes = screen.getByRole("article", { name: `${doc.title} learning notes` });
    for (const [id, title] of LEARNING_SECTIONS) {
      if (id === "learning") continue;
      expect(within(notes).getByRole("region", { name: title })).toBeVisible();
    }
    const learning = within(notes).queryByRole("region", { name: "Key learning contents" });
    if (learning) {
      const points = Array.from(learning.querySelectorAll("p"), point => point.textContent);
      expect(points.length).toBeGreaterThan(0);
      expect(new Set(points).size).toBe(points.length);
      for (const point of points) {
        const elsewhere = Array.from(notes.querySelectorAll("p, li, dd"))
          .filter(element => !learning.contains(element));
        expect(elsewhere.some(element => element.textContent?.includes(point!))).toBe(false);
      }
    } else {
      expect(within(notes).queryByRole("link", { name: "Key learning contents" })).not.toBeInTheDocument();
    }
    expect(notes.querySelectorAll("details")).toHaveLength(5);
    expect(within(notes).getAllByText(/Difficulty:/)).toHaveLength(5);
    expect(within(notes).getByRole("figure", { name: `${doc.title} codebase` })).toBeVisible();
    expect(within(notes).queryByText("Answer criteria:")).not.toBeInTheDocument();
    expect(within(notes).queryByText("Set up & run")).not.toBeInTheDocument();
    expect(within(notes).getByRole("link", { name: "Official documentation" })).toHaveAttribute("href", doc.officialUrl);
    const questions = within(notes).getByRole("region", { name: "Objective questions" });
    for (const question of questions.querySelectorAll("details")) {
      const answer = question.querySelector("mark")!.textContent;
      const choices = Array.from(question.parentElement!.querySelectorAll("ol li"), item => item.textContent);
      expect(choices.filter(choice => choice === answer)).toHaveLength(1);
    }
  }
});

test("technology selection switches the inline lesson and website together", async () => {
  const user = userEvent.setup();
  render(<OfficialDocs />);
  await user.selectOptions(screen.getByRole("combobox", { name: "Technology" }), "python");
  expect(screen.getByRole("article", { name: "Python (3.12 / 3.13+) learning notes" })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: "React 19+ learning notes" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Browse official website" }));
  expect(screen.getByTitle("Python (3.12 / 3.13+) official website")).toHaveAttribute("src", "https://docs.python.org/3/");
});

test("answers can be revealed and hidden", async () => {
  const user = userEvent.setup();
  render(<OfficialDocsLearning doc={OFFICIAL_DOCS[0]} />);
  const summary = screen.getByText("Show answer 1", { exact: true });
  const answer = summary.closest("details")!;
  expect(answer).not.toHaveAttribute("open");
  await user.click(summary);
  expect(answer).toHaveAttribute("open");
  expect(within(answer).getByText(OFFICIAL_DOCS[0].keyFeatures[0].title)).toBeVisible();
  await user.click(summary);
  expect(answer).not.toHaveAttribute("open");
  await user.click(screen.getByText("Show model answer 2"));
  expect(screen.getByText("Recommend:")).toBeVisible();
  expect(screen.getByText("Flag:")).toBeVisible();
});

test("inline and dialog section links have unique, existing targets", async () => {
  const user = userEvent.setup();
  const { container } = render(<OfficialDocs />);
  await user.click(screen.getByRole("button", { name: "Explore Next.js 16+ documentation" }));
  const dialog = screen.getByRole("dialog");
  for (const link of dialog.querySelectorAll('a[href^="#"]')) {
    expect(document.getElementById(link.getAttribute("href")!.slice(1))).toBeInTheDocument();
  }
  const ids = Array.from(document.querySelectorAll("[id]"), element => element.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(container.querySelector('a[href$="-code"]')).toBeInTheDocument();
});
