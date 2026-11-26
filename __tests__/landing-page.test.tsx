import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingPage } from "@/components/landing-page";
import { LanguageProvider } from "@/components/language-provider";
import { previewWorkflows } from "@/lib/landing-workflows-preview";

// The landing page always receives its workflow blueprints from the server (app/(landing)/page.tsx).
const workflows = previewWorkflows();

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ok:true,json:async()=>({monthly:349,yearly:3499,enabled:true})});
});
// The first render of a test file also transforms the landing page's modules (Streams added ~110 videos of data, 2026-11-26),
// so a cold start can take longer than findBy's 1 s default; the price is still the signal that the page has settled.
const ready = () => screen.findByText(/349/, {selector:"p.price b"}, {timeout:10000});

test("offers signup, sign-in and current section navigation", async () => {
  render(<LandingPage workflows={workflows}/>); await ready();
  // The page's one h1 names the site and what it teaches (lib/i18n.ts siteHeadline).
  expect(screen.getByRole("heading",{level:1})).toHaveTextContent(/MasterClass Buddy: read, code and learn Agentic AI/);
  // The blueprints section renders inside its own Suspense boundary, a moment after the page.
  expect(await screen.findByRole("heading",{name:/how real systems and AI agents get work done/i},{timeout:4000})).toBeInTheDocument();
  expect(screen.queryByRole("link",{name:"Build my learning space"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Account" }));
  expect(within(screen.getByRole("banner", {name:"Site header"})).getByRole("link",{name:/Sign in/})).toHaveAttribute("href","/sign-in");
  expect(within(screen.getByRole("navigation",{name:"Main navigation"})).getByRole("link",{name:"Membership"})).toHaveAttribute("href","/subscribe");
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

test("in-page links point at sections that exist", async () => {
  // The footer is the site layout's (app/(site)/site-footer.tsx), so the landing page renders none of its own.
  render(<LandingPage workflows={workflows}/>); await ready();
  expect(screen.queryByRole("contentinfo")).toBeNull();
  for(const link of within(screen.getByRole("navigation",{name:"Main navigation"})).getAllByRole("link")) {
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
  render(<LanguageProvider><LandingPage workflows={workflows}/></LanguageProvider>); await ready();
  (fetch as jest.Mock).mockClear();
  // The header's A / अ switch (components/language-switch.tsx) changes the language without touching the account.
  const toggle = screen.getByRole("switch",{name:"Hindi language"});
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-checked","true");
  expect(fetch).not.toHaveBeenCalledWith("/api/account",expect.anything());
});

test("server prices render immediately without an extra request", () => {
  render(<LandingPage prices={{monthly:499,yearly:4999,enabled:false}}/>);
  expect(screen.getByText(/499/, {selector:"p.price b"})).toBeInTheDocument();
  expect(screen.getByText("Checkout is not enabled yet.")).toBeInTheDocument();
  // The "Fresh in tech" carousel loads its stories after the page; nothing else should be requested.
  expect((fetch as jest.Mock).mock.calls.filter(([url]) => url !== "/api/landing/news")).toEqual([]);
});

test("failed pricing is disclosed while learning navigation remains available", async () => {
  (fetch as jest.Mock).mockRejectedValue(new Error("offline"));
  render(<LandingPage workflows={workflows}/>);
  expect(await screen.findByText("Current pricing is temporarily unavailable.")).toBeInTheDocument();
  // The blueprints section renders inside its own Suspense boundary, a moment after the page.
  expect(await screen.findByRole("heading",{name:/how real systems and AI agents get work done/i},{timeout:4000})).toBeInTheDocument();
  expect(screen.queryByRole("link",{name:"Build my learning space"})).not.toBeInTheDocument();
});
