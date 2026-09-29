import { availableProviders, learningProvider, providerGrounded, PROVIDER_LABELS, type AiProvider } from "@/lib/server/ai-providers";

export const runtime = "nodejs";

const DESCRIPTIONS: Record<AiProvider, string> = {
  anthropic: "Answers from the model, tuned for the explanations and projects in this app.",
  perplexity: "Searches the web first, so version-sensitive answers cite the pages they came from.",
  openrouter: "One key to hundreds of models; OpenRouter routes each question to a suitable one.",
  gateway: "Vercel AI Gateway: many vendors behind one endpoint, with automatic provider failover.",
  portkey: "Portkey's AI gateway, with its configured fallbacks, caching and guardrails.",
  openai: "OpenAI's models, answering from what they were trained on.",
  gemini: "Google Gemini, answering from what it was trained on.",
  groq: "Open models on Groq's hardware, built for very fast replies.",
  mistral: "Mistral's models, answering from what they were trained on.",
  deepseek: "DeepSeek's models, strong on step-by-step reasoning and code.",
};

/**
 * Which models this deployment can generate with, so the client can offer a
 * choice instead of guessing. Labels and capabilities only: model identifiers
 * and credentials stay on the server.
 */
export async function GET() {
  const providers = availableProviders().map(id => ({
    id, label: PROVIDER_LABELS[id],
    grounded: providerGrounded(id),
    description: providerGrounded(id) && id !== "perplexity" ? `${DESCRIPTIONS[id]} Answers cite the pages they read.` : DESCRIPTIONS[id],
  }));
  // Every surface that reads this list generates learning content, so it must
  // advertise the same default the server would pick — otherwise the client
  // pins a provider the server would not have chosen.
  return Response.json({ providers, default: learningProvider() }, { headers: { "Cache-Control": "no-store" } });
}
