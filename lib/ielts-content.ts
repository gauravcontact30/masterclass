/*
 * Learning content for the IELTS preparation hub (components/ielts-preparation.tsx, /learning/ielts).
 * Every exercise, passage, prompt and model phrase here is original practice material, not an official IELTS question.
 * Format facts follow the published test structure (ielts.org); the raw-score tables are the commonly used approximate
 * conversions, which the page labels as approximate.
 */

export type TestType = "academic" | "general";
export type Skill = "Listening" | "Reading" | "Writing" | "Speaking";
export const SKILLS: Skill[] = ["Listening", "Reading", "Writing", "Speaking"];

/** Format of each paper. `diff` says what changes between Academic and General Training. */
export const FORMAT: Record<Skill, { minutes: string; parts: string; questions: string; tests: string; diff: string; hi: string }> = {
  Listening: { minutes: "About 30 min", parts: "4 parts", questions: "40 questions", hi: "श्रवण",
    tests: "Following conversations and talks: specific details, opinions, purpose and how ideas connect.",
    diff: "Identical for Academic and General Training. Parts 1–2 are everyday situations; Parts 3–4 are study and lecture contexts." },
  Reading: { minutes: "60 min", parts: "3 sections", questions: "40 questions", hi: "पठन",
    tests: "Skimming, scanning, understanding the writer's claims, and locating exact evidence in long texts.",
    diff: "Academic uses three long texts from books, journals and magazines. General Training uses notices, workplace documents and one longer general-interest text." },
  Writing: { minutes: "60 min", parts: "2 tasks", questions: "150 + 250 words", hi: "लेखन",
    tests: "Answering the task fully, organising ideas logically, and using accurate, varied vocabulary and grammar.",
    diff: "Task 1 differs: Academic describes a chart, table, process or map; General Training is a letter. Task 2 is an essay in both, and counts for twice as much as Task 1." },
  Speaking: { minutes: "11–14 min", parts: "3 parts", questions: "Face to face", hi: "बोलना",
    tests: "Fluency, a range of vocabulary and grammar, and clear pronunciation in a recorded conversation with an examiner.",
    diff: "Identical for Academic and General Training: Part 1 interview, Part 2 long turn (1 minute to prepare, up to 2 minutes to speak), Part 3 discussion." },
};

export const FACTS = [
  { value: "4", label: "skills tested" },
  { value: "2 h 45 min", label: "total test time" },
  { value: "0–9", label: "band scale, in half bands" },
  { value: "1–2 days", label: "results on computer (13 days on paper)" },
];

/* ── Practice: Listening ─────────────────────────────────────────────────────────────────────────────────────── */
export type ListeningBlank = { label: string; accept: RegExp; answer: string };
export type ListeningExercise = { id: string; title: string; context: string; script: string; blanks: ListeningBlank[]; tip: string };
export const LISTENING: ListeningExercise[] = [
  { id: "adviser", title: "Exercise 1 · Appointment details", context: "Part 1 style: a short phone message.",
    script: "Your appointment with the course adviser is on Thursday at ten thirty in room fourteen. Please bring your student card.",
    blanks: [{ label: "What time is the appointment?", accept: /^(10[:.]30|ten thirty)(\s*(a\.?m\.?)?)?$/i, answer: "10:30 a.m." }],
    tip: "Distinguish the time from room number fourteen: numbers often appear close together to test careful listening." },
  { id: "sports", title: "Exercise 2 · Form completion", context: "Part 1 style: joining a sports centre. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
    script: "Good morning, Riverside Sports Centre. I'd like to join, please. Certainly, can I take your surname? It's Harper, that's H, A, R, P, E, R. And your postcode? B S 8, 4 Q T. When would you like to start? On the third of March, if possible. And which membership would you like? I was going to choose the full membership, but actually the off-peak one suits me better. That's twenty-eight pounds a month.",
    blanks: [
      { label: "Surname", accept: /^harper$/i, answer: "Harper" },
      { label: "Postcode", accept: /^bs8\s*4qt$/i, answer: "BS8 4QT" },
      { label: "Start date", accept: /^(3(rd)?\s*(of\s*)?march|march\s*3(rd)?)$/i, answer: "3 March" },
      { label: "Monthly cost (£)", accept: /^£?\s*28(\.00)?(\s*pounds)?$/i, answer: "£28" },
    ],
    tip: "The speaker changes her mind (full → off-peak). IELTS often includes a correction like this; the final choice is the answer." },
];
export const LISTENING_TIPS = [
  "Use the time before each part to read the questions and predict the type of answer (a number, a name, a noun).",
  "Spelling counts. Practise the alphabet and common spelling patterns for names and street names.",
  "Listen for signposting words such as however, actually and in fact: they often come just before the answer.",
  "Check the word limit. If the instruction says NO MORE THAN TWO WORDS, three words is wrong even if the meaning is right.",
];

