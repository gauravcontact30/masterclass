import { ADDRESS_LINE, SUPPORT } from "./site-contact";

/*
 * Visible questions and answers for public pages (components/page-answers.tsx), the source of their FAQPage and HowTo
 * structured data. Answers run 30-70 words, the length answer engines quote, and state only what the site really does:
 * keep them true when plans, pages or schedules change.
 */
export type PageAnswers = { faqs: readonly { question: string; answer: string }[]; howTo?: { name: string; steps: readonly string[] } };

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export function landingAnswers(prices: { monthly: number; yearly: number }): PageAnswers {
  return {
    howTo: { name: "How to start learning on MasterClass Buddy", steps: [
      "Read a free handbook, interview question set or Tech Buzz preview",
      "Create your account and choose the paths you are preparing for",
      "Open your dashboard, where those paths are ready to follow",
      "Take a membership when you want every course and practice test",
    ] },
    faqs: [
      { question: "What is MasterClass Buddy?", answer: "MasterClass Buddy is an online learning platform for software engineers and students. It combines weekly Tech Buzz blogs, interview questions with model answers, system design blueprints, technology handbooks, an API reference and a signed-in dashboard with courses, certification paths and practice tests." },
      { question: "Which technologies can I learn here?", answer: "You can learn Agentic AI, LangChain, LangGraph, LangSmith, LangFlow, n8n, Next.js, React, TypeScript, Python, Node.js, AWS, Docker, Kubernetes, system design and data structures. Handbooks, interview questions and comparisons cover these areas, and new Tech Buzz stories add to them every Monday." },
      { question: "What can I read for free?", answer: "Without an account you can read interview questions for 31 technologies, system design and AI agent blueprints, an API reference for 60 technologies, technology handbooks, side-by-side comparisons and English vocabulary with Hindi meanings. Tech Buzz story previews are free too; the full stories are for members." },
      { question: "How much does membership cost?", answer: `Membership is one plan covering every category: ${money(prices.monthly)} a month or ${money(prices.yearly)} a year, charged in Indian rupees. This page can show the price converted to your currency, and a running festive sale may lower it before you pay.` },
      { question: "Can I cancel my membership?", answer: "Yes. You can cancel renewal from the Membership page at any time and keep access until the end of the period you have paid for. The cancellation and refund policy explains when payments are refunded, including duplicate and failed charges." },
      { question: "What is Tech Buzz?", answer: "Tech Buzz is the weekly technology blog on MasterClass Buddy. Five new stories go live every Monday at 00:00 IST, one per track: Agentic AI, System Design, AWS and DevOps, Kubernetes and Docker, and Next.js and React. Developers review, rate and clap for each story." },
      { question: "How does it help me prepare for interviews?", answer: "Preparation starts with the most-asked subjective and objective questions for each technology, each with a model answer. System design blueprints then add diagrams, design decisions and more interview questions, and members practise further with timed mock exams and quizzes in the dashboard." },
      { question: "Where is MasterClass Buddy based, and how do I contact support?", answer: `MasterClass Buddy is based at ${ADDRESS_LINE}. You can call support on ${SUPPORT.phone}, message us on Instagram or use the Contact page, which also answers common questions about accounts, membership and billing.` },
    ],
  };
}

export function handbookAnswers(name: string, topics: number, sections: readonly string[]): PageAnswers {
  const areas = sections.slice(0, 3).join(", ");
  return {
    howTo: { name: `How to study the ${name} handbook`, steps: [
      "Pick a section from the contents at the top of the page",
      "Read each topic's summary, key points and worked example",
      "Test yourself with the interview questions listed under a topic",
    ] },
    faqs: [
      { question: `What does the ${name} handbook cover?`, answer: `The ${name} handbook covers ${topics} topics across ${sections.length} ${sections.length === 1 ? "section" : "sections"}, including ${areas}. Each topic opens with a short explanation and adds key points, syntax, a worked code example and interview questions wherever they help.` },
      { question: `Is the ${name} handbook free to read?`, answer: `Yes. Every topic in the ${name} handbook is free to read on this page without an account. Signing up adds a dashboard where you can ask follow-up questions, bookmark topics and revise from one saved list.` },
      { question: `Is this ${name} handbook useful for interviews?`, answer: `Yes. The topics are written to be revised quickly, and many include the questions interviewers ask with to-the-point answers. Read the summary and example first, then answer the question aloud before opening the model answer to check yourself.` },
    ],
  };
}

