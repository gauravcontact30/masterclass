import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthAudiencePicker } from "@/components/auth-audience-picker";
import { LanguageProvider } from "@/components/language-provider";
import { HeaderLanguageSwitch, LanguageSwitch } from "@/components/language-switch";
import { IeltsPreparation } from "@/components/ielts-preparation";
jest.mock("@/components/audience-provider", () => ({ useIndiaAccess: () => true }));
beforeEach(() => localStorage.clear());
// The board, class and target exam are shadcn Selects (Base UI): open the combobox, then pick an option.
async function pick(label: string, option: RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}
test("Board Scholars onboarding preserves selected board and class in the destination", async () => {
  const choose = jest.fn();
  render(<AuthAudiencePicker mode="signup" portal="boards" destination="/exams/board-exams?board=cbse" onDestination={choose} />);
  expect(screen.getByRole("combobox", { name: "Your board" })).toHaveTextContent("CBSE");
  await pick("Your class", /Class 12/);
  expect(choose).toHaveBeenCalledWith("/exams/board-exams?board=cbse&class=12");
});
test("Exam Aspirants onboarding offers NDA, CBI and Income Tax targets", async () => {
  const choose = jest.fn();
  render(<AuthAudiencePicker mode="signin" portal="competitive" destination="/exams/competitive-exams" onDestination={choose} />);
  await userEvent.setup().click(screen.getByRole("combobox", { name: "Your target exam" }));
  expect(await screen.findByRole("option", { name: /NDA/ })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /^CBI/ })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /Income Tax/ })).toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("option", { name: /UPSC/ }));
  expect(choose).toHaveBeenCalledWith("/exams/competitive-exams?exam=upsc");
});
test("India Tech Pro onboarding links to both exam portals' own sign-up pages", () => {
  render(<AuthAudiencePicker mode="signup" portal="tech" destination="/learning" onDestination={jest.fn()} />);
  expect(screen.getByRole("link", { name: /Board Scholars/ })).toHaveAttribute("href", "/exams/board-exams/sign-up");
  expect(screen.getByRole("link", { name: /Exam Aspirants/ })).toHaveAttribute("href", "/exams/competitive-exams/sign-up");
  expect(screen.queryByRole("link", { name: /Tech Pro/ })).toBeNull();
});
test("Hindi is selectable and persisted", () => {
  render(<LanguageProvider><LanguageSwitch /></LanguageProvider>);
  fireEvent.click(screen.getByRole("button", { name: "हिन्दी" }));
  expect(localStorage.getItem("mc-language")).toBe("hi");
  expect(document.documentElement.lang).toBe("hi");
});
test("IELTS test type changes the writing task and keeps independent drafts", () => {
  render(<IeltsPreparation />);
  fireEvent.click(screen.getByRole("button", { name: "Writing" }));
  expect(screen.getByText(/A library recorded 120/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Write your answer in English"), { target: { value: "Overall loans increased." } });
  expect(screen.getByText(/3 words/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /General Training/ }));
  expect(screen.getByText(/You recently borrowed a book/)).toBeInTheDocument();
  expect(screen.getByLabelText("Write your answer in English")).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: /Academic/ }));
  expect(screen.getByLabelText("Write your answer in English")).toHaveValue("Overall loans increased.");
});

test("landing header language switch defaults to English and toggles Hindi", () => {
  render(<LanguageProvider><HeaderLanguageSwitch /></LanguageProvider>);
  const toggle = screen.getByRole("switch", { name: "Hindi language" });
  expect(toggle).toHaveAttribute("aria-checked", "false");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-checked", "true");
  expect(localStorage.getItem("mc-language")).toBe("hi");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-checked", "false");
});
