/**
 * Brand marks for the technology screens.
 *
 * Artwork comes from simple-icons, which publishes its SVGs under CC0, so the
 * files can ship inside the app without a credit line. A handful of companies
 * (Amazon, Oracle, Slack, OpenAI) asked simple-icons to drop their marks; those
 * are deliberately absent here and fall back either to a PNG the project
 * already owns or to the generated SVG icon resolvers.
 *
 * `scripts/build-media.mjs` reads BRAND_SLUGS, writes one SVG per entry into
 * `public/images/brands/`, and fails loudly if a slug no longer resolves — so a
 * simple-icons upgrade that renames or removes a mark breaks the build script
 * rather than silently shipping a missing image.
 */

/** Brand key as the app names it, mapped to the simple-icons slug that draws it. */
export const BRAND_SLUGS: Record<string, string> = {
  react: "react", nextjs: "nextdotjs", typescript: "typescript", javascript: "javascript",
  nodejs: "nodedotjs", nestjs: "nestjs", graphql: "graphql", python: "python",
  cypress: "cypress", jest: "jest", vitest: "vitest", "testing-library": "testinglibrary",
  docker: "docker", kubernetes: "kubernetes", terraform: "terraform", "github-actions": "githubactions",
  langchain: "langchain", n8n: "n8n", anthropic: "anthropic", claude: "claude",
  "react-query": "reactquery", redux: "redux", postgresql: "postgresql", redis: "redis",
  mongodb: "mongodb", mysql: "mysql", sqlite: "sqlite", elasticsearch: "elasticsearch",
  kafka: "apachekafka", rabbitmq: "rabbitmq", spark: "apachespark", supabase: "supabase",
  vercel: "vercel", prisma: "prisma", drizzle: "drizzle", trpc: "trpc",
  tailwind: "tailwindcss", sass: "sass", bootstrap: "bootstrap", mui: "mui",
  figma: "figma", git: "git", github: "github", gitlab: "gitlab", linux: "linux",
  nginx: "nginx", grafana: "grafana", prometheus: "prometheus", sentry: "sentry",
  jenkins: "jenkins", jira: "jira", notion: "notion", storybook: "storybook",
  webpack: "webpack", vite: "vite", babel: "babel", esbuild: "esbuild", swc: "swc",
  eslint: "eslint", prettier: "prettier", biome: "biome", turborepo: "turborepo", nx: "nx",
  npm: "npm", pnpm: "pnpm", yarn: "yarn", bun: "bun", deno: "deno",
  html: "html5", css: "css", go: "go", rust: "rust", php: "php", kotlin: "kotlin", swift: "swift",
  spring: "spring", django: "django", flask: "flask", fastapi: "fastapi", express: "express",
  pandas: "pandas", numpy: "numpy", "scikit-learn": "scikitlearn", pytorch: "pytorch",
  tensorflow: "tensorflow", jupyter: "jupyter", huggingface: "huggingface",
  "google-cloud": "googlecloud", cloudflare: "cloudflare", stripe: "stripe", razorpay: "razorpay",
  clerk: "clerk", auth0: "auth0", puppeteer: "puppeteer", selenium: "selenium",
  mocha: "mocha", cucumber: "cucumber", k6: "k6", postman: "postman", swagger: "swagger",
  astro: "astro", svelte: "svelte", vue: "vuedotjs", angular: "angular", remix: "remix",
  electron: "electron", expo: "expo", flutter: "flutter", dart: "dart",
  threejs: "threedotjs", socketio: "socketdotio",
  tanstack: "tanstack", neon: "neon", upstash: "upstash", betterauth: "betterauth",
};

/**
 * Brand keys served by a PNG the project already owns rather than simple-icons.
 *
 * These marks were withdrawn from simple-icons at the trademark holder's
 * request, so redistributing them from that package is not an option. The
 * files already under `public/images/tech/` stay the source for them.
 */
export const OWNED_BRAND_PNGS: Record<string, string> = {
  aws: "/images/tech/aws.png", playwright: "/images/tech/playwright.png",
  zustand: "/images/tech/zustand.png",
};

/**
 * Label patterns in the order they are tested, most specific first.
 *
 * Order carries the meaning here: "React Testing Library" has to match the
 * testing-library rule before the bare react rule, and "Node.js Packages" has
 * to beat a substring hit on next. Each entry is a regular expression so a rule
 * can require a word boundary where a bare substring would over-match.
 */
