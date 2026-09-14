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
  const props={preparations:{isSuperAdmin:false,selections:["cbse-10"]},category:"cbse",initialCourses:STUDY_COURSES,onPlans:jest.fn()};
  const {rerender}=render(<StudyCatalog {...props} searchQuery=""/>);
  expect(screen.getByRole("heading",{name:"Your learning library 8"})).toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(6);
  expect(screen.getByText("Showing 1–6 of 8")).toBeInTheDocument();
  await user.click(screen.getByRole("button",{name:"Next"}));
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getByText("Showing 7–8 of 8")).toBeInTheDocument();
  rerender(<StudyCatalog {...props} searchQuery="Maths"/>);
  expect(within(screen.getByRole("region",{name:"Class 10"})).getByRole("article",{name:"Maths"})).toBeInTheDocument();
  expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
  expect(screen.queryByRole("navigation",{name:"Library pages"})).not.toBeInTheDocument();
});
test("class sections paginate independently and search resets each section",async()=>{
  const user=userEvent.setup();
  const props={preparations:{isSuperAdmin:false,selections:["cbse-9","cbse-10"]},category:"cbse",initialCourses:STUDY_COURSES,onPlans:jest.fn()};
  const {rerender}=render(<StudyCatalog {...props} searchQuery=""/>);
  const ninth=within(screen.getByRole("region",{name:"Class 9"}));
  const tenth=within(screen.getByRole("region",{name:"Class 10"}));
  expect(ninth.getAllByRole("article")).toHaveLength(6);
  expect(tenth.getAllByRole("article")).toHaveLength(6);
  expect(ninth.getByRole("article",{name:"Maths"})).not.toHaveTextContent("Class 9");
  await user.click(ninth.getByRole("button",{name:"Next"}));
  expect(ninth.getAllByRole("article")).toHaveLength(2);
  expect(tenth.getAllByRole("article")).toHaveLength(6);
  expect(tenth.getByRole("button",{name:"Previous"})).toBeDisabled();
  rerender(<StudyCatalog {...props} searchQuery="Physics"/>);
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.queryByRole("navigation",{name:"Library pages"})).not.toBeInTheDocument();
  rerender(<StudyCatalog {...props} searchQuery=""/>);
  expect(within(screen.getByRole("region",{name:"Class 9"})).getByRole("button",{name:"Previous"})).toBeDisabled();
});
test("class and subject filters narrow published guides, clear restores them, and Learn in App opens the matching reader",async()=>{
  const access={isSuperAdmin:false,selections:["cbse-9","cbse-10"]};
  render(<StudyCatalog preparations={access} category="cbse" initialCourses={STUDY_COURSES} initialPreparation="cbse-10" onPlans={jest.fn()}/>);
  expect(screen.getByRole("status")).toHaveTextContent("8 guides found");
  fireEvent.click(screen.getByRole("combobox",{name:"Subject"}));
  fireEvent.click(screen.getByRole("option",{name:"Maths"}));
  expect(screen.getByRole("status")).toHaveTextContent("1 guide found");
  const course=STUDY_COURSES.find(course=>course.id==="cbse-10-maths")!;jest.mocked(requestJson).mockResolvedValue({pack:{course,language:"en",access:{viewerKey:"student"}}});
  fireEvent.click(screen.getByRole("button",{name:"Learn in App: CBSE · Class 10 · Maths"}));
  expect(await screen.findByRole("dialog")).toHaveTextContent("CBSE · Class 10 · Maths");
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button",{name:"Close"}));
  fireEvent.click(screen.getByRole("button",{name:"Clear filters"}));expect(screen.getByRole("status")).toHaveTextContent("16 guides found");
  fireEvent.change(screen.getByRole("searchbox",{name:"Search notes"}),{target:{value:"Physics"}});expect(screen.getByRole("status")).toHaveTextContent("2 guides found");
});
test("sidebar search reveals direct selected-class and system-design links without unrelated preparation",async()=>{
  const user=userEvent.setup();render(<StudyNavigation access={{isSuperAdmin:false,selections:["cbse-10","system-design"]}} collapsed={false}/>);
  await user.type(screen.getByRole("searchbox",{name:"Search sidebar"}),"Class 10");
  expect(screen.getByRole("link",{name:"CBSE · Class 10"})).toHaveAttribute("href","/dashboard/cbse?preparation=cbse-10");
  expect(screen.queryByText("Banking")).not.toBeInTheDocument();
  await user.clear(screen.getByRole("searchbox",{name:"Search sidebar"}));await user.type(screen.getByRole("searchbox",{name:"Search sidebar"}),"WhatsApp");
  await waitFor(()=>expect(screen.getByRole("link",{name:/WhatsApp/})).toHaveAttribute("href",expect.stringContaining("?course=design-")));
});
