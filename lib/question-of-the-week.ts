/**
 * Question of the week for the landing page's Interview prep preview: one question each for Agentic AI, Next.js 16+
 * and the most popular AWS services, rotating with the content week (istWeek, passed down as `week`). The card cycles
 * through the three every five seconds. When this week's AI-written question (lib/server/landing-fresh.ts) is about
 * one of the three, it takes that technology's place. Pure and client-safe.
 */
import type { FreshQuestion } from "./landing-fresh-types";
import { learningImageUrl } from "./learning-image";
import { pickDaily } from "./daily-rotation";
import { weekStartDate } from "./ist-week";

type Entry = Pick<FreshQuestion, "question" | "answer" | "objective">;
type WeeklyTech = { techId: string; tech: string; bank: Entry[] };

export const WEEKLY_TECHS: WeeklyTech[] = [
  {
    techId: "agentic-ai", tech: "Agentic AI", bank: [
      {
        question: "What turns a large language model into an agent, and what stops an agent from looping forever?",
        answer: "An agent is an LLM in a loop: it reads the goal and its context, decides on an action (usually a tool call), observes the result and decides again until the task is done. Tools, memory and a planner give it reach; a step or token budget, a clear stop condition, guardrails on tool inputs and a human approval step for risky actions keep it bounded.",
        objective: { question: "Which control most directly prevents an agent from running away in an endless tool-calling loop?", options: ["A larger context window", "A maximum step (iteration) limit", "A higher temperature", "Streaming the response"], answer: 1, why: "A hard cap on iterations ends the loop even when the model never decides it is finished; the other options do not bound the number of steps." },
      },
      {
        question: "What is the Model Context Protocol (MCP), and why does it matter for agents?",
        answer: "MCP is an open protocol that standardises how an AI application connects to external tools, data and prompts. A server exposes tools and resources once, and any MCP-capable client (an IDE, a chat app, an agent) can use them, so integrations stop being one-off glue code per model or framework.",
        objective: { question: "In MCP, which side exposes tools and resources for a model to use?", options: ["The client", "The server", "The model provider", "The vector database"], answer: 1, why: "MCP servers expose tools, resources and prompts; MCP clients inside the host application connect to them on the model's behalf." },
      },
      {
        question: "How would you evaluate an agent before shipping it to production?",
        answer: "Build a fixed set of realistic tasks with expected outcomes, run the agent on them and score the final result and the trajectory: did it pick the right tools, in a sensible order, within budget? Combine deterministic checks with LLM-as-judge scoring, trace every run, and re-run the suite on every prompt, model or tool change to catch regressions.",
        objective: { question: "What does trajectory evaluation of an agent check?", options: ["Only the final answer's wording", "The sequence of steps and tool calls the agent took", "The model's token price", "The size of the prompt"], answer: 1, why: "Trajectory evaluation scores the path, not just the destination: the tools chosen, their order and arguments, and wasted steps." },
      },
    ],
  },
  {
    techId: "nextjs", tech: "Next.js 16+", bank: [
      {
        question: "Next.js 16 renamed Middleware to Proxy. What does proxy.ts do, and when should you not use it?",
        answer: "proxy.ts runs before a request completes, so it can rewrite, redirect, change request or response headers, or respond directly, based on the incoming request. The functionality is the same as Middleware, only the name changed. For simple fixed redirects prefer the redirects option in next.config.ts, and keep slow data fetching and full authorisation out of it: it runs on every matched request.",
        objective: { question: "In Next.js 16, which file replaces middleware.ts?", options: ["edge.ts", "proxy.ts", "server.ts", "handler.ts"], answer: 1, why: "Starting with Next.js 16, Middleware is called Proxy and lives in proxy.ts; the functionality remains the same." },
      },
      {
        question: "How does caching work with Cache Components in Next.js 16?",
        answer: "With cacheComponents: true in next.config.ts, nothing is cached implicitly. You opt in with the \"use cache\" directive on a component or async function and pair it with cacheLife to set how long it stays fresh, and cacheTag to label it. Cached results join the static shell; uncached dynamic data streams in behind Suspense.",
        objective: { question: "Which function sets how long a \"use cache\" result stays fresh?", options: ["cacheLife", "unstable_cache", "revalidatePath", "fetchCache"], answer: 0, why: "cacheLife assigns a lifetime profile (such as 'hours') to the cached function or component; without one the default profile applies." },
      },
      {
        question: "What is the difference between revalidateTag and updateTag in Next.js 16?",
        answer: "Both invalidate cached data by tag. revalidateTag uses stale-while-revalidate: the stale version is served while fresh content builds in the background, which suits blogs and catalogues. updateTag expires the data immediately for read-your-own-writes, so the user sees their change at once, and it can only be called in Server Actions.",
        objective: { question: "Where can updateTag be called?", options: ["Anywhere, including client components", "Only in Route Handlers", "Only in Server Actions", "Only in proxy.ts"], answer: 2, why: "updateTag is for read-your-own-writes after a mutation and can only be used in Server Actions; revalidateTag also works in Route Handlers." },
      },
    ],
  },
  {
    techId: "aws", tech: "AWS", bank: [
      {
        question: "When would you choose AWS Lambda over EC2 for a workload?",
        answer: "Lambda suits event-driven, short-lived and spiky work: API handlers, file processing on S3 uploads, queue consumers. You pay per request and duration, it scales automatically and there are no servers to patch, but a single invocation runs for at most 15 minutes and cold starts add latency. EC2 suits long-running, steady or specialised workloads where you need full control of the OS, runtime or hardware.",
        objective: { question: "What is the maximum run time of a single AWS Lambda invocation?", options: ["5 minutes", "15 minutes", "1 hour", "Unlimited"], answer: 1, why: "A Lambda function can be configured to run for up to 900 seconds (15 minutes) per invocation." },
      },
      {
        question: "How do you give an application on EC2 or Lambda access to an S3 bucket securely?",
        answer: "Attach an IAM role (an EC2 instance profile, or the Lambda execution role) whose policy grants only the S3 actions and bucket ARNs the application needs. The service hands the code short-lived credentials automatically, so no access keys live in code or environment variables. Keep the bucket private with Block Public Access and add a bucket policy if access must be narrowed further.",
        objective: { question: "What is the recommended way for Lambda code to get AWS credentials?", options: ["Hard-code an access key", "Store keys in an environment variable", "Use the function's IAM execution role", "Use the root account's keys"], answer: 2, why: "The execution role supplies temporary, automatically rotated credentials scoped by least-privilege policies." },
      },
      {
        question: "SQS or SNS: what is the difference, and when do you use them together?",
        answer: "SQS is a queue: messages wait until one consumer pulls and deletes them, which decouples producers from consumers and smooths bursts. SNS is pub/sub: a message published to a topic is pushed to every subscriber at once. Used together (fan-out), SNS publishes one event to several SQS queues so each service processes it independently and at its own pace.",
        objective: { question: "Which pattern delivers one event to several independent SQS queues?", options: ["SQS long polling", "SNS to SQS fan-out", "A dead-letter queue", "S3 versioning"], answer: 1, why: "An SNS topic with several SQS subscriptions copies each message to every queue, so each consumer gets its own copy." },
      },
    ],
  },
];

/** This week's three questions, in the order Agentic AI, Next.js 16+, AWS. */
export function weeklyQuestions(week: number, fresh: FreshQuestion | null = null): FreshQuestion[] {
  const day = weekStartDate(week);
  return WEEKLY_TECHS.map(({ techId, tech, bank }) => {
    if (fresh?.techId === techId) return { ...fresh, tech };
    return { day, techId, tech, image: learningImageUrl("topics", ["interview", techId]), ...pickDaily(bank, week) };
  });
}
