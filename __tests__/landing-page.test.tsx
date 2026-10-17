import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingPage } from "@/components/landing-page";
import { LanguageProvider } from "@/components/language-provider";

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ok:true,json:async()=>({monthly:349,yearly:3499,enabled:true})});
});
const ready = () => screen.findByText(/349/, {selector:"p.price b"});

test("offers signup, sign-in and current section navigation", async () => {
  render(<LandingPage/>); await ready();
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent("school, exam and technology learning");
  expect(screen.getByRole("heading",{name:/How real systems and AI agents get work done/})).toBeInTheDocument();
  expect(screen.queryByRole("link",{name:"Build my learning space"})).not.toBeInTheDocument();
  expect(within(screen.getByRole("banner")).getByRole("link",{name:"Sign in"})).toHaveAttribute("href","/sign-in");
  expect(within(screen.getByRole("navigation",{name:"Main navigation"})).getByRole("link",{name:"Membership"})).toHaveAttribute("href","#pricing");
});

test("opens navigation and closes it on selection or Escape", async () => {
  render(<LandingPage/>); await ready();
  const toggle = screen.getByRole("button",{name:"Toggle navigation"});
  fireEvent.click(toggle); expect(toggle).toHaveAttribute("aria-expanded","true");
  fireEvent.click(within(screen.getByRole("navigation",{name:"Main navigation"})).getByRole("link",{name:"Membership"}));
  expect(toggle).toHaveAttribute("aria-expanded","false");
  fireEvent.click(toggle); fireEvent.keyDown(window,{key:"Escape"});
  expect(toggle).toHaveAttribute("aria-expanded","false");
});

test("footer navigation points to real routes and existing page sections", async () => {
  render(<LandingPage/>); await ready();
  const footer=within(screen.getByRole("contentinfo"));
  expect(footer.getAllByRole("navigation")).toHaveLength(5);
  expect(footer.getByRole("link",{name:"My Library"})).toHaveAttribute("href","/dashboard?tab=library");
  for(const link of footer.getAllByRole("link")) {
    const href=link.getAttribute("href")!;
    if(href.startsWith("#")) expect(document.getElementById(href.slice(1))).not.toBeNull();
  }
});

test("sample reviews step forwards and backwards", async () => {
  render(<LandingPage/>); await ready();
  const reviews=within(screen.getByRole("region",{name:"Sample student reviews"}));
  expect(reviews.getByRole("group",{name:"Sample review 1 of 5"})).toHaveTextContent("Aditi S.");
  fireEvent.click(reviews.getByRole("button",{name:"Next review"}));
  expect(reviews.getByRole("group",{name:"Sample review 2 of 5"})).toHaveTextContent("Rohan M.");
  fireEvent.click(reviews.getByRole("button",{name:"Previous review"}));
  expect(reviews.getByRole("group",{name:"Sample review 1 of 5"})).toBeVisible();
});

test("live pricing switches billing cycles and leads to membership setup", async () => {
  render(<LandingPage/>); await ready();
  fireEvent.click(screen.getByRole("button",{name:/Yearly/}));
  expect(screen.getByText(/3,499/, {selector:"p.price b"})).toBeInTheDocument();
  expect(screen.getByText(/billed yearly/)).toBeInTheDocument();
  expect(screen.getByRole("link",{name:"Subscribe now"})).toHaveAttribute("href","/subscribe?plan=yearly");
});

test("language changes stay local for a public visitor", async () => {
  render(<LanguageProvider><LandingPage/></LanguageProvider>); await ready();
  (fetch as jest.Mock).mockClear();
  fireEvent.click(screen.getByRole("button",{name:"Account"}));
  fireEvent.click(within(screen.getByRole("group",{name:"Language"})).getByRole("button",{name:"हिन्दी"}));
  expect(screen.getByRole("heading",{level:1})).not.toHaveTextContent("school, exam and technology learning");
  expect(fetch).not.toHaveBeenCalledWith("/api/account",expect.anything());
});

test("server prices render immediately without an extra request", () => {
  render(<LandingPage prices={{monthly:499,yearly:4999,enabled:false}}/>);
  expect(screen.getByText(/499/, {selector:"p.price b"})).toBeInTheDocument();
  expect(screen.getByText("Checkout is not enabled yet.")).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

test("failed pricing is disclosed while learning navigation remains available", async () => {
  (fetch as jest.Mock).mockRejectedValue(new Error("offline"));
  render(<LandingPage/>);
  expect(await screen.findByText("Current pricing is temporarily unavailable.")).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:/How real systems and AI agents get work done/})).toBeInTheDocument();
  expect(screen.queryByRole("link",{name:"Build my learning space"})).not.toBeInTheDocument();
});
