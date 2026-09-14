import "server-only";
import { check, db } from "./db";
import { required } from "./config";
import { DocumentRecord, lessonTitles, Topic } from "@/lib/domain";
import { generateCurriculum } from "@/lib/generation/provider";
/**
 * Notes are their curriculum: the reader, copy and download all render from
 * the stored JSON, so a finished job writes no files — only the curriculum
 * and its lesson titles, which the reader tracks progress against.
 */
export async function processOne() {
  // Fail configuration checks before claiming jobs, so missing setup cannot burn retries.
  required("ANTHROPIC_API_KEY");required("ANTHROPIC_MODEL");
  const items = check(await db().rpc("claim_document"));
  const job = items?.[0] as (DocumentRecord & { lease:string }) | undefined;
  if(!job) return { processed:false };
  try {
    const topic = check(await db().from("topics").select("*").eq("id",job.request.topicId).single()) as Topic;
    const curriculum = await generateCurriculum(job.request,topic);
    const committed=check(await db().rpc("finish_document",{p_id:job.id,p_lease:job.lease,p_curriculum:curriculum,p_path:null,p_previews:[],p_titles:lessonTitles(curriculum)}));
    if(!committed) throw new Error("Worker lease expired");
    return { processed:true,id:job.id,status:"ready" };
  } catch {
    check(await db().rpc("fail_document",{p_id:job.id,p_lease:job.lease}));
    console.error(JSON.stringify({event:"generation_failed",documentId:job.id}));
    return { processed:true,id:job.id,status:"retry_or_failed" };
  }
}