const RULES: readonly (readonly [RegExp, string])[] = [
  [/react\s*testing\s*library|@testing-library/, "testing-library"],
  [/\bnext\.?js\b|^next$|^@?next\//, "nextjs"],
  [/\bnest\.?js\b|@nestjs\//, "nestjs"],
  [/\bnode\.?js\b|^node$/, "nodejs"],
  [/\btanstack\b|react-query|@tanstack\//, "tanstack"],
  [/\bplaywright\b|@playwright\//, "playwright"],
  [/\bzustand\b/, "zustand"],
  [/\bgithub\s*actions\b/, "github-actions"],
  [/\bscikit-?learn\b|\bsklearn\b/, "scikit-learn"],
  [/\bgoogle\s*cloud\b|\bgcp\b/, "google-cloud"],
  [/\baws\b|amazon\s*web\s*services|\bboto3\b|\bec2\b|\bdynamodb\b/, "aws"],
  [/\btypescript\b|\.tsx?\b/, "typescript"],
  [/\bjavascript\b|ecmascript|\bes20\d\d\b/, "javascript"],
  [/\bgraphql\b|apollo/, "graphql"],
  [/\bpython\b/, "python"],
  [/\bcypress\b/, "cypress"], [/\bjest\b/, "jest"], [/\bvitest\b/, "vitest"],
  [/\bdocker\b/, "docker"], [/\bkubernetes\b|\bk8s\b/, "kubernetes"],
  [/\bterraform\b/, "terraform"],
  [/\blanggraph\b|\blangsmith\b|\blangchain\b/, "langchain"],
  [/\bn8n\b/, "n8n"],
  [/\banthropic\b/, "anthropic"], [/\bclaude\b/, "claude"],
  [/\bredux\b/, "redux"],
  [/\bpostgres(ql)?\b/, "postgresql"], [/\bredis\b/, "redis"], [/\bmongo(db)?\b|mongoose/, "mongodb"],
  [/\bmysql\b/, "mysql"], [/\bsqlite\b/, "sqlite"], [/\belastic(search)?\b/, "elasticsearch"],
  [/\bkafka\b/, "kafka"], [/\brabbitmq\b/, "rabbitmq"], [/\bspark\b/, "spark"],
  [/\bsupabase\b/, "supabase"], [/\bvercel\b/, "vercel"], [/\bprisma\b/, "prisma"],
  [/\bdrizzle\b/, "drizzle"], [/\btrpc\b/, "trpc"],
  [/\btailwind\b/, "tailwind"], [/\bsass\b|\bscss\b/, "sass"], [/\bbootstrap\b/, "bootstrap"],
  [/\bfigma\b/, "figma"], [/\bgitlab\b/, "gitlab"], [/\bgithub\b/, "github"],
  [/\blinux\b/, "linux"], [/\bnginx\b/, "nginx"], [/\bgrafana\b/, "grafana"],
  [/\bprometheus\b/, "prometheus"], [/\bsentry\b/, "sentry"], [/\bjenkins\b/, "jenkins"],
  [/\bstorybook\b/, "storybook"], [/\bwebpack\b/, "webpack"], [/\bvite\b/, "vite"],
  [/\bbabel\b/, "babel"], [/\besbuild\b/, "esbuild"], [/\beslint\b/, "eslint"],
  [/\bprettier\b/, "prettier"], [/\bturborepo\b|\bturbo\b/, "turborepo"],
  [/\bpnpm\b/, "pnpm"], [/\byarn\b/, "yarn"], [/\bbun\b/, "bun"], [/\bdeno\b/, "deno"], [/\bnpm\b/, "npm"],
  [/\bdjango\b/, "django"], [/\bflask\b/, "flask"], [/\bfastapi\b/, "fastapi"], [/\bexpress\b/, "express"],
  [/\bpandas\b/, "pandas"], [/\bnumpy\b/, "numpy"], [/\bpytorch\b|\btorch\b/, "pytorch"],
  [/\btensorflow\b/, "tensorflow"], [/\bjupyter\b|\bipynb\b/, "jupyter"],
  [/hugging\s*face|huggingface/, "huggingface"], [/\bcloudflare\b/, "cloudflare"],
  [/\bstripe\b/, "stripe"], [/\brazorpay\b/, "razorpay"], [/\bclerk\b/, "clerk"], [/\bauth0\b/, "auth0"],
  [/\bpuppeteer\b/, "puppeteer"], [/\bselenium\b/, "selenium"], [/\bmocha\b/, "mocha"],
  [/\bcucumber\b/, "cucumber"], [/\bpostman\b/, "postman"], [/\bswagger\b|openapi/, "swagger"],
  [/\bastro\b/, "astro"], [/\bsvelte\b/, "svelte"], [/\bvue\.?js\b|^vue$/, "vue"],
  [/\bangular\b/, "angular"], [/\bremix\b/, "remix"], [/\belectron\b/, "electron"],
  [/\bexpo\b/, "expo"], [/\bflutter\b/, "flutter"],
  [/\bthree\.?js\b/, "threejs"], [/socket\.?io/, "socketio"],
  [/\breact\b/, "react"],
  [/\bspring\b/, "spring"], [/\bkotlin\b/, "kotlin"], [/\bswift\b/, "swift"],
  [/\bgolang\b/, "go"], [/\brust\b/, "rust"], [/\bphp\b/, "php"], [/\bhtml\b/, "html"],
  [/\bcss\b/, "css"],
  // Products added with the platform handbooks. Better Auth is written both
  // ways in the catalogue, and Auth.js deliberately maps to nothing: Auth0 is a
  // different product, and lending it Auth0's mark would misattribute it.
  [/\bbetter\s*auth\b/, "betterauth"],
  [/\bneon\b/, "neon"], [/\bupstash\b/, "upstash"],
];

/**
 * The brand a free-text label belongs to, or null when nothing matches.
 *
 * Callers pass whatever text they have — a handbook title, a package name, a
 * topic heading — and get back a stable key usable against BRAND_SLUGS or
 * OWNED_BRAND_PNGS. Returning null is the normal case for the many topics that
 * are concepts rather than products; those fall through to the SVG resolvers.
 */
export function brandKeyFor(label: string): string | null {
  const text = label.toLowerCase();
  for (const [pattern, key] of RULES) if (pattern.test(text)) return key;
  return null;
}
