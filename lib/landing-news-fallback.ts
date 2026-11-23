import type { LandingNews, NewsLogo } from "@/lib/landing-news";

/** Monogram logos for the built-in stories (the live set uses simple-icons marks, lib/server/landing-news.ts). */
const LOGOS: Record<string, NewsLogo> = {
  "Anthropic": { name: "Anthropic", hex: "D97706", path: null },
  "OpenAI": { name: "OpenAI", hex: "000000", path: null },
  "Google": { name: "Google", hex: "4285F4", path: null },
  "Microsoft": { name: "Microsoft", hex: "5E5E5E", path: null },
  "LangChain": { name: "LangChain", hex: "1C3C3C", path: null },
  "Vercel": { name: "Vercel", hex: "000000", path: null },
  "React": { name: "React", hex: "087EA4", path: null },
  "AWS": { name: "AWS", hex: "FF9900", path: null },
  "Amazon": { name: "Amazon", hex: "FF9900", path: null },
  "SpaceX": { name: "SpaceX", hex: "000000", path: null },
  "Tesla": { name: "Tesla", hex: "E82127", path: null },
  "xAI": { name: "xAI", hex: "000000", path: null },
  "Meta": { name: "Meta", hex: "0668E1", path: null },
  "Nvidia": { name: "Nvidia", hex: "76B900", path: null },
  "Harness": { name: "Harness", hex: "0278D5", path: null },
  "TanStack": { name: "TanStack", hex: "FF4154", path: null },
  "Nasdaq": { name: "Nasdaq", hex: "0996C7", path: null },
  "Cloudflare": { name: "Cloudflare", hex: "F38020", path: null },
  "Netflix": { name: "Netflix", hex: "E50914", path: null },
  "Stripe": { name: "Stripe", hex: "635BFF", path: null },
  "Uber": { name: "Uber", hex: "000000", path: null }
};
const L = (name: string) => LOGOS[name];

/**
 * The built-in "Fresh in tech" set: shown on first paint and whenever the live set (searched weekly by
 * lib/server/landing-news.ts) cannot be read, so the section is never empty. Every story links to the article it
 * came from. Refreshed by hand for the week of 23 November 2026; the interview-question slides are evergreen.
 */
