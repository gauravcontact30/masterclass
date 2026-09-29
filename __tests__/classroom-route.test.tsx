import { render, screen } from "@testing-library/react";
import { Workspace } from "@/components/workspace";
jest.mock("next/navigation", () => ({ usePathname: () => "/dashboard/classroom", useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));
jest.mock("@/lib/client", () => ({ requestJson: jest.fn(), errorKey: () => "service_error" }));

/**
 * Class Room renders its own heading, so the dashboard hero must stay out of
 * its way. It also has no CATEGORY_LABELS entry, so a hero that did render
 * would hand ExpandedText an undefined label and take the whole route down.
 */
test("the Class Room route renders without the dashboard hero", () => {
  render(<Workspace authEnabled={false} configured={false} billingEnabled={false}
    initialCategory="classroom" notesContent={<p>Class Room body</p>} />);
  expect(screen.getByText("Class Room body")).toBeVisible();
  expect(document.querySelector(".page-intro")).toBeNull();
  // The breadcrumb still names the section.
  expect(screen.getAllByText("Class Room").length).toBeGreaterThan(0);
});
