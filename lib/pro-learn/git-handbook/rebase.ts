import type { GitRow } from "./shared";

/**
 * Rebase and cherry-pick: the two commands that copy commits.
 *
 * Both work the same way underneath — take the change a commit introduced and
 * apply it somewhere else, producing a new commit with a new hash. The
 * difference is only which commits are chosen and where they land, which is why
 * they are taught together here.
 */
export const GIT_REBASE: GitRow[] = [
  {
    name: "What rebase is",
    category: "Rebase & cherry-pick",
    summary: "Replaying your commits on top of a different base commit, so the branch looks as if it started there.",
    syntax: [
      "git rebase <new-base>",
      "git merge-base <a> <b>            # where the two diverged",
      "git log --oneline <base>..<branch> # what will be replayed",
    ],
    points: [
      "Rebase does not move commits — it copies them. Each replayed commit is a new object with a new hash, and the originals stay until garbage collection removes them.",
      "The result is a linear history with no merge commit: your work appears to have been written after everything already on the target branch.",
      "Because the hashes change, rebasing a branch that someone else has pulled forces them to reconcile two versions of the same work.",
    ],
    useCase: { title: "A feature branch that is three days behind main", scenario: "Merging main in repeatedly leaves the branch full of merge commits nobody reads, and a pull request diff that includes other people's changes." },
    steps: [
      { title: "Understand the starting shape", detail: "Your branch diverged from main at some commit; main has since moved on. The graph shows the fork.", code: "git log --oneline --graph --all -15" },
      { title: "Find the divergence point", detail: "The merge base is the last commit both branches share — the point rebase will move your commits away from.", code: "git merge-base main feature/api\ngit log --oneline main..feature/api" },
      { title: "See what will be replayed", detail: "These are the commits that will be copied, oldest first.", code: "git log --oneline --reverse main..feature/api" },
      { title: "Rebase", detail: "Git rewinds your commits, moves the branch to main's tip and reapplies each one in order.", code: "git switch feature/api\ngit fetch origin\ngit rebase origin/main" },
      { title: "Confirm the history is now linear", detail: "Your commits sit directly on top of main, with new hashes and no merge commit.", code: "git log --oneline --graph -15" },
    ],
    pitfall: "Rebasing a branch that has been pushed and pulled by someone else rewrites commits they already have. Their next pull produces a duplicate of every commit. Rebase only what is private, or agree the branch is yours alone.",
    questions: [
      { question: "What does rebase actually do to each commit?", answer: "It takes the diff the commit introduced and applies it to the new base, then makes a new commit with the same message and author but a new parent — and therefore a new hash." },
      { question: "Why do I get conflicts commit by commit?", answer: "Because each commit is applied separately. You resolve the conflict as it was at that point in your branch's history, which is smaller and more understandable than one giant merge conflict." },
    ],
  },
  {
    name: "git rebase",
    category: "Rebase & cherry-pick",
    summary: "Move the current branch's commits onto a new base, replaying each one in order.",
    syntax: [
      "git rebase [<upstream>] [<branch>]",
      "git rebase (--continue | --skip | --abort)",
      "git push --force-with-lease",
    ],
    points: [
      "`git rebase <base>` replays the commits that are on your branch but not on `<base>`, in the order you made them.",
      "A conflict stops the rebase mid-way: you resolve it, `git add` the files, and `git rebase --continue` to carry on with the next commit.",
      "`git rebase --abort` at any point returns the branch to exactly where it was before the rebase started.",
    ],
    useCase: { title: "Getting a clean pull request", scenario: "A branch merged repeatedly from main shows reviewers a diff full of other people's commits, and hides the five commits that are actually up for review." },
    steps: [
      { title: "Make sure the base is current", detail: "Fetch first; rebasing onto a stale local main just moves the problem.", code: "git fetch origin" },
      { title: "Start the rebase", detail: "Git checks out the base, then applies each of your commits to it in turn.", code: "git switch feature/api\ngit rebase origin/main" },
      { title: "Resolve a conflict if one stops it", detail: "During a rebase `--ours` is the base branch and `--theirs` is your commit. Stage the result; do not commit.", code: "git status\n# edit the conflicted files\ngit add src/payment.ts\ngit rebase --continue" },
      { title: "Skip a commit that is no longer needed", detail: "Use this when the change has already landed on the base by another route and the replay is empty.", code: "git rebase --skip" },
      { title: "Back out if it goes wrong", detail: "Abort restores the branch, the index and the working tree.", code: "git rebase --abort" },
      { title: "Publish the rewritten branch", detail: "The hashes changed, so a normal push is rejected. `--force-with-lease` refuses if someone else pushed in the meantime.", code: "git push --force-with-lease" },
    ],
    pitfall: "A rebase that stops on every commit with the same conflict usually means you are rebasing far too much at once. Abort, rebase in smaller steps, or enable `rerere` so each resolution is remembered.",
    questions: [
      { question: "How do I know a rebase is in progress?", answer: "`git status` says \"interactive rebase in progress\" or \"rebase in progress\" and names the commit being applied. `git rebase --abort` always gets you out." },
    ],
  },
  {
    name: "git rebase -i",
    category: "Rebase & cherry-pick",
    summary: "Interactive rebase: edit, reorder, combine, split or drop your commits before sharing them.",
    syntax: [
      "git rebase -i <base>",
      "git rebase -i --autosquash <base>",
      "# todo words: pick, reword, edit, squash, fixup, drop",
    ],
    points: [
      "Git opens a todo list of the commits, oldest at the top, each with a command word you change — `pick`, `reword`, `edit`, `squash`, `fixup`, `drop`.",
      "Reordering the lines reorders the commits, and deleting a line drops that commit entirely; the file you save is the plan Git then executes.",
      "`squash` keeps both commit messages for you to merge; `fixup` discards the second message, which is what you want for a \"fix typo\" commit.",
    ],
    useCase: { title: "Turning eight exploratory commits into three explainable ones", scenario: "A reviewer reading \"wip\", \"try again\", \"actually fix it\" has to reconstruct the intent from the diff, so they review the result instead of the reasoning." },
    steps: [
      { title: "Choose how far back to go", detail: "Rebase from the merge base with main, so you only touch commits that are yours.", code: "git rebase -i origin/main\n# or a fixed count:\ngit rebase -i HEAD~5" },
      { title: "Edit the todo list", detail: "Change the word at the start of each line. Leaving `pick` keeps the commit as it is.", code: "pick 7a1c2f3 Add retry queue\nfixup 9b2d4e1 fix typo\nreword 3c5f8a2 Add backoff\nsquash 1d7e9b4 tidy tests\ndrop 5e2a6c8 debug logging" },
      { title: "Work through what Git stops for", detail: "`reword` opens the message; `squash` opens a combined message; `edit` drops you at that commit so you can change it.", code: "# after an `edit` stop:\ngit add src/retry.ts\ngit commit --amend\ngit rebase --continue" },
      { title: "Split one commit into two", detail: "Mark it `edit`, reset it back into the working tree, then commit the pieces separately.", code: "git reset HEAD~\ngit add -p\ngit commit -m \"Add retry queue\"\ngit commit -am \"Add backoff policy\"\ngit rebase --continue" },
      { title: "Check the result and publish", detail: "Compare against the pre-rebase state before you force-push.", code: "git log --oneline -10\ngit push --force-with-lease" },
    ],
    pitfall: "Deleting a line in the todo list drops that commit with no warning, and the only trace afterwards is the reflog. If the editor opens and you are unsure, quit without saving — an empty or unchanged todo aborts the rebase safely.",
    questions: [
      { question: "What is the difference between squash and fixup?", answer: "Both combine a commit into the one above it. `squash` opens an editor with both messages so you can write a combined one; `fixup` keeps only the first message." },
      { question: "How do I squash automatically?", answer: "Commit with `git commit --fixup <hash>`, then run `git rebase -i --autosquash <base>`. Git orders and marks the fixup lines for you." },
    ],
  },
  {
    name: "git rebase --onto",
    category: "Rebase & cherry-pick",
    summary: "Move a precise range of commits onto a new base, when the branch's own base is not what you want to move from.",
    syntax: [
      "git rebase --onto <new-base> <old-base> [<branch>]",
      "git log --oneline <old-base>..<branch>   # exactly what moves",
    ],
    points: [
      "It takes three arguments: the new base, the old base, and the branch — \"take what is on <branch> but not on <old base>, and put it on <new base>\".",
      "This is the tool for branches built on other branches: when the parent branch is squash-merged, `--onto` moves only your own commits across.",
      "It is also how you drop a run of commits from the middle of a branch, by using the commit before them as the old base.",
    ],
    useCase: { title: "A branch stacked on another branch that got squashed", scenario: "A plain rebase replays the parent branch's commits too, producing a pull request full of changes that are already in main under different hashes." },
    steps: [
      { title: "Work out the three points", detail: "New base, old base, and the branch to move. Listing the range first shows exactly what will be replayed.", code: "git log --oneline feature/parent..feature/child" },
      { title: "Move only your own commits onto main", detail: "\"Take the commits on feature/child that are not on feature/parent, and replay them on main.\"", code: "git rebase --onto main feature/parent feature/child" },
      { title: "Drop a range from the middle of a branch", detail: "Replaying onto the commit before the unwanted range removes it.", code: "git rebase --onto 7a1c2f3~1 5e2a6c8 feature/api" },
      { title: "Lift the last few commits onto another branch", detail: "`HEAD~3` as the old base takes just the last three commits across.", code: "git rebase --onto release/1.5 HEAD~3 feature/api" },
      { title: "Verify before publishing", detail: "The range should now contain only what you meant to move.", code: "git log --oneline --graph main..feature/api\ngit push --force-with-lease" },
    ],
    pitfall: "Getting the argument order wrong replays the wrong range and can silently drop commits. Always run the `git log <old-base>..<branch>` first and read the list — that is exactly what will be replayed.",
    questions: [
      { question: "How do I remember the argument order?", answer: "Read it as a sentence: `git rebase --onto <where it goes> <where it currently starts> <what to move>`." },
    ],
  },
  {
    name: "Rebase vs merge",
    category: "Rebase & cherry-pick",
    summary: "Decide which to use by asking who else has the commits and what the history is for.",
    syntax: [
      "git rebase <upstream>          # replay yours on top, linear history",
      "git merge --no-ff <branch>     # record the join, keep both lines",
      "git config pull.rebase (true | false)",
    ],
    points: [
      "Merge preserves what actually happened, including that two lines of work ran in parallel; rebase presents a tidier story that never occurred.",
      "The one hard rule is about sharing: rebase only commits nobody else has pulled, because rebasing changes their hashes.",
      "A common compromise is rebase locally to keep the branch current, then merge with `--no-ff` so the feature stays visible as a unit.",
    ],
    useCase: { title: "A team arguing about history every sprint", scenario: "Without an agreed rule, half the branches arrive rebased and half arrive with merge commits, and the log is unusable for bisecting or release notes either way." },
    steps: [
      { title: "Ask whether the commits are shared", detail: "If the branch is pushed and someone else has pulled it, merge. If it is yours alone, rebase is safe.", code: "git branch -vv\ngit log --oneline origin/feature/api..feature/api" },
      { title: "Rebase to stay current while working", detail: "Daily, so each rebase is small.", code: "git fetch origin\ngit rebase origin/main" },
      { title: "Merge to integrate when finished", detail: "`--no-ff` keeps the feature's commits grouped and gives one commit to revert.", code: "git switch main\ngit merge --no-ff feature/api" },
      { title: "Enforce it rather than remember it", detail: "Configure pull to rebase and merges to be explicit.", code: "git config --global pull.rebase true\ngit config --global merge.ff false" },
      { title: "Check the result reads well", detail: "The graph is the deliverable here: a reader six months later should see features, not noise.", code: "git log --oneline --graph --decorate -25" },
    ],
    pitfall: "\"Never rebase\" and \"always rebase\" are both wrong. The question is only whether the commits are public. Rebasing your own unpushed work is always safe; rebasing a shared branch creates duplicate commits for everyone else.",
    questions: [
      { question: "Does rebasing lose information?", answer: "It loses the fact that the work was done in parallel with the base branch, and it loses the original commit hashes. The changes themselves are all preserved." },
    ],
  },
  {
    name: "What cherry-pick is",
    category: "Rebase & cherry-pick",
    summary: "Copying the change one commit introduced onto the current branch, without taking anything else from its branch.",
    syntax: [
      "git cherry-pick [-x] <commit>",
      "git show <commit>                     # read it before copying it",
      "git log --cherry-mark --left-right <a>...<b>",
    ],
    points: [
      "Cherry-pick applies a commit's diff, not the commit: the result is a new commit with a new hash, the same message and a new parent.",
      "Nothing about the source branch is recorded, so the same change can exist twice in history with no link between the two copies.",
      "It is the right tool for one commit and the wrong one for ten — a run of commits is a branch, and a branch should be merged or rebased.",
    ],
    useCase: { title: "A fix on main that a supported release also needs", scenario: "Merging main into the release branch would drag in every feature since the release, which is exactly what a maintenance branch exists to avoid." },
    steps: [
      { title: "Find the commit to copy", detail: "The hash is all you need; it can be on any branch, or on none.", code: "git log --oneline --all --grep=\"invoice rounding\"" },
      { title: "See what it actually changes", detail: "Read it before copying it — a fix often depends on a refactor that landed before it.", code: "git show 9fceb02" },
      { title: "Switch to where it should go", detail: "Cherry-pick applies to the branch you are on.", code: "git switch release/1.5" },
      { title: "Apply it", detail: "Git creates a new commit with the same message and a note of where it came from if you ask for one.", code: "git cherry-pick -x 9fceb02" },
      { title: "Confirm both copies exist", detail: "`git log --cherry-mark` shows which commits on two branches are equivalent.", code: "git log --oneline --cherry-mark --left-right main...release/1.5" },
    ],
    pitfall: "Cherry-picking a fix that depends on an earlier refactor applies cleanly and then fails at runtime, because Git only checks whether the text merges. Read `git show` first and pick the dependency too, or port the fix by hand.",
    questions: [
      { question: "How is cherry-pick different from rebase?", answer: "They do the same thing to each commit. Rebase replays a whole range onto a new base and moves the branch; cherry-pick replays the commits you name onto wherever you are, and leaves the source branch alone." },
      { question: "What does -x do?", answer: "It appends \"(cherry picked from commit …)\" to the message, which is the only record linking the copy to the original. Use it on anything long-lived." },
    ],
  },
  {
    name: "git cherry-pick",
    category: "Rebase & cherry-pick",
    summary: "Apply one or more named commits onto the current branch as new commits.",
    syntax: [
      "git cherry-pick [-x] [-n] <commit>...",
      "git cherry-pick <start>^..<end>          # an inclusive range",
      "git cherry-pick -m <parent-number> <merge-commit>",
      "git cherry-pick (--continue | --skip | --abort)",
    ],
    points: [
      "`-n` applies the change without committing, so you can adjust it or combine several picks into one commit.",
      "A range uses `A..B`, which is exclusive of `A` — use `A^..B` when you mean to include `A` itself.",
      "`--continue`, `--skip` and `--abort` control a pick that stopped on a conflict, exactly as they do during a rebase.",
    ],
    useCase: { title: "Backporting a security fix to two supported versions", scenario: "Re-implementing the fix by hand on each branch produces three slightly different fixes, and the one nobody tested is the one that ships." },
    steps: [
      { title: "Pick a single commit", detail: "`-x` records the original hash in the message so the copy can be traced.", code: "git switch release/1.5\ngit cherry-pick -x 9fceb02" },
      { title: "Pick several commits", detail: "They are applied in the order given, each becoming its own commit.", code: "git cherry-pick -x 9fceb02 7a1c2f3 3c5f8a2" },
      { title: "Pick a range", detail: "`A^..B` includes both ends; `A..B` excludes A, which is the usual off-by-one.", code: "git cherry-pick -x 9fceb02^..3c5f8a2" },
      { title: "Apply without committing", detail: "Useful when two picked commits should land as one, or the change needs adjusting for this branch.", code: "git cherry-pick -n 9fceb02 7a1c2f3\ngit status --short\ngit commit -m \"Backport invoice rounding fix\"" },
      { title: "Handle a conflict", detail: "Resolve, stage, continue. Skip if the change turns out to be already present.", code: "git status\ngit add src/invoice.ts\ngit cherry-pick --continue\n# or: git cherry-pick --skip\n# or: git cherry-pick --abort" },
      { title: "Verify and push", detail: "Check the fix is present and the tests for it pass on this branch too.", code: "git log --oneline -3\nnpm test\ngit push" },
    ],
    pitfall: "Cherry-picking a merge commit fails without `-m`, because Git cannot tell which parent's changes you mean. `-m 1` takes the change relative to the first parent, which is almost always the branch you merged into.",
    questions: [
      { question: "Will the same fix merge cleanly later?", answer: "Usually, because Git recognises patches that are already applied. But an adjusted backport can conflict with its own original when the branches are merged, which is one reason to port fixes forward rather than backward where you can." },
      { question: "How do I cherry-pick a merge commit?", answer: "`git cherry-pick -m 1 <hash>`, choosing which parent to treat as the mainline. Consider whether you want the merge at all — often the individual commits are a better pick." },
    ],
  },
  {
    name: "git rerere",
    category: "Rebase & cherry-pick",
    summary: "Record how you resolved a conflict and replay that resolution automatically next time it appears.",
    syntax: [
      "git config --global rerere.enabled true",
      "git rerere (diff | status | forget <path>)",
    ],
    points: [
      "\"Reuse recorded resolution\" is off by default; once enabled it records every conflict resolution you make and reapplies matching ones silently.",
      "It pays for itself during a long rebase, where the same conflict recurs on commit after commit, and when re-merging a long-lived branch.",
      "The recorded resolutions live in `.git/rr-cache` and are local to your machine — they are not shared with the team.",
    ],
    useCase: { title: "A rebase that hits the same conflict twenty times", scenario: "Resolving the same three lines on every replayed commit is where people give up on rebasing and merge instead." },
    steps: [
      { title: "Turn it on", detail: "Global, so it applies everywhere. There is little reason to enable it per repository.", code: "git config --global rerere.enabled true" },
      { title: "Resolve a conflict once as usual", detail: "Git records the conflict and your resolution as you stage the file.", code: "git rebase origin/main\n# resolve the conflict\ngit add src/payment.ts\ngit rebase --continue" },
      { title: "Watch it replay", detail: "The next time the same conflict appears, Git resolves it and says \"Resolved … using previous resolution\".", code: "git rebase --continue" },
      { title: "Check what it did before trusting it", detail: "A replayed resolution is still staged for you to review; it is not committed unseen.", code: "git rerere diff\ngit diff --staged" },
      { title: "Forget a resolution that was wrong", detail: "Clears the recorded answer for the current conflict so you can resolve it again.", code: "git rerere forget src/payment.ts" },
    ],
    pitfall: "A resolution recorded wrongly is replayed wrongly, quietly, every time. If a rebase produces a change you did not expect in a file you did not touch, `git rerere forget` that path and resolve it again.",
  },
  {
    name: "git revert",
    category: "Rebase & cherry-pick",
    summary: "Undo a commit by making a new commit that applies the opposite change.",
    syntax: [
      "git revert [-n] <commit>...",
      "git revert -m <parent-number> <merge-commit>",
      "git revert (--continue | --abort)",
    ],
    points: [
      "Revert adds to history rather than rewriting it, which makes it the only safe undo for a commit that has already been pushed.",
      "Reverting a merge needs `-m 1` to say which parent is the mainline, and the result is that the merged branch cannot simply be re-merged later.",
      "`-n` reverts without committing, so several reverts can be combined into one commit with one explanation.",
    ],
    useCase: { title: "A bad change that is already in production", scenario: "Resetting and force-pushing a shared branch breaks every clone of it; revert undoes the change while leaving everyone's history valid." },
    steps: [
      { title: "Identify the commit", detail: "Confirm it is the right one by reading its diff before undoing it.", code: "git log --oneline -10\ngit show 9fceb02" },
      { title: "Revert it", detail: "Git creates a new commit with the inverse change and a default message naming the original.", code: "git revert 9fceb02" },
      { title: "Revert several commits", detail: "Newest first, so each inverse applies cleanly.", code: "git revert --no-commit 3c5f8a2 7a1c2f3 9fceb02\ngit commit -m \"Revert the webhook retry series\"" },
      { title: "Revert a merge commit", detail: "`-m 1` treats the first parent — the branch you merged into — as the mainline.", code: "git revert -m 1 4a9d1c7" },
      { title: "Push the undo", detail: "An ordinary push: nothing was rewritten, so nobody has to reconcile anything.", code: "git push" },
    ],
    pitfall: "After reverting a merge, re-merging the same branch brings in nothing: Git considers those commits already merged. You have to revert the revert first, which is why reverting a merge is a decision rather than a quick fix.",
    questions: [
      { question: "Revert or reset?", answer: "Reset if the commit is local and unpushed — it disappears cleanly. Revert if anyone else could have it — it undoes the change without invalidating their history." },
    ],
  },
];
