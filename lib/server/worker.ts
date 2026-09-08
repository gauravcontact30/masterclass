import "server-only";
import { check, db } from "./db";
import { required } from "./config";
import { DocumentRecord, Topic } from "@/lib/domain";
import { generateCurriculum } from "@/lib/generation/provider";
import { renderDocuments } from "@/lib/generation/render";
export async function processOne() {
  // Fail configuration checks before claiming jobs, so missing setup cannot burn retries.
  const config = { executablePath:required("CHROMIUM_EXECUTABLE_PATH"),fontPath:required("DOCUMENT_FONT_PATH") };
  required("ANTHROPIC_API_KEY");required("ANTHROPIC_MODEL");
  const items = check(await db().rpc("claim_document"));
  const job = items?.[0] as (DocumentRecord & { lease:string }) | undefined;
  if(!job) return { processed:false };
  const paths: string[]=[];
  try {
    const topic = check(await db().from("topics").select("*").eq("id",job.request.topicId).single()) as Topic;
    const curriculum = await generateCurriculum(job.request,topic);
    const result = await renderDocuments(curriculum,job.request,topic.references,config);
    const prefix=`${job.user_id}/${job.id}/${job.lease}`;
    const filePath=`${prefix}/guide.${job.request.format}`;
    check(await db().storage.from("generated-docs").upload(filePath,result.file,{contentType:job.request.format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.presentationml.presentation"}));paths.push(filePath);
    const previews:string[]=[];
    for(let i=0;i<result.previews.length;i++) {
      const path=`${prefix}/page-${i+1}.png`;
      check(await db().storage.from("generated-docs").upload(path,result.previews[i],{contentType:"image/png"}));paths.push(path);previews.push(path);
    }
    const committed=check(await db().rpc("finish_document",{p_id:job.id,p_lease:job.lease,p_curriculum:curriculum,p_path:filePath,p_previews:previews,p_titles:result.pages.map(p=>p.title)}));
    if(!committed) throw new Error("Worker lease expired");
    return { processed:true,id:job.id,status:"ready" };
  } catch {
    if(paths.length) await db().storage.from("generated-docs").remove(paths);
    check(await db().rpc("fail_document",{p_id:job.id,p_lease:job.lease}));
    console.error(JSON.stringify({event:"generation_failed",documentId:job.id}));
    return { processed:true,id:job.id,status:"retry_or_failed" };
  }
}
