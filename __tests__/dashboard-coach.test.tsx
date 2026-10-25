import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DashboardCoach } from "@/components/dashboard-coach";
import { LanguageProvider } from "@/components/language-provider";
import * as client from "@/lib/client";

jest.mock("@/lib/client", () => ({
  requestJson: jest.fn()
}));

const mockReply = {
  coach: {
    greeting: "Welcome to your study sprint!",
    next: [
      {
        title: "Build an MCP Server",
        why: "Next logical step in your agentic learning path",
        href: "/learn/mcp",
        technology: "TypeScript"
      }
    ],
    quiz: [
      {
        question: "Which React hook is designed for reactive local component state?",
        options: ["useState", "useEffect", "useMemo", "useRef"],
        answer: 0,
        explanation: "useState is the foundational hook for declaring and updating component-level reactive state."
      },
      {
        question: "In HTTP status codes, what does 401 denote?",
        options: ["Not Found", "Unauthorized", "Forbidden", "Bad Gateway"],
        answer: 1,
        explanation: "401 specifically indicates missing or invalid authentication credentials."
      }
    ],
    source: "ai" as const,
    generatedAt: new Date().toISOString()
  },
  starter: null,
  goal: "Full-Stack AI Engineer"
};

describe("DashboardCoach - Five-minute check", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    jest.mocked(client.requestJson).mockResolvedValue(mockReply);
  });

  test("renders Five-minute check with modern header, question cards, and option letters", async () => {
    render(
      <LanguageProvider>
        <DashboardCoach />
      </LanguageProvider>
    );

    // Wait for coach response to load
    await waitFor(() => {
      expect(screen.getByText("Five-minute check")).toBeInTheDocument();
    });

    expect(screen.getByText(/Daily Micro-Sprint/i)).toBeInTheDocument();
    expect(screen.getByText(/QUESTION 01/i)).toBeInTheDocument();
    expect(screen.getByText(/QUESTION 02/i)).toBeInTheDocument();

    // Verify option letter badges A, B, C, D
    const optionAButtons = screen.getAllByText("A");
    expect(optionAButtons.length).toBe(2);
  });

  test("interactive option selection provides instant feedback, score update, and concept takeaways", async () => {
    render(
      <LanguageProvider>
        <DashboardCoach />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Five-minute check")).toBeInTheDocument();
    });

    // Pick correct answer for Question 1: "useState"
    const useStateBtn = screen.getByRole("button", { name: /A useState/i });
    fireEvent.click(useStateBtn);

    // Should display Correct badge and Concept Takeaway
    expect(screen.getByText(/Correct \(\+100\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Concept Takeaway/i)).toBeInTheDocument();
    expect(screen.getByText(/useState is the foundational hook/i)).toBeInTheDocument();

    // Pick incorrect answer for Question 2: "Not Found" (index 0 instead of 1)
    const notFoundBtn = screen.getByRole("button", { name: /A Not Found/i });
    fireEvent.click(notFoundBtn);

    // Should display Incorrect badge and explanation
    expect(screen.getByText(/Incorrect/i)).toBeInTheDocument();
    expect(screen.getByText(/401 specifically indicates missing/i)).toBeInTheDocument();

    // Quiz is now complete: verify Completion Banner appears
    expect(screen.getByText(/Sprint Complete!/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/2 Correct/i)).toBeInTheDocument();

    // Retake / Reset functionality
    const retakeBtn = screen.getByRole("button", { name: /Retake Sprint/i });
    fireEvent.click(retakeBtn);

    // Badges and takeaways should be reset
    expect(screen.queryByText(/Concept Takeaway/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sprint Complete!/i)).not.toBeInTheDocument();
  });
});