/* ── Practice: Reading ───────────────────────────────────────────────────────────────────────────────────────── */
export type TfngQuestion = { q: string; answer: "True" | "False" | "Not given"; why: string };
export type ReadingSet = { title: string; source: string; passage: string; tfng: TfngQuestion[]; completion: { prompt: string; accept: RegExp; answer: string; why: string } };
export const READING: Record<TestType, ReadingSet> = {
  academic: {
    title: "Green roofs", source: "Academic style: an informative text of the kind found in magazines and journals.",
    passage: "Green roofs, which are partly or completely covered with vegetation, have been installed on buildings in many European cities since the 1970s. Their most widely reported benefit is the reduction of storm-water run-off: a planted roof can hold a significant share of the rain that falls on it and release it slowly. Researchers have also measured lower roof surface temperatures in summer, which can reduce the energy needed to cool the floors below. However, the initial cost of installation is higher than that of a conventional roof, and older buildings may need structural reinforcement to support the additional weight of soil and water. Some city governments now offer grants to property owners who install them.",
    tfng: [
      { q: "Green roofs were invented in the 1970s.", answer: "Not given", why: "The text says they have been installed in European cities since the 1970s; it never says when they were invented." },
      { q: "A green roof releases rainwater gradually.", answer: "True", why: "\"…hold a significant share of the rain … and release it slowly.\"" },
      { q: "A green roof is cheaper to install than a conventional roof.", answer: "False", why: "The initial cost is higher than that of a conventional roof." },
      { q: "Every city government offers grants for green roofs.", answer: "False", why: "Only some city governments offer grants; \"every\" contradicts the text." },
    ],
    completion: { prompt: "Older buildings may need ________ before a green roof can be added. (ONE OR TWO WORDS)", accept: /^(structural\s+)?reinforcement$/i, answer: "structural reinforcement", why: "Copy the words exactly from the passage; \"structural reinforcement\" fits the gap grammatically." },
  },
  general: {
    title: "Community library notice", source: "General Training style: a notice of the kind found in everyday life.",
    passage: "The community library now opens at eight instead of nine on weekdays. Weekend opening hours are unchanged. A new quiet room can be reserved online, but group activities take place in the main hall.",
    tfng: [
      { q: "The library opens earlier on weekdays.", answer: "True", why: "Eight is earlier than nine; the change applies to weekdays." },
      { q: "Weekend opening hours have changed.", answer: "False", why: "The passage explicitly says weekend hours are unchanged." },
      { q: "The quiet room is free to reserve.", answer: "Not given", why: "The passage says how to reserve it, but gives no price." },
    ],
    completion: { prompt: "Group activities are held in the ________. (TWO WORDS)", accept: /^(the\s+)?main\s+hall$/i, answer: "main hall", why: "The notice separates the bookable quiet room from the main hall used for groups." },
  },
};
export const READING_TIPS = [
  "True/False/Not given asks about facts; Yes/No/Not given asks about the writer's views. Decide which one you are answering.",
  "\"Not given\" means the text neither confirms nor contradicts the statement. Do not use your own knowledge.",
  "Answers to most question types appear in the same order as the text. Use that order to narrow your search.",
  "Spend about 20 minutes per section and move on; every question is worth one mark.",
];

