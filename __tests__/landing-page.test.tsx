import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { LandingPage } from "@/components/landing-page";
import { LanguageProvider } from "@/components/language-provider";

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ enabled: true, currency: "INR", freeLimit: 3, proLimit: 50, monthly: 299, yearly: 2999, perDownload: 49 }),
  }) as unknown as typeof fetch;
});

async function settle() {
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
}

test("renders navigation with sign-in, sign-up and a language toggle", async () => {
  render(<LandingPage />);
  expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/sign-in");
  expect(screen.getAllByRole("link", { name: /start learning/i })[0]).toHaveAttribute("href", "/sign-up");
  expect(screen.getByLabelText("App language")).toBeInTheDocument();
  await settle();
});

test("leads with a single stated proposition rather than a rotating hero", async () => {
  render(<LandingPage />);
  expect(screen.getByRole("heading", { level: 1, name: /study material you can hold/i })).toBeInTheDocument();
  // The hero object is the product's own output, labelled for screen readers.
  expect(screen.getByRole("img", { name: /minimalist tech, clean corporate and cyberpunk/i })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Product highlights" })).not.toBeInTheDocument();
  await settle();
});

test("runs a four-slide campus band under the header, labelled as illustration", async () => {
  render(<LandingPage />);
  const band = within(screen.getByRole("region", { name: "Students using MasterClass around campus" }));
  expect(band.getAllByRole("button", { name: /^Go to slide/ })).toHaveLength(4);
  expect(band.getByText(/central library/i)).toBeInTheDocument();
  // The scenes are drawn, so the page says so rather than implying photography.
  expect(screen.getByText(/not photographs of real students/i)).toBeInTheDocument();
  await settle();
});

test("explains the path to a first guide as an ordered sequence", async () => {
  render(<LandingPage />);
  const steps = within(screen.getByRole("heading", { name: "Three steps to your first guide" }).closest("section")!);
  expect(steps.getByRole("heading", { name: "Choose what to learn" })).toBeInTheDocument();
  expect(steps.getByRole("heading", { name: "We write it" })).toBeInTheDocument();
  expect(steps.getByRole("heading", { name: "Read it anywhere" })).toBeInTheDocument();
  expect(steps.getAllByRole("listitem")).toHaveLength(3);
  await settle();
});

test("names the catalogue the two dashboard dropdowns draw from", async () => {
  render(<LandingPage />);
  expect(screen.getByText(/20 technologies, 98 topics/i)).toBeInTheDocument();
  await settle();
});

test("renders an autoplay testimonials carousel", async () => {
  render(<LandingPage />);
  expect(screen.getByRole("region", { name: "Student reviews" })).toBeInTheDocument();
  expect(screen.getByText(/Aisha R\., B\.Tech CSE/)).toBeInTheDocument();
  expect(screen.getByText(/Dev P\., B\.Des/)).toBeInTheDocument();
  await settle();
});

test("renders a free sample lesson entry point", async () => {
  render(<LandingPage />);
  expect(screen.getByText("Try a free sample lesson")).toBeInTheDocument();
  await settle();
});

test("switching to Hindi translates the page without calling the authenticated account endpoint", async () => {
  render(<LanguageProvider><LandingPage /></LanguageProvider>);
  await settle();
  (global.fetch as jest.Mock).mockClear();

  fireEvent.change(screen.getByLabelText("App language"), { target: { value: "hi" } });

  await waitFor(() => expect(screen.getByText("तेज़ी से सीखने के लिए सब कुछ")).toBeInTheDocument());
  expect(global.fetch).not.toHaveBeenCalledWith("/api/account", expect.anything());
});

test("renders pricing fetched from the billing API, including the per-download tier", async () => {
  render(<LandingPage />);
  await waitFor(() => expect(screen.getByText("₹299")).toBeInTheDocument());
  expect(screen.getByText("₹2,999")).toBeInTheDocument();
  expect(screen.getByText("₹49")).toBeInTheDocument();
  expect(screen.getByText("Per Download")).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /start learning/i }).length).toBeGreaterThan(0);
});