export function vocabularyAnswers(name: string, words: number, examples: readonly string[]): PageAnswers {
  const lower = name.toLowerCase();
  return {
    howTo: { name: `How to learn these ${lower} words`, steps: [
      "Read the word's meaning in English and Hindi",
      "Say it using the pronunciation shown under the word",
      "Write your own sentence, then compare the synonyms and antonyms",
    ] },
    faqs: [
      { question: `What is in the ${name} vocabulary list?`, answer: `This list has ${words} words about ${lower}, such as ${examples.slice(0, 3).join(", ")}. Each one has its meaning in English and Hindi wherever available, a pronunciation guide, an example sentence, and synonyms and antonyms when the word has them.` },
      { question: "Is this vocabulary list free?", answer: "Yes. Every word on this page is free to read without an account. Signing up adds a dashboard where you can hear each word spoken, practise with new words every week and keep the ones you want to revise." },
      { question: "How many words should I learn at a time?", answer: "Learning a few words at a time and using them works better than reading a long list once. Try three to five words, write your own sentence for each, and come back to them over the next few days." },
    ],
  };
}

/** The hub pages, keyed by path. */
export const HUB_ANSWERS = {
  "/library": { faqs: [
    { question: "What is in the free learning library?", answer: "The library gathers everything on MasterClass Buddy that needs no account: interview questions for 31 technologies, system design and AI agent blueprints, an API reference for 60 technologies, technology handbooks, side-by-side comparisons and English vocabulary with Hindi meanings." },
    { question: "Do I need an account to read the library?", answer: "No. Every library page opens without an account, so you can read as much as you like before deciding. An account adds a dashboard with search, progress tracking and bookmarks, and membership adds the full courses and practice tests." },
    { question: "Where should I start in the library?", answer: "Start with what you need soonest. Preparing for an interview, open the interview questions for your technology. Learning something new, read its handbook. Choosing between two tools, open a comparison. Practising system design, read a workflow blueprint from start to finish." },
  ] },
  "/courses": { faqs: [
    { question: "What learning paths does MasterClass Buddy offer?", answer: "The learning paths cover technology handbooks and interviews, system design case studies, and IELTS and professional vocabulary. Each path on this page shows what it contains and opens in your dashboard, so you can check coverage before you subscribe to a membership." },
    { question: "Does one membership cover every course?", answer: "Yes. There is one membership, billed monthly or yearly, and it covers every category on this page. You do not buy courses one at a time, and you can cancel renewal whenever you like and keep access until the paid period ends." },
    { question: "How do I start a course?", answer: "Create an account and choose the paths you are preparing for, and your dashboard opens with those paths ready. Each path link on this page takes you straight to it in the dashboard once you are signed in to your account." },
  ] },
  "/about": { faqs: [
    { question: "Who is MasterClass Buddy for?", answer: "MasterClass Buddy is for software engineers and students who want to learn modern technology and prepare for interviews. It suits beginners reading their first handbook as well as working developers revising Agentic AI, system design or a new framework before a job change." },
    { question: "What makes MasterClass Buddy different from a video course?", answer: "MasterClass Buddy is built for reading and practice rather than long videos. Lessons are short written notes with worked code, diagrams and interview questions, so you can revise one topic in a few minutes and always find the exact answer again later." },
    { question: "Where is MasterClass Buddy based?", answer: `MasterClass Buddy is based at ${ADDRESS_LINE}. The platform is online and available wherever you are, and you can reach support on ${SUPPORT.phone} or through the Contact page, which also answers common questions about accounts and billing.` },
  ] },
  "/learn": { faqs: [
    { question: "What are the technology handbooks?", answer: "The handbooks are free single-page guides, one per technology. Each is organised into sections of topics with a short explanation, key points, syntax and worked code examples, so you can read one from start to finish or jump straight to a single topic." },
    { question: "Are the handbooks free?", answer: "Yes. Every handbook is free to read without an account. Signing up adds a dashboard where you can ask follow-up questions about any topic, save your place and bookmark what you want to revise before an interview." },
    { question: "Which handbook should I read first?", answer: "Read the handbook for the technology you use or need soonest. If you are new to programming, start with Python or JavaScript. If you already build web apps and want to work with AI, the Agentic AI and LangChain handbooks are the natural next step." },
  ] },
  "/vocabulary": { faqs: [
    { question: "What is the vocabulary section?", answer: "The vocabulary section is a free collection of English words grouped by theme for tech professionals and students. Each word has its meaning in English and Hindi wherever available, a pronunciation guide, an example sentence, and synonyms and antonyms when it has them." },
    { question: "Are the word lists free?", answer: "Yes. Every word list is free to read without an account. Signing up adds a dashboard where you can hear each word spoken, practise with new words every week and keep the words you want to come back to." },
    { question: "How should I use these word lists?", answer: "Pick the theme closest to what you read or write at work, then learn a few words at a time. Say each word aloud, write your own sentence with it, and come back to the list over the next few days." },
  ] },
  "/interview-questions": { faqs: [
    { question: "Which technologies have interview questions?", answer: "This section has interview questions for 31 technologies, listed on this page. They run across web development, programming languages, cloud and DevOps, databases and AI engineering, and each technology has its own page with subjective questions and objective questions, each with an answer." },
    { question: "Are the answers free to read?", answer: "Yes. Every question and model answer here is free to read without an account. Signing up adds a dashboard where you can search and filter the questions, track your progress and keep the ones you want to revise." },
    { question: "How should I practise interview questions?", answer: "Say your own answer aloud before opening the model answer, then compare the two and note what you missed. Work through one technology at a time, and come back to the questions you found hard a few days later." },
  ] },
  "/workflows": { faqs: [
    { question: "What is a workflow blueprint?", answer: "A workflow blueprint is a step-by-step design of a real system or AI agent. Each one sets out the steps in order with a diagram, the tech stack, the key design decisions, common mistakes, what to measure and the questions interviewers ask about it." },
    { question: "How do blueprints help in a system design interview?", answer: "Blueprints show how a real design comes together step by step, so you can explain the flow, defend a decision and name the trade-offs. Read one, then redraw it from memory and talk through it as you would with an interviewer." },
    { question: "Are the blueprints free?", answer: "Yes. The blueprints listed on this page are free to read without an account. Signing up adds a dashboard where you can study every blueprint with progress tracking and return to the ones you want to revise." },
  ] },
  "/compare": { faqs: [
    { question: "What do these technology comparisons cover?", answer: "Each comparison answers one question about tools that are easy to confuse, such as LangChain and LangGraph or Docker and Kubernetes. It sets out how they differ, when to use each one and the difference questions that interviewers ask about them." },
    { question: "How do I choose between two technologies?", answer: "Start from the problem rather than the tool. Read the comparison's differences, check which one fits your situation, your team and what you already run, and then choose the simpler option unless you have a clear need for the other one." },
    { question: "Are the comparisons free?", answer: "Yes. Every comparison on this page is free to read without an account. Signing up adds a dashboard where you can study every comparison with progress tracking and keep the ones you want to revise before an interview." },
  ] },
  "/api-reference": { faqs: [
    { question: "What is in the API reference?", answer: "The API reference covers 60 technologies, listed on this page by package. Each entry explains one function, hook, class or command in plain language, with its signature and how it is used, so you can look up one name without reading a whole guide." },
    { question: "How do I find a function or hook here?", answer: "Open the package you are working with from the list on this page, then find the name you need on the package page. Signing in adds a dashboard where you can search and filter the whole reference across every package at once." },
    { question: "Is the API reference free?", answer: "Yes. Every entry in the API reference is free to read without an account. Signing up adds search and filters across the whole reference in your dashboard, along with handbooks, courses and practice that link back to these entries." },
  ] },
} as const satisfies Record<string, PageAnswers>;