export const DEFAULT_LANDING_NEWS: LandingNews = {
  updatedAt: "2026-11-23T00:00:00Z",
  slides: [
    {
      id: "ai-labs",
      kind: "news",
      fresh: true,
      stories: [
        {
          title: "Anthropic ships Claude Fable 5.2, with Mythos 5.2 for vetted teams",
          summary: "Anthropic released Fable 5.2 for everyone and the same model as Mythos 5.2 for vetted cybersecurity and life-science teams, with faster outputs.",
          source: "SD Times",
          url: "https://sdtimes.com/ai/anthropic-introduces-claude-fable-5-2-mythos-5-2/",
          date: "2026-11-09",
          logo: L("Anthropic"),
          points: [
            "Fable 5.2 is open to all users, with cybersecurity and biology safeguards.",
            "Mythos 5.2 is the same model, limited to Anthropic's verification programmes.",
            "Anthropic reports gains in coding, reasoning and vision over the 5.1 models."
          ],
          why: "One model, two access tiers: a pattern for shipping powerful capabilities while limiting misuse.",
          concept: { term: "Tiered access", explain: "Giving riskier capabilities only to verified users, while everyone else gets the same model with extra safeguards." }
        },
        {
          title: "OpenAI launches GPT-6.2 Astra for professional work and GPT-6.2 Sol",
          summary: "OpenAI released two GPT-6.2 models: Astra for demanding professional and coding work, and Sol for efficient everyday use, both in the API.",
          source: "Let's Data Science",
          url: "https://letsdatascience.com/news/openai-launches-gpt-62-astra-frontier-model-and-gpt-62-sol-ccad09ba",
          date: "2026-11-17",
          logo: L("OpenAI"),
          points: [
            "Two tiers: Astra for hard, long tasks and Sol for fast, cheaper everyday calls.",
            "Both are available to developers through the OpenAI API.",
            "Reported pricing for Astra is lower than the GPT-6 Astra it replaces."
          ],
          why: "Picking the right tier per request is now a core cost and latency decision in AI apps.",
          concept: { term: "Model routing", explain: "Sending each request to the cheapest model that can handle it, and only hard ones to the frontier model." }
        },
        {
          title: "Google introduces Gemini 4 Neon, the middle model of the Gemini 4 family",
          summary: "Gemini 4 Neon sits between Carbon and Hydrogen, and is rolling out in the Gemini API, Google AI Studio and Google Antigravity.",
          source: "Google Blog",
          url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/",
          date: "2026-11-18",
          logo: L("Google"),
          points: [
            "Neon sits between Gemini 4 Carbon (hardest tasks) and Hydrogen (fast, everyday).",
            "Available in the Gemini API, Google AI Studio and Google Antigravity.",
            "Antigravity can pair Neon as planner with Hydrogen as executor in one session."
          ],
          why: "Planner and executor pairs let a strong model plan while a cheaper one does the many small steps.",
          concept: { term: "Planner-executor", explain: "An agent design where one model breaks a task into steps and another, faster model carries them out." }
        },
        {
          title: "Microsoft unveils its own MAI models for coding, voice and security at Ignite",
          summary: "At Ignite 2026 Microsoft announced in-house MAI models, led by MAI Code 2, and said enterprises can license some model weights to run in Azure.",
          source: "Windows Central",
          url: "https://windowscentral.com/software-apps/microsoft-launches-seven-in-house-ai-models-to-cut-developer-costs-and-reduce-reliance-on-openai",
          date: "2026-11-17",
          logo: L("Microsoft"),
          points: [
            "MAI Code 2 targets coding at a lower price, per Microsoft's own benchmarks.",
            "New voice and transcription models, plus a security model for select customers.",
            "Some customers can license weights and fine-tune them inside their Azure tenancy."
          ],
          why: "Big clouds now ship their own models, so developers get more choice and more price competition.",
          concept: { term: "Model weights", explain: "The learned numbers that make up a trained model; holding them lets you run and fine-tune it yourself." }
        },
        {
          title: "Gemini 4 Neon lands on Vercel AI Gateway on launch day",
          summary: "Vercel added Gemini 4 Neon to its AI Gateway, so apps can switch to it by changing one model string.",
          source: "Vercel Changelog",
          url: "https://vercel.com/changelog/gemini-4-neon-now-available-on-ai-gateway",
          date: "2026-11-18",
          logo: L("Vercel"),
          points: [
            "One API key and endpoint for models from many providers.",
            "Switching models means changing the model ID, not the code."
          ],
          why: "Gateways make trying a new model a one-line change, which speeds up evaluation.",
          concept: { term: "AI gateway", explain: "A single API in front of many model providers that handles keys, routing, retries and usage tracking." }
        }
      ]
    },
    {
      id: "agentic",
      kind: "news",
      fresh: true,
      stories: [
        {
          title: "Gemini API adds Tool Retrieval so agents load tools only when needed",
          summary: "Google added Tool Retrieval in preview to the Gemini Interactions API: an agent searches its tools and loads deferred ones on demand.",
          source: "The Neuron",
          url: "https://www.theneuron.ai/digest/everything-that-happened-in-ai-today-friday-november-20-2026/",
          date: "2026-11-20",
          logo: L("Google"),
          points: [
            "Agents add a tool_search tool to look tools up at run time.",
            "Tools marked defer_loading stay out of the prompt until they are needed.",
            "Keeps context small for agents with hundreds of tools."
          ],
          why: "Large tool lists eat context and confuse models; loading on demand keeps agents fast and accurate.",
          concept: { term: "Deferred tool loading", explain: "Keeping tool definitions out of the prompt and fetching only the ones a task actually needs." }
        },
        {
          title: "Google Antigravity pairs Gemini 4 Neon as planner with Hydrogen as executor",
          summary: "Antigravity's Orchestrator can now run Gemini 4 Neon as the planner and Gemini 4 Hydrogen as the executor in a single coding session.",
          source: "Google Antigravity",
          url: "https://antigravity.google/blog/gemini-4-neon-in-google-antigravity/",
          date: "2026-11-18",
          logo: L("Google"),
          points: [
            "A stronger model plans, a faster one executes each step.",
            "Both run inside one Antigravity session.",
            "Available to paid Google AI Pro and Ultra subscribers."
          ],
          why: "Multi-model agents are becoming the default way to balance quality against speed and cost.",
          concept: { term: "Orchestrator", explain: "The part of an agent system that splits work, hands steps to workers and combines their results." }
        },
        {
          title: "LangGraph 1.2.24 fixes message removal and checkpoint handling",
          summary: "LangGraph's latest patch fixes how removed messages are handled and supports checkpoints that hold None values.",
          source: "Releasebot",
          url: "https://releasebot.io/updates/langchain-ai",
          date: "2026-11-20",
          logo: L("LangChain"),
          points: [
            "Fixes message removal handling in graph state.",
            "Supports checkpoints with None values.",
            "LangGraph has shipped steady 1.2.x patches since 1.0 in October 2025."
          ],
          why: "Checkpoints are what let long-running agents pause, resume and recover, so their correctness matters.",
          concept: { term: "Checkpointing", explain: "Saving an agent's state after each step so it can resume after a crash or a human approval." }
        },
        {
          title: "LangChain 1.4 brings MCP tools into agents through langchain.mcp",
          summary: "LangChain 1.4 added FastMCP support under langchain.mcp, so tools exposed by MCP servers plug into an agent without custom glue code.",
          source: "Developers Digest",
          url: "https://www.developersdigest.tech/blog/langchain-langgraph-whats-new-2026",
          date: "2026-11-02",
          logo: L("LangChain"),
          points: [
            "MCP support moved into langchain.mcp (beta).",
            "Any MCP server's tools can be handed to a LangChain agent.",
            "langchain 1.4.8 was the current PyPI release in early November."
          ],
          why: "MCP is becoming the standard plug for agent tools, so one integration works across frameworks.",
          concept: { term: "MCP", explain: "Model Context Protocol: an open standard for connecting AI apps to tools and data through small servers." }
        }
      ]
    },
    {
      id: "system-design",
      kind: "news",
      fresh: true,
      stories: [
        {
          title: "Harness postmortem: one hot document stalled deploys for 46 minutes",
          summary: "A pipeline that kept all its state in one database document drew heavy concurrent writes, and lock waits stalled other pipelines on that node.",
          source: "DEV Community",
          url: "https://dev.to/kashif_manzer/one-pipeline-one-document-and-46-minutes-of-stalled-deploys-1aa0",
          date: "2026-11-18",
          logo: L("Harness"),
          points: [
            "Incident on 13 November, 17:56 to 18:42 UTC.",
            "Interim fix: a longer lock-wait window.",
            "Permanent fix: shard pipeline state across many documents."
          ],
          why: "A single hot record can take down neighbours sharing its node: a classic hotspot lesson.",
          concept: { term: "Hot partition", explain: "One key or record that gets far more traffic than others and overloads the node that stores it." }
        },
        {
          title: "Microsoft 365 outage on 12 November prompts architecture write-ups",
          summary: "A long Microsoft 365 outage on 12 November set off analyses of cascading failure; accounts of the root cause differ, so wait for Microsoft's report.",
          source: "The Architect's Notebook",
          url: "https://thearchitectsnotebook.substack.com/p/the-microsoft-outage-of-november",
          date: "2026-11-14",
          logo: L("Microsoft"),
          points: [
            "Write-ups describe a change that spread failures across dependent services.",
            "Root-cause accounts conflict: network change, BGP or lock contention.",
            "The official post-incident review is the source to trust."
          ],
          why: "Learn to read outage reports critically: early commentary is often wrong on the root cause.",
          concept: { term: "Cascading failure", explain: "When one component fails and the extra load or errors it causes knock over the services that depend on it." }
        },
        {
          title: "Amazon S3 doubles the read request rate for general purpose buckets",
          summary: "S3 general purpose buckets can now serve up to twice as many read requests, according to AWS's 20 November update.",
          source: "Dev Digest",
          url: "https://weirdion.substack.com/p/dev-digest-week-of-2026-11-22",
          date: "2026-11-20",
          logo: L("AWS"),
          points: [
            "Up to 2x read request rate for general purpose buckets.",
            "Fewer key-prefix tricks needed for read-heavy workloads."
          ],
          why: "Read-heavy designs such as media and data lakes need less sharding work to hit high throughput.",
          concept: { term: "Request rate limit", explain: "The number of operations per second a storage service accepts before it starts throttling." }
        },
        {
          title: "Postmortems from 2025 and 2026 cloud outages, distilled into lessons",
          summary: "A review of seven official postmortems from recent cloud outages pulls out shared lessons on config changes, blast radius and recovery.",
          source: "Ajay Kumar",
          url: "https://www.ajayk.sh/blog/cloud-outages-2025-2026-resilience-lessons/",
          date: "2026-11-10",
          logo: null,
          points: [
            "Most outages started with a configuration or permissions change.",
            "Smaller blast radius and staged rollouts limited the damage.",
            "Fast rollback mattered more than fast diagnosis."
          ],
          why: "Reading real postmortems is the quickest way to learn reliability design for interviews and work.",
          concept: { term: "Blast radius", explain: "How much of a system one failure can affect; cells, regions and staged rollouts keep it small." }
        }
      ]
    },
    {
      id: "frontend",
      kind: "news",
      fresh: true,
      stories: [
        {
          title: "Next.js 16.4.6 is the latest stable release",
          summary: "Next.js 16.4.6 shipped on 9 November, following the 16.4.5 security release, while 16.5 continues in canary.",
          source: "Releases.sh",
          url: "https://releases.sh/vercel/nextjs",
          date: "2026-11-09",
          logo: L("Vercel"),
          points: [
            "16.4.6 is the current stable version.",
            "16.5.0 canaries were still shipping on 22 November.",
            "Upgrade with npm i next@latest after reading the release notes."
          ],
          why: "Staying on the latest patch keeps security fixes in and makes the next minor upgrade small.",
          concept: { term: "Canary release", explain: "A pre-release build published often so early adopters can test features before a stable version." }
        },
        {
          title: "Next.js 16.4.5 and 15.5.29 ship as scheduled security releases",
          summary: "The 3 November release patched 16.x and backported fixes to 15.5, including Google font URLs, proxy.ts runtime loading and OpenTelemetry traces.",
          source: "DEV Community",
          url: "https://dev.to/sushilmagare10/november-2-8-2026-nextjs-1645-ai-sdk-70165-tanstack-ai-12-6b3",
          date: "2026-11-03",
          logo: L("Vercel"),
          points: [
            "Security fixes for both the 16.4 and 15.5 lines.",
            "Fixes extensionless Google font URLs in both bundlers.",
            "Keeps OpenTelemetry request traces together."
          ],
          why: "Scheduled security releases mean teams can plan upgrades instead of scrambling.",
          concept: { term: "Backport", explain: "Applying a fix made on the newest version to an older supported version as well." }
        },
        {
          title: "TanStack Query 5.108.1 ships for React",
          summary: "TanStack released @tanstack/react-query 5.108.1 on 19 November, a patch that updates its core dependency.",
          source: "GitHub",
          url: "https://github.com/tanstack/query/releases",
          date: "2026-11-19",
          logo: L("TanStack"),
          points: [
            "Patch release of React Query on the v5 line.",
            "Updates query-core to 5.108.1."
          ],
          why: "React Query remains the usual choice for server state next to client stores like Zustand.",
          concept: { term: "Server state", explain: "Data owned by the backend that the UI caches, refetches and keeps in sync, unlike local UI state." }
        },
        {
          title: "TanStack AI 1.1 adds cancel options; TanStack DB nears 1.0",
          summary: "@tanstack/ai 1.1.0 added optional cancel options without breaking existing calls, and TanStack DB moved through 1.0 release candidates.",
          source: "Releasebot",
          url: "https://releasebot.io/updates/tanstack",
          date: "2026-11-06",
          logo: L("TanStack"),
          points: [
            "TanStack AI 1.1.0 (4 November) adds cancellation options.",
            "TanStack DB reached 1.0.0-rc.1.4 on 6 November."
          ],
          why: "Cancelling streams cleanly matters for AI chat UIs where users stop or change a question.",
          concept: { term: "AbortController", explain: "The web API for cancelling a fetch or stream: you pass its signal and call abort() to stop it." }
        }
      ]
    },
    {
      id: "aws",
      kind: "news",
      fresh: true,
      stories: [
        {
          title: "AWS Lambda now runs on GPU instances via Lambda Managed Instances",
          summary: "Event Functions on Lambda Managed Instances can now use EC2 G-series GPUs, with Lambda handling provisioning, drivers and scaling.",
          source: "Let's Data Science",
          url: "https://letsdatascience.com/news/aws-lambda-adds-gpu-instances-for-event-functions-on-lambda-671a9172",
          date: "2026-11-18",
          logo: L("AWS"),
          points: [
            "GPU functions deploy as container images.",
            "Aimed at inference, not training.",
            "Priced at standard EC2 rates plus a management fee."
          ],
          why: "Serverless GPU inference removes much of the cluster work of hosting your own models.",
          concept: { term: "Inference", explain: "Running a trained model to get predictions, as opposed to training, which changes the model." }
        },
        {
          title: "Lambda Managed Instances adds scale to zero",
          summary: "A 17 November update lets Lambda Managed Instances scale down to zero; one tester ran a vLLM model on a g6e.xlarge this way.",
          source: "Classmethod",
          url: "https://dev.classmethod.jp/articles/lambda-managed-instances-gpu-vllm-scale-to-zero/",
          date: "2026-11-17",
          logo: L("AWS"),
          points: [
            "Idle capacity can drop to zero to save cost.",
            "The tester saw a cold start of about four minutes for a GPU LLM."
          ],
          why: "Scale to zero saves money but brings long cold starts for big models: a classic trade-off.",
          concept: { term: "Cold start", explain: "The delay when a platform must start fresh capacity before handling the first request." }
        },
        {
          title: "Lambda adds Python 3.15 and Node.js 26 runtimes",
          summary: "AWS added Python 3.15 and Node.js 26 support to Lambda, plus OpenTelemetry tracing for durable functions, on 20 November.",
          source: "Dev Digest",
          url: "https://weirdion.substack.com/p/dev-digest-week-of-2026-11-22",
          date: "2026-11-20",
          logo: L("AWS"),
          points: [
            "New managed runtimes: Python 3.15 and Node.js 26.",
            "OpenTelemetry tracing for durable functions."
          ],
          why: "New runtimes bring language features and longer support windows for your functions.",
          concept: { term: "Managed runtime", explain: "A language environment the platform patches and maintains for you." }
        },
        {
          title: "AWS brings more OpenAI models to Amazon Bedrock in limited preview",
          summary: "AWS expanded its partnership with OpenAI, bringing more OpenAI models and managed agents to Amazon Bedrock in limited preview.",
          source: "DEV Community",
          url: "https://dev.to/nadtakanfuthoem/aws-serverless-roundup-november-14-20-2026-2665",
          date: "2026-11-20",
          logo: L("AWS"),
          points: [
            "More OpenAI models arrive on Bedrock in limited preview.",
            "Bedrock AgentCore runtime expands to more Regions."
          ],
          why: "Teams on AWS can try more frontier models without leaving their account's security and billing.",
          concept: { term: "Foundation model", explain: "A large model trained on broad data that can be adapted to many tasks through prompts or fine-tuning." }
        }
      ]
    },
    {
      id: "musk",
      kind: "news",
      fresh: true,
      stories: [
        {
          title: "Starship Flight 15 spends about 22 hours in space and ends in a catch",
          summary: "SpaceX flew Starship Flight 15 on 13 November, hours after its FAA licence, with roughly 22 hours in space and a precise landing catch.",
          source: "Tesla Oracle",
          url: "https://www.teslaoracle.com/2026/11/15/the-epic-story-of-flight-15-starship-22-hours-in-space-and-a-precise-landing-catch/",
          date: "2026-11-15",
          logo: L("SpaceX"),
          points: [
            "FAA licence arrived hours before launch.",
            "About 22 hours in space.",
            "Musk explained a booster catch abort and termination triggers."
          ],
          why: "Reusable rockets rely on software for guidance and catches, a showcase of real-time control systems.",
          concept: { term: "Flight termination", explain: "Automatic rules that end a flight safely when a vehicle leaves its allowed limits." }
        },
        {
          title: "Tesla begins rolling out FSD v15 to early-access cars",
          summary: "Tesla skipped planned v14 upgrades and started FSD v15 for early-access owners, adding speed-camera slowing and Reality View.",
          source: "Tesla Oracle",
          url: "https://www.teslaoracle.com/2026/11/22/tesla-fsd-v15-2026-38-6-11-rollout-begins-official-release-notes-and-new-features/",
          date: "2026-11-22",
          logo: L("Tesla"),
          points: [
            "Ships in software 2026.38.6.11 to early-access cars.",
            "New: speed-camera slowing, Reality View, Bike Rack Mode.",
            "Musk says wider release comes with the December holiday update."
          ],
          why: "Staged rollouts to small groups first are how large fleets ship risky software safely.",
          concept: { term: "Staged rollout", explain: "Releasing to a small group first, watching metrics, then widening step by step." }
        },
        {
          title: "SpaceX says Grok spots hardware debris more accurately than people",
          summary: "SpaceX uses Grok to inspect hardware for debris and says it reaches 99.9% accuracy versus about 94% for human reviewers.",
          source: "Tesla North",
          url: "https://teslanorth.com/2026/11/09/spacex-grok-hardware-debris-inspection-accuracy/",
          date: "2026-11-09",
          logo: L("SpaceX"),
          points: [
            "Grok reviews inspection footage for debris.",
            "Accuracy figures are SpaceX's own claim."
          ],
          why: "Vision models are moving into quality control, but vendor accuracy claims need independent checks.",
          concept: { term: "Computer vision", explain: "AI that interprets images or video, such as finding defects in inspection footage." }
        },
        {
          title: "Virginia and Oregon sue SpaceX over Grok-generated abuse images",
          summary: "Two US states sued SpaceX, which now runs Grok, over sexual abuse imagery the model generated, citing research on images posted to X.",
          source: "US News",
          url: "https://usnews.com/news/us/articles/2026-11-23/virginia-oregon-sue-musks-spacex-over-grok-ais-creation-of-child-sexual-abuse-images-and-videos",
          date: "2026-11-23",
          logo: L("xAI"),
          points: [
            "SpaceX acquired xAI, and Grok is now part of SpaceX's AI division.",
            "SpaceX also faces lawsuits from individuals over Grok images."
          ],
          why: "Image-model safety failures now carry legal risk, which makes guardrails a core engineering job.",
          concept: { term: "Guardrails", explain: "Checks around a model that block harmful requests and outputs before they reach users." }
        }
      ]
    },
    {
      id: "amazon-ai",
      kind: "news",
      fresh: true,
      stories: [
        {
          title: "Amazon lets customers text its AI shopping agent",
          summary: "Amazon now lets customers text Alexa for Shopping, the agent that combines Rufus and Alexa+, to research and buy products.",
          source: "About Amazon",
          url: "https://www.aboutamazon.com/artificial-intelligence-ai-news",
          date: "2026-11-13",
          logo: L("Amazon"),
          points: [
            "Alexa for Shopping merges Rufus and Alexa+.",
            "Available in the Amazon Shopping app, on the website and now by text."
          ],
          why: "Agents are moving into everyday channels like messaging, not just chat boxes in apps.",
          concept: { term: "Conversational commerce", explain: "Shopping through a chat or voice conversation instead of search and menus." }
        },
        {
          title: "Alexa for Shopping arrives in Japan with free conversational help",
          summary: "Amazon brought the renamed Alexa for Shopping to Japan, offering conversational buying help at no extra cost.",
          source: "BigGo Finance",
          url: "https://finance.biggo.com/news/f4bdcbc2-d5ce-4b36-bb9e-6849598d4b85",
          date: "2026-11-12",
          logo: L("Amazon"),
          points: [
            "Rufus is renamed and overhauled as Alexa for Shopping.",
            "Alexa+ is also expanding in Japan."
          ],
          why: "Launching AI assistants in new languages means localising both the model and product data.",
          concept: { term: "Localisation", explain: "Adapting a product's language, formats and content for a specific country or region." }
        },
        {
          title: "Amazon reportedly to pay $7.5 billion for Decart's technology",
          summary: "Bloomberg reports Amazon will pay about $7.5 billion for Decart's technology, reportedly to run AI models better on its Trainium chips.",
          source: "Startup Fortune",
          url: "https://startupfortune.com/amazon-reportedly-agrees-to-pay-75-billion-for-decarts-technology",
          date: "2026-11-19",
          logo: L("Amazon"),
          points: [
            "Terms are reported, not confirmed by Amazon.",
            "Aimed at model performance on Amazon's own Trainium chips."
          ],
          why: "Custom AI chips need matching software to be fast, which is why chip makers buy optimisation know-how.",
          concept: { term: "AI accelerator", explain: "A chip designed for the maths of neural networks, such as GPUs, TPUs or Trainium." }
        },
        {
          title: "AWS re:Invent 2026 returns to Las Vegas with more than 2,200 sessions",
          summary: "Amazon's yearly cloud conference opens in Las Vegas, where AWS usually announces its biggest AI and infrastructure launches.",
          source: "About Amazon",
          url: "https://www.aboutamazon.com/",
          date: "2026-11-20",
          logo: L("AWS"),
          points: [
            "More than 2,200 sessions.",
            "Expect Bedrock, agent and Trainium news."
          ],
          why: "re:Invent launches shape which AWS services teams adopt in the next year.",
          concept: { term: "Keynote launch", explain: "A product announced on stage at a conference, often with docs and pricing published the same day." }
        }
      ]
    },
    {
      id: "questions-tech",
      kind: "questions",
      fresh: true,
      questions: [
        {
          question: "Explain the Node.js Event Loop and the execution order between Microtasks and Macrotasks.",
          answer: "The Event Loop processes macrotask phases (Timers, I/O, Poll, Check) sequentially. After every individual task or phase change, the microtask queue (process.nextTick, Promise callbacks) empties completely before moving on.",
          rating: 5,
          companies: [L("Google"), L("Meta"), L("Amazon")],
          source: "LeetCode Discuss",
          url: "https://leetcode.com/discuss"
        },
        {
          question: "How would you design a distributed Rate Limiter handling 100k requests per second?",
          answer: "Use the Token Bucket or Sliding Window Log algorithm implemented with Redis. Use Redis Lua scripts or Redis Cell to execute atomic counter increments and timestamp checks in a single round-trip without race conditions.",
          rating: 5,
          companies: [L("Stripe"), L("Uber"), L("Netflix")],
          source: "Glassdoor Technical Interviews",
          url: "https://www.glassdoor.com"
        },
        {
          question: "What are the core differences between optimistic locking and pessimistic locking in databases?",
          answer: "Pessimistic locking locks rows on read (SELECT FOR UPDATE) preventing concurrent access until commit. Optimistic locking avoids locks, checking a version column at update time and failing or retrying if another transaction changed the row.",
          rating: 5,
          companies: [L("Amazon"), L("Microsoft")],
          source: "Blind Engineering Reports",
          url: "https://www.teamblind.com"
        },
        {
          question: "How does React 19 reconciliation differ from earlier versions, and what role does use() play?",
          answer: "React 19 integrates Server Actions and the use() hook to unwrap promises directly in render components. The React Compiler automatically memoizes component trees, eliminating the need for manual useMemo and useCallback hooks.",
          rating: 4,
          companies: [L("Meta"), L("Vercel")],
          source: "LeetCode Discuss",
          url: "https://leetcode.com/discuss"
        },
        {
          question: "When should you choose PostgreSQL with JSONB versus a dedicated NoSQL document store like MongoDB?",
          answer: "Choose Postgres with JSONB when you need relational integrity, foreign keys, and ACID transactions alongside flexible schema fields. Choose MongoDB when scaling horizontal sharding across hundreds of nodes with native document clustering.",
          rating: 4,
          companies: [L("Uber"), L("Cloudflare")],
          source: "Glassdoor Technical Interviews",
          url: "https://www.glassdoor.com"
        },
        {
          question: "What is the CAP theorem and how does Apache Kafka balance consistency and partition tolerance?",
          answer: "The CAP theorem states distributed systems cannot guarantee all three: Consistency, Availability, and Partition Tolerance simultaneously. Kafka prioritizes CP or AP depending on the 'acks' configuration and min.insync.replicas settings.",
          rating: 4,
          companies: [L("Netflix"), L("Amazon")],
          source: "Engineering Interview Reports",
          url: "https://leetcode.com/discuss"
        },
        {
          question: "Explain how B-Tree indexes improve database query speed and what trade-offs they introduce.",
          answer: "B-Trees keep data sorted with O(log N) lookup, insertion, and range scans. The trade-off is write overhead: every INSERT, UPDATE, and DELETE must rebalance the tree and update index pages on disk.",
          rating: 4,
          companies: [L("Google"), L("Microsoft")],
          source: "Glassdoor Technical Interviews",
          url: "https://www.glassdoor.com"
        },
        {
          question: "How do you protect modern single-page web applications from XSS and CSRF attacks?",
          answer: "Prevent XSS by sanitizing untrusted HTML, utilizing framework escaping, and enforcing a strict Content Security Policy (CSP). Prevent CSRF by using SameSite=Strict/Lax cookies and verifying custom authorization headers.",
          rating: 4,
          companies: [L("Stripe"), L("Amazon")],
          source: "LeetCode Discuss",
          url: "https://leetcode.com/discuss"
        }
      ]
    },
    {
      id: "questions-agentic",
      kind: "questions",
      fresh: true,
      questions: [
        {
          question: "What is the Model Context Protocol (MCP) and how does it improve agent system architecture?",
          answer: "MCP standardizes communication between LLMs and external data sources or tools using a unified client-server architecture. It eliminates custom plugin code and allows any model to securely access tools across local or remote environments.",
          rating: 5,
          companies: [L("Anthropic"), L("OpenAI"), L("Google")],
          source: "Agentic AI Interview Reports",
          url: "https://leetcode.com/discuss"
        },
        {
          question: "Explain the difference between ReAct and Plan-and-Solve agent execution loops.",
          answer: "ReAct alternates step-by-step between reasoning and tool execution in a tight loop. Plan-and-Solve first breaks the entire user prompt into a multi-step execution plan, then executes steps with specialized workers, improving reliability on large tasks.",
          rating: 5,
          companies: [L("LangChain"), L("Microsoft")],
          source: "AI Engineering Interview Experiences",
          url: "https://www.teamblind.com"
        },
        {
          question: "How do you systematically evaluate an agentic system with non-deterministic multi-step outputs?",
          answer: "Use automated LLM-as-a-Judge evaluations combined with deterministic tool call verification. Evaluate task trajectory accuracy, tool call correctness, input/output schemas, latency, and end-to-end task completion rates against fixed benchmark datasets.",
          rating: 5,
          companies: [L("OpenAI"), L("Anthropic")],
          source: "Glassdoor Technical Interviews",
          url: "https://www.glassdoor.com"
        },
        {
          question: "What strategies prevent an autonomous agent from entering infinite tool-calling recursion?",
          answer: "Enforce strict recursion limits (maximum iteration count), execution time budgets, duplicate tool call detection, and fallback intervention prompts that force the agent to summarize progress when stuck in loops.",
          rating: 4,
          companies: [L("Amazon"), L("Meta")],
          source: "LeetCode Discuss",
          url: "https://leetcode.com/discuss"
        },
        {
          question: "How does Hybrid Search (BM25 keyword + Dense Vector Embeddings) improve RAG accuracy?",
          answer: "Dense vectors capture semantic concepts but miss exact keywords (part numbers, acronyms, code names). BM25 excels at exact keyword matching. Combining both via Reciprocal Rank Fusion (RRF) yields superior retrieval precision.",
          rating: 4,
          companies: [L("Google"), L("Cloudflare")],
          source: "AI Engineering Interview Experiences",
          url: "https://www.teamblind.com"
        },
        {
          question: "What are the trade-offs between character chunking and AST-aware syntax chunking for code RAG?",
          answer: "Character chunking is fast but frequently splits functions or classes in half, destroying context. AST-aware chunking parses language syntax trees to keep complete functions, classes, and comments intact, yielding higher embedding relevance.",
          rating: 4,
          companies: [L("Anthropic"), L("Microsoft")],
          source: "Agentic AI Interview Reports",
          url: "https://leetcode.com/discuss"
        },
        {
          question: "How do guardrails like NeMo or Llama Guard protect AI agents from indirect prompt injection?",
          answer: "Guardrails inspect both incoming user prompts and retrieved document payloads before passing them to the main reasoning model. They classify inputs for malicious instructions (e.g., 'ignore previous rules') and sanitize untrusted text.",
          rating: 4,
          companies: [L("Nvidia"), L("Meta")],
          source: "Engineering Interview Reports",
          url: "https://www.teamblind.com"
        },
        {
          question: "Explain how human-in-the-loop interruption works in stateful multi-agent workflows.",
          answer: "The workflow engine executes until reaching a designated sensitive node (e.g. initiating payment or sending email), persists its execution graph state to a durable database, and pauses until a human user issues an approval signal via Webhook or UI.",
          rating: 4,
          companies: [L("LangChain"), L("Stripe")],
          source: "AI Engineering Interview Experiences",
          url: "https://www.glassdoor.com"
        }
      ]
    },
    {
      id: "trending",
      kind: "news",
      fresh: true,
      stories: [
        {
          title: "Anthropic debuts on Nasdaq after a record $81 billion IPO",
          summary: "Anthropic priced shares at $83, above its range, and opened at $111.50 on 19 November under the ticker ANT.",
          source: "Al Jazeera",
          url: "https://www.aljazeera.com/economy/2026/11/19/anthropic-starts-trading-in-the-us-after-blockbuster-ipo",
          date: "2026-11-19",
          logo: L("Anthropic"),
          points: [
            "980 million shares sold at $83 each.",
            "Opened about 34% above the offer price.",
            "Up to 20% of the offering was set aside for retail investors."
          ],
          why: "The biggest AI IPO so far is a test of how public markets value AI model companies.",
          concept: { term: "IPO", explain: "Initial public offering: when a private company first sells shares that anyone can trade on an exchange." }
        },
        {
          title: "Nasdaq erases its 2026 gain as the AI stock sell-off deepens",
          summary: "The S&P 500 and Dow closed in correction on 19 November and the Nasdaq gave up its gain for the year as AI stocks slid.",
          source: "CNBC",
          url: "https://cnbc.com/2026/11/19/stock-market-today-live-updates.html",
          date: "2026-11-19",
          logo: L("Nasdaq"),
          points: [
            "S&P 500 and Dow closed in correction territory.",
            "The sell-off hit AI stocks despite Anthropic's debut."
          ],
          why: "Market swings shape AI hiring and funding, which affects the job market learners are entering.",
          concept: { term: "Market correction", explain: "A fall of 10% or more from a recent peak in a stock index." }
        },
        {
          title: "Nvidia slips behind Alphabet as the AI rally unravels",
          summary: "Nvidia shares fell sharply and dropped behind Alphabet in market value, as investors questioned AI spending.",
          source: "The Week",
          url: "https://theweek.in/news/biz-tech/2026/11/21/nvidia-shares-plunge-ai-rally-unravels.html",
          date: "2026-11-21",
          logo: L("Nvidia"),
          points: [
            "Nvidia fell behind Alphabet in market value.",
            "Investors are questioning the pace of AI data-centre spending."
          ],
          why: "GPU supply and price drive what AI compute costs, so chip-market shifts reach every AI team.",
          concept: { term: "Market capitalisation", explain: "A company's total share value: the share price times the number of shares." }
        },
        {
          title: "Meta re-evaluates its 2030 net-zero goal as AI data centres grow",
          summary: "Meta is reconsidering its 2030 net-zero target after emissions rose sharply with its AI data-centre build-out.",
          source: "DigiCrusader",
          url: "https://digicrusader.com/ai-news-today-22-november-2026",
          date: "2026-11-22",
          logo: L("Meta"),
          points: [
            "Emissions rose with AI data-centre construction.",
            "The 2030 net-zero goal is under review."
          ],
          why: "AI's energy use is now a design constraint: efficient models and inference save money and carbon.",
          concept: { term: "Energy efficiency", explain: "Getting the same work done with less power, such as smaller models or better hardware use." }
        }
      ]
    }
  ]
};
