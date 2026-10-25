import { fireEvent, render, screen, within } from "@testing-library/react";
import WorkflowPrep from "@/components/landing-workflow-prep";
import { arrangeOptions, WORKFLOW_PREP } from "@/lib/workflow-prep";

const text = (en: string) => en;
const prep = WORKFLOW_PREP["url-shortener"];

test("shows the four detail cards with the blueprint's stack", () => {
  render(<WorkflowPrep id="url-shortener" text={text} />);
  for (const title of ["Tech stack", "Key design decisions", "Common mistakes", "What to measure"]) expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "Tech stack" })).getByText(prep.stack[0])).toBeInTheDocument();
});

test("subjective questions open one by one, most asked first, each with its star rating", () => {
  const { container } = render(<WorkflowPrep id="url-shortener" text={text} />);
  const items = container.querySelectorAll("details");
  expect(items).toHaveLength(3);
  const top = Math.max(...prep.subjective.map(q => q.stars));
  expect(screen.getAllByRole("img", { name: /Asked often/ })[0]).toHaveAccessibleName(`Asked often: ${top} of 5`);
  const first = items[0];
  expect(first).not.toHaveAttribute("open");
  fireEvent.click(first.querySelector("summary")!);
  expect(first).toHaveAttribute("open");
});

test("objective questions show the options and mark the right one", () => {
  const { container } = render(<WorkflowPrep id="url-shortener" text={text} />);
  fireEvent.click(screen.getByRole("button", { name: /Objective/ }));
  expect(screen.getByRole("button", { name: /Objective/ })).toHaveAttribute("aria-pressed", "true");
  const q = [...prep.objective].sort((a, b) => b.stars - a.stars)[0];
  const item = [...container.querySelectorAll("details")].find(d => d.textContent?.includes(q.question))!;
  const { options, answer } = arrangeOptions(q);
  const rows = item.querySelectorAll("li");
  expect(rows).toHaveLength(4);
  expect(rows[answer]).toHaveAttribute("data-correct", "true");
  expect(rows[answer]).toHaveTextContent(options[answer]);
  expect(within(item).getByText(q.why)).toBeInTheDocument();
});

test("an unknown workflow renders nothing", () => {
  const { container } = render(<WorkflowPrep id="nope" text={text} />);
  expect(container).toBeEmptyDOMElement();
});

test("the landing preview (limit) shows the 7 most asked of each kind and links to the full set in the dashboard", async () => {
  const { container } = render(<WorkflowPrep id="url-shortener" text={text} limit={7} />);
  // The rest of the questions load after the shipped three; the cap applies once they arrive.
  await screen.findByRole("link", { name: /Showing the 7 most asked of \d+\. See all \d+ subjective questions in the dashboard/ });
  expect(container.querySelectorAll("details")).toHaveLength(7);
  fireEvent.click(screen.getByRole("button", { name: /Objective/ }));
  expect(container.querySelectorAll("details")).toHaveLength(7);
  expect(screen.getByRole("link", { name: /See all \d+ objective questions in the dashboard/ })).toHaveAttribute("href", "/learning");
});

test("without a limit (/learning) every question shows", async () => {
  const { container } = render(<WorkflowPrep id="url-shortener" text={text} />);
  await screen.findByRole("button", { name: /Subjective\s*([8-9]|\d\d)/ });
  expect(container.querySelectorAll("details").length).toBeGreaterThan(7);
  expect(screen.queryByRole("link", { name: /most asked of/ })).not.toBeInTheDocument();
});
