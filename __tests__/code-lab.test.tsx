import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CodeLab } from "@/components/code-lab";
import { InterviewFocusProvider, InterviewFocusToggle } from "@/components/interview-focus";

const JS = 'const doubled = [1, 2].map(n => n * 2);\nconsole.log(doubled.join(","));';
const PY = 'def add(a, b):\n    return a + b\n\nprint(add(1, 2))';

beforeEach(() => localStorage.clear());

describe("CodeLab", () => {
  it("numbers every line and keeps the source exact", () => {
    render(<CodeLab title="Example" code={JS} />);
    const block = screen.getByLabelText("Example code");
    expect(block.textContent).toContain('console.log(doubled.join(","));');
    // Gutter numbers are decoration, so they must not be part of the copied text.
    expect(block.querySelectorAll(".gutter[aria-hidden='true']")).toHaveLength(2);
    expect(block.querySelectorAll("[data-code-comment]")).toHaveLength(2);
  });

  it("offers Run for self-contained JavaScript", () => {
    render(<CodeLab title="Example" code={JS} />);
    expect(screen.getByRole("button", { name: "Run Example" })).toBeInTheDocument();
    expect(screen.getByText("Not run yet")).toBeInTheDocument();
  });

  it("never offers Run for a language the browser cannot execute", () => {
    render(<CodeLab title="Adder" code={PY} />);
    expect(screen.queryByRole("button", { name: /^Run /i })).not.toBeInTheDocument();
    expect(screen.getByText(/JavaScript only/)).toBeInTheDocument();
  });

  it("labels an authored result as expected, not as executed", () => {
    render(<CodeLab title="Adder" code={PY} expectedOutput="3" />);
    const panel = screen.getByText("EXPECTED RESULT").closest("div")!;
    expect(panel.querySelector("pre")!.textContent).toBe("3");
    // The reason still shows, so an authored result is never read as a real run.
    expect(screen.getByText(/JavaScript only/)).toBeInTheDocument();
  });

  it("says why a multi-file snippet cannot run here", () => {
    render(<CodeLab title="main.mjs" code={'import { total } from "./values.mjs";\nconsole.log(total());'} />);
    expect(screen.queryByRole("button", { name: /^Run /i })).not.toBeInTheDocument();
    expect(screen.getByText(/Set up & run/)).toBeInTheDocument();
  });

  it("edits the code and offers Reset, which restores the original", async () => {
    render(<CodeLab title="Example" code={JS} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Example code" }));
    const editor = screen.getByLabelText("Edit Example") as HTMLTextAreaElement;
    expect(editor.value).toBe(JS);

    fireEvent.change(editor, { target: { value: 'console.log("changed");' } });
    const reset = await screen.findByRole("button", { name: "Reset Example code" });

    fireEvent.click(reset);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Reset Example code" })).not.toBeInTheDocument());
    expect((screen.getByLabelText("Edit Example") as HTMLTextAreaElement).value).toBe(JS);
  });

  it("withdraws Run once an edit makes the code unrunnable", () => {
    render(<CodeLab title="Example" code={JS} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Example code" }));
    fireEvent.change(screen.getByLabelText("Edit Example"), {
      target: { value: 'import x from "./y.mjs";' },
    });
    expect(screen.queryByRole("button", { name: /^Run /i })).not.toBeInTheDocument();
    expect(screen.getByText(/Set up & run/)).toBeInTheDocument();
  });

  it("copies the edited draft rather than the original", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    try {
      render(<CodeLab title="Example" code={JS} />);
      fireEvent.click(screen.getByRole("button", { name: "Edit Example code" }));
      fireEvent.change(screen.getByLabelText("Edit Example"), { target: { value: "console.log(7);" } });
      fireEvent.click(screen.getByRole("button", { name: "Copy Example code" }));
      await screen.findByText("Copied");
      expect(writeText).toHaveBeenCalledWith("console.log(7);");
    } finally {
      if (original) Object.defineProperty(navigator, "clipboard", original);
      else Reflect.deleteProperty(navigator, "clipboard");
    }
  });

  it("hides Edit when the caller asks for a read-only block", () => {
    render(<CodeLab title="Example" code={JS} editable={false} />);
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Example code" })).toBeInTheDocument();
  });
});

describe("InterviewFocusToggle", () => {
  const renderToggle = () =>
    render(
      <InterviewFocusProvider>
        <InterviewFocusToggle />
      </InterviewFocusProvider>,
    );

  it("starts off so nothing is hidden until the learner asks", () => {
    renderToggle();
    expect(screen.getByRole("switch", { name: /Interview focus/ })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("status").textContent).toContain("Showing every section");
  });

  it("names what it hides and persists the choice", async () => {
    renderToggle();
    fireEvent.click(screen.getByRole("switch", { name: /Interview focus/ }));
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: /Interview focus/ })).toHaveAttribute("aria-checked", "true"),
    );
    expect(screen.getByRole("status").textContent).toMatch(/vocabulary/i);
    expect(localStorage.getItem("masterclass:interview-focus")).toBe("on");
  });
});
