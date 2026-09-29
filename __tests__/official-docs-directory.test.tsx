import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfficialDocsDirectory } from "@/components/official-docs-directory";
import { DOCS_DIRECTORIES } from "@/lib/official-docs-directories";

test("AWS references preserve service/API distinctions and official links", () => {
  const entries = DOCS_DIRECTORIES.aws.entries;
  expect(entries).toHaveLength(505);
  expect(entries.slice(0, 3).map(entry => entry.name)).toEqual(["Amazon S3", "Amazon EC2", "AWS Lambda"]);
  expect(entries.at(-1)?.name).toBe("AWS OpsWorks Stacks (retired)");
  expect(entries.filter(entry => entry.kind === "Service guide")).toHaveLength(72);
  expect(entries.filter(entry => entry.kind === "API reference")).toHaveLength(433);
  expect(new Set(entries.map(entry => entry.url)).size).toBe(entries.length);
  for (const entry of entries) expect(new URL(entry.url).hostname).toMatch(/(^|\.)amazon(aws)?\.com$/);
  expect(DOCS_DIRECTORIES.git.entries).toHaveLength(157);
  expect(DOCS_DIRECTORIES["react-hooks"].entries.map(entry => entry.name)).toContain("useEffectEvent");
});

test("directory pagination resets when searching and filtering", async () => {
  const user = userEvent.setup();
  render(<OfficialDocsDirectory docId="aws" />);
  const pagination = screen.getByRole("navigation", { name: "AWS services & API directory pagination" });
  await user.click(within(pagination).getByRole("button", { name: "Next" }));
  expect(within(pagination).getByText("Page 2 of 57")).toBeInTheDocument();
  await user.type(screen.getByRole("searchbox", { name: "Search references" }), "S3");
  expect(within(pagination).getByRole("button", { name: "Previous" })).toBeDisabled();
  await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "Storage & Backup");
  expect(screen.getByRole("status")).toHaveTextContent("references");
  await user.clear(screen.getByRole("searchbox", { name: "Search references" }));
  await user.type(screen.getByRole("searchbox", { name: "Search references" }), "no-such-service-xyz");
  expect(screen.getByText(/No references match/)).toBeInTheDocument();
  expect(within(pagination).getByRole("button", { name: "Next" })).toBeDisabled();
});