/* ── Practice: Writing ───────────────────────────────────────────────────────────────────────────────────────── */
export type WritingTask = "task1" | "task2";
export const WRITING: Record<TestType, Record<WritingTask, { prompt: string; minutes: number; words: number; plan: string[] }>> = {
  academic: {
    task1: { minutes: 20, words: 150,
      prompt: "A library recorded 120 online loans in January, 180 in February, 150 in March and 240 in April. Summarise the main trends and compare relevant figures. Do not invent reasons for the changes.",
      plan: ["Introduction: paraphrase what the data shows (one sentence).", "Overview: the two or three most important trends, with no figures.", "Body 1: the rise from January to February and the dip in March, with figures.", "Body 2: the peak in April and a comparison with January."] },
    task2: { minutes: 40, words: 250,
      prompt: "Some people believe that working from home benefits both employees and employers, while others think it causes more problems than it solves. Discuss both views and give your own opinion.",
      plan: ["Introduction: paraphrase the question and state your opinion clearly.", "Body 1: the benefits view, one main idea developed with an example.", "Body 2: the problems view, one main idea developed with an example.", "Conclusion: restate your opinion; add no new ideas."] },
  },
  general: {
    task1: { minutes: 20, words: 150,
      prompt: "You recently borrowed a book from a friend and damaged it. Write a letter explaining what happened, apologising and suggesting how you will replace it.",
      plan: ["Greeting and purpose: why you are writing (informal tone for a friend).", "Bullet 1: explain what happened to the book.", "Bullet 2: apologise sincerely.", "Bullet 3: suggest how you will replace it, then a friendly closing."] },
    task2: { minutes: 40, words: 250,
      prompt: "In many countries, people are spending more of their free time on their phones. Why is this happening? Is it a positive or negative development?",
      plan: ["Introduction: paraphrase and give your overall answer to both questions.", "Body 1: two clear reasons, each explained.", "Body 2: your evaluation (positive or negative) with an example.", "Conclusion: summarise the reasons and your view."] },
  },
};
export const WRITING_CRITERIA = [
  { name: "Task achievement / response", note: "Answer every part of the task; in Task 1 give a clear overview, in Task 2 a clear position." },
  { name: "Coherence and cohesion", note: "One main idea per paragraph, logical order, and linking words used accurately, not mechanically." },
  { name: "Lexical resource", note: "Precise, varied vocabulary and natural collocations, with accurate spelling." },
  { name: "Grammatical range and accuracy", note: "A mix of simple and complex sentences, with most sentences free of errors." },
];

/* ── Practice: Speaking ──────────────────────────────────────────────────────────────────────────────────────── */
export const SPEAKING_PART1: { topic: string; questions: string[] }[] = [
  { topic: "Work or studies", questions: ["Do you work or are you a student?", "What do you enjoy most about it?", "Is there anything you would like to change about your job or course?"] },
  { topic: "Hometown", questions: ["Where is your hometown?", "What do people usually do there at weekends?", "Has it changed much since you were a child?"] },
  { topic: "Technology", questions: ["Which app do you use most often?", "Do you think you spend too much time online?", "What technology would you find hard to live without?"] },
  { topic: "Free time", questions: ["What do you like to do in your free time?", "Do you prefer spending free time alone or with others?", "Did you have the same hobbies when you were younger?"] },
];
export const SPEAKING_CUE_CARDS: { title: string; points: string[]; part3: string[] }[] = [
  { title: "Describe a skill you would like to learn.", points: ["what it is", "why it interests you", "how you would learn it", "and explain how you would use it."],
    part3: ["Which skills do you think young people should learn at school?", "Is it better to learn a skill from a teacher or online?", "How might the skills employers want change in the future?"] },
  { title: "Describe a website or app you find useful.", points: ["what it is", "how you found it", "what you use it for", "and explain why it is useful to you."],
    part3: ["How has the internet changed the way people find information?", "Should children's use of apps be limited?", "Do you think people trust online information too much?"] },
  { title: "Describe a time you had to wait for something.", points: ["what you waited for", "where you were", "how long you waited", "and explain how you felt while waiting."],
    part3: ["Why are people less patient today than in the past?", "Which services should never make people wait?", "Can waiting ever be a good thing?"] },
  { title: "Describe a place you would like to visit.", points: ["where it is", "how you know about it", "what you would do there", "and explain why you want to go."],
    part3: ["What are the benefits of travelling abroad?", "How does tourism affect local communities?", "Will people travel more or less in the future?"] },
];
export const SPEAKING_CRITERIA = [
  { name: "Fluency and coherence", note: "Speak at length without long pauses, and connect ideas with words like because, so and on the other hand." },
  { name: "Lexical resource", note: "Use topic vocabulary and paraphrase when you do not know a word." },
  { name: "Grammatical range and accuracy", note: "Mix tenses and sentence types naturally; self-correct briefly and move on." },
  { name: "Pronunciation", note: "Clear individual sounds, word stress and intonation; an accent is fine." },
];

