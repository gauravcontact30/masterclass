"use client";
import { DocumentationRefresh } from "./documentation-refresh";
import { LearningSlot } from "./learning-slot";
import { LearningPagesNav } from "./learning-pages-nav";
import referenceStyles from "./reference-workspace.module.css";
import { ExpandedText } from "@/components/expanded-text";

import { useCallback,useEffect,useMemo,useRef,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DASHBOARD_ROUTES, type WorkspaceTab } from "@/lib/dashboard-routes";
import { toast } from "sonner";
import { ArrowUpRight,Award,Bookmark,BookMarked,BookOpen,BookOpenText,Coffee,CircleHelp,Code2,ChevronRight,Compass,FileCode2,Languages,Layers,Library as LibraryIcon,Link2,LogOut,MessagesSquare,ListOrdered,PanelLeftClose,PanelLeftOpen,Search,Sparkles,Sun,RefreshCw,Users,Workflow } from "lucide-react";
import type { DocumentRecord,GenerationRequest,Language,Progress,Technology,Tier,Topic } from "@/lib/domain";
import dynamic from "next/dynamic";
import { uniqueLibraryDocuments } from "@/lib/library";
const Library = dynamic(() => import("./library").then(module => module.Library), { loading: () => <LearningLoader size="inline" /> });
import { errorKey,requestJson } from "@/lib/client";
import { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { LanguageSwitcher } from "./language-switcher";
import { useAiMode } from "@/lib/ai-mode";
import { Wordmark } from "./brand-mark";
const NotesModal = dynamic(() => import("./notes-modal").then(module => module.NotesModal), { loading: () => <LearningLoader size="inline" /> });
const Membership = dynamic(() => import("./membership").then(module => module.Membership), { loading: () => <LearningLoader size="inline" /> });
const StudyCatalog = dynamic(() => import("./study-catalog").then(module => module.StudyCatalog), { loading: () => <LearningLoader size="inline" /> });
import { LearningSearch } from "./learning-filters";
const NotesLibrary = dynamic(() => import("./notes-library").then(module => module.NotesLibrary), { loading: () => <LearningLoader size="inline" /> });
import { LearningPresence } from "./learning-presence";
import { TrialBanner } from "./trial-banner";
import { SidebarTooltips } from "./sidebar-tooltips";
import { SidebarSearch } from "./sidebar-search";
const PreparationSetup = dynamic(() => import("./preparation-setup").then(module => module.PreparationSetup), { loading: () => <LearningLoader size="inline" /> });
import type { StudyCourse } from "@/lib/study/types";
import { CATEGORY_LABELS, PREPARATIONS, type PreparationAccess } from "@/lib/study/preparations";
const Connections = dynamic(() => import("./connections").then(module => module.Connections), { loading: () => <LearningLoader size="inline" /> });
import { Button } from "./ui/button";
import { Popover,PopoverContent,PopoverTrigger } from "./ui/popover";
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from "./ui/dialog";
import { LearningLoader } from "./learning-loader";
import { NotificationCenter } from "./notification-center";
import { askStudyBuddy } from "@/lib/study-buddy-bridge";
type AccountData={preparations?:PreparationAccess;profile:{language:Language};account:{tier:Tier;trialEndsAt?:string|null;used:number;limit:number;subscription:{current_period_end:string|null;status:string;cancel_at_cycle_end:boolean}|null;creditBalance:number};documents:DocumentRecord[];progress:Progress[]};
const tabIcons={dashboard:Compass,library:LibraryIcon,plans:Layers,settings:Link2} as const;
function Identity({email,isSuperAdmin,onNavigate}:{email:string|null;isSuperAdmin:boolean;onNavigate:(tab:WorkspaceTab)=>void}){const {t}=useLanguage();const router=useRouter();const [busy,setBusy]=useState(false);const [open,setOpen]=useState(false);
  async function signOut(){setBusy(true);try{// The Supabase client loads only when someone signs out, not with the dashboard.
    const {supabaseBrowser}=await import("@/lib/supabase-browser");const {error}=await supabaseBrowser().auth.signOut();if(error)toast.error(error.message);router.replace("/");router.refresh();}finally{setBusy(false);}}
  if(!email)return <Link className="signin-link" href="/sign-in"><ExpandedText text={t("signin")} /><ArrowUpRight size={15}/></Link>;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger className="profile-trigger" aria-label={t("account")}><span className="profile-avatar" aria-hidden="true"><ExpandedText text={email.charAt(0).toUpperCase()} /></span></PopoverTrigger>
    <PopoverContent align="end" sideOffset={12} className="profile-menu">
      <span className="profile-menu-email"><ExpandedText text={email} /></span>
      <span className="profile-menu-sep" role="separator"/>
      {(["dashboard","library","plans"] as const).map(id=>{const Icon=tabIcons[id];return <button type="button" key={id} className="profile-menu-item" onClick={()=>{setOpen(false);onNavigate(id);}}><Icon size={16}/><ExpandedText text={t(id)} /></button>;})}
      {isSuperAdmin&&<Link className="profile-menu-item" href="/dashboard/super-admin"><Users size={16}/><ExpandedText text={t("superAdmin")} /></Link>}
      <span className="profile-menu-sep" role="separator"/>
      <button type="button" className="profile-menu-item profile-menu-item-destructive" disabled={busy} onClick={()=>void signOut()}><LogOut size={16}/><ExpandedText text={t("signout")} /></button>
    </PopoverContent>
  </Popover>;}
export type { WorkspaceTab } from "@/lib/dashboard-routes";
// Professional learning sections render their own page content instead of the study catalog.
const PRO_SECTIONS=[{id:"official-docs",key:"officialDocs",label:"Official Docs",icon:BookMarked},{id:"techy",key:"techy",label:"Techy",icon:Code2},{id:"api-docs",key:"apiDocs",label:"API Docs",icon:FileCode2},{id:"workflow",key:"workflow",label:"Workflow",icon:Workflow},{id:"certifications",key:"certifications",label:"Certifications",icon:Award},{id:"lessons",key:"lessons",label:"Lessons",icon:BookOpenText},{id:"quiz",key:"quiz",label:"Quiz",icon:CircleHelp},{id:"interview",key:"interview",label:"Interview",icon:MessagesSquare}] as const;
/**
 * The catalogue is the same on every dashboard page, and each page mounts its own Workspace, so one request is shared
 * across navigations for a minute instead of refetching 40 KB on every click. Refresh asks for a fresh copy.
 */
let catalogCache:{at:number;request:Promise<{technologies:Technology[];topics:Topic[]}>}|null=null;
function loadCatalog(fresh=false){
  if(process.env.NODE_ENV==="test")return requestJson<{technologies:Technology[];topics:Topic[]}>("/api/catalog");
  if(!fresh&&catalogCache&&Date.now()-catalogCache.at<60000)return catalogCache.request;
  const request=requestJson<{technologies:Technology[];topics:Topic[]}>("/api/catalog");
  catalogCache={at:Date.now(),request};
  request.catch(()=>{if(catalogCache?.request===request)catalogCache=null;});
  return request;
}
const isProSection=(category?:string)=>PRO_SECTIONS.some(section=>section.id===category);
/**
 * Search and its AI Mode switch share one row: the flag changes nothing
 * anywhere else, so it belongs beside the destination it governs. On, a
 * question is answered by a model; off, from the app's own notes. A switch
 * cannot nest inside the link — a `button` inside an `a` is invalid and leaves
 * neither control reliably operable — so the two stay siblings and the *row*
 * carries the selected pill. That is what puts the switch inside the Search
 * item visually while keeping the markup honest. The row stacks when the
 * sidebar is collapsed. The flag lives in lib/ai-mode so the search page,
 * which is a separate tree, reads the same value.
 */
function SearchNavRow({collapsed,active}:{collapsed:boolean;active:boolean}){const {t}=useLanguage();const [enabled,setEnabled]=useAiMode();const label=enabled?t("searchAiModeOn"):t("searchAiModeOff");const searchLabel=t("searchNav");
  return <div className="sidebar-search-row" data-active={active||undefined}>
    <Link aria-label={searchLabel} className="sidebar-notes" href="/dashboard/search" aria-current={active?"page":undefined}><Search size={17}/>{!collapsed&&searchLabel}{collapsed&&<span className="sidebar-tooltip">{searchLabel}</span>}</Link>
    <button type="button" role="switch" aria-checked={enabled} className="sidebar-ai-mode" aria-label={label} onClick={()=>setEnabled(!enabled)}>
      {collapsed?<Sparkles size={16} data-on={enabled||undefined}/>:<><span className="sidebar-ai-tag" aria-hidden="true">AI</span><span className="sidebar-ai-switch" data-on={enabled||undefined} aria-hidden="true"><i/></span></>}
      <span className="sidebar-tooltip">{label}</span>
    </button>
  </div>;}
export function Workspace({authEnabled,configured,billingEnabled,userEmail=null,initialTab="dashboard",initialAccount=null,initialCategory,initialPreparation="",initialCourse,initialStudyCourses,notesContent,learning,learnSlug,learnTitle}:{learnSlug?:string;learnTitle?:string;notesContent?:React.ReactNode;learning?:React.ReactNode;initialStudyCourses?:StudyCourse[];initialPreparation?:string;initialCourse?:string;initialCategory?:string;authEnabled:boolean;configured:boolean;billingEnabled:boolean;userEmail?:string|null;initialTab?:WorkspaceTab;initialAccount?:AccountData|null}) {
  const {t,language,setLanguage}=useLanguage();const router=useRouter();const tab=initialTab;
  const [learningQuery,setLearningQuery]=useState("");const [sidebarQuery,setSidebarQuery]=useState("");
  const [notesSelected,setNotesSelected]=useState<DocumentRecord|null>(null);const [refreshing,setRefreshing]=useState(false);
  const [collapsed,setCollapsed]=useState(false);const category=initialCategory;
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Reads a client-only preference after mount; initial `false` must match SSR output.
  useEffect(()=>{try{setCollapsed(localStorage.getItem("masterclass:sidebar-collapsed")==="1");}catch{}},[]);
  function toggleCollapsed(){setCollapsed(prev=>{const next=!prev;try{localStorage.setItem("masterclass:sidebar-collapsed",next?"1":"0");}catch{}return next;});}
  function navigate(next:WorkspaceTab){router.push(DASHBOARD_ROUTES[next]);}
  const [catalog,setCatalog]=useState<{technologies:Technology[];topics:Topic[]}>({technologies:[],topics:[]});
  const [data,setData]=useState<AccountData|null>(initialAccount);const [loading,setLoading]=useState(configured);const [busy,setBusy]=useState(false);const [error,setError]=useState<TranslationKey|null>(null);const [confirmId,setConfirmId]=useState<string|null>(null);const [copiedId,setCopiedId]=useState<string|null>(null);const hydrated=useRef(false);
  const preparationKey=data?.preparations?.selections.join(",")??"";
  const catalogReady=!authEnabled||data!==null;
  const refresh=useCallback(async()=>{if(!configured||!authEnabled)return;try{const result=await requestJson<AccountData>("/api/account");setData(result);if(!hydrated.current){setLanguage(result.profile.language,false);hydrated.current=true;}setError(null);}catch(e){setError(errorKey(e));}},[configured,authEnabled,setLanguage,setError,setData]);
  useEffect(()=>{let active=true;if(configured&&catalogReady){void loadCatalog().then(result=>{if(active)setCatalog(result);}).catch(e=>{if(active)setError(errorKey(e));}).finally(()=>{if(active)setLoading(false);});}return()=>{active=false;};},[configured,catalogReady,preparationKey]);
  useEffect(()=>{Promise.resolve().then(refresh);},[refresh]);
  useEffect(()=>{if(!data?.documents.some(d=>d.status==="queued"||d.status==="generating"))return;const interval=setInterval(()=>void refresh(),5000);return()=>clearInterval(interval);},[data,refresh]);
  async function generate(input:GenerationRequest){setBusy(true);setError(null);try{const {document}=await requestJson<{document:DocumentRecord}>("/api/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});await refresh();if(document.status==="ready"){toast.success(`${document.title} — ${t("ready")}`);setNotesSelected(document);}else{toast(`${document.title} — ${t("generating")}…`);navigate("library");}}catch(e){const key=errorKey(e);setError(key);toast.error(t(key));}finally{setBusy(false);}}
  async function deleteDocument(id:string){setBusy(true);setError(null);try{await requestJson(`/api/documents/${id}`,{method:"DELETE"});setConfirmId(null);await refresh();}catch(e){setError(errorKey(e));}finally{setBusy(false);}}
  async function copyNotes(item:DocumentRecord){setError(null);try{const {document}=await requestJson<{document:DocumentRecord}>(`/api/documents/${item.id}`);if(!document.curriculum)throw new Error("not_ready");const {curriculumNotes}=await import("@/lib/notes");await navigator.clipboard.writeText(curriculumNotes(document.curriculum,document.title,document.request.language));setCopiedId(item.id);setTimeout(()=>setCopiedId(id=>id===item.id?null:id),2500);}catch{setError("copyNotesFailed");}}
  const documents=useMemo(()=>uniqueLibraryDocuments(data?.documents??[]),[data?.documents]);const listed=new Set(documents.map(d=>d.id));const progress=(data?.progress??[]).filter(p=>listed.has(p.document_id));const continuing=progress.filter(p=>!p.completed).sort((a,b)=>(b.updated_at??"").localeCompare(a.updated_at??""))[0];const resumeDoc=documents.find(d=>d.id===continuing?.document_id&&d.status==="ready");
  const openedDocument = useRef<string | null>(null);
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("document");
    if (!target || openedDocument.current === target) return;
    const item = documents.find(document => document.id === target && document.status === "ready");
    if (item) { openedDocument.current = target; queueMicrotask(() => setNotesSelected(item)); }
  }, [documents]);
  const access=data?.preparations??{selections:[],isSuperAdmin:false};
  const showSuperAdmin=authEnabled&&access.isSuperAdmin;
  const activePreparation=category?PREPARATIONS.find(option=>option.id===initialPreparation):undefined;
  const needsPreparation=!!data&&!access.isSuperAdmin&&!access.selections.length;
  const confirmDoc=documents.find(d=>d.id===confirmId);
  async function reload(){setRefreshing(true);try{const result=await loadCatalog(true);setCatalog(result);await refresh();}catch(e){setError(errorKey(e));}finally{setRefreshing(false);}}
  // Dashboard and My Library share one search and filters panel (inside StudyCatalog); their libraries render beneath it.
  const libraries=<>{!category&&tab==="library"&&<NotesLibrary externalQuery={data?learningQuery:undefined} onQueryChange={data?setLearningQuery:undefined} documents={documents} technologies={catalog.technologies} topics={catalog.topics} progress={progress} loading={loading} busy={busy} copiedId={copiedId} onLearn={setNotesSelected} onCopyNotes={item=>void copyNotes(item)} onRetry={request=>void generate(request)} onDelete={item=>setConfirmId(item.id)}/>}{!learningQuery&&resumeDoc&&(!category||category==="technology")&&<button className="resume-strip" onClick={()=>setNotesSelected(resumeDoc)}><BookOpen size={20}/><span><small><ExpandedText text={t("resume")} /></small><strong><ExpandedText text={resumeDoc.title} /></strong></span><ArrowUpRight size={18}/></button>}{(!category&&tab!=="library"||category==="technology")&&(access.isSuperAdmin||access.selections.some(id=>id.startsWith("tech:")))&&<Library externalQuery={learningQuery} onQueryChange={setLearningQuery} documents={initialPreparation.startsWith("tech:")&&category==="technology"?documents.filter(doc=>doc.request.technologyId===initialPreparation.slice(5)):documents} technologies={catalog.technologies} topics={catalog.topics} progress={progress} loading={loading} busy={busy} copiedId={copiedId} onLearn={setNotesSelected} onCopyNotes={item=>void copyNotes(item)} onRetry={request=>void generate(request)} onDelete={item=>setConfirmId(item.id)}/>}</>;
  const pro=isProSection(category)||category==="learn";
  // Upload Learning places content by page: a custom page, a section or category, or the tab.
  const slotPage=category==="learn"?`learn:${learnSlug}`:category??tab;
  /** The main dashboard drops the intro line and the plan/refresh row: its learning sections speak for themselves. */
  const home=!category&&tab==="dashboard";
  /**
   * One refresh control, two homes. Every other page gives it a row of its own
   * under the breadcrumb; Search does not, because that row would push the
   * page's own "Search" heading down the screen for the sake of a button
   * nobody came for. There it rides in the topbar instead, beside the other
   * chrome-level actions.
   */
  const refreshButton=<Button size="sm" variant="outline" className="refresh-action" disabled={refreshing||!configured||!authEnabled} onClick={()=>void reload()}><RefreshCw size={14} className={refreshing?"spin":""}/><ExpandedText text={t("refresh")} /></Button>;
  const showCatalog=!!data&&category!=="technology"&&category!=="notes"&&category!=="bookmark"&&!pro;
  const studyCatalog=<StudyCatalog beforeLibrary={libraries} initialCourses={initialStudyCourses} key={`${category??"all"}:${tab}`} category={category} initialPreparation={category?initialPreparation:""} initialCourse={category?initialCourse:undefined} searchQuery={learningQuery} onSearchChange={setLearningQuery} preparations={access} onPlans={()=>navigate("plans")}/>;
  return <div className={`app-shell compact-workspace${category==="official-docs"||(!category&&tab==="dashboard")?` ${referenceStyles.shell}`:""}${collapsed?" sidebar-collapsed":""}`}><aside className="sidebar learning-sidebar"><SidebarTooltips collapsed={collapsed}/><div className="sidebar-brand-row"><Link href="/" className="wordmark" aria-label="MasterClass home"><Wordmark /></Link><button type="button" className="sidebar-toggle" aria-expanded={!collapsed} aria-label={collapsed?t("expandSidebar"):t("collapseSidebar")} title={collapsed?t("expandSidebar"):t("collapseSidebar")} onClick={toggleCollapsed}>{collapsed?<PanelLeftOpen size={17}/>:<PanelLeftClose size={17}/>}</button></div><SidebarSearch query={sidebarQuery} onQueryChange={setSidebarQuery} access={access} hi={language==="hi"} collapsed={collapsed} onExpand={toggleCollapsed} onNavigateTab={navigate}/><div className="sidebar-label">{t("introLabel")}</div><div className="sidebar-options"><nav aria-label={t("dashboard")}>{([{id:"dashboard",icon:Compass},{id:"library",icon:LibraryIcon}] as const).flatMap(({id,icon:Icon})=>[<Link key={id} href={DASHBOARD_ROUTES[id]} aria-label={t(id)} aria-current={!category&&tab===id?"page":undefined} className={`sidebar-notes ${!category&&tab===id?"active":""}`}><Icon size={17}/>{!collapsed&&<>{t(id)}{tab===id&&<ChevronRight size={15}/>}</>}{collapsed&&<span className="sidebar-tooltip">{t(id)}</span>}</Link>,...(id==="dashboard"?[<SearchNavRow key="ai-search" collapsed={collapsed} active={category==="search"}/>,<Link key="step-by-step" aria-label={t("onTheGo")} className="sidebar-notes" href="/dashboard/step-by-step" aria-current={category==="step-by-step"?"page":undefined}><ListOrdered size={17}/>{!collapsed&&t("onTheGo")}{collapsed&&<span className="sidebar-tooltip">{t("onTheGo")}</span>}</Link>]:[])])}<Link aria-label={t("notes")} className="sidebar-notes" href="/dashboard/notes" aria-current={category==="notes"?"page":undefined}><BookOpen size={17}/>{!collapsed&&t("notes")}{collapsed&&<span className="sidebar-tooltip">{t("notes")}</span>}</Link><Link aria-label={t("vocabulary")} className="sidebar-notes" href="/dashboard/vocabulary" aria-current={category==="vocabulary"?"page":undefined}><BookOpenText size={17}/>{!collapsed&&t("vocabulary")}{collapsed&&<span className="sidebar-tooltip">{t("vocabulary")}</span>}</Link><Link aria-label={t("coffeeAndCode")} className="sidebar-notes" href="/dashboard/coffee-and-code" aria-current={category==="coffee-and-code"?"page":undefined}><Coffee size={17}/>{!collapsed&&t("coffeeAndCode")}{collapsed&&<span className="sidebar-tooltip">{t("coffeeAndCode")}</span>}</Link><Link aria-label={t("bookmark")} className="sidebar-notes" href="/dashboard/bookmark" aria-current={category==="bookmark"?"page":undefined}><Bookmark size={17}/>{!collapsed&&t("bookmark")}{collapsed&&<span className="sidebar-tooltip">{t("bookmark")}</span>}</Link></nav><div className="sidebar-label">{!collapsed&&t("professionalLearn")}</div><nav aria-label={t("professionalLearn")} className="sidebar-pro-nav">{PRO_SECTIONS.map(({id,key,icon:Icon})=><Link key={id} href={`/dashboard/${id}`} aria-label={t(key)} className="sidebar-notes" aria-current={category===id?"page":undefined}><Icon size={17}/>{!collapsed&&<>{t(key)}<ChevronRight size={14}/></>}{collapsed&&<span className="sidebar-tooltip">{t(key)}</span>}</Link>)}</nav><LearningPagesNav collapsed={collapsed} activeSlug={category==="learn"?learnSlug:undefined}/></div></aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><ExpandedText text={t("dashboard")} /><ChevronRight size={14}/><span><ExpandedText text={PRO_SECTIONS.find(section=>section.id===category)?t(PRO_SECTIONS.find(section=>section.id===category)!.key):(category==="learn"?(learnTitle??"Your pages"):category==="search"?t("searchNav"):category==="step-by-step"?t("onTheGo"):category==="bookmark"?t("bookmark"):category==="vocabulary"?t("vocabulary"):category==="coffee-and-code"?t("coffeeAndCode"):category?CATEGORY_LABELS[category]?.[language]:t(tab))} /></span></div><div className="topbar-actions"><DocumentationRefresh />{category==="search"&&refreshButton}{showSuperAdmin&&<Link href="/dashboard/super-admin" className="super-admin-header-link"><Users size={16} aria-hidden="true"/><span>{t("superAdmin")}</span><ArrowUpRight size={14} aria-hidden="true"/></Link>}<LanguageSwitcher /><button type="button" className="super-admin-header-link" onClick={()=>askStudyBuddy()} title={t("askAiTooltip")}><Sparkles size={16} aria-hidden="true"/><span>{t("askAi")}</span></button>{authEnabled&&<NotificationCenter/>}<span className="topbar-divider"/>{authEnabled?<Identity email={userEmail} isSuperAdmin={!!showSuperAdmin} onNavigate={navigate}/>:<Link href="/sign-in" className="signin-link"><ExpandedText text={t("signin")} /><ArrowUpRight size={15}/></Link>}</div></header>
    <LearningPresence enabled={authEnabled&&!!userEmail}/><main className="workspace"><LearningSlot surface="dashboard" page={slotPage} section="top"/>{data&&!access.isSuperAdmin&&<TrialBanner tier={data.account.tier} endsAt={data.account.trialEndsAt} hi={language==="hi"} onPlans={()=>navigate("plans")} onExpired={refresh}/>}{category!=="bookmark"&&category!=="search"&&category!=="step-by-step"&&category!=="vocabulary"&&category!=="coffee-and-code"&&!pro&&<div className="page-intro"><div><p className="eyebrow"><Sun size={15}/><ExpandedText text={t("introLabel")} /></p><h1><ExpandedText text={category?(activePreparation?.label[language]??CATEGORY_LABELS[category]?.[language]):tab==="dashboard"?t("yourPreparation"):t(tab)} /></h1>{!home&&<p><ExpandedText text={t("focusedLearningSpace")} /></p>}</div><div className="intro-mark" aria-hidden="true">✳</div></div>}
    {!pro&&!home&&category!=="search"&&category!=="step-by-step"&&category!=="vocabulary"&&category!=="coffee-and-code"&&<div className="workspace-quick-actions"><span><ExpandedText text={data?t(data.account.tier):t("free")} /> <ExpandedText text={"\u00b7"} /> <ExpandedText text={t("brandLine")} /></span>{refreshButton}</div>}
    {!pro&&(!configured||!authEnabled)&&<div className="setup-banner" role="status"><BookOpen size={20}/><div><strong><ExpandedText text={t("setupTitle")} /></strong><p><ExpandedText text={t("setupHelp")} /></p></div></div>}
    {error&&<div className="error-banner" role="alert"><ExpandedText text={t(error)} /> {error==="signin_required"?<Link href="/sign-in"><ExpandedText text={t("signin")} /></Link>:<button onClick={()=>void reload()}><ExpandedText text={t("refresh")} /></button>}{error==="quota_exceeded"&&<button onClick={()=>navigate("plans")}><ExpandedText text={t("upgrade")} /></button>}</div>}
    {category==="notes"||category==="bookmark"||category==="search"||category==="step-by-step"||category==="vocabulary"||category==="coffee-and-code"||pro?notesContent??<Link href="/dashboard/notes">Open topic cards</Link>:tab==="plans"?<Membership key={access.selections.join(",")} selections={access.focused?access.selections:[]} enabled={billingEnabled} data={data?.account??null} onRefresh={refresh}/>:tab==="settings"?<Connections/>:needsPreparation?<PreparationSetup onSaved={refresh}/>:data?.account.tier==="free"&&!access.isSuperAdmin?<Membership key={access.selections.join(",")} selections={access.focused?access.selections:[]} enabled={billingEnabled} data={data.account} onRefresh={refresh}/>:<>
    {!category&&tab==="dashboard"&&learning}
    {category!=="notes"&&(!data||category==="technology")&&<LearningSearch value={learningQuery} onChange={setLearningQuery}/>}
    {showCatalog?studyCatalog:libraries}
    <footer className="workspace-footer"><span>✦ MasterClass</span><span><ExpandedText text={t("brandLine")} /></span></footer></>}<LearningSlot surface="dashboard" page={slotPage} section="bottom"/></main></div>{notesSelected&&<NotesModal key={notesSelected.id} document={notesSelected} initialProgress={progress.find(p=>p.document_id===notesSelected.id)} onClose={()=>{setNotesSelected(null);void refresh();}}/>}
    <Dialog open={confirmId!==null} onOpenChange={open=>{if(!open)setConfirmId(null);}}><DialogContent><DialogHeader><DialogTitle><ExpandedText text={t("deleteConfirm")} /></DialogTitle><DialogDescription><ExpandedText text={confirmDoc?`“${confirmDoc.title}” — `:""} /><ExpandedText text={t("deleteConfirmHelp")} /></DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={()=>setConfirmId(null)}><ExpandedText text={t("close")} /></Button><Button variant="destructive" disabled={busy} onClick={()=>confirmId&&void deleteDocument(confirmId)}><ExpandedText text={t("deleteConfirm")} /></Button></DialogFooter></DialogContent></Dialog>
    </div>;
}
