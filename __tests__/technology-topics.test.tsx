import { fireEvent, render, screen, within } from "@testing-library/react";
import { TechnologyTopics } from "@/components/technology-topics";
import { ServiceCatalog } from "@/components/service-catalog";
import { Workspace } from "@/components/workspace";
import { curriculumSchema, type DocumentRecord, type Topic } from "@/lib/domain";
import { redux, reduxToolkit } from "@/lib/generation/guides/redux";
import { technologyTopicNotes } from "@/lib/technology-topics";
import { requestJson } from "@/lib/client";

jest.mock("@/lib/client", () => ({ requestJson: jest.fn(), errorKey: () => "service_error" }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));
const document: DocumentRecord = { id: "redux-notes", user_id: "student", title: redux.curriculum.title,
  request: { technologyId: "redux", topicId: "redux-full", format: "notes", language: "en", level: "beginner" },
  status: "ready", curriculum: redux.curriculum, created_at: "2026-09-12T00:00:00Z", error_code: null, page_titles: [], storage_path: null, preview_paths: [] };
const topic: Topic = { id: "redux-extra", technology_id: "redux", title: "Additional topic", title_hi: "अतिरिक्त विषय", full_track: false, version: 1, references: ["https://redux.js.org/"] };

test("each Redux and Toolkit lesson becomes a separate valid topic card", () => {
  for (const guide of [redux, reduxToolkit]) {
    expect(curriculumSchema.safeParse(guide.curriculum).success).toBe(true);
    const cards = technologyTopicNotes([{ ...document, curriculum: guide.curriculum }], [topic], false);
    expect(cards.filter(card => card.lesson).map(card => card.name)).toEqual(guide.curriculum.lessons.map(lesson => lesson.title));
    expect(cards.at(-1)?.topic).toBe(topic);
  }
});

test("pages topic cards, resets on search, expands examples and opens the original guide", () => {
  const onLearn = jest.fn();
  render(<TechnologyTopics documents={[document]} topics={[topic]} onLearn={onLearn} />);
  const section = within(screen.getByRole("region", { name: `${document.title} · English` }));
  expect(section.getAllByRole("article")).toHaveLength(4);
  fireEvent.click(section.getByRole("button", { name: "Next" }));
  expect(section.getByRole("article", { name: "Selectors and derived data" })).toBeVisible();
  fireEvent.change(screen.getByRole("combobox", { name: "Search topics" }), { target: { value: "memoizes" } });
  expect(screen.getAllByRole("article")).toHaveLength(1);
  const card = within(screen.getByRole("article", { name: "Selectors and derived data" }));
  fireEvent.click(card.getByText("Examples & practice"));
  expect(card.getByText("Build a memoized selector for incomplete tasks.")).toBeVisible();
  fireEvent.click(card.getByRole("button", { name: "Read full guide" }));
  expect(onLearn).toHaveBeenCalledWith(document);
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(within(screen.getByRole("region", { name: `${document.title} · English` })).getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.getByRole("article", { name: "Additional topic" })).toBeVisible();
});

test("keeps successful topic cards when one document fails and retries the failed document", async () => {
  const missing = { ...document, id: "remote", title: "Remote notes", curriculum: null };
  (requestJson as jest.Mock).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ document: { ...missing, curriculum: reduxToolkit.curriculum } });
  render(<TechnologyTopics documents={[document, missing]} topics={[]} onLearn={jest.fn()} />);
  await screen.findByRole("alert");
  expect(screen.getByRole("article", { name: "State ownership and one-way data flow" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("article", { name: "configureStore and development checks" })).toBeVisible();
  expect(requestJson).toHaveBeenCalledTimes(2);
});

test("Notes renders its supplied AWS service and technology topic cards", () => {
  const aws: DocumentRecord = { ...document, id: "aws", title: "AWS notes", request: { ...document.request, technologyId: "aws", topicId: "aws-popular-services" }, curriculum: { ...redux.curriculum, services: [{ name: "Amazon EC2", category: "Compute", summary: "Virtual compute capacity.", points: ["Choose an instance type.", "Control network access."] }] } };
  render(<Workspace notesContent={<><ServiceCatalog services={aws.curriculum!.services!} hi={false}/><TechnologyTopics documents={[document]} topics={[]} onLearn={jest.fn()}/></>} initialCategory="notes" authEnabled configured={false} billingEnabled={false} initialAccount={{ profile: { language: "en" }, account: { tier: "monthly", used: 0, limit: 50, subscription: null, creditBalance: 0 }, preparations: { isSuperAdmin: true, selections: [] }, documents: [aws, document], progress: [] }} />);
  expect(screen.getByRole("article", { name: "Amazon EC2" })).toBeVisible();
  expect(screen.getByRole("article", { name: "State ownership and one-way data flow" })).toBeVisible();
});
