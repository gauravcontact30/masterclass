import { fireEvent, render, screen, within } from "@testing-library/react";
import { ServiceCatalog } from "@/components/service-catalog";
import { AWS_AI_SERVICES } from "@/lib/generation/guides/aws-catalog-views";
import { AWS_SERVICE_CATALOG } from "@/lib/generation/guides/aws-service-catalog";
import { groupLearningDocuments } from "@/lib/learning-categories";
import { TECHNOLOGY_GUIDES } from "@/lib/generation/guides";
import { curriculumSchema } from "@/lib/domain";
import preview from "@/lib/catalog-preview.json";

test("AI services show four distinct cards per page and search resets pagination", () => {
  render(<ServiceCatalog services={AWS_AI_SERVICES} hi={false} />);
  const firstPage = screen.getAllByRole("article");
  expect(firstPage).toHaveLength(4);
  expect(new Set(firstPage.map(card => card.getAttribute("data-tint"))).size).toBe(4);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.queryByRole("article", { name: "Amazon Bedrock" })).not.toBeInTheDocument();
  const input = screen.getByRole("combobox", { name: "Search services" });
  fireEvent.change(input, { target: { value: "Bed" } });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(screen.getByRole("option", { name: "Amazon Bedrock service" })).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input).toHaveValue("Amazon Bedrock");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(screen.getByRole("article", { name: "Amazon Bedrock" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(input).toHaveFocus();
  expect(screen.getAllByRole("article")).toHaveLength(4);
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  fireEvent.change(input, { target: { value: "no-such-service" } });
  expect(screen.queryAllByRole("article")).toHaveLength(0);
  expect(screen.getByText(/No service matches/)).toBeVisible();
});

test("every remaining service can be reached without duplicates and has pointwise notes", () => {
  render(<ServiceCatalog services={AWS_AI_SERVICES} hi={false} />);
  const names: string[] = [];
  const next = screen.getByRole("button", { name: "Next" });
  for (;;) {
    const cards = screen.getAllByRole("article");
    cards.forEach(card => {
      names.push(card.getAttribute("aria-label")!);
      expect(within(card).getAllByRole("listitem").length).toBeGreaterThanOrEqual(2);
    });
    if (next.hasAttribute("disabled")) break;
    fireEvent.click(next);
  }
  expect(names).toEqual(AWS_AI_SERVICES.map(service => service.name));
  expect(new Set(names).size).toBe(names.length);
});

test("completed guides validate and are registered in the preparation catalog", () => {
  for (const guide of TECHNOLOGY_GUIDES) {
    expect(() => curriculumSchema.parse(guide.curriculum)).not.toThrow();
    expect(preview.technologies.some(technology => technology.id === guide.technologyId)).toBe(true);
    expect({ id: guide.id, registered: preview.topics.some(topic => topic.id === guide.topicId && topic.technology_id === guide.technologyId) }).toEqual({ id: guide.id, registered: true });
  }
  expect(groupLearningDocuments([])).toEqual([]);
});

test("comprehensive AWS directory has distinct sourced references and meaningful points", () => {
  expect(AWS_SERVICE_CATALOG.length).toBeGreaterThanOrEqual(400);
  expect(AWS_SERVICE_CATALOG.length).toBeLessThanOrEqual(500);
  expect(new Set(AWS_SERVICE_CATALOG.map(service => service.name)).size).toBe(AWS_SERVICE_CATALOG.length);
  for (const service of AWS_SERVICE_CATALOG) {
    expect(service.sourceUrl).toMatch(/^https:\/\/(docs\.aws\.amazon\.com|boto3\.amazonaws\.com)\//);
    expect(service.points).toHaveLength(3);
    expect(new Set(service.points).size).toBe(3);
    expect(service.summary).not.toMatch(/^Access the documented/);
  }
});

test("each AWS category has independent four-card pagination and search resets it", () => {
  const services = ["Core AWS Services", "Messaging & Integration"].flatMap(category => Array.from({ length: 7 }, (_, i) => ({ ...AWS_SERVICE_CATALOG[0], awsId: `${category}-${i}`, name: `${category} item ${i}`, category })));
  render(<ServiceCatalog services={services} hi={false} grouped />);
  const core = within(screen.getByRole("region", { name: "Core AWS Services" }));
  const messaging = within(screen.getByRole("region", { name: "Messaging & Integration" }));
  expect(core.getAllByRole("article")).toHaveLength(4);
  fireEvent.click(core.getByRole("button", { name: "Next" }));
  expect(core.getAllByRole("article")).toHaveLength(3);
  expect(messaging.getAllByRole("article")).toHaveLength(4);
  fireEvent.change(screen.getByRole("combobox", { name: "Search services" }), { target: { value: "Messaging" } });
  expect(screen.queryByRole("region", { name: "Core AWS Services" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(within(screen.getByRole("region", { name: "Core AWS Services" })).getByRole("button", { name: "Previous" })).toBeDisabled();
});
