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
export const NEWS_EXTRA = 4;

/** A standing explainer for a slide's subject, under its cover: what a learner should know to follow the news. */
export type NewsBasic = { term: string; explain: string; hiExplain: string };
export const NEWS_BASICS: Record<NewsSlideId, NewsBasic[]> = {
  "ai-labs": [
    { term: "Context window", explain: "How much text a model can read at once, counted in tokens. Bigger windows fit whole codebases but cost more per call.", hiExplain: "मॉडल एक बार में कितना टेक्स्ट पढ़ सकता है, टोकन में। बड़ी विंडो में पूरा कोडबेस आ जाता है, पर हर कॉल महँगी होती है।" },
    { term: "Reasoning models", explain: "Models that think step by step before answering: better at maths, code and planning, slower and pricier than fast models.", hiExplain: "जवाब से पहले चरण-दर-चरण सोचने वाले मॉडल: गणित, कोड और प्लानिंग में बेहतर, तेज़ मॉडलों से धीमे और महँगे।" },
    { term: "Prompt caching", explain: "Reusing an unchanged prompt prefix (system prompt, documents) across calls, so repeat requests are cheaper and faster.", hiExplain: "बिना बदले प्रॉम्प्ट के हिस्से (सिस्टम प्रॉम्प्ट, दस्तावेज़) को दोबारा उपयोग करना, ताकि बार-बार की कॉल सस्ती और तेज़ हो।" },
  ],
  agentic: [
    { term: "Agent loop", explain: "The model picks a tool, the app runs it and returns the result, and the model decides the next step until the task is done.", hiExplain: "मॉडल टूल चुनता है, ऐप उसे चलाकर नतीजा लौटाता है, और काम पूरा होने तक मॉडल अगला कदम तय करता है।" },
    { term: "MCP", explain: "The Model Context Protocol: one standard way to plug tools and data into any AI app, like USB-C for agents.", hiExplain: "Model Context Protocol: किसी भी AI ऐप में टूल और डेटा जोड़ने का एक मानक तरीका, एजेंटों के लिए USB-C जैसा।" },
    { term: "Human in the loop", explain: "The agent pauses before a risky action, such as sending an email or paying, until a person approves, edits or rejects it.", hiExplain: "जोखिम भरे काम (ईमेल भेजना, भुगतान) से पहले एजेंट रुकता है, जब तक कोई व्यक्ति उसे मंज़ूर, बदल या अस्वीकार न करे।" },
  ],
  "system-design": [
    { term: "Cache-aside", explain: "Read the cache first; on a miss, read the database and fill the cache. The most common caching pattern in interviews.", hiExplain: "पहले कैश से पढ़ें; न मिले तो डेटाबेस से पढ़कर कैश भरें। इंटरव्यू में सबसे आम कैशिंग पैटर्न।" },
    { term: "Idempotency key", explain: "A unique key sent with a request so a retry never runs twice, such as a payment that must not charge a customer twice.", hiExplain: "अनुरोध के साथ भेजी गई एक अनोखी कुंजी, ताकि दोबारा भेजने पर काम दो बार न हो, जैसे भुगतान दो बार न कटे।" },
    { term: "Postmortem", explain: "A blameless write-up after an outage: what happened, why, how it was fixed and what change stops it happening again.", hiExplain: "आउटेज के बाद बिना दोष दिए लिखा गया विवरण: क्या हुआ, क्यों, कैसे ठीक हुआ और दोबारा न हो इसके लिए क्या बदला।" },
  ],
  frontend: [
    { term: "Server Components", explain: "React components that run only on the server, so their code and data fetching never ship to the browser.", hiExplain: "React कंपोनेंट जो सिर्फ़ सर्वर पर चलते हैं, ताकि उनका कोड और डेटा फ़ेचिंग ब्राउज़र तक न जाए।" },
    { term: "Partial prerendering", explain: "Next.js sends a static shell at once and streams the dynamic parts into it, so pages feel instant and stay personal.", hiExplain: "Next.js तुरंत एक स्थिर ढाँचा भेजता है और बदलने वाले हिस्से बाद में स्ट्रीम करता है, ताकि पेज तेज़ भी रहें और निजी भी।" },
    { term: "Server vs client state", explain: "TanStack Query caches data that lives on a server; Zustand holds UI state that lives only in the browser.", hiExplain: "TanStack Query सर्वर के डेटा को कैश करता है; Zustand सिर्फ़ ब्राउज़र में रहने वाली UI स्टेट रखता है।" },
  ],
  aws: [
    { term: "Serverless", explain: "Lambda runs your code on demand and bills per request and millisecond; there are no servers to patch or scale.", hiExplain: "Lambda आपका कोड ज़रूरत पर चलाता है और प्रति अनुरोध व मिलीसेकंड बिल करता है; पैच या स्केल करने को कोई सर्वर नहीं।" },
    { term: "Availability Zones", explain: "Separate data centres inside one Region. Spreading an app across two or more keeps it up when one fails.", hiExplain: "एक Region के अंदर अलग-अलग डेटा सेंटर। ऐप को दो या ज़्यादा में फैलाने से एक के फ़ेल होने पर भी वह चलता रहता है।" },
    { term: "Amazon Bedrock", explain: "One AWS API for many foundation models (Claude, Llama, Nova), with knowledge bases, agents and guardrails built in.", hiExplain: "कई फ़ाउंडेशन मॉडल (Claude, Llama, Nova) के लिए एक AWS API, जिसमें नॉलेज बेस, एजेंट और गार्डरेल पहले से हैं।" },
  ],
  musk: [
    { term: "Large language model", explain: "A model like Grok, trained on huge amounts of text to predict the next token; that one skill becomes chat, code and reasoning.", hiExplain: "Grok जैसा मॉडल, जो विशाल टेक्स्ट पर अगला टोकन अनुमान लगाना सीखता है; यही कौशल चैट, कोड और तर्क बनता है।" },
    { term: "End-to-end autonomy", explain: "One neural network going from camera pixels to driving controls, instead of hand-written rules: Tesla's approach to self-driving.", hiExplain: "हाथ से लिखे नियमों की जगह एक न्यूरल नेटवर्क, जो कैमरा पिक्सेल से सीधे ड्राइविंग कंट्रोल तक जाता है: सेल्फ़-ड्राइविंग का Tesla तरीका।" },
    { term: "Reusable rockets", explain: "Landing boosters to fly again cuts launch cost, which is what makes large satellite networks like Starlink possible.", hiExplain: "बूस्टर को उतारकर फिर से उड़ाने से लॉन्च सस्ता होता है; इसी से Starlink जैसे बड़े सैटेलाइट नेटवर्क संभव होते हैं।" },
  ],
  "amazon-ai": [
    { term: "Foundation model", explain: "A large model trained once on broad data, then adapted to many tasks, like Amazon Nova for text, images and video.", hiExplain: "विस्तृत डेटा पर एक बार सिखाया गया बड़ा मॉडल, जिसे कई कामों में ढाला जाता है, जैसे टेक्स्ट, इमेज और वीडियो के लिए Amazon Nova।" },
    { term: "RAG", explain: "Retrieval-augmented generation: find the relevant documents first, then let the model answer from them, so answers stay current and grounded.", hiExplain: "पहले संबंधित दस्तावेज़ ढूँढें, फिर मॉडल उन्हीं से जवाब दे, ताकि जवाब ताज़ा और तथ्यों पर आधारित रहें।" },
    { term: "AI chips", explain: "Custom chips such as Trainium and Inferentia train and run some models more cheaply than general-purpose GPUs.", hiExplain: "Trainium और Inferentia जैसी कस्टम चिप कुछ मॉडलों को सामान्य GPU से सस्ते में सिखाती और चलाती हैं।" },
  ],
  "questions-tech": [
    { term: "Answer, then trade off", explain: "Give the answer in one line, then name one trade-off. Interviewers grade the reasoning more than the definition.", hiExplain: "पहले एक पंक्ति में जवाब दें, फिर एक ट्रेड-ऑफ़ बताएँ। इंटरव्यूअर परिभाषा से ज़्यादा तर्क को अंक देते हैं।" },
    { term: "Big-O out loud", explain: "State the time and space complexity of every solution you write, and say how you would improve it.", hiExplain: "हर समाधान की समय और स्थान जटिलता बोलकर बताएँ, और यह भी कि उसे कैसे बेहतर करेंगे।" },
    { term: "STAR stories", explain: "Situation, Task, Action, Result: keep three real project stories ready for the behavioural round.", hiExplain: "स्थिति, काम, कार्रवाई, नतीजा: व्यवहार वाले राउंड के लिए तीन असली प्रोजेक्ट कहानियाँ तैयार रखें।" },
  ],
  "questions-agentic": [
    { term: "Evals first", explain: "Before tuning prompts, build a small test set and score the agent on it, so every change is measured, not guessed.", hiExplain: "प्रॉम्प्ट बदलने से पहले छोटा टेस्ट सेट बनाकर एजेंट को स्कोर करें, ताकि हर बदलाव अनुमान नहीं, माप से हो।" },
    { term: "Guardrails", explain: "Checks on what goes into and comes out of a model: PII redaction, allowed tools, output validation and spend limits.", hiExplain: "मॉडल में जाने और निकलने वाली चीज़ों की जाँच: निजी डेटा छिपाना, अनुमत टूल, आउटपुट की पुष्टि और खर्च की सीमा।" },
    { term: "Chunking for RAG", explain: "How documents are split before embedding decides what can be found; chunks too small or too large both hurt answers.", hiExplain: "एम्बेडिंग से पहले दस्तावेज़ कैसे बाँटे गए, यही तय करता है कि क्या मिलेगा; बहुत छोटे या बहुत बड़े टुकड़े, दोनों जवाब बिगाड़ते हैं।" },
  ],
  trending: [
    { term: "Open vs closed models", explain: "Open-weight models can be run and tuned on your own hardware; closed models are used only through the vendor's API.", hiExplain: "ओपन-वेट मॉडल अपनी मशीन पर चलाए और ट्यून किए जा सकते हैं; क्लोज़्ड मॉडल सिर्फ़ कंपनी की API से इस्तेमाल होते हैं।" },
    { term: "Inference cost", explain: "The price of running a model for each request. Falling costs are why AI features now ship in everyday apps.", hiExplain: "हर अनुरोध पर मॉडल चलाने की कीमत। घटती लागत की वजह से AI फ़ीचर अब रोज़ के ऐप्स में आ रहे हैं।" },
    { term: "AI regulation", explain: "Rules such as the EU AI Act sort AI systems by risk and require transparency and testing for high-risk uses.", hiExplain: "EU AI Act जैसे नियम AI सिस्टम को जोखिम के हिसाब से बाँटते हैं और ज़्यादा जोखिम वाले उपयोग के लिए पारदर्शिता व परीक्षण माँगते हैं।" },
  ],
};
