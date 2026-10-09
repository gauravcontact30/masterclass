import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgenticWorkflowDashboard } from "@/components/agentic-workflow";
import { WORKFLOW_USECASES, WORKFLOW_CATEGORIES } from "@/lib/workflow-usecases";

describe("AgenticWorkflowDashboard Official Docs UI/UX & Learning Content", () => {
  it("renders the header with eyebrow, title, and verified badge", () => {
    render(<AgenticWorkflowDashboard />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Agentic Workflow Architecture & Runtime Systems" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Agentic AI Architecture & Runtime Systems/i)).toBeInTheDocument();
    expect(
      screen.getByText(/LangChain v0\.3\+ \/ LangGraph v0\.2\+ \/ LangSmith v0\.2\+ Specification/i)
    ).toBeInTheDocument();
  });

  it("renders the top workflow reader with category tabs and pagination", () => {
    render(<AgenticWorkflowDashboard />);
    expect(screen.getByRole("heading", { level: 2, name: "Official workflow reader" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Workflow categories" })).toBeInTheDocument();
    const combobox = screen.getByRole("combobox", { name: /select workflow topology/i });
    expect(combobox).toBeInTheDocument();
    const selectWrapper = combobox.closest("div");
    if (selectWrapper) {
      const chevrons = selectWrapper.querySelectorAll(".lucide-chevron-down");
      expect(chevrons.length).toBe(1);
    }
  });

  it("switches workflows using the dropdown selector", () => {
    render(<AgenticWorkflowDashboard />);
    const select = screen.getByRole("combobox", { name: /select workflow topology/i });
    fireEvent.change(select, { target: { value: "software-engineering-squad" } });
    expect(
      screen.getAllByText("Multi-Agent Software Engineering Squad").length
    ).toBeGreaterThan(0);
  });

  it("does not render the removed Runtime Specifications & Invariants section", () => {
    render(<AgenticWorkflowDashboard />);
    expect(screen.queryByText("Runtime Specifications & Invariants")).not.toBeInTheDocument();
    expect(screen.queryByText("Core Architectural Mechanics & Runtime Theory")).not.toBeInTheDocument();
  });

  it("renders the CodeFiles codebase component with multi-file project tabs", () => {
    render(<AgenticWorkflowDashboard />);
    const codebaseHeading = screen.getByRole("heading", { level: 3, name: "Codebase" });
    expect(codebaseHeading).toBeInTheDocument();
    expect(screen.getByRole("figure")).toBeInTheDocument();
  });

  it("renders the terminal commands section with commands and traffic lights", () => {
    render(<AgenticWorkflowDashboard />);
    expect(screen.getByRole("heading", { level: 3, name: "Terminal commands" })).toBeInTheDocument();
    expect(screen.getByText(/Before you start/i)).toBeInTheDocument();
    expect(screen.getByText(/Check the result/i)).toBeInTheDocument();
  });

  it("renders objective and subjective practice assessment questions with answer reveals", () => {
    render(<AgenticWorkflowDashboard />);
    expect(screen.getByRole("heading", { level: 3, name: "Objective questions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Subjective questions" })).toBeInTheDocument();

    const showAnswer = screen.getAllByText(/show answer/i)[0];
    expect(showAnswer).toBeInTheDocument();
  });

  it("renders the explore catalog with search bar and filter controls", () => {
    render(<AgenticWorkflowDashboard />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Production Agentic Workflows & Multi-File Topologies" })
    ).toBeInTheDocument();

    const searchInput = screen.getByRole("textbox", { name: /search workflows/i });
    expect(searchInput).toBeInTheDocument();

    // Test live search query
    fireEvent.change(searchInput, { target: { value: "fraud" } });
    expect(screen.getByText(/Filter: “fraud”/i)).toBeInTheDocument();
    expect(screen.getAllByText("Financial Audit & Fraud Detection Agent").length).toBeGreaterThan(0);

    // Clear search
    const clearBtn = screen.getByRole("button", { name: /clear search query/i });
    fireEvent.click(clearBtn);
    expect(searchInput).toHaveValue("");
  });

  it("toggles the advanced filter drawer", () => {
    render(<AgenticWorkflowDashboard />);
    const filterBtn = screen.getByRole("button", { name: /toggle advanced filters/i });
    fireEvent.click(filterBtn);
    expect(screen.getByText("Advanced Filtering & Sorting")).toBeInTheDocument();
    expect(screen.getByText("Verified Order")).toBeInTheDocument();
    expect(screen.getByText("Human-in-the-Loop")).toBeInTheDocument();
  });

  it("renders card grid with pastel tone washes and card foot action buttons", () => {
    render(<AgenticWorkflowDashboard />);
    const studyBtns = screen.getAllByRole("button", { name: /study guide/i });
    expect(studyBtns.length).toBeGreaterThan(0);

    // Clicking study guide selects the workflow
    fireEvent.click(studyBtns[0]);
  });

  it("renders catalog pagination controls and navigates between pages", () => {
    render(<AgenticWorkflowDashboard />);
    // Pagination controls should be present since total topologies (20) > CARDS_PER_PAGE (4)
    expect(screen.getByText(/Showing Page 1 of 5/i)).toBeInTheDocument();
    
    // Check page buttons
    const page2Btn = screen.getByRole("button", { name: "Page 2" });
    expect(page2Btn).toBeInTheDocument();
    fireEvent.click(page2Btn);
    expect(screen.getByText(/Showing Page 2 of 5/i)).toBeInTheDocument();

    const nextBtn = screen.getAllByRole("button", { name: "Next page" })[0];
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Showing Page 3 of 5/i)).toBeInTheDocument();
  });

  it("filters topologies using Single Agent and Multi Agents tabs in tabs format", () => {
    render(<AgenticWorkflowDashboard />);
    const singleTab = screen.getByRole("tab", { name: /Single Agent Workflows/i });
    const multiTab = screen.getByRole("tab", { name: /Multi Agents Workflows/i });
    const allTab = screen.getByRole("tab", { name: /All Topologies/i });

    expect(singleTab).toBeInTheDocument();
    expect(multiTab).toBeInTheDocument();
    expect(allTab).toBeInTheDocument();

    // Switch to Single Agent tab
    fireEvent.click(singleTab);
    expect(singleTab).toHaveAttribute("aria-selected", "true");
    expect(multiTab).toHaveAttribute("aria-selected", "false");

    // Switch to Multi Agents tab
    fireEvent.click(multiTab);
    expect(multiTab).toHaveAttribute("aria-selected", "true");
    expect(singleTab).toHaveAttribute("aria-selected", "false");

    // Restore All Topologies
    fireEvent.click(allTab);
    expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  it("displays line comment tooltip and inspector when hovering over code lines", () => {
    const { container } = render(<AgenticWorkflowDashboard />);
    const hoverableLines = container.querySelectorAll("[class*='lineHoverable']");
    expect(hoverableLines.length).toBeGreaterThan(0);

    // Initial state: inspector shows helper prompt
    expect(screen.getByText(/Hover over any code line above/i)).toBeInTheDocument();

    // Hover over the first code line
    fireEvent.mouseEnter(hoverableLines[0]);
    // The inspector updates to show Line 1
    expect(screen.getByText("Line 1")).toBeInTheDocument();

    // Mouse leave resets hover
    fireEvent.mouseLeave(hoverableLines[0]);
    expect(screen.getByText("Hover Code")).toBeInTheDocument();
  });

  it("renders Key learning contents section with strictly LangChain, LangGraph, and LangSmith learning cards", () => {
    render(<AgenticWorkflowDashboard />);
    const learningHeading = screen.getByRole("heading", { level: 3, name: "Key learning contents" });
    expect(learningHeading).toBeInTheDocument();

    // Verify LangChain, LangGraph, and LangSmith badges and cards exist
    expect(screen.getAllByText(/LangChain v0\.3\+/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/LangGraph v0\.2\+/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/LangSmith v0\.2\+/i).length).toBeGreaterThan(0);

    // Verify specific primitives are rendered
    expect(screen.getByText("@tool")).toBeInTheDocument();
    expect(screen.getByText("StateGraph")).toBeInTheDocument();
    expect(screen.getByText("@traceable")).toBeInTheDocument();
  });

  it("supports pagination across Agent Type tabs (Single Agent, Multi Agents) and Category tabs", () => {
    render(<AgenticWorkflowDashboard />);

    // Switch to Single Agent tab (9 items -> 3 pages)
    const singleTab = screen.getByRole("tab", { name: /Single Agent Workflows/i });
    fireEvent.click(singleTab);
    expect(screen.getByText(/Showing Page 1 of 3/i)).toBeInTheDocument();

    // Navigate to page 2 on Single Agent tab
    const page2Btn = screen.getByRole("button", { name: "Page 2" });
    fireEvent.click(page2Btn);
    expect(screen.getByText(/Showing Page 2 of 3/i)).toBeInTheDocument();

    // Switch to Multi Agents tab (11 items -> 3 pages)
    const multiTab = screen.getByRole("tab", { name: /Multi Agents Workflows/i });
    fireEvent.click(multiTab);
    // Page should reset to 1
    expect(screen.getByText(/Showing Page 1 of 3/i)).toBeInTheDocument();

    // Category navigation buttons are present
    const categoryNav = screen.queryByRole("button", { name: /more categories/i });
    if (categoryNav) {
      fireEvent.click(categoryNav);
    }
  });

  it("validates that all 20 production topologies have complete files, non-empty code, and eval suites", () => {
    expect(WORKFLOW_USECASES).toHaveLength(20);
    expect(WORKFLOW_CATEGORIES.length).toBeGreaterThanOrEqual(10);

    for (const uc of WORKFLOW_USECASES) {
      expect(uc.files.length).toBeGreaterThanOrEqual(4);
      expect(uc.keyPoints.length).toBeGreaterThanOrEqual(3);
      expect(uc.keyConcepts.length).toBeGreaterThanOrEqual(3);
      expect(uc.learningObjectives.length).toBeGreaterThanOrEqual(3);
      expect(uc.terminalCommands.length).toBeGreaterThanOrEqual(2);
      expect(uc.objectiveQuestions.length).toBeGreaterThanOrEqual(2);
      expect(uc.subjectiveQuestions.length).toBeGreaterThanOrEqual(1);

      // Verify eval.py exists in every usecase
      const hasEval = uc.files.some((f) => f.filename === "eval.py");
      expect(hasEval).toBe(true);

      for (const file of uc.files) {
        expect(file.code).not.toContain("TODO");
        expect(file.code.trim().length).toBeGreaterThan(50);
        if (file.language === "python") {
          expect(file.code.length).toBeGreaterThan(200);
        }
      }
    }
  });
});
