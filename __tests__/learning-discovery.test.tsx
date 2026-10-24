import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudyCatalog } from "@/components/study-catalog";
import { StudyNavigation } from "@/components/study-navigation";
import { STUDY_COURSES } from "@/lib/study/catalog";
import { requestJson } from "@/lib/client";
import type { AnchorHTMLAttributes } from "react";
// Link prefetching is a Next runtime concern; navigation targets are asserted below.
jest.mock("next/link",()=>({__esModule:true,default:(props:AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props}/> }));
jest.mock("@/lib/client",()=>({requestJson:jest.fn()}));
// Reader behavior is covered by study-ui/study-reader suites; keep this suite
// focused on selecting the right guide and handing it to the reader.
jest.mock("@/components/study-reader",()=>({StudyReader:({pack,onClose}:{pack:{course:{title:{en:string}}};onClose:()=>void})=><div role="dialog">{pack.course.title.en}<button onClick={onClose}>Close</button></div>}));
test("study library paginates six guides and resets the page when the shared search changes",async()=>{
  const user=userEvent.setup();
  const props={preparations:{isSuperAdmin:false,selections:["system-design"]},category:"system-design",initialCourses:STUDY_COURSES,onPlans:jest.fn()};
  const {rerender}=render(<StudyCatalog {...props} searchQuery=""/>);
  expect(screen.getByRole("heading",{name:"Your learning library 12"})).toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(6);
  expect(screen.getByText("Showing 1–6 of 12")).toBeInTheDocument();
  await user.click(screen.getByRole("button",{name:"Next"}));
  expect(screen.getAllByRole("article")).toHaveLength(6);
  expect(screen.getByText("Showing 7–12 of 12")).toBeInTheDocument();
  rerender(<StudyCatalog {...props} searchQuery="WhatsApp"/>);
  expect(screen.getByRole("article",{name:"System Design · WhatsApp-style Messaging"})).toBeInTheDocument();
  expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
  expect(screen.queryByRole("navigation",{name:"Library pages"})).not.toBeInTheDocument();
});
test("school and exam guides are gone: old class and exam selections show nothing extra",()=>{
  render(<StudyCatalog preparations={{isSuperAdmin:false,selections:["cbse-10","nda","system-design"]}} initialCourses={STUDY_COURSES} onPlans={jest.fn()} searchQuery=""/>);
  expect(screen.getByRole("heading",{name:"Your learning library 12"})).toBeInTheDocument();
  expect(screen.queryByRole("region",{name:/^Class /})).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox",{name:"Class"})).not.toBeInTheDocument();
});
test("search narrows published guides, clear restores them, and Learn in App opens the matching reader",async()=>{
  const access={isSuperAdmin:false,selections:["system-design","ielts"]};
  render(<StudyCatalog preparations={access} initialCourses={STUDY_COURSES} onPlans={jest.fn()}/>);
  expect(screen.getByRole("status")).toHaveTextContent("13 guides found");
  fireEvent.change(screen.getByRole("searchbox",{name:"Search notes"}),{target:{value:"WhatsApp"}});
  expect(screen.getByRole("status")).toHaveTextContent("1 guide found");
  const course=STUDY_COURSES.find(course=>course.id==="design-whatsapp")!;jest.mocked(requestJson).mockResolvedValue({pack:{course,language:"en",access:{viewerKey:"student"}}});
  fireEvent.click(screen.getByRole("button",{name:"Learn in App: System Design · WhatsApp-style Messaging"}));
  expect(await screen.findByRole("dialog")).toHaveTextContent("System Design · WhatsApp-style Messaging");
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button",{name:"Close"}));
  fireEvent.click(screen.getByRole("button",{name:"Clear filters"}));expect(screen.getByRole("status")).toHaveTextContent("13 guides found");
});
test("sidebar search reveals direct system-design links without unrelated preparation",async()=>{
  // The query now comes from the sidebar search above the learning space.
  const access={isSuperAdmin:false,selections:["system-design"]};
  render(<StudyNavigation access={access} collapsed={false} query="WhatsApp"/>);
  await waitFor(()=>expect(screen.getByRole("link",{name:/WhatsApp/})).toHaveAttribute("href",expect.stringContaining("?course=design-")));
  expect(screen.queryByText("Banking")).not.toBeInTheDocument();
  expect(screen.queryByText(/CBSE/)).not.toBeInTheDocument();
});
