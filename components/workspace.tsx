"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useCallback,useEffect,useMemo,useRef,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { ArrowUpRight,BookOpen,ChevronRight,Compass,Layers,Library as LibraryIcon,Link2,LogOut,PanelLeftClose,PanelLeftOpen,Sun,RefreshCw } from "lucide-react";
import { DocumentRecord,GenerationRequest,Language,Progress,Technology,Tier,Topic } from "@/lib/domain";
import { curriculumNotes } from "@/lib/notes";
import { uniqueLibraryDocuments } from "@/lib/library";
import { Library } from "./library";
import { errorKey,requestJson } from "@/lib/client";
import { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { Wordmark } from "./brand-mark";
import { NotesModal } from "./notes-modal";
import { Membership } from "./membership";
import { StudyCatalog } from "./study-catalog";
import { LearningSearch } from "./learning-filters";
import { NotesLibrary } from "./notes-library";
import { StudyNavigation } from "./study-navigation";
import { PreparationSetup } from "./preparation-setup";
import type { StudyCourse } from "@/lib/study/types";
import { CATEGORY_LABELS, PREPARATIONS, type PreparationAccess } from "@/lib/study/preparations";
import { Connections } from "./connections";
import { Button } from "./ui/button";
import { Popover,PopoverContent,PopoverTrigger } from "./ui/popover";
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from "./ui/dialog";
type AccountData={preparations?:PreparationAccess;profile:{language:Language};account:{tier:Tier;used:number;limit:number;subscription:{current_period_end:string|null;status:string;cancel_at_cycle_end:boolean}|null;creditBalance:number};documents:DocumentRecord[];progress:Progress[]};
const tabIcons={dashboard:Compass,library:LibraryIcon,plans:Layers,settings:Link2} as const;
function Identity({email,onNavigate}:{email:string|null;onNavigate:(tab:WorkspaceTab)=>void}){const {t}=useLanguage();const router=useRouter();const [busy,setBusy]=useState(false);const [open,setOpen]=useState(false);
  async function signOut(){setBusy(true);try{await supabaseBrowser().auth.signOut();router.replace("/");router.refresh();}finally{setBusy(false);}}
  if(!email)return <Link className="signin-link" href="/sign-in"><ExpandedText text={t("signin")} /><ArrowUpRight size={15}/></Link>;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger className="profile-trigger" aria-label={t("account")}><span className="profile-avatar" aria-hidden="true"><ExpandedText text={email.charAt(0).toUpperCase()} /></span></PopoverTrigger>
    <PopoverContent align="end" sideOffset={12} className="profile-menu">
      <span className="profile-menu-email"><ExpandedText text={email} /></span>
      <span className="profile-menu-sep" role="separator"/>
      {(["dashboard","library"] as const).map(id=>{const Icon=tabIcons[id];return <button type="button" key={id} className="profile-menu-item" onClick={()=>{setOpen(false);onNavigate(id);}}><Icon size={16}/><ExpandedText text={t(id)} /></button>;})}
      <span className="profile-menu-sep" role="separator"/>
      <button type="button" className="profile-menu-item profile-menu-item-destructive" disabled={busy} onClick={()=>void signOut()}><LogOut size={16}/><ExpandedText text={t("signout")} /></button>
    </PopoverContent>
  </Popover>;}
export type WorkspaceTab="dashboard"|"library"|"plans"|"settings";
export function Workspace({authEnabled,configured,billingEnabled,userEmail=null,initialTab="dashboard",initialAccount=null,initialCategory,initialPreparation="",initialCourse,initialStudyCourses,notesContent}:{notesContent?:React.ReactNode;initialStudyCourses?:StudyCourse[];initialPreparation?:string;initialCourse?:string;initialCategory?:string;authEnabled:boolean;configured:boolean;billingEnabled:boolean;userEmail?:string|null;initialTab?:WorkspaceTab;initialAccount?:AccountData|null}) {
  const {t,language,setLanguage}=useLanguage();const [tab,setTab]=useState<WorkspaceTab>(initialTab);
  const [learningQuery,setLearningQuery]=useState("");
  const [notesSelected,setNotesSelected]=useState<DocumentRecord|null>(null);const [refreshing,setRefreshing]=useState(false);
  const [collapsed,setCollapsed]=useState(false);const [category,setCategory]=useState(initialCategory);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Reads a client-only preference after mount; initial `false` must match SSR output.
  useEffect(()=>{try{setCollapsed(localStorage.getItem("masterclass:sidebar-collapsed")==="1");}catch{}},[]);
  function toggleCollapsed(){setCollapsed(prev=>{const next=!prev;try{localStorage.setItem("masterclass:sidebar-collapsed",next?"1":"0");}catch{}return next;});}
  function navigate(next:WorkspaceTab){setCategory(undefined);setLearningQuery("");setTab(next);setError(null);window.history.pushState(null,"",`/dashboard?tab=${next}`);}
  useEffect(()=>{const restore=()=>{setCategory(window.location.pathname.split("/")[2]);const next=new URLSearchParams(window.location.search).get("tab");setTab(next==="library"||next==="plans"||next==="settings"?next:"dashboard");};window.addEventListener("popstate",restore);return()=>window.removeEventListener("popstate",restore);},[]);
  const [catalog,setCatalog]=useState<{technologies:Technology[];topics:Topic[]}>({technologies:[],topics:[]});
  const [data,setData]=useState<AccountData|null>(initialAccount);const [loading,setLoading]=useState(configured);const [busy,setBusy]=useState(false);const [error,setError]=useState<TranslationKey|null>(null);const [confirmId,setConfirmId]=useState<string|null>(null);const [copiedId,setCopiedId]=useState<string|null>(null);const hydrated=useRef(false);
  const preparationKey=data?.preparations?.selections.join(",")??"";
  const refresh=useCallback(async()=>{if(!configured||!authEnabled)return;try{const result=await requestJson<AccountData>("/api/account");setData(result);if(!hydrated.current){setLanguage(result.profile.language,false);hydrated.current=true;}setError(null);}catch(e){setError(errorKey(e));}},[configured,authEnabled,setLanguage]);
  useEffect(()=>{let active=true;if(configured){void requestJson<typeof catalog>("/api/catalog").then(result=>{if(active)setCatalog(result);}).catch(e=>{if(active)setError(errorKey(e));}).finally(()=>{if(active)setLoading(false);});}Promise.resolve().then(refresh);return()=>{active=false;};},[configured,refresh,preparationKey]);
  useEffect(()=>{if(!data?.documents.some(d=>d.status==="queued"||d.status==="generating"))return;const interval=setInterval(()=>void refresh(),5000);return()=>clearInterval(interval);},[data,refresh]);
  async function generate(input:GenerationRequest){setBusy(true);setError(null);try{const {document}=await requestJson<{document:DocumentRecord}>("/api/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});await refresh();if(document.status==="ready"){toast.success(`${document.title} — ${t("ready")}`);setNotesSelected(document);}else{toast(`${document.title} — ${t("generating")}…`);setTab("library");}}catch(e){const key=errorKey(e);setError(key);toast.error(t(key));}finally{setBusy(false);}}
  async function deleteDocument(id:string){setBusy(true);setError(null);try{await requestJson(`/api/documents/${id}`,{method:"DELETE"});setConfirmId(null);await refresh();}catch(e){setError(errorKey(e));}finally{setBusy(false);}}
  async function copyNotes(item:DocumentRecord){setError(null);try{const {document}=await requestJson<{document:DocumentRecord}>(`/api/documents/${item.id}`);if(!document.curriculum)throw new Error("not_ready");await navigator.clipboard.writeText(curriculumNotes(document.curriculum,document.title,document.request.language));setCopiedId(item.id);setTimeout(()=>setCopiedId(id=>id===item.id?null:id),2500);}catch{setError("copyNotesFailed");}}
  const documents=useMemo(()=>uniqueLibraryDocuments(data?.documents??[]),[data?.documents]);const listed=new Set(documents.map(d=>d.id));const progress=(data?.progress??[]).filter(p=>listed.has(p.document_id));const continuing=progress.filter(p=>!p.completed).sort((a,b)=>(b.updated_at??"").localeCompare(a.updated_at??""))[0];const resumeDoc=documents.find(d=>d.id===continuing?.document_id&&d.status==="ready");
  const access=data?.preparations??{selections:[],isSuperAdmin:false};
  const activePreparation=category?PREPARATIONS.find(option=>option.id===initialPreparation):undefined;
  const needsPreparation=!!data&&!access.isSuperAdmin&&!access.selections.length;
  const confirmDoc=documents.find(d=>d.id===confirmId);
  async function reload(){setRefreshing(true);try{const result=await requestJson<typeof catalog>("/api/catalog");setCatalog(result);await refresh();}catch(e){setError(errorKey(e));}finally{setRefreshing(false);}}
  // Dashboard and My Library share one search and filters panel (inside StudyCatalog); their libraries render beneath it.
  const libraries=<>{!category&&tab==="library"&&<NotesLibrary externalQuery={data?learningQuery:undefined} onQueryChange={data?setLearningQuery:undefined} documents={documents} technologies={catalog.technologies} topics={catalog.topics} progress={progress} loading={loading} busy={busy} copiedId={copiedId} onLearn={setNotesSelected} onCopyNotes={item=>void copyNotes(item)} onRetry={request=>void generate(request)} onDelete={item=>setConfirmId(item.id)}/>}{!learningQuery&&resumeDoc&&(!category||category==="technology")&&<button className="resume-strip" onClick={()=>setNotesSelected(resumeDoc)}><BookOpen size={20}/><span><small><ExpandedText text={t("resume")} /></small><strong><ExpandedText text={resumeDoc.title} /></strong></span><ArrowUpRight size={18}/></button>}{(!category&&tab!=="library"||category==="technology")&&(access.isSuperAdmin||access.selections.some(id=>id.startsWith("tech:")))&&<Library externalQuery={learningQuery} onQueryChange={setLearningQuery} documents={initialPreparation.startsWith("tech:")&&category==="technology"?documents.filter(doc=>doc.request.technologyId===initialPreparation.slice(5)):documents} technologies={catalog.technologies} topics={catalog.topics} progress={progress} loading={loading} busy={busy} copiedId={copiedId} onLearn={setNotesSelected} onCopyNotes={item=>void copyNotes(item)} onRetry={request=>void generate(request)} onDelete={item=>setConfirmId(item.id)}/>}</>;
  const showCatalog=!!data&&category!=="technology"&&category!=="notes";
  const studyCatalog=<StudyCatalog beforeLibrary={libraries} initialCourses={initialStudyCourses} key={`${category??"all"}:${tab}`} category={category} initialPreparation={category?initialPreparation:""} initialCourse={category?initialCourse:undefined} searchQuery={learningQuery} onSearchChange={setLearningQuery} preparations={access} onPlans={()=>navigate("plans")}/>;
  return <div className={`app-shell compact-workspace${collapsed?" sidebar-collapsed":""}`}><aside className="sidebar"><div className="sidebar-brand-row"><Link href="/" className="wordmark"><Wordmark /></Link><button type="button" className="sidebar-toggle" aria-expanded={!collapsed} aria-label={collapsed?t("expandSidebar"):t("collapseSidebar")} title={collapsed?t("expandSidebar"):t("collapseSidebar")} onClick={toggleCollapsed}>{collapsed?<PanelLeftOpen size={17}/>:<PanelLeftClose size={17}/>}</button></div><div className="sidebar-label">{t("introLabel")}</div><nav aria-label={t("dashboard")}>{([{id:"dashboard",icon:Compass},{id:"library",icon:LibraryIcon}] as const).map(({id,icon:Icon})=><button key={id} aria-current={!category&&tab===id?"page":undefined} className={!category&&tab===id?"active":""} onClick={()=>navigate(id)}><Icon size={19}/>{!collapsed&&<>{t(id)}{tab===id&&<ChevronRight size={15}/>}</>}{collapsed&&<span className="sidebar-tooltip">{t(id)}</span>}</button>)}<Link className="sidebar-notes" href="/dashboard/notes" aria-current={category==="notes"?"page":undefined}><BookOpen size={19}/>{!collapsed&&(language==="hi"?"नोट्स":"Notes")}{collapsed&&<span className="sidebar-tooltip">Notes</span>}</Link></nav><StudyNavigation access={access} collapsed={collapsed} category={category} preparation={initialPreparation} course={initialCourse}/></aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><ExpandedText text={t("dashboard")} /><ChevronRight size={14}/><span><ExpandedText text={category?CATEGORY_LABELS[category]?.[language]:t(tab)} /></span></div><div className="topbar-actions"><div className="language-toggle" role="group" aria-label={t("language")}><button type="button" aria-pressed={language==="en"} onClick={()=>setLanguage("en")}>EN</button><button type="button" aria-pressed={language==="hi"} onClick={()=>setLanguage("hi")}>Hi</button></div><span className="topbar-divider"/>{authEnabled?<Identity email={userEmail} onNavigate={navigate}/>:<Link href="/sign-in" className="signin-link"><ExpandedText text={t("signin")} /><ArrowUpRight size={15}/></Link>}</div></header>
    <main className="workspace"><div className="page-intro"><div><p className="eyebrow"><Sun size={15}/><ExpandedText text={t("introLabel")} /></p><h1><ExpandedText text={category?(activePreparation?.label[language]??CATEGORY_LABELS[category]?.[language]):tab==="dashboard"?(language==="hi"?"आपकी तैयारी, आपका लक्ष्य":"Your preparation. Your next step."):t(tab)} /></h1><p><ExpandedText text={language==="hi"?"अपनी चुनी हुई तैयारी को ऐप में सीखें।":"A focused learning space for the preparation you choose."} /></p></div><div className="intro-mark" aria-hidden="true">✳</div></div>
    <div className="workspace-quick-actions"><span><ExpandedText text={data?t(data.account.tier):t("free")} /> <ExpandedText text={"\u00b7"} /> <ExpandedText text={t("brandLine")} /></span><Button size="sm" variant="outline" disabled={refreshing||!configured||!authEnabled} onClick={()=>void reload()}><RefreshCw size={14} className={refreshing?"spin":""}/><ExpandedText text={t("refresh")} /></Button></div>
    {(!configured||!authEnabled)&&<div className="setup-banner" role="status"><BookOpen size={20}/><div><strong><ExpandedText text={t("setupTitle")} /></strong><p><ExpandedText text={t("setupHelp")} /></p></div></div>}
    {error&&<div className="error-banner" role="alert"><ExpandedText text={t(error)} /> {error==="signin_required"?<Link href="/sign-in"><ExpandedText text={t("signin")} /></Link>:<button onClick={()=>void reload()}><ExpandedText text={t("refresh")} /></button>}{error==="quota_exceeded"&&<button onClick={()=>navigate("plans")}><ExpandedText text={t("upgrade")} /></button>}</div>}
    {category==="notes"?notesContent??<Link href="/dashboard/notes">Open topic cards</Link>:tab==="plans"?<Membership key={access.selections.join(",")} selections={access.selections} enabled={billingEnabled} data={data?.account??null} onRefresh={refresh}/>:tab==="settings"?<Connections/>:needsPreparation?<PreparationSetup onSaved={refresh}/>:data?.account.tier==="free"&&!access.isSuperAdmin?<Membership key={access.selections.join(",")} selections={access.selections} enabled={billingEnabled} data={data.account} onRefresh={refresh}/>:<>
    {category!=="notes"&&(!data||category==="technology")&&<LearningSearch value={learningQuery} onChange={setLearningQuery}/>}
    {showCatalog?studyCatalog:libraries}
    <footer className="workspace-footer"><span>✦ MasterClass</span><span><ExpandedText text={t("brandLine")} /></span></footer></>}
    </main></div>{notesSelected&&<NotesModal key={notesSelected.id} document={notesSelected} initialProgress={progress.find(p=>p.document_id===notesSelected.id)} onClose={()=>{setNotesSelected(null);void refresh();}}/>}
    <Dialog open={confirmId!==null} onOpenChange={open=>{if(!open)setConfirmId(null);}}><DialogContent><DialogHeader><DialogTitle><ExpandedText text={t("deleteConfirm")} /></DialogTitle><DialogDescription><ExpandedText text={confirmDoc?`“${confirmDoc.title}” — `:""} /><ExpandedText text={t("deleteConfirmHelp")} /></DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={()=>setConfirmId(null)}><ExpandedText text={t("close")} /></Button><Button variant="destructive" disabled={busy} onClick={()=>confirmId&&void deleteDocument(confirmId)}><ExpandedText text={t("deleteConfirm")} /></Button></DialogFooter></DialogContent></Dialog>
    </div>;
}

