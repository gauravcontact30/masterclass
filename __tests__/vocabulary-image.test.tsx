import { fireEvent, render, screen } from "@testing-library/react";
import { VocabularyWordCard } from "@/components/vocabulary-word-card";
import { vocabularyImageSlug, vocabularyImageUrl, vocabularyScenePrompt } from "@/lib/vocabulary-image";
import { awsServiceImageUrl, awsServiceScenePrompt } from "@/lib/aws-service-image";

const BASE = "https://example.supabase.co/storage/v1/object/public/vocabulary-images";
const card = { entry: { word: "knell", pronunciation: "NEL", meaning: "A slow bell, or a sign that something has ended.", hindi: "मृत्यु-घंटा", sentence: "The ruling sounded the knell for the scheme.", synonyms: [], antonyms: [] }, source: "library" as const, at: 1 };
const renderCard = () => render(<VocabularyWordCard card={card} selected={false} onOpen={() => {}} onUpdate={() => {}} onDelete={() => {}} />);

afterEach(() => { delete process.env.NEXT_PUBLIC_VOCABULARY_IMAGE_BASE; });

test("slugs are stable, lower-case and URL-safe", () => {
  expect(vocabularyImageSlug("Knell")).toBe("knell");
  expect(vocabularyImageSlug(" A shot in the arm ")).toBe("a-shot-in-the-arm");
  expect(vocabularyImageSlug("Zig-zag")).toBe("zig-zag");
  expect(vocabularyImageSlug("Devil’s advocate")).toBe("devils-advocate");
});

test("no picture is requested until a base URL is configured", () => {
  expect(vocabularyImageUrl("knell", "")).toBeNull();
  expect(vocabularyImageUrl("knell", `${BASE}/`)).toBe(`${BASE}/knell.webp`);
});

test("the card shows the word's picture above its caption", () => {
  process.env.NEXT_PUBLIC_VOCABULARY_IMAGE_BASE = BASE;
  renderCard();
  expect(screen.getByRole("img", { name: /meaning of “knell”/ })).toHaveAttribute("src", `${BASE}/knell.webp`);
  expect(screen.getByRole("heading", { name: "Knell" })).toBeVisible();
  expect(screen.getByText(card.entry.meaning)).toBeVisible();
});

test("a word without a picture falls back to its icon instead of a broken image", () => {
  process.env.NEXT_PUBLIC_VOCABULARY_IMAGE_BASE = BASE;
  renderCard();
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByRole("heading", { name: "Knell" })).toBeVisible();
});

test("the image prompt paints the designed scene and forbids lettering", () => {
  const scene = "A great bronze bell tolls above mourners gathered at a rain-soaked funeral.";
  const prompt = vocabularyScenePrompt({ word: "knell", scene });
  expect(prompt).toContain('"knell"');
  expect(prompt).toContain(scene);
  expect(prompt).toMatch(/no text, letters/i);
});

test("AWS service pictures are keyed by slug and stay off until configured", () => {
  expect(awsServiceImageUrl("Amazon S3", "")).toBeNull();
  expect(awsServiceImageUrl("Amazon S3", "https://cdn.example/aws-service-images")).toBe("https://cdn.example/aws-service-images/amazon-s3.webp");
  expect(awsServiceImageUrl("AWS IoT Device Defender", "https://cdn.example/x/")).toBe("https://cdn.example/x/aws-iot-device-defender.webp");
});

test("the AWS image prompt forbids logos and lettering", () => {
  expect(awsServiceScenePrompt({ name: "Amazon S3", scene: "Crates of files on shelves." })).toMatch(/no text.*logos.*AWS or Amazon branding/i);
});
