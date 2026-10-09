import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AgenticWorkflowDashboard } from "@/components/agentic-workflow";
import { WorkflowBuildGuide } from "@/components/workflow-build-guide";
import { AGENT_BUILD_USECASES, BUILD_CATEGORY, WORKFLOW_CATEGORIES, WORKFLOW_USECASES, getBuildSteps } from "@/lib/workflow-usecases";

const byId = (id: string) => WORKFLOW_USECASES.find(item => item.id === id)!;

describe("step-by-step agent builds", () => {
  it("adds three single-agent and three multi-agent builds under their own category", () => {
    expect(WORKFLOW_CATEGORIES).toContain(BUILD_CATEGORY);
    expect(AGENT_BUILD_USECASES.filter(item => item.type === "single")).toHaveLength(3);
    expect(AGENT_BUILD_USECASES.filter(item => item.type === "multi")).toHaveLength(3);
    expect(new Set(WORKFLOW_USECASES.map(item => item.id)).size).toBe(WORKFLOW_USECASES.length);
  });

  it("covers LangChain, LangGraph and LangSmith in every authored build", () => {
    for (const build of AGENT_BUILD_USECASES) {
      const layers = new Set(build.buildSteps!.map(step => step.layer));
      expect([...layers]).toEqual(expect.arrayContaining(["Setup", "LangChain", "LangGraph", "LangSmith"]));
      for (const step of build.buildSteps!) {
        expect(step.code.trim().length).toBeGreaterThan(20);
        expect(step.checkpoint.length).toBeGreaterThan(10);
      }
    }
  });

  it("derives the codebase from the steps so the walkthrough and files cannot drift", () => {
    for (const build of AGENT_BUILD_USECASES) {
      for (const file of build.files) {
        const writer = [...build.buildSteps!].reverse().find(step => step.file === file.filename);
        expect(writer?.code).toBe(file.code);
      }
      expect(build.buildSteps![0].code).toContain(`mkdir ${build.buildFolder}`);
      expect(build.files.map(file => file.filename)).toEqual(expect.arrayContaining(["requirements.txt", "config.py", "main.py", "eval.py"]));
    }
  });

  it("uses the 1.x APIs and keeps Python output console-safe", () => {
    const source = (id: string) => byId(id).files.map(file => file.code).join("\n");
    expect(source("build-hitl-email-agent-create-agent")).toContain("HumanInTheLoopMiddleware");
    expect(source("build-handoff-router-squad")).toContain("graph=Command.PARENT");
    expect(source("build-parallel-send-review-team")).toContain("Send(");
    expect(source("build-memory-agent-store")).toContain("context_schema=Context");
    for (const build of AGENT_BUILD_USECASES) {
      for (const file of build.files.filter(item => item.language === "python")) {
        expect(file.code).not.toMatch(/[^\x00-\x7F]/);
        expect(file.code).not.toMatch(/\beval\(/);
      }
    }
  });

  it("gives every older workflow a derived build path that ends with its run command", () => {
    for (const workflow of WORKFLOW_USECASES.filter(item => !item.buildSteps)) {
      const steps = getBuildSteps(workflow);
      expect(steps[0].layer).toBe("Setup");
      expect(steps.at(-1)!.run).toBe(workflow.runCommand);
      expect(steps.filter(step => step.file)).toHaveLength(workflow.files.filter(file => file.filename !== "README.md").length);
    }
  });
});

describe("WorkflowBuildGuide", () => {
  it("opens the first step and expands every step on request", () => {
    const workflow = byId("build-supervisor-subagents-team");
    render(<><h3 id="guide-title">Step-by-step build</h3><WorkflowBuildGuide workflow={workflow} headingId="guide-title" /></>);
    const list = screen.getByRole("list", { name: "Step-by-step build" });
    const toggles = within(list).getAllByRole("button", { expanded: false });
    expect(toggles).toHaveLength(workflow.buildSteps!.length - 1);
    expect(screen.getByText(/You should see:/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand all steps" }));
    expect(screen.getAllByText(/You should see:/)).toHaveLength(workflow.buildSteps!.length);
    expect(screen.getByText("supervisor_team/supervisor.py")).toBeInTheDocument();
  });

  it("appears in the workflow reader with a jump link", () => {
    render(<AgenticWorkflowDashboard />);
    expect(screen.getByRole("heading", { level: 3, name: "Step-by-step build" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Step-by-step build" })).toBeInTheDocument();
    expect(screen.getByText(/built from this workflow's files/)).toBeInTheDocument();
  });
});
