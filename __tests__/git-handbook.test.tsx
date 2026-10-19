import { render, screen, within } from "@testing-library/react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { GIT_HANDBOOK, GIT_ROWS, GIT_TITLE } from "@/lib/pro-learn/git-handbook";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { prepareSearchTopics } from "@/lib/server/prepared-catalog";
import { splitCommands } from "@/lib/terminal-commands";

/**
 * Git is taught as a set of operations rather than an API surface, so every row
 * owes the reader the same three things: what the command is, the order to run
 * it in, and the mistake it is known for. These tests hold that contract — a
 * row added later without a walkthrough fails here rather than reaching a
 * learner as a definition with nothing to type.
 */

test("the handbook is registered on the search page catalogue", () => {
  const registered = TECHNOLOGY_HANDBOOKS.find(book => book.title === GIT_TITLE);
  expect(registered).toBe(GIT_HANDBOOK);
  expect(GIT_HANDBOOK.sources?.[0].url).toBe("https://git-scm.com/docs");
});

test("every row carries a step-by-step process with real commands", () => {
  const thin = GIT_ROWS.filter(row =>
    row.steps.length < 3 || !row.steps.some(step => step.code?.includes("git ")) || !row.pitfall);
  expect(thin.map(row => row.name)).toEqual([]);
});

test("every row carries three key points and a real use case for its card", () => {
  const thin = GIT_ROWS.filter(row => row.points.length !== 3 || !row.useCase.title || !row.useCase.scenario);
  expect(thin.map(row => row.name)).toEqual([]);
});

test("no two rows share a name, a key point or a use case", () => {
  const seen = new Map<string, string>();
  const repeated: string[] = [];
  for (const row of GIT_ROWS) {
    for (const line of [row.name, ...row.points, `${row.useCase.title} — ${row.useCase.scenario}`]) {
      const owner = seen.get(line);
      if (owner && owner !== row.name) repeated.push(`${line} (${owner} and ${row.name})`);
      else seen.set(line, row.name);
    }
  }
  expect(repeated).toEqual([]);
});

/** The commands the question names explicitly, plus the rest of the daily set. */
const MUST_COVER = [
  "git init", "git clone", "git config", "git status", "git add", "git commit", "git log", "git diff",
  "git branch", "git switch", "git checkout", "git merge", "git tag",
  "What rebase is", "git rebase", "git rebase -i", "git rebase --onto", "Rebase vs merge",
  "What cherry-pick is", "git cherry-pick", "git revert",
  "git remote", "git fetch", "git pull", "git push", "git submodule",
  "git restore", "git reset --hard", "git commit --amend", "git reflog", "git stash", "git clean",
  "git show", "git blame", "git bisect", "git grep", "git describe",
  "git worktree", "git sparse-checkout", "Git hooks", "git rerere", "git archive", "git bundle",
];

test("the commands a reader comes looking for are all present", () => {
  const names = new Set(GIT_ROWS.map(row => row.name));
  expect(MUST_COVER.filter(command => !names.has(command))).toEqual([]);
  expect(GIT_ROWS.length).toBeGreaterThanOrEqual(60);
});

test("rebase and cherry-pick are explained as concepts before they are used", () => {
  const rebase = GIT_ROWS.find(row => row.name === "What rebase is")!;
  const pick = GIT_ROWS.find(row => row.name === "What cherry-pick is")!;
  // Both explain that commits are copied rather than moved, which is the fact
  // every later surprise about hashes and force-pushing follows from.
  expect(rebase.points.join(" ")).toMatch(/copies|new hash/i);
  expect(pick.points.join(" ")).toMatch(/new hash|new commit/i);
  expect(rebase.steps.length).toBeGreaterThanOrEqual(4);
  expect(pick.steps.length).toBeGreaterThanOrEqual(4);
});

test("the prepared answer opens on the syntax, then carries the authored walkthrough", () => {
  const topic = GIT_HANDBOOK.topics.find(row => row.name === "git cherry-pick")!;
  const row = GIT_ROWS.find(entry => entry.name === "git cherry-pick")!;
  const answer = topic.prepared!.answer;
  expect(answer.steps.map(step => step.title)).toEqual(["Syntax", ...row.steps.map(step => step.title)]);
  expect(answer.steps[0].code).toBe(row.syntax.join("\n"));
  expect(answer.steps.some(step => step.code.includes("git cherry-pick --continue"))).toBe(true);
  expect(answer.caveats).toHaveLength(1);
  // The server leaves an already-prepared row alone rather than overwriting it.
  const [prepared] = prepareSearchTopics([topic], GIT_TITLE);
    expect(prepared.prepared!.answer.definition).toBe(topic.prepared!.answer.definition);
    expect(prepared.prepared!.answer.steps).toEqual(expect.arrayContaining(topic.prepared!.answer.steps));
});

