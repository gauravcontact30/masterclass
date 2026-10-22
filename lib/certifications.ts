/**
 * The Learning Dashboard's Certifications page (components/certifications.tsx): six certification tracks, each with
 * the certificates worth earning and a step-by-step path from the first lesson to exam day. Plain data, no zod.
 * The landing cards live in lib/certifications-landing.ts so the landing page does not ship these paths.
 *
 * Exam facts (questions, minutes, fee, passing score) are the providers' published figures as of 2026; every
 * certificate links to its official page, which wins when they change. The LangChain-family track was written
 * from the official LangChain docs (docs.langchain.com, via the docs-langchain MCP server).
 */
export type CertLevel = "Foundational" | "Associate" | "Professional" | "Specialty" | "Course certificate";

export type Certificate = {
  name: string; provider: string; code?: string; level: CertLevel;
  /** Questions, time, fee and passing score, or how the certificate is earned. */
  format: string; url: string; note?: string;
};

export type CertStep = {
  title: string; weeks: string;
  /** What to learn, in order. */
  learn: string[];
  /** The hands-on task that proves the step. */
  practice: string;
  /** How you know you are done. */
  checkpoint: string;
};

export type CertTrack = {
  id: string; title: string; tagline: string; who: string; duration: string;
  certificates: Certificate[]; steps: CertStep[]; examTips: string[];
  source?: string;
};

