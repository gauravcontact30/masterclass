import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingPathFinder } from "@/components/landing-path-finder";
import { DailyCard, DailyChoice } from "@/components/landing-daily-card";
import type { FreshGoal } from "@/lib/landing-fresh-types";

const goals: FreshGoal[] = ["React", "Node.js", "AWS Lambda", "LangGraph", "Apache Kafka", "Playwright", "Docker", "Kubernetes", "GraphQL", "PostgreSQL", "Terraform", "Next.js"]
  .map(tech => ({ tech, hiTech: tech, goal: `learn ${tech} for a job`, hiGoal: `${tech} सीखना` }));

describe("daily landing additions", () => {
  it("names every Or-try pill by technology, each in its own tint, using today's goals", () => {
    render(<LandingPathFinder day={3} fresh={goals} />);
    const pills = within(screen.getByText("Or try").parentElement as HTMLElement).getAllByRole("button").filter(button => button.hasAttribute("data-tint"));
    expect(pills.map(pill => pill.textContent)).toEqual(goals.slice(0, 7).map(goal => goal.tech));
    expect(new Set(pills.map(pill => pill.getAttribute("data-tint"))).size).toBe(7);
    expect(pills[0]).toHaveAttribute("title", "learn React for a job");
    fireEvent.click(screen.getByRole("button", { name: /More ideas \(5\)/ }));
  });

  it("falls back to the built-in goals, also named by technology", () => {
    render(<LandingPathFinder day={0} />);
    const labels = within(screen.getByText("Or try").parentElement as HTMLElement).getAllByRole("button").filter(button => button.hasAttribute("data-tint")).map(pill => pill.textContent);
    expect(labels).toContain("Next.js");
    expect(labels).not.toContain("Frontend job");
  });

  it("shows a New today card with its picture, answer and checked option", () => {
    render(<DailyCard kicker="Question of the day · GraphQL" title="What is the N+1 problem?" image="https://example.com/q.webp" icon={null} day="2026-10-22">
      <DailyChoice question="DataLoader batches…" options={["per field", "per request tick", "per server", "never"]} answer={1} why="It batches loads in one tick." reveal="Why:" />
    </DailyCard>);
    expect(screen.getByRole("article", { name: /Question of the day · GraphQL/ })).toBeInTheDocument();
    expect(screen.getByText(/New today/)).toHaveTextContent("22 Oct");
    expect(screen.getByText("per request tick")).toHaveAttribute("data-correct", "true");
  });
});
