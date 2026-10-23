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
  /** Official places to read: listed under the slide's cover, and in its place when no live stories came back. */
  newsrooms: { label: string; href: string }[];
  /** Where to go deeper on MasterClass Buddy, shown at the foot of the cover. */
  learn: { label: string; hiLabel: string; href: string }[];
};

// The dashboard's Certifications page, through sign-in, opened on one track.
const cert = (track: string) => `/sign-in?redirect=${encodeURIComponent(`/dashboard/certifications?track=${track}`)}`;
const L = {
  blueprints: { label: "System design & AI workflow blueprints", hiLabel: "सिस्टम डिज़ाइन और AI वर्कफ़्लो ब्लूप्रिंट", href: "/workflows" },
  questions: { label: "Interview questions with answers", hiLabel: "उत्तर सहित इंटरव्यू प्रश्न", href: "/interview-questions" },
  compare: { label: "Side-by-side technology comparisons", hiLabel: "तकनीकों की आमने-सामने तुलना", href: "/compare" },
  handbooks: { label: "Technology handbooks", hiLabel: "तकनीकी हैंडबुक", href: "/learn" },
  api: { label: "API reference for 60 technologies", hiLabel: "60 तकनीकों का API संदर्भ", href: "/api-reference" },
  library: { label: "The free learning library", hiLabel: "मुफ़्त लर्निंग लाइब्रेरी", href: "/library" },
  certSystem: { label: "System Design certification path", hiLabel: "सिस्टम डिज़ाइन सर्टिफ़िकेशन रास्ता", href: cert("system-design") },
  certClaude: { label: "Claude Code certification path", hiLabel: "Claude Code सर्टिफ़िकेशन रास्ता", href: cert("claude-code") },
  certAws: { label: "AWS certification path", hiLabel: "AWS सर्टिफ़िकेशन रास्ता", href: cert("aws") },
  certAgentic: { label: "Agentic AI certification path", hiLabel: "एजेंटिक AI सर्टिफ़िकेशन रास्ता", href: cert("agentic-ai") },
  certLangchain: { label: "Python agents: LangChain, LangGraph, LangSmith", hiLabel: "Python एजेंट: LangChain, LangGraph, LangSmith", href: cert("langchain-python") },
  certN8n: { label: "n8n automation certification path", hiLabel: "n8n ऑटोमेशन सर्टिफ़िकेशन रास्ता", href: cert("n8n") },
};

/** A company named in a story or an interview report, with its simple-icons mark when there is one. */
export type NewsLogo = { name: string; hex: string; path: string | null };
/** A story with what a learner takes from it: key facts, why it matters, and one concept explained. */
export type NewsStory = {
  title: string; summary: string; source: string; url: string; date: string; logo: NewsLogo | null;
  points: string[]; why: string | null; concept: { term: string; explain: string } | null;
};
export type InterviewAsk = { question: string; answer: string; rating: number; companies: NewsLogo[]; url: string | null; source: string | null };
/** `cover`: the picture painted for this 21-day set (lib/server/landing-news.ts refreshNews); the standing cover until then. */
export type NewsSlideData =
  | { id: NewsSlideId; kind: "news"; fresh: boolean; stories: NewsStory[]; cover?: string | null }
  | { id: NewsSlideId; kind: "questions"; fresh: boolean; questions: InterviewAsk[]; cover?: string | null };
export type LandingNews = { updatedAt: string | null; slides: NewsSlideData[] };

