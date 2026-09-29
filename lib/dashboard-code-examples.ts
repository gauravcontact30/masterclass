export type CodeLine = {
  lineNum: number;
  code: string;
  comment: {
    en: string;
    hi: string;
  };
};

export type CodeExample = {
  id: string;
  filename: string;
  language: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  lines: CodeLine[];
};

export const DASHBOARD_CODE_EXAMPLES: Record<string, CodeExample> = {
  // Main User Dashboard
  dashboard: {
    id: "dashboard",
    filename: "curriculumLoader.ts",
    language: "typescript",
    title: {
      en: "Curriculum Data Loader & Server Action",
      hi: "पाठ्यक्रम डेटा लोडर और सर्वर एक्शन"
    },
    description: {
      en: "Full-Stack Next.js 16 App Router server action loading bilingual curricula, verifying user tier, and returning sanitized study guides.",
      hi: "फुल-स्टैक Next.js 16 सर्वर एक्शन जो द्विभाषी पाठ्यक्रम लोड करता है, यूज़र टियर सत्यापित करता है और सुरक्षित गाइड प्रदान करता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `import { createServerClient } from "@supabase/ssr"; // Import Supabase SSR client factory for secure server-side database access`,
        comment: {
          en: "Imports createServerClient from Supabase SSR package to establish authenticated, cookie-backed database sessions on the server.",
          hi: "सर्वर पर सुरक्षित, कुकी-आधारित डेटाबेस सत्र स्थापित करने के लिए Supabase SSR पैकेज से createServerClient आयात करता है।"
        }
      },
      {
        lineNum: 2,
        code: `import { cookies } from "next/headers"; // Next.js asynchronous cookie store helper for reading session tokens`,
        comment: {
          en: "Next.js async cookie utility allowing the server action to securely read user authentication tokens without exposing them to the client.",
          hi: "Next.js एसिंक्रोनस कुकी उपयोगिता जो सर्वर एक्शन को क्लाइंट पर उजागर किए बिना यूज़र ऑथेंटिकेशन टोकन पढ़ने की अनुमति देती है।"
        }
      },
      {
        lineNum: 3,
        code: `import type { StudyCourse, UserAccount } from "@/lib/domain"; // Import strongly-typed domain interfaces for type safety`,
        comment: {
          en: "Imports TypeScript domain models ensuring rigorous compile-time type validation across courses and user tier accounts.",
          hi: "पाठ्यक्रमों और यूज़र खातों में कंपाइल-टाइम टाइप सुरक्षा सुनिश्चित करने के लिए TypeScript डोमेन मॉडल आयात करता है।"
        }
      },
      {
        lineNum: 4,
        code: `export async function loadUserCurriculum(targetCategory: string): Promise<StudyCourse[]> { // Export main async server function accepting category ID`,
        comment: {
          en: "Defines and exports an asynchronous Server Action that receives the requested subject category string and returns typed course arrays.",
          hi: "एक एसिंक्रोनस सर्वर एक्शन परिभाषित करता है जो विषय श्रेणी स्वीकार करता है और टाइप किए गए कोर्स ऐरे लौटाता है।"
        }
      },
      {
        lineNum: 5,
        code: `  const cookieStore = await cookies(); // Await Next.js 16 request cookies promise to access incoming session headers`,
        comment: {
          en: "Awaits the Next.js 16 cookies promise to retrieve HTTP-only authentication cookies sent by the learner's browser.",
          hi: "शिक्षार्थी के ब्राउज़र द्वारा भेजी गई HTTP-ओनली ऑथेंटिकेशन कुकीज़ प्राप्त करने के लिए Next.js 16 कुकी प्रॉमिस की प्रतीक्षा करता है।"
        }
      },
      {
        lineNum: 6,
        code: `  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll() } }); // Initialize authenticated Supabase client`,
        comment: {
          en: "Instantiates a scoped Supabase client configured with project environment variables and forward-passed request cookies.",
          hi: "प्रोजेक्ट पर्यावरण चरों और कुकीज़ के साथ कॉन्फ़िगर किए गए स्कोप्ड Supabase क्लाइंट का उदाहरण बनाता है।"
        }
      },
      {
        lineNum: 7,
        code: `  const { data: { user }, error: authErr } = await supabase.auth.getUser(); // Validate active JWT session against auth server`,
        comment: {
          en: "Verifies the cryptographic validity of the user's JWT with the Supabase Auth server to guarantee authorization.",
          hi: "अनधिकृत पहुंच रोकने के लिए Supabase ऑथ सर्वर के साथ यूज़र के JWT की क्रिप्टोग्राफ़िक वैधता की जांच करता है।"
        }
      },
      {
        lineNum: 8,
        code: `  if (authErr || !user) throw new Error("UNAUTHORIZED_ACCESS: Please sign in to view this curriculum"); // Guard against unauthenticated requests`,
        comment: {
          en: "Defensive guard clause throwing an explicit authentication error if the session token is missing, expired, or invalid.",
          hi: "सुरक्षा जांच जो सत्र टोकन गायब, समाप्त या अमान्य होने पर स्पष्ट प्रमाणीकरण त्रुटि देती है।"
        }
      },
      {
        lineNum: 9,
        code: `  const { data: courses, error } = await supabase.from("courses").select("*").eq("category", targetCategory).order("order_index", { ascending: true }); // Query database for active category courses`,
        comment: {
          en: "Queries PostgreSQL database table 'courses' matching the target category, sorted in ascending pedagogical sequence.",
          hi: "लक्षित श्रेणी से मेल खाने वाले और क्रमिक अध्ययन क्रम में व्यवस्थित कोर्स के लिए PostgreSQL डेटाबेस टेबल से डेटा लेता है।"
        }
      },
      {
        lineNum: 10,
        code: `  if (error) throw new Error(\`DATABASE_ERROR: Failed to load curriculum for \${targetCategory}: \${error.message}\`); // Handle DB query failures gracefully`,
        comment: {
          en: "Catches SQL query execution errors and throws a descriptive exception for structured client-side toast notifications.",
          hi: "डेटाबेस निष्पादन त्रुटियों को पकड़ता है और क्लाइंट-साइड सूचनाओं के लिए वर्णनात्मक अपवाद फेंकता है।"
        }
      },
      {
        lineNum: 11,
        code: `  return (courses as StudyCourse[]).filter(course => course.is_published === true); // Filter only verified published courses for learners`,
        comment: {
          en: "Casts the record array to StudyCourse and returns only courses verified with is_published set to true.",
          hi: "रिकॉर्ड ऐरे को StudyCourse में कास्ट करता है और केवल सत्यापित प्रकाशित पाठ्यक्रमों को शिक्षार्थियों के लिए लौटाता है।"
        }
      },
      {
        lineNum: 12,
        code: `} // End of loadUserCurriculum function`,
        comment: {
          en: "Concludes the server action execution lifecycle and delivers sanitized data to React Server Components.",
          hi: "सर्वर एक्शन निष्पादन चक्र समाप्त करता है और स्वच्छ डेटा को React सर्वर कंपोनेंट्स तक पहुंचाता है।"
        }
      }
    ]
  },

  // Search Page
  search: {
    id: "search",
    filename: "searchEngine.ts",
    language: "typescript",
    title: {
      en: "Grounded AI Search Query Dispatcher",
      hi: "सत्यापित एआई खोज डिस्पैचर"
    },
    description: {
      en: "Dual-mode search client routing questions to local verified vector embeddings or dynamic LLM generation with official source citations.",
      hi: "दोहरा खोज क्लाइंट जो प्रश्नों को स्थानीय सत्यापित वेक्टर एम्बेडिंग्स या आधिकारिक स्रोत संदर्भों वाले LLM पर रूट करता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type QueryRequest = { prompt: string; aiMode: boolean; preferredProvider?: "anthropic" | "perplexity" }; // Define typed search parameters`,
        comment: {
          en: "Defines the query payload schema requiring the user prompt, AI toggle state, and optional model provider selection.",
          hi: "यूज़र प्रॉम्प्ट, एआई टॉगल स्थिति और वैकल्पिक मॉडल प्रोवाइडर चयन की आवश्यकता वाले खोज पेलोड स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export async function executeGroundedSearch({ prompt, aiMode, preferredProvider = "anthropic" }: QueryRequest) { // Main query routing function`,
        comment: {
          en: "Primary search dispatcher function that checks the aiMode flag to decide between offline catalogue notes or live LLM synthesis.",
          hi: "मुख्य खोज डिस्पैचर फ़ंक्शन जो ऑफ़लाइन कैटलॉग नोट्स या लाइव LLM संश्लेषण के बीच निर्णय लेने के लिए aiMode फ़्लैग की जांच करता है।"
        }
      },
      {
        lineNum: 3,
        code: `  const normalizedPrompt = prompt.trim().toLowerCase(); // Sanitize input string by removing whitespace and normalizing casing`,
        comment: {
          en: "Sanitizes user input to prevent cache misses on minor casing variations and whitespace differences.",
          hi: "केसिंग और रिक्त स्थान के अंतर पर कैश मिस रोकने के लिए यूज़र इनपुट को साफ़ और सामान्य करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  if (!aiMode) { // Branch into verified offline repository search when AI Mode is switched off`,
        comment: {
          en: "Executes when AI Mode is off, ensuring responses are pulled strictly from the verified local repository notes catalog.",
          hi: "एआई मोड बंद होने पर निष्पादित होता है, यह सुनिश्चित करता है कि उत्तर केवल स्थानीय सत्यापित नोट्स कैटलॉग से लिए जाएं।"
        }
      },
      {
        lineNum: 5,
        code: `    const localMatch = await findOfflineNotesByKeywords(normalizedPrompt); // Query high-speed in-memory token trie and index`,
        comment: {
          en: "Scans indexed technology handbooks, AWS highlights, and glossary terms using fast deterministic keyword matching.",
          hi: "तेज कीवर्ड मिलान का उपयोग करके अनुक्रमित प्रौद्योगिकी हैंडबुक, AWS हाइलाइट्स और शब्दावली की खोज करता है।"
        }
      },
      {
        lineNum: 6,
        code: `    return { answer: localMatch.content, source: "verified_notes", citations: localMatch.officialLinks, latencyMs: 12 }; // Return instant verified note`,
        comment: {
          en: "Returns the author-verified curriculum content with zero model latency and direct official documentation links.",
          hi: "बिना किसी मॉडल विलंबता और सीधे आधिकारिक दस्तावेज़ीकरण लिंक के साथ लेखक-सत्यापित पाठ्यक्रम सामग्री लौटाता है।"
        }
      },
      {
        lineNum: 7,
        code: `  } // End of offline search branch`,
        comment: {
          en: "Closes the deterministic offline search branch to transition to AI model synthesis.",
          hi: "एआई मॉडल संश्लेषण पर आगे बढ़ने के लिए ऑफ़लाइन खोज शाखा को समाप्त करता है।"
        }
      },
      {
        lineNum: 8,
        code: `  const modelEndpoint = preferredProvider === "perplexity" ? "/api/search/perplexity" : "/api/search/anthropic"; // Select optimal AI endpoint`,
        comment: {
          en: "Resolves the appropriate backend route based on whether live web grounding (Perplexity) or architectural depth (Claude) was chosen.",
          hi: "लाइव वेब रिसर्च (Perplexity) या आर्किटेक्चरल गहराई (Claude) के आधार पर उपयुक्त बैकएंड रूट का चयन करता है।"
        }
      },
      {
        lineNum: 9,
        code: `  const response = await fetch(modelEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: normalizedPrompt }) }); // Call AI gateway`,
        comment: {
          en: "Dispatches an asynchronous POST request to the secure internal AI gateway with JSON-serialized prompt data.",
          hi: "JSON-सीरियलाइज्ड प्रॉम्प्ट डेटा के साथ सुरक्षित आंतरिक एआई गेटवे पर एक एसिंक्रोनस POST अनुरोध भेजता है।"
        }
      },
      {
        lineNum: 10,
        code: `  if (!response.ok) throw new Error(\`AI_GENERATION_FAILED: Gateway responded with status \${response.status}\`); // Verify HTTP success code`,
        comment: {
          en: "Validates the HTTP status code, throwing a structured error if upstream rate limits or network failures occurred.",
          hi: "HTTP स्टेटस कोड की पुष्टि करता है, यदि अपस्ट्रीम रेट लिमिट या नेटवर्क विफलता हुई हो तो संरचित एरर फेंकता है।"
        }
      },
      {
        lineNum: 11,
        code: `  const { synthesizedAnswer, groundedSources, diagram } = await response.json(); // Parse structured multimodal response`,
        comment: {
          en: "Extracts the generated answer, validated source URLs, and accompanying Mermaid/SVG learning diagrams from response JSON.",
          hi: "रिस्पॉन्स JSON से जनरेट किया गया उत्तर, सत्यापित स्रोत URL और लर्निंग डायग्राम निकालता है।"
        }
      },
      {
        lineNum: 12,
        code: `  return { answer: synthesizedAnswer, source: preferredProvider, citations: groundedSources, diagram, latencyMs: 450 }; // Deliver enriched search result`,
        comment: {
          en: "Delivers the comprehensive synthesized answer with citations and diagrams to the UI renderer.",
          hi: "UI रेंडरर को संदर्भों और आरेखों के साथ संपूर्ण संश्लेषित उत्तर प्रदान करता है।"
        }
      },
      {
        lineNum: 13,
        code: `} // End of executeGroundedSearch function`,
        comment: {
          en: "Concludes search execution, completing the end-to-end request pipeline.",
          hi: "खोज निष्पादन को समाप्त करता है, संपूर्ण अनुरोध पाइपलाइन को पूरा करता है।"
        }
      }
    ]
  },

  // Step-by-Step (On The Go)
  "step-by-step": {
    id: "step-by-step",
    filename: "dockerMicroservice.ts",
    language: "typescript",
    title: {
      en: "Multi-Stage Docker & Microservice Builder",
      hi: "मल्टी-स्टेज डॉकर और माइक्रोसर्विस बिल्डर"
    },
    description: {
      en: "Production-ready Node.js & Docker microservice build specification with multi-stage caching, non-root user security, and health checks.",
      hi: "प्रोडक्शन-तैयार Node.js और डॉकर माइक्रोसर्विस विनिर्देश, मल्टी-स्टेज कैशिंग, नॉन-रूट सुरक्षा और हेल्थ चेक के साथ।"
    },
    lines: [
      {
        lineNum: 1,
        code: `import express, { type Request, type Response, type NextFunction } from "express"; // Import Express web application framework and HTTP types`,
        comment: {
          en: "Imports the Express web framework and TypeScript request/response types for building robust REST API microservices.",
          hi: "मजबूत REST API माइक्रोसर्विस बनाने के लिए Express वेब फ्रेमवर्क और TypeScript प्रकार आयात करता है।"
        }
      },
      {
        lineNum: 2,
        code: `const app = express(); // Initialize Express application instance to register middleware and route handlers`,
        comment: {
          en: "Creates the primary Express application object that manages the HTTP request processing pipeline.",
          hi: "प्राथमिक Express एप्लिकेशन ऑब्जेक्ट बनाता है जो HTTP अनुरोध पाइपलाइन का प्रबंधन करता है।"
        }
      },
      {
        lineNum: 3,
        code: `const PORT = process.env.PORT || 8080; // Configure listening port with dynamic fallback for container environments`,
        comment: {
          en: "Reads the runtime container port from environment variables, defaulting to 8080 for standard Docker and Cloud Run environments.",
          hi: "पर्यावरण चर से रनटाइम पोर्ट पढ़ता है, डॉकर और क्लाउड रन के लिए डिफ़ॉल्ट 8080 पर सेट करता है।"
        }
      },
      {
        lineNum: 4,
        code: `app.use(express.json({ limit: "1mb" })); // Mount JSON body-parser middleware with strict payload size limit`,
        comment: {
          en: "Enables incoming JSON payload parsing while enforcing a 1MB limit to protect against denial-of-service memory exhaustion.",
          hi: "मेमोरी समाप्ति हमलों से सुरक्षा के लिए 1MB की सीमा के साथ इनकमिंग JSON पेलोड पार्सिंग सक्षम करता है।"
        }
      },
      {
        lineNum: 5,
        code: `app.get("/healthz", (_req: Request, res: Response) => { // Register Kubernetes & Docker container liveness health probe endpoint`,
        comment: {
          en: "Defines the standard /healthz probe endpoint used by container orchestrators (like Kubernetes and Docker) to check service health.",
          hi: "कंटेनर ऑर्केस्ट्रेटर (Kubernetes और Docker) द्वारा सेवा की स्थिति जांचने के लिए उपयोग किया जाने वाला /healthz एंडपॉइंट परिभाषित करता है।"
        }
      },
      {
        lineNum: 6,
        code: `  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString(), uptime: process.uptime() }); // Return 200 OK with runtime diagnostics`,
        comment: {
          en: "Responds with HTTP 200 status containing process uptime and ISO timestamp to verify container vitality.",
          hi: "कंटेनर की कार्यक्षमता सत्यापित करने के लिए प्रोसेस अपटाइम और ISO टाइमस्टैम्प के साथ HTTP 200 स्टेटस लौटाता है।"
        }
      },
      {
        lineNum: 7,
        code: `}); // End of health probe handler`,
        comment: {
          en: "Closes the health check route registration.",
          hi: "हेल्थ चेक रूट पंजीकरण समाप्त करता है।"
        }
      },
      {
        lineNum: 8,
        code: `app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => { // Global centralized error-handling middleware`,
        comment: {
          en: "Registers centralized error middleware that catches unhandled exceptions across all controller endpoints.",
          hi: "केंद्रीकृत एरर मिडलवेयर पंजीकृत करता है जो सभी कंट्रोलर एंडपॉइंट्स पर अप्रत्याशित त्रुटियों को पकड़ता है।"
        }
      },
      {
        lineNum: 9,
        code: `  console.error("[CRITICAL_SERVICE_ERROR]", err.stack); // Log detailed stack trace to container standard error stream for monitoring`,
        comment: {
          en: "Outputs the error stack trace to stderr so logging agents (Datadog/CloudWatch) can aggregate telemetry.",
          hi: "कंटेनर लॉगिंग एजेंटों द्वारा निगरानी के लिए stderr पर विस्तृत एरर स्टैक ट्रेस लिखता है।"
        }
      },
      {
        lineNum: 10,
        code: `  res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred. Please retry." }); // Return sanitized error response`,
        comment: {
          en: "Sends a safe, sanitized JSON error response to client, preventing sensitive internal database or stack leaks.",
          hi: "क्लाइंट को सुरक्षित JSON एरर भेजता है, जिससे संवेदनशील डेटाबेस या कोड विवरण लीक होने से बचते हैं।"
        }
      },
      {
        lineNum: 11,
        code: `}); // End of global error middleware`,
        comment: {
          en: "Closes the global error middleware block.",
          hi: "ग्लोबल एरर मिडलवेयर ब्लॉक को बंद करता है।"
        }
      },
      {
        lineNum: 12,
        code: `app.listen(PORT, () => console.log(\`[MICROSERVICE_READY] Listening on port \${PORT} in \${process.env.NODE_ENV || "development"} mode\`)); // Start listening for incoming TCP requests`,
        comment: {
          en: "Binds the HTTP server to the designated port and outputs confirmation when the microservice is operational.",
          hi: "निर्दिष्ट पोर्ट पर HTTP सर्वर शुरू करता है और सेवा चालू होने पर पुष्टिकरण संदेश लॉग करता है।"
        }
      }
    ]
  },

  // Notes Page
  notes: {
    id: "notes",
    filename: "activeRecallManager.ts",
    language: "typescript",
    title: {
      en: "Spaced Repetition & Recall Engine",
      hi: "सक्रिय स्मरण और अंतराल पुनरावृत्ति इंजन"
    },
    description: {
      en: "SuperMemo SM-2 algorithmic revision calculator adjusting card repetition intervals based on student confidence ratings.",
      hi: "SuperMemo SM-2 एल्गोरिदम आधारित रिवीजन कैलकुलेटर जो छात्र की याददाश्त रेटिंग के आधार पर कार्ड दोहराने के अंतराल तय करता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type CardReviewState = { cardId: string; repetitionCount: number; intervalDays: number; easeFactor: number }; // Review state schema`,
        comment: {
          en: "Defines the state structure tracking card identity, successful review count, review spacing in days, and SM-2 ease factor.",
          hi: "कार्ड पहचान, सफल समीक्षा गणना, दिनों में अंतराल और SM-2 ईज़ फ़ैक्टर को ट्रैक करने वाले स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export function calculateNextReview(state: CardReviewState, grade: number): CardReviewState { // SuperMemo SM-2 calculation function`,
        comment: {
          en: "Calculates the updated revision schedule based on the student's self-assessed grade between 0 (blackout) and 5 (perfect recall).",
          hi: "0 (पूर्ण विस्मृति) से 5 (पूर्ण स्मरण) के बीच छात्र की रेटिंग के आधार पर संशोधित पुनरावृत्ति कार्यक्रम की गणना करता है।"
        }
      },
      {
        lineNum: 3,
        code: `  const validatedGrade = Math.max(0, Math.min(5, Math.round(grade))); // Clamp rating grade strictly between 0 and 5`,
        comment: {
          en: "Clamps the grade input to integer values between 0 and 5 to prevent invalid arithmetic operations.",
          hi: "अमान्य गणनाओं को रोकने के लिए ग्रेड इनपुट को 0 और 5 के बीच पूर्णांक मानों तक सीमित करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  let { repetitionCount, intervalDays, easeFactor } = state; // Destructure current review parameters`,
        comment: {
          en: "Destructures existing parameters from the review state to calculate the new interval progression.",
          hi: "नई अंतराल प्रगति की गणना करने के लिए समीक्षा स्थिति से मौजूदा मापदंडों को निकालता है।"
        }
      },
      {
        lineNum: 5,
        code: `  if (validatedGrade >= 3) { // Grade >= 3 represents a successful active recall event`,
        comment: {
          en: "Checks if the recall was successful (grade 3, 4, or 5), qualifying the card for increased review intervals.",
          hi: "जांच करता है कि क्या स्मरण सफल रहा (ग्रेड 3, 4, या 5), जिससे कार्ड का समीक्षा अंतराल बढ़ाया जा सके।"
        }
      },
      {
        lineNum: 6,
        code: `    if (repetitionCount === 0) intervalDays = 1; // First successful repetition schedules review for tomorrow`,
        comment: {
          en: "Sets next review to 1 day for brand new cards recalled correctly on first attempt.",
          hi: "पहले प्रयास में सही याद किए गए नए कार्ड्स के लिए अगला रिवीजन 1 दिन बाद निर्धारित करता है।"
        }
      },
      {
        lineNum: 7,
        code: `    else if (repetitionCount === 1) intervalDays = 6; // Second repetition advances spacing to 6 days`,
        comment: {
          en: "Advances interval to 6 days upon the second consecutive successful recall.",
          hi: "लगातार दूसरे सफल स्मरण पर अंतराल को 6 दिनों तक आगे बढ़ाता है।"
        }
      },
      {
        lineNum: 8,
        code: `    else intervalDays = Math.round(intervalDays * easeFactor); // Subsequent repetitions multiply previous interval by ease factor`,
        comment: {
          en: "Multiplies previous interval by ease factor to implement true geometric spaced repetition for permanent memory consolidation.",
          hi: "स्थायी स्मृति निर्माण के लिए ज्यामितीय अंतराल पुनरावृत्ति लागू करते हुए पिछले अंतराल को ईज़ फ़ैक्टर से गुणा करता है।"
        }
      },
      {
        lineNum: 9,
        code: `    repetitionCount += 1; // Increment successful repetition count`,
        comment: {
          en: "Increments the tally of consecutive successful recall attempts.",
          hi: "लगातार सफल स्मरण प्रयासों की संख्या में एक की वृद्धि करता है।"
        }
      },
      {
        lineNum: 10,
        code: `  } else { repetitionCount = 0; intervalDays = 1; } // Failed recall (grade < 3) resets repetition cycle to day 1`,
        comment: {
          en: "Resets interval back to 1 day if student failed recall, forcing an immediate re-test tomorrow.",
          hi: "यदि छात्र भूल गया हो तो अंतराल को 1 दिन पर रीसेट करता है, जिससे कल पुनः परीक्षण हो सके।"
        }
      },
      {
        lineNum: 11,
        code: `  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - validatedGrade) * (0.08 + (5 - validatedGrade) * 0.02))); // Update ease factor dynamically`,
        comment: {
          en: "Updates ease factor with the SM-2 non-linear polynomial formula, with a hard lower bound floor of 1.3.",
          hi: "न्यूनतम 1.3 की सीमा के साथ गैर-रैखिक SM-2 सूत्र का उपयोग करके ईज़ फ़ैक्टर को अपडेट करता है।"
        }
      },
      {
        lineNum: 12,
        code: `  return { cardId: state.cardId, repetitionCount, intervalDays, easeFactor }; // Return updated review state`,
        comment: {
          en: "Returns the newly calculated card review state ready to be persisted to client storage.",
          hi: "क्लाइंट स्टोरेज में सहेजने के लिए तैयार नव-गणना की गई कार्ड समीक्षा स्थिति लौटाता है।"
        }
      },
      {
        lineNum: 13,
        code: `} // End of calculateNextReview`,
        comment: {
          en: "Concludes the SM-2 calculation lifecycle.",
          hi: "SM-2 गणना चक्र को समाप्त करता है।"
        }
      }
    ]
  },

  // Vocabulary Page
  vocabulary: {
    id: "vocabulary",
    filename: "vocabLookupPipeline.ts",
    language: "typescript",
    title: {
      en: "English-Hindi Lexical Translation Engine",
      hi: "अंग्रेजी-हिन्दी लेक्सिकल अनुवाद इंजन"
    },
    description: {
      en: "Bilingual vocabulary processing pipeline resolving phonetic IPA pronunciation, contextual Hindi translations, and antonym clusters.",
      hi: "द्विभाषी शब्दावली प्रसंस्करण पाइपलाइन जो ध्वन्यात्मक उच्चारण, संदर्भ सहित हिन्दी अनुवाद और विलोम शब्द प्रदान करती है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type WordEntry = { word: string; phonetic: string; partOfSpeech: string; hindiMeaning: string; examples: string[]; synonyms: string[]; antonyms: string[] }; // Word dictionary entry schema`,
        comment: {
          en: "Defines the full dictionary entry schema holding phonetics, part of speech, authentic Hindi meaning, and contextual usage.",
          hi: "उच्चारण, व्याकरण श्रेणी, सटीक हिन्दी अर्थ और व्यावहारिक उपयोग को रखने वाले डिक्शनरी स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export async function lookupVocabularyWord(term: string): Promise<WordEntry | null> { // Asynchronous word lookup function`,
        comment: {
          en: "Main lookup function resolving a user-entered English term into a structured bilingual vocabulary card.",
          hi: "मुख्य खोज फ़ंक्शन जो यूज़र द्वारा दर्ज किए गए अंग्रेजी शब्द को संरचित द्विभाषी वोकैबुलरी कार्ड में बदलता है।"
        }
      },
      {
        lineNum: 3,
        code: `  const cleanTerm = term.trim().toLowerCase(); // Normalize input string by removing whitespace and lowercasing`,
        comment: {
          en: "Strips leading/trailing whitespace and normalizes casing to guarantee accurate dictionary index matching.",
          hi: "सटीक शब्दकोश मिलान सुनिश्चित करने के लिए आगे और पीछे के रिक्त स्थान हटाता है और छोटे अक्षरों में बदलता है।"
        }
      },
      {
        lineNum: 4,
        code: `  if (!cleanTerm || cleanTerm.length > 50) return null; // Guard against empty or maliciously oversized inputs`,
        comment: {
          en: "Validation guard rejecting empty queries or oversized payloads to protect memory safety.",
          hi: "खाली प्रश्नों या अत्यधिक लंबे इनपुट को खारिज करने वाली सुरक्षा जांच।"
        }
      },
      {
        lineNum: 5,
        code: `  const cachedResult = sessionStorage.getItem(\`masterclass:vocab:\${cleanTerm}\`); // Check fast session storage cache`,
        comment: {
          en: "Checks client session storage to return instantaneous results for previously looked-up terms without network round-trips.",
          hi: "बिना नेटवर्क अनुरोध के तुरंत परिणाम देने के लिए पहले से खोजे गए शब्दों के लिए क्लाइंट सत्र स्टोरेज की जांच करता है।"
        }
      },
      {
        lineNum: 6,
        code: `  if (cachedResult) return JSON.parse(cachedResult) as WordEntry; // Return cached entry immediately on cache hit`,
        comment: {
          en: "Parses and returns cached word data immediately when an existing entry is found in memory.",
          hi: "मेमोरी में मौजूदा प्रविष्टि मिलने पर तुरंत कैश्ड वर्ड डेटा को पार्स करके लौटाता है।"
        }
      },
      {
        lineNum: 7,
        code: `  const response = await fetch(\`/api/vocabulary?word=\${encodeURIComponent(cleanTerm)}\`); // Query server vocabulary API`,
        comment: {
          en: "Dispatches HTTP GET request to backend vocabulary endpoint with URL-encoded query parameters.",
          hi: "URL-एन्कोडेड क्वेरी पैरामीटर्स के साथ बैकएंड वोकैबुलरी एंडपॉइंट पर HTTP GET अनुरोध भेजता है।"
        }
      },
      {
        lineNum: 8,
        code: `  if (!response.ok) return null; // Return null if word is not found in catalog`,
        comment: {
          en: "Handles 404 Not Found responses gracefully without throwing unhandled UI exceptions.",
          hi: "शब्दकोश में शब्द न मिलने पर बिना किसी एरर के सुरक्षित रूप से null लौटाता है।"
        }
      },
      {
        lineNum: 9,
        code: `  const wordData = await response.json() as WordEntry; // Parse typed JSON dictionary payload`,
        comment: {
          en: "Awaits and deserializes the JSON response payload into a verified WordEntry data structure.",
          hi: "JSON रिस्पॉन्स पेलोड को सत्यापित WordEntry डेटा संरचना में बदलता है।"
        }
      },
      {
        lineNum: 10,
        code: `  sessionStorage.setItem(\`masterclass:vocab:\${cleanTerm}\`, JSON.stringify(wordData)); // Cache valid entry in session storage for fast recall`,
        comment: {
          en: "Persists the validated entry in browser session storage so re-inspections occur with 0ms latency.",
          hi: "सत्यापित डेटा को ब्राउज़र सत्र स्टोरेज में सहेजता है ताकि दोबारा देखने पर 0ms विलंबता के साथ खुले।"
        }
      },
      {
        lineNum: 11,
        code: `  return wordData; // Return resolved vocabulary card data to UI`,
        comment: {
          en: "Delivers the complete word metadata to the UI for pronunciation, Hindi nuance, and example sentence rendering.",
          hi: "उच्चारण, हिन्दी अर्थ और उदाहरण वाक्य रेंडरिंग के लिए पूर्ण डेटा UI को लौटाता है।"
        }
      },
      {
        lineNum: 12,
        code: `} // End of lookupVocabularyWord`,
        comment: {
          en: "Concludes the vocabulary lookup pipeline execution.",
          hi: "शब्दावली खोज पाइपलाइन निष्पादन समाप्त करता है।"
        }
      }
    ]
  },

  // Class Room Page
  classroom: {
    id: "classroom",
    filename: "quadraticSolverSteps.ts",
    language: "typescript",
    title: {
      en: "Step-by-Step Math Problem Solver",
      hi: "चरण-दर-चरण गणित समस्या समाधानकर्ता"
    },
    description: {
      en: "Pedagogical mathematical solver calculating quadratic equation roots with step-by-step discriminant evaluation and board exam mark allocation.",
      hi: "द्विघात समीकरण हल करने वाला गणितीय एल्गोरिदम जो स्टेप मार्किंग और विविक्तकर (Discriminant) गणना के साथ चरणबद्ध उत्तर देता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type QuadraticSolution = { equation: string; discriminant: number; rootType: "real_distinct" | "real_equal" | "complex"; roots: [number, number]; steps: string[] }; // Solution schema`,
        comment: {
          en: "Defines the solution data contract holding the original equation, calculated discriminant (D), nature of roots, numeric solutions, and worked steps.",
          hi: "मूल समीकरण, विविक्तकर (D), मूलों की प्रकृति, संख्यात्मक उत्तर और चरणबद्ध स्पष्टीकरण रखने वाले स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export function solveQuadraticEquation(a: number, b: number, c: number): QuadraticSolution { // Pedagogical solver for ax^2 + bx + c = 0`,
        comment: {
          en: "Calculates step-by-step solutions for quadratic equations ax² + bx + c = 0 formatted according to board exam marking schemes.",
          hi: "बोर्ड परीक्षा अंकन योजना के अनुसार ax² + bx + c = 0 द्विघात समीकरणों के चरणबद्ध समाधान की गणना करता है।"
        }
      },
      {
        lineNum: 3,
        code: `  if (a === 0) throw new Error("INVALID_QUADRATIC: Coefficient 'a' cannot be zero in a second-degree polynomial"); // Validate quadratic condition`,
        comment: {
          en: "Enforces the fundamental algebraic requirement that the leading quadratic coefficient 'a' must be non-zero.",
          hi: "मौलिक बीजगणितीय नियम लागू करता है कि द्विघात समीकरण में 'a' का मान कभी शून्य नहीं हो सकता।"
        }
      },
      {
        lineNum: 4,
        code: `  const steps: string[] = []; // Initialize array to capture worked examination steps`,
        comment: {
          en: "Initializes a steps array to record each mathematical derivation step for student instruction.",
          hi: "छात्रों के समझने के लिए प्रत्येक गणितीय चरण को रिकॉर्ड करने हेतु स्टेप ऐरे बनाता है।"
        }
      },
      {
        lineNum: 5,
        code: `  steps.push(\`Step 1: Identify standard form coefficients -> a = \${a}, b = \${b}, c = \${c}\`); // Step 1: Coefficient identification`,
        comment: {
          en: "Records Step 1: Extracting and writing out coefficients a, b, and c to secure preliminary exam step marks.",
          hi: "पहला चरण: बोर्ड परीक्षा में प्रारंभिक अंक सुनिश्चित करने के लिए गुणांक a, b, और c की पहचान करता है।"
        }
      },
      {
        lineNum: 6,
        code: `  const discriminant = (b * b) - (4 * a * c); // Step 2: Compute discriminant D = b^2 - 4ac`,
        comment: {
          en: "Evaluates the algebraic discriminant D = b² - 4ac to determine the nature of the roots.",
          hi: "मूलों की प्रकृति निर्धारित करने के लिए विविक्तकर D = b² - 4ac की गणना करता है।"
        }
      },
      {
        lineNum: 7,
        code: `  steps.push(\`Step 2: Calculate Discriminant D = b² - 4ac = (\${b})² - 4(\${a})(\${c}) = \${discriminant}\`); // Record discriminant calculation step`,
        comment: {
          en: "Formats the explicit substitution into the discriminant formula.",
          hi: "सूत्र में मान प्रतिस्थापन को स्पष्ट चरण के रूप में दर्ज करता है।"
        }
      },
      {
        lineNum: 8,
        code: `  const rootType = discriminant > 0 ? "real_distinct" : discriminant === 0 ? "real_equal" : "complex"; // Determine nature of roots`,
        comment: {
          en: "Classifies whether roots are real and distinct (D > 0), real and coincident (D = 0), or complex conjugates (D < 0).",
          hi: "जांच करता है कि मूल वास्तविक व भिन्न हैं (D > 0), समान हैं (D = 0), या काल्पनिक हैं (D < 0)।"
        }
      },
      {
        lineNum: 9,
        code: `  steps.push(\`Step 3: Nature of roots -> Since D \${discriminant >= 0 ? (discriminant > 0 ? "> 0" : "= 0") : "< 0"}, roots are \${rootType.replace("_", " ")}\`); // Step 3 reasoning`,
        comment: {
          en: "Documents the theoretical deduction of root characteristics based on the discriminant sign.",
          hi: "चिह्न के आधार पर मूलों की प्रकृति का सैद्धांतिक निष्कर्ष दर्ज करता है।"
        }
      },
      {
        lineNum: 10,
        code: `  const root1 = (-b + Math.sqrt(Math.max(0, discriminant))) / (2 * a); // Calculate first root x1 using quadratic formula`,
        comment: {
          en: "Computes the first root via the positive quadratic formula numerator (-b + √D) / 2a.",
          hi: "द्विघात सूत्र (-b + √D) / 2a का उपयोग करके पहले मूल x1 की गणना करता है।"
        }
      },
      {
        lineNum: 11,
        code: `  const root2 = (-b - Math.sqrt(Math.max(0, discriminant))) / (2 * a); // Calculate second root x2 using quadratic formula`,
        comment: {
          en: "Computes the second root via the negative quadratic formula numerator (-b - √D) / 2a.",
          hi: "द्विघात सूत्र (-b - √D) / 2a का उपयोग करके दूसरे मूल x2 की गणना करता है।"
        }
      },
      {
        lineNum: 12,
        code: `  steps.push(\`Step 4: Apply formula x = (-b ± √D) / 2a -> x1 = \${root1.toFixed(3)}, x2 = \${root2.toFixed(3)}\`); // Final numerical roots step`,
        comment: {
          en: "Concludes with the calculated numerical roots formatted to 3 decimal places for exam accuracy.",
          hi: "परीक्षा सटीकता के लिए 3 दशमलव स्थानों तक संख्यात्मक उत्तर प्रस्तुत करता है।"
        }
      },
      {
        lineNum: 13,
        code: `  return { equation: \`\${a}x² + \${b}x + \${c} = 0\`, discriminant, rootType, roots: [root1, root2], steps }; // Return comprehensive solution`,
        comment: {
          en: "Returns the complete structured solution object for pedagogical display in the Class Room reader.",
          hi: "क्लास रूम में छात्रों के पढ़ने के लिए संपूर्ण संरचित समाधान ऑब्जेक्ट लौटाता है।"
        }
      },
      {
        lineNum: 14,
        code: `} // End of solveQuadraticEquation`,
        comment: {
          en: "Concludes mathematical solver execution.",
          hi: "गणितीय समाधान निष्पादन समाप्त करता है।"
        }
      }
    ]
  },

  // Bookmark Page
  bookmark: {
    id: "bookmark",
    filename: "offlineReviewStorage.ts",
    language: "typescript",
    title: {
      en: "Offline Storage & Revision Vault Manager",
      hi: "ऑफ़लाइन स्टोरेज और रिवीजन वॉल्ट प्रबंधक"
    },
    description: {
      en: "High-reliability client-side storage manager with quota safety, schema validation, and deduplication for saved revision bookmarks.",
      hi: "सुरक्षित कोटा जांच, स्कीमा सत्यापन और डुप्लिकेशन रोकथाम के साथ बुकमार्क सहेजने वाला क्लाइंट स्टोरेज मैनेजर।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type BookmarkRecord = { id: string; title: string; category: string; savedAt: number; tags: string[] }; // Bookmark item schema`,
        comment: {
          en: "Defines the storage model containing bookmark identifier, descriptive title, category taxonomy, epoch timestamp, and filter tags.",
          hi: "बुकमार्क आईडी, शीर्षक, श्रेणी, टाइमस्टैम्प और फ़िल्टर टैग को संग्रहीत करने वाले स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `const STORAGE_KEY = "masterclass:saved:bookmarks"; // Central local storage key for revision vault bookmarks`,
        comment: {
          en: "Defines the namespace key under which bookmarks are serialized in the browser's persistent localStorage.",
          hi: "ब्राउज़र के स्थानीय स्टोरेज में बुकमार्क सीरियलाइज़ करने के लिए नेमस्पेस कुंजी परिभाषित करता है।"
        }
      },
      {
        lineNum: 3,
        code: `export function saveBookmarkItem(item: Omit<BookmarkRecord, "savedAt">): boolean { // Safe bookmark persistence function`,
        comment: {
          en: "Persists a new topic card into browser storage, automatically stamping the current timestamp and preventing duplicate entries.",
          hi: "ब्राउज़र स्टोरेज में नया टॉपिक कार्ड जोड़ता है, स्वचालित रूप से समय दर्ज करता है और डुप्लिकेट प्रविष्टियों को रोकता है।"
        }
      },
      {
        lineNum: 4,
        code: `  try { // Wrap storage operations in try-catch to guard against QuotaExceededError or private browsing restrictions`,
        comment: {
          en: "Catches browser quota exceptions or security restrictions (such as Safari Private Mode blocking storage writes).",
          hi: "ब्राउज़र कोटा सीमा या निजी ब्राउज़िंग सुरक्षा प्रतिबंधों को सुरक्षित रूप से संभालने के लिए try-catch लगाता है।"
        }
      },
      {
        lineNum: 5,
        code: `    const existing: BookmarkRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); // Load existing bookmark array`,
        comment: {
          en: "Deserializes the existing bookmark list from localStorage or falls back to an empty array.",
          hi: "लोकल स्टोरेज से मौजूदा बुकमार्क सूची को पार्स करता है या खाली ऐरे प्रदान करता है।"
        }
      },
      {
        lineNum: 6,
        code: `    const filtered = existing.filter(entry => entry.id !== item.id); // Remove any prior copy of this item to avoid duplicates`,
        comment: {
          en: "Filters out any previous instance of the item to ensure strict uniqueness by ID.",
          hi: "आईडी के आधार पर विशिष्टता सुनिश्चित करने के लिए पहले से मौजूद किसी भी प्रविष्टि को हटाता है।"
        }
      },
      {
        lineNum: 7,
        code: `    const updated: BookmarkRecord[] = [{ ...item, savedAt: Date.now() }, ...filtered].slice(0, 50); // Prepend new item and cap at 50`,
        comment: {
          en: "Prepends the newly bookmarked item with the current timestamp and caps the collection at 50 items to conserve storage.",
          hi: "वर्तमान समय के साथ नया बुकमार्क सबसे ऊपर जोड़ता है और मेमोरी बचाने के लिए अधिकतम 50 आइटम तक सीमित करता है।"
        }
      },
      {
        lineNum: 8,
        code: `    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); // Persist updated JSON array back to browser localStorage`,
        comment: {
          en: "Serializes the updated array back to localStorage as valid JSON text.",
          hi: "अपडेट किए गए ऐरे को वैध JSON टेक्स्ट के रूप में लोकल स्टोरेज में सहेजता है।"
        }
      },
      {
        lineNum: 9,
        code: `    return true; // Return true indicating successful bookmark persistence`,
        comment: {
          en: "Signals success to the calling component so UI icons can update to the active saved state.",
          hi: "सफलता का संकेत देता है ताकि UI में बुकमार्क आइकन सक्रिय स्थिति में बदल सके।"
        }
      },
      {
        lineNum: 10,
        code: `  } catch (err) { // Handle storage write failure`,
        comment: {
          en: "Intercepts browser storage write exceptions without crashing the parent application.",
          hi: "एप्लिकेशन क्रैश किए बिना स्टोरेज लिखने की त्रुटियों को पकड़ता है।"
        }
      },
      {
        lineNum: 11,
        code: `    console.warn("[BOOKMARK_STORAGE_WARNING] Unable to write bookmark to localStorage:", err); // Log non-fatal storage warning`,
        comment: {
          en: "Emits a diagnostic console warning for debugging storage issues in restricted browser environments.",
          hi: "ब्राउज़र समस्याओं की जांच के लिए कंसोल में चेतावनी दर्ज करता है।"
        }
      },
      {
        lineNum: 12,
        code: `    return false; // Return false indicating storage failure`,
        comment: {
          en: "Informs the caller of persistence failure so fallback behavior can be triggered.",
          hi: "विफलता की सूचना देता है ताकि वैकल्पिक व्यवस्था की जा सके।"
        }
      },
      {
        lineNum: 13,
        code: `  } // End of try-catch block`,
        comment: {
          en: "Closes the safe storage error handler.",
          hi: "सुरक्षित स्टोरेज एरर हैंडलर समाप्त करता है।"
        }
      },
      {
        lineNum: 14,
        code: `} // End of saveBookmarkItem`,
        comment: {
          en: "Concludes bookmark persistence function execution.",
          hi: "बुकमार्क सहेजने का कार्य समाप्त करता है।"
        }
      }
    ]
  },

  // Techy - Live Sandbox
  techy: {
    id: "techy",
    filename: "sandboxedWorkerRunner.ts",
    language: "typescript",
    title: {
      en: "In-Browser Sandboxed Code Execution Runner",
      hi: "इन-ब्राउज़र सैंडबॉक्स कोड निष्पादक"
    },
    description: {
      en: "Zero-config web worker execution harness running JavaScript & algorithm logic safely in an isolated thread with captured stdout logs.",
      hi: "जीरो-कॉन्फ़िग वेब वर्कर निष्पादन प्रणाली जो अलग थ्रेड में जावास्क्रिप्ट को सुरक्षित चलाकर कंसोल लॉग पकड़ती है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type ExecutionResult = { stdout: string[]; error: string | null; executionTimeMs: number }; // Execution output schema`,
        comment: {
          en: "Defines the execution response contract returning standard output strings, error diagnostics, and millisecond elapsed time.",
          hi: "कंसोल आउटपुट, एरर विवरण और मिलीसेकंड में निष्पादन समय लौटाने वाले स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export async function runCodeInSandbox(userCode: string, timeoutMs = 2500): Promise<ExecutionResult> { // Safe isolated code runner`,
        comment: {
          en: "Executes arbitrary user code inside a Sandboxed Web Worker with a strict execution timeout to prevent infinite loops.",
          hi: "अनंत लूप से सुरक्षा के लिए समय सीमा के साथ वेब वर्कर सैंडबॉक्स में कोड सुरक्षित रूप से चलाता है।"
        }
      },
      {
        lineNum: 3,
        code: `  const startTime = performance.now(); // High-resolution start timer for precision performance benchmarks`,
        comment: {
          en: "Captures high-resolution performance timestamp to calculate exact execution runtime in fractions of a millisecond.",
          hi: "सटीक निष्पादन समय मापने के लिए उच्च-सटीकता वाला टाइमस्टैम्प दर्ज करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  const logs: string[] = []; // In-memory accumulator for console.log statements executed in the sandbox`,
        comment: {
          en: "Collects all console.log arguments stringified in chronological sequence during execution.",
          hi: "निष्पादन के दौरान चलाए गए सभी console.log आउटपुट को क्रमिक रूप से एकत्र करता है।"
        }
      },
      {
        lineNum: 5,
        code: `  const workerScript = \`self.onmessage = function(e) { const logs = []; const console = { log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')) }; try { const fn = new Function('console', e.data); fn(console); self.postMessage({ success: true, logs }); } catch(err) { self.postMessage({ success: false, error: err.message }); } };\`; // Create worker payload`,
        comment: {
          en: "Creates an isolated worker script that overrides console.log, evaluates the user code, and posts structured results back to main thread.",
          hi: "एक अलग वर्कर स्क्रिप्ट बनाता है जो console.log को ओवरराइड करता है, कोड चलाता है और परिणाम मुख्य थ्रेड को भेजता है।"
        }
      },
      {
        lineNum: 6,
        code: `  const blob = new Blob([workerScript], { type: "application/javascript" }); // Package worker code into an in-memory Blob`,
        comment: {
          en: "Converts the inline worker script into an in-memory executable JavaScript Blob.",
          hi: "वर्कर स्क्रिप्ट को मेमोरी में निष्पादन योग्य जावास्क्रिप्ट ब्लॉब में बदलता है।"
        }
      },
      {
        lineNum: 7,
        code: `  const worker = new Worker(URL.createObjectURL(blob)); // Instantiate browser Web Worker from Blob URL`,
        comment: {
          en: "Spawns a dedicated Web Worker thread operating in an isolated global scope with zero access to main DOM or cookies.",
          hi: "मुख्य DOM या कुकीज़ से पूरी तरह अलग एक समर्पित वेब वर्कर थ्रेड शुरू करता है।"
        }
      },
      {
        lineNum: 8,
        code: `  return new Promise(resolve => { // Return a Promise that resolves when execution finishes or times out`,
        comment: {
          en: "Wraps worker communication in a Promise with timeout race protection.",
          hi: "समय सीमा सुरक्षा के साथ वर्कर संचार को प्रॉमिस में लपेटता है।"
        }
      },
      {
        lineNum: 9,
        code: `    const timer = setTimeout(() => { worker.terminate(); resolve({ stdout: logs, error: "TIMEOUT_EXCEEDED: Execution terminated after 2.5s limit", executionTimeMs: timeoutMs }); }, timeoutMs); // Guard against infinite while loops`,
        comment: {
          en: "Kills the worker thread if execution exceeds timeout limit (preventing browser freezes on 'while(true)' loops).",
          hi: "यदि कोड 2.5 सेकंड से अधिक समय ले (जैसे अनंत लूप), तो ब्राउज़र फ्रीज होने से बचाने के लिए वर्कर को तुरंत बंद करता है।"
        }
      },
      {
        lineNum: 10,
        code: `    worker.onmessage = event => { clearTimeout(timer); worker.terminate(); const elapsed = Math.round(performance.now() - startTime); resolve({ stdout: event.data.logs || [], error: event.data.error || null, executionTimeMs: elapsed }); }; // Handle completed execution`,
        comment: {
          en: "Clears timer, terminates worker, and resolves the promise with captured console logs and elapsed execution time.",
          hi: "टाइमर साफ़ करता है, वर्कर बंद करता है और कैप्चर किए गए कंसोल लॉग व समय के साथ प्रॉमिस को पूरा करता है।"
        }
      },
      {
        lineNum: 11,
        code: `    worker.postMessage(userCode); // Send user code string to background worker to initiate execution`,
        comment: {
          en: "Sends the user's source code string to the worker thread to trigger execution.",
          hi: "निष्पादन शुरू करने के लिए वर्कर थ्रेड को यूज़र का सोर्स कोड भेजता है।"
        }
      },
      {
        lineNum: 12,
        code: `  }); // End of Promise wrapper`,
        comment: {
          en: "Closes the asynchronous Promise boundary.",
          hi: "एसिंक्रोनस प्रॉमिस सीमा समाप्त करता है।"
        }
      },
      {
        lineNum: 13,
        code: `} // End of runCodeInSandbox`,
        comment: {
          en: "Concludes sandboxed runner execution.",
          hi: "सैंडबॉक्स निष्पादन समाप्त करता है।"
        }
      }
    ]
  },

  // API Docs
  "api-docs": {
    id: "api-docs",
    filename: "resilientHttpClient.ts",
    language: "typescript",
    title: {
      en: "Resilient SDK HTTP Client with Exponential Backoff",
      hi: "मजबूत SDK HTTP क्लाइंट और बैकऑफ़"
    },
    description: {
      en: "Production-grade HTTP client implementing jittered exponential backoff retries, Bearer authorization, and typed error handling.",
      hi: "उत्पादन स्तर का HTTP क्लाइंट जो घातीय बैकऑफ़ पुनः प्रयास, प्रमाणीकरण और प्रकार-सुरक्षित एरर हैंडलिंग लागू करता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type RequestOptions = { method?: "GET" | "POST" | "PUT" | "DELETE"; headers?: Record<string, string>; body?: unknown; maxRetries?: number }; // Request options schema`,
        comment: {
          en: "Defines the request configuration schema supporting standard HTTP verbs, custom headers, payload, and retry limits.",
          hi: "मानक HTTP विधियों, कस्टम हेडर्स, पेलोड और पुनः प्रयास सीमाओं का समर्थन करने वाले अनुरोध कॉन्फ़िगरेशन स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export async function fetchWithExponentialBackoff<T>(url: string, options: RequestOptions = {}): Promise<T> { // Generic resilient HTTP fetcher`,
        comment: {
          en: "Generic fetch wrapper that automatically handles transient network glitches and rate-limits via randomized exponential backoff.",
          hi: "जेनेरिक फ़ेच उपयोगिता जो स्वचालित रूप से क्षणिक नेटवर्क गड़बड़ियों और दर-सीमाओं को पुनः प्रयास से संभालती है।"
        }
      },
      {
        lineNum: 3,
        code: `  const { method = "GET", headers = {}, body, maxRetries = 3 } = options; // Destructure options with sensible defaults`,
        comment: {
          en: "Applies defaults: GET method and 3 maximum retry attempts before surfacing terminal failure.",
          hi: "डिफ़ॉल्ट मान लागू करता है: GET विधि और अंतिम विफलता से पहले अधिकतम 3 पुनः प्रयास।"
        }
      },
      {
        lineNum: 4,
        code: `  for (let attempt = 0; attempt <= maxRetries; attempt++) { // Execution loop supporting progressive retry attempts`,
        comment: {
          en: "Loops through retry attempts, increasing wait delays exponentially on 429 and 5xx responses.",
          hi: "429 और 5xx त्रुटियों पर प्रतीक्षा समय को तेजी से बढ़ाते हुए पुनः प्रयास लूप चलाता है।"
        }
      },
      {
        lineNum: 5,
        code: `    try { // Initiate HTTP request attempt`,
        comment: {
          en: "Begins standard fetch execution within an error-intercepting try block.",
          hi: "एरर पकड़ने वाले ब्लॉक में मानक फ़ेच निष्पादन शुरू करता है।"
        }
      },
      {
        lineNum: 6,
        code: `      const response = await fetch(url, { method, headers: { "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined }); // Execute HTTP request`,
        comment: {
          en: "Fires the native fetch request with JSON headers and optional serialized body.",
          hi: "JSON हेडर्स और वैकल्पिक सीरियलाइज्ड बॉडी के साथ फ़ेच अनुरोध भेजता है।"
        }
      },
      {
        lineNum: 7,
        code: `      if (response.ok) return await response.json() as T; // Return deserialized payload on successful 2xx status code`,
        comment: {
          en: "Parses and returns typed JSON data when the HTTP status code is in the successful 200-299 range.",
          hi: "HTTP स्टेटस कोड 200-299 की सफल श्रेणी में होने पर टाइप किए गए JSON डेटा को लौटाता है।"
        }
      },
      {
        lineNum: 8,
        code: `      if (response.status !== 429 && response.status < 500) throw new Error(\`CLIENT_ERROR_\${response.status}: Non-retryable client error\`); // Do not retry client 4xx errors (except 429)`,
        comment: {
          en: "Aborts immediately on client errors (400, 401, 403, 404) because resending unchanged requests will not succeed.",
          hi: "क्लाइंट त्रुटियों (400, 401, 404) पर तुरंत रुकता है क्योंकि बिना बदलाव के पुनः प्रयास करने से सफलता नहीं मिलेगी।"
        }
      },
      {
        lineNum: 9,
        code: `    } catch (err: unknown) { if (attempt === maxRetries) throw err; } // Rethrow final error if max retry limit is exhausted`,
        comment: {
          en: "Rethrows the exception when all allowed retry attempts have been exhausted.",
          hi: "सभी पुनः प्रयास समाप्त होने पर अंतिम त्रुटि को आगे फेंकता है।"
        }
      },
      {
        lineNum: 10,
        code: `    const backoffDelay = Math.pow(2, attempt) * 300 + Math.random() * 150; // Calculate jittered exponential backoff delay in ms`,
        comment: {
          en: "Calculates exponential backoff (300ms, 600ms, 1200ms) with full jitter randomization to prevent thundering herd spikes.",
          hi: "सर्वर पर अचानक दबाव रोकने के लिए रैंडम टाइमिंग के साथ एक्सपोनेंशियल बैकऑफ़ समय (300ms, 600ms, 1200ms) की गणना करता है।"
        }
      },
      {
        lineNum: 11,
        code: `    await new Promise(resolve => setTimeout(resolve, backoffDelay)); // Pause execution asynchronously before next retry`,
        comment: {
          en: "Asynchronously pauses execution for the calculated backoff period before next attempt.",
          hi: "अगले पुनः प्रयास से पहले गणना किए गए अंतराल के लिए कोड निष्पादन को रोकता है।"
        }
      },
      {
        lineNum: 12,
        code: `  } // End of retry loop`,
        comment: {
          en: "Closes the retry iteration loop.",
          hi: "पुनः प्रयास लूप समाप्त करता है।"
        }
      },
      {
        lineNum: 13,
        code: `  throw new Error("RETRY_LIMIT_EXCEEDED: Network request failed after maximum backoff attempts"); // Final fallback error`,
        comment: {
          en: "Guarantees function return type safety by throwing if loop finishes without successful return.",
          hi: "यदि लूप बिना सफलता के समाप्त हो तो अंतिम एरर फेंककर टाइप सुरक्षा बनाए रखता है।"
        }
      },
      {
        lineNum: 14,
        code: `} // End of fetchWithExponentialBackoff`,
        comment: {
          en: "Concludes resilient fetcher execution.",
          hi: "मजबूत फ़ेचर निष्पादन समाप्त करता है।"
        }
      }
    ]
  },

  // Lessons Page
  lessons: {
    id: "lessons",
    filename: "microCourseStateMachine.ts",
    language: "typescript",
    title: {
      en: "Progressive Learning State Machine",
      hi: "क्रमिक शिक्षण स्टेट मशीन"
    },
    description: {
      en: "Curriculum progression controller enforcing prerequisite unit completion, tracking lesson milestones, and calculating completion ratios.",
      hi: "पाठ्यक्रम प्रगति नियंत्रक जो पूर्व-आवश्यक पाठों की पूर्णता सुनिश्चित करता है और सीखने की प्रगति मापता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type LessonNode = { id: string; title: string; prerequisites: string[]; isCompleted: boolean; score: number }; // Lesson node schema`,
        comment: {
          en: "Defines the lesson graph node schema with unique identifier, prerequisite list, completion flag, and assessment score.",
          hi: "विशिष्ट पहचानकर्ता, पूर्व-आवश्यक सूची, पूर्णता फ़्लैग और मूल्यांकन स्कोर के साथ पाठ नोड स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export function evaluateLessonAccess(lesson: LessonNode, completedIds: Set<string>): { canUnlock: boolean; missingPrereqs: string[] } { // Access evaluation function`,
        comment: {
          en: "Evaluates whether a learner is eligible to unlock a target lesson based on satisfied prerequisite course nodes.",
          hi: "संतुष्ट पूर्व-आवश्यक पाठों के आधार पर जांच करता है कि क्या शिक्षार्थी अगले पाठ को अनलॉक करने के योग्य है।"
        }
      },
      {
        lineNum: 3,
        code: `  const missingPrereqs = lesson.prerequisites.filter(reqId => !completedIds.has(reqId)); // Identify uncompleted prerequisite IDs`,
        comment: {
          en: "Filters the lesson's required prerequisites against the student's set of completed lessons.",
          hi: "छात्र द्वारा पूरे किए गए पाठों के साथ आवश्यक पूर्व-शर्तों की तुलना करके अधूरी आवश्यकताओं की पहचान करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  const canUnlock = missingPrereqs.length === 0; // Eligible to unlock only when zero prerequisites are outstanding`,
        comment: {
          en: "Grants access only when all prerequisite dependencies have been fully completed and validated.",
          hi: "केवल तभी पहुंच प्रदान करता है जब सभी पूर्व-आवश्यक पाठ पूरी तरह से समाप्त और सत्यापित हो चुके हों।"
        }
      },
      {
        lineNum: 5,
        code: `  return { canUnlock, missingPrereqs }; // Return access evaluation result`,
        comment: {
          en: "Returns the boolean unlock status and array of missing prerequisites for UI lock indicator rendering.",
          hi: "UI लॉक संकेतक प्रदर्शित करने के लिए अनलॉक स्थिति और छूटी हुई आवश्यकताओं की सूची लौटाता है।"
        }
      },
      {
        lineNum: 6,
        code: `} // End of evaluateLessonAccess`,
        comment: {
          en: "Concludes lesson access evaluation.",
          hi: "पाठ पहुंच मूल्यांकन समाप्त करता है।"
        }
      },
      {
        lineNum: 7,
        code: `export function computeOverallProgress(curriculum: LessonNode[]): { percentage: number; completedCount: number; totalCount: number } { // Progress metrics calculator`,
        comment: {
          en: "Computes the student's aggregate curriculum progress metrics for dashboard display.",
          hi: "डैशबोर्ड पर दिखाने के लिए छात्र की कुल पाठ्यक्रम प्रगति मेट्रिक्स की गणना करता है।"
        }
      },
      {
        lineNum: 8,
        code: `  const totalCount = curriculum.length; // Count total lessons in curriculum`,
        comment: {
          en: "Counts total number of lesson units available in the curriculum track.",
          hi: "पाठ्यक्रम में उपलब्ध कुल पाठों की संख्या गिनता है।"
        }
      },
      {
        lineNum: 9,
        code: `  if (totalCount === 0) return { percentage: 0, completedCount: 0, totalCount: 0 }; // Guard against division by zero on empty curricula`,
        comment: {
          en: "Handles empty curricula cleanly without throwing arithmetic divide-by-zero errors.",
          hi: "शून्य से विभाजन की त्रुटि से बचने के लिए खाली पाठ्यक्रम को सुरक्षित रूप से संभालता है।"
        }
      },
      {
        lineNum: 10,
        code: `  const completedCount = curriculum.filter(item => item.isCompleted).length; // Tally completed lessons`,
        comment: {
          en: "Tallies all lessons verified with isCompleted set to true.",
          hi: "पूरे हो चुके सभी पाठों की कुल संख्या की गणना करता है।"
        }
      },
      {
        lineNum: 11,
        code: `  const percentage = Math.round((completedCount / totalCount) * 100); // Compute integer progress percentage`,
        comment: {
          en: "Calculates the integer completion percentage between 0% and 100%.",
          hi: "0% से 100% के बीच पूर्णांक पूर्णता प्रतिशत की गणना करता है।"
        }
      },
      {
        lineNum: 12,
        code: `  return { percentage, completedCount, totalCount }; // Return progress metrics object`,
        comment: {
          en: "Returns the progress metrics used by visual progress bars and completion badges.",
          hi: "प्रगति बार और पूर्णता बैज द्वारा उपयोग किए जाने वाले मेट्रिक्स लौटाता है।"
        }
      },
      {
        lineNum: 13,
        code: `} // End of computeOverallProgress`,
        comment: {
          en: "Concludes progress calculation execution.",
          hi: "प्रगति गणना निष्पादन समाप्त करता है।"
        }
      }
    ]
  },

  // Quiz Page
  quiz: {
    id: "quiz",
    filename: "timedQuizEvaluator.ts",
    language: "typescript",
    title: {
      en: "Timed Quiz Scoring & Evaluation Engine",
      hi: "समयबद्ध क्विज़ मूल्यांकन और स्कोरिंग इंजन"
    },
    description: {
      en: "Real-time assessment scorer evaluating submitted answer indices, applying speed bonuses, and generating performance diagnostics.",
      hi: "रियल-टाइम मूल्यांकन स्कोरर जो उत्तरों की जांच करता है, गति बोनस लागू करता है और प्रदर्शन निदान उत्पन्न करता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type QuizQuestion = { id: string; prompt: string; options: string[]; correctIndex: number; explanation: string }; // Question schema`,
        comment: {
          en: "Defines the question schema including prompt text, four answer options, zero-based correct index, and conceptual rationale.",
          hi: "प्रश्न विवरण, चार विकल्प, सही उत्तर का इंडेक्स और स्पष्टीकरण रखने वाले स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export type EvaluationReport = { score: number; accuracy: number; totalQuestions: number; correctCount: number; rationaleSummary: string[] }; // Report schema`,
        comment: {
          en: "Defines the grading report schema providing calculated score, accuracy percentage, and compiled rationales.",
          hi: "प्राप्त अंक, सटीकता प्रतिशत और व्याख्याओं के साथ अंतिम परिणाम रिपोर्ट स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 3,
        code: `export function evaluateQuizSubmission(questions: QuizQuestion[], userAnswers: Record<string, number>): EvaluationReport { // Grading engine function`,
        comment: {
          en: "Compares learner selections against answer keys and generates comprehensive assessment telemetry.",
          hi: "शिक्षार्थी के चयनों की तुलना सही उत्तरों से करता है और संपूर्ण मूल्यांकन रिपोर्ट तैयार करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  let correctCount = 0; // Initialize correct answer counter`,
        comment: {
          en: "Initializes the counter tracking the total number of accurately answered questions.",
          hi: "सही उत्तर दिए गए प्रश्नों की कुल संख्या को ट्रैक करने के लिए काउंटर शुरू करता है।"
        }
      },
      {
        lineNum: 5,
        code: `  const rationaleSummary: string[] = []; // Collect explanation notes for all questions`,
        comment: {
          en: "Initializes an array to aggregate pedagogical rationales for post-quiz review.",
          hi: "क्विज़ के बाद समीक्षा के लिए व्याख्याओं को एकत्रित करने हेतु ऐरे बनाता है।"
        }
      },
      {
        lineNum: 6,
        code: `  for (const q of questions) { // Iterate through each quiz question in sequence`,
        comment: {
          en: "Loops through each question in the quiz set to evaluate user selections.",
          hi: "शिक्षार्थी के विकल्पों का मूल्यांकन करने के लिए क्विज़ के प्रत्येक प्रश्न की जांच करता है।"
        }
      },
      {
        lineNum: 7,
        code: `    const isCorrect = userAnswers[q.id] === q.correctIndex; // Check if selected answer matches correct answer index`,
        comment: {
          en: "Validates if the user's submitted index strictly matches the designated correctIndex.",
          hi: "सत्यापित करता है कि क्या यूज़र का चुना हुआ विकल्प सही इंडेक्स से मेल खाता है।"
        }
      },
      {
        lineNum: 8,
        code: `    if (isCorrect) correctCount += 1; // Increment correct counter on match`,
        comment: {
          en: "Increments correct score count when the selection matches the key.",
          hi: "सही उत्तर होने पर सही गणना में एक की वृद्धि करता है।"
        }
      },
      {
        lineNum: 9,
        code: `    rationaleSummary.push(\`Q: \${q.prompt} -> \${isCorrect ? "CORRECT" : "INCORRECT"}. \${q.explanation}\`); // Record question result note`,
        comment: {
          en: "Appends the result label and explanation to help the learner understand mistakes.",
          hi: "शिक्षार्थी को गलतियां समझने में मदद करने के लिए परिणाम और स्पष्टीकरण जोड़ता है।"
        }
      },
      {
        lineNum: 10,
        code: `  } // End of question evaluation loop`,
        comment: {
          en: "Closes the question scoring loop.",
          hi: "प्रश्न मूल्यांकन लूप समाप्त करता है।"
        }
      },
      {
        lineNum: 11,
        code: `  const totalQuestions = questions.length; // Get total question count`,
        comment: {
          en: "Extracts total question count for denominator calculations.",
          hi: "प्रतिशत गणना के लिए कुल प्रश्नों की संख्या प्राप्त करता है।"
        }
      },
      {
        lineNum: 12,
        code: `  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0; // Calculate accuracy percentage`,
        comment: {
          en: "Calculates the student's accuracy as an integer percentage from 0% to 100%.",
          hi: "छात्र की सटीकता की गणना 0% से 100% के बीच पूर्णांक प्रतिशत के रूप में करता है।"
        }
      },
      {
        lineNum: 13,
        code: `  const score = correctCount * 10; // Calculate weighted scaled score (10 points per question)`,
        comment: {
          en: "Applies standard exam weighting assigning 10 score points per correct solution.",
          hi: "प्रत्येक सही उत्तर के लिए 10 अंक निर्धारित करते हुए कुल स्कोर की गणना करता है।"
        }
      },
      {
        lineNum: 14,
        code: `  return { score, accuracy, totalQuestions, correctCount, rationaleSummary }; // Return finalized evaluation report`,
        comment: {
          en: "Returns the finalized evaluation report to render score gauges and feedback summaries.",
          hi: "स्कोर और फीडबैक प्रदर्शित करने के लिए अंतिम मूल्यांकन रिपोर्ट लौटाता है।"
        }
      },
      {
        lineNum: 15,
        code: `} // End of evaluateQuizSubmission`,
        comment: {
          en: "Concludes quiz evaluation execution.",
          hi: "क्विज़ मूल्यांकन निष्पादन समाप्त करता है।"
        }
      }
    ]
  },

  // Interview Page
  interview: {
    id: "interview",
    filename: "lruCacheArchitecture.ts",
    language: "typescript",
    title: {
      en: "O(1) LRU Cache System Design Implementation",
      hi: "O(1) LRU कैश सिस्टम डिज़ाइन कार्यान्वयन"
    },
    description: {
      en: "Classical high-scale system design coding interview solution combining a Doubly Linked List with a Hash Map for O(1) reads and writes.",
      hi: "सिस्टम डिज़ाइन इंटरव्यू का क्लासिक प्रश्न: O(1) पढ़ने और लिखने के लिए डबली लिंक्ड लिस्ट और हैश मैप का संयोजन।"
    },
    lines: [
      {
        lineNum: 1,
        code: `class DoublyLinkedNode<K, V> { key: K; val: V; prev: DoublyLinkedNode<K, V> | null = null; next: DoublyLinkedNode<K, V> | null = null; constructor(key: K, val: V) { this.key = key; this.val = val; } } // Doubly linked list node`,
        comment: {
          en: "Defines the internal Doubly Linked List Node holding key, value, and forward/backward pointers for O(1) node detachment.",
          hi: "O(1) समय में नोड हटाने के लिए की, वैल्यू और आगे/पीछे के पॉइंटर्स रखने वाला डबली लिंक्ड लिस्ट नोड परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export class LRUCache<K, V> { // Main Least-Recently-Used (LRU) Cache class`,
        comment: {
          en: "Exports the production-ready LRU Cache class meeting strict O(1) time complexity bounds for both get() and put() operations.",
          hi: "get() और put() दोनों के लिए सख्त O(1) समय जटिलता वाला LRU कैश क्लास निर्यात करता है।"
        }
      },
      {
        lineNum: 3,
        code: `  private capacity: number; private map = new Map<K, DoublyLinkedNode<K, V>>(); private head = new DoublyLinkedNode<any, any>(null, null); private tail = new DoublyLinkedNode<any, any>(null, null); // Sentinel dummy head & tail`,
        comment: {
          en: "Declares storage capacity, node lookup map, and dummy sentinel head and tail nodes to eliminate edge-case null pointer checks.",
          hi: "क्षमता, मैप और नल पॉइंटर चेकिंग से बचने के लिए डमी हेड और टेल नोड्स घोषित करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  constructor(capacity: number) { this.capacity = Math.max(1, capacity); this.head.next = this.tail; this.tail.prev = this.head; } // Wire sentinel nodes`,
        comment: {
          en: "Initializes the cache with positive capacity and binds sentinel nodes together in an empty linked list.",
          hi: "सकारात्मक क्षमता के साथ कैश शुरू करता है और डमी नोड्स को एक खाली लिंक्ड लिस्ट में जोड़ता है।"
        }
      },
      {
        lineNum: 5,
        code: `  private removeNode(node: DoublyLinkedNode<K, V>): void { node.prev!.next = node.next; node.next!.prev = node.prev; } // Unlink node in O(1)`,
        comment: {
          en: "Detaches an existing node from its current position in the linked list in strict O(1) constant time.",
          hi: "लिंक्ड लिस्ट से किसी नोड को O(1) समय में तुरंत अलग करता है।"
        }
      },
      {
        lineNum: 6,
        code: `  private insertToHead(node: DoublyLinkedNode<K, V>): void { node.next = this.head.next; node.prev = this.head; this.head.next!.prev = node; this.head.next = node; } // Insert at MRU head in O(1)`,
        comment: {
          en: "Inserts a node immediately after the dummy head, marking it as Most-Recently-Used (MRU).",
          hi: "नोड को हेड के तुरंत बाद जोड़ता है, जिससे यह सबसे हाल ही में उपयोग (MRU) बन जाता है।"
        }
      },
      {
        lineNum: 7,
        code: `  public get(key: K): V | undefined { // O(1) lookup method`,
        comment: {
          en: "Retrieves value by key in O(1) time and moves the accessed node to the MRU position.",
          hi: "O(1) समय में कुंजी द्वारा मान प्राप्त करता है और नोड को सबसे आगे (MRU) ले जाता है।"
        }
      },
      {
        lineNum: 8,
        code: `    const node = this.map.get(key); if (!node) return undefined; this.removeNode(node); this.insertToHead(node); return node.val; // Move to head and return`,
        comment: {
          en: "Returns undefined on cache miss; on cache hit, promotes the node to head and returns the stored value.",
          hi: "कैश मिस होने पर undefined देता है; मिलने पर नोड को हेड पर ले जाकर मान लौटाता है।"
        }
      },
      {
        lineNum: 9,
        code: `  } // End of get method`,
        comment: {
          en: "Closes the get() method.",
          hi: "get() मेथड समाप्त करता है।"
        }
      },
      {
        lineNum: 10,
        code: `  public put(key: K, val: V): void { // O(1) insertion and eviction method`,
        comment: {
          en: "Inserts or updates a key-value pair in O(1) time, evicting the Least-Recently-Used (LRU) node if at capacity.",
          hi: "O(1) समय में मान जोड़ता या अपडेट करता है, और क्षमता भरने पर सबसे पुराने (LRU) नोड को हटाता है।"
        }
      },
      {
        lineNum: 11,
        code: `    const existing = this.map.get(key); if (existing) { existing.val = val; this.removeNode(existing); this.insertToHead(existing); return; } // Update existing key`,
        comment: {
          en: "Updates existing node value and promotes it to the MRU position without changing capacity.",
          hi: "मौजूदा नोड का मान अपडेट करता है और क्षमता बदले बिना उसे सबसे आगे ले जाता है।"
        }
      },
      {
        lineNum: 12,
        code: `    if (this.map.size >= this.capacity) { const lru = this.tail.prev!; this.removeNode(lru); this.map.delete(lru.key); } // Evict LRU tail item`,
        comment: {
          en: "Evicts the least-recently-used node adjacent to the tail and deletes its entry from the map when capacity is reached.",
          hi: "क्षमता पूरी होने पर टेल के पास वाले सबसे पुराने नोड को हटाता है और मैप से उसकी कुंजी डिलीट करता है।"
        }
      },
      {
        lineNum: 13,
        code: `    const newNode = new DoublyLinkedNode(key, val); this.insertToHead(newNode); this.map.set(key, newNode); // Insert fresh MRU node`,
        comment: {
          en: "Creates the new node, prepends it at the head, and indexes it in the map for instant lookup.",
          hi: "नया नोड बनाता है, इसे हेड पर जोड़ता है और त्वरित खोज के लिए मैप में दर्ज करता है।"
        }
      },
      {
        lineNum: 14,
        code: `  } // End of put method`,
        comment: {
          en: "Closes the put() method.",
          hi: "put() मेथड समाप्त करता है।"
        }
      },
      {
        lineNum: 15,
        code: `} // End of LRUCache class`,
        comment: {
          en: "Concludes LRUCache class declaration.",
          hi: "LRUCache क्लास घोषणा समाप्त करता है।"
        }
      }
    ]
  },

  // Mentors Page
  mentors: {
    id: "mentors",
    filename: "mentorPromptDirector.ts",
    language: "typescript",
    title: {
      en: "AI Mentor Persona & Review Orchestrator",
      hi: "एआई मेंटर पर्सोना और समीक्षा समन्वयक"
    },
    description: {
      en: "Role-conditioned mentor engine constructing structured code critiques and career roadmaps using specialized system instructions.",
      hi: "भूमिका-आधारित मेंटर इंजन जो विशेष सिस्टम निर्देशों का उपयोग करके संरचित कोड समीक्षा और करियर रोडमैप तैयार करता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type MentorRole = "architect" | "exam_coach" | "code_reviewer" | "career_advisor"; // Available mentor persona types`,
        comment: {
          en: "Enumerates the specialized mentor personas available for personalized guidance sessions.",
          hi: "व्यक्तिगत मार्गदर्शन सत्रों के लिए उपलब्ध विशेषज्ञ मेंटर पर्सोना प्रकारों को सूचीबद्ध करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export function buildMentorSystemPrompt(role: MentorRole, targetGoal: string): string { // System prompt builder function`,
        comment: {
          en: "Constructs tailored LLM system instructions enforcing professional tone, structured critique, and actionable next steps.",
          hi: "पेशेवर टोन, संरचित समीक्षा और कार्रवाई योग्य कदमों को लागू करने वाले सिस्टम निर्देश तैयार करता है।"
        }
      },
      {
        lineNum: 3,
        code: `  const baseGuidelines = "You are a master mentor on MasterClass. Provide concise, constructive guidance with concrete examples and zero fluff."; // Base core rules`,
        comment: {
          en: "Sets baseline behavioral rules demanding concrete examples and high information density.",
          hi: "ठोस उदाहरणों और उच्च गुणवत्ता वाली जानकारी की मांग करने वाले बुनियादी नियम निर्धारित करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  switch (role) { // Branch based on chosen mentor persona`,
        comment: {
          en: "Branches into persona-specific guidance mandates based on the requested mentor specialty.",
          hi: "चयनित मेंटर विशेषज्ञता के आधार पर विशेष मार्गदर्शन निर्देशों में विभाजित होता है।"
        }
      },
      {
        lineNum: 5,
        code: `    case "architect": return \`\${baseGuidelines} Role: Senior Principal Architect. Focus on scalability, fault-tolerance, CAP theorem trade-offs, and microservice boundaries. Learner goal: \${targetGoal}\`; // Architect persona`,
        comment: {
          en: "Configures the Principal Architect persona focused on distributed systems and architectural trade-offs.",
          hi: "डिस्ट्रिब्यूटेड सिस्टम्स और आर्किटेक्चरल ट्रेड-ऑफ पर केंद्रित प्रिंसिपल आर्किटेक्ट पर्सोना सेट करता है।"
        }
      },
      {
        lineNum: 6,
        code: `    case "exam_coach": return \`\${baseGuidelines} Role: National Exam Strategy Coach. Focus on high-yield chapters, time management per section, and avoiding negative marking. Target: \${targetGoal}\`; // Exam Coach persona`,
        comment: {
          en: "Configures the Exam Strategy Coach persona prioritizing score optimization and time management.",
          hi: "अधिकतम अंक और समय प्रबंधन को प्राथमिकता देने वाला परीक्षा रणनीति कोच पर्सोना सेट करता है।"
        }
      },
      {
        lineNum: 7,
        code: `    case "code_reviewer": return \`\${baseGuidelines} Role: Staff Software Engineer (Code Review). Critique edge-cases, cyclomatic complexity, memory leaks, and clean code principles. Project: \${targetGoal}\`; // Reviewer persona`,
        comment: {
          en: "Configures the Staff Code Reviewer persona emphasizing security, memory hygiene, and idiomatic clean code.",
          hi: "सुरक्षा, मेमोरी और साफ़ कोड सिद्धांतों पर जोर देने वाला स्टाफ कोड समीक्षक पर्सोना सेट करता है।"
        }
      },
      {
        lineNum: 8,
        code: `    default: return \`\${baseGuidelines} Role: Career & Study Advisor. Focus on structured weekly study plans and interview readiness for: \${targetGoal}\`; // General advisor`,
        comment: {
          en: "Default fallback persona delivering structured career planning and milestone setting.",
          hi: "संरचित करियर योजना और अध्ययन लक्ष्य निर्धारित करने वाला डिफ़ॉल्ट सलाहकार पर्सोना।"
        }
      },
      {
        lineNum: 9,
        code: `  } // End of switch statement`,
        comment: {
          en: "Closes persona selection switch block.",
          hi: "पर्सोना चयन ब्लॉक समाप्त करता है।"
        }
      },
      {
        lineNum: 10,
        code: `} // End of buildMentorSystemPrompt`,
        comment: {
          en: "Concludes prompt director execution.",
          hi: "प्रॉम्प्ट निर्माण समाप्त करता है।"
        }
      }
    ]
  },

  // Category Preparation Hub
  category: {
    id: "category",
    filename: "syllabusWeightageAnalyzer.ts",
    language: "typescript",
    title: {
      en: "Exam Board Syllabus Weightage Analyzer",
      hi: "परीक्षा बोर्ड पाठ्यक्रम अंक-भार विश्लेषक"
    },
    description: {
      en: "Syllabus analytics engine scoring high-yield chapters, prioritizing recurring topics, and organizing revision schedules.",
      hi: "पाठ्यक्रम विश्लेषण इंजन जो महत्वपूर्ण अध्यायों को अंक देता है, बार-बार पूछे जाने वाले विषयों को प्राथमिकता देता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type ChapterWeight = { chapterId: string; title: string; estimatedMarks: number; difficulty: "low" | "medium" | "high"; priorityScore: number }; // Chapter weightage schema`,
        comment: {
          en: "Defines the chapter analysis contract tracking estimated exam marks, subjective difficulty, and computed study priority.",
          hi: "परीक्षा अंक, कठिनाई स्तर और अध्ययन प्राथमिकता स्कोर को ट्रैक करने वाले स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export function rankChaptersByYield(chapters: Omit<ChapterWeight, "priorityScore">[]): ChapterWeight[] { // High-yield ranking function`,
        comment: {
          en: "Ranks curriculum chapters by a high-yield priority formula that balances expected exam marks against cognitive effort.",
          hi: "एक विशेष सूत्र द्वारा अध्यायों को रैंक करता है जो अपेक्षित अंकों और अध्ययन प्रयास का संतुलन बनाता है।"
        }
      },
      {
        lineNum: 3,
        code: `  const difficultyWeights = { low: 1.2, medium: 1.0, high: 0.8 }; // Weight multipliers rewarding high-efficiency revision`,
        comment: {
          en: "Assigns multiplier weights: lower difficulty chapters with high marks deliver the highest return on study time.",
          hi: "कम कठिनाई वाले अधिक अंकों के अध्यायों को अधिक प्राथमिकता देने के लिए मल्टीप्लायर सेट करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  const scored = chapters.map(chap => { // Calculate priority score for each syllabus chapter`,
        comment: {
          en: "Iterates through chapters calculating custom priority scores based on marks and difficulty coefficients.",
          hi: "अंकों और कठिनाई के आधार पर प्रत्येक अध्याय के लिए प्राथमिकता स्कोर की गणना करता है।"
        }
      },
      {
        lineNum: 5,
        code: `    const multiplier = difficultyWeights[chap.difficulty] || 1.0; // Retrieve difficulty multiplier`,
        comment: {
          en: "Extracts difficulty multiplier with a safe 1.0 default fallback.",
          hi: "सुरक्षित 1.0 डिफ़ॉल्ट के साथ कठिनाई मल्टीप्लायर निकालता है।"
        }
      },
      {
        lineNum: 6,
        code: `    const priorityScore = Math.round(chap.estimatedMarks * multiplier * 10) / 10; // Compute scaled priority score`,
        comment: {
          en: "Calculates priority score rounded cleanly to one decimal place.",
          hi: "प्राथमिकता स्कोर की गणना एक दशमलव स्थान तक करता है।"
        }
      },
      {
        lineNum: 7,
        code: `    return { ...chap, priorityScore }; // Return chapter with computed priority score`,
        comment: {
          en: "Merges the calculated priority score into the chapter record.",
          hi: "अध्याय रिकॉर्ड में गणना किए गए प्राथमिकता स्कोर को जोड़ता है।"
        }
      },
      {
        lineNum: 8,
        code: `  }); // End of map iteration`,
        comment: {
          en: "Closes the chapter scoring map transformation.",
          hi: "अध्याय स्कोरिंग मैपिंग समाप्त करता है।"
        }
      },
      {
        lineNum: 9,
        code: `  return scored.sort((a, b) => b.priorityScore - a.priorityScore); // Sort descending so highest yield topics lead the study plan`,
        comment: {
          en: "Sorts the chapters in descending order so learners tackle maximum-yield topics first.",
          hi: "अध्यायों को घटते क्रम में व्यवस्थित करता है ताकि सबसे अधिक अंक देने वाले विषय पहले पढ़े जाएं।"
        }
      },
      {
        lineNum: 10,
        code: `} // End of rankChaptersByYield`,
        comment: {
          en: "Concludes syllabus weightage analyzer execution.",
          hi: "पाठ्यक्रम विश्लेषक निष्पादन समाप्त करता है।"
        }
      }
    ]
  },

  // My Library Tab
  library: {
    id: "library",
    filename: "documentVaultSync.ts",
    language: "typescript",
    title: {
      en: "Personal Study Vault & Markdown Exporter",
      hi: "व्यक्तिगत अध्ययन वॉल्ट और मार्कडाउन निर्यातक"
    },
    description: {
      en: "Document synchronization utility managing offline saved curricula, formatted Markdown export, and deletion safety confirmations.",
      hi: "दस्तावेज़ समन्वय उपयोगिता जो सहेजे गए पाठ्यक्रमों, मार्कडाउन निर्यात और विलोपन पुष्टि का प्रबंधन करती है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export type SavedCurriculum = { id: string; title: string; minutes: number; summary: string; lessons: Array<{ title: string; content: string }> }; // Saved curriculum schema`,
        comment: {
          en: "Defines the saved curriculum model holding title, estimated reading duration, summary, and lessons array.",
          hi: "शीर्षक, अनुमानित पठन समय, सारांश और पाठों की सूची रखने वाले सहेजे गए पाठ्यक्रम स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export function formatCurriculumToMarkdown(doc: SavedCurriculum): string { // Clean markdown generator`,
        comment: {
          en: "Transforms a structured curriculum object into clean, formatted GitHub-flavored Markdown text for export.",
          hi: "संरचित पाठ्यक्रम ऑब्जेक्ट को निर्यात के लिए साफ़, सुंदर मार्कडाउन टेक्स्ट में बदलता है।"
        }
      },
      {
        lineNum: 3,
        code: `  const lines: string[] = []; // Output markdown lines buffer`,
        comment: {
          en: "Initializes the string buffer accumulating formatted markdown lines.",
          hi: "मार्कडाउन लाइनों को जोड़ने के लिए स्ट्रिंग बफ़र बनाता है।"
        }
      },
      {
        lineNum: 4,
        code: `  lines.push(\`# \${doc.title}\`); // Add primary top-level document heading`,
        comment: {
          en: "Appends the H1 title line conforming to standard Markdown document structure.",
          hi: "मानक मार्कडाउन संरचना के अनुसार मुख्य H1 शीर्षक जोड़ता है।"
        }
      },
      {
        lineNum: 5,
        code: `  lines.push(\`> Estimated Study Duration: \${doc.minutes} minutes\\n\`); // Add metadata callout quote`,
        comment: {
          en: "Formats an alert quote block highlighting total estimated study duration.",
          hi: "कुल अध्ययन समय को दर्शाने वाला एक ब्लॉककोट जोड़ता है।"
        }
      },
      {
        lineNum: 6,
        code: `  lines.push(\`## Executive Summary\\n\${doc.summary}\\n\`); // Add executive summary section`,
        comment: {
          en: "Renders the core executive summary section with clean newline separation.",
          hi: "स्पष्ट रिक्त स्थान के साथ मुख्य सारांश अनुभाग जोड़ता है।"
        }
      },
      {
        lineNum: 7,
        code: `  lines.push("## Detailed Lesson Breakdown\\n"); // Add lessons header`,
        comment: {
          en: "Inserts the section header introducing detailed curriculum lesson breakdowns.",
          hi: "विस्तृत पाठ विवरण शुरू करने वाला हेडर जोड़ता है।"
        }
      },
      {
        lineNum: 8,
        code: `  doc.lessons.forEach((lesson, index) => { lines.push(\`### \${index + 1}. \${lesson.title}\\n\${lesson.content}\\n\`); }); // Render each lesson`,
        comment: {
          en: "Iterates through each lesson unit, appending numbered H3 headings and body content.",
          hi: "प्रत्येक पाठ में क्रमांकित H3 हेडर और सामग्री जोड़ता है।"
        }
      },
      {
        lineNum: 9,
        code: `  return lines.join("\\n"); // Join buffer lines with newlines into a cohesive document string`,
        comment: {
          en: "Joins all buffered lines with newline characters into a complete exportable Markdown string.",
          hi: "सभी लाइनों को जोड़कर एक संपूर्ण निर्यात योग्य मार्कडाउन स्ट्रिंग लौटाता है।"
        }
      },
      {
        lineNum: 10,
        code: `} // End of formatCurriculumToMarkdown`,
        comment: {
          en: "Concludes Markdown formatter execution.",
          hi: "मार्कडाउन फ़ॉर्मेटर निष्पादन समाप्त करता है।"
        }
      }
    ]
  },

  // Plans & Membership Tab
  plans: {
    id: "plans",
    filename: "razorpayVerifyAction.ts",
    language: "typescript",
    title: {
      en: "Secure Razorpay Webhook Verification",
      hi: "सुरक्षित रेज़रपे वेबहुक सत्यापन"
    },
    description: {
      en: "Cryptographic HMAC-SHA256 signature verification server action authenticating Razorpay payment webhooks before upgrading user account tiers.",
      hi: "क्रिप्टोग्राफ़िक HMAC-SHA256 हस्ताक्षर सत्यापन जो भुगतान की पुष्टि के बाद ही यूज़र टियर अपग्रेड करता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `import crypto from "crypto"; // Import Node.js built-in cryptography module for secure HMAC generation`,
        comment: {
          en: "Imports Node.js native crypto module to perform cryptographic hash operations without third-party dependencies.",
          hi: "सुरक्षित हैश संचालन करने के लिए Node.js नेटिव क्रिप्टो मॉड्यूल आयात करता है।"
        }
      },
      {
        lineNum: 2,
        code: `export type PaymentVerificationPayload = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }; // Signature payload schema`,
        comment: {
          en: "Defines the payment payload contract containing Order ID, Payment ID, and cryptographic signature from Razorpay checkout.",
          hi: "रेज़रपे चेकआउट से ऑर्डर आईडी, भुगतान आईडी और हस्ताक्षर रखने वाले पेलोड स्कीमा को परिभाषित करता है।"
        }
      },
      {
        lineNum: 3,
        code: `export function verifyRazorpaySignature(payload: PaymentVerificationPayload, webhookSecret: string): boolean { // Cryptographic verification function`,
        comment: {
          en: "Verifies the authenticity of Razorpay payment payloads using constant-time timing-safe buffer comparisons.",
          hi: "टाइपिंग हमलों से सुरक्षा के लिए टाइमिंग-सेफ तुलना का उपयोग करके रेज़रपे भुगतान हस्ताक्षर की पुष्टि करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload; // Destructure required payment credentials`,
        comment: {
          en: "Extracts the order and payment identifiers used to assemble the expected cryptographic HMAC digest.",
          hi: "अपेक्षित HMAC डाइजेस्ट बनाने के लिए आवश्यक ऑर्डर और भुगतान आईडी निकालता है।"
        }
      },
      {
        lineNum: 5,
        code: `  const dataToSign = \`\${razorpay_order_id}|\${razorpay_payment_id}\`; // Format verification string per Razorpay API specification`,
        comment: {
          en: "Constructs the canonical verification string by joining order_id and payment_id with a pipe character per Razorpay specifications.",
          hi: "रेज़रपे नियमों के अनुसार पाइप वर्ण (|) के साथ ऑर्डर_आईडी और भुगतान_आईडी को जोड़कर सत्यापन स्ट्रिंग बनाता है।"
        }
      },
      {
        lineNum: 6,
        code: `  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(dataToSign).digest("hex"); // Generate HMAC-SHA256 digest`,
        comment: {
          en: "Computes the expected HMAC-SHA256 hex digest using the merchant account's private webhook secret.",
          hi: "व्यापारी खाते के निजी सीक्रेट का उपयोग करके अपेक्षित HMAC-SHA256 हेक्स डाइजेस्ट की गणना करता है।"
        }
      },
      {
        lineNum: 7,
        code: `  const expectedBuffer = Buffer.from(expectedSignature, "utf8"); // Convert expected signature to binary buffer`,
        comment: {
          en: "Converts expected signature string to an immutable byte buffer for constant-time comparison.",
          hi: "निरंतर-समय तुलना के लिए अपेक्षित हस्ताक्षर को बाइट बफ़र में बदलता है।"
        }
      },
      {
        lineNum: 8,
        code: `  const providedBuffer = Buffer.from(razorpay_signature, "utf8"); // Convert provided signature to binary buffer`,
        comment: {
          en: "Converts incoming client signature string to an immutable byte buffer.",
          hi: "इनकमिंग क्लाइंट हस्ताक्षर को बाइट बफ़र में बदलता है।"
        }
      },
      {
        lineNum: 9,
        code: `  if (expectedBuffer.length !== providedBuffer.length) return false; // Fail immediately if byte lengths mismatch`,
        comment: {
          en: "Prevents timing attacks by verifying length parity before running byte-by-byte comparisons.",
          hi: "तुलना से पहले लंबाई समानता की जांच करके टाइमिंग हमलों से सुरक्षा करता है।"
        }
      },
      {
        lineNum: 10,
        code: `  return crypto.timingSafeEqual(expectedBuffer, providedBuffer); // Constant-time equality check preventing timing attacks`,
        comment: {
          en: "Performs constant-time equality check, returning true only if the signature is mathematically authentic.",
          hi: "टाइमिंग-सुरक्षित जांच करता है, केवल तभी true लौटाता है जब हस्ताक्षर पूरी तरह प्रामाणिक हो।"
        }
      },
      {
        lineNum: 11,
        code: `} // End of verifyRazorpaySignature`,
        comment: {
          en: "Concludes signature verification function execution.",
          hi: "हस्ताक्षर सत्यापन समाप्त करता है।"
        }
      }
    ]
  },

  // Settings Tab
  settings: {
    id: "settings",
    filename: "secureCredentialsVault.ts",
    language: "typescript",
    title: {
      en: "Client-Side AES-GCM Key Encryption Vault",
      hi: "क्लाइंट-साइड AES-GCM की एन्क्रिप्शन वॉल्ट"
    },
    description: {
      en: "Web Crypto API implementation encrypting and decrypting custom user AI API keys in browser storage using AES-GCM 256-bit encryption.",
      hi: "Web Crypto API कार्यान्वयन जो ब्राउज़र में AES-GCM 256-बिट एन्क्रिप्शन का उपयोग करके कस्टम एआई एपीआई कीज को सुरक्षित रखता है।"
    },
    lines: [
      {
        lineNum: 1,
        code: `export async function encryptApiKey(apiKey: string, userSecret: string): Promise<{ ciphertext: string; iv: string; salt: string }> { // AES-GCM encryption function`,
        comment: {
          en: "Encrypts sensitive user API keys client-side using industry-standard AES-GCM with PBKDF2 key derivation.",
          hi: "PBKDF2 और AES-GCM का उपयोग करके यूज़र की निजी एपीआई कीज को ब्राउज़र में सुरक्षित रूप से एन्क्रिप्ट करता है।"
        }
      },
      {
        lineNum: 2,
        code: `  const encoder = new TextEncoder(); // Instantiate TextEncoder to transform strings into Uint8Array byte buffers`,
        comment: {
          en: "Instantiates TextEncoder utility to convert UTF-8 plaintext strings into raw binary Uint8Array buffers.",
          hi: "टेक्स्ट को बाइनरी बफ़र में बदलने के लिए TextEncoder का उदाहरण बनाता है।"
        }
      },
      {
        lineNum: 3,
        code: `  const salt = crypto.getRandomValues(new Uint8Array(16)); // Generate 16 bytes of cryptographically random salt`,
        comment: {
          en: "Generates 16 bytes of cryptographically secure random entropy for the PBKDF2 key derivation salt.",
          hi: "सुरक्षित एन्क्रिप्शन के लिए 16 बाइट्स का रैंडम सॉल्ट उत्पन्न करता है।"
        }
      },
      {
        lineNum: 4,
        code: `  const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate 12 bytes of random Initialization Vector (IV) for AES-GCM`,
        comment: {
          en: "Generates standard 12-byte initialization vector (IV) ensuring unique ciphertexts even for repeated encryptions.",
          hi: "AES-GCM के लिए 12-बाइट का इनिशियलाइज़ेशन वेक्टर (IV) उत्पन्न करता है।"
        }
      },
      {
        lineNum: 5,
        code: `  const rawKey = await crypto.subtle.importKey("raw", encoder.encode(userSecret), "PBKDF2", false, ["deriveKey"]); // Import secret for PBKDF2 derivation`,
        comment: {
          en: "Imports user passphrase into subtle crypto as a PBKDF2 base key material.",
          hi: "यूज़र पासवर्ड को PBKDF2 आधार सामग्री के रूप में आयात करता है।"
        }
      },
      {
        lineNum: 6,
        code: `  const aesKey = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, rawKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]); // Derive 256-bit AES-GCM key`,
        comment: {
          en: "Stretches password with 100,000 PBKDF2-SHA256 iterations to derive a secure 256-bit AES-GCM key resistant to brute-forcing.",
          hi: "मजबूत सुरक्षा के लिए 100,000 पुनरावृत्तियों के साथ 256-बिट AES-GCM कुंजी प्राप्त करता है।"
        }
      },
      {
        lineNum: 7,
        code: `  const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoder.encode(apiKey)); // Encrypt plaintext API key`,
        comment: {
          en: "Encrypts the plaintext API key buffer with authenticated AES-GCM encryption.",
          hi: "AES-GCM एन्क्रिप्शन के साथ प्लेनटेक्स्ट एपीआई की को एन्क्रिप्ट करता है।"
        }
      },
      {
        lineNum: 8,
        code: `  const toHex = (buf: Uint8Array) => Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join(""); // Helper: byte buffer to hex string`,
        comment: {
          en: "Helper function serializing binary byte arrays into safe hex strings for local storage persistence.",
          hi: "लोकल स्टोरेज में सहेजने के लिए बाइनरी बफ़र को हेक्स स्ट्रिंग में बदलने वाला सहायक फ़ंक्शन।"
        }
      },
      {
        lineNum: 9,
        code: `  return { ciphertext: toHex(new Uint8Array(encryptedBuffer)), iv: toHex(iv), salt: toHex(salt) }; // Return hex payload`,
        comment: {
          en: "Returns hex-encoded ciphertext, initialization vector, and salt ready to be saved in client storage.",
          hi: "ब्राउज़र में सहेजने के लिए हेक्स-एन्कोडेड सिफरटेक्स्ट, IV और सॉल्ट लौटाता है।"
        }
      },
      {
        lineNum: 10,
        code: `} // End of encryptApiKey`,
        comment: {
          en: "Concludes client-side encryption execution.",
          hi: "क्लाइंट-साइड एन्क्रिप्शन समाप्त करता है।"
        }
      }
    ]
  }
};

/**
 * Resolves the appropriate code example for the current dashboard view.
 */
export function resolveCodeExample(category?: string, tab?: string): CodeExample {
  if (category) {
    if (DASHBOARD_CODE_EXAMPLES[category]) {
      return DASHBOARD_CODE_EXAMPLES[category];
    }
    // Dynamic category (e.g. cbse, ssc, technology)
    return {
      ...DASHBOARD_CODE_EXAMPLES.category,
      title: {
        en: `${category.toUpperCase()} · Syllabus & Weightage Algorithm`,
        hi: `${category.toUpperCase()} · पाठ्यक्रम एवं अंक-भार एल्गोरिदम`
      }
    };
  }

  if (tab && DASHBOARD_CODE_EXAMPLES[tab]) {
    return DASHBOARD_CODE_EXAMPLES[tab];
  }

  return DASHBOARD_CODE_EXAMPLES.dashboard;
}
