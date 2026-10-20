import { act, fireEvent, render, screen } from "@testing-library/react";
import { LandingAskAi } from "@/components/landing-ask-ai";
import { LanguageProvider } from "@/components/language-provider";
import { STUDY_BUDDY_EVENT } from "@/lib/study-buddy-bridge";

test("a question or a starter opens Study Buddy with it, in the right mode", () => {
  const asked: unknown[] = [];
  const listen = (event: Event) => asked.push((event as CustomEvent).detail);
  window.addEventListener(STUDY_BUDDY_EVENT, listen);
  render(<LanguageProvider><LandingAskAi /></LanguageProvider>);

  const box = screen.getByLabelText("Your question");
  expect(screen.getByRole("button", { name: "Ask Study Buddy" })).toBeDisabled();
  fireEvent.change(box, { target: { value: "What is recursion?" } });
  act(() => { fireEvent.click(screen.getByRole("button", { name: "Ask Study Buddy" })); });
  expect(asked[0]).toEqual({ question: "What is recursion?", mode: "study" });
  expect(box).toHaveValue("");

  act(() => { fireEvent.click(screen.getByRole("button", { name: /Tell me about a project/ })); });
  expect(asked[1]).toMatchObject({ mode: "interview" });
  window.removeEventListener(STUDY_BUDDY_EVENT, listen);
});
