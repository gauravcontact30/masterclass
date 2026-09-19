import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TerminalBlock } from "@/components/terminal-block";

const writeText = jest.fn().mockResolvedValue(undefined);
beforeEach(() => {
  writeText.mockClear();
  Object.assign(navigator, { clipboard: { writeText } });
});

const lines = ["# install the scanner", "npm i -D sonarqube-scanner", "pnpm add -D sonarqube-scanner"];

test("it looks like a terminal: window bar, title, and a prompt before each command", () => {
  render(<TerminalBlock lines={lines} />);
  const terminal = screen.getByRole("figure", { name: "Terminal" });
  expect(within(terminal).getByText("Terminal")).toBeVisible();

  const rows = terminal.querySelectorAll("[class*='line']");
  expect(rows).toHaveLength(3);
  // Commands carry a prompt; a comment is not something to run, so it has none.
  expect(rows[0].textContent).toBe("# install the scanner");
  expect(rows[1].textContent).toBe("$npm i -D sonarqube-scanner");
  expect(rows[2].textContent).toBe("$pnpm add -D sonarqube-scanner");
});

test("the prompt is chrome: hidden from assistive tech and never part of the command", () => {
  render(<TerminalBlock lines={lines} />);
  const prompts = screen.getByRole("figure", { name: "Terminal" }).querySelectorAll("[aria-hidden='true']");
  expect([...prompts].some(node => node.textContent === "$")).toBe(true);
  // The code element holds exactly the command, so a drag-select copies it clean.
  const commands = [...screen.getByRole("figure", { name: "Terminal" }).querySelectorAll("code")].map(code => code.textContent);
  expect(commands).toEqual(lines);
});

test("Copy takes every command, without prompts or comments, one per line", async () => {
  render(<TerminalBlock lines={lines} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy all commands" }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith("npm i -D sonarqube-scanner\npnpm add -D sonarqube-scanner"));
  expect(await screen.findByText("Copied")).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard");
});

test("a single command can be copied on its own", async () => {
  render(<TerminalBlock lines={lines} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy pnpm add -D sonarqube-scanner" }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith("pnpm add -D sonarqube-scanner"));
  // Comments get no copy button: there is nothing to run.
  expect(screen.queryByRole("button", { name: /Copy # install/ })).not.toBeInTheDocument();
});

test("a one-command terminal labels its button for one", () => {
  render(<TerminalBlock lines={["npx next upgrade"]} />);
  expect(screen.getByRole("button", { name: "Copy command" })).toBeVisible();
});
