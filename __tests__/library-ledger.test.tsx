import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LibraryLedger } from "@/components/library-ledger";
import type { LandingLibrary } from "@/lib/landing-library";

const library: LandingLibrary = {
  entries: [
    { id: "tech:react", kind: "technology", title: "React", note: "Components, hooks and state.", meta: "40 topics" },
    { id: "api:boto3", kind: "api", title: "boto3", note: "client · resource · Session", meta: "120 entries" },
    { id: "course:ssc-cgl", kind: "course", title: "SSC CGL", hi: "एसएससी सीजीएल", note: "SSC & Recruitment", meta: "SSC & Recruitment" },
    { id: "word:succinct", kind: "word", title: "succinct", hi: "संक्षिप्त", note: "Expressed briefly and clearly.", meta: "Workplace speaking" },
  ],
  counts: { technology: 61, api: 54, course: 42, word: 2091, techy: 15, handbookTopics: 4649, apiIdentifiers: 5402, techyQuestions: 300 },
};

test("shelf tabs carry the true catalogue sizes, not the sample size", () => {
  render(<LibraryLedger library={library} />);
  const shelves = within(screen.getByRole("group", { name: "Library shelves" }));
  expect(shelves.getByRole("button", { name: /Words\s*2,091/ })).toBeInTheDocument();
  expect(shelves.getByRole("button", { name: /Everything\s*4/ })).toHaveAttribute("aria-pressed", "true");
});

test("a shelf tab narrows the rows and previews the first entry with where it opens", async () => {
  const user = userEvent.setup();
  render(<LibraryLedger library={library} />);
  await user.click(screen.getByRole("button", { name: /Words/ }));
  const rows = within(screen.getByRole("list", { name: "Library entries" })).getAllByRole("button");
  expect(rows).toHaveLength(1);
  const preview = screen.getByRole("article", { name: "Preview: succinct" });
  expect(within(preview).getByText("संक्षिप्त")).toHaveAttribute("lang", "hi");
  expect(within(preview).getByRole("link", { name: /Vocabulary/ })).toHaveAttribute("href", "/sign-up");
});

test("search matches titles, Hindi and notes across every shelf, and says so when nothing matches", async () => {
  const user = userEvent.setup();
  render(<LibraryLedger library={library} />);
  const search = screen.getByRole("combobox", { name: "Search the library" });
  await user.type(search, "boto");
  expect(within(screen.getByRole("list", { name: "Library entries" })).getAllByRole("button").map(row => row.textContent)).toEqual(["boto3120 entries"]);
  await user.clear(search);
  await user.type(search, "zzzz");
  expect(screen.getByRole("status")).toHaveTextContent("Nothing on this shelf matches “zzzz”.");
  await user.click(screen.getByRole("button", { name: "Clear search" }));
  expect(within(screen.getByRole("list", { name: "Library entries" })).getAllByRole("button")).toHaveLength(4);
});

test("clicking a row selects it for the preview", async () => {
  const user = userEvent.setup();
  render(<LibraryLedger library={library} />);
  const entries = within(screen.getByRole("list", { name: "Library entries" }));
  await user.click(entries.getByRole("button", { name: /SSC CGL/ }));
  expect(entries.getByRole("button", { name: /SSC CGL/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("article", { name: "Preview: SSC CGL" })).toBeInTheDocument();
});

test("typing offers suggestions that pick an entry by keyboard, and the clear button empties the field", async () => {
  const user = userEvent.setup();
  render(<LibraryLedger library={library} />);
  const search = screen.getByRole("combobox", { name: "Search the library" });
  await user.type(search, "suc");
  const options = within(screen.getByRole("listbox", { name: "Suggestions" })).getAllByRole("option");
  expect(options.map(option => option.textContent)).toEqual(["succinctWords"]);
  await user.keyboard("{ArrowDown}{Enter}");
  expect(search).toHaveValue("succinct");
  expect(screen.queryByRole("listbox", { name: "Suggestions" })).not.toBeInTheDocument();
  expect(screen.getByRole("article", { name: "Preview: succinct" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear search" }));
  expect(search).toHaveValue("");
});

test("the filters panel opens and closes, and its Hindi filter narrows the shelf and can be reset", async () => {
  const user = userEvent.setup();
  render(<LibraryLedger library={library} />);
  const toggle = screen.getByRole("button", { name: /Filters/ });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  await user.click(screen.getByRole("button", { name: "Has a Hindi meaning" }));
  expect(within(screen.getByRole("list", { name: "Library entries" })).getAllByRole("button").map(row => row.textContent)).toEqual(["SSC CGLSSC & Recruitment", "succinctWorkplace speaking"]);
  expect(toggle).toHaveTextContent("1");
  await user.click(screen.getByRole("button", { name: "Reset filters" }));
  expect(within(screen.getByRole("list", { name: "Library entries" })).getAllByRole("button")).toHaveLength(4);
  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("try chips offer only searches that match a real entry, and run one when clicked", async () => {
  const user = userEvent.setup();
  render(<LibraryLedger library={library} />);
  const chips = within(screen.getByRole("group", { name: "Try a search" })).getAllByRole("button");
  expect(chips.map(chip => chip.textContent)).toEqual(["react", "succinct", "SSC CGL", "boto3"]);
  await user.click(chips[1]);
  expect(screen.getByRole("combobox", { name: "Search the library" })).toHaveValue("succinct");
  expect(screen.getByRole("article", { name: "Preview: succinct" })).toBeInTheDocument();
});
