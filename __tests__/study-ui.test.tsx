import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudyNavigation } from "@/components/study-navigation";
import { StudyReader } from "@/components/study-reader";
import { Membership } from "@/components/membership";
import { LandingPage } from "@/components/landing-page";
import { buildStudyPack } from "@/lib/study/content";
import { findStudyCourse } from "@/lib/study/catalog";
import { requestJson } from "@/lib/client";
import { gradePaper } from "@/lib/study/types";
jest.mock("@/lib/client", () => ({ requestJson: jest.fn(), errorKey: () => "service_error" }));
beforeEach(() => { localStorage.clear(); jest.mocked(requestJson).mockResolvedValue({ monthly: 299, yearly: 2999, enabled: true }); });
test("sidebar starts with main categories only and exposes authorized paths through exclusive accordions", async () => {
  const user=userEvent.setup();const {rerender}=render(<StudyNavigation access={{selections:["nda","cbse-10","system-design"],isSuperAdmin:false}} collapsed={false}/>);
  expect(screen.getByRole("button",{name:"Govt. Exams"})).toHaveAttribute("aria-expanded","false");
  expect(screen.queryByRole("button",{name:"Defence & Security"})).not.toBeInTheDocument();
  await user.click(screen.getByRole("button",{name:"Govt. Exams"}));
  await user.click(screen.getByRole("button",{name:"Defence & Security"}));
  expect(screen.getByRole("link",{name:"Defence & Security"})).toHaveAttribute("href","/dashboard/defence");
  expect(screen.queryByRole("button",{name:"Banking"})).not.toBeInTheDocument();
  await user.click(screen.getByRole("button",{name:"Courses & Interviews"}));
  expect(screen.getByRole("button",{name:"Govt. Exams"})).toHaveAttribute("aria-expanded","false");
  expect(screen.queryByRole("link",{name:"Defence & Security"})).not.toBeInTheDocument();
  await user.click(screen.getByRole("button",{name:"System Design"}));expect(screen.getByRole("link",{name:"System Design"})).toBeInTheDocument();
  rerender(<StudyNavigation access={{selections:[],isSuperAdmin:true}} collapsed={false}/>);
  await user.click(screen.getByRole("button",{name:"Board Exams"}));
  for(const board of ["CBSE","NCERT","ICSE","ISC"]){await user.click(screen.getByRole("button",{name:board}));expect(screen.getByRole("link",{name:board})).toHaveAttribute("href",`/dashboard/${board.toLowerCase()}`);}
});

test("reader navigation, collapsing and revision persistence work without exposing other accounts' notes", async () => {
  const user = userEvent.setup(); const pack = buildStudyPack(findStudyCourse("cbse-10-maths")!, "en", "monthly", "learner-a");
  localStorage.setItem("masterclass:study:learner-b:cbse-10-maths:en", JSON.stringify({ notes: "Private other account note" }));
  render(<StudyReader pack={pack} onClose={jest.fn()} onPlans={jest.fn()} />);
  expect(screen.queryByDisplayValue("Private other account note")).not.toBeInTheDocument();
  const next = screen.getByRole("button", { name: "Next lesson" }); expect(next.closest("header")).not.toBeNull();
  await user.click(screen.getByRole("button", { name: "Collapse contents" }));
  expect(document.getElementById("study-contents")).not.toBeVisible();
  await user.click(next); expect(screen.getByRole("heading", { name: pack.lessons[1].title })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Mark lesson complete" }));
  await user.type(screen.getByRole("textbox", { name: "My revision notes" }), "Check the common difference.");
  const saved = JSON.parse(localStorage.getItem("masterclass:study:learner-a:cbse-10-maths:en")!);
  expect(saved.completed).toContain(pack.lessons[1].id); expect(saved.notes).toBe("Check the common difference.");
  await user.click(screen.getByRole("button", { name: "Expand contents" })); expect(document.getElementById("study-contents")).toBeVisible();
});
test("practice submits chosen answers to the server and displays the returned result", async () => {
  const user = userEvent.setup(); const pack = buildStudyPack(findStudyCourse("cbse-10-maths")!, "en", "monthly", "learner");
  const paper = pack.papers[0]; const first = pack.questions.find(q => q.id === paper.questionIds[0])!;
  jest.mocked(requestJson).mockResolvedValue({ result: gradePaper(paper, pack.questions, { [first.id]: first.correct! }) });
  render(<StudyReader pack={pack} onClose={jest.fn()} onPlans={jest.fn()} />);
  await user.click(screen.getByRole("button", { name: "Test Papers" }));
  await user.click(screen.getByRole("button", { name: "Start timed practice" }));
  const group = screen.getByRole("group", { name: `1. ${first.prompt}` });
  await user.click(within(group).getByRole("radio", { name: first.answer }));
  await user.click(screen.getByRole("button", { name: "Submit answers" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 / 3"));
  expect(requestJson).toHaveBeenCalledWith("/api/study/cbse-10-maths", expect.objectContaining({ method: "POST", body: JSON.stringify({ paperId: paper.id, language: "en", answers: { [first.id]: first.correct } }) }));
});
test("membership requires preparation before checkout and provides monthly/yearly toggle", async () => {
  const user = userEvent.setup(); render(<Membership enabled data={null} onRefresh={jest.fn()} />);
  const subscribe = await screen.findByRole("button", { name: "Choose plan" }); expect(subscribe).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: "NDA / NA" })); expect(subscribe).toBeEnabled();
  await user.click(screen.getByRole("button", { name: /yearly/i }));
  expect(screen.getByRole("button", { name: /yearly/i })).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "Save preparation" }));
  await waitFor(() => expect(requestJson).toHaveBeenCalledWith("/api/account", expect.objectContaining({ body: JSON.stringify({ selections: ["nda"] }) })));
});
test("landing sample gives worked feedback and pricing follows the billing toggle", async () => {
  const user = userEvent.setup(); render(<LandingPage />);
  await user.click(screen.getByRole("button", { name: "B 19" }));
  expect(screen.getByRole("status")).toHaveTextContent("Count the four gaps");
  await user.click(within(screen.getByRole("group", { name: "Sample topic" })).getByRole("button", { name: "System Design" }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "D Reconcile the original attempt" }));
  expect(screen.getByRole("status")).toHaveTextContent("timeout does not prove");
  await user.click(screen.getByRole("button", { name: /yearly/i }));
  expect(screen.getByText("₹2,999")).toBeInTheDocument();
  expect(screen.queryByText(/PDF|PPTX|download credits|free preview|start free/i)).not.toBeInTheDocument();
});
