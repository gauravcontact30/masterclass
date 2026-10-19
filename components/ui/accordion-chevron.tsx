import type { ComponentProps } from "react";
import { ChevronDownIcon } from "lucide-react";

/** Shared indicator for the shadcn accordion and lightweight native disclosures. */
export function AccordionChevron() {
  return <span data-slot="accordion-indicator" aria-hidden="true"><ChevronDownIcon data-slot="accordion-trigger-icon" /></span>;
}

/** Keeps public learning answers server-rendered and usable before hydration. */
export function AccordionSummary({ children, ...props }: ComponentProps<"summary">) {
  return <summary {...props} data-slot="accordion-summary">{children}<AccordionChevron /></summary>;
}
