import {render,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {NotesModal} from "@/components/notes-modal";
import {DocumentRecord} from "@/lib/domain";
const document:DocumentRecord={id:"notes-1",user_id:"alice",title:"Learning functions",request:{technologyId:"js",topicId:"functions",format:"notes",language:"en",level:"beginner",theme:"minimal"},status:"ready",created_at:"2026-09-09T00:00:00Z",error_code:null,page_titles:["Notes"],storage_path:null,preview_paths:[],curriculum:{title:"Functions",minutes:20,objectives:["Use functions"],prerequisites:[],lessons:[],project:"Write a function",summary:"Functions return values.",glossary:[]}};
test("reads notes without waiting for file storage and offers text download",async()=>{render(<NotesModal document={document} onClose={jest.fn()}/>);expect(screen.getByText(/Functions return values/)).toBeInTheDocument();expect(screen.getByRole("link",{name:"Download"})).toHaveAttribute("href","/api/documents/notes-1/download");});
test("can close after a failed notes load",async()=>{global.fetch=jest.fn().mockResolvedValue({ok:false,json:async()=>({error:"service_error"})});const close=jest.fn();render(<NotesModal document={{...document,curriculum:null}} onClose={close}/>);await screen.findByRole("alert");await userEvent.click(screen.getByRole("button",{name:"Close"}));await waitFor(()=>expect(close).toHaveBeenCalled());});

test("public notebook shows every section in one scrolling view and downloads all their content",async()=>{
 const lessons=Array.from({length:5},(_,index)=>({title:`Section ${index+1}`,explanation:`Content ${index+1}`,example:"A worked example",code:"",exercise:"Practise this section",checkpoint:"Check your understanding",mistake:"Avoid skipping verification"}));
 render(<NotesModal sample document={{...document,curriculum:{...document.curriculum!,lessons}}} onClose={jest.fn()}/>);
 for(let i=1;i<=5;i++)expect(screen.getByRole("heading",{name:`Section ${i}`})).toBeInTheDocument();
 expect(screen.queryByRole("button",{name:"Next"})).not.toBeInTheDocument();
 const href=screen.getByRole("link",{name:"Download"}).getAttribute("href")!;
 expect(href).toMatch(/^data:text\/plain/);
 expect(decodeURIComponent(href)).toContain("Content 5");
});

test("the notes modal has no pagination: every lesson and the recap render together",async()=>{
 const user=userEvent.setup();
 const lessons=Array.from({length:2},(_,i)=>({title:`Topic ${i+1}`,explanation:`Explanation ${i+1}`,example:`Example ${i+1}`,code:`const topic = ${i+1};`,exercise:`Exercise ${i+1}`,checkpoint:`Checkpoint ${i+1}`,mistake:`Mistake ${i+1}`}));
 render(<NotesModal document={{...document,curriculum:{...document.curriculum!,lessons}}} onClose={jest.fn()}/>);
 expect(screen.getByText("What you'll learn")).toBeInTheDocument();
 expect(screen.getByRole("heading",{name:"Topic 1"})).toBeInTheDocument();
 expect(screen.getByRole("heading",{name:"Topic 2"})).toBeInTheDocument();
 expect(screen.getByText("Functions return values.")).toBeInTheDocument();
 expect(screen.getByRole("heading",{name:"Glossary"})).toBeInTheDocument();
 expect(screen.queryByRole("button",{name:"Next"})).not.toBeInTheDocument();
 expect(screen.queryByRole("button",{name:"Previous"})).not.toBeInTheDocument();
 await user.click(screen.getByRole("button",{name:"Copy notes"}));
 const copied=await navigator.clipboard.readText();
 expect(copied).toContain("Explanation 1");expect(copied).toContain("Explanation 2");
});