export const NEWS_SLIDES: NewsSlideMeta[] = [
  {
    id: "ai-labs", kind: "news", short: "AI labs", title: "AI labs this week", hiTitle: "इस हफ़्ते AI लैब्स",
    blurb: "What Anthropic, OpenAI, Google and Microsoft shipped for developers.", hiBlurb: "Anthropic, OpenAI, Google और Microsoft ने डेवलपर्स के लिए क्या लॉन्च किया।",
    topics: ["Claude Code", "OpenAI", "Google AI", "Microsoft AI"],
    newsrooms: [{ label: "Anthropic news", href: "https://www.anthropic.com/news" }, { label: "OpenAI news", href: "https://openai.com/news/" }, { label: "Google AI blog", href: "https://blog.google/technology/ai/" }, { label: "Microsoft AI blog", href: "https://blogs.microsoft.com/ai/" }],
    learn: [L.certClaude, L.certAgentic, L.questions],
  },
  {
    id: "agentic", kind: "news", short: "Agentic AI", title: "Agentic AI & agent frameworks", hiTitle: "एजेंटिक AI और एजेंट फ़्रेमवर्क",
    blurb: "New releases and patterns from LangChain, LangGraph, n8n and the agent ecosystem.", hiBlurb: "LangChain, LangGraph, n8n और एजेंट इकोसिस्टम की नई रिलीज़ और पैटर्न।",
    topics: ["Agentic AI", "LangChain", "LangGraph", "n8n"],
    newsrooms: [{ label: "LangChain blog", href: "https://blog.langchain.com/" }, { label: "n8n blog", href: "https://blog.n8n.io/" }, { label: "MCP blog", href: "https://blog.modelcontextprotocol.io/" }],
    learn: [L.certAgentic, L.certLangchain, L.certN8n, L.blueprints],
  },
  {
    id: "system-design", kind: "news", short: "System design", title: "System design in the real world", hiTitle: "असली दुनिया में सिस्टम डिज़ाइन",
    blurb: "Architecture write-ups, outages and scaling lessons engineering teams published.", hiBlurb: "इंजीनियरिंग टीमों के आर्किटेक्चर लेख, आउटेज और स्केलिंग से मिले सबक।",
    topics: ["Architecture", "Scaling", "Databases", "Postmortems"],
    newsrooms: [{ label: "InfoQ architecture", href: "https://www.infoq.com/architecture-design/" }, { label: "Netflix tech blog", href: "https://netflixtechblog.com/" }, { label: "Cloudflare blog", href: "https://blog.cloudflare.com/" }],
    learn: [L.certSystem, L.blueprints, L.questions],
  },
  {
    id: "frontend", kind: "news", short: "Next.js & React", title: "Next.js, React & state", hiTitle: "Next.js, React और स्टेट",
    blurb: "Releases and changes in Next.js 16, React 19+, Zustand and TanStack.", hiBlurb: "Next.js 16, React 19+, Zustand और TanStack की रिलीज़ और बदलाव।",
    topics: ["Next.js 16", "React 19+", "Zustand", "TanStack"],
    newsrooms: [{ label: "Next.js blog", href: "https://nextjs.org/blog" }, { label: "React blog", href: "https://react.dev/blog" }, { label: "TanStack blog", href: "https://tanstack.com/blog" }],
    learn: [L.handbooks, L.api, L.compare],
  },
  {
    id: "aws", kind: "news", short: "AWS", title: "AWS services update", hiTitle: "AWS सेवाओं की खबरें",
    blurb: "What changed in Lambda, S3, Bedrock, DynamoDB, ECS and other popular services.", hiBlurb: "Lambda, S3, Bedrock, DynamoDB, ECS और दूसरी लोकप्रिय सेवाओं में क्या बदला।",
    topics: ["Lambda", "S3", "Bedrock", "DynamoDB"],
    newsrooms: [{ label: "What's new with AWS", href: "https://aws.amazon.com/new/" }, { label: "AWS News Blog", href: "https://aws.amazon.com/blogs/aws/" }],
    learn: [L.certAws, L.compare, L.blueprints],
  },
  {
    id: "musk", kind: "news", short: "Musk, xAI & SpaceX", title: "Elon Musk: xAI, Tesla AI & SpaceX", hiTitle: "एलन मस्क: xAI, Tesla AI और SpaceX",
    blurb: "Grok and xAI, Tesla's AI work, and SpaceX launches and Starship.", hiBlurb: "Grok और xAI, Tesla का AI काम, और SpaceX लॉन्च व Starship।",
    topics: ["xAI · Grok", "Tesla AI", "SpaceX", "Starship"],
    newsrooms: [{ label: "xAI news", href: "https://x.ai/news" }, { label: "SpaceX updates", href: "https://www.spacex.com/updates/" }],
    learn: [L.certAgentic, L.handbooks, L.library],
  },
  {
    id: "amazon-ai", kind: "news", short: "Amazon & AI", title: "Amazon with AI", hiTitle: "Amazon और AI",
    blurb: "Alexa+, Nova models, Bedrock and how Amazon is putting AI into its products.", hiBlurb: "Alexa+, Nova मॉडल, Bedrock और Amazon अपने प्रोडक्ट्स में AI कैसे ला रहा है।",
    topics: ["Alexa+", "Amazon Nova", "Bedrock", "Rufus"],
    newsrooms: [{ label: "About Amazon: AI", href: "https://www.aboutamazon.com/news/amazon-ai" }, { label: "Amazon Science", href: "https://www.amazon.science/" }],
    learn: [L.certAws, L.certAgentic, L.library],
  },
  {
    id: "questions-tech", kind: "questions", short: "Most-asked: tech", title: "Most-asked tech interview questions", hiTitle: "सबसे ज़्यादा पूछे जाने वाले टेक इंटरव्यू प्रश्न",
    blurb: "Questions candidates report from recent interviews, with a short answer and how often each comes up.", hiBlurb: "हाल के इंटरव्यू में पूछे गए प्रश्न, छोटे उत्तर और कितनी बार पूछे जाते हैं।",
    topics: ["JavaScript", "React", "System design", "SQL"],
    newsrooms: [{ label: "Interview prep on MasterClass", href: "#interview-prep" }],
    learn: [L.questions, L.certSystem, L.compare],
  },
  {
    id: "questions-agentic", kind: "questions", short: "Most-asked: agentic AI", title: "Most-asked agentic AI interview questions", hiTitle: "सबसे ज़्यादा पूछे जाने वाले एजेंटिक AI प्रश्न",
    blurb: "What interviewers ask about agents, RAG, tool use and evaluation, answered in a sentence or two.", hiBlurb: "एजेंट, RAG, टूल उपयोग और मूल्यांकन पर इंटरव्यू प्रश्न, एक-दो वाक्य में उत्तर।",
    topics: ["Agents", "RAG", "Tool calling", "Evals"],
    newsrooms: [{ label: "Interview prep on MasterClass", href: "#interview-prep" }],
    learn: [L.certAgentic, L.certLangchain, L.blueprints],
  },
  {
    id: "trending", kind: "news", short: "Trending", title: "Top trending in tech", hiTitle: "टेक में टॉप ट्रेंडिंग",
    blurb: "The biggest stories across AI, AWS, Google, Microsoft, Amazon, OpenAI and more.", hiBlurb: "AI, AWS, Google, Microsoft, Amazon, OpenAI और दूसरी कंपनियों की सबसे बड़ी खबरें।",
    topics: ["AI", "Cloud", "Big Tech", "Startups"],
    newsrooms: [{ label: "TechCrunch", href: "https://techcrunch.com/" }, { label: "The Verge", href: "https://www.theverge.com/tech" }],
    learn: [L.library, L.certAgentic, L.questions],
  },
];

