import { fireEvent, render, screen } from "@testing-library/react";
import { LearningPicture } from "@/components/learning-picture";
import { learningImageSlug, learningImageUrl, learningScenePrompt } from "@/lib/learning-image";

const BASE = "https://example.supabase.co/storage/v1/object/public/learning-images";

test("each part is slugged on its own, so one topic name in two catalogues gets two files", () => {
  expect(learningImageSlug("python", "list-comprehensions")).toBe("python--list-comprehensions");
  expect(learningImageSlug("Python", "Generators")).not.toBe(learningImageSlug("JavaScript", "Generators"));
});

test("names that slug alike within a package still get their own file", () => {
  expect(learningImageSlug("javascript", "Map")).not.toBe(learningImageSlug("javascript", "map"));
  expect(learningImageSlug("python", "str")).not.toBe(learningImageSlug("python", "__str__"));
  expect(learningImageSlug("javascript", "Map")).toBe(learningImageSlug("javascript", "Map"));
  expect(learningImageSlug("javascript", "Math.abs")).toMatch(/^javascript--math-abs-[a-z0-9]+$/);
});

test("no picture is requested until a base URL is configured, or for a name with nothing to slug", () => {
  expect(learningImageUrl("api", ["react", "useState"], "")).toBeNull();
  expect(learningImageUrl("api", ["javascript", "+"], BASE)).toBeNull();
  expect(learningImageUrl("workflow", ["customer-support"], `${BASE}/`)).toBe(`${BASE}/workflow/customer-support.webp`);
});

test("the picture steps aside when it has not been generated yet, and tries again for a new subject", () => {
  const { rerender } = render(<LearningPicture src={`${BASE}/api/a.webp`} alt="Illustration of how a works" />);
  fireEvent.error(screen.getByRole("img", { name: "Illustration of how a works" }));
  expect(screen.queryByRole("img")).toBeNull();
  rerender(<LearningPicture src={`${BASE}/api/b.webp`} alt="Illustration of how b works" />);
  expect(screen.getByRole("img", { name: "Illustration of how b works" })).toHaveAttribute("src", `${BASE}/api/b.webp`);
});

test("the image prompt paints the designed scene and forbids lettering and code", () => {
  const prompt = learningScenePrompt({ subject: "useState (React)", scene: "A puppet stage with one lever." });
  expect(prompt).toContain("A puppet stage with one lever.");
  expect(prompt).toMatch(/no text, letters, words, numbers, code, logos/);
});
