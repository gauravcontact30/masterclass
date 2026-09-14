import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SampleLessons } from "@/components/sample-lessons";
import type { DocumentRecord } from "@/lib/domain";
jest.mock("@/components/learn-modal",()=>({LearnModal:({document}:{document:DocumentRecord})=><div role="dialog">{document.request.format} reader</div>}));
jest.mock("@/components/notes-modal",()=>({NotesModal:({sample}:{sample:boolean})=><div role="dialog">{sample?"public notes reader":"private notes reader"}</div>}));
beforeEach(()=>{
  global.fetch=jest.fn().mockImplementation((url:string)=>Promise.resolve({ok:true,json:async()=>({id:url.includes("pptx")?"sample-slides":"sample-pdf",request:{format:url.includes("pptx")?"pptx":"pdf",language:"en"},preview_paths:[],curriculum:{objectives:[]}})}));
});
test.each([
  ["Preview the sample PDF guide","pdf reader"],
  ["Preview the sample slide deck","pptx reader"],
  ["Preview the sample study notes","public notes reader"],
])("opens the selected format: %s",async(name,expected)=>{
  render(<SampleLessons variant="showcase"/>);
  await userEvent.click(screen.getByRole("button",{name}));
  expect(await screen.findByRole("dialog")).toHaveTextContent(expected);
});
