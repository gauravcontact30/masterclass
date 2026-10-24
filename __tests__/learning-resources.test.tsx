import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LearningResources } from "@/components/learning-resources";
import { LEARNING_RESOURCES, learningResourcesFor } from "@/lib/media/learning-resources";
import { screensFor } from "@/lib/media/official-screens";

test("every captured preview is a real local JPEG with source attribution", () => {
  for (const resource of LEARNING_RESOURCES) {
    const file = join(process.cwd(), "public", resource.src);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file).subarray(0, 3).toString("hex")).toBe("ffd8ff");
    expect(new URL(resource.page).protocol).toBe("https:");
    expect(resource.credit).toBeTruthy();
    expect(resource.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
});

test("matches catalogue and lesson titles without borrowing unrelated product screenshots", () => {
  expect(learningResourcesFor("Popular AWS services")).toHaveLength(2);
  expect(learningResourcesFor("AWS Services")).toHaveLength(2);
  expect(learningResourcesFor("Next.js 16+")).toHaveLength(1);
  expect(learningResourcesFor("React Testing Library")).toHaveLength(0);
  expect(learningResourcesFor("Maths")).toHaveLength(0);
  expect(screensFor("AWS", "Storage", "Amazon S3").some(s => s.src.includes("aws-s3-guide"))).toBe(true);
  expect(screensFor("AWS", "Security", "Amazon Cognito")).toHaveLength(0);
  expect(screensFor("AWS", "Compute", "AWS Lambda").some(s => s.credit.includes("Medium"))).toBe(true);
});

test("offers an accessible enlarged preview that credits its source without linking out", () => {
  render(<LearningResources technology="Next.js 16+" />);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  fireEvent.click(screen.getByRole("button", { name: "Enlarge screenshot: Build a project with Next.js Learn" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(within(screen.getByRole("dialog")).getByText("Next.js · Vercel")).toBeInTheDocument();
  expect(within(screen.getByRole("dialog")).queryByRole("link")).toBeNull();
});

test("does not add an empty gallery for an unrelated subject", () => {
  const { container } = render(<LearningResources technology="Maths" />);
  expect(container).toBeEmptyDOMElement();
});

test("pages through all resources two at a time and resets when technology changes", () => {
  const view = render(<LearningResources technology="AWS" />);
  const shelf = screen.getByRole("region", { name: "Visual resources for AWS" });
  const cards = () => within(shelf).getAllByRole("article");
  const titles = () => cards().map(card => within(card).getByRole("heading").textContent);
  expect(cards()).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  const first = titles();
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(cards()).toHaveLength(2);
  const second = titles();
  fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
  expect(cards()).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  expect(new Set([...first, ...second, ...titles()]).size).toBe(5);
  fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
  expect(titles()).toEqual(second);
  view.rerender(<LearningResources technology="BetterAuth" />);
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
});
