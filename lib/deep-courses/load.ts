import "server-only";
import type { CourseId, DeepCourse, TopicLab } from "./types";

// One import per course so a topic page pulls only its own course's content into the server bundle chunk.
const LOADERS: Record<CourseId, () => Promise<DeepCourse>> = {
  "core-java": () => import("./content/core-java").then(module => module.COURSE),
  "advanced-java": () => import("./content/advanced-java").then(module => module.COURSE),
  "spring-boot": () => import("./content/spring-boot").then(module => module.COURSE),
  cpp: () => import("./content/cpp").then(module => module.COURSE),
  dsa: () => import("./content/dsa").then(module => module.COURSE),
  "java-basic-to-advanced": () => import("./content/java-basic-to-advanced").then(module => module.COURSE),
};

// Each course's labs (syntax, graded examples, assignments, alternates) live beside its content, keyed by topic id.
const LABS: Record<CourseId, () => Promise<Record<string, TopicLab>>> = {
  "core-java": () => import("./labs/core-java").then(module => module.LABS),
  "advanced-java": () => import("./labs/advanced-java").then(module => module.LABS),
  "spring-boot": () => import("./labs/spring-boot").then(module => module.LABS),
  cpp: () => import("./labs/cpp").then(module => module.LABS),
  dsa: () => import("./labs/dsa").then(module => module.LABS),
  "java-basic-to-advanced": () => import("./labs/java-basic-to-advanced").then(module => module.LABS),
};

export async function loadDeepCourse(id: CourseId): Promise<DeepCourse> {
  const [course, labs] = await Promise.all([LOADERS[id](), LABS[id]()]);
  return { ...course, topics: course.topics.map(topic => labs[topic.id] ? { ...topic, lab: labs[topic.id] } : topic) };
}
