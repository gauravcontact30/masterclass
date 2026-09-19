import 'server-only';
import { recordEvent } from './monitoring';
export async function monitorAi<T extends { usage?: { input_tokens?: number; output_tokens?: number } }>(feature: string, model: string, call: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    const result = await call();
    await recordEvent({kind:'ai',action:'completion',resource:feature,status:200,duration_ms:Math.round(performance.now()-started),details:{model,input_tokens:result.usage?.input_tokens,output_tokens:result.usage?.output_tokens}});
    return result;
  } catch (error) {
    await recordEvent({kind:'ai',action:'completion',resource:feature,status:502,duration_ms:Math.round(performance.now()-started),details:{model}});
    throw error;
  }
}
