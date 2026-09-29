import type { GitRow } from "./shared";

/** Setting a repository up, and the add–commit loop everything else sits on. */
export const GIT_BASICS: GitRow[] = [
  {
    name: "git init",
    category: "Getting started",
    summary: "Turn an ordinary folder into a Git repository by creating the .git directory inside it.",
    syntax: [
      "git init [-b <branch>] [<directory>]",
      "git init --bare <directory>.git",
    ],
    points: [
      "Everything Git knows lives in the `.git` folder beside your files; delete it and the project becomes an ordinary folder again with no history.",
      "`git init` creates no commit — the repository exists but has no branch until the first commit, which is why `git branch` prints nothing at first.",
      "`git init -b main` sets the initial branch name in one step, instead of creating `master` and renaming it afterwards.",
    ],
    useCase: { title: "Starting a project that does not exist anywhere yet", scenario: "Without a repository from the first hour, the early decisions have no record, and the first mistake has nothing to roll back to." },
    steps: [
      { title: "Create the repository", detail: "Run init inside the project folder. `-b main` names the first branch so you never have to rename it later.", code: "cd my-project\ngit init -b main" },
      { title: "Tell Git who you are", detail: "A commit records an author. Set this once globally, or per repository when a project needs a different identity.", code: "git config user.name \"Your Name\"\ngit config user.email \"you@example.com\"" },
      { title: "Check what Git can see", detail: "Every file is untracked at this point — Git has noticed them but is not yet recording them.", code: "git status --short" },
      { title: "Make the first commit", detail: "Add a .gitignore first so build output and secrets never enter history, then stage and commit everything that remains.", code: "printf 'node_modules/\\n.env\\n' > .gitignore\ngit add .\ngit commit -m \"Initial commit\"" },
      { title: "Confirm the repository has a history", detail: "A branch now exists and points at that first commit.", code: "git log --oneline\ngit branch" },
    ],
    pitfall: "Running `git init` in your home directory by mistake makes Git treat every file on the machine as a project. If `git status` lists thousands of files, you are in the wrong folder — delete that stray `.git` and start again in the right one.",
    questions: [
      { question: "What is the difference between git init and git clone?", answer: "`init` creates an empty repository from a folder you already have; `clone` copies an existing repository, its history and its remote configuration from somewhere else." },
      { question: "Does git init lose my files?", answer: "No. It only adds a `.git` folder. Your files are untouched and untracked until you add and commit them." },
    ],
  },
  {
    name: "git clone",
    category: "Getting started",
    summary: "Copy an existing repository, its full history and its branches onto your machine.",
    syntax: [
      "git clone <url> [<directory>]",
      "git clone --branch <name> --depth <n> <url>",
      "git clone --recurse-submodules <url>",
    ],
    points: [
      "A clone brings the entire history, not just the latest files, which is why you can read a log and switch branches with no network connection.",
      "The source is saved as a remote named `origin`, and the default branch is checked out with tracking already configured.",
      "`--depth 1` makes a shallow clone that downloads only the latest commit — far faster for CI, but `git log` and `git blame` then have almost nothing to read.",
    ],
    useCase: { title: "Joining a project that already exists", scenario: "A download of the files gives you the code without the history, so you cannot see why any line is the way it is, or push a change back." },
    steps: [
      { title: "Clone the repository", detail: "Git creates a folder named after the repository and checks out its default branch.", code: "git clone https://github.com/org/project.git\ncd project" },
      { title: "Check what came with it", detail: "The remote is already configured, and the local branch already tracks its counterpart on the server.", code: "git remote -v\ngit branch -vv" },
      { title: "See the branches that exist on the server", detail: "Only the default branch is checked out locally; the rest are remote-tracking references until you create a local branch from one.", code: "git branch -r" },
      { title: "Clone into a folder of your own naming", detail: "Add a directory argument when the repository name is not the folder name you want.", code: "git clone git@github.com:org/project.git app" },
      { title: "Clone shallowly when history is not needed", detail: "Useful for a build agent that only compiles the current code. Convert it to a full clone later with `git fetch --unshallow`.", code: "git clone --depth 1 --branch main https://github.com/org/project.git" },
    ],
    pitfall: "A shallow clone silently breaks anything that reads history — `git blame`, `git bisect`, `git describe` and most release tooling. If a CI step reports a missing commit, the shallow clone is usually the reason.",
    questions: [
      { question: "HTTPS or SSH for cloning?", answer: "HTTPS works anywhere and needs a token for pushes; SSH needs a key on the machine but then pushes without prompting. Teams usually clone over SSH for daily work and HTTPS in CI." },
      { question: "How do I get a branch that was not checked out?", answer: "`git switch <branch>` is enough after a normal clone: Git finds the remote-tracking branch and creates a local one that tracks it." },
    ],
  },
  {
    name: "git config",
    category: "Getting started",
    summary: "Read and set the settings that decide how Git behaves, at repository, user or system level.",
    syntax: [
      "git config [--global|--system|--local] <key> [<value>]",
      "git config --list --show-origin",
      "git config --global --unset <key>",
    ],
    points: [
      "Three levels stack: `--system` for the machine, `--global` for your user, and the repository's own `.git/config` — the narrowest one set wins.",
      "`git config --list --show-origin` prints every setting along with the file it came from, which is the fastest way to explain surprising behaviour.",
      "Identity is per repository when you set it without `--global`, which is how one machine commits as you at work and as you personally at home.",
    ],
    useCase: { title: "Committing under the wrong name on a work machine", scenario: "A global identity set once follows you into every client repository, and the fix afterwards is rewriting the author of every commit you made." },
    steps: [
      { title: "See what is set and where", detail: "The origin column tells you which file to edit when a setting is wrong.", code: "git config --list --show-origin" },
      { title: "Set your identity globally", detail: "This is the default for every repository on the machine.", code: "git config --global user.name \"Your Name\"\ngit config --global user.email \"you@example.com\"" },
      { title: "Override it for one repository", detail: "Run this inside the repository, without `--global`, and it applies only there.", code: "git config user.email \"you@company.com\"\ngit config user.email" },
      { title: "Set the defaults most teams want", detail: "A named default branch, rebase on pull, and automatic pruning of deleted remote branches.", code: "git config --global init.defaultBranch main\ngit config --global pull.rebase true\ngit config --global fetch.prune true" },
      { title: "Add an alias for a command you type often", detail: "Aliases live in config and work like built-in subcommands.", code: "git config --global alias.lg \"log --oneline --graph --decorate\"\ngit lg" },
    ],
    pitfall: "Setting `user.email` globally to a work address is the usual cause of commits pushed to a personal repository under a company identity. Set identity per repository, or use conditional includes keyed on the folder.",
    questions: [
      { question: "Where does Git store this?", answer: "System settings in `/etc/gitconfig`, user settings in `~/.gitconfig`, and repository settings in that repository's `.git/config`. They are plain text and can be edited by hand." },
      { question: "How do I unset something?", answer: "`git config --global --unset <key>` removes one value; `--unset-all` removes every value for a multi-valued key." },
    ],
  },
  {
    name: "git status",
    category: "Getting started",
    summary: "Show which files are changed, which are staged for the next commit, and which Git is ignoring.",
    syntax: [
      "git status [--short] [--branch] [--ignored]",
    ],
    points: [
      "It reports three zones at once: untracked files, changes not staged, and changes staged — and a file can appear in two of them at the same time.",
      "`git status --short` gives one line per file with a two-letter code: the left letter is the staging area, the right one is the working tree.",
      "It also names the branch, how far ahead or behind its upstream it is, and any operation in progress such as a rebase or a merge.",
    ],
    useCase: { title: "Knowing what you are about to commit", scenario: "Committing without checking is how a debug print, a local config file or a half-finished refactor reaches the shared branch." },
    steps: [
      { title: "Read the full report", detail: "The long form names each zone and tells you the command that moves a file between them.", code: "git status" },
      { title: "Read it compactly once you know the codes", detail: "`M ` is staged, ` M` is modified but unstaged, `MM` is both, `??` is untracked.", code: "git status --short --branch" },
      { title: "Include what is being ignored", detail: "Useful when a file you expect to commit never appears — it is usually matched by a .gitignore rule.", code: "git status --ignored" },
      { title: "Check before every commit", detail: "Make this the reflex between staging and committing, not an occasional check.", code: "git add -p\ngit status --short\ngit commit" },
    ],
    pitfall: "A file already committed is not affected by adding it to .gitignore later. `git status` keeps reporting its changes until you untrack it with `git rm --cached <file>`.",
    questions: [
      { question: "Why is a file listed as both staged and modified?", answer: "You staged it and then edited it again. The staged version and the working version differ, and a commit now would record only the staged one." },
    ],
  },
  {
    name: "git add",
    category: "Getting started",
    summary: "Stage changes, choosing exactly what the next commit will contain.",
    syntax: [
      "git add <pathspec>...",
      "git add -p [<pathspec>]",
      "git add -A | -u | .",
    ],
    points: [
      "Staging is a separate step on purpose: it lets one messy working tree become several clean, separately reviewable commits.",
      "`git add -p` walks through each change and asks whether to stage it, so a bug fix and a refactor made in the same file can still be committed apart.",
      "`git add .` stages everything under the current folder including new files; `git add -u` stages only changes to files Git already tracks.",
    ],
    useCase: { title: "Separating a fix from the tidying done around it", scenario: "One commit containing both is impossible to revert without undoing the other, and impossible to review without reading the whole diff twice." },
    steps: [
      { title: "See what could be staged", detail: "Start from the diff of the working tree so you know what you are choosing between.", code: "git diff" },
      { title: "Stage a whole file", detail: "Use this when the file's changes all belong to one commit.", code: "git add src/payment.ts" },
      { title: "Stage part of a file", detail: "Git offers each hunk in turn: `y` stages it, `n` skips it, `s` splits it smaller, `e` opens it for editing.", code: "git add -p src/payment.ts" },
      { title: "Check what is now staged", detail: "`--staged` diffs the staging area against the last commit — this is what the commit will contain.", code: "git diff --staged" },
      { title: "Unstage anything that slipped in", detail: "Restoring the staged copy leaves your working file untouched.", code: "git restore --staged src/debug.ts" },
    ],
    pitfall: "`git add .` from the repository root sweeps in log files, local environment files and editor folders the first time they appear. Read `git status --short` after staging, before committing.",
    questions: [
      { question: "What is the staging area actually for?", answer: "It is a draft of the next commit. It lets you build a commit deliberately rather than committing whatever state the working tree happens to be in." },
      { question: "Does staging save my work?", answer: "Partly. Staged content survives in Git's object store and can be recovered, but it is not a commit and is not pushed anywhere." },
    ],
  },
  {
    name: "git commit",
    category: "Getting started",
    summary: "Record the staged changes permanently in history, with a message explaining why.",
    syntax: [
      "git commit [-m <message>]",
      "git commit -a -m <message>",
      "git commit --amend [--no-edit]",
    ],
    points: [
      "A commit stores a full snapshot of the tracked tree, not a patch — the diff you see is calculated against its parent when you ask for it.",
      "Every commit has an author, a committer, a parent and a hash over all of it, which is why rewriting any commit changes the hash of every commit after it.",
      "`git commit -a` stages tracked files automatically but never adds new ones, which is why a new file can be missing from a commit made that way.",
    ],
    useCase: { title: "Making a change you can return to", scenario: "Work that is never committed cannot be compared, reverted, shared or bisected — the only record of it is whatever the editor happens to still hold." },
    steps: [
      { title: "Stage what belongs together", detail: "One commit, one reason. Split anything that would need two sentences to explain.", code: "git add -p" },
      { title: "Commit with a message", detail: "A short subject line in the imperative, then a blank line, then why the change was needed.", code: "git commit -m \"Retry failed payment webhooks\" -m \"The provider redelivers for 24h; without a retry we lost every event during the outage.\"" },
      { title: "Write a longer message in the editor", detail: "Running commit with no `-m` opens your editor with the status as a comment block for reference.", code: "git commit" },
      { title: "Check what you recorded", detail: "Show the last commit with its diff before you push it anywhere.", code: "git show --stat HEAD" },
      { title: "Skip the staging step when appropriate", detail: "`-a` stages tracked modifications only. Confirm with status that nothing new was left behind.", code: "git commit -a -m \"Fix rounding in invoice totals\"\ngit status --short" },
    ],
    pitfall: "`git commit -am` looks like it commits everything, but new untracked files are silently excluded. A feature that works locally and fails in CI because one new file was never committed is the usual symptom.",
    questions: [
      { question: "What makes a good commit message?", answer: "A subject line under about fifty characters saying what the change does, and a body saying why it was needed. The diff already says how." },
      { question: "Is a commit private until I push?", answer: "Yes. Committing writes to your local repository only; nothing leaves the machine until `git push`." },
    ],
  },
  {
    name: ".gitignore",
    category: "Getting started",
    summary: "List the paths Git should not track, so build output and secrets never enter history.",
    syntax: [
      "<pattern>            # ignore matching paths",
      "<directory>/         # ignore a whole directory",
      "!<pattern>           # re-include something an earlier rule excluded",
      "git check-ignore -v <path>",
    ],
    points: [
      "Ignore rules apply only to untracked files — a file already committed keeps being tracked until you remove it with `git rm --cached`.",
      "Rules stack: the repository's `.gitignore`, any `.gitignore` in a subfolder, `.git/info/exclude` for private rules, and a global ignore file for editor noise.",
      "`git check-ignore -v <path>` prints the exact file and line of the rule that is excluding a path, which ends most arguments about why a file will not add.",
    ],
    useCase: { title: "Keeping credentials out of a public repository", scenario: "A committed `.env` stays in history after it is deleted, so the only real fix is rotating every secret it contained." },
    steps: [
      { title: "Write the rules", detail: "One pattern per line. A trailing slash means a directory; a leading `!` re-includes something an earlier rule excluded.", code: "cat > .gitignore <<'EOF'\nnode_modules/\ndist/\n.env\n.env.*\n!.env.example\n*.log\nEOF" },
      { title: "Check a rule is doing what you think", detail: "The output names the file and line number responsible.", code: "git check-ignore -v .env" },
      { title: "Untrack a file that was committed before the rule existed", detail: "`--cached` removes it from Git while leaving it on disk. Commit that removal.", code: "git rm --cached .env\ngit commit -m \"Stop tracking local environment file\"" },
      { title: "Add rules that are yours alone", detail: "Editor and OS noise belongs in your global ignore file, not in a file the whole team shares.", code: "git config --global core.excludesFile ~/.gitignore_global\nprintf '.DS_Store\\n.idea/\\n' >> ~/.gitignore_global" },
    ],
    pitfall: "Adding a secret to .gitignore after committing it changes nothing: the value is still in history and still readable by anyone who clones. Rotate the secret, then remove it from history with `git filter-repo`.",
    questions: [
      { question: "Why is my ignored file still showing in status?", answer: "Because it is already tracked. Ignore rules are only consulted for untracked paths; run `git rm --cached` to untrack it." },
    ],
  },
  {
    name: "git log",
    category: "Getting started",
    summary: "Read the commit history, filtered and formatted to answer a specific question.",
    syntax: [
      "git log [<revision-range>] [-- <path>...]",
      "git log --oneline --graph --decorate --all",
      "git log -S <string> | --grep <pattern> | --author <name>",
    ],
    points: [
      "The default output is one screen per commit; `--oneline` is what makes a history of thousands of commits readable at a glance.",
      "Filters compose: `--author`, `--since`, `--grep` for messages, `-S` for commits that changed how often a string appears, and `-- <path>` for one file.",
      "`--graph --decorate --all` draws the branch structure with branch and tag names on it, which is the fastest way to understand a repository you have just cloned.",
    ],
    useCase: { title: "Finding when a line of behaviour changed", scenario: "Without a targeted log you read every commit since the release, or guess — and the commit that caused the bug is usually not the one that looks related." },
    steps: [
      { title: "Skim the recent history", detail: "One line per commit, newest first.", code: "git log --oneline -20" },
      { title: "See the shape of the branches", detail: "The graph shows where work diverged and where it merged back.", code: "git log --oneline --graph --decorate --all -30" },
      { title: "Limit it to one file or folder", detail: "Everything after `--` is a path, which removes the ambiguity with branch names.", code: "git log --oneline -- src/payment.ts" },
      { title: "Search for the commit that introduced a string", detail: "`-S` finds commits where the number of occurrences of the text changed — this is how you find where a function was added.", code: "git log -S \"retryWebhook\" --oneline" },
      { title: "Narrow by author and date", detail: "Both accept loose, human dates.", code: "git log --author=\"Priya\" --since=\"3 weeks ago\" --oneline" },
    ],
    pitfall: "`git log` shows only commits reachable from the current branch. A commit that seems to have vanished after a reset or a rebase is usually still there and only reachable through `git reflog`.",
    questions: [
      { question: "How do I see what actually changed in each commit?", answer: "`git log -p` prints the patch with each commit, and `git log --stat` prints just the files and line counts." },
    ],
  },
  {
    name: "git diff",
    category: "Getting started",
    summary: "Show the difference between any two states: working tree, staging area, commits or branches.",
    syntax: [
      "git diff [-- <path>...]                 # worktree vs index",
      "git diff --staged [-- <path>...]        # index vs HEAD",
      "git diff <commit>..<commit> | <a>...<b>",
    ],
    points: [
      "With no arguments it compares the working tree to the staging area — the changes you have not staged yet, which is not the same as what will be committed.",
      "`git diff --staged` compares the staging area to the last commit, and is the only one of the two that shows what the next commit will contain.",
      "`git diff main...feature` with three dots compares the branch against the point it diverged, which is what a pull request shows.",
    ],
    useCase: { title: "Reviewing your own change before anyone else does", scenario: "Most review comments are about things the author would have caught by reading their own diff — a stray log line, a commented-out block, a rename left half done." },
    steps: [
      { title: "See what you have changed but not staged", detail: "This is the working tree against the index.", code: "git diff" },
      { title: "See what you are about to commit", detail: "The staged changes, against the last commit.", code: "git diff --staged" },
      { title: "Compare two branches", detail: "Three dots gives the changes on the feature branch only, ignoring anything that landed on main since you branched.", code: "git diff main...feature" },
      { title: "Compare one file across two commits", detail: "Any two revisions work — hashes, tags, `HEAD~3`, branch names.", code: "git diff HEAD~3 HEAD -- src/payment.ts" },
      { title: "Get a summary rather than a patch", detail: "Useful on a large change where the file list is the question.", code: "git diff --stat main...feature" },
    ],
    pitfall: "`git diff` after staging everything prints nothing, which reads as \"no changes\" and is really \"nothing left unstaged\". Use `git diff --staged` to see the change you are about to commit.",
    questions: [
      { question: "What is the difference between two dots and three dots?", answer: "`a..b` compares the two commits directly. `a...b` compares `b` against the merge base of `a` and `b` — the changes made on `b` alone, which is what a pull request reviews." },
    ],
  },
];
