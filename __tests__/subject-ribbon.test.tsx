import { fireEvent, render, screen } from "@testing-library/react";
import { SubjectRibbon } from "@/components/subject-ribbon";
import { LanguageProvider } from "@/components/language-provider";

describe("SubjectRibbon and TechnologyModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders technology pills with icons and opens modal on click", async () => {
    render(
      <LanguageProvider>
        <SubjectRibbon />
      </LanguageProvider>
    );

    // Multiple "React" pill buttons exist across [0, 1] loop tracks
    const reactButtons = screen.getAllByRole("button", { name: /React/i });
    expect(reactButtons.length).toBeGreaterThanOrEqual(1);

    // Initially modal is not open
    expect(screen.queryByRole("dialog")).toBeNull();

    // Click on the first React button
    fireEvent.click(reactButtons[0]);

    // Modal dialog is now displayed
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("React 19")).toBeInTheDocument();
    expect(screen.getByText(/Frontend Library/i)).toBeInTheDocument();
    expect(screen.getByText(/Key Concepts & Features/i)).toBeInTheDocument();
    expect(screen.getByText(/Top Interview Focus Areas/i)).toBeInTheDocument();

    // Close button dismisses the modal
    const closeBtn = screen.getByRole("button", { name: /Close modal/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("closes modal on Escape key press", async () => {
    render(
      <LanguageProvider>
        <SubjectRibbon />
      </LanguageProvider>
    );

    const dockerButtons = screen.getAllByRole("button", { name: /Docker/i });
    fireEvent.click(dockerButtons[0]);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Docker & Containers")).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
