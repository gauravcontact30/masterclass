"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ArrowUpRight,BookOpen,Check,ChevronRight,Compass,Copy,FileText,GraduationCap,Layers,Library,Link2,Presentation,Search,Sparkles,Sun,Trash2,Wallet } from "lucide-react";
import { DocumentRecord,GenerationRequest,Language,Progress,Technology,Tier,Topic } from "@/lib/domain";
import { curriculumNotes } from "@/lib/notes";
import { FileThumbnail, NotesThumbnail } from "./file-thumbnail";
import { errorKey,requestJson } from "@/lib/client";
import { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { GenerationForm } from "./generation-form";
import { Wordmark } from "./brand-mark";
import { LearnModal } from "./learn-modal";
import { Membership } from "./membership";
import { Connections } from "./connections";
import { SampleLessons } from "./sample-lessons";
import { Button } from "./ui/button";
type AccountData={profile:{language:Language};account:{tier:Tier;used:number;limit:number;subscription:{current_period_end:string|null;status:string;cancel_at_cycle_end:boolean}|null;creditBalance:number};documents:DocumentRecord[];progress:Progress[]};
function Identity({email}:{email:string|null}){const {t}=useLanguage();const router=useRouter();const [busy,setBusy]=useState(false);
  async function signOut(){setBusy(true);try{await supabaseBrowser().auth.signOut();router.replace("/");router.refresh();}finally{setBusy(false);}}
  return email?<div className="identity"><span title={email}>{email.split("@")[0]}</span><Button variant="outline" size="sm" disabled={busy} onClick={()=>void signOut()}>{t("signout")}</Button></div>:<Link className="signin-link" href="/sign-in">{t("signin")}<ArrowUpRight size={15}/></Link>;}
export function Workspace({authEnabled,configured,billingEnabled,userEmail=null}:{authEnabled:boolean;configured:boolean;billingEnabled:boolean;userEmail?:string|null}) {
  const {t,language,setLanguage}=useLanguage();const [tab,setTab]=useState<"dashboard"|"library"|"plans"|"settings">("dashboard");
  const [catalog,setCatalog]=useState<{technologies:Technology[];topics:Topic[]}>({technologies:[],topics:[]});
  const [data,setData]=useState<AccountData|null>(null);const [loading,setLoading]=useState(configured);const [busy,setBusy]=useState(false);const [error,setError]=useState<TranslationKey|null>(null);const [selected,setSelected]=useState<DocumentRecord|null>(null);const [search,setSearch]=useState("");const [confirmId,setConfirmId]=useState<string|null>(null);const [copiedId,setCopiedId]=useState<string|null>(null);const hydrated=useRef(false);
  const refresh=useCallback(async()=>{if(!configured||!authEnabled)return;try{const result=await requestJson<AccountData>("/api/account");setData(result);if(!hydrated.current){setLanguage(result.profile.language,false);hydrated.current=true;}setError(null);}catch(e){setError(errorKey(e));}},[configured,authEnabled,setLanguage]);
  useEffect(()=>{let active=true;if(configured){void requestJson<typeof catalog>("/api/catalog").then(result=>{if(active)setCatalog(result);}).catch(e=>{if(active)setError(errorKey(e));}).finally(()=>{if(active)setLoading(false);});}Promise.resolve().then(refresh);return()=>{active=false;};},[configured,refresh]);
  useEffect(()=>{if(!data?.documents.some(d=>d.status==="queued"||d.status==="generating"))return;const interval=setInterval(()=>void refresh(),5000);return()=>clearInterval(interval);},[data,refresh]);
  async function generate(input:GenerationRequest){setBusy(true);setError(null);try{const {document}=await requestJson<{document:DocumentRecord}>("/api/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});await refresh();if(document.status==="ready")setSelected(document);}catch(e){setError(errorKey(e));}finally{setBusy(false);}}
  async function deleteDocument(id:string){setBusy(true);setError(null);try{await requestJson(`/api/documents/${id}`,{method:"DELETE"});setConfirmId(null);await refresh();}catch(e){setError(errorKey(e));}finally{setBusy(false);}}
  async function copyNotes(item:DocumentRecord){setError(null);try{const {document}=await requestJson<{document:DocumentRecord}>(`/api/documents/${item.id}`);if(!document.curriculum)throw new Error("not_ready");await navigator.clipboard.writeText(curriculumNotes(document.curriculum,document.title,document.request.language));setCopiedId(item.id);setTimeout(()=>setCopiedId(id=>id===item.id?null:id),2500);}catch{setError("copyNotesFailed");}}
  const documents=data?.documents??[];const progress=data?.progress??[];const continuing=progress.filter(p=>!p.completed).sort((a,b)=>(b.updated_at??"").localeCompare(a.updated_at??""))[0];const resumeDoc=documents.find(d=>d.id===continuing?.document_id&&d.status==="ready");
  const matching=documents.filter(d=>d.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const pdfDocs=matching.filter(d=>d.request.format==="pdf");
  const pptxDocs=matching.filter(d=>d.request.format==="pptx");
  const notesDocs=matching.filter(d=>d.status==="ready");
  return <div className="app-shell"><aside className="sidebar"><Link href="/" className="wordmark"><Wordmark /></Link><div className="sidebar-label">{t("introLabel")}</div><nav aria-label={t("dashboard")}>{([{id:"dashboard",icon:Compass},{id:"library",icon:Library},{id:"plans",icon:Layers},{id:"settings",icon:Link2}] as const).map(({id,icon:Icon})=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><Icon size={19}/>{t(id)}{tab===id&&<ChevronRight size={15}/>}</button>)}</nav><div className="sidebar-bottom"><div className="study-note"><GraduationCap size={27}/><h3>{t("sample")}</h3><p>{t("brandLine")}</p><button onClick={()=>setTab("plans")}>{t("upgrade")}<ArrowUpRight size={16}/></button></div><span className="sidebar-foot">MasterClass © {new Date().getFullYear()}</span></div></aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb">{t("dashboard")}<ChevronRight size={14}/><span>{t(tab)}</span></div><div className="topbar-actions"><label className="language-control"><span className="sr-only">{t("language")}</span><select aria-label={t("language")} value={language} onChange={e=>setLanguage(e.target.value as Language)}><option value="en">English</option><option value="hi">हिन्दी</option></select></label><span className="topbar-divider"/>{authEnabled?<Identity email={userEmail}/>:<Link href="/sign-in" className="signin-link">{t("signin")}<ArrowUpRight size={15}/></Link>}</div></header>
    <main className="workspace"><div className="page-intro"><div><p className="eyebrow"><Sun size={15}/>{t("introLabel")}</p><h1>{tab==="dashboard"?t("welcome"):t(tab)}</h1><p>{tab==="dashboard"?t("intro"):t("brandLine")}</p></div><div className="intro-mark" aria-hidden="true">✳</div></div>
    {(!configured||!authEnabled)&&<div className="setup-banner" role="status"><BookOpen size={20}/><div><strong>{t("setupTitle")}</strong><p>{t("setupHelp")}</p></div></div>}
    {error&&<div className="error-banner" role="alert">{t(error)} {error==="signin_required"?<Link href="/sign-in">{t("signin")}</Link>:<button onClick={()=>void refresh()}>{t("refresh")}</button>}{error==="quota_exceeded"&&<button onClick={()=>setTab("plans")}>{t("upgrade")}</button>}</div>}
    {tab==="plans"?<Membership enabled={billingEnabled} data={data?.account??null} onRefresh={refresh}/>:tab==="settings"?<Connections/>:<>
    {tab==="dashboard"&&<><div className="stats-grid">{[{label:t("materials"),value:documents.length,icon:BookOpen},{label:t("completed"),value:progress.filter(p=>p.completed).length,icon:Check},{label:t("remaining"),value:data?Math.max(0,data.account.limit-data.account.used):"—",icon:Sparkles},{label:t("downloadCredits"),value:data?.account.creditBalance??0,icon:Wallet,suffix:false}].map(({label,value,icon:Icon,suffix=true})=><div className="stat" key={label}><div><span>{label}</span><strong>{value}{suffix&&<small>{t("month")}</small>}</strong></div><div className="stat-icon"><Icon size={20}/></div></div>)}</div><GenerationForm technologies={catalog.technologies} topics={catalog.topics} onGenerate={generate} busy={busy} disabled={!configured||!authEnabled||loading}/>
    {resumeDoc&&<button className="resume-strip" onClick={()=>setSelected(resumeDoc)}><span className="section-icon"><BookOpen size={22}/></span><span><small>{t("resume")}</small><strong>{resumeDoc.title}</strong></span><span>{t("page")} {continuing.page}</span><ArrowUpRight size={20}/></button>}</>}
    {tab==="dashboard"&&<SampleLessons/>}
    <section className="library-section"><div className="library-heading"><h2>{t("history")}<span>{documents.length}</span></h2><label className="search-input"><Search size={16}/><input aria-label={t("search")} placeholder={t("search")} value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
    {loading?<p role="status">{t("loading")}</p>:!documents.length?<div className="empty-library"><div className="empty-books" aria-hidden="true"><FileText size={34}/><BookOpen size={39}/></div><h3>{t("empty")}</h3><p>{t("emptyHelp")}</p></div>:<>
    <div className="library-group"><h3><FileText size={16}/>{t("libraryPdfTitle")}<span>{pdfDocs.length}</span></h3>
    {!pdfDocs.length?<p className="library-group-empty">{t(search?"noResults":"noPdfs")}</p>:<div className="document-grid">{pdfDocs.map(item=>
      <article className="document-card" key={item.id}><div className="document-cover"><FileThumbnail format="pdf" theme={item.request.theme} title={item.title}/><div className="cover-bottom"><span>{t(item.request.level)}</span><span aria-hidden="true">↗</span></div></div>
      <div className="document-details"><div className="document-meta"><span>{item.request.language==="hi"?"हिन्दी":"English"}</span><span className={`status ${item.status}`}>{t(item.status)}</span></div><h3>{item.title}</h3><p>{new Intl.DateTimeFormat(language==="hi"?"hi-IN":"en-IN",{dateStyle:"medium"}).format(new Date(item.created_at))}</p>{item.status==="failed"&&<p className="inline-error">{t("generation_failed")}</p>}
      {confirmId===item.id?<div className="delete-confirm"><p>{t("deleteConfirmHelp")}</p><Button variant="destructive" size="sm" disabled={busy} onClick={()=>void deleteDocument(item.id)}>{t("deleteConfirm")}</Button><Button variant="ghost" size="sm" onClick={()=>setConfirmId(null)}>{t("close")}</Button></div>:
      <div className="document-actions">{item.status==="ready"?<><Button variant="outline" onClick={()=>setSelected(item)}>{t("learn")}<ArrowUpRight size={15}/></Button><a href={`/api/documents/${item.id}/download`}>{t("download")}</a></>:item.status==="failed"?<Button disabled={busy} onClick={()=>void generate(item.request)}>{t("retry")}</Button>:<span role="status">{t(item.status)}…</span>}<Button variant="ghost" size="icon" aria-label={t("deleteMaterial")} onClick={()=>setConfirmId(item.id)}><Trash2 size={15}/></Button></div>}
      </div></article>)}</div>}</div>
    <div className="library-group"><h3><Presentation size={16}/>{t("libraryPptxTitle")}<span>{pptxDocs.length}</span></h3>
    {!pptxDocs.length?<p className="library-group-empty">{t(search?"noResults":"noPptx")}</p>:<div className="document-grid">{pptxDocs.map(item=>
      <article className="document-card" key={item.id}><div className="document-cover"><FileThumbnail format="pptx" theme={item.request.theme} title={item.title}/><div className="cover-bottom"><span>{t(item.request.level)}</span><span aria-hidden="true">↗</span></div></div>
      <div className="document-details"><div className="document-meta"><span>{item.request.language==="hi"?"हिन्दी":"English"}</span><span className={`status ${item.status}`}>{t(item.status)}</span></div><h3>{item.title}</h3><p>{new Intl.DateTimeFormat(language==="hi"?"hi-IN":"en-IN",{dateStyle:"medium"}).format(new Date(item.created_at))}</p>{item.status==="failed"&&<p className="inline-error">{t("generation_failed")}</p>}
      {confirmId===item.id?<div className="delete-confirm"><p>{t("deleteConfirmHelp")}</p><Button variant="destructive" size="sm" disabled={busy} onClick={()=>void deleteDocument(item.id)}>{t("deleteConfirm")}</Button><Button variant="ghost" size="sm" onClick={()=>setConfirmId(null)}>{t("close")}</Button></div>:
      <div className="document-actions">{item.status==="ready"?<><Button variant="outline" onClick={()=>setSelected(item)}>{t("learn")}<ArrowUpRight size={15}/></Button><a href={`/api/documents/${item.id}/download`}>{t("download")}</a></>:item.status==="failed"?<Button disabled={busy} onClick={()=>void generate(item.request)}>{t("retry")}</Button>:<span role="status">{t(item.status)}…</span>}<Button variant="ghost" size="icon" aria-label={t("deleteMaterial")} onClick={()=>setConfirmId(item.id)}><Trash2 size={15}/></Button></div>}
      </div></article>)}</div>}</div>
    <div className="library-group"><h3><Copy size={16}/>{t("libraryNotesTitle")}<span>{notesDocs.length}</span></h3><p className="library-group-hint">{t("libraryNotesHint")}</p>
    {!notesDocs.length?<p className="library-group-empty">{t(search?"noResults":"noNotes")}</p>:<ul className="notes-list">{notesDocs.map(item=>
      <li key={item.id}><NotesThumbnail/><span className="notes-title">{item.title}</span><Button variant="outline" size="sm" onClick={()=>void copyNotes(item)}><Copy size={14}/>{copiedId===item.id?t("notesCopied"):t("copyNotes")}</Button></li>)}
    </ul>}</div>
    </>}</section>
    <footer className="workspace-footer"><span>✦ MasterClass</span><span>{t("brandLine")}</span></footer></>}
    </main></div>{selected&&<LearnModal key={selected.id} document={selected} initialProgress={progress.find(p=>p.document_id===selected.id)} onClose={()=>{setSelected(null);void refresh();}}/>}</div>;
}

