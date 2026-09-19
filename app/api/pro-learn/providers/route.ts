import { availableProviders, learningProvider, PROVIDER_LABELS } from "@/lib/server/ai-providers";

export const runtime = "nodejs";

/**
 * Which models this deployment can generate with, so the client can offer a
 * choice instead of guessing. Labels and capabilities only: model identifiers
 * and credentials stay on the server.
 */
export async function GET() {
  const providers = availableProviders().map(id => ({
    id, label: PROVIDER_LABELS[id],
    grounded: id === "perplexity",
    description: id === "perplexity"
      ? "Searches the web first, so version-sensitive answers cite the pages they came from."
      : "Answers from the model, tuned for the explanations and projects in this app.",
  }));
  // Every surface that reads this list generates learning content, so it must
  // advertise the same default the server would pick — otherwise the client
  // pins a provider the server would not have chosen.
  return Response.json({ providers, default: learningProvider() }, { headers: { "Cache-Control": "no-store" } });
}
