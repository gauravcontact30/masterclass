import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LearningProject } from "@/lib/api-learning-schema";

/**
 * Sandpack addresses files by absolute path and takes its entry from the
 * template unless told otherwise. When either is wrong the workspace silently
 * runs the template's own "Hello world" instead of the learner's code, so the
 * props handed to the provider are worth pinning down.
 */
const provider = jest.fn();
const sandpack = { files: {} as Record<string, { code: string }>, activeFile: "", setActiveFile: jest.fn(), resetAllFiles: jest.fn(), runSandpack: jest.fn().mockResolvedValue(undefined) };

jest.mock("@codesandbox/sandpack-react", () => ({
  SandpackProvider: ({ children, ...props }: { children: React.ReactNode }) => { provider(props); return <div>{children}</div>; },
  SandpackLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SandpackFileExplorer: () => <div/>,
  SandpackCodeEditor: () => <div/>,
  SandpackPreview: () => <div data-testid="preview"/>,
  SandpackConsole: () => <div data-testid="console"/>,
  useSandpack: () => ({ sandpack }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- imported after the mock is registered.
const BrowserProject = require("@/components/api-browser-project").default as (props: { project: LearningProject }) => React.JSX.Element;

const project: LearningProject = {
  title: "Prices", template: "vanilla-ts", entry: "src/index.ts", dependencies: {},
  files: [
    { path: "src/index.ts", code: "console.log('mine');\n" },
    { path: "index.html", code: "<ul id=\"app\"></ul>\n" },
    { path: "README.md", code: "# notes\n" },
  ],
  instructions: ["Run it."],
};

beforeEach(() => { provider.mockClear(); sandpack.runSandpack.mockClear(); sandpack.files = Object.fromEntries(project.files.map(file => ["/" + file.path, { code: file.code }])); });

test("every project file reaches Sandpack by absolute path, with the project's own entry", () => {
  render(<BrowserProject project={project}/>);
  const props = provider.mock.calls[0][0];
  expect(Object.keys(props.files)).toEqual(["/src/index.ts", "/index.html", "/README.md"]);
  expect(props.customSetup.entry).toBe("/src/index.ts");
  expect(props.options.activeFile).toBe("/src/index.ts");
  expect(props.options.visibleFiles).toEqual(["/src/index.ts", "/index.html"]);
  // Auto-reload would apply edits before the learner saves them.
  expect(props.options.autorun).toBe(false);
  expect(props.options.autoReload).toBe(false);
});

test("Save stays disabled until a file changes, then applies the edit to the runtime", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<BrowserProject project={project}/>);
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  expect(screen.queryByText("Unsaved changes")).toBeNull();

  sandpack.files = { ...sandpack.files, "/src/index.ts": { code: "console.log('edited');\n" } };
  rerender(<BrowserProject project={project}/>);
  expect(screen.getByText("Unsaved changes")).toBeVisible();
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  expect(screen.getByRole("status")).toHaveTextContent("press Save");

  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Saved");
});

test("browser and console output appear only once the runtime is started", async () => {
  const user = userEvent.setup();
  render(<BrowserProject project={project}/>);
  expect(screen.queryByTestId("preview")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Run" }));
  expect(screen.getByTestId("preview")).toBeVisible();
  expect(screen.getByTestId("console")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Console output" })).toBeVisible();
});
