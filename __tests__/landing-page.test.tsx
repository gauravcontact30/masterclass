import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingPage } from "@/components/landing-page";
import { LanguageProvider } from "@/components/language-provider";
beforeEach(()=>{localStorage.clear();global.fetch=jest.fn().mockImplementation((url:string)=>Promise.resolve({ok:true,json:async()=>url.includes("/api/catalog")?{technologies:[],topics:[]}:{monthly:349,yearly:3499,freeLimit:3,proLimit:50,perDownload:59}}));});
async function ready(){await waitFor(()=>expect(screen.getByText("₹349")).toBeInTheDocument());}
test("offers signup, sign-in, sample and section navigation",async()=>{render(<LandingPage/>);await ready();expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Big ideas.");expect(screen.getByRole("link",{name:"Create your first guide"})).toHaveAttribute("href","/sign-up");expect(screen.getByRole("link",{name:"Sign in"})).toHaveAttribute("href","/sign-in");expect(screen.getByRole("link",{name:"Explore a sample"})).toHaveAttribute("href","#sample");});
test("switches the interactive guide preview between PDF and slides",async()=>{render(<LandingPage/>);await ready();const preview=within(screen.getByRole("region",{name:"Example guide preview"}));await userEvent.click(preview.getByRole("button",{name:"PPTX"}));expect(preview.getByRole("button",{name:"PPTX"})).toHaveAttribute("aria-pressed","true");expect(preview.getByText(/function learn/)).toBeInTheDocument();await userEvent.click(preview.getByRole("button",{name:"PDF"}));expect(preview.getByText("Understand the fundamentals")).toBeInTheDocument();});
test("opens and closes the mobile navigation",async()=>{render(<LandingPage/>);await ready();await userEvent.click(screen.getByRole("button",{name:"Open navigation"}));expect(screen.getByRole("navigation",{name:"Mobile navigation"})).toBeInTheDocument();await userEvent.click(within(screen.getByRole("navigation",{name:"Mobile navigation"})).getByRole("link",{name:"Pricing"}));expect(screen.queryByRole("navigation",{name:"Mobile navigation"})).not.toBeInTheDocument();});
test("explains the workflow and links every footer destination",async()=>{render(<LandingPage/>);await ready();expect(screen.getByRole("heading",{name:"Choose what to learn"})).toBeInTheDocument();const footer=within(screen.getByRole("contentinfo"));expect(footer.getAllByRole("navigation")).toHaveLength(3);expect(footer.getByRole("link",{name:"My library"})).toHaveAttribute("href","/dashboard?tab=library");for(const link of footer.getAllByRole("link")){const href=link.getAttribute("href")!;if(href.startsWith("#"))expect(document.getElementById(href.slice(1))).not.toBeNull();}});
test("auto-playing testimonial carousel shows a student review and lets visitors step through it",async()=>{render(<LandingPage/>);await ready();const reviews=within(screen.getByRole("region",{name:"Student reviews"}));const inView=()=>reviews.getAllByRole("group",{name:/^Review \d of 6$/});expect(inView()).toHaveLength(1);expect(inView()[0]).toHaveTextContent("Aisha R.");expect(inView()[0]).toHaveTextContent(/data structures guide/i);await userEvent.click(reviews.getByRole("button",{name:"Next review"}));expect(inView()[0]).toHaveTextContent("Rohan V.");await userEvent.click(reviews.getByRole("button",{name:"Previous review"}));expect(inView()[0]).toHaveTextContent("Aisha R.");});
test("renders live pricing including download credits, switching billing cycle",async()=>{render(<LandingPage/>);await ready();expect(screen.getByText(/₹59/)).toBeInTheDocument();expect(screen.getByRole("button",{name:"Preview the sample PDF guide"})).toBeInTheDocument();await userEvent.click(screen.getByRole("button",{name:/Yearly/}));expect(screen.getByText(/₹3,499 yearly/)).toBeInTheDocument();});
test("changes language without writing to an authenticated account",async()=>{render(<LanguageProvider><LandingPage/></LanguageProvider>);await ready();(fetch as jest.Mock).mockClear();await userEvent.click(within(screen.getByRole("group",{name:"App language"})).getByRole("button",{name:"हिन्दी"}));await waitFor(()=>expect(screen.getByRole("heading",{level:1})).toHaveTextContent("बड़े विचार।"));expect(fetch).not.toHaveBeenCalledWith("/api/account",expect.anything());});
test("clicking a scrolling technology opens its real topic list in a modal",async()=>{
  (global.fetch as jest.Mock).mockImplementation((url:string)=>Promise.resolve({ok:true,json:async()=>{
    if(url.includes("/api/catalog"))return {technologies:[{id:"react",title:"React 19+",title_hi:"React 19+",category:"Web development"}],topics:[
      {id:"react-full",technology_id:"react",title:"Complete React 19 path",title_hi:"पूरा React 19 पाठ्यक्रम",full_track:true},
      {id:"react-hooks",technology_id:"react",title:"Hooks in depth",title_hi:"Hooks विस्तार से",full_track:false},
    ]};
    return {monthly:349,yearly:3499,freeLimit:3,proLimit:50,perDownload:59};
  }}));
  render(<LandingPage/>);await ready();
  await waitFor(()=>expect(screen.getAllByRole("button",{name:/React 19\+/}).length).toBeGreaterThan(0));
  await userEvent.click(screen.getAllByRole("button",{name:/React 19\+/})[0]);
  expect(screen.getByRole("heading",{name:"React 19+"})).toBeInTheDocument();
  expect(screen.getByText("Complete React 19 path")).toBeInTheDocument();
  expect(screen.getByText("Hooks in depth")).toBeInTheDocument();
  expect(screen.getByRole("link",{name:/Start learning/})).toHaveAttribute("href","/sign-up");
});

test("keeps marquee modals available when the live catalog fails and hides excluded technologies",async()=>{
 (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));
 render(<LandingPage/>);
 for(const title of ["Firebase","GitHub Actions","PostgreSQL","SQL","Go","Rust","Kotlin","MongoDB","Kubernetes","Swift","Tailwind CSS v4","C++","PHP","Ruby"]){
  expect(screen.queryByRole("button",{name:title})).not.toBeInTheDocument();
 }
 const buttons=screen.getAllByRole("button",{name:"Angular"});
 expect(buttons[0]).toBeEnabled();
 await userEvent.click(buttons[0]);
 const modal=screen.getByRole("dialog");
 expect(within(modal).getByRole("heading",{name:"Angular"})).toBeInTheDocument();
 expect(within(modal).getAllByRole("listitem").length).toBeGreaterThan(1);
});
