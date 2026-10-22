/*
 * The landing page's "Fresh in tech" carousel (components/landing-news.tsx): ten slides, each one subject, filled
 * with this week's stories (or the interview questions candidates report) by lib/server/landing-news.ts.
 * This file is what the browser needs: each slide's name, blurb, picture and the newsrooms to read when no fresh
 * stories could be fetched. Pictures: `npm run images:news` paints full-HD covers into public/images/news/<id>.webp.
 */
export type NewsSlideId = "ai-labs" | "agentic" | "system-design" | "frontend" | "aws" | "musk" | "amazon-ai" | "questions-tech" | "questions-agentic" | "trending";

export type NewsSlideMeta = {
  id: NewsSlideId;
  kind: "news" | "questions";
  title: string; hiTitle: string;
  /** Short name for the slide picker. */
  short: string;
  blurb: string; hiBlurb: string;
  topics: string[];
  /** Official places to read when the live stories are unavailable. */
  newsrooms: { label: string; href: string }[];
};

/** A company named in a story or an interview report, with its simple-icons mark when there is one. */
export type NewsLogo = { name: string; hex: string; path: string | null };
/** A story with what a learner takes from it: key facts, why it matters, and one concept explained. */
export type NewsStory = {
  title: string; summary: string; source: string; url: string; date: string; logo: NewsLogo | null;
  points: string[]; why: string | null; concept: { term: string; explain: string } | null;
};
export type InterviewAsk = { question: string; answer: string; rating: number; companies: NewsLogo[]; url: string | null; source: string | null };
export type NewsSlideData =
  | { id: NewsSlideId; kind: "news"; fresh: boolean; stories: NewsStory[] }
  | { id: NewsSlideId; kind: "questions"; fresh: boolean; questions: InterviewAsk[] };
export type LandingNews = { updatedAt: string | null; slides: NewsSlideData[] };

