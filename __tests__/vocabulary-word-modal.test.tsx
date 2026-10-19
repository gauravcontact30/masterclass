import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { VocabularyWordModal } from "@/components/vocabulary-word-modal";
import { VocabularyLookupProvider, triggerWordLookup } from "@/components/vocabulary-lookup-provider";
import { getSavedVocabularyWords, isWordSavedInVocabulary } from "@/lib/vocabulary-storage";
import type { WordLookup } from "@/lib/english-word";

const mockLookup: WordLookup = {
  entry: {
    word: "meticulous",
    pronunciation: "muh-TIK-yuh-luhs",
    meaning: "Showing great attention to detail; very careful and precise.",
    hindi: "अति सावधान, सूक्ष्म",
    sentence: "She was meticulous about keeping her research records up to date.",
    sentenceHindi: "वह अपने शोध रिकॉर्ड को अद्यतन रखने के बारे में अति सावधान थी।",
    synonyms: [
      { word: "thorough", hindi: "पूरी तरह से" },
      { word: "diligent", hindi: "परिश्रमी" },
    ],
    antonyms: [
      { word: "careless", hindi: "लापरवाह" },
      { word: "sloppy", hindi: "अव्यवस्थित" },
    ],
  },
  source: "library",
};

describe("VocabularyWordModal & Storage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renders all required details in VocabularyWordModal: English meaning, Hindi meaning, sentence, synonyms, antonyms", () => {
    const handleClose = jest.fn();
    render(
      <VocabularyWordModal
        word="meticulous"
        initialLookup={mockLookup}
        isOpen={true}
        onClose={handleClose}
      />
    );

    // Title and Hindi badge
    expect(screen.getByRole("heading", { name: /Meticulous/i })).toBeInTheDocument();
    expect(screen.getAllByText("अति सावधान, सूक्ष्म").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\/muh-TIK-yuh-luhs\//)).toBeInTheDocument();

    // English meaning and Hindi translation
    expect(
      screen.getByText("Showing great attention to detail; very careful and precise.")
    ).toBeInTheDocument();

    // Example sentence with Hindi
    expect(
      screen.getByText(/She was meticulous about keeping her research records/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/वह अपने शोध रिकॉर्ड को अद्यतन रखने के बारे में अति सावधान थी।/i)
    ).toBeInTheDocument();

    // Synonyms with Hindi
    expect(screen.getByText("thorough")).toBeInTheDocument();
    expect(screen.getByText("(पूरी तरह से)")).toBeInTheDocument();
    expect(screen.getByText("diligent")).toBeInTheDocument();

    // Antonyms with Hindi
    expect(screen.getByText("careless")).toBeInTheDocument();
    expect(screen.getByText("(लापरवाह)")).toBeInTheDocument();
    expect(screen.getByText("sloppy")).toBeInTheDocument();

    // Audio (Hear it) icons for Main word, synonyms, antonyms
    expect(
      screen.getAllByRole("button", { name: /Hear pronunciation of meticulous/i }).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("button", { name: /Hear pronunciation of thorough/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hear pronunciation of diligent/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hear pronunciation of careless/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hear pronunciation of sloppy/i })
    ).toBeInTheDocument();

    // Bookmark toggle button
    const bookmarkBtn = screen.getByRole("button", {
      name: /Bookmark to Vocabulary Page/i,
    });
    expect(bookmarkBtn).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByLabelText(/Close word details/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test("toggles bookmarking word into Vocabulary storage and dispatches update event", () => {
    const handleClose = jest.fn();
    render(
      <VocabularyWordModal
        word="meticulous"
        initialLookup={mockLookup}
        isOpen={true}
        onClose={handleClose}
      />
    );

    const bookmarkBtn = screen.getByRole("button", {
      name: /Bookmark to Vocabulary Page/i,
    });

    // Save word
    fireEvent.click(bookmarkBtn);
    expect(isWordSavedInVocabulary("meticulous")).toBe(true);
    expect(
      screen.getByRole("button", { name: /Saved in Vocabulary/i })
    ).toBeInTheDocument();

    // Verify storage
    const saved = getSavedVocabularyWords();
    expect(saved).toHaveLength(1);
    expect(saved[0].entry.word).toBe("meticulous");

    // Remove word
    const savedBtn = screen.getByRole("button", { name: /Saved in Vocabulary/i });
    fireEvent.click(savedBtn);
    expect(isWordSavedInVocabulary("meticulous")).toBe(false);
  });

  test("VocabularyLookupProvider opens modal upon triggerWordLookup event", async () => {
    // Mock fetch for word lookup
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockLookup,
    }) as jest.Mock;

    render(
      <VocabularyLookupProvider>
        <div>Learning Content Area</div>
      </VocabularyLookupProvider>
    );

    // Trigger lookup from arbitrary component
    await act(async () => {
      triggerWordLookup("meticulous", mockLookup);
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Meticulous/i })).toBeInTheDocument();
    });

    expect(
      screen.getByText("Showing great attention to detail; very careful and precise.")
    ).toBeInTheDocument();
  });

  test("modal opens with word details pre-populated and does not display loading spinner", () => {
    render(
      <VocabularyWordModal
        word="meticulous"
        initialLookup={mockLookup}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    // Verify content is immediately visible
    expect(screen.getByRole("heading", { name: /Meticulous/i })).toBeInTheDocument();
    expect(
      screen.getByText("Showing great attention to detail; very careful and precise.")
    ).toBeInTheDocument();

    // Verify loading spinner is NOT in the document
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/Looking up/i)).not.toBeInTheDocument();
  });
});
