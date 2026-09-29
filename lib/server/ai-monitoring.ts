import 'server-only';
import { recordEvent } from './monitoring';

/** Token usage in one shape for every provider; `cost` (USD) only when the provider reports it (OpenRouter does). */
type Usage = { input_tokens?: number; output_tokens?: number; cost?: number };

/**
 * Time one model call and record it for the super admin AI analytics: feature,
 * provider, model, latency, tokens and reported cost. Prompts, answers and
 * credentials are never recorded. `provider` defaults to Anthropic because the
 * curriculum generator predates the provider layer and only speaks Claude.
 */
export async function monitorAi<T extends { usage?: Usage }>(feature: string, model: string, call: () => Promise<T>, provider = 'anthropic'): Promise<T> {
  const started = performance.now();
  try {
    const result = await call();
    await recordEvent({kind:'ai',action:'completion',resource:feature,status:200,duration_ms:Math.round(performance.now()-started),details:{provider,model,input_tokens:result.usage?.input_tokens,output_tokens:result.usage?.output_tokens,...(typeof result.usage?.cost==='number'?{cost_usd:result.usage.cost}:{})}});
    return result;
  } catch (error) {
    const status = typeof (error as { status?: unknown })?.status === 'number' ? (error as { status: number }).status : 502;
    await recordEvent({kind:'ai',action:'completion',resource:feature,status:status>=400?status:502,duration_ms:Math.round(performance.now()-started),details:{provider,model,error:error instanceof Error?error.message.slice(0,80):'unknown'}});
    throw error;
  }
}

/** A provider refused or was rate limited and the request moved to the next one. */
export async function recordFallback(feature: string, from: string, status: number | null) {
  await recordEvent({kind:'ai',action:'fallback',resource:feature,status:status??502,details:{provider:from}});
}