/* ── Band scores ─────────────────────────────────────────────────────────────────────────────────────────────── */
/** Overall band: the mean of the four skills, rounded to the nearest half band (.25 rounds up to .5, .75 up to the next whole band). */
export const overallBand = (scores: number[]) => Math.floor((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 2 + 0.5) / 2;
/** Approximate raw score → band conversions ([minimum correct answers out of 40, band]), highest first. */
export const RAW_TABLES: Record<"listening" | "academicReading" | "generalReading", { label: string; rows: [number, number][] }> = {
  listening: { label: "Listening (Academic and General Training)", rows: [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4]] },
  academicReading: { label: "Academic Reading", rows: [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4]] },
  generalReading: { label: "General Training Reading", rows: [[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4]] },
};
export const rawToBand = (table: keyof typeof RAW_TABLES, correct: number) => RAW_TABLES[table].rows.find(([min]) => correct >= min)?.[1] ?? null;

/* ── Strategies by question type ─────────────────────────────────────────────────────────────────────────────── */
export const STRATEGIES: Record<Skill, { type: string; how: string }[]> = {
  Listening: [
    { type: "Form and note completion", how: "Predict the word type for each gap, follow the order of the form, and watch spelling and the word limit." },
    { type: "Multiple choice", how: "Underline the key words in each option; the speaker usually mentions all three, so listen for which one is confirmed." },
    { type: "Map and plan labelling", how: "Find the starting point first, then follow direction words: opposite, next to, at the end of, on your left." },
    { type: "Matching", how: "Read the list of options before the recording; one or two options are distractors and are never used." },
  ],
  Reading: [
    { type: "True / False / Not given", how: "Find the part of the text the statement refers to, then ask: does the text agree, contradict, or say nothing?" },
    { type: "Matching headings", how: "Read each paragraph's first and last sentence for its main idea; headings that repeat a word from the paragraph are often traps." },
    { type: "Sentence and summary completion", how: "Check the word limit, then scan for synonyms of the words around the gap. The answer must fit grammatically." },
    { type: "Multiple choice", how: "Locate the relevant lines and eliminate options that are too extreme, only partly true, or not mentioned." },
  ],
  Writing: [
    { type: "Academic Task 1 (charts, tables, maps, processes)", how: "Write a clear overview of the main trends; select and compare key figures rather than listing every number." },
    { type: "General Training Task 1 (letters)", how: "Match the tone to the reader (formal, semi-formal or informal) and cover all three bullet points in separate paragraphs." },
    { type: "Task 2 (essays)", how: "Identify the question type (opinion, discussion, problem–solution, two-part) and answer exactly that question." },
    { type: "Time management", how: "About 20 minutes for Task 1 and 40 for Task 2. Leave three minutes to proofread for articles, plurals and verb forms." },
  ],
  Speaking: [
    { type: "Part 1: interview", how: "Answer in two or three sentences: a direct answer, a reason, and an example. Avoid one-word replies." },
    { type: "Part 2: long turn", how: "Use the minute to write key words for each bullet point, not full sentences, and keep talking until the examiner stops you." },
    { type: "Part 3: discussion", how: "Questions are more abstract. Give an opinion, explain it, consider another view, and use general examples." },
    { type: "When you get stuck", how: "Paraphrase (\"it's a kind of…\"), or buy time naturally (\"That's an interesting question; I suppose…\")." },
  ],
};

