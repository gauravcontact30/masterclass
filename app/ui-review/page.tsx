import {notFound} from "next/navigation";
import {Workspace} from "@/components/workspace";
import {DocumentRecord} from "@/lib/domain";
export default function Review(){
 if(process.env.NODE_ENV!=="development")notFound();
 const base:DocumentRecord={id:"review",user_id:"review",title:"JavaScript functions and scope",request:{technologyId:"javascript",topicId:"functions",format:"notes",language:"en",level:"beginner"},status:"ready",created_at:"2026-09-09T00:00:00Z",error_code:null,curriculum:null,page_titles:["Overview"],storage_path:null,preview_paths:[]};
 return <Workspace authEnabled configured={false} billingEnabled={false} userEmail="preview@example.test" initialAccount={{profile:{language:"en"},account:{tier:"free",used:2,limit:3,subscription:null,creditBalance:2},documents:[base,{...base,id:"react",title:"React: Components and state",request:{...base.request,technologyId:"react"}},{...base,id:"python",title:"Python essentials",request:{...base.request,technologyId:"python"}},{...base,id:"pending",status:"generating",title:"TypeScript type fundamentals"}],progress:[]}}/>;
}
