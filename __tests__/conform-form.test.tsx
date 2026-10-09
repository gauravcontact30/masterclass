import { render, screen } from "@testing-library/react";
import { ConformStudyGoalForm } from "@/components/conform-form";

test("renders the planner without React key warnings and uses a native category select", () => {
  const errors = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    render(<ConformStudyGoalForm />);
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveValue("technology");
    expect(errors.mock.calls.flat().join(" ")).not.toMatch(/unique.*key|key.*spread/i);
  } finally { errors.mockRestore(); }
});