export const NEWS_SLIDES: NewsSlideMeta[] = [
  {
    id: "ai-labs", kind: "news", short: "AI labs", title: "AI labs this week", hiTitle: "इस हफ़्ते AI लैब्स",
    blurb: "What Anthropic, OpenAI, Google and Microsoft shipped for developers.", hiBlurb: "Anthropic, OpenAI, Google और Microsoft ने डेवलपर्स के लिए क्या लॉन्च किया।",
    topics: ["Claude Code", "OpenAI", "Google AI", "Microsoft AI"],
    newsrooms: [{ label: "Anthropic news", href: "https://www.anthropic.com/news" }, { label: "OpenAI news", href: "https://openai.com/news/" }, { label: "Google AI blog", href: "https://blog.google/technology/ai/" }, { label: "Microsoft AI blog", href: "https://blogs.microsoft.com/ai/" }],
  },
  {
    id: "agentic", kind: "news", short: "Agentic AI", title: "Agentic AI & agent frameworks", hiTitle: "एजेंटिक AI और एजेंट फ़्रेमवर्क",
    blurb: "New releases and patterns from LangChain, LangGraph, n8n and the agent ecosystem.", hiBlurb: "LangChain, LangGraph, n8n और एजेंट इकोसिस्टम की नई रिलीज़ और पैटर्न।",
    topics: ["Agentic AI", "LangChain", "LangGraph", "n8n"],
    newsrooms: [{ label: "LangChain blog", href: "https://blog.langchain.com/" }, { label: "n8n blog", href: "https://blog.n8n.io/" }, { label: "MCP blog", href: "https://blog.modelcontextprotocol.io/" }],
  },
  {
    id: "system-design", kind: "news", short: "System design", title: "System design in the real world", hiTitle: "असली दुनिया में सिस्टम डिज़ाइन",
    blurb: "Architecture write-ups, outages and scaling lessons engineering teams published.", hiBlurb: "इंजीनियरिंग टीमों के आर्किटेक्चर लेख, आउटेज और स्केलिंग से मिले सबक।",
    topics: ["Architecture", "Scaling", "Databases", "Postmortems"],
    newsrooms: [{ label: "InfoQ architecture", href: "https://www.infoq.com/architecture-design/" }, { label: "Netflix tech blog", href: "https://netflixtechblog.com/" }, { label: "Cloudflare blog", href: "https://blog.cloudflare.com/" }],
  },
  {
    id: "frontend", kind: "news", short: "Next.js & React", title: "Next.js, React & state", hiTitle: "Next.js, React और स्टेट",
    blurb: "Releases and changes in Next.js 16, React 19+, Zustand and TanStack.", hiBlurb: "Next.js 16, React 19+, Zustand और TanStack की रिलीज़ और बदलाव।",
    topics: ["Next.js 16", "React 19+", "Zustand", "TanStack"],
    newsrooms: [{ label: "Next.js blog", href: "https://nextjs.org/blog" }, { label: "React blog", href: "https://react.dev/blog" }, { label: "TanStack blog", href: "https://tanstack.com/blog" }],
  },
  {
    id: "aws", kind: "news", short: "AWS", title: "AWS services update", hiTitle: "AWS सेवाओं की खबरें",
    blurb: "What changed in Lambda, S3, Bedrock, DynamoDB, ECS and other popular services.", hiBlurb: "Lambda, S3, Bedrock, DynamoDB, ECS और दूसरी लोकप्रिय सेवाओं में क्या बदला।",
    topics: ["Lambda", "S3", "Bedrock", "DynamoDB"],
    newsrooms: [{ label: "What's new with AWS", href: "https://aws.amazon.com/new/" }, { label: "AWS News Blog", href: "https://aws.amazon.com/blogs/aws/" }],
  },
  {
    id: "musk", kind: "news", short: "Musk, xAI & SpaceX", title: "Elon Musk: xAI, Tesla AI & SpaceX", hiTitle: "एलन मस्क: xAI, Tesla AI और SpaceX",
    blurb: "Grok and xAI, Tesla's AI work, and SpaceX launches and Starship.", hiBlurb: "Grok और xAI, Tesla का AI काम, और SpaceX लॉन्च व Starship।",
    topics: ["xAI · Grok", "Tesla AI", "SpaceX", "Starship"],
    newsrooms: [{ label: "xAI news", href: "https://x.ai/news" }, { label: "SpaceX updates", href: "https://www.spacex.com/updates/" }],
  },
  {
    id: "amazon-ai", kind: "news", short: "Amazon & AI", title: "Amazon with AI", hiTitle: "Amazon और AI",
    blurb: "Alexa+, Nova models, Bedrock and how Amazon is putting AI into its products.", hiBlurb: "Alexa+, Nova मॉडल, Bedrock और Amazon अपने प्रोडक्ट्स में AI कैसे ला रहा है।",
    topics: ["Alexa+", "Amazon Nova", "Bedrock", "Rufus"],
    newsrooms: [{ label: "About Amazon: AI", href: "https://www.aboutamazon.com/news/amazon-ai" }, { label: "Amazon Science", href: "https://www.amazon.science/" }],
  },
  {
    id: "questions-tech", kind: "questions", short: "Most-asked: tech", title: "Most-asked tech interview questions", hiTitle: "सबसे ज़्यादा पूछे जाने वाले टेक इंटरव्यू प्रश्न",
    blurb: "Questions candidates report from recent interviews, with a short answer and how often each comes up.", hiBlurb: "हाल के इंटरव्यू में पूछे गए प्रश्न, छोटे उत्तर और कितनी बार पूछे जाते हैं।",
    topics: ["JavaScript", "React", "System design", "SQL"],
    newsrooms: [{ label: "Interview prep on MasterClass", href: "#interview-prep" }],
  },
  {
    id: "questions-agentic", kind: "questions", short: "Most-asked: agentic AI", title: "Most-asked agentic AI interview questions", hiTitle: "सबसे ज़्यादा पूछे जाने वाले एजेंटिक AI प्रश्न",
    blurb: "What interviewers ask about agents, RAG, tool use and evaluation, answered in a sentence or two.", hiBlurb: "एजेंट, RAG, टूल उपयोग और मूल्यांकन पर इंटरव्यू प्रश्न, एक-दो वाक्य में उत्तर।",
    topics: ["Agents", "RAG", "Tool calling", "Evals"],
    newsrooms: [{ label: "Interview prep on MasterClass", href: "#interview-prep" }],
  },
  {
    id: "trending", kind: "news", short: "Trending", title: "Top trending in tech", hiTitle: "टेक में टॉप ट्रेंडिंग",
    blurb: "The biggest stories across AI, AWS, Google, Microsoft, Amazon, OpenAI and more.", hiBlurb: "AI, AWS, Google, Microsoft, Amazon, OpenAI और दूसरी कंपनियों की सबसे बड़ी खबरें।",
    topics: ["AI", "Cloud", "Big Tech", "Startups"],
    newsrooms: [{ label: "TechCrunch", href: "https://techcrunch.com/" }, { label: "The Verge", href: "https://www.theverge.com/tech" }],
  },
];

/** Stories a news slide shows: one lead and three more. */
export const NEWS_PER_SLIDE = 4;
/** Questions an interview slide shows. */
export const QUESTIONS_PER_SLIDE = 5;
