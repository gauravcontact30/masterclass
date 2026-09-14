import { render, screen } from "@testing-library/react";
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { buildNotesDirectory, filterNotes, NOTE_KINDS } from "@/lib/notes-directory";
import { ServiceCatalog } from "@/components/service-catalog";

const cards = buildNotesDirectory(DEFAULT_GUIDES);

test("every built-in lesson and service is available with unique card ids and all requested content types", () => {
  expect(cards).toHaveLength(DEFAULT_GUIDES.reduce((total, guide) => total + guide.curriculum.lessons.length + (guide.curriculum.services?.length ?? 0) + (guide.curriculum.codeExamples?.length ?? 0) + 1, 0));
  expect(new Set(cards.map(card => card.id)).size).toBe(cards.length);
  expect(NOTE_KINDS.filter(kind => !cards.some(card => card.kinds.includes(kind)))).toEqual([]);
});

test("search finds nested APIs and vocabulary and combines technology and type filters", () => {
  const hooks = filterNotes(cards, "useState", "react", "Hooks");
  expect(hooks.length).toBeGreaterThan(0);
  expect(hooks.every(card => card.technology === "react")).toBe(true);
  expect(filterNotes(cards, "no-such-note-xyz", "", "")).toEqual([]);
  expect(filterNotes(cards, "", "", "")).toHaveLength(cards.length);
  expect(filterNotes(cards, "synonyms", "", "Vocabulary").length).toBeGreaterThan(0);
});

test("existing service cards can hide references while retaining their points", () => {
  render(<ServiceCatalog hi={false} showReferences={false} services={[{ name: "EC2", category: "Compute", summary: "Virtual machines", points: ["Choose an instance type", "Configure networking"], sourceUrl: "https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ec2.html" }]} />);
  expect(screen.getByText("Choose an instance type")).toBeVisible();
  expect(screen.queryByRole("link", { name: /Official reference/ })).not.toBeInTheDocument();
});

