import type { OfficialScreen } from "./official-screens";

export type LearningResource = OfficialScreen & {
  kind: "Official guide" | "Course" | "Community article";
  technologies: RegExp[];
};

// Public-page captures, reviewed visually on the capture date. These are
// previews of external resources, not screenshots of a user's private account.
export const LEARNING_RESOURCES: readonly LearningResource[] = [
  {
    title: "Amazon S3: buckets and objects", kind: "Official guide",
    caption: "A guided starting point for creating a bucket, uploading objects and cleaning up your resources.",
    src: "/images/learning/aws-s3-guide.jpg", page: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/GetStartedWithS3.html",
    credit: "Amazon Web Services", checkedAt: "2026-09-21",
    technologies: [/\baws\b/i, /amazon s3/i], topics: ["amazon s3", "s3 bucket", "object storage"],
  },
  {
    title: "Building a serverless API with AWS Lambda", kind: "Community article",
    caption: "A preview of Jacob Schwarz’s walkthrough on Medium. Open the original article to follow the project and see its console examples.",
    src: "/images/learning/medium-serverless-guide.jpg",
    page: "https://medium.com/@jacobschwarz00/lambda-this-lambda-that-a-beginners-guide-to-aws-lambda-and-using-serverless-aws-products-to-93c5c8c18454",
    credit: "Jacob Schwarz · Medium", checkedAt: "2026-09-21",
    technologies: [/\baws\b/i, /\blambda\b/i], topics: ["lambda", "serverless api"],
  },
  {
    title: "React: sharing state between components", kind: "Official guide",
    caption: "The interactive counter example pairs component code with its rendered output. Open the guide to run and edit the example.",
    src: "/images/learning/react-learn.jpg", page: "https://react.dev/learn#sharing-data-between-components",
    credit: "React documentation", checkedAt: "2026-09-21",
    technologies: [/^react(?:$|\s+19)/i], topics: ["usestate", "sharing state", "lifting state", "components", "props"],
  },
  {
    title: "Get started with Docker", kind: "Official guide",
    caption: "Find the installation options and guided tutorials before starting your first container project.",
    src: "/images/learning/docker-learning.jpg", page: "https://docs.docker.com/get-started/",
    credit: "Docker documentation", checkedAt: "2026-09-21",
    technologies: [/^docker$/i], topics: ["container", "docker desktop", "docker engine", "docker installation"],
  },
  {
    title: "LangGraph: stateful agent orchestration", kind: "Official guide",
    caption: "The overview introduces LangGraph and provides routes into persistence, workflows and human-in-the-loop execution.",
    src: "/images/learning/langgraph-overview.jpg", page: "https://docs.langchain.com/oss/python/langgraph/overview",
    credit: "LangChain documentation", checkedAt: "2026-09-21",
    technologies: [/^langgraph$/i, /^agentic ai$/i], topics: ["langgraph", "stategraph", "graph foundations", "state and reducers"],
  },
  {
    title: "Learn with LangChain Academy", kind: "Course",
    caption: "Browse self-paced courses for LangChain, LangGraph and agent development. Course access may require registration.",
    src: "/images/learning/langchain-academy.jpg", page: "https://academy.langchain.com/",
    credit: "LangChain Academy", checkedAt: "2026-09-21",
    technologies: [/^lang(?:chain|graph|smith)$/i, /^agentic[- ]ai$/i, /^ai terms/i],
    topics: ["langchain", "langgraph", "deep agents", "agentic ai"],
  },
  {
    title: "Build a project with Next.js Learn", kind: "Course",
    caption: "Follow the official course from React foundations into building a Next.js application.",
    src: "/images/learning/nextjs-learn.jpg", page: "https://nextjs.org/learn",
    credit: "Next.js · Vercel", checkedAt: "2026-09-21",
    technologies: [/^next(?:\.js|js)(?:$|\s)/i], topics: ["app router", "routing", "layouts", "server components", "next.js"],
  },
  {
    title: "The Python tutorial", kind: "Official guide",
    caption: "Use the official tutorial alongside the handbook for language fundamentals and runnable examples.",
    src: "/images/learning/python-tutorial.jpg", page: "https://docs.python.org/3/tutorial/",
    credit: "Python Software Foundation", checkedAt: "2026-09-21",
    technologies: [/^python(?:$| handbook)/i], topics: ["control flow", "function", "data structures", "classes", "modules"],
  },
];

export function learningResourcesFor(technology: string): LearningResource[] {
  return LEARNING_RESOURCES.filter(resource => resource.technologies.some(pattern => pattern.test(technology.trim())));
}

export function capturedScreensFor(technology: string, topic: string): OfficialScreen[] {
  const name = topic.toLowerCase();
  return learningResourcesFor(technology).filter(resource => resource.topics?.some(fragment => name.includes(fragment)));
}
