import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Workspace } from "@/components/workspace";
import { requestJson } from "@/lib/client";
import type { DocumentRecord } from "@/lib/domain";

jest.mock("@/lib/client",()=>({requestJson:jest.fn(),errorKey:()=>"service_error"}));
jest.mock("@/lib/supabase-browser",()=>({supabaseBrowser:()=>({auth:{signOut:jest.fn()}})}));
const mockRouterPush = jest.fn();
jest.mock("next/navigation",()=>({useRouter:()=>({push:mockRouterPush,replace:jest.fn(),refresh:jest.fn()})}));
jest.mock("@/components/learning-presence",()=>({LearningPresence:()=>null}));
jest.mock("@/components/membership",()=>({Membership:()=> <h2>Membership settings</h2>}));
jest.mock("@/components/study-catalog",()=>({StudyCatalog:({beforeLibrary}:{beforeLibrary:React.ReactNode})=><>{beforeLibrary}</>}));
function mockLibrary({documents,onLearn,onCopyNotes,onDelete,onRetry}:{documents:DocumentRecord[];onLearn:(d:DocumentRecord)=>void;onCopyNotes:(d:DocumentRecord)=>void;onDelete:(d:DocumentRecord)=>void;onRetry:(r:DocumentRecord["request"])=>void}){
 return <section aria-label="Saved notes">{documents.map(d=><article key={d.id}><h2>{d.title}</h2><button onClick={()=>onLearn(d)}>Read</button><button onClick={()=>onCopyNotes(d)}>Copy notes</button><button onClick={()=>onDelete(d)}>Delete</button><button onClick={()=>onRetry(d.request)}>Retry</button></article>)}</section>;
}
jest.mock("@/components/library",()=>({Library:mockLibrary}));
jest.mock("@/components/notes-library",()=>({NotesLibrary:mockLibrary}));
jest.mock("@/components/documentation-refresh",()=>({DocumentationRefresh:()=>null}));
jest.mock("@/components/notes-modal",()=>({NotesModal:({document,onClose}:{document:DocumentRecord;onClose:()=>void})=><div role="dialog" aria-label="Notes reader">{document.title}<button onClick={onClose}>Close reader</button></div>}));
const document:DocumentRecord={id:"notes-1",user_id:"user-1",title:"React basics",request:{technologyId:"react",topicId:"react-state",format:"notes",language:"en",level:"beginner"},status:"ready",created_at:"2026-01-01",error_code:null,page_titles:[],storage_path:null,preview_paths:[],curriculum:{title:"React basics",minutes:20,objectives:["Learn state"],prerequisites:[],lessons:[],project:"Build a component",summary:"State drives rendering.",glossary:[]}};
const account={profile:{language:"en" as const},account:{tier:"monthly" as const,used:1,limit:50,subscription:null,creditBalance:0},preparations:{selections:["tech:react"],isSuperAdmin:false},documents:[document],progress:[]};
beforeEach(()=>{localStorage.clear();window.history.replaceState(null,"","/dashboard");jest.mocked(requestJson).mockImplementation(async(url)=>url==="/api/account"?account:url==="/api/catalog"?{technologies:[],topics:[]}:{document});});
const renderWorkspace=(tab:"dashboard"|"library"="dashboard")=>render(<Workspace authEnabled configured billingEnabled initialTab={tab} initialAccount={account} userEmail="learner@example.com"/>);

test("returning from Search navigates to the real dashboard route", async () => {
 window.history.replaceState(null, "", "/dashboard/search");
 render(<Workspace authEnabled configured billingEnabled initialCategory="search" notesContent={<p>Search content</p>} initialAccount={account} userEmail="learner@example.com" />);
 await screen.findByText("Search content");
 expect(screen.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("href", "/dashboard");
 expect(screen.getByRole("link", { name: "My library", exact: true })).toHaveAttribute("href", "/dashboard/library");
});

test("loads the current account and exposes its saved notes",async()=>{
 renderWorkspace();expect(await screen.findByRole("heading",{name:"React basics"})).toBeVisible();
 expect(requestJson).toHaveBeenCalledWith("/api/account");expect(requestJson).toHaveBeenCalledWith("/api/catalog");
});

test("initial account hydration fetches account and permission-filtered catalog only once", async () => {
 jest.mocked(requestJson).mockClear();
 render(<Workspace authEnabled configured billingEnabled userEmail="learner@example.com" />);
 await waitFor(()=>expect(requestJson).toHaveBeenCalledWith("/api/catalog"));
 expect(jest.mocked(requestJson).mock.calls.filter(([url])=>url==="/api/account")).toHaveLength(1);
 expect(jest.mocked(requestJson).mock.calls.filter(([url])=>url==="/api/catalog")).toHaveLength(1);
});
test("My library exposes the same saved note actions",async()=>{
 renderWorkspace("library");expect(await screen.findByRole("region",{name:"Saved notes"})).toHaveTextContent("React basics");
 fireEvent.click(screen.getByRole("button",{name:"Read",exact:true}));expect(await screen.findByRole("dialog",{name:"Notes reader"})).toHaveTextContent("React basics");
 fireEvent.click(screen.getByRole("button",{name:"Close reader"}));expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
test("deletion requires confirmation before the request",async()=>{
 renderWorkspace();fireEvent.click(await screen.findByRole("button",{name:"Delete",exact:true}));
 const dialog=await screen.findByRole("dialog");expect(requestJson).not.toHaveBeenCalledWith("/api/documents/notes-1",{method:"DELETE"});
 fireEvent.click(within(dialog).getByRole("button",{name:"Delete for good?"}));
 await waitFor(()=>expect(requestJson).toHaveBeenCalledWith("/api/documents/notes-1",{method:"DELETE"}));
});
test("copies the loaded curriculum as notes",async()=>{
 const writeText=jest.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}});
 renderWorkspace();fireEvent.click(await screen.findByRole("button",{name:"Copy notes"}));
 await waitFor(()=>expect(writeText).toHaveBeenCalledWith(expect.stringContaining("State drives rendering.")));
});
test("failed copy is reported and does not write empty notes",async()=>{
 jest.mocked(requestJson).mockImplementation(async(url)=>url==="/api/account"?account:url==="/api/catalog"?{technologies:[],topics:[]}:{document:{...document,curriculum:null}});
 renderWorkspace();fireEvent.click(await screen.findByRole("button",{name:"Copy notes"}));
 expect(await screen.findByRole("alert")).toHaveTextContent(/copy/i);
});
test("retry sends the note request and opens a completed result",async()=>{
 renderWorkspace();fireEvent.click(await screen.findByRole("button",{name:"Retry",exact:true}));
 expect(await screen.findByRole("dialog",{name:"Notes reader"})).toHaveTextContent("React basics");
 expect(requestJson).toHaveBeenCalledWith("/api/documents",expect.objectContaining({method:"POST",body:JSON.stringify(document.request)}));
});
