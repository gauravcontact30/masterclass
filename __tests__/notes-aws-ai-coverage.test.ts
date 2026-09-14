/** @jest-environment node */
import { lessonSchema } from "@/lib/domain";
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { AWS_AI_TOPICS, AWS_AI_EXPANDED_LESSONS } from "@/lib/generation/guides/aws-ai-expanded";
import { getStudyNote, NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";
import { dueGuides } from "@/lib/server/default-library";

const guide = DEFAULT_GUIDES.find(item => item.id === "aws-ai-services")!;
const course = getStudyNote("aws-ai-services-course")!;

test("AWS AI services has a dedicated course linked to every saved-guide lesson", () => {
  expect(guide.curriculum.title).toBe("AWS AI services");
  expect(course.title).toBe("AWS AI services");
  expect(course.readerTitle).toBe("AWS AI services");
  expect(NOTES_SUMMARIES.filter(note => note.title === course.title && note.learnInApp)).toHaveLength(1);
  expect(course.contents).toHaveLength(guide.curriculum.lessons.length);
  for (const [index, chapter] of course.contents!.entries()) {
    expect(chapter.id).toBe(`aws-ai-services-lesson-${index}`);
    expect(getStudyNote(chapter.id)?.title).toBe(guide.curriculum.lessons[index].title);
  }
  expect(new Set(course.contents!.map(chapter => chapter.category))).toEqual(new Set([
    "Getting started", "Generative AI & Foundation Models", "Machine Learning Platform", "Vision & Document AI",
    "Language, Audio & Conversational AI", "Specialized & Enterprise AI Services", "Governance, Security & Architecture",
  ]));
});

test.each([
  "Bedrock", "Nova 2 Lite", "Nova 2 Pro", "Nova 2 Sonic", "Nova Multimodal Embeddings", "Q Business", "Q Developer",
  "Agentic AI", "AgentCore", "WebRTC", "audio/video", "managed session storage", "Retrieval-Augmented Generation",
  "RAG", "vector", "OpenSearch", "Aurora", "Neptune", "customization", "fine-tuning", "guardrails", "filtering",
  "access controls", "SageMaker AI", "Unified Studio", "Lakehouse", "Partner AI Apps", "Canvas", "no-code",
  "generative AI permissions", "AutoML", "MLOps", "pipeline", "training", "deployment", "real-time inference",
  "data labeling", "data cleaning", "Rekognition", "Textract", "face detection", "matching", "celebrity",
  "OCR", "forms", "tables", "moderation", "PPE", "Lex", "IVR", "Transcribe", "speech-to-text", "Polly",
  "text-to-speech", "Comprehend", "NLP", "sentiment", "key phrases", "Translate", "translation", "Kendra",
  "Personalize", "recommendations", "Connect Customer AI", "DeepRacer", "reinforcement learning",
  "AI Service Cards", "CAF-AI", "privacy", "third-party", "serverless", "Lambda", "S3", "API Gateway", "KMS", "VPC",
])("the requested AWS AI topic %s is covered", term => {
  const text = AWS_AI_TOPICS.map(topic => [topic.title, ...topic.points, topic.example].join(" ")).join(" ").toLowerCase();
  expect(text).toContain(term.toLowerCase());
});

test("new lessons include valid workflow diagrams and AWS primary sources", () => {
  for (const lesson of AWS_AI_EXPANDED_LESSONS) {
    expect(lessonSchema.safeParse(lesson).success).toBe(true);
    expect(lesson.diagram?.items).toHaveLength(4);
    expect(lesson.code).toContain("not an AWS API payload");
  }
  for (const topic of AWS_AI_TOPICS) {
    expect(["aws.amazon.com", "docs.aws.amazon.com"]).toContain(new URL(topic.source).hostname);
    expect(guide.curriculum.sources?.some(source => source.url === topic.source)).toBe(true);
  }
});

test("preview and privacy distinctions survive into readable notes", () => {
  const nova = AWS_AI_TOPICS.find(topic => topic.title.includes("Nova 2 Pro"))!;
  expect(nova.points.join(" ")).toContain("Preview");
  const voice = AWS_AI_TOPICS.find(topic => topic.title.includes("WebRTC"))!;
  expect(voice.points.join(" ")).toContain("separate Preview capability");
  const privacy = AWS_AI_TOPICS.find(topic => topic.title.startsWith("Enterprise data privacy"))!;
  expect(privacy.points.join(" ")).toContain("Do not generalize");
  expect(dueGuides(new Map([["aws-ai-services", 6]])).some(item => item.id === "aws-ai-services")).toBe(true);
  const summary = NOTES_SUMMARIES.find(note => note.id === course.id)!;
  for (const term of ["webrtc", "lakehouse", "caf-ai", "ppe", "nova"]) expect(summary.searchText).toContain(term);
});
