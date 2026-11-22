import type { ExamPortal } from "./portal";
/*
 * The two exam portals' blogs: the Scholars Journal (Board Scholars, /exams/board-exams/blog) and the Aspirants
 * Digest (Exam Aspirants, /exams/competitive-exams/blog). Both are separate from Tech Buzz, the Tech Pro blog.
 * Posts are hand-written here; a block is a heading, a paragraph or a list. A post's category decides which blog it
 * appears in: "Study Method" posts appear in both.
 */
export type ExamPostBlock = { h: string } | { p: string } | { ul: string[] };
type ExamPostDraft = { slug: string; title: string; summary: string; category: "Board Exams" | "Competitive Exams" | "Study Method"; date: string; minutes: number; body: ExamPostBlock[] };
export type ExamPost = ExamPostDraft & { portals: ExamPortal[] };

const DRAFTS: ExamPostDraft[] = [
  {
    slug: "reading-a-board-sample-paper", title: "How to read your board's sample paper before you study", category: "Board Exams", date: "2026-11-21", minutes: 5,
    summary: "The sample paper is the board telling you what it will ask. Read it like a map, not a test.",
    body: [
      { p: "Every board publishes a sample or model paper before the examination: CBSE on its academic website, UP Board on upmsp.edu.in, CISCE as specimen papers. Most students solve it once in March. Read it in the first week instead." },
      { h: "Count the marks, not the questions" },
      { p: "Make a table of chapters and the marks each one carries. In most papers a handful of chapters carry half the marks. Those chapters get your first and best hours." },
      { h: "Notice the question types" },
      { ul: ["Case-based and assertion-reason questions need practice in that exact format.", "Long answers usually come from derivations, theorems and proofs that repeat.", "Internal choice tells you which topics the board treats as interchangeable."] },
      { h: "Then use the Most Asked list" },
      { p: "In Board Exams, open Most Asked for your subject. Five-star questions match the patterns that recur in papers, so they are where the sample paper and your revision meet." },
    ],
  },
  {
    slug: "presentation-that-earns-marks", title: "Answer presentation that earns marks in boards", category: "Board Exams", date: "2026-11-19", minutes: 4,
    summary: "Examiners read hundreds of copies in a day. A clear answer is easier to mark, and easier to mark generously.",
    body: [
      { p: "Two students can know the same thing and score differently. The difference is usually how the answer looks on the page." },
      { h: "Make the examiner's job easy" },
      { ul: ["Write the question number clearly in the margin.", "Underline the key term or final answer once, not every line.", "Draw diagrams in pencil, labelled, next to the text that explains them.", "Leave a line between answers."] },
      { h: "Match length to marks" },
      { p: "A two-mark answer needs two clear points, not a page. A five-mark answer needs an introduction, the main points and a conclusion or final result. Writing more than the marks ask for costs time you need later." },
      { h: "In English, structure is half the score" },
      { p: "Letters, notices and articles have fixed formats. The Rules & Formats sheet for English in Board Exams lists each one; the format marks are the easiest marks in the paper." },
    ],
  },
  {
    slug: "class-12-boards-and-entrance-together", title: "Class 12 boards and entrance exams in the same year", category: "Board Exams", date: "2026-11-16", minutes: 5,
    summary: "Board marks and entrance ranks reward different skills. One plan can serve both if you schedule it honestly.",
    body: [
      { p: "Boards reward complete, well-presented answers. Entrance exams reward speed and accuracy on objective questions. The syllabus overlaps; the way you practise does not." },
      { h: "Split the year in two" },
      { ul: ["Until December: learn each chapter once for depth, then practise its objective questions.", "January to the boards: switch to board-style written answers and full timed papers.", "After the boards: return to objective practice and mock tests for the entrance exam."] },
      { h: "Do not drop the written practice" },
      { p: "Students who prepare only for the entrance exam lose marks in boards on derivations and long answers. Use the Solved & Unsolved questions to keep writing steps by hand every week." },
    ],
  },
  {
    slug: "managing-exam-day-nerves", title: "Exam-day nerves: a calm plan for the morning of the paper", category: "Study Method", date: "2026-11-13", minutes: 4,
    summary: "Nerves are normal. A fixed routine for the last twelve hours leaves less room for panic.",
    body: [
      { p: "Feeling anxious before a paper means you care about it. The aim is not to feel nothing but to keep the feeling from taking over." },
      { h: "The night before" },
      { ul: ["Revise only your own short notes and formula sheet; do not start anything new.", "Pack your admit card, ID, pens and water bottle before dinner.", "Sleep at your usual time. A rested brain recalls more than a tired one that read one more chapter."] },
      { h: "In the hall" },
      { p: "Use the reading time to choose the order of questions, starting with the ones you are sure of. If you freeze on a question, mark it, move on and come back. A breath out that is longer than the breath in slows the heart rate within a minute." },
    ],
  },
  {
    slug: "sectional-timing-strategy", title: "Sectional timing: how to stop one section eating the paper", category: "Competitive Exams", date: "2026-11-20", minutes: 5,
    summary: "Bank and SSC papers are lost on the clock more often than on knowledge. Plan your minutes before you enter.",
    body: [
      { p: "In an exam with sectional timing, unused minutes in one section do not carry over. In one without it, a hard section can take time from an easy one. Both need a plan made in advance." },
      { h: "Two rounds per section" },
      { ul: ["Round one: answer every question you can solve in under a minute; skip the rest.", "Round two: return to the skipped questions in order of how sure you are.", "Leave the last two minutes to check that every attempted answer is marked."] },
      { h: "Practise with the clock" },
      { p: "Accuracy at home means little if it falls apart at speed. Time yourself on sets of 20 objective questions from the exam's tab, and note which topics are slow: those need method, not more practice." },
    ],
  },
  {
    slug: "current-affairs-without-drowning", title: "Current affairs without drowning in news", category: "Competitive Exams", date: "2026-11-18", minutes: 4,
    summary: "You cannot read everything. Read what exams ask: schemes, appointments, reports, awards and summits.",
    body: [
      { p: "General Awareness rewards students who read news with a filter. Most questions come from a few predictable categories." },
      { h: "What to note" },
      { ul: ["Government schemes: launch year, ministry, target group and benefit.", "Appointments: who now heads which body.", "Reports and indices: the publisher and India's rank.", "Summits, awards and sports events: where, when and who won."] },
      { h: "A fifteen-minute habit" },
      { p: "Read one reliable newspaper's national and economy pages, write five facts in a notebook and revise the notebook every Sunday. Static GK, which never changes, sits in the objective questions of every exam tab." },
    ],
  },
  {
    slug: "ssc-cgl-posts-explained", title: "SSC CGL posts explained: Income Tax, CBI, Customs and more", category: "Competitive Exams", date: "2026-11-15", minutes: 5,
    summary: "One exam fills dozens of posts. Knowing which post you want changes how you prepare for the later stages.",
    body: [
      { p: "SSC CGL recruits for many central government posts at once: Inspectors of Income Tax, Central Excise and Customs, Sub-Inspectors in the CBI and NIA, Assistant Section Officers and auditors, among others." },
      { h: "Same paper, different requirements" },
      { ul: ["Inspector and Sub-Inspector posts often have physical standards and medical tests.", "Some posts need a typing or data-entry skill test.", "Your preference order, filled at the right stage, decides which post your rank gets you."] },
      { h: "Prepare for the post, not only the paper" },
      { p: "The CBI and Income Tax tabs in Competitive Exams cover what each department expects beyond the CGL paper: criminal law and investigation for the CBI, tax administration and GST for Income Tax." },
    ],
  },
  {
    slug: "mock-test-analysis", title: "A mock test is only as good as the hour after it", category: "Competitive Exams", date: "2026-11-11", minutes: 4,
    summary: "Taking mocks without analysing them is practice at making the same mistakes faster.",
    body: [
      { p: "Most aspirants take many mock tests and analyse few. The score matters less than what you change because of it." },
      { h: "Analyse in three columns" },
      { ul: ["Wrong answers: what was the error, concept or carelessness?", "Skipped questions: could you have solved them with more time?", "Correct but slow: is there a faster method?"] },
      { h: "Close the loop" },
      { p: "Turn each pattern into one action for the week, such as learning a shortcut, revising one topic or reading the full question before the options. Then check in the next mock whether that error has gone." },
    ],
  },
  {
    slug: "how-to-use-previous-year-questions", title: "How to use previous-year questions without wasting them", category: "Competitive Exams", date: "2026-11-15", minutes: 5,
    summary: "Previous-year questions are the best map of an exam, if you read them as a pattern and not as a list to memorise.",
    body: [
      { p: "Every competitive exam repeats itself. Not the exact question, but the idea behind it: the same Article, the same formula, the same kind of trap in the options. Previous-year questions show you that pattern, and that is why they deserve a method." },
      { h: "Sort before you solve" },
      { p: "Group the questions by topic first. Ten years of one topic on one page tells you more than ten full papers solved in order: you see which sub-topics come back and which appeared once and never again." },
      { h: "Mark what kind of mistake you made" },
      { ul: ["Did not know the fact: add it to your notes.", "Knew it but misread the question: slow down on the stem, not on the options.", "Narrowed to two options and picked wrong: revise the difference between those two, which is exactly what the examiner tests."] },
      { h: "Repeat on a schedule" },
      { p: "Solve a topic set, revisit it after three days, then after two weeks. The star ratings in the Competitive Exams section are there for the same reason: prepare what recurs first, then widen." },
    ],
  },
  {
    slug: "step-marking-in-board-exams", title: "Step marking: how board examiners actually award marks", category: "Board Exams", date: "2026-11-14", minutes: 4,
    summary: "In Mathematics, Physics and Chemistry a correct final answer is only part of the marks. The steps carry the rest.",
    body: [
      { p: "Board papers are marked against a scheme that gives marks to stages of a solution: the formula, the substitution, the calculation and the answer with its unit. A student who writes only the final line can lose most of the marks of a five-mark question." },
      { h: "Write one idea per line" },
      { ul: ["State the formula or law you are using.", "Substitute the given values with units.", "Show the working line by line; do not skip the algebra.", "Box the final answer and write the unit."] },
      { h: "A wrong answer can still score" },
      { p: "If the method is right and one calculation slips, the method marks stay. That is why the worked solutions in the Board Exams section are set out one step per line: copy that habit in your own answers." },
    ],
  },
  {
    slug: "the-last-thirty-days-before-boards", title: "The last thirty days before the board examination", category: "Board Exams", date: "2026-11-12", minutes: 5,
    summary: "A plan for the final month: finish, revise, then practise under the clock.",
    body: [
      { h: "Days 30 to 16: close the syllabus" },
      { p: "Finish whatever is left, chapter by chapter, with the question bank beside you. Do not start new reference books now." },
      { h: "Days 15 to 6: revise and test" },
      { ul: ["One full-length paper every second day, timed.", "Mark it strictly and list every lost mark with its reason.", "Revise formula sheets daily, a few minutes each."] },
      { h: "Days 5 to 1: stay light" },
      { p: "Read your own notes, the most-important questions and your list of mistakes. Sleep on time. The night before the paper is for rest, not for a new chapter." },
    ],
  },
  {
    slug: "negative-marking-when-to-guess", title: "Negative marking: when a guess is worth it", category: "Competitive Exams", date: "2026-11-10", minutes: 4,
    summary: "With one-third or one-fourth negative marking, an informed guess pays and a blind guess does not. Here is the arithmetic.",
    body: [
      { p: "In a four-option question with one-third negative marking, a blind guess earns nothing on average: one time in four you gain a mark, three times in four you lose a third. So blind guessing only adds risk." },
      { h: "Eliminate first" },
      { ul: ["Two options ruled out: the odds are one in two, and the guess is clearly worth taking.", "One option ruled out: a small expected gain; take it if you are short of the cut-off, leave it if you are comfortable.", "Nothing ruled out: leave it."] },
      { p: "Keep count of how many such guesses you take in a mock test and what they return. Your own figures are a better guide than any rule." },
    ],
  },
  {
    slug: "revision-that-sticks", title: "Revision that sticks: recall, do not re-read", category: "Study Method", date: "2026-11-08", minutes: 4,
    summary: "Re-reading feels productive and is not. Closing the book and recalling is harder and works far better.",
    body: [
      { p: "Reading a page again makes it feel familiar, and familiarity is easily mistaken for knowing. The test is whether you can produce the answer with the page closed." },
      { h: "Three habits" },
      { ul: ["After a topic, shut the book and write what you remember in two minutes.", "Use short questions with short answers, such as the Quick Q&A sets, and cover the answer before you look.", "Space it out: today, three days later, two weeks later."] },
      { p: "It will feel slower than reading. That effort is the learning." },
    ],
  },
  {
    slug: "choosing-between-exams", title: "Preparing for more than one exam at a time", category: "Competitive Exams", date: "2026-11-05", minutes: 4,
    summary: "SSC, banking and railways share a large common core. Prepare the core once, then add what each exam needs.",
    body: [
      { p: "Many candidates sit several exams in a year. That is workable because the papers overlap: quantitative aptitude, reasoning, English and general awareness appear in most of them." },
      { h: "Build the common core first" },
      { ul: ["Arithmetic: percentages, ratio, time and work, speed and distance.", "Reasoning: series, coding, directions, syllogisms, puzzles.", "General awareness: polity, history, geography, science."] },
      { h: "Then add the exam's own part" },
      { p: "Banking awareness for bank exams, railway facts for RRB, child development and pedagogy for TET. Give the exam nearest on the calendar the larger share of each week." },
    ],
  },
];
const portalsOf = (category: ExamPostDraft["category"]): ExamPortal[] => category === "Board Exams" ? ["boards"] : category === "Competitive Exams" ? ["competitive"] : ["boards", "competitive"];
export const EXAM_POSTS: ExamPost[] = DRAFTS.map(post => ({ ...post, portals: portalsOf(post.category) })).sort((a, b) => b.date.localeCompare(a.date));
export const examPost = (slug: string) => EXAM_POSTS.find(post => post.slug === slug);
/** The posts of one exam portal's blog, newest first. */
export const postsFor = (portal: ExamPortal) => EXAM_POSTS.filter(post => post.portals.includes(portal));