/* ── Vocabulary and language ─────────────────────────────────────────────────────────────────────────────────── */
export const TOPIC_VOCAB: { topic: string; words: { word: string; meaning: string; example: string }[] }[] = [
  { topic: "Education", words: [
    { word: "curriculum", meaning: "the subjects taught in a school or course", example: "a broad and balanced curriculum" },
    { word: "lifelong learning", meaning: "continuing to learn throughout adult life", example: "promote lifelong learning" },
    { word: "tuition fees", meaning: "money paid for teaching at a college or university", example: "rising tuition fees" },
    { word: "vocational", meaning: "relating to skills for a particular job", example: "vocational training courses" },
    { word: "rote learning", meaning: "memorising without understanding", example: "rely too heavily on rote learning" } ] },
  { topic: "Environment", words: [
    { word: "renewable energy", meaning: "energy from sources that are not used up, such as wind or sun", example: "invest in renewable energy" },
    { word: "carbon footprint", meaning: "the greenhouse gases a person or activity produces", example: "reduce your carbon footprint" },
    { word: "biodiversity", meaning: "the variety of plant and animal life in an area", example: "a loss of biodiversity" },
    { word: "sustainable", meaning: "able to continue without damaging the environment", example: "sustainable farming practices" },
    { word: "deforestation", meaning: "cutting down large areas of forest", example: "the effects of deforestation" } ] },
  { topic: "Technology", words: [
    { word: "automation", meaning: "using machines or software to do work people did", example: "jobs at risk from automation" },
    { word: "data privacy", meaning: "control over how personal information is used", example: "concerns about data privacy" },
    { word: "digital literacy", meaning: "the ability to use digital tools effectively", example: "improve digital literacy among older people" },
    { word: "innovation", meaning: "a new idea, method or product", example: "a culture of innovation" },
    { word: "screen time", meaning: "time spent using a device with a screen", example: "limit children's screen time" } ] },
  { topic: "Health", words: [
    { word: "sedentary", meaning: "involving a lot of sitting and little exercise", example: "a sedentary lifestyle" },
    { word: "preventive", meaning: "intended to stop something before it happens", example: "preventive healthcare" },
    { word: "life expectancy", meaning: "the average number of years a person is likely to live", example: "an increase in life expectancy" },
    { word: "well-being", meaning: "the state of being healthy and happy", example: "mental and physical well-being" },
    { word: "obesity", meaning: "the condition of being very overweight", example: "tackle childhood obesity" } ] },
  { topic: "Work", words: [
    { word: "work-life balance", meaning: "time divided well between work and personal life", example: "maintain a healthy work-life balance" },
    { word: "remote working", meaning: "working away from the office, often from home", example: "the shift to remote working" },
    { word: "job satisfaction", meaning: "how much someone enjoys their job", example: "high levels of job satisfaction" },
    { word: "productivity", meaning: "the amount of work produced in a given time", example: "boost productivity" },
    { word: "career progression", meaning: "moving to more senior roles over time", example: "opportunities for career progression" } ] },
  { topic: "Cities", words: [
    { word: "urbanisation", meaning: "the growth of towns and cities as people move there", example: "rapid urbanisation" },
    { word: "infrastructure", meaning: "basic systems such as roads, transport and power", example: "invest in public infrastructure" },
    { word: "congestion", meaning: "too much traffic in an area", example: "reduce traffic congestion" },
    { word: "affordable housing", meaning: "homes that people on average incomes can pay for", example: "a shortage of affordable housing" },
    { word: "green space", meaning: "areas of grass and trees in a town", example: "protect urban green space" } ] },
];
export const LINKING: { purpose: string; phrases: string[] }[] = [
  { purpose: "Adding a point", phrases: ["Furthermore,", "In addition,", "Moreover,", "Not only … but also …"] },
  { purpose: "Contrasting", phrases: ["However,", "Whereas …", "Nevertheless,", "On the other hand,"] },
  { purpose: "Cause and effect", phrases: ["As a result,", "Consequently,", "This leads to …", "Due to …"] },
  { purpose: "Giving examples", phrases: ["For instance,", "such as …", "A clear example is …", "notably"] },
  { purpose: "Describing trends (Task 1)", phrases: ["rose steadily to …", "peaked at …", "fluctuated between … and …", "remained stable at …"] },
  { purpose: "Concluding", phrases: ["In conclusion,", "Overall,", "To sum up,", "On balance,"] },
];
export const UPGRADES: [plain: string, better: string][] = [
  ["a lot of", "a significant number of / a considerable amount of"],
  ["get better", "improve / show a marked improvement"],
  ["bad for", "detrimental to / harmful to"],
  ["very important", "essential / crucial"],
  ["think", "argue / maintain / believe"],
  ["big problem", "serious / pressing issue"],
];
export const MISTAKES: { mistake: string; fix: string }[] = [
  { mistake: "Writing under the word count", fix: "Task 1 needs at least 150 words and Task 2 at least 250; shorter answers lose marks for task achievement." },
  { mistake: "No overview in Academic Task 1", fix: "Always include one or two sentences that summarise the main trends without figures." },
  { mistake: "Memorised answers in Speaking", fix: "Examiners recognise rehearsed scripts. Practise ideas and vocabulary, not word-for-word answers." },
  { mistake: "Copying the question in the introduction", fix: "Paraphrase the task in your own words; copied phrases do not count towards your word total." },
  { mistake: "Ignoring the word limit in Listening and Reading", fix: "\"NO MORE THAN TWO WORDS\" is strict. An extra word makes the answer wrong." },
  { mistake: "Spending too long on one Reading question", fix: "Move on after about a minute and come back if time allows." },
  { mistake: "Overusing linking words", fix: "Starting every sentence with \"Moreover\" or \"Furthermore\" sounds mechanical and can lower your cohesion score." },
  { mistake: "Answering a different essay question", fix: "Underline the exact question. \"Discuss both views\" needs both views, not only your own." },
];

