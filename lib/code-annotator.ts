/**
 * Code Annotator Utility
 * Adds precise, informative code-level explanation comments for each line of code
 * across code blocks, IDE components, and worked examples throughout the application.
 */

interface AnnotationRule {
  test: RegExp;
  comment: (match: RegExpMatchArray, line: string, filepath?: string) => string;
}

const JS_TS_RULES: AnnotationRule[] = [
  // Directives
  {
    test: /^\s*['"]use (client|server)['"]\s*;?\s*$/,
    comment: (m) =>
      m[1] === "client"
        ? "// Directive: Mark component as client-rendered for interactive browser execution"
        : "// Directive: Mark module exports as secure Server Functions callable from client",
  },
  // Arcjet Imports & Inits
  {
    test: /import\s+arcjet\s*,?\s*\{([^}]+)\}\s+from\s+['"]@arcjet\/next['"]/,
    comment: (m) =>
      `// Import Arcjet security SDK and protection rules: ${m[1].trim()}`,
  },
  {
    test: /(?:const|let|var|export const)\s+(\w+)\s*=\s*arcjet\s*\(/,
    comment: (m) =>
      `// Initialize Arcjet security client instance '${m[1]}'`,
  },
  {
    test: /^\s*key:\s*process\.env\.ARCJET_KEY/,
    comment: () =>
      "// Retrieve Arcjet secret key from environment variables with fallback",
  },
  {
    test: /^\s*rules:\s*\[/,
    comment: () =>
      "// Define layered security rules applied to evaluate incoming requests",
  },
  {
    test: /shield\s*\(/,
    comment: () =>
      "// Shield: Detect and mitigate common web attacks, XSS, and SQL injection",
  },
  {
    test: /detectBot\s*\(/,
    comment: () =>
      "// Bot Detection: Block malicious scrapers while permitting search crawlers",
  },
  {
    test: /email\s*\(/,
    comment: () =>
      "// Email Validation: Reject disposable, spoofed, or invalid domain signups",
  },
  {
    test: /(?:fixedWindow|slidingWindow)\s*\(/,
    comment: () =>
      "// Rate Limiter: Enforce request quota within specified time window",
  },
  // Next.js & Server Imports
  {
    test: /import\s+type\s+\{\s*NextRequest\s*\}\s+from\s+['"]next\/server['"]/,
    comment: () =>
      "// Import NextRequest type definition for Next.js edge request handling",
  },
  {
    test: /import\s+\{\s*NextResponse\s*\}\s+from\s+['"]next\/server['"]/,
    comment: () =>
      "// Import NextResponse utility for routing, JSON responses, and redirects",
  },
  {
    test: /import\s+\{([^}]+)\}\s+from\s+['"]next\/server['"]/,
    comment: (m) =>
      `// Import Next.js server helpers (${m[1].trim()}) for HTTP response control`,
  },
  {
    test: /import\s+\{([^}]+)\}\s+from\s+['"]next\/headers['"]/,
    comment: (m) =>
      `// Import Next.js headers utility (${m[1].trim()}) for server cookies and request headers`,
  },
  {
    test: /import\s+\{([^}]+)\}\s+from\s+['"]next\/navigation['"]/,
    comment: (m) =>
      `// Import Next.js navigation utilities (${m[1].trim()}) for routing and redirects`,
  },
  // Upstash & Redis
  {
    test: /import\s+\{([^}]+)\}\s+from\s+['"]@upstash\/redis['"]/,
    comment: () =>
      "// Import Upstash Redis serverless client for global HTTP caching and storage",
  },
  {
    test: /import\s+\{([^}]+)\}\s+from\s+['"]@upstash\/ratelimit['"]/,
    comment: () =>
      "// Import Upstash Ratelimit sliding-window protection algorithm",
  },
  // Inngest
  {
    test: /import\s+\{([^}]+)\}\s+from\s+['"]inngest['"]/,
    comment: () =>
      "// Import Inngest SDK for durable, event-driven background workflow execution",
  },
  // Conform & Zod
  {
    test: /import\s+\{([^}]+)\}\s+from\s+['"]@conform-to\/(?:react|zod.*)['"]/,
    comment: (m) =>
      `// Import Conform form validation adapter (${m[1].trim()}) for client/server forms`,
  },
  {
    test: /import\s+\{\s*z\s*\}\s+from\s+['"]zod['"]|import\s+z\s+from\s+['"]zod['"]/,
    comment: () =>
      "// Import Zod schema declaration and type validation library",
  },
  // General Imports
  {
    test: /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/,
    comment: (m) =>
      `// Import named utilities (${m[1].trim().replace(/\s+as\s+\w+/g, "")}) from '${m[2]}'`,
  },
  {
    test: /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,
    comment: (m) =>
      `// Import default export '${m[1]}' from module '${m[2]}'`,
  },
  {
    test: /import\s+['"]([^'"]+)['"]/,
    comment: (m) =>
      `// Load module '${m[1]}' for side effects`,
  },
  // Middleware & Route Handlers
  {
    test: /export\s+async\s+function\s+middleware\s*\(/,
    comment: () =>
      "// Export Next.js edge middleware to inspect and filter all incoming requests",
  },
  {
    test: /export\s+(?:async\s+)?function\s+proxy\s*\(/,
    comment: () =>
      "// Export Next.js Edge Proxy to handle authentication, security, and routing",
  },
  {
    test: /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/,
    comment: (m) =>
      `// Handle HTTP ${m[1]} request endpoint`,
  },
  {
    test: /export\s+default\s+async\s+function\s+(\w+)\s*\(/,
    comment: (m) =>
      `// Export async default component '${m[1]}' for server-side rendering`,
  },
  {
    test: /export\s+default\s+function\s+(\w+)\s*\(/,
    comment: (m) =>
      `// Export main component '${m[1]}'`,
  },
  // Arcjet Protection Execution
  {
    test: /const\s+(\w+)\s*=\s*await\s+aj\.protect\s*\(/,
    comment: (m) =>
      `// Execute Arcjet security evaluation and capture decision into '${m[1]}'`,
  },
  {
    test: /if\s*\(\s*(\w+)\.isDenied\s*\(\s*\)\s*\)/,
    comment: () =>
      "// Check if request is blocked by bot detection, rate limits, or attack shield",
  },
  {
    test: /return\s+NextResponse\.json\s*\(\s*\{\s*error:\s*['"]blocked['"]/,
    comment: () =>
      "// Terminate request and return HTTP 403 Forbidden with security denial reason",
  },
  {
    test: /return\s+NextResponse\.next\s*\(\s*\)/,
    comment: () =>
      "// Allow request to proceed to application route handler",
  },
  // Matcher Config
  {
    test: /export\s+const\s+config\s*=\s*\{\s*matcher:/,
    comment: () =>
      "// Configure route matcher to filter paths and bypass static files and images",
  },
  // Body parsing & State
  {
    test: /const\s+body\s*=\s*await\s+req\.json\s*\(/,
    comment: () =>
      "// Parse JSON payload from incoming HTTP request body",
  },
  {
    test: /const\s+formData\s*=\s*await\s+req\.formData\s*\(/,
    comment: () =>
      "// Extract multipart form data submitted by user",
  },
  {
    test: /const\s+parsed\s*=\s*schema\.safeParse\s*\(/,
    comment: () =>
      "// Validate form input against Zod schema and collect type-safe data or errors",
  },
  {
    test: /const\s+store\s*=\s*await\s+cookies\s*\(/,
    comment: () =>
      "// Await incoming cookie jar from Next.js server headers",
  },
  {
    test: /store\.set\s*\(/,
    comment: () =>
      "// Write secure HTTP-only session cookie to response headers",
  },
  {
    test: /redirect\s*\(/,
    comment: () =>
      "// Terminate handler and trigger server-side URL redirect",
  },
  // Zod schemas
  {
    test: /const\s+(\w+Schema|\w+)\s*=\s*z\.object\s*\(/,
    comment: (m) =>
      `// Define Zod object schema for '${m[1]}' field validation`,
  },
  // React Hooks
  {
    test: /const\s+\[(\w+),\s*(\w+)\]\s*=\s*useState/,
    comment: (m) =>
      `// Initialize React state '${m[1]}' with updater function '${m[2]}'`,
  },
  {
    test: /const\s+\[(\w+),\s*(\w+),\s*(\w+)\]\s*=\s*useActionState/,
    comment: (m) =>
      `// Hook form state '${m[1]}', dispatch action '${m[2]}', and pending status '${m[3]}'`,
  },
  {
    test: /useEffect\s*\(/,
    comment: () =>
      "// Run lifecycle side-effect on component mount and dependency changes",
  },
  // Return statements
  {
    test: /return\s+NextResponse\.json\s*\(/,
    comment: () =>
      "// Return structured JSON response with appropriate HTTP status",
  },
  {
    test: /return\s+NextResponse\.redirect\s*\(/,
    comment: () =>
      "// Return HTTP redirect response to destination URL",
  },
  {
    test: /return\s+\(\s*<form/,
    comment: () =>
      "// Render interactive HTML form with server action binding",
  },
];

const SHELL_RULES: AnnotationRule[] = [
  {
    test: /npx\s+create-next-app/,
    comment: () => "# Scaffold a new Next.js TypeScript project",
  },
  {
    test: /(?:npm|pnpm|yarn)\s+(?:install|add)/,
    comment: () => "# Install project dependency packages",
  },
  {
    test: /(?:npm|pnpm)\s+run\s+dev/,
    comment: () => "# Launch local development server with hot reload",
  },
  {
    test: /curl\s+/,
    comment: () => "# Test HTTP endpoint response and headers via curl",
  },
  {
    test: /git\s+/,
    comment: () => "# Execute git version control command",
  },
];

const PYTHON_RULES: AnnotationRule[] = [
  {
    test: /from\s+(\S+)\s+import\s+(.+)/,
    comment: (m) => `# Import ${m[2].trim()} from ${m[1]} module`,
  },
  {
    test: /import\s+(\S+)/,
    comment: (m) => `# Import module ${m[1]}`,
  },
  {
    test: /def\s+(\w+)\s*\(/,
    comment: (m) => `# Define function '${m[1]}'`,
  },
  {
    test: /class\s+(\w+)/,
    comment: (m) => `# Define class '${m[1]}'`,
  },
  {
    test: /return\s+/,
    comment: () => "# Return computation result to caller",
  },
];

/**
 * Checks if a line is already a comment or empty
 */
function isCommentOrEmpty(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed === "" ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("<!--")
  );
}

/**
 * Derives a line comment for a given line of code.
 */
export function getLineComment(
  line: string,
  language: string = "typescript",
  filepath?: string
): string | null {
  const trimmed = line.trim();
  if (isCommentOrEmpty(trimmed)) return null;

  // Select appropriate rule set
  const rules =
    language === "python"
      ? PYTHON_RULES
      : language === "bash" || language === "sh" || language === "shell"
      ? SHELL_RULES
      : JS_TS_RULES;

  for (const rule of rules) {
    const match = line.match(rule.test);
    if (match) {
      return rule.comment(match, line, filepath);
    }
  }

  // Fallback heuristic explanations for common code structures
  if (/^const\s+\w+\s*=/.test(trimmed)) {
    const varName = trimmed.match(/^const\s+(\w+)/)?.[1] || "variable";
    return `// Declare constant '${varName}'`;
  }
  if (/^let\s+\w+\s*=/.test(trimmed)) {
    const varName = trimmed.match(/^let\s+(\w+)/)?.[1] || "variable";
    return `// Declare mutable variable '${varName}'`;
  }
  if (/^if\s*\(/.test(trimmed)) {
    return "// Evaluate conditional branch check";
  }
  if (/^return\s+/.test(trimmed)) {
    return "// Return computed output";
  }
  if (/^await\s+/.test(trimmed)) {
    return "// Await asynchronous operation resolution";
  }
  if (/<\w+/.test(trimmed) && />/.test(trimmed)) {
    const tagName = trimmed.match(/<(\w+)/)?.[1] || "element";
    return `// Render JSX <${tagName}> component element`;
  }

  return null;
}

/**
 * Annotates a multi-line code string so each code line has an explanatory comment.
 * If the line already has a comment or is purely formatting, it preserves it cleanly.
 */
export function annotateCodeWithComments(
  code: string,
  filepath?: string,
  language: string = "typescript"
): string {
  if (!code || typeof code !== "string") return code;

  const lines = code.split("\n");
  const annotated: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Preserve empty lines
    if (!trimmed) {
      annotated.push(line);
      continue;
    }

    // Preserve existing standalone comments
    if (isCommentOrEmpty(trimmed)) {
      annotated.push(line);
      continue;
    }

    // Check if the previous line was already a comment
    const prevLine = i > 0 ? lines[i - 1].trim() : "";
    const hasPrecedingComment =
      prevLine.startsWith("//") || prevLine.startsWith("/*") || prevLine.startsWith("#");

    // Skip redundant comment generation if the author already provided one right above
    if (hasPrecedingComment) {
      annotated.push(line);
      continue;
    }

    // Generate line-level explanation comment
    const comment = getLineComment(line, language, filepath);
    if (comment) {
      const indent = line.match(/^(\s*)/)?.[1] || "";
      annotated.push(`${indent}${comment}`);
    }

    annotated.push(line);
  }

  return annotated.join("\n");
}
