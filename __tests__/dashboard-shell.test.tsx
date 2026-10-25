import { render,screen,within } from "@testing-library/react";
import { Workspace } from "@/components/workspace";
import userEvent from "@testing-library/user-event";
import { STUDY_COURSES } from "@/lib/study/catalog";
jest.mock("next/navigation",()=>({usePathname:()=>"/learning/techy",useRouter:()=>({replace:jest.fn(),refresh:jest.fn()})}));
jest.mock("@/lib/client",()=>({requestJson:jest.fn(),errorKey:()=>"service_error"}));

test.each([
  ["garvcontact30@gmail.com", true, true],
  ["garvcontact30@gmail.com", false, false],
  ["student@example.test", true, true],
  ["student@example.test", false, false],
])("header super admin access for %s with verified access %s", (email, isSuperAdmin, visible) => {
  render(<Workspace authEnabled configured={false} billingEnabled={false} userEmail={email} initialCategory="techy" notesContent={<div>Learning</div>} initialAccount={{profile:{language:"en"},account:{tier:"monthly",used:0,limit:50,creditBalance:0,subscription:null},preparations:{isSuperAdmin,selections:[]},documents:[],progress:[]}}/>);
  const link = within(screen.getByRole("banner")).queryByRole("link", {name:"Super admin"});
  if (visible) expect(link).toHaveAttribute("href", "/super-admin");
  else expect(link).not.toBeInTheDocument();
});

test("Techy has a separate professional section and renders its supplied deck", () => {
  render(<Workspace authEnabled={false} configured={false} billingEnabled={false} initialCategory="techy" notesContent={<section aria-label="Techy deck">Practice</section>}/>);
  const nav = within(screen.getByRole("navigation", { name: "Professional Learn" }));
  expect(nav.getByRole("link", { name: "Techy" })).toHaveAttribute("href", "/learning/techy");
  expect(nav.getByRole("link", { name: "Techy" })).toHaveAttribute("aria-current", "page");
  expect(nav.getByRole("link", { name: "API Docs" })).toHaveAttribute("href", "/learning/api-docs");
  expect(screen.getByRole("region", { name: "Techy deck" })).toBeVisible();
  expect(screen.queryByText("Your learning space is almost ready")).not.toBeInTheDocument();
});

test("My Library owns All technology notes and dashboard Notes only shows its topic content", async () => {
  const account = { profile: { language: "en" as const }, account: { tier: "monthly" as const, used: 0, limit: 50, creditBalance: 0, subscription: null }, preparations: { isSuperAdmin: true, selections: [] }, documents: [], progress: [] };
  const { unmount } = render(<Workspace authEnabled={false} configured={false} billingEnabled={false} initialTab="library" initialStudyCourses={[]} initialAccount={account} />);
  expect(await screen.findByRole("heading", { name: /All technology notes/ })).toBeVisible();
  unmount();
  render(<Workspace authEnabled={false} configured={false} billingEnabled={false} initialCategory="notes" initialAccount={account} notesContent={<section aria-label="Topic cards">Study topics</section>} />);
  expect(screen.getByRole("region", { name: "Topic cards" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: /All technology notes/ })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Notes" })).toHaveAttribute("href", "/learning/notes");
});
test("sidebar has learning navigation only and keeps account access in the header",()=>{
  localStorage.clear();render(<Workspace authEnabled configured={false} billingEnabled={false} userEmail="student@example.test" initialStudyCourses={[]} initialAccount={{profile:{language:"en"},account:{tier:"monthly",used:0,limit:50,creditBalance:0,subscription:null},preparations:{isSuperAdmin:false,selections:["nda"]},documents:[],progress:[]}}/>);
  const sidebar=within(screen.getByRole("complementary"));expect(sidebar.queryByRole("button",{name:"Membership"})).not.toBeInTheDocument();expect(sidebar.queryByRole("button",{name:"Connections"})).not.toBeInTheDocument();
  // The five preparation groups and Mentors were removed from the sidebar, and Class Room (school and exam
  // catalogues) was removed on 2026-10-24.
  for(const gone of ["Govt. Exams","Entrance Exams","Board Exams","Language Preparation","Courses & Interviews"]) expect(sidebar.queryByRole("button",{name:gone})).not.toBeInTheDocument();
  expect(sidebar.queryByRole("link",{name:"Mentors"})).not.toBeInTheDocument();
  expect(sidebar.queryByRole("link",{name:"Class Room"})).not.toBeInTheDocument();
  expect(sidebar.getByRole("button",{name:"Collapse sidebar"}).closest(".sidebar-brand-row")).not.toBeNull();
  expect(screen.getByRole("button",{name:"Your account"}).closest(".topbar")).not.toBeNull();
});

test("dashboard combines shared search and filters and clears the query from its chip",async()=>{
  const user=userEvent.setup();
  render(<Workspace authEnabled configured={false} billingEnabled={false} initialStudyCourses={STUDY_COURSES} initialAccount={{profile:{language:"en"},account:{tier:"monthly",used:0,limit:50,creditBalance:0,subscription:null},preparations:{isSuperAdmin:false,selections:["system-design"]},documents:[],progress:[]}}/>);
  const panel=within(screen.getByRole("search",{name:"Learning search and filters"}));
  const search=panel.getByRole("searchbox",{name:"Search all your learning"});
  expect(panel.getAllByRole("combobox")).toHaveLength(3);
  await user.keyboard("{Control>}k{/Control}");
  expect(search).toHaveFocus();
  await user.type(search,"WhatsApp");
  expect(panel.getByRole("status")).toHaveTextContent("1 guide found");
  await user.click(panel.getByRole("button",{name:"Remove search"}));
  expect(search).toHaveValue("");
  expect(panel.getByRole("status")).toHaveTextContent("12 guides found");
});

describe("the sidebar Search item and its AI Mode switch", () => {
  beforeEach(() => localStorage.clear());
  const shell = (category = "search") =>
    render(<Workspace authEnabled={false} configured={false} billingEnabled={false} initialCategory={category} notesContent={<div>Search</div>} />);

  test("the switch sits inside the Search item without nesting a button in the link", () => {
    shell();
    const search = screen.getByRole("link", { name: "Search" });
    const toggle = screen.getByRole("switch", { name: /AI Mode/ });

    // Same row, so it reads as one control group...
    const row = search.parentElement!;
    expect(row).toContainElement(toggle);
    // ...but the switch is a sibling, never a descendant of the link. A button
    // inside an anchor is invalid and leaves neither control operable.
    expect(search).not.toContainElement(toggle);
    expect(toggle.closest("a")).toBeNull();

    // The row carries the selected pill, which is what puts the switch on it.
    expect(row).toHaveAttribute("data-active");
  });

  test("the pill is only worn on the search page", () => {
    shell("notes");
    expect(screen.getByRole("link", { name: "Search" }).parentElement).not.toHaveAttribute("data-active");
  });

  test("toggling flips AI Mode and records it for the search page to read", async () => {
    shell();
    const toggle = screen.getByRole("switch", { name: /AI Mode/ });
    // On by default, so a question reaches a model unless it is turned off.
    expect(toggle).toBeChecked();
    expect(toggle).toHaveAccessibleName("AI Mode on");

    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAccessibleName("AI Mode off");
    expect(localStorage.getItem("masterclass:ai-search:ai-mode")).toBe("off");

    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(localStorage.getItem("masterclass:ai-search:ai-mode")).toBe("on");
  });
});
