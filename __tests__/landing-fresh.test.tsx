import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingPathFinder } from "@/components/landing-path-finder";
import { DailyCard, DailyChoice } from "@/components/landing-daily-card";
import type { FreshGoal } from "@/lib/landing-fresh-types";

const goals: FreshGoal[] = ["React", "Node.js", "AWS Lambda", "LangGraph", "Apache Kafka", "Playwright", "Docker", "Kubernetes", "GraphQL", "PostgreSQL", "Terraform", "Next.js"]
  .map(tech => ({ tech, hiTech: tech, goal: `learn ${tech} for a job`, hiGoal: `${tech} सीखना` }));

describe("daily landing additions", () => {
  const pills = () => within(screen.getByRole("list", { name: /Or try a ready-made goal/ })).getAllByRole("button");

  it("leads the popular mix with today's goals, each pill named by technology with its goal as the tooltip", () => {
    render(<LandingPathFinder day={3} fresh={goals} />);
    expect(pills().map(pill => pill.textContent)).toEqual(goals.slice(0, 8).map(goal => goal.tech));
    expect(pills()[0]).toHaveAttribute("title", "learn React for a job");
    expect(screen.getByRole("button", { name: /Popular today/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("groups the built-in goals by line, with icons, and switches lines", () => {
    render(<LandingPathFinder day={0} />);
    expect(screen.getByText("44 goals on 8 lines")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^AI & agents/ }));
    const labels = pills().map(pill => pill.textContent);
    expect(labels).toEqual(expect.arrayContaining(["LangChain", "LangGraph", "LangSmith", "Langflow", "n8n", "Agentic AI"]));
    expect(labels).not.toContain("Next.js");
    expect(pills()[0].querySelector("img")).toHaveAttribute("alt", "");
    fireEvent.click(screen.getByRole("button", { name: /^Interviews/ }));
    expect(pills().map(pill => pill.textContent)).toContain("System Design");
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