test("every row carries a syntax form that names its own command", () => {
  const wrong = GIT_ROWS.filter(row => {
    if (!row.syntax.length) return true;
    // A concept row is named for the idea, so it is matched on the command its
    // syntax is about rather than on its own title.
    const command = row.name.startsWith("git ") ? row.name.split(" ").slice(0, 2).join(" ") : "";
    return command ? !row.syntax.some(form => form.startsWith(command)) : false;
  });
  expect(wrong.map(row => row.name)).toEqual([]);
});

/**
 * Commands belong in a terminal, not in a grey box.
 *
 * A prepared answer's code is printed as plain text unless it is recognised as
 * shell, which is what routes it into the light macOS-style terminal with its
 * prompts and per-line copy. Every Git step has to clear that bar, or the
 * walkthrough arrives as something to read rather than something to run.
 */
const isShell = (code: string) => splitCommands(code).some(segment => segment.kind === "shell");

/**
 * The one step in the handbook whose code is not typed at a shell: the todo
 * list an interactive rebase opens in an editor. It belongs in the editor
 * chrome, so it is named here rather than weakening the rule for everything.
 */
const EDITOR_BUFFERS = ["git rebase -i / Edit the todo list"];

test("every step's code, and every syntax form, renders as a terminal", () => {
  const notTerminal: string[] = [];
  for (const topic of GIT_HANDBOOK.topics) {
    for (const step of topic.prepared!.answer.steps) {
      const id = `${topic.name} / ${step.title}`;
      if (step.code.trim() && !isShell(step.code) && !EDITOR_BUFFERS.includes(id)) notTerminal.push(id);
    }
  }
  expect(notTerminal).toEqual([]);
  // The syntax step is the first of every answer and is always a terminal.
  for (const topic of GIT_HANDBOOK.topics) expect(isShell(topic.prepared!.answer.steps[0].code)).toBe(true);
});

test("no step fakes a command with a comment instead of writing prose", () => {
  // A code block containing only comments renders as an empty editor. Whatever
  // it was trying to say belongs in the step's own detail line.
  const commentOnly: string[] = [];
  for (const topic of GIT_HANDBOOK.topics) {
    for (const step of topic.prepared!.answer.steps) {
      const lines = step.code.split("\n").map(line => line.trim()).filter(Boolean);
      if (lines.length && lines.every(line => line.startsWith("#"))) commentOnly.push(`${topic.name} / ${step.title}`);
    }
  }
  expect(commentOnly).toEqual([]);
});

test("every Git card leads with its syntax and its own key points", () => {
  render(<CatalogBrowser id="git" title={GIT_TITLE} description={GIT_HANDBOOK.description} noun="commands"
    items={GIT_HANDBOOK.topics} categories={GIT_HANDBOOK.categories} itemIcon={() => null} categoryIcon={() => null}
    question={row => row.name} onAsk={() => {}} />);
  const cards = screen.getAllByRole("listitem").filter(item => item.parentElement?.hasAttribute("data-walkthrough"));
  expect(cards.length).toBeGreaterThan(0);
  for (const card of cards) {
    expect(within(card).getByText("Syntax")).toBeInTheDocument();
    expect(within(card).getByText("Core features & key points")).toBeInTheDocument();
    expect(within(card).getByText("Real use cases")).toBeInTheDocument();
  }
});

test("no two Git cards say the same thing", () => {
  render(<CatalogBrowser id="git-unique" title={GIT_TITLE} description={GIT_HANDBOOK.description} noun="commands"
    items={GIT_HANDBOOK.topics} categories={GIT_HANDBOOK.categories} itemIcon={() => null} categoryIcon={() => null}
    question={row => row.name} onAsk={() => {}} />);
  const seen = new Set<string>();
  const repeated: string[] = [];
  for (const card of screen.getAllByRole("listitem").filter(item => item.parentElement?.hasAttribute("data-walkthrough"))) {
    for (const label of ["Core features & key points", "Real use cases"]) {
      const heading = within(card).queryByText(label);
      if (!heading) continue;
      for (const node of [...heading.parentElement!.children].slice(1)) {
        const line = node.textContent!.trim();
        if (seen.has(line)) repeated.push(line);
        seen.add(line);
      }
    }
  }
  expect(repeated).toEqual([]);
});
