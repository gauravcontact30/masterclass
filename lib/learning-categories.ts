import type { DocumentRecord, Technology } from "./domain";

export const LEARNING_CATEGORIES = [
  { id: "notes", title: { en: "Notes · AWS AI services", hi: "नोट्स · AWS AI सेवाएँ" }, description: { en: "A focused reference for AWS artificial intelligence services.", hi: "AWS AI सेवाओं के लिए सरल संदर्भ।" } },
  { id: "data", title: { en: "Data engineering & analytics", hi: "डेटा इंजीनियरिंग और एनालिटिक्स" }, description: { en: "Modern data stacks, pipelines, warehouses and lakehouses.", hi: "आधुनिक डेटा स्टैक, पाइपलाइन और वेयरहाउस।" } },
  { id: "security", title: { en: "Cybersecurity", hi: "साइबर सुरक्षा" }, description: { en: "Secure applications, identity and incident response.", hi: "सुरक्षित ऐप, पहचान और घटना प्रबंधन।" } },
  { id: "frontend", title: { en: "React & frontend frameworks", hi: "React और फ्रंटएंड फ्रेमवर्क" }, description: { en: "React, Next.js, Zustand, TanStack and the modern UI ecosystem.", hi: "React, Next.js, Zustand, TanStack और आधुनिक UI के साधन।" } },
  { id: "javascript", title: { en: "JavaScript & TypeScript", hi: "JavaScript और TypeScript" }, description: { en: "Language fundamentals, modern syntax and problem solving.", hi: "भाषा के आधार, आधुनिक सिंटैक्स और समस्या समाधान।" } },
  { id: "testing", title: { en: "Testing & quality", hi: "टेस्टिंग और गुणवत्ता" }, description: { en: "Jest, React Testing Library, Vitest, Playwright and Cypress.", hi: "Jest, React Testing Library, Vitest, Playwright और Cypress।" } },
  { id: "cloud", title: { en: "Cloud & DevOps", hi: "क्लाउड और DevOps" }, description: { en: "AWS services, infrastructure, delivery and reliable operations.", hi: "AWS सेवाएँ, इंफ्रास्ट्रक्चर, डिलीवरी और विश्वसनीय संचालन।" } },
  { id: "ai", title: { en: "AI & machine learning", hi: "AI और मशीन लर्निंग" }, description: { en: "LLMs, agents, model workflows and intelligent applications.", hi: "LLMs, एजेंट, मॉडल वर्कफ़्लो और बुद्धिमान ऐप।" } },
  { id: "backend", title: { en: "Backend & databases", hi: "बैकएंड और डेटाबेस" }, description: { en: "APIs, server applications, data storage and system architecture.", hi: "API, सर्वर ऐप, डेटा स्टोरेज और सिस्टम आर्किटेक्चर।" } },
  { id: "languages", title: { en: "Programming languages", hi: "प्रोग्रामिंग भाषाएँ" }, description: { en: "Python and other languages, from foundations to practical projects.", hi: "Python और अन्य भाषाएँ, बुनियाद से व्यावहारिक प्रोजेक्ट तक।" } },
  { id: "other", title: { en: "More learning paths", hi: "अन्य अध्ययन पथ" }, description: { en: "Explore the rest of your learning library.", hi: "अपनी अध्ययन लाइब्रेरी के अन्य विषय देखें।" } },
] as const;
export type LearningCategory = typeof LEARNING_CATEGORIES[number];

const rules: [LearningCategory["id"], RegExp][] = [
  ["data", /^(data-engineering|modern-data|analytics)(-|$)/],
  ["security", /^(cybersecurity|security|appsec)(-|$)/],
  ["testing", /^(jest|react-testing-library|testing-library|rtl|vitest|playwright|cypress|testing|selenium|mocha)(-|$)/],
  ["javascript", /^(javascript|typescript|js|ts|ecmascript|es\d{4})(-|$)/],
  ["frontend", /^(react|nextjs|next-js|zustand|tanstack|redux|vue|nuxt|angular|svelte|solid|frontend|html|css)(-|$)/],
  ["cloud", /^(aws|amazon-web-services|devops|platform-engineering|docker|kubernetes|k8s|terraform|azure|gcp|cloud|linux|ci-cd|github-actions)(-|$)/],
  ["ai", /^(ai|agentic-ai|llm|claude|openai|langchain|machine-learning|deep-learning|tensorflow|pytorch|mcp)(-|$)/],
  ["backend", /^(node|nodejs|express|nestjs|fastapi|spring|postgres|postgresql|mysql|sql|redis|supabase|firebase|graphql|backend|database|system-design)(-|$)/],
  ["languages", /^(python|java|go|golang|rust|ruby|php|swift|kotlin|csharp|cpp|c-plus-plus|c|dart)(-|$)/],
];

/** Match technology first so React Testing Library never falls into React. */
export function learningCategoryId(technologyId: string, technology?: Technology): LearningCategory["id"] {
  const normalize = (value: string) => value.toLowerCase().replace(/[.\s_]+/g, "-");
  for (const value of [technologyId, technology?.title]) {
    if (!value) continue;
    const match = rules.find(([, pattern]) => pattern.test(normalize(value)));
    if (match) return match[0];
  }
  const fallback: Record<string, LearningCategory["id"]> = { web: "frontend", frontend: "frontend", language: "languages", backend: "backend", database: "backend", cloud: "cloud", devops: "cloud", ai: "ai", testing: "testing" };
  return fallback[technology?.category.toLowerCase() ?? ""] ?? "other";
}

export function groupLearningDocuments(documents: DocumentRecord[], technologies: Technology[] = []) {
  const catalog = new Map(technologies.map(technology => [technology.id, technology]));
  const groups = new Map<LearningCategory["id"], DocumentRecord[]>();
  for (const document of documents) {
    const category = document.request.topicId === "aws-ai-services" ? "notes" : learningCategoryId(document.request.technologyId, catalog.get(document.request.technologyId));
    const items = groups.get(category) ?? [];
    items.push(document);
    groups.set(category, items);
  }
  return LEARNING_CATEGORIES.flatMap(category => {
    const items = groups.get(category.id);
    return items?.length ? [{ category, documents: items }] : [];
  });
}