/** Stories a news slide shows: one lead and three more. */
export const NEWS_PER_SLIDE = 4;
/** Questions an interview slide shows. */
export const QUESTIONS_PER_SLIDE = 5;
/** Further stories (or questions) a slide keeps beyond those, listed under its cover as "More headlines" / "Also asked". */
export const NEWS_EXTRA = 8;

/** A standing explainer for a slide's subject, under its cover: what a learner should know to follow the news. */
export type NewsBasic = { term: string; explain: string; hiExplain: string };
export const NEWS_BASICS: Record<NewsSlideId, NewsBasic[]> = {
  "ai-labs": [
    { term: "Context window", explain: "How much text a model can read at once, counted in tokens. Bigger windows fit whole codebases but cost more per call.", hiExplain: "मॉडल एक बार में कितना टेक्स्ट पढ़ सकता है, टोकन में। बड़ी विंडो में पूरा कोडबेस आ जाता है, पर हर कॉल महँगी होती है।" },
    { term: "Reasoning models", explain: "Models that think step by step before answering: better at maths, code and planning, slower and pricier than fast models.", hiExplain: "जवाब से पहले चरण-दर-चरण सोचने वाले मॉडल: गणित, कोड और प्लानिंग में बेहतर, तेज़ मॉडलों से धीमे और महँगे।" },
    { term: "Prompt caching", explain: "Reusing an unchanged prompt prefix (system prompt, documents) across calls, so repeat requests are cheaper and faster.", hiExplain: "बिना बदले प्रॉम्प्ट के हिस्से (सिस्टम प्रॉम्प्ट, दस्तावेज़) को दोबारा उपयोग करना, ताकि बार-बार की कॉल सस्ती और तेज़ हो।" },
    { term: "Tokens", explain: "The small pieces of text a model reads and writes, roughly three quarters of a word each. Prices and limits are counted in tokens.", hiExplain: "टेक्स्ट के छोटे टुकड़े जिन्हें मॉडल पढ़ता और लिखता है, लगभग एक शब्द का तीन-चौथाई। कीमत और सीमाएँ टोकन में गिनी जाती हैं।" },
    { term: "Benchmarks", explain: "Standard tests such as SWE-bench or GPQA used to compare models. Useful signals, but always check a model on your own tasks.", hiExplain: "SWE-bench या GPQA जैसे मानक टेस्ट, जिनसे मॉडलों की तुलना होती है। उपयोगी संकेत हैं, पर मॉडल को हमेशा अपने काम पर भी परखें।" },
    { term: "Multimodal", explain: "A model that understands more than text, such as images, audio, PDFs or video, in the same conversation.", hiExplain: "ऐसा मॉडल जो टेक्स्ट के अलावा इमेज, ऑडियो, PDF या वीडियो भी उसी बातचीत में समझता है।" },
  ],
  agentic: [
    { term: "Agent loop", explain: "The model picks a tool, the app runs it and returns the result, and the model decides the next step until the task is done.", hiExplain: "मॉडल टूल चुनता है, ऐप उसे चलाकर नतीजा लौटाता है, और काम पूरा होने तक मॉडल अगला कदम तय करता है।" },
    { term: "MCP", explain: "The Model Context Protocol: one standard way to plug tools and data into any AI app, like USB-C for agents.", hiExplain: "Model Context Protocol: किसी भी AI ऐप में टूल और डेटा जोड़ने का एक मानक तरीका, एजेंटों के लिए USB-C जैसा।" },
    { term: "Human in the loop", explain: "The agent pauses before a risky action, such as sending an email or paying, until a person approves, edits or rejects it.", hiExplain: "जोखिम भरे काम (ईमेल भेजना, भुगतान) से पहले एजेंट रुकता है, जब तक कोई व्यक्ति उसे मंज़ूर, बदल या अस्वीकार न करे।" },
    { term: "Tool calling", explain: "The model returns a structured request (a tool name plus JSON arguments) instead of text; your code runs the tool and sends back the result.", hiExplain: "मॉडल टेक्स्ट की जगह एक तय ढाँचे वाला अनुरोध (टूल का नाम और JSON आर्ग्युमेंट) लौटाता है; आपका कोड टूल चलाकर नतीजा वापस भेजता है।" },
    { term: "Agent memory", explain: "Short-term memory is the current conversation; long-term memory is a store the agent reads and writes so it remembers across sessions.", hiExplain: "शॉर्ट-टर्म मेमोरी मौजूदा बातचीत है; लॉन्ग-टर्म मेमोरी एक स्टोर है जिसे एजेंट पढ़ता-लिखता है, ताकि अगली बार भी याद रहे।" },
    { term: "Subagents", explain: "A main agent hands focused jobs to smaller agents with their own prompts and tools, keeping each context small and clean.", hiExplain: "मुख्य एजेंट छोटे-छोटे काम अपने प्रॉम्प्ट और टूल वाले छोटे एजेंटों को सौंपता है, ताकि हर एक का कॉन्टेक्स्ट छोटा और साफ़ रहे।" },
  ],
  "system-design": [
    { term: "Cache-aside", explain: "Read the cache first; on a miss, read the database and fill the cache. The most common caching pattern in interviews.", hiExplain: "पहले कैश से पढ़ें; न मिले तो डेटाबेस से पढ़कर कैश भरें। इंटरव्यू में सबसे आम कैशिंग पैटर्न।" },
    { term: "Idempotency key", explain: "A unique key sent with a request so a retry never runs twice, such as a payment that must not charge a customer twice.", hiExplain: "अनुरोध के साथ भेजी गई एक अनोखी कुंजी, ताकि दोबारा भेजने पर काम दो बार न हो, जैसे भुगतान दो बार न कटे।" },
    { term: "Postmortem", explain: "A blameless write-up after an outage: what happened, why, how it was fixed and what change stops it happening again.", hiExplain: "आउटेज के बाद बिना दोष दिए लिखा गया विवरण: क्या हुआ, क्यों, कैसे ठीक हुआ और दोबारा न हो इसके लिए क्या बदला।" },
    { term: "Load balancer", explain: "Spreads incoming requests across several servers and stops sending traffic to an unhealthy one, so one failure does not take the app down.", hiExplain: "आने वाले अनुरोधों को कई सर्वरों में बाँटता है और ख़राब सर्वर को ट्रैफ़िक भेजना बंद करता है, ताकि एक के फ़ेल होने से ऐप बंद न हो।" },
    { term: "Sharding", explain: "Splitting one large database into smaller pieces by a key, such as user ID, so each server holds and serves only part of the data.", hiExplain: "एक बड़े डेटाबेस को किसी कुंजी (जैसे यूज़र ID) के हिसाब से छोटे हिस्सों में बाँटना, ताकि हर सर्वर डेटा का सिर्फ़ एक हिस्सा रखे और संभाले।" },
    { term: "CAP trade-off", explain: "When the network splits, a distributed system must choose between staying consistent and staying available. Say which one your design picks and why.", hiExplain: "नेटवर्क टूटने पर डिस्ट्रिब्यूटेड सिस्टम को कंसिस्टेंसी और उपलब्धता में से एक चुनना पड़ता है। बताएँ कि आपका डिज़ाइन कौन-सा चुनता है और क्यों।" },
  ],
  frontend: [
    { term: "Server Components", explain: "React components that run only on the server, so their code and data fetching never ship to the browser.", hiExplain: "React कंपोनेंट जो सिर्फ़ सर्वर पर चलते हैं, ताकि उनका कोड और डेटा फ़ेचिंग ब्राउज़र तक न जाए।" },
    { term: "Partial prerendering", explain: "Next.js sends a static shell at once and streams the dynamic parts into it, so pages feel instant and stay personal.", hiExplain: "Next.js तुरंत एक स्थिर ढाँचा भेजता है और बदलने वाले हिस्से बाद में स्ट्रीम करता है, ताकि पेज तेज़ भी रहें और निजी भी।" },
    { term: "Server vs client state", explain: "TanStack Query caches data that lives on a server; Zustand holds UI state that lives only in the browser.", hiExplain: "TanStack Query सर्वर के डेटा को कैश करता है; Zustand सिर्फ़ ब्राउज़र में रहने वाली UI स्टेट रखता है।" },
    { term: "Core Web Vitals", explain: "Google's page-experience metrics: LCP (loading), INP (responsiveness) and CLS (layout shift). They affect both users and search ranking.", hiExplain: "Google के पेज-अनुभव माप: LCP (लोडिंग), INP (प्रतिक्रिया) और CLS (लेआउट खिसकना)। ये यूज़र और सर्च रैंकिंग दोनों पर असर डालते हैं।" },
    { term: "Hydration", explain: "The browser attaches React's event handlers to server-rendered HTML. If the two renders differ, React reports a hydration mismatch.", hiExplain: "ब्राउज़र सर्वर से आए HTML पर React के इवेंट हैंडलर जोड़ता है। अगर दोनों रेंडर अलग हों, तो React हाइड्रेशन मिसमैच की गड़बड़ी बताता है।" },
    { term: "Server Actions", explain: "Functions marked \"use server\" that a form or button calls directly, so you can change data without writing a separate API route.", hiExplain: "\"use server\" वाले फ़ंक्शन जिन्हें फ़ॉर्म या बटन सीधे बुलाता है, ताकि अलग API रूट लिखे बिना डेटा बदला जा सके।" },
  ],
  aws: [
    { term: "Serverless", explain: "Lambda runs your code on demand and bills per request and millisecond; there are no servers to patch or scale.", hiExplain: "Lambda आपका कोड ज़रूरत पर चलाता है और प्रति अनुरोध व मिलीसेकंड बिल करता है; पैच या स्केल करने को कोई सर्वर नहीं।" },
    { term: "Availability Zones", explain: "Separate data centres inside one Region. Spreading an app across two or more keeps it up when one fails.", hiExplain: "एक Region के अंदर अलग-अलग डेटा सेंटर। ऐप को दो या ज़्यादा में फैलाने से एक के फ़ेल होने पर भी वह चलता रहता है।" },
    { term: "Amazon Bedrock", explain: "One AWS API for many foundation models (Claude, Llama, Nova), with knowledge bases, agents and guardrails built in.", hiExplain: "कई फ़ाउंडेशन मॉडल (Claude, Llama, Nova) के लिए एक AWS API, जिसमें नॉलेज बेस, एजेंट और गार्डरेल पहले से हैं।" },
    { term: "IAM least privilege", explain: "Give every user, role and service only the permissions it needs, and use roles with short-term credentials instead of long-lived keys.", hiExplain: "हर यूज़र, रोल और सर्विस को सिर्फ़ ज़रूरी अनुमतियाँ दें, और लंबे समय वाली कुंजियों की जगह अल्पकालिक क्रेडेंशियल वाले रोल इस्तेमाल करें।" },
    { term: "Shared responsibility", explain: "AWS secures the cloud itself (hardware, facilities, managed services); you secure what you put in it: data, access, configuration and patches.", hiExplain: "AWS क्लाउड को सुरक्षित रखता है (हार्डवेयर, डेटा सेंटर, मैनेज्ड सर्विस); उसमें रखी चीज़ें आप सुरक्षित रखते हैं: डेटा, एक्सेस, कॉन्फ़िगरेशन और पैच।" },
    { term: "S3 storage classes", explain: "Pick by how often data is read: Standard for hot data, Infrequent Access for monthly reads, Glacier tiers for archives.", hiExplain: "डेटा कितनी बार पढ़ा जाता है, इसके हिसाब से चुनें: रोज़ के डेटा के लिए Standard, महीने में एक बार के लिए Infrequent Access, आर्काइव के लिए Glacier।" },
  ],
  musk: [
    { term: "Large language model", explain: "A model like Grok, trained on huge amounts of text to predict the next token; that one skill becomes chat, code and reasoning.", hiExplain: "Grok जैसा मॉडल, जो विशाल टेक्स्ट पर अगला टोकन अनुमान लगाना सीखता है; यही कौशल चैट, कोड और तर्क बनता है।" },
    { term: "End-to-end autonomy", explain: "One neural network going from camera pixels to driving controls, instead of hand-written rules: Tesla's approach to self-driving.", hiExplain: "हाथ से लिखे नियमों की जगह एक न्यूरल नेटवर्क, जो कैमरा पिक्सेल से सीधे ड्राइविंग कंट्रोल तक जाता है: सेल्फ़-ड्राइविंग का Tesla तरीका।" },
    { term: "Reusable rockets", explain: "Landing boosters to fly again cuts launch cost, which is what makes large satellite networks like Starlink possible.", hiExplain: "बूस्टर को उतारकर फिर से उड़ाने से लॉन्च सस्ता होता है; इसी से Starlink जैसे बड़े सैटेलाइट नेटवर्क संभव होते हैं।" },
    { term: "Low Earth orbit", explain: "Satellites a few hundred kilometres up, much closer than older geostationary ones, which is why Starlink internet has low latency.", hiExplain: "कुछ सौ किलोमीटर ऊपर के सैटेलाइट, पुराने जियोस्टेशनरी सैटेलाइटों से बहुत पास; इसी वजह से Starlink इंटरनेट में देरी कम होती है।" },
    { term: "Training compute", explain: "The GPUs and power used to train a model. Huge clusters such as xAI's Colossus are built to train larger models faster.", hiExplain: "मॉडल सिखाने में लगने वाले GPU और बिजली। xAI के Colossus जैसे विशाल क्लस्टर बड़े मॉडल तेज़ी से सिखाने के लिए बनाए जाते हैं।" },
    { term: "Brain-computer interface", explain: "A device that reads brain signals and turns them into commands, such as Neuralink's implant that moves a cursor by thought.", hiExplain: "एक उपकरण जो दिमाग़ के संकेत पढ़कर उन्हें कमांड में बदलता है, जैसे Neuralink का इम्प्लांट जो सोचकर कर्सर चलाने देता है।" },
  ],
  "amazon-ai": [
    { term: "Foundation model", explain: "A large model trained once on broad data, then adapted to many tasks, like Amazon Nova for text, images and video.", hiExplain: "विस्तृत डेटा पर एक बार सिखाया गया बड़ा मॉडल, जिसे कई कामों में ढाला जाता है, जैसे टेक्स्ट, इमेज और वीडियो के लिए Amazon Nova।" },
    { term: "RAG", explain: "Retrieval-augmented generation: find the relevant documents first, then let the model answer from them, so answers stay current and grounded.", hiExplain: "पहले संबंधित दस्तावेज़ ढूँढें, फिर मॉडल उन्हीं से जवाब दे, ताकि जवाब ताज़ा और तथ्यों पर आधारित रहें।" },
    { term: "AI chips", explain: "Custom chips such as Trainium and Inferentia train and run some models more cheaply than general-purpose GPUs.", hiExplain: "Trainium और Inferentia जैसी कस्टम चिप कुछ मॉडलों को सामान्य GPU से सस्ते में सिखाती और चलाती हैं।" },
    { term: "Agents on AWS", explain: "Bedrock AgentCore runs and secures agents in production, with memory, identity, a tool gateway and observability as managed pieces.", hiExplain: "Bedrock AgentCore प्रोडक्शन में एजेंट चलाता और सुरक्षित रखता है, जिसमें मेमोरी, पहचान, टूल गेटवे और निगरानी मैनेज्ड हिस्सों के रूप में मिलते हैं।" },
    { term: "Embeddings", explain: "Lists of numbers that capture meaning, so similar text lands close together. They power semantic search and RAG.", hiExplain: "अर्थ को पकड़ने वाली संख्याओं की सूची, ताकि मिलते-जुलते टेक्स्ट पास-पास आएँ। सिमैंटिक सर्च और RAG इन्हीं पर चलते हैं।" },
    { term: "Fine-tuning", explain: "Further training a foundation model on your own examples so it follows your format or domain. Try prompting and RAG first; they are cheaper.", hiExplain: "फ़ाउंडेशन मॉडल को अपने उदाहरणों पर आगे सिखाना, ताकि वह आपका फ़ॉर्मैट या क्षेत्र अपनाए। पहले प्रॉम्प्टिंग और RAG आज़माएँ, वे सस्ते हैं।" },
  ],
  "questions-tech": [
    { term: "Answer, then trade off", explain: "Give the answer in one line, then name one trade-off. Interviewers grade the reasoning more than the definition.", hiExplain: "पहले एक पंक्ति में जवाब दें, फिर एक ट्रेड-ऑफ़ बताएँ। इंटरव्यूअर परिभाषा से ज़्यादा तर्क को अंक देते हैं।" },
    { term: "Big-O out loud", explain: "State the time and space complexity of every solution you write, and say how you would improve it.", hiExplain: "हर समाधान की समय और स्थान जटिलता बोलकर बताएँ, और यह भी कि उसे कैसे बेहतर करेंगे।" },
    { term: "STAR stories", explain: "Situation, Task, Action, Result: keep three real project stories ready for the behavioural round.", hiExplain: "स्थिति, काम, कार्रवाई, नतीजा: व्यवहार वाले राउंड के लिए तीन असली प्रोजेक्ट कहानियाँ तैयार रखें।" },
    { term: "Clarify first", explain: "Before solving, ask about input size, edge cases and constraints. It shows structured thinking and avoids solving the wrong problem.", hiExplain: "हल करने से पहले इनपुट का आकार, एज केस और सीमाएँ पूछें। इससे व्यवस्थित सोच दिखती है और ग़लत समस्या हल करने से बचते हैं।" },
    { term: "Brute force, then optimise", explain: "Say the simple solution and its cost first, then improve it with the right data structure, such as a hash map or two pointers.", hiExplain: "पहले सीधा हल और उसकी लागत बताएँ, फिर सही डेटा स्ट्रक्चर (जैसे हैश मैप या टू-पॉइंटर) से उसे बेहतर करें।" },
    { term: "Test your code aloud", explain: "Walk through one normal input and one edge case (empty, one item, duplicates) line by line before saying you are done.", hiExplain: "\"हो गया\" कहने से पहले एक सामान्य इनपुट और एक एज केस (ख़ाली, एक आइटम, दोहराव) पर कोड को लाइन-दर-लाइन चलाकर दिखाएँ।" },
  ],
  "questions-agentic": [
    { term: "Evals first", explain: "Before tuning prompts, build a small test set and score the agent on it, so every change is measured, not guessed.", hiExplain: "प्रॉम्प्ट बदलने से पहले छोटा टेस्ट सेट बनाकर एजेंट को स्कोर करें, ताकि हर बदलाव अनुमान नहीं, माप से हो।" },
    { term: "Guardrails", explain: "Checks on what goes into and comes out of a model: PII redaction, allowed tools, output validation and spend limits.", hiExplain: "मॉडल में जाने और निकलने वाली चीज़ों की जाँच: निजी डेटा छिपाना, अनुमत टूल, आउटपुट की पुष्टि और खर्च की सीमा।" },
    { term: "Chunking for RAG", explain: "How documents are split before embedding decides what can be found; chunks too small or too large both hurt answers.", hiExplain: "एम्बेडिंग से पहले दस्तावेज़ कैसे बाँटे गए, यही तय करता है कि क्या मिलेगा; बहुत छोटे या बहुत बड़े टुकड़े, दोनों जवाब बिगाड़ते हैं।" },
    { term: "Hallucination", explain: "A confident answer that is not supported by facts. Reduce it with grounding (RAG), citations and checks on the output.", hiExplain: "आत्मविश्वास से दिया गया ऐसा जवाब जो तथ्यों पर आधारित नहीं। इसे ग्राउंडिंग (RAG), स्रोत बताने और आउटपुट की जाँच से कम करें।" },
    { term: "Prompt injection", explain: "Hidden instructions in a web page, email or file that try to hijack an agent. Treat tool output as data, never as commands.", hiExplain: "वेब पेज, ईमेल या फ़ाइल में छिपे निर्देश जो एजेंट को भटकाने की कोशिश करते हैं। टूल के आउटपुट को डेटा मानें, कभी कमांड नहीं।" },
    { term: "Tracing", explain: "Recording every model call, tool call, input and output of an agent run, so you can see where it went wrong and what it cost.", hiExplain: "एजेंट के हर मॉडल कॉल, टूल कॉल, इनपुट और आउटपुट को रिकॉर्ड करना, ताकि दिखे कि गड़बड़ कहाँ हुई और खर्च कितना आया।" },
  ],
  trending: [
    { term: "Open vs closed models", explain: "Open-weight models can be run and tuned on your own hardware; closed models are used only through the vendor's API.", hiExplain: "ओपन-वेट मॉडल अपनी मशीन पर चलाए और ट्यून किए जा सकते हैं; क्लोज़्ड मॉडल सिर्फ़ कंपनी की API से इस्तेमाल होते हैं।" },
    { term: "Inference cost", explain: "The price of running a model for each request. Falling costs are why AI features now ship in everyday apps.", hiExplain: "हर अनुरोध पर मॉडल चलाने की कीमत। घटती लागत की वजह से AI फ़ीचर अब रोज़ के ऐप्स में आ रहे हैं।" },
    { term: "AI regulation", explain: "Rules such as the EU AI Act sort AI systems by risk and require transparency and testing for high-risk uses.", hiExplain: "EU AI Act जैसे नियम AI सिस्टम को जोखिम के हिसाब से बाँटते हैं और ज़्यादा जोखिम वाले उपयोग के लिए पारदर्शिता व परीक्षण माँगते हैं।" },
    { term: "AI coding agents", explain: "Tools like Claude Code that read a repository, edit files and run tests from a plain-language request, with a developer reviewing the result.", hiExplain: "Claude Code जैसे टूल जो सामान्य भाषा के अनुरोध पर रिपॉज़िटरी पढ़ते, फ़ाइलें बदलते और टेस्ट चलाते हैं, और डेवलपर नतीजे की समीक्षा करता है।" },
    { term: "Small language models", explain: "Compact models that run on phones and laptops: cheaper, private and fast enough for many everyday tasks.", hiExplain: "फ़ोन और लैपटॉप पर चलने वाले छोटे मॉडल: सस्ते, निजी और रोज़ के कई कामों के लिए काफ़ी तेज़।" },
    { term: "Data privacy", explain: "Laws such as India's DPDP Act set rules on collecting and using personal data, including consent and the right to have it deleted.", hiExplain: "भारत के DPDP Act जैसे क़ानून निजी डेटा इकट्ठा करने और उपयोग के नियम तय करते हैं, जिनमें सहमति और डेटा हटवाने का अधिकार शामिल है।" },
  ],
};

