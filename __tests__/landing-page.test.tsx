import { render, screen, waitFor, within } from "@testing-library/react";
import { LandingPage } from "@/components/landing-page";

beforeEach(() => {
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
  expect(screen.getByRole("link", { name: /start learning/i })).toHaveAttribute("href", "/sign-up");
  expect(screen.getByLabelText("App language")).toBeInTheDocument();
  await settle();
});

test("renders an autoplay hero carousel covering every core feature", async () => {
  render(<LandingPage />);
  const hero = within(screen.getByRole("region", { name: "Product highlights" }));
  expect(hero.getByText("Pick a topic. Get a guide.")).toBeInTheDocument();
  expect(hero.getByText("Learn inside the app")).toBeInTheDocument();
  expect(hero.getByText("Three document styles")).toBeInTheDocument();
  expect(hero.getByText("Bring your own design system")).toBeInTheDocument();
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

test("renders pricing fetched from the billing API, including the per-download tier", async () => {
  render(<LandingPage />);
  await waitFor(() => expect(screen.getByText("₹299")).toBeInTheDocument());
  expect(screen.getByText("₹2,999")).toBeInTheDocument();
  expect(screen.getByText("₹49")).toBeInTheDocument();
  expect(screen.getByText("Per Download")).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /start learning/i }).length).toBeGreaterThan(0);
});