/* ── Four-week study plan (progress is kept in the browser) ──────────────────────────────────────────────────── */
export const STUDY_PLAN: { week: string; focus: string; tasks: string[] }[] = [
  { week: "Week 1", focus: "Know the test", tasks: ["Read the format of all four skills", "Take one full timed sample test to find your starting level", "Start an error log for every mistake", "Learn 10 topic words a day"] },
  { week: "Week 2", focus: "Build Listening and Reading accuracy", tasks: ["Two Listening sections a day, then check the transcript", "Practise True/False/Not given and matching headings", "Time each Reading section at 20 minutes", "Review your error log at the end of the week"] },
  { week: "Week 3", focus: "Writing structure", tasks: ["Write one Task 1 and one Task 2 every other day", "Plan each essay for 5 minutes before writing", "Check each answer against the four criteria", "Rewrite your weakest essay"] },
  { week: "Week 4", focus: "Speaking and full tests", tasks: ["Record yourself on three Part 2 cue cards", "Practise Part 3 questions with a friend", "Take a second full timed test", "Compare results with Week 1 and target your weakest skill"] },
];

export const TEST_DAY = [
  "Bring the same valid ID document you used when you booked the test.",
  "Arrive early; late arrivals may not be allowed to sit the test.",
  "Personal items, including phones and watches, are stored away before the test.",
  "On paper, write answers in pencil and transfer Listening answers in the time given.",
  "Read every instruction, especially word limits, before you answer.",
  "In Speaking, ask the examiner to repeat a question if you did not hear it; this is allowed.",
  "Sleep well the night before; fatigue costs more marks than one more evening of study.",
];

export const OFFICIAL_LINKS = [
  { label: "Official IELTS sample test questions", href: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions" },
  { label: "IELTS Academic test format", href: "https://ielts.org/take-a-test/test-types/ielts-academic-test" },
  { label: "IELTS General Training test format", href: "https://ielts.org/take-a-test/test-types/ielts-general-training-test" },
  { label: "Which test type do I need?", href: "https://ielts.org/take-a-test/test-types" },
];
