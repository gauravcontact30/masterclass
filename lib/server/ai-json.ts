import { z } from 'zod';

/** Give the model the same contract the application validates, with one repair attempt. */
export async function validatedAiJson<T>(schema:z.ZodType<T>, prompt:string, generate:(prompt:string)=>Promise<string>, signal?:AbortSignal):Promise<T> {
  const contract=JSON.stringify(z.toJSONSchema(schema,{unrepresentable:'any'}));
  let correction='';
  for(let attempt=0;attempt<2;attempt++) {
    signal?.throwIfAborted();
    try {
      const raw=await generate(`${prompt}\nRequired JSON schema (obey all lengths, enums and required fields): ${contract}${correction}`);
      const text=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
      return schema.parse(JSON.parse(text));
    }
    catch(error) {
      const truncated=error instanceof Error && error.message==='truncated';
      if(!(error instanceof SyntaxError || error instanceof z.ZodError || truncated)||attempt===1)throw error;
      // Only schema paths and codes enter the repair request; never echo a response payload.
      const issues=error instanceof z.ZodError?error.issues.slice(0,12).map(issue=>`${issue.path.join('.')}: ${issue.code}`).join('; '):truncated?'Response exceeded the token budget. Use shorter explanations and a smaller complete project':'Response was not valid JSON';
      correction=`\nThe previous attempt failed validation: ${issues}. Generate a complete corrected response. Return only the JSON value.`;
    }
  }
  throw new Error('invalid_ai_response');
}
