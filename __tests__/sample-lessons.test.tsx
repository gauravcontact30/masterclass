import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SampleLessons } from "@/components/sample-lessons";
import type { DocumentRecord } from "@/lib/domain";
jest.mock("@/components/notes-modal",()=>({NotesModal:({sample,document,onClose}:{sample:boolean;document:DocumentRecord;onClose:()=>void})=><div role="dialog"><span>{sample ? "public" : "private"} notes reader: {document.title}</span><button onClick={onClose}>Close sample</button></div>}));
test.each([0,1,2])("opens and closes authored sample %s without a network request",async(index)=>{
 global.fetch=jest.fn();render(<SampleLessons/>);
 const buttons=screen.getAllByRole("button");
 await waitFor(()=>expect(buttons[index]).toBeEnabled());
 fireEvent.click(buttons[index]);
 expect(await screen.findByRole("dialog")).toHaveTextContent("public notes reader");
 expect(fetch).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button",{name:"Close sample"}));
 expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