export const CERTIFICATION_TRACKS: CertTrack[] = [
  {
    id: "system-design", title: "System Design",
    tagline: "Design systems that scale, from one server to millions of users, and explain every trade-off in an interview.",
    who: "Backend and full-stack developers preparing for senior or system design rounds.",
    duration: "10 to 12 weeks at 6 to 8 hours a week",
    certificates: [
      { name: "AWS Certified Solutions Architect – Associate", provider: "Amazon Web Services", code: "SAA-C03", level: "Associate", format: "65 questions · 130 minutes · USD 150 · pass 720/1000", url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/", note: "There is no vendor-neutral system design exam; this is the most recognised certificate that tests the same architecture decisions." },
      { name: "Google Cloud Professional Cloud Architect", provider: "Google Cloud", level: "Professional", format: "50–60 questions · 2 hours · USD 200 · case-study based", url: "https://cloud.google.com/learn/certification/cloud-architect" },
      { name: "Microsoft Azure Solutions Architect Expert", provider: "Microsoft", code: "AZ-305", level: "Professional", format: "About 40–60 questions · 120 minutes · requires AZ-104", url: "https://learn.microsoft.com/credentials/certifications/azure-solutions-architect/" },
    ],
    steps: [
      { title: "Foundations: how the web moves a request", weeks: "Week 1", learn: ["Client–server model, DNS lookup, TCP vs UDP, TLS handshake", "HTTP/1.1, HTTP/2 and HTTP/3; status codes; keep-alive", "Latency numbers every engineer should know", "Back-of-the-envelope estimates: QPS, storage per day, bandwidth"], practice: "Estimate the daily storage and peak QPS of a photo-sharing app with 10 million daily users.", checkpoint: "You can trace what happens when you type a URL, from DNS to the rendered page, in under three minutes." },
      { title: "Scaling the stateless tier", weeks: "Week 2", learn: ["Vertical vs horizontal scaling", "Load balancers: L4 vs L7, round robin, least connections, consistent hashing", "Stateless services and where session state goes", "CDNs and edge caching for static and dynamic content"], practice: "Draw a web tier that survives one availability zone going down.", checkpoint: "You can explain why sticky sessions hurt scaling and what replaces them." },
      { title: "Caching", weeks: "Week 3", learn: ["Cache-aside, read-through, write-through, write-behind", "Eviction: LRU, LFU, TTL", "Cache stampede, hot keys and cache penetration, and their fixes", "Redis vs Memcached"], practice: "Add a cache-aside layer to a product page and list three ways it can serve stale data.", checkpoint: "You can pick a caching pattern for a read-heavy and a write-heavy workload and defend it." },
      { title: "Databases and data modelling", weeks: "Weeks 4–5", learn: ["SQL vs NoSQL (document, key-value, wide-column, graph)", "Indexes, B-trees vs LSM trees, query plans", "Replication: leader–follower, multi-leader, leaderless", "Sharding: range, hash, directory; resharding and hot partitions", "Transactions, isolation levels, ACID vs BASE"], practice: "Design the schema and shard key for a chat app's messages table.", checkpoint: "You can say which database you would choose for a feed, a ledger and a session store, and why." },
      { title: "Consistency and distributed systems", weeks: "Week 6", learn: ["CAP and PACELC in plain words", "Strong, eventual, causal and read-your-writes consistency", "Quorums, leader election, consensus (Raft at a high level)", "Idempotency keys, exactly-once myths, distributed IDs (Snowflake, UUIDv7)"], practice: "Make a payment API safe to retry using an idempotency key.", checkpoint: "You can explain why a retried request should never charge a customer twice." },
      { title: "Asynchronous work and messaging", weeks: "Week 7", learn: ["Queues vs streams (SQS, RabbitMQ, Kafka)", "Pub/sub, fan-out, back-pressure, dead-letter queues", "Outbox pattern and change data capture", "Batch vs stream processing"], practice: "Move image resizing out of the upload request into a queue with retries and a dead-letter queue.", checkpoint: "You know when a queue is the right answer and when it only hides a slow dependency." },
      { title: "APIs, reliability and observability", weeks: "Week 8", learn: ["REST, gRPC, GraphQL, WebSockets and SSE", "Rate limiting: token bucket, leaky bucket, sliding window", "Timeouts, retries with jitter, circuit breakers, bulkheads", "Logs, metrics, traces; SLIs, SLOs and error budgets"], practice: "Design a rate limiter for a public API that works across many servers.", checkpoint: "You can set an SLO for a service and say what you would alert on." },
      { title: "Classic designs, end to end", weeks: "Weeks 9–10", learn: ["URL shortener, pastebin, rate limiter", "News feed, chat (WhatsApp), notification system", "Video streaming (YouTube), ride hailing (Uber), search autocomplete", "Distributed cache, key-value store, web crawler"], practice: "Whiteboard one design a day for ten days, timed at 45 minutes each.", checkpoint: "Each design has requirements, estimates, an API, a data model, a diagram and three trade-offs." },
      { title: "Interview framework and certificate", weeks: "Weeks 11–12", learn: ["The 4-step framework: clarify, estimate, high-level design, deep dive", "Talking through trade-offs out loud", "Mapping the patterns to AWS services for SAA-C03 (ELB, Auto Scaling, ElastiCache, RDS, DynamoDB, SQS)", "AWS Well-Architected Framework's six pillars"], practice: "Do two mock interviews with a friend and one full-length SAA-C03 practice exam.", checkpoint: "You score above 80% on practice exams and finish mock designs inside the time box." },
    ],
    examTips: ["Always ask for scale and read/write ratio before drawing anything.", "Name the trade-off you are making; interviewers grade reasoning, not the final box diagram.", "For SAA-C03, the 'most cost-effective' and 'least operational overhead' wording decides between two correct answers."],
  },
  {
    id: "claude-code", title: "Claude Code",
    tagline: "Use Anthropic's agentic coding tool in the terminal and IDE: from the first prompt to hooks, MCP servers, subagents and CI.",
    who: "Developers who want to ship faster with an AI pair programmer and understand how to steer it.",
    duration: "3 to 4 weeks at 4 to 5 hours a week",
    certificates: [
      { name: "Claude Code in Action", provider: "Anthropic Academy", level: "Course certificate", format: "Free online course · certificate of completion", url: "https://anthropic.skilljar.com/" },
      { name: "Introduction to Model Context Protocol", provider: "Anthropic Academy", level: "Course certificate", format: "Free online course · certificate of completion", url: "https://anthropic.skilljar.com/" },
      { name: "Building with the Claude API", provider: "Anthropic Academy", level: "Course certificate", format: "Free online course · certificate of completion", url: "https://anthropic.skilljar.com/" },
    ],
    steps: [
      { title: "Install and first session", weeks: "Week 1", learn: ["Install Claude Code (native installer or npm) and sign in", "Start `claude` in a project folder; ask it to explain the codebase", "How it reads files, runs commands and asks for permission", "The VS Code and JetBrains extensions, the desktop app and the web"], practice: "Ask Claude Code to explain an unfamiliar repository and list its entry points.", checkpoint: "You can start a session, approve or deny a tool call and undo a change." },
      { title: "Project memory with CLAUDE.md", weeks: "Week 1", learn: ["`/init` to generate CLAUDE.md", "What belongs in project, user and local memory", "Coding conventions, test commands and do-not-touch rules", "Keeping memory short so it stays useful"], practice: "Write a CLAUDE.md that tells Claude how to run your tests and lint.", checkpoint: "Claude runs the right test command in a new session without being told." },
      { title: "Working well: plan, then build", weeks: "Week 2", learn: ["Plan mode for larger changes; reviewing the plan before edits", "Permission modes and allow-lists in settings.json", "Giving context: @-mentioning files, pasting screenshots, linking issues", "Test-driven loops: write the failing test, then let Claude make it pass", "`/compact`, `/clear` and managing a long conversation"], practice: "Use plan mode to add a feature with tests to a small app.", checkpoint: "The feature lands with passing tests and a diff you reviewed line by line." },
      { title: "Custom commands, skills and hooks", weeks: "Week 2", learn: ["Custom slash commands in `.claude/commands`", "Skills: packaged instructions Claude loads when relevant", "Hooks: run a formatter after every edit, block edits to protected files", "Sharing team settings in the repository"], practice: "Add a hook that runs Prettier after each file edit and a `/review` command.", checkpoint: "Every edit is formatted automatically and teammates get the same command." },
      { title: "MCP servers", weeks: "Week 3", learn: ["What the Model Context Protocol is: tools, resources and prompts", "`claude mcp add` for local (stdio) and remote (HTTP) servers", "Scopes: local, project (.mcp.json) and user", "Security: only connect servers you trust"], practice: "Connect a GitHub or database MCP server and let Claude answer a question from it.", checkpoint: "You can explain what a tool call from an MCP server can and cannot do." },
      { title: "Subagents and parallel work", weeks: "Week 3", learn: ["Subagents with their own context and tool limits", "Writing an agent definition in `.claude/agents`", "Git worktrees for parallel sessions", "When to split work and when one session is enough"], practice: "Create a code-review subagent that only has read access.", checkpoint: "The subagent reviews a diff without being able to edit files." },
      { title: "Automation: headless mode, CI and the Agent SDK", weeks: "Week 4", learn: ["`claude -p` for scripted, non-interactive runs", "Claude Code GitHub Actions for PR reviews and issue fixes", "The Claude Agent SDK for building your own agents on the same loop", "Cost and context awareness"], practice: "Add a GitHub Action that reviews every pull request.", checkpoint: "A PR gets an automated review comment from your workflow." },
      { title: "Course certificates", weeks: "Week 4", learn: ["Take Claude Code in Action on Anthropic Academy", "Follow with Introduction to Model Context Protocol", "Optional: Building with the Claude API for the API side"], practice: "Finish each course's quizzes and download the certificates.", checkpoint: "Certificates are on your LinkedIn and your repository shows the hooks, commands and CI you built." },
    ],
    examTips: ["Keep a small demo repository with your CLAUDE.md, hooks and commands; it says more than the certificate.", "Learn the permission model well: most real-world mistakes come from approving too much too fast.", "Course content is updated with the product, so check the course page for the current lesson list."],
  },
  {
    id: "aws", title: "AWS certifications",
    tagline: "The most popular AWS certificates, in the order most people take them: Cloud Practitioner, AI Practitioner, the Associates, then Professional.",
    who: "Students, developers and DevOps engineers starting or growing a cloud career.",
    duration: "4 weeks per Foundational exam, 6 to 8 per Associate, 10 to 12 per Professional",
    certificates: [
      { name: "AWS Certified Cloud Practitioner", provider: "Amazon Web Services", code: "CLF-C02", level: "Foundational", format: "65 questions · 90 minutes · USD 100 · pass 700/1000", url: "https://aws.amazon.com/certification/certified-cloud-practitioner/" },
      { name: "AWS Certified AI Practitioner", provider: "Amazon Web Services", code: "AIF-C01", level: "Foundational", format: "65 questions · 90 minutes · USD 100 · pass 700/1000", url: "https://aws.amazon.com/certification/certified-ai-practitioner/" },
      { name: "AWS Certified Solutions Architect – Associate", provider: "Amazon Web Services", code: "SAA-C03", level: "Associate", format: "65 questions · 130 minutes · USD 150 · pass 720/1000", url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/" },
      { name: "AWS Certified Developer – Associate", provider: "Amazon Web Services", code: "DVA-C02", level: "Associate", format: "65 questions · 130 minutes · USD 150 · pass 720/1000", url: "https://aws.amazon.com/certification/certified-developer-associate/" },
      { name: "AWS Certified Machine Learning Engineer – Associate", provider: "Amazon Web Services", code: "MLA-C01", level: "Associate", format: "65 questions · 130 minutes · USD 150 · pass 720/1000", url: "https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/" },
      { name: "AWS Certified Data Engineer – Associate", provider: "Amazon Web Services", code: "DEA-C01", level: "Associate", format: "65 questions · 130 minutes · USD 150 · pass 720/1000", url: "https://aws.amazon.com/certification/certified-data-engineer-associate/" },
      { name: "AWS Certified Solutions Architect – Professional", provider: "Amazon Web Services", code: "SAP-C02", level: "Professional", format: "75 questions · 180 minutes · USD 300 · pass 750/1000", url: "https://aws.amazon.com/certification/certified-solutions-architect-professional/" },
      { name: "AWS Certified DevOps Engineer – Professional", provider: "Amazon Web Services", code: "DOP-C02", level: "Professional", format: "75 questions · 180 minutes · USD 300 · pass 750/1000", url: "https://aws.amazon.com/certification/certified-devops-engineer-professional/" },
    ],
    steps: [
      { title: "Set up safely", weeks: "Week 1", learn: ["Create an AWS account; turn on MFA for the root user", "IAM Identity Center or an IAM admin user for daily work", "AWS Budgets alerts and the Free Tier limits", "Regions, Availability Zones and edge locations"], practice: "Set a USD 5 budget alert and log in with a non-root user.", checkpoint: "You never use the root user again after this step." },
      { title: "Cloud Practitioner (CLF-C02)", weeks: "Weeks 2–4", learn: ["Cloud concepts and the shared responsibility model", "Core services: EC2, S3, RDS, DynamoDB, Lambda, VPC, CloudFront, Route 53", "Security: IAM, KMS, Shield, WAF, GuardDuty", "Billing: pricing models, Savings Plans, Cost Explorer, support plans"], practice: "Host a static website on S3 behind CloudFront.", checkpoint: "Practice exams above 80%, then book CLF-C02." },
      { title: "AI Practitioner (AIF-C01), optional but in demand", weeks: "Weeks 5–7", learn: ["AI, ML and generative AI fundamentals", "Amazon Bedrock, SageMaker AI, Amazon Q", "Prompt engineering, RAG, fine-tuning vs in-context learning", "Responsible AI, security and governance"], practice: "Build a small Bedrock chat with a knowledge base over your own PDFs.", checkpoint: "You can say when to use RAG and when to fine-tune." },
      { title: "Solutions Architect – Associate (SAA-C03)", weeks: "Weeks 8–15", learn: ["VPC in depth: subnets, route tables, NAT, security groups vs NACLs, endpoints", "Compute: EC2 families, Auto Scaling, ELB, ECS/EKS, Lambda", "Storage: S3 classes and lifecycle, EBS, EFS, FSx", "Databases: RDS, Aurora, DynamoDB, ElastiCache", "Decoupling: SQS, SNS, EventBridge, Step Functions", "Resilience, high availability and disaster recovery strategies"], practice: "Build a three-tier app (ALB → Auto Scaling EC2 → RDS Multi-AZ) and tear it down.", checkpoint: "Two full practice exams above 80% with time to spare." },
      { title: "Choose your Associate specialisation", weeks: "Weeks 16–22", learn: ["Developer (DVA-C02): Lambda, API Gateway, DynamoDB, SDKs, CI/CD with CodePipeline, X-Ray", "ML Engineer (MLA-C01): SageMaker data prep, training, deployment and monitoring", "Data Engineer (DEA-C01): Glue, Athena, Redshift, Kinesis, Lake Formation"], practice: "Ship one serverless API, ML endpoint or data pipeline matching the exam you chose.", checkpoint: "Your project is in a public repository with an architecture diagram." },
      { title: "Professional level", weeks: "Weeks 23–34", learn: ["SAP-C02: multi-account (Organizations, Control Tower), hybrid networking, migrations, cost optimisation", "DOP-C02: infrastructure as code (CloudFormation, CDK), deployment strategies, monitoring and incident response", "Reading long scenario questions quickly"], practice: "Design a multi-account landing zone or a blue/green pipeline end to end.", checkpoint: "Practice exams above 75% with the 180-minute time box." },
      { title: "Book, pass and keep it current", weeks: "Exam week", learn: ["Online proctoring vs a test centre", "Non-native English speakers can request +30 minutes (ESL accommodation) before booking", "Certificates are valid for 3 years; recertify by passing the current version", "Passing an exam gives a 50% voucher for the next one"], practice: "Request the ESL accommodation if it applies, then book the exam.", checkpoint: "Badge claimed on Credly and added to your résumé." },
    ],
    examTips: ["Read the last line of the question first: it tells you whether they want cheapest, fastest or most resilient.", "Eliminate two answers, then compare the remaining two on the exact requirement.", "Flag and move on; unanswered questions score zero and there is no penalty for guessing."],
  },
  {
    id: "n8n", title: "n8n automation",
    tagline: "Automate real work with n8n: triggers, nodes, expressions, error handling and AI agent workflows, self-hosted or in the cloud.",
    who: "Developers, analysts and founders who want to automate workflows and build AI agents without a large codebase.",
    duration: "4 to 5 weeks at 4 hours a week",
    certificates: [
      { name: "n8n Course Level 1", provider: "n8n", level: "Course certificate", format: "Free official text course · badge after the final knowledge check", url: "https://docs.n8n.io/courses/level-one/" },
      { name: "n8n Course Level 2", provider: "n8n", level: "Course certificate", format: "Free official text course · badge after the final knowledge check", url: "https://docs.n8n.io/courses/level-two/" },
    ],
    steps: [
      { title: "Run n8n", weeks: "Week 1", learn: ["n8n Cloud trial vs self-hosting", "Run locally with `npx n8n` or Docker", "The editor: canvas, nodes, connections, executions", "Credentials and how n8n stores them"], practice: "Run n8n in Docker with a persistent volume.", checkpoint: "Your workflows survive a container restart." },
      { title: "Triggers and nodes", weeks: "Week 1", learn: ["Manual, Schedule, Webhook and app triggers", "Core nodes: HTTP Request, Edit Fields (Set), IF, Switch, Merge", "Pinning data to test without re-running", "Activating a workflow for production"], practice: "Build a scheduled workflow that fetches an API and posts a summary to Slack or email.", checkpoint: "It runs on schedule without you opening the editor." },
      { title: "Data, items and expressions", weeks: "Week 2", learn: ["How n8n passes data: items as JSON", "Expressions with `{{ $json }}` and referencing earlier nodes", "Looping, batching and splitting items", "The Code node (JavaScript or Python) for what nodes cannot do"], practice: "Transform a CSV of orders into per-customer totals.", checkpoint: "You can reference a field from any earlier node with an expression." },
      { title: "Level 1 course", weeks: "Week 2", learn: ["Work through n8n Course Level 1 on the docs site", "Build its sample business workflow", "Take the final check to earn the badge"], practice: "Complete every exercise in the course.", checkpoint: "Level 1 badge earned." },
      { title: "Reliable workflows", weeks: "Week 3", learn: ["Error workflows and the Error Trigger", "Retry on fail, continue on fail, timeouts", "Sub-workflows with Execute Workflow", "Webhooks with authentication and responses"], practice: "Add an error workflow that alerts you when any production workflow fails.", checkpoint: "A forced failure sends you an alert with the failing node." },
      { title: "AI agents in n8n", weeks: "Week 4", learn: ["The AI Agent node with a chat model", "Memory for conversations", "Tools: HTTP, other workflows, vector stores", "RAG: load documents, embed, store and retrieve"], practice: "Build a support agent that answers from your own documents and can create a ticket.", checkpoint: "The agent answers from documents and calls the ticket tool only when needed." },
      { title: "Level 2 course and production", weeks: "Week 5", learn: ["n8n Course Level 2: data structures, merging, error handling, automating a business process", "Self-hosting for production: environment variables, PostgreSQL, queue mode with workers", "Version control and environments"], practice: "Finish Level 2 and deploy one workflow to a production instance.", checkpoint: "Level 2 badge earned and a workflow running in production." },
    ],
    examTips: ["n8n's badges come from its official courses; check the course pages for the current process.", "Export your best workflows as JSON into a portfolio repository.", "Describe each automation by the hours it saves; that is what clients and employers ask about."],
  },
  {
    id: "agentic-ai", title: "Agentic AI",
    tagline: "How AI agents plan, use tools, remember and check their own work, with the certificates that prove you can build them.",
    who: "Developers and ML engineers moving from chat apps to autonomous, tool-using agents.",
    duration: "8 to 10 weeks at 5 to 6 hours a week",
    certificates: [
      { name: "Hugging Face AI Agents Course", provider: "Hugging Face", level: "Course certificate", format: "Free · fundamentals certificate and a completion certificate for the final assignment", url: "https://huggingface.co/learn/agents-course" },
      { name: "Agentic AI", provider: "DeepLearning.AI (Andrew Ng)", level: "Course certificate", format: "Self-paced course · certificate of completion", url: "https://www.deeplearning.ai/courses/agentic-ai/" },
      { name: "NVIDIA-Certified Professional: Agentic AI", provider: "NVIDIA", code: "NCP-AAI", level: "Professional", format: "Proctored exam · scenario questions on building, evaluating and deploying agents", url: "https://www.nvidia.com/en-us/learn/certification/" },
      { name: "AWS Certified Generative AI Developer – Professional", provider: "Amazon Web Services", level: "Professional", format: "Proctored exam on Bedrock, RAG, agents and guardrails", url: "https://aws.amazon.com/certification/", note: "Newer exam; check the page for the current code and format." },
    ],
    steps: [
      { title: "LLM foundations", weeks: "Week 1", learn: ["Tokens, context windows, temperature", "Chat messages and system prompts", "Structured output with JSON schemas", "Prompting: instructions, examples, chain of thought"], practice: "Get a model to return valid JSON for 20 different inputs.", checkpoint: "You can explain why a model's output changes between runs and how to constrain it." },
      { title: "Tool calling", weeks: "Week 2", learn: ["Describing a tool with a name, description and schema", "The loop: model asks for a tool, you run it, you return the result", "Parallel tool calls and errors", "Model Context Protocol as a standard way to expose tools"], practice: "Write a tool-calling loop by hand, without a framework, for a weather and a calculator tool.", checkpoint: "You understand exactly what a framework's agent loop does for you." },
      { title: "Agent patterns", weeks: "Weeks 3–4", learn: ["The four agentic design patterns: reflection, tool use, planning, multi-agent collaboration", "ReAct (reason + act) and plan-and-execute", "Workflows (fixed steps) vs agents (model decides the steps)", "Routing, parallelisation, orchestrator–workers, evaluator–optimiser"], practice: "Build a research agent that plans, searches and then critiques its own report.", checkpoint: "You can say when a fixed workflow beats an agent." },
      { title: "Memory and retrieval", weeks: "Week 5", learn: ["Short-term (conversation) vs long-term memory", "RAG: chunking, embeddings, vector search, re-ranking", "Agentic RAG: the agent decides when and what to retrieve", "Context engineering: what goes in the window and what stays out"], practice: "Give your agent long-term memory of user preferences across sessions.", checkpoint: "The agent remembers a preference after a restart." },
      { title: "Multi-agent systems", weeks: "Week 6", learn: ["Supervisor and hierarchical teams", "Handoffs between specialised agents", "Shared vs private state", "Frameworks: LangGraph, smolagents, CrewAI, AutoGen, the Claude Agent SDK"], practice: "Split your research agent into a planner, a researcher and a writer.", checkpoint: "Each agent has one job and the supervisor routes correctly." },
      { title: "Evaluation, safety and guardrails", weeks: "Week 7", learn: ["Tracing every step of a run", "Datasets, LLM-as-judge and task-success metrics", "Prompt injection, tool permissions, human-in-the-loop approval", "Cost and latency budgets"], practice: "Build a 25-case evaluation set and measure your agent before and after a change.", checkpoint: "You can prove a change made the agent better, not just different." },
      { title: "Deploy and certify", weeks: "Weeks 8–10", learn: ["Serving an agent behind an API with streaming", "Durable execution for long-running agents", "Finish the Hugging Face course and the DeepLearning.AI course", "Prepare for NCP-AAI or the AWS Generative AI Developer exam with their official guides"], practice: "Deploy your agent with a public demo and a README describing its evaluation.", checkpoint: "Course certificates earned and one proctored exam booked." },
    ],
    examTips: ["Vendor exams test their own stack: study NVIDIA NIM/NeMo for NCP-AAI and Bedrock Agents for AWS.", "Keep an evaluation table in your project README; it is the strongest proof of skill.", "Agentic AI certificates are new and change often; confirm the current format on the provider page before booking."],
  },
  {
    id: "langchain-python", title: "Agentic AI with Python: LangChain, LangGraph, LangSmith and LangFlow",
    tagline: "Build, trace, evaluate and ship Python agents with the LangChain ecosystem, and prototype them visually in LangFlow.",
    who: "Python developers who want production agent skills on the most widely used open-source stack.",
    duration: "8 to 10 weeks at 6 hours a week",
    source: "Written from the official LangChain documentation (docs.langchain.com).",
    certificates: [
      { name: "LangChain Academy courses (LangChain, LangGraph, LangSmith)", provider: "LangChain", level: "Course certificate", format: "Free self-paced courses with notebooks and videos", url: "https://academy.langchain.com/" },
      { name: "Langflow", provider: "Langflow (open source)", level: "Course certificate", format: "No formal certification yet; learn from the official docs and tutorials and show a published flow", url: "https://docs.langflow.org/" },
    ],
    steps: [
      { title: "Python setup for AI work", weeks: "Week 1", learn: ["Python 3.10+, a virtual environment (venv or uv)", "Environment variables and API keys in a .env file", "`pip install langchain` plus a provider package (for example langchain-anthropic or langchain-openai)", "Async basics with asyncio"], practice: "Call a chat model from a script and print the response.", checkpoint: "Keys are loaded from the environment, never hard-coded." },
      { title: "LangChain building blocks", weeks: "Week 2", learn: ["Chat models and messages (system, human, AI, tool)", "Prompt templates", "Structured output with Pydantic models", "Streaming tokens"], practice: "Extract name, company and intent from 10 emails into Pydantic objects.", checkpoint: "Every result validates against your schema." },
      { title: "Agents with create_agent", weeks: "Week 3", learn: ["Defining tools with the @tool decorator", "`create_agent(model, tools, system_prompt)`: the agent loop LangChain gives you", "Middleware to shape behaviour: summarisation, human-in-the-loop, guardrails", "Short-term memory with a checkpointer and thread IDs"], practice: "Build a travel agent with flight-search and weather tools.", checkpoint: "The agent calls tools in the right order and remembers the conversation per thread." },
      { title: "Retrieval-augmented generation", weeks: "Week 4", learn: ["Document loaders and text splitters", "Embeddings and vector stores", "Retrievers as tools for an agent", "Citing sources in the answer"], practice: "Build a Q&A agent over a folder of PDFs that cites the page it used.", checkpoint: "Answers cite real pages, and questions outside the documents get an honest 'I don't know'." },
      { title: "LangGraph: control the flow", weeks: "Weeks 5–6", learn: ["StateGraph, state schemas and reducers", "Nodes, edges and conditional edges; loops", "Persistence with checkpointers; resuming a thread", "Interrupts for human approval", "Multi-agent: supervisor and handoffs; subgraphs", "Deep Agents for planning, a virtual filesystem and subagents"], practice: "Rebuild your RAG agent as a graph with a grading step that retries retrieval when results are poor.", checkpoint: "You can draw your graph and point to where state is saved." },
      { title: "LangSmith: trace and evaluate", weeks: "Week 7", learn: ["Turn on tracing with LANGSMITH_TRACING and LANGSMITH_API_KEY", "Reading a trace: prompts, tool calls, latency and tokens", "Datasets, evaluators and experiments", "Prompt versioning and LangSmith Studio for local debugging"], practice: "Create a 20-example dataset and run an experiment comparing two prompts.", checkpoint: "You can show a score that improved because of a change." },
      { title: "Deploy", weeks: "Week 8", learn: ["langgraph.json and the LangGraph CLI (`langgraph dev`)", "Agent Server and LangSmith Deployment", "Calling a deployed agent from a web app with streaming", "Monitoring cost, latency and errors in production"], practice: "Run your agent with the CLI, open it in Studio, then deploy it.", checkpoint: "A public URL streams answers from your agent." },
      { title: "LangFlow: build visually", weeks: "Week 9", learn: ["Install Langflow (`uv pip install langflow`, then `langflow run`)", "Components, flows and the Playground", "Agents, tools and vector stores on the canvas", "Calling a flow through its API or exporting it"], practice: "Recreate your RAG agent in Langflow and call it from Python through its API.", checkpoint: "The same questions get comparable answers from both versions." },
      { title: "Capstone and certificates", weeks: "Week 10", learn: ["Finish the LangChain Academy courses for LangGraph and LangSmith", "Write a README with the architecture diagram, evaluation results and a demo link"], practice: "Ship one capstone: a multi-step agent with RAG, human approval, tracing and an evaluation set.", checkpoint: "Academy courses complete and a capstone you can demo in an interview." },
    ],
    examTips: ["LangChain moves fast: always check docs.langchain.com for the current API before copying older tutorials.", "Interviewers ask about LangGraph state, checkpointers and interrupts more than about chains.", "Show LangSmith traces and an evaluation table in your portfolio; they prove you can debug an agent."],
  },
];

export const certificationTrack = (id: string) => CERTIFICATION_TRACKS.find(track => track.id === id);