/** A standing hands-on task for a slide's subject, at the end of its stories: turns the week's news into practice. */
export type NewsPractice = { title: string; task: string; hiTask: string };
export const NEWS_PRACTICE: Record<NewsSlideId, NewsPractice[]> = {
  "ai-labs": [
    { title: "Run the same prompt on two models", task: "Ask two current models the same coding question and compare accuracy, speed and token cost.", hiTask: "एक ही कोडिंग सवाल दो मौजूदा मॉडलों से पूछें और सटीकता, गति और टोकन लागत की तुलना करें।" },
    { title: "Cache a long system prompt", task: "Send one long system prompt twice with prompt caching on, and note how latency and cost change.", hiTask: "प्रॉम्प्ट कैशिंग चालू करके एक लंबा सिस्टम प्रॉम्प्ट दो बार भेजें, और देखें कि देरी और लागत कैसे बदलती है।" },
    { title: "Read one release note end to end", task: "Pick this week's biggest launch above and list what changed for developers: APIs, limits and pricing.", hiTask: "ऊपर की इस हफ़्ते की सबसे बड़ी लॉन्च चुनें और लिखें कि डेवलपर्स के लिए क्या बदला: API, सीमाएँ और कीमत।" },
  ],
  "agentic": [
    { title: "Build a two-tool agent", task: "Give an agent a search tool and a calculator, and log every tool call it makes for one question.", hiTask: "एक एजेंट को सर्च टूल और कैलकुलेटर दें, और एक सवाल पर उसकी हर टूल कॉल लॉग करें।" },
    { title: "Connect an MCP server", task: "Plug a ready-made MCP server (files or GitHub) into Claude Code or another client and use it once.", hiTask: "एक तैयार MCP सर्वर (फ़ाइलें या GitHub) को Claude Code या किसी दूसरे क्लाइंट से जोड़ें और एक बार इस्तेमाल करें।" },
    { title: "Add an approval step", task: "Make the agent pause before a risky tool, such as sending an email, until you approve it.", hiTask: "जोखिम वाले टूल (जैसे ईमेल भेजना) से पहले एजेंट को रोकें, जब तक आप मंज़ूरी न दें।" },
  ],
  "system-design": [
    { title: "Sketch a URL shortener", task: "Draw the API, the database table, the cache and how you would scale reads to 10,000 per second.", hiTask: "API, डेटाबेस टेबल, कैश बनाएँ और बताएँ कि रीड को 10,000 प्रति सेकंड तक कैसे बढ़ाएँगे।" },
    { title: "Do one back-of-envelope estimate", task: "Estimate storage per year for 1 million users posting one photo a day, showing every step.", hiTask: "रोज़ एक फ़ोटो डालने वाले 10 लाख यूज़र्स के लिए साल भर की स्टोरेज का अनुमान लगाएँ, हर कदम दिखाकर।" },
    { title: "Read one real postmortem", task: "Pick a public outage write-up and note the root cause, the fix and the change that prevents it.", hiTask: "किसी सार्वजनिक आउटेज का विवरण चुनें और मूल कारण, समाधान और रोकथाम का बदलाव लिखें।" },
  ],
  "frontend": [
    { title: "Measure one page", task: "Run Lighthouse on a page you built and fix the largest LCP or CLS problem it reports.", hiTask: "अपने बनाए पेज पर Lighthouse चलाएँ और उसकी बताई सबसे बड़ी LCP या CLS समस्या ठीक करें।" },
    { title: "Move a fetch to the server", task: "Turn one client-side data fetch into a Server Component and compare the JavaScript shipped.", hiTask: "क्लाइंट पर होने वाली एक डेटा फ़ेचिंग को Server Component में बदलें और भेजे गए JavaScript की तुलना करें।" },
    { title: "Write a form with a Server Action", task: "Build a small form that saves data through a Server Action and shows its pending state.", hiTask: "एक छोटा फ़ॉर्म बनाएँ जो Server Action से डेटा सेव करे और पेंडिंग स्थिति दिखाए।" },
  ],
  "aws": [
    { title: "Deploy one Lambda", task: "Create a Lambda function behind an HTTP endpoint and check its logs in CloudWatch.", hiTask: "HTTP एंडपॉइंट के पीछे एक Lambda फ़ंक्शन बनाएँ और CloudWatch में उसके लॉग देखें।" },
    { title: "Set a budget alert", task: "Add an AWS Budgets alert at a small amount so a forgotten resource never surprises you.", hiTask: "छोटी राशि पर AWS Budgets अलर्ट लगाएँ, ताकि भूला हुआ रिसोर्स कभी चौंकाए नहीं।" },
    { title: "Write a least-privilege policy", task: "Give one role read access to a single S3 bucket only, and test that other buckets are denied.", hiTask: "एक रोल को सिर्फ़ एक S3 बकेट पढ़ने की अनुमति दें, और जाँचें कि बाकी बकेट मना हो जाएँ।" },
  ],
  "musk": [
    { title: "Explain one story's tech", task: "Pick a story above and explain the core technology in three sentences, as you would to a friend.", hiTask: "ऊपर की कोई खबर चुनें और उसकी मूल तकनीक को तीन वाक्यों में समझाएँ, जैसे किसी दोस्त को समझाते।" },
    { title: "Compare two approaches", task: "Write the trade-offs of camera-only versus sensor-heavy self-driving in a short table.", hiTask: "सिर्फ़ कैमरा और ज़्यादा सेंसर वाली सेल्फ़-ड्राइविंग के ट्रेड-ऑफ़ एक छोटी तालिका में लिखें।" },
    { title: "Try an open model", task: "Run a small open-weight model locally and compare its answers with a hosted chat model.", hiTask: "एक छोटा ओपन-वेट मॉडल अपनी मशीन पर चलाएँ और उसके जवाबों की तुलना होस्टेड चैट मॉडल से करें।" },
  ],
  "amazon-ai": [
    { title: "Call a model on Bedrock", task: "Invoke one foundation model through the Bedrock API and print the reply and token usage.", hiTask: "Bedrock API से एक फ़ाउंडेशन मॉडल बुलाएँ और उसका जवाब और टोकन उपयोग प्रिंट करें।" },
    { title: "Build a tiny RAG", task: "Embed five of your own notes, search them for a question and answer only from what is found.", hiTask: "अपने पाँच नोट्स की एम्बेडिंग बनाएँ, किसी सवाल के लिए खोजें और सिर्फ़ मिले हुए से जवाब दें।" },
    { title: "Add a guardrail", task: "Block one topic or mask personal data in a model's output, then test it with a tricky prompt.", hiTask: "मॉडल के आउटपुट में एक विषय रोकें या निजी डेटा छिपाएँ, फिर एक मुश्किल प्रॉम्प्ट से जाँचें।" },
  ],
  "questions-tech": [
    { title: "Answer two questions aloud", task: "Pick two questions on the left, set a 5-minute timer each and answer them out loud.", hiTask: "बाईं ओर के दो सवाल चुनें, हर एक के लिए 5 मिनट का टाइमर लगाएँ और बोलकर जवाब दें।" },
    { title: "Solve one problem twice", task: "Write a brute-force solution, then an optimised one, and state the Big-O of both.", hiTask: "पहले सीधा हल लिखें, फिर बेहतर हल, और दोनों की Big-O बताएँ।" },
    { title: "Prepare one STAR story", task: "Write a real project story as Situation, Task, Action and Result in under 150 words.", hiTask: "एक असली प्रोजेक्ट की कहानी को स्थिति, काम, कार्रवाई और नतीजे के रूप में 150 शब्दों से कम में लिखें।" },
  ],
  "questions-agentic": [
    { title: "Design an agent on paper", task: "Sketch the tools, memory and guardrails for a support agent, and name one way it could fail.", hiTask: "सपोर्ट एजेंट के टूल, मेमोरी और गार्डरेल काग़ज़ पर बनाएँ, और उसके फ़ेल होने का एक तरीका बताएँ।" },
    { title: "Write five eval cases", task: "List five inputs with expected outputs for an agent you know, including one adversarial case.", hiTask: "किसी एजेंट के लिए पाँच इनपुट और अपेक्षित आउटपुट लिखें, जिनमें एक जानबूझकर मुश्किल केस हो।" },
    { title: "Explain RAG in two minutes", task: "Record yourself explaining retrieval, chunking and grounding, then replay it and tighten the answer.", hiTask: "रिट्रीवल, चंकिंग और ग्राउंडिंग समझाते हुए ख़ुद को रिकॉर्ड करें, फिर सुनकर जवाब और कसा हुआ बनाएँ।" },
  ],
  "trending": [
    { title: "Summarise the week", task: "Write three lines on the biggest trend above and how it could change your current project.", hiTask: "ऊपर के सबसे बड़े ट्रेंड पर तीन पंक्तियाँ लिखें और बताएँ कि वह आपके मौजूदा प्रोजेक्ट को कैसे बदल सकता है।" },
    { title: "Try one new tool", task: "Install one tool from this week's news and use it on a small real task for 20 minutes.", hiTask: "इस हफ़्ते की खबरों से एक टूल इंस्टॉल करें और 20 मिनट किसी छोटे असली काम पर इस्तेमाल करें।" },
    { title: "Check a claim", task: "Pick one bold claim in a headline and find the primary source: the paper, docs or release notes.", hiTask: "किसी सुर्ख़ी का एक बड़ा दावा चुनें और उसका मूल स्रोत खोजें: रिसर्च पेपर, डॉक्स या रिलीज़ नोट्स।" },
  ],
};
