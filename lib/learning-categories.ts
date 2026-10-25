import type { DocumentRecord, Technology, Language } from "./domain";

function cat(
  id: "notes" | "data" | "security" | "frontend" | "javascript" | "testing" | "cloud" | "ai" | "backend" | "languages" | "other",
  title: Record<Language, string>,
  description: Record<Language, string>,
) {
  return { id, title, description } as const;
}

export const LEARNING_CATEGORIES = [
  cat(
    "notes",
    { en: "Notes · AWS AI services", hi: "नोट्स · AWS AI सेवाएँ", es: "Notas · Servicios AWS AI", ja: "ノート · AWS AI サービス", de: "Notizen · AWS AI-Dienste", fr: "Notes · Services AWS AI", zh: "笔记 · AWS AI 服务" },
    { en: "A focused reference for AWS artificial intelligence services.", hi: "AWS AI सेवाओं के लिए सरल संदर्भ।", es: "Una referencia enfocada para los servicios de inteligencia artificial de AWS.", ja: "AWS 人工知能サービスの集中リファレンス。", de: "Eine gezielte Referenz für AWS KI-Dienste.", fr: "Une référence ciblée pour les services d'intelligence artificielle AWS.", zh: "针对 AWS 人工智能服务的精简参考。" },
  ),
  cat(
    "data",
    { en: "Data engineering & analytics", hi: "डेटा इंजीनियरिंग और एनालिटिक्स", es: "Ingeniería de datos y analítica", ja: "データエンジニアリング＆アナリティクス", de: "Daten-Engineering & Analytik", fr: "Ingénierie des données et analytique", zh: "数据工程与分析" },
    { en: "Modern data stacks, pipelines, warehouses and lakehouses.", hi: "आधुनिक डेटा स्टैक, पाइपलाइन और वेयरहाउस।", es: "Pilas de datos modernas, canalizaciones, almacenes y lakehouses.", ja: "モダンデータスタック、パイプライン、DWH、レイクハウス。", de: "Moderne Daten-Stacks, Pipelines, Warehouses und Lakehouses.", fr: "Piles de données modernes, pipelines, entrepôts et lakehouses.", zh: "现代化数据技术栈、流水线、数据仓库与湖仓一体。" },
  ),
  cat(
    "security",
    { en: "Cybersecurity", hi: "साइबर सुरक्षा", es: "Ciberseguridad", ja: "サイバーセキュリティ", de: "Cybersicherheit", fr: "Cybersécurité", zh: "网络与应用安全" },
    { en: "Secure applications, identity and incident response.", hi: "सुरक्षित ऐप, पहचान और घटना प्रबंधन।", es: "Aplicaciones seguras, identidad y respuesta a incidentes.", ja: "セキュアなアプリケーション、ID管理、インシデント対応。", de: "Sichere Anwendungen, Identität und Incident Response.", fr: "Applications sécurisées, gestion des identités et réponse aux incidents.", zh: "安全应用构建、身份鉴权与应急响应。" },
  ),
  cat(
    "frontend",
    { en: "React & frontend frameworks", hi: "React और फ्रंटएंड फ्रेमवर्क", es: "React y marcos frontend", ja: "React とフロントエンドフレームワーク", de: "React & Frontend-Frameworks", fr: "React et frameworks frontend", zh: "React 与前端框架" },
    { en: "React, Next.js, Zustand, TanStack and the modern UI ecosystem.", hi: "React, Next.js, Zustand, TanStack और आधुनिक UI के साधन।", es: "React, Next.js, Zustand, TanStack y el ecosistema moderno de UI.", ja: "React、Next.js、Zustand、TanStack、モダンUIエコシステム。", de: "React, Next.js, Zustand, TanStack und das moderne UI-Ökosystem.", fr: "React, Next.js, Zustand, TanStack et l'écosystème moderne d'interfaces.", zh: "React、Next.js、Zustand、TanStack 与现代前端 UI 生态。" },
  ),
  cat(
    "javascript",
    { en: "JavaScript & TypeScript", hi: "JavaScript और TypeScript", es: "JavaScript y TypeScript", ja: "JavaScript と TypeScript", de: "JavaScript & TypeScript", fr: "JavaScript et TypeScript", zh: "JavaScript 与 TypeScript" },
    { en: "Language fundamentals, modern syntax and problem solving.", hi: "भाषा के आधार, आधुनिक सिंटैक्स और समस्या समाधान।", es: "Fundamentos del lenguaje, sintaxis moderna y resolución de problemas.", ja: "言語の基礎、モダンな構文、実践的な課題解決。", de: "Sprachgrundlagen, moderne Syntax und Problemlösung.", fr: "Fondamentaux du langage, syntaxe moderne et résolution de problèmes.", zh: "核心语言基石、现代语法与算法问题解决。" },
  ),
  cat(
    "testing",
    { en: "Testing & quality", hi: "टेस्टिंग और गुणवत्ता", es: "Pruebas y calidad", ja: "テストと品質保証", de: "Testing & Qualität", fr: "Tests et qualité logicielle", zh: "测试与代码质量" },
    { en: "Jest, React Testing Library, Vitest, Playwright and Cypress.", hi: "Jest, React Testing Library, Vitest, Playwright और Cypress।", es: "Jest, React Testing Library, Vitest, Playwright y Cypress.", ja: "Jest、React Testing Library、Vitest、Playwright、Cypress。", de: "Jest, React Testing Library, Vitest, Playwright und Cypress.", fr: "Jest, React Testing Library, Vitest, Playwright et Cypress.", zh: "Jest、React Testing Library、Vitest、Playwright 与 Cypress。" },
  ),
  cat(
    "cloud",
    { en: "Cloud & DevOps", hi: "क्लाउड और DevOps", es: "Nube y DevOps", ja: "クラウドとDevOps", de: "Cloud & DevOps", fr: "Cloud & DevOps", zh: "云平台与 DevOps" },
    { en: "AWS services, infrastructure, delivery and reliable operations.", hi: "AWS सेवाएँ, इंफ्रास्ट्रक्चर, डिलीवरी और विश्वसनीय संचालन।", es: "Servicios de AWS, infraestructura, entrega y operaciones confiables.", ja: "AWSサービス、インフラ、デリバリー、高信頼運用。", de: "AWS-Dienste, Infrastruktur, Bereitstellung und zuverlässiger Betrieb.", fr: "Services AWS, infrastructure, déploiement et fiabilité opérationnelle.", zh: "AWS 云服务、基础设施即代码、持续交付与高可靠运维。" },
  ),
  cat(
    "ai",
    { en: "AI & machine learning", hi: "AI और मशीन लर्निंग", es: "IA y aprendizaje automático", ja: "AI と機械学習", de: "KI & Maschinelles Lernen", fr: "IA et apprentissage automatique", zh: "人工智能与机器学习" },
    { en: "LLMs, agents, model workflows and intelligent applications.", hi: "LLMs, एजेंट, मॉडल वर्कफ़्लो और बुद्धिमान ऐप।", es: "LLMs, agentes, flujos de modelos y aplicaciones inteligentes.", ja: "LLM、エージェント、モデルワークフロー、知能アプリケーション。", de: "LLMs, Agenten, Modell-Workflows und intelligente Anwendungen.", fr: "LLMs, agents, workflows de modèles et applications intelligentes.", zh: "大语言模型、智能体、模型工作流与智能应用。" },
  ),
  cat(
    "backend",
    { en: "Backend & databases", hi: "बैकएंड और डेटाबेस", es: "Backend y bases de datos", ja: "バックエンドとデータベース", de: "Backend & Datenbanken", fr: "Backend et bases de données", zh: "后端开发与数据库" },
    { en: "APIs, server applications, data storage and system architecture.", hi: "API, सर्वर ऐप, डेटा स्टोरेज और सिस्टम आर्किटेक्चर।", es: "APIs, aplicaciones de servidor, almacenamiento de datos y arquitectura de sistemas.", ja: "API、サーバーアプリケーション、データストレージ、システムアーキテクチャ。", de: "APIs, Serveranwendungen, Datenspeicherung und Systemarchitektur.", fr: "APIs, applications serveur, stockage de données et architecture système.", zh: "API、服务端应用、数据持久化与分布式系统架构。" },
  ),
  cat(
    "languages",
    { en: "Programming languages", hi: "प्रोग्रामिंग भाषाएँ", es: "Lenguajes de programación", ja: "プログラミング言語", de: "Programmiersprachen", fr: "Langages de programmation", zh: "编程语言进阶" },
    { en: "Python and other languages, from foundations to practical projects.", hi: "Python और अन्य भाषाएँ, बुनियाद से व्यावहारिक प्रोजेक्ट तक।", es: "Python y otros lenguajes, desde los fundamentos hasta proyectos prácticos.", ja: "Pythonやその他の言語、基礎から実践プロジェクトまで。", de: "Python und andere Sprachen, von den Grundlagen bis zu praktischen Projekten.", fr: "Python et autres langages, des fondamentaux aux projets pratiques.", zh: "Python 及主流多语言，从语言底层到工业级项目。" },
  ),
  cat(
    "other",
    { en: "More learning paths", hi: "अन्य अध्ययन पथ", es: "Más rutas de aprendizaje", ja: "その他の学習コース", de: "Weitere Lernpfade", fr: "Autres parcours d'apprentissage", zh: "更多学习路径" },
    { en: "Explore the rest of your learning library.", hi: "अपनी अध्ययन लाइब्रेरी के अन्य विषय देखें।", es: "Explora el resto de tu biblioteca de aprendizaje.", ja: "学習ライブラリのその他のテーマを探索。", de: "Entdecke den Rest deiner Lernbibliothek.", fr: "Explorez le reste de votre bibliothèque d'apprentissage.", zh: "探索您学习库中的其他专业技术路径。" },
  ),
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
