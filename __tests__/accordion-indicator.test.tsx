import { fireEvent, render, screen } from "@testing-library/react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { AccordionSummary } from "@/components/ui/accordion-chevron";

test("shadcn trigger keeps one decorative chevron while its expanded state changes", () => {
  render(<Accordion><AccordionItem value="answer"><AccordionTrigger>Read answer</AccordionTrigger><AccordionContent>Explanation</AccordionContent></AccordionItem></Accordion>);
  const trigger = screen.getByRole("button", { name: "Read answer" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger.querySelectorAll('[data-slot="accordion-indicator"]')).toHaveLength(1);
  expect(trigger.querySelector('[data-slot="accordion-indicator"]')).toHaveAttribute("aria-hidden", "true");
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("native disclosures keep their summary and supplied props", () => {
  const { container } = render(<details open><AccordionSummary className="question" id="question">Question</AccordionSummary><p>Answer</p></details>);
  const summary = container.querySelector("details > summary")!;
  expect(summary).toHaveAttribute("id", "question");
  expect(summary).toHaveClass("question");
  expect(summary.querySelectorAll("svg")).toHaveLength(1);
  expect(container.querySelector("details")).toHaveAttribute("open");
});
