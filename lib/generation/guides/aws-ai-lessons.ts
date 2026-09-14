import type { Lesson } from "@/lib/domain";

/**
 * The AI half of the AWS guide: generative AI (Amazon Bedrock, AgentCore,
 * SageMaker AI and the current status of Amazon Q) and the task-specific AI
 * services (Rekognition, Textract, Transcribe, Polly, Translate, Comprehend,
 * Lex, Personalize, Kendra, and Forecast's migration path to SageMaker Canvas).
 *
 * Service availability changes faster here than anywhere else in AWS, so each
 * lesson states the status facts learners will otherwise get wrong: Amazon
 * Forecast closed to new customers on 29 July 2024, and Amazon Q Developer
 * stops accepting new sign-ups on 15 May 2026 with IDE plugin support ending
 * 30 April 2027, with Kiro as the path forward.
 */
export const AWS_AI_LESSONS: Lesson[] = [
  {
    title: "Generative AI on AWS: Bedrock, AgentCore and SageMaker AI",
    diagram: {
      kind: "tree",
      caption: "Three layers of the AWS AI stack. Most applications live at the top: call a model through Bedrock, ground it with your data, guard it, and only drop down a layer when you need to train or host a model yourself.",
      items: [
        { label: "Use a model (most applications)" },
        { label: "Amazon Bedrock", detail: "one API over Anthropic, Amazon Nova, Meta, Mistral and others", depth: 1 },
        { label: "Knowledge Bases", detail: "managed retrieval-augmented generation over your data", depth: 2 },
        { label: "Guardrails", detail: "content filters, denied topics, PII redaction, grounding checks", depth: 2 },
        { label: "Prompt management and Flows", detail: "versioned prompts and orchestrated steps", depth: 2 },
        { label: "Run an agent" },
        { label: "Bedrock AgentCore", detail: "Runtime, Memory, Gateway, Identity, Policy, Observability, Evaluations", depth: 1 },
        { label: "Build or host a model" },
        { label: "Amazon SageMaker AI", detail: "notebooks, training jobs, endpoints, pipelines, model registry", depth: 1 },
        { label: "SageMaker Canvas", detail: "no-code models, including the Amazon Forecast migration path", depth: 2 },
      ],
    },
    explanation: "- Amazon Bedrock is a managed service exposing foundation models from several providers — Anthropic's Claude, Amazon Nova, Meta Llama, Mistral and others — behind one API, with no infrastructure to run\n- The two core operations are `Converse` (a provider-independent message API with tool use) and `InvokeModel` (provider-native request bodies); `ConverseStream` and `InvokeModelWithResponseStream` stream tokens as they are generated\n- Because Converse normalises messages, system prompts and tool definitions, switching models is usually a model id change rather than a rewrite\n- Knowledge Bases provide managed retrieval-augmented generation: point it at a data source, choose a vector store (OpenSearch Serverless, Aurora PostgreSQL with pgvector, and others), and it handles chunking, embedding and retrieval, returning citations with the answer\n- Guardrails apply independently of the model: content filters by category and strength, denied topics, word filters, PII detection with masking or blocking, and contextual grounding checks that catch answers unsupported by the retrieved source\n- Apply guardrails to input and output, and remember they are a policy layer, not a substitute for least-privilege tool design in an agent\n- Bedrock AgentCore is the platform for running agents at scale: Runtime (session-isolated serverless hosting for any framework), Memory (short and long term), Gateway (turns APIs and Lambda functions into MCP tools), Identity, Browser and Code Interpreter sandboxes, Policy (rules in Cedar), Observability (OpenTelemetry-compatible), Evaluations and Registry\n- AgentCore works with open-source frameworks — LangGraph, CrewAI, LlamaIndex, Strands Agents — and with models inside or outside Bedrock, so it is an operating platform rather than a framework lock-in\n- Amazon SageMaker AI is the layer below: managed notebooks, training jobs on GPU fleets, hyperparameter tuning, a model registry, batch transform, and real-time or serverless inference endpoints with autoscaling\n- Reach for SageMaker when you are fine-tuning, training a custom model, or need an endpoint you control; reach for Bedrock when a hosted foundation model with your data is enough, which covers most product work\n- SageMaker Canvas is the no-code path for tabular and time-series models, and is the migration target AWS recommends for Amazon Forecast\n- Status to plan around: Amazon Q Developer stops accepting new sign-ups on 15 May 2026 and its IDE plugins reach end of support on 30 April 2027, with Kiro — an agentic IDE and CLI for spec-driven development — as the successor. Amazon Q in the AWS console, in first-party AWS experiences and in Slack and Teams is not affected\n- Cost control matters as much as capability: choose the smallest model that passes your evaluations, cache prompts where supported, batch what is not interactive, and watch tokens per request as a first-class metric",
    keyPoints: [
      { tone: "key", title: "Converse makes models swappable", text: "One message shape across providers means you can evaluate a cheaper model against your own tasks and switch by changing an id rather than rewriting call sites." },
      { tone: "key", title: "Knowledge Bases are RAG without the plumbing", text: "Chunking, embedding, vector storage and retrieval are managed, and answers come back with citations — which is what makes them checkable." },
      { tone: "key", title: "Guardrails are model-independent policy", text: "Filters, denied topics, PII handling and grounding checks apply to input and output regardless of which model produced them." },
      { tone: "key", title: "Bedrock for using models, SageMaker for building them", text: "If you are not training or hosting a model, SageMaker is usually more machinery than the problem needs." },
      { tone: "tip", title: "Check model-access prerequisites", text: "Model access is enabled by default with the required Marketplace permissions. Check IAM, provider prerequisites and regional availability when an invocation is denied." },
      { tone: "tip", title: "AgentCore Gateway converts what you already have", text: "Existing REST APIs and Lambda functions become MCP tools without new tool servers, which is usually the fastest route to a useful agent." },
      { tone: "tip", title: "Measure tokens per request like latency", text: "Token count is the cost driver and the context-pressure driver at once; treat it as a first-class operational metric." },
      { tone: "warning", title: "Do not plan new work around Amazon Q Developer", text: "New sign-ups end 15 May 2026 and IDE plugin support ends 30 April 2027; Kiro is the stated path forward." },
      { tone: "warning", title: "Contextual grounding is not a correctness proof", text: "It checks that an answer is supported by retrieved context. If the retrieval was wrong, a well-grounded answer can still be wrong." },
    ],
    example: "- One Converse call answers with Claude today and a cheaper model tomorrow, by changing the model id\n- A Knowledge Base over a documentation bucket answers with citations pointing at the source files\n- A guardrail redacts phone numbers from model output before it reaches a support agent's screen\n- AgentCore Gateway exposes an existing orders Lambda function as an MCP tool in minutes\n- A SageMaker endpoint hosts a fine-tuned classifier that Bedrock does not offer",
    code: "// bedrock.ts — the provider-independent Converse API, with tool use.\nimport { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';\n\nconst client = new BedrockRuntimeClient({ region: 'ap-south-1' });\n\nexport async function answer(question: string) {\n  const response = await client.send(new ConverseCommand({\n    modelId: 'anthropic.claude-sonnet-5-v1:0',     // swap the id, keep the call site\n    system: [{ text: 'Answer only from the provided context. If it is not there, say so.' }],\n    messages: [{ role: 'user', content: [{ text: question }] }],\n    inferenceConfig: { maxTokens: 1024, temperature: 0.2 },\n    toolConfig: {\n      tools: [{\n        toolSpec: {\n          name: 'orders_search',\n          description: 'Search orders for one customer. Returns up to 20 id and summary pairs.',\n          inputSchema: { json: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] } },\n        },\n      }],\n    },\n    guardrailConfig: { guardrailIdentifier: 'gr-support', guardrailVersion: '3' },  // applied to input and output\n  }));\n\n  // usage is the cost signal: track it like latency.\n  console.log({ in: response.usage?.inputTokens, out: response.usage?.outputTokens, stop: response.stopReason });\n  return response.output?.message;\n}\n\n// knowledge-base.ts — managed RAG: retrieval, generation and citations in one call.\nimport { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';\n\nconst agents = new BedrockAgentRuntimeClient({ region: 'ap-south-1' });\n\nexport async function askDocs(question: string) {\n  const result = await agents.send(new RetrieveAndGenerateCommand({\n    input: { text: question },\n    retrieveAndGenerateConfiguration: {\n      type: 'KNOWLEDGE_BASE',\n      knowledgeBaseConfiguration: {\n        knowledgeBaseId: 'KB1234567',\n        modelArn: 'arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-sonnet-5-v1:0',\n        retrievalConfiguration: { vectorSearchConfiguration: { numberOfResults: 6 } },\n      },\n    },\n  }));\n  return {\n    text: result.output?.text,\n    // Citations are the point: an answer you cannot trace is an answer you cannot check.\n    sources: result.citations?.flatMap(c => c.retrievedReferences?.map(r => r.location) ?? []),\n  };\n}\n\n# guardrail.json — policy that applies whichever model runs.\n{\n  \"name\": \"gr-support\",\n  \"contentPolicyConfig\": { \"filtersConfig\": [\n    { \"type\": \"PROMPT_ATTACK\", \"inputStrength\": \"HIGH\", \"outputStrength\": \"NONE\" },\n    { \"type\": \"VIOLENCE\", \"inputStrength\": \"MEDIUM\", \"outputStrength\": \"MEDIUM\" }\n  ]},\n  \"sensitiveInformationPolicyConfig\": { \"piiEntitiesConfig\": [\n    { \"type\": \"PHONE\", \"action\": \"ANONYMIZE\" },\n    { \"type\": \"CREDIT_DEBIT_CARD_NUMBER\", \"action\": \"BLOCK\" }\n  ]},\n  \"topicPolicyConfig\": { \"topicsConfig\": [\n    { \"name\": \"legal-advice\", \"type\": \"DENY\", \"definition\": \"Interpreting contracts or advising on legal obligations.\" }\n  ]},\n  \"contextualGroundingPolicyConfig\": { \"filtersConfig\": [\n    { \"type\": \"GROUNDING\", \"threshold\": 0.75 }, { \"type\": \"RELEVANCE\", \"threshold\": 0.5 }\n  ]}\n}",
    apiReference: [
      {
        name: "Converse",
        kind: "Bedrock API",
        signature: "Converse({ modelId, system[], messages[], inferenceConfig, toolConfig, guardrailConfig }) → { output, stopReason, usage }",
        params: [
          { name: "modelId", type: "string", description: "Foundation model or inference profile identifier." },
          { name: "toolConfig", type: "object", description: "Tool specs with JSON schemas; the model may return toolUse blocks." },
          { name: "guardrailConfig", type: "object", description: "Guardrail identifier and version applied to input and output." },
          { name: "usage", type: "object", description: "inputTokens and outputTokens — the cost signal to record." },
        ],
        returns: "A normalised message plus stop reason and token usage.",
        notes: "ConverseStream returns the same shape as a token stream; InvokeModel remains for provider-native bodies.",
      },
      {
        name: "RetrieveAndGenerate",
        kind: "Bedrock Agent Runtime API",
        signature: "RetrieveAndGenerate({ input, retrieveAndGenerateConfiguration: { type: 'KNOWLEDGE_BASE', knowledgeBaseConfiguration } }) → { output, citations }",
        params: [
          { name: "knowledgeBaseId", type: "string", description: "The managed knowledge base to retrieve from." },
          { name: "numberOfResults", type: "number", description: "How many chunks to retrieve before generating." },
          { name: "citations", type: "array", description: "Source locations for each part of the answer." },
        ],
        returns: "A grounded answer with traceable sources.",
      },
      {
        name: "AgentCore services",
        kind: "platform",
        signature: "Runtime · Memory · Gateway · Identity · Browser · Code Interpreter · Observability · Policy · Evaluations · Registry",
        params: [
          { name: "Runtime", type: "service", description: "Session-isolated serverless hosting for agents from any framework." },
          { name: "Gateway", type: "service", description: "Turns APIs and Lambda functions into MCP-compatible tools." },
          { name: "Policy", type: "service", description: "Intercepts tool calls and enforces Cedar or natural-language rules." },
        ],
        returns: "Modular services usable independently or together.",
      },
    ],
    vocabulary: [
      { word: "Foundation model", meaning: "A large pre-trained model served through an API rather than trained by you.", example: "Claude or Amazon Nova on Bedrock.", synonyms: ["base model", "pre-trained model", "hosted model", "general-purpose model", "provider-hosted model", "shared model"], antonyms: ["fine-tuned model", "custom-trained model", "bespoke model", "task-specific model", "trained in-house", "narrow classifier"] },
      { word: "Knowledge Base", meaning: "Bedrock's managed retrieval-augmented generation over your own data.", example: "Answering from a documentation bucket with citations.", synonyms: ["managed RAG", "grounded retrieval", "vector-backed corpus", "managed retrieval", "document index", "grounding source"], antonyms: ["raw prompting", "ungrounded generation", "model memory", "prompt stuffing", "unsourced answer"] },
      { word: "Guardrail", meaning: "A model-independent policy applied to input and output.", example: "Redacting phone numbers and denying legal advice.", synonyms: ["safety policy", "content filter", "output policy", "policy filter", "safety boundary", "input/output check"], antonyms: ["unfiltered output", "raw model access", "direct model call", "unrestricted output", "no filtering"] },
      { word: "Contextual grounding", meaning: "A check that an answer is supported by the retrieved context.", example: "Rejecting a claim absent from the sources.", synonyms: ["groundedness check", "support verification", "source-support check", "faithfulness test", "evidence check"], antonyms: ["hallucinated claim", "unsupported answer", "confident invention", "ungrounded claim", "unverified output"] },
      { word: "Inference endpoint", meaning: "A hosted model you call for predictions, with its own scaling.", example: "A SageMaker real-time endpoint behind autoscaling.", synonyms: ["model endpoint", "serving endpoint", "hosted inference", "prediction service", "deployed model", "scoring API"], antonyms: ["training job", "batch transform", "training run", "offline scoring", "notebook experiment"] },
      { word: "Model access", meaning: "The permissions and provider prerequisites governing whether an account can invoke an available Bedrock model.", example: "Completing the applicable provider use-case form and Marketplace prerequisites.", synonyms: ["model enablement", "provider opt-in", "region enablement", "provider subscription", "usage grant"], antonyms: ["denied access", "unrequested model", "access denied", "not enabled", "unavailable model"] },
    ],
    useCase: {
      scenario: "A support team wants answers drawn from 4,000 internal documentation pages. The first prototype pastes whole pages into a prompt, invents policies that do not exist, occasionally echoes a customer's phone number back into a ticket, and costs more per answer than a human reply.",
      example: "The documents move into a Bedrock Knowledge Base with a vector store, and answers come from RetrieveAndGenerate with citations, so every claim is traceable to a source file. A guardrail redacts PII, denies legal-advice topics and applies a contextual grounding threshold. The team evaluates three models through the Converse API on the same 40 real questions and picks the cheapest one that passes, tracking tokens per answer alongside latency.",
      usage: "Answers are grounded and checkable, personal data stops leaking into replies, and per-answer cost falls far enough to make the feature viable.",
    },
    exercise: "- Request model access in your region, then call Converse and record the token usage\n- Build a Knowledge Base over a folder of documents and inspect the citations it returns\n- Create a guardrail with a denied topic, PII masking and a grounding threshold, and try to break it\n- Evaluate two models on twenty of your own tasks and compare quality, latency and cost per answer",
    checkpoint: "- When is Bedrock the right layer, and when do you need SageMaker?\n- What do citations from a Knowledge Base let you do that a plain answer does not?\n- What is the current status of Amazon Q Developer, and what replaces it?",
    mistake: "- Check regional availability, IAM and Marketplace permissions, and provider prerequisites before invoking a model\n- Do not treat contextual grounding as proof of correctness; bad retrieval yields well-grounded errors\n- Do not start new work on Amazon Q Developer IDE plugins given the announced end of support",
    interview: [
      {
        question: "When would you use Amazon Bedrock rather than Amazon SageMaker AI?",
        definition: "Bedrock serves hosted foundation models through an API; SageMaker is the platform for building, training and hosting models yourself.",
        answer: "If the task is solved by prompting a strong general model over your own data — support answers, summarisation, extraction, classification, an assistant — Bedrock is the right layer: no infrastructure, several providers behind one Converse API, managed retrieval through Knowledge Bases and policy through Guardrails. SageMaker AI is the layer you drop to when you need to fine-tune or train a model, host a custom architecture, run batch inference over large datasets, or control the serving stack. Many systems use both: Bedrock for generative work and a SageMaker endpoint for a specialised classifier or ranker.",
        similar: [
          { question: "What does Converse give you over InvokeModel?", answer: "A normalised message, system prompt and tool-use shape across providers, so changing models does not mean rewriting request bodies." },
          { question: "Where does AgentCore fit?", answer: "It runs and governs agents — hosting, memory, tools via MCP, identity, policy, observability and evaluations — independently of which model you use." },
        ],
      },
      {
        question: "How do you keep a Bedrock-based feature safe and grounded?",
        definition: "Ground answers in retrieved data with citations, and apply guardrails to both input and output independently of the model.",
        answer: "Use a Knowledge Base so answers come from your own corpus and arrive with citations, which makes them checkable rather than plausible. Attach a guardrail carrying content filters, denied topics, PII detection with masking or blocking, and a contextual grounding threshold that rejects answers the retrieved context does not support. Apply it to input as well as output, since prompt-attack filtering happens on the way in. Then remember the limits: grounding checks support, not truth, so poor retrieval still produces confidently wrong answers, and anything the model can act on still needs least-privilege tool design.",
        similar: [
          { question: "Where do citations come from?", answer: "RetrieveAndGenerate returns retrievedReferences with source locations for the chunks that informed the answer." },
          { question: "Can guardrails be versioned?", answer: "Yes — guardrails have versions, so a policy change can be rolled out and rolled back like any other configuration." },
        ],
      },
    ],
    objectiveQuestions: [
      {
        question: "A first Bedrock call fails with AccessDeniedException although the IAM policy allows bedrock:InvokeModel. What is the most likely cause?",
        options: ["The model id is misspelled", "Required Marketplace permissions or provider prerequisites are missing", "Bedrock requires a VPC endpoint", "The request needs a guardrail attached"],
        correct: 1,
        shortAnswer: "Check Marketplace permissions and provider prerequisites",
        explanation: "Bedrock enables model access automatically with the required permissions. Initial subscription can fail if Marketplace permissions, payment setup or applicable provider prerequisites are missing. Also check organizational policies and regional availability; an access error does not prove that the invocation code is wrong.",
      },
      {
        question: "Which capability returns an answer together with the source passages it was based on?",
        options: ["InvokeModel with a long prompt", "Bedrock Knowledge Bases via RetrieveAndGenerate", "Bedrock Guardrails", "SageMaker batch transform"],
        correct: 1,
        shortAnswer: "Knowledge Bases via RetrieveAndGenerate",
        explanation: "RetrieveAndGenerate performs retrieval over the knowledge base, generates an answer from those chunks and returns citations with source locations, which is what makes the answer verifiable. Stuffing a prompt provides no provenance, guardrails apply policy rather than retrieval, and batch transform runs offline inference.",
      },
      {
        question: "What is the announced future of Amazon Q Developer?",
        options: ["It is being renamed Amazon Bedrock Developer", "New sign-ups end 15 May 2026 and IDE plugin support ends 30 April 2027, with Kiro as the successor", "It is now bundled free with every AWS account", "It has been merged into Amazon SageMaker Canvas"],
        correct: 1,
        shortAnswer: "New sign-ups end May 2026; IDE plugins end April 2027; Kiro succeeds it",
        explanation: "AWS has announced that Amazon Q Developer stops accepting new sign-ups on 15 May 2026, with IDE plugin and paid subscription support ending 30 April 2027, and points users to Kiro, an agentic IDE and CLI for spec-driven development. Amazon Q in the AWS console and in first-party experiences such as Slack and Teams is unaffected.",
      },
    ],
  },
  {
    title: "AI services for vision, documents, speech, language and personalisation",
    diagram: {
      kind: "tree",
      caption: "Task-specific AI services: each solves one well-defined problem behind an API call, and each is usually faster and cheaper than prompting a general model for the same job.",
      items: [
        { label: "Vision and documents" },
        { label: "Amazon Rekognition", detail: "objects, faces, moderation, text in images and video", depth: 1 },
        { label: "Amazon Textract", detail: "text, forms, tables and signatures from documents", depth: 1 },
        { label: "Speech" },
        { label: "Amazon Transcribe", detail: "speech to text, speakers, custom vocabulary, real time", depth: 1 },
        { label: "Amazon Polly", detail: "text to speech, neural voices, speech marks", depth: 1 },
        { label: "Language" },
        { label: "Amazon Comprehend", detail: "entities, sentiment, key phrases, PII, custom classification", depth: 1 },
        { label: "Amazon Translate", detail: "machine translation with custom terminology", depth: 1 },
        { label: "Amazon Lex", detail: "conversational bots: intents, slots, fulfilment", depth: 1 },
        { label: "Recommendation and search" },
        { label: "Amazon Personalize", detail: "recommendations from interaction history", depth: 1 },
      ],
    },
    explanation: "- These services solve narrow problems behind a single API call, with no model to train or host, and they are typically cheaper and lower-latency than asking a general model to do the same thing\n- Amazon Rekognition analyses images and video: labels, faces and face comparison, text in images, content moderation, and stored-video analysis through asynchronous jobs\n- Amazon Textract extracts text, key-value pairs from forms, tables and signatures from documents, returning a block structure with geometry and confidence scores for each element — the AnalyzeDocument API is what turns an invoice into data\n- Amazon Transcribe converts speech to text with speaker identification, custom vocabulary for domain terms, automatic language identification, and a streaming mode for live captions\n- Amazon Polly synthesises speech with neural voices and returns speech marks — word and sentence timings — which is how you highlight text in sync with playback\n- Amazon Comprehend finds entities, key phrases, sentiment, dominant language and PII in text, and supports custom classification and custom entity recognition trained on your own labelled examples\n- Amazon Translate performs machine translation between many language pairs, with custom terminology so product and brand names are translated the way you want, and active custom translation for adapting to your own parallel data\n- Amazon Lex builds conversational interfaces with intents, sample utterances, slots and Lambda fulfilment, and is the engine behind Amazon Connect's voice bots\n- Amazon Personalize produces recommendations from your interaction history — user-personalisation, similar-items and personalised ranking recipes — without building a recommender from scratch\n- Amazon Kendra provides natural-language enterprise search over connected repositories; for vector search over embeddings, OpenSearch Serverless is the usual choice and also backs Bedrock Knowledge Bases\n- Confidence scores are part of the contract: every extraction and detection returns one, and a production design routes low-confidence results to human review rather than accepting them silently\n- Availability status to know: Amazon Forecast has been closed to new customers since 29 July 2024, and AWS recommends Amazon SageMaker Canvas for time-series forecasting instead; existing Forecast customers can continue to use it\n- Choose deliberately between a task service and a general model: Textract beats prompting for structured extraction with geometry and confidence, while a general model is better when the task needs reasoning over the extracted content",
    keyPoints: [
      { tone: "key", title: "A task service usually beats a prompt", text: "For OCR, transcription, translation and entity detection, a purpose-built API is cheaper, faster and returns structure — geometry, timings, confidence — that a general model does not." },
      { tone: "key", title: "Confidence scores are the design surface", text: "Every result carries one. Deciding the threshold at which a document goes to a human is the difference between automation and silent errors." },
      { tone: "key", title: "Forecast is closed to new customers", text: "Since 29 July 2024 new accounts cannot adopt Amazon Forecast; SageMaker Canvas is the recommended path for time-series forecasting." },
      { tone: "key", title: "Combine services rather than replacing them", text: "Transcribe then Comprehend then Translate is a pipeline; each step is cheap, testable and replaceable on its own." },
      { tone: "tip", title: "Custom vocabulary and terminology are the cheap accuracy win", text: "Product names and domain jargon are where transcription and translation fail; both services let you supply them directly." },
      { tone: "tip", title: "Use asynchronous APIs for large inputs", text: "Multi-page documents and stored video use start/get job pairs with an SNS notification, not a synchronous call that will time out." },
      { tone: "tip", title: "Polly speech marks drive the UI", text: "Word-level timings let you highlight text as it is spoken, which is what makes a read-along feature possible." },
      { tone: "warning", title: "Face analysis carries legal obligations", text: "Biometric processing is regulated in many jurisdictions. Establish the legal basis, retention and consent before enabling it." },
      { tone: "warning", title: "Do not accept extraction output unchecked", text: "An invoice pipeline that ignores confidence will eventually pay the wrong amount. Route low-confidence fields to review." },
    ],
    example: "- Textract turns a scanned invoice into key-value pairs with confidence scores per field\n- Transcribe with a custom vocabulary stops mangling your product names in call recordings\n- Comprehend flags PII in support tickets before they reach a shared inbox\n- Translate with custom terminology keeps 'MasterClass' untranslated across twelve languages\n- Personalize ranks a catalogue per user from interaction history, with no model code",
    code: "// documents.ts — Textract: structure, geometry and confidence, not just text.\nimport { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';\n\nconst textract = new TextractClient({ region: 'ap-south-1' });\nconst REVIEW_THRESHOLD = 95;\n\nexport async function readInvoice(bytes: Uint8Array) {\n  const result = await textract.send(new AnalyzeDocumentCommand({\n    Document: { Bytes: bytes },\n    FeatureTypes: ['FORMS', 'TABLES'],             // key-value pairs and table cells\n  }));\n\n  const blocks = result.Blocks ?? [];\n  const fields = blocks\n    .filter(b => b.BlockType === 'KEY_VALUE_SET' && b.EntityTypes?.includes('KEY'))\n    .map(key => ({ key, confidence: key.Confidence ?? 0 }));\n\n  // The design decision that matters: what happens below the threshold.\n  const needsReview = fields.filter(f => f.confidence < REVIEW_THRESHOLD);\n  return { fields, needsReview, autoApproved: needsReview.length === 0 };\n}\n\n// speech.ts — Transcribe with domain terms, then Comprehend for PII, then Translate.\nimport { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';\nimport { ComprehendClient, DetectPiiEntitiesCommand } from '@aws-sdk/client-comprehend';\nimport { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';\n\nexport async function transcribeCall(s3Uri: string, jobName: string) {\n  await new TranscribeClient({}).send(new StartTranscriptionJobCommand({\n    TranscriptionJobName: jobName,\n    Media: { MediaFileUri: s3Uri },\n    IdentifyLanguage: true,\n    Settings: {\n      ShowSpeakerLabels: true, MaxSpeakerLabels: 4,\n      VocabularyName: 'product-names',             // where accuracy is actually won\n    },\n  }));                                             // asynchronous: poll or subscribe to the event\n}\n\nexport async function redactAndTranslate(text: string, target: string) {\n  const pii = await new ComprehendClient({}).send(new DetectPiiEntitiesCommand({ Text: text, LanguageCode: 'en' }));\n  let safe = text;\n  for (const entity of (pii.Entities ?? []).sort((a, b) => (b.BeginOffset ?? 0) - (a.BeginOffset ?? 0))) {\n    safe = safe.slice(0, entity.BeginOffset) + `[${entity.Type}]` + safe.slice(entity.EndOffset);\n  }\n  const translated = await new TranslateClient({}).send(new TranslateTextCommand({\n    Text: safe, SourceLanguageCode: 'en', TargetLanguageCode: target,\n    TerminologyNames: ['brand-terms'],              // keep product names intact\n  }));\n  return translated.TranslatedText;\n}\n\n# polly.sh — speech marks are what let the UI highlight words as they are spoken.\naws polly synthesize-speech --engine neural --voice-id Kajal --language-code en-IN \\\n  --output-format json --speech-mark-types word sentence --text \"Your order has shipped.\" marks.json\naws polly synthesize-speech --engine neural --voice-id Kajal --language-code en-IN \\\n  --output-format mp3 --text \"Your order has shipped.\" speech.mp3",
    apiReference: [
      {
        name: "AnalyzeDocument",
        kind: "Textract API",
        signature: "AnalyzeDocument({ Document, FeatureTypes: ['FORMS' | 'TABLES' | 'SIGNATURES' | 'LAYOUT'] }) → { Blocks[] }",
        params: [
          { name: "FeatureTypes", type: "string[]", description: "Which structures to extract beyond raw text." },
          { name: "Blocks", type: "array", description: "PAGE, LINE, WORD, KEY_VALUE_SET, TABLE, CELL, each with Geometry and Confidence." },
        ],
        returns: "A block graph with positions and confidence for every element.",
        notes: "Use StartDocumentAnalysis and GetDocumentAnalysis for multi-page or large documents.",
      },
      {
        name: "Task service selection",
        kind: "decision",
        signature: "Rekognition (images/video) · Textract (documents) · Transcribe (speech→text) · Polly (text→speech) · Comprehend (NLP) · Translate (MT) · Lex (bots) · Personalize (recommendations)",
        params: [
          { name: "Comprehend custom", type: "capability", description: "Custom classification and entity recognition trained on your labelled data." },
          { name: "Translate terminology", type: "capability", description: "Custom terminology files that pin brand and product names." },
          { name: "Personalize recipes", type: "capability", description: "User-personalisation, similar-items and personalised ranking." },
        ],
        returns: "A managed model for one task, with no training or hosting.",
        notes: "Amazon Forecast is closed to new customers since 29 July 2024; use SageMaker Canvas for forecasting.",
      },
      {
        name: "Confidence handling",
        kind: "pattern",
        signature: "result.Confidence >= threshold ? automate : route to human review",
        params: [
          { name: "threshold", type: "number", description: "Chosen per field and per business risk, not globally." },
          { name: "review queue", type: "workflow", description: "Where low-confidence items go — often Amazon A2I or an internal tool." },
        ],
        returns: "Automation whose error rate you have decided rather than inherited.",
      },
    ],
    vocabulary: [
      { word: "Confidence score", meaning: "The service's reported certainty for a detection or extraction.", example: "94.2 on an extracted invoice total.", synonyms: ["certainty score", "model confidence", "probability estimate", "reliability estimate", "extraction certainty", "detection score"], antonyms: ["ground truth", "verified value", "human verification", "known answer", "audited value"] },
      { word: "Custom vocabulary", meaning: "Domain terms supplied to a speech service to improve recognition.", example: "Product names in Transcribe.", synonyms: ["domain lexicon", "term list", "pronunciation hints", "custom word list", "boosted phrases", "domain terms"], antonyms: ["default model", "generic vocabulary", "generic recognition", "default lexicon", "untuned model"] },
      { word: "Speech marks", meaning: "Timing metadata describing when each word or sentence is spoken.", example: "Highlighting text in time with audio.", synonyms: ["timing metadata", "word timings", "word-level timings", "alignment data", "playback cues"], antonyms: ["plain audio", "untimed output", "audio only", "unaligned text", "no timings"] },
      { word: "Intent", meaning: "A goal a user expresses to a conversational bot, with slots to fill.", example: "OrderStatus with an order number slot.", synonyms: ["user goal", "action", "utterance target", "recognised request", "bot goal", "dialog action"], antonyms: ["fallback", "unrecognised input", "fallback intent", "unmatched utterance", "free-form chat"] },
      { word: "Custom terminology", meaning: "A translation glossary that pins how specific terms are rendered.", example: "Keeping a brand name untranslated.", synonyms: ["glossary", "term base", "translation memory", "translation glossary", "pinned terms", "do-not-translate list"], antonyms: ["raw machine translation", "default translation", "unconstrained output", "literal rendering", "inconsistent naming", "term drift"] },
      { word: "Human review loop", meaning: "Routing low-confidence results to a person before they are accepted.", example: "Invoices below 95% confidence going to a queue.", synonyms: ["human in the loop", "manual verification", "review queue", "verification queue", "exception handling", "manual check"], antonyms: ["blind automation", "unchecked extraction", "fully automatic acceptance", "no verification", "silent approval"] },
    ],
    useCase: {
      scenario: "A finance team processes 900 supplier invoices a month by hand, and a support team listens to call recordings to find complaints, translating a sample into English by hand.",
      example: "Invoices go through Textract with FORMS and TABLES; fields above 95% confidence post automatically and anything lower goes to a review queue with the extracted geometry highlighted. Call recordings run through Transcribe with a custom vocabulary of product names and speaker labels, then Comprehend redacts PII and scores sentiment, then Translate renders the flagged calls into English using a terminology file that leaves brand names intact.",
      usage: "Around four fifths of invoices post without a human touch and the rest arrive pre-filled, while complaint detection covers every call rather than a sample, with personal data removed before anyone reads it.",
    },
    exercise: "- Run Textract over one real document and record the confidence for each extracted field\n- Choose a review threshold per field based on what an error would cost, and build the queue\n- Transcribe an audio file with and without a custom vocabulary, and count the corrections avoided\n- Pipe a transcript through Comprehend for PII, then Translate with a custom terminology file",
    checkpoint: "- Why are confidence scores central to designing an extraction pipeline?\n- When is a task-specific service a better choice than prompting a general model?\n- What should a team building time-series forecasting on AWS use today, and why?",
    mistake: "- Do not build an extraction pipeline with no review path for low-confidence fields\n- Do not use synchronous APIs for long documents or stored video; use the asynchronous job pairs\n- Do not enable face analysis without establishing the legal basis and retention rules",
    interview: [
      {
        question: "When should you use a task-specific AI service instead of a foundation model?",
        definition: "When the task is narrow, well-defined and benefits from structured output such as geometry, timings or confidence.",
        answer: "For OCR and form extraction, transcription, translation, entity and PII detection, or image moderation, the purpose-built service is normally cheaper, faster and more predictable, and it returns structure a general model does not: bounding boxes, word timings, per-field confidence. That structure is what a production pipeline needs in order to decide what to automate and what to review. A foundation model earns its place when the task requires reasoning over the extracted content — summarising the document, deciding what to do about it, or answering a question that spans several sources — which is why the two are usually combined rather than chosen between.",
        similar: [
          { question: "How would you combine them?", answer: "Textract or Transcribe to get structured text, then a foundation model to reason over it, with the structured output kept for audit." },
          { question: "What about custom classification?", answer: "Comprehend supports custom classifiers and entity recognisers trained on your labelled data, which often beats prompting for a repetitive, well-defined label set." },
        ],
      },
      {
        question: "How do you design an invoice-processing pipeline that can be trusted?",
        definition: "Extract with confidence scores, decide a per-field threshold from the cost of an error, and route everything below it to human review.",
        answer: "Use Textract's FORMS and TABLES features so each field arrives with geometry and a confidence score, then set thresholds field by field: an amount or a bank account number deserves a stricter threshold than a supplier name. Above the threshold, post automatically; below it, queue the document for review with the extracted values pre-filled and the source region highlighted, which makes correction quick. Record both the automation rate and the correction rate so the thresholds can be tuned with evidence, and keep the raw extraction output for audit. The failure mode to design against is silent acceptance, where a low-confidence number becomes a payment.",
        similar: [
          { question: "What handles the review workflow?", answer: "Amazon A2I provides managed human review workflows, or an internal queue works just as well if it shows confidence and geometry." },
          { question: "How do you handle multi-page documents?", answer: "Use StartDocumentAnalysis and GetDocumentAnalysis with an SNS notification, rather than the synchronous API." },
        ],
      },
    ],
    objectiveQuestions: [
      {
        question: "Which service extracts key-value pairs and tables from a scanned document, with geometry and confidence per element?",
        options: ["Amazon Rekognition", "Amazon Textract", "Amazon Comprehend", "Amazon Kendra"],
        correct: 1,
        shortAnswer: "Amazon Textract",
        explanation: "Textract is the document service: its AnalyzeDocument API returns a block graph including KEY_VALUE_SET, TABLE and CELL blocks, each with a bounding box and a confidence score. Rekognition analyses images and video, Comprehend performs NLP over text, and Kendra provides natural-language search over connected repositories.",
      },
      {
        question: "A team wants to start time-series forecasting on AWS today. What should they use?",
        options: ["Amazon Forecast, which is generally available to all accounts", "Amazon SageMaker Canvas, since Forecast has been closed to new customers since July 2024", "Amazon Comprehend with a custom classifier", "Amazon Personalize"],
        correct: 1,
        shortAnswer: "SageMaker Canvas; Forecast is closed to new customers",
        explanation: "AWS closed Amazon Forecast to new customers on 29 July 2024 and recommends transitioning to SageMaker Canvas, which covers the same ensemble forecasting capability in a low-code interface. Existing Forecast customers may continue, but a new team cannot adopt it. Comprehend handles text and Personalize handles recommendations.",
      },
      {
        question: "What is the most important design decision when automating document extraction?",
        options: ["Which region to run in", "What happens to fields below the confidence threshold", "Whether to use JPEG or PNG", "How many pages to process per call"],
        correct: 1,
        shortAnswer: "The handling of low-confidence fields",
        explanation: "Extraction services always return a confidence score, and the pipeline's error rate is determined by what it does with low-confidence values. Routing them to human review with the values pre-filled is what makes automation safe; accepting them silently is how a wrong amount becomes a payment. Region, image format and batching are operational details by comparison.",
      },
    ],
  },
];
