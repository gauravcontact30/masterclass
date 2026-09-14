import { render,screen,within } from "@testing-library/react";
import { Workspace } from "@/components/workspace";
import userEvent from "@testing-library/user-event";
import { STUDY_COURSES } from "@/lib/study/catalog";
jest.mock("next/navigation",()=>({useRouter:()=>({replace:jest.fn(),refresh:jest.fn()})}));
jest.mock("@/lib/client",()=>({requestJson:jest.fn(),errorKey:()=>"service_error"}));

test("My Library owns All technology notes and dashboard Notes only shows its topic content", () => {
  const account = { profile: { language: "en" as const }, account: { tier: "monthly" as const, used: 0, limit: 50, creditBalance: 0, subscription: null }, preparations: { isSuperAdmin: true, selections: [] }, documents: [], progress: [] };
  const { unmount } = render(<Workspace authEnabled={false} configured={false} billingEnabled={false} initialTab="library" initialStudyCourses={[]} initialAccount={account} />);
  expect(screen.getByRole("heading", { name: /All technology notes/ })).toBeVisible();
  unmount();
  render(<Workspace authEnabled={false} configured={false} billingEnabled={false} initialCategory="notes" initialAccount={account} notesContent={<section aria-label="Topic cards">Study topics</section>} />);
  expect(screen.getByRole("region", { name: "Topic cards" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: /All technology notes/ })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Notes" })).toHaveAttribute("href", "/dashboard/notes");
});
test("sidebar has learning navigation only and keeps account access in the header",()=>{
  localStorage.clear();render(<Workspace authEnabled configured={false} billingEnabled={false} userEmail="student@example.test" initialStudyCourses={[]} initialAccount={{profile:{language:"en"},account:{tier:"monthly",used:0,limit:50,creditBalance:0,subscription:null},preparations:{isSuperAdmin:false,selections:["nda"]},documents:[],progress:[]}}/>);
  const sidebar=within(screen.getByRole("complementary"));expect(sidebar.queryByRole("button",{name:"Membership"})).not.toBeInTheDocument();expect(sidebar.queryByRole("button",{name:"Connections"})).not.toBeInTheDocument();
  expect(sidebar.getByRole("button",{name:"Govt. Exams"})).toHaveAttribute("aria-expanded","false");
  expect(sidebar.getByRole("button",{name:"Collapse sidebar"}).closest(".sidebar-brand-row")).not.toBeNull();
  expect(screen.getByRole("button",{name:"Your account"}).closest(".topbar")).not.toBeNull();
});

test("dashboard combines shared search and filters and clears the query from its chip",async()=>{
  const user=userEvent.setup();
  render(<Workspace authEnabled configured={false} billingEnabled={false} initialStudyCourses={STUDY_COURSES} initialAccount={{profile:{language:"en"},account:{tier:"monthly",used:0,limit:50,creditBalance:0,subscription:null},preparations:{isSuperAdmin:false,selections:["cbse-10"]},documents:[],progress:[]}}/>);
  const panel=within(screen.getByRole("search",{name:"Learning search and filters"}));
  const search=panel.getByRole("searchbox",{name:"Search all your learning"});
  expect(panel.getAllByRole("combobox")).toHaveLength(4);
  await user.keyboard("{Control>}k{/Control}");
  expect(search).toHaveFocus();
  await user.type(search,"Physics");
  expect(panel.getByRole("status")).toHaveTextContent("1 guide found");
  await user.click(panel.getByRole("button",{name:"Remove search"}));
  expect(search).toHaveValue("");
  expect(panel.getByRole("status")).toHaveTextContent("8 guides found");
});
