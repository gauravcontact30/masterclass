import type { TechnologyHandbook } from "../technology-handbooks";
import { gitTopic, GIT_SOURCES, type GitRow } from "./shared";
import { GIT_BASICS } from "./basics";
import { GIT_BRANCHING } from "./branching";
import { GIT_REBASE } from "./rebase";
import { GIT_REMOTES } from "./remotes";
import { GIT_UNDOING } from "./undoing";
import { GIT_INSPECTING } from "./inspecting";
import { GIT_ADVANCED } from "./advanced";

export const GIT_TITLE = "Git — Commands, Branching, Rebase & History";

/**
 * Git, taught command by command.
 *
 * The rows are ordered the way the commands are learned rather than
 * alphabetically: the add–commit loop first, then branching, then the two
 * commands that copy commits, then remotes, then the several different ways to
 * take something back. Each row carries its own numbered walkthrough with the
 * real commands, because a Git answer that stops at a definition leaves the
 * reader exactly where they started.
 */
const ROWS: GitRow[] = [
  ...GIT_BASICS, ...GIT_BRANCHING, ...GIT_REBASE, ...GIT_REMOTES,
  ...GIT_UNDOING, ...GIT_INSPECTING, ...GIT_ADVANCED,
];

const topics = ROWS.map(gitTopic);
const counts = new Map<string, number>();
for (const topic of topics) counts.set(topic.category, (counts.get(topic.category) ?? 0) + 1);

export const GIT_HANDBOOK: TechnologyHandbook = {
  title: GIT_TITLE,
  description: "Every command you actually use, each with the process to run it: staging and committing, branching and merging, rebase and cherry-pick, remotes, and the several different ways to undo something.",
  questionPrefix: "Git",
  topics,
  categories: [...counts].map(([name, count]) => ({ name, count })),
  sources: GIT_SOURCES,
};

/** The authored rows, for the tests that hold this handbook to its own shape. */
export const GIT_ROWS = ROWS;
