import { render, screen, within } from "@testing-library/react";
import SiteLayout from "@/app/(site)/layout";
import AboutPage from "@/app/(site)/about/page";
import ContactPage from "@/app/(site)/contact/page";
import CoursesPage from "@/app/(site)/courses/page";
import PrivacyPage from "@/app/(site)/privacy/page";
import TermsPage from "@/app/(site)/terms/page";
import RefundPolicyPage from "@/app/(site)/refund-policy/page";
import NotFound from "@/app/not-found";
import { LandingFooter } from "@/components/landing-footer";

test.each([["About MasterClass", AboutPage], ["Contact & support", ContactPage], ["Courses & learning paths", CoursesPage], ["Privacy policy", PrivacyPage], ["Terms & conditions", TermsPage], ["Cancellation & refund policy", RefundPolicyPage]] as const)("%s renders one h1, a breadcrumb and structured data", (heading, Page) => {
  const { container } = render(<Page />);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(heading);
  expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  const scripts = container.querySelectorAll('script[type="application/ld+json"]');
  expect(scripts.length).toBe(1);
  expect(() => JSON.parse(scripts[0].innerHTML)).not.toThrow();
});

test("the courses page lists every learning path with a dashboard link", () => {
  render(<CoursesPage />);
  for (const category of ["cbse", "ssc", "engineering", "medical", "system-design", "technology"]) expect(document.getElementById(category)).not.toBeNull();
  expect(screen.getAllByRole("link", { name: /Open in your dashboard/ }).length).toBe(16);
});

test("the public layout links every public page and the legal pages", () => {
  render(<SiteLayout><p>Body</p></SiteLayout>);
  expect(within(screen.getByRole("navigation", { name: "Main navigation" })).getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/courses");
  expect(within(screen.getByRole("navigation", { name: "Legal" })).getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/privacy");
  expect(within(screen.getByRole("navigation", { name: "Legal" })).getByRole("link", { name: "Cancellation & refund policy" })).toHaveAttribute("href", "/refund-policy");
  expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
});

test("the landing footer links the company and legal pages", () => {
  render(<LandingFooter />);
  const company = within(screen.getByRole("navigation", { name: "Company" }));
  expect(company.getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/about", "/contact", "/privacy", "/terms", "/refund-policy"]);
  expect(company.getAllByRole("link").map(link => link.textContent)).toEqual(["About us", "Contact us", "Privacy policy", "Terms & conditions", "Cancellation & refunds"]);
});

test("the 404 page points back into the site", () => {
  render(<NotFound />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("This page isn't here");
  expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/courses");
});
