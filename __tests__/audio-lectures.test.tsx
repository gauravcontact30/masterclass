import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MAX_PART, VOICES, lectureParts, speakable } from "@/lib/audio-voices";
import { ListenButton } from "@/components/listen-button";

describe("audio lecture voices and parts", () => {
  it("offers ten female and ten male voices with unique ids", () => {
    expect(VOICES.filter(voice => voice.gender === "female")).toHaveLength(10);
    expect(VOICES.filter(voice => voice.gender === "male")).toHaveLength(10);
    expect(new Set(VOICES.map(voice => voice.id)).size).toBe(20);
  });
  it("reads HTML as plain sentences", () => {
    expect(speakable("<h2>Hooks</h2><p>useState keeps <b>state</b>.</p><script>alert(1)</script>")).toBe("Hooks. useState keeps state.");
  });
  it("starts with a short part and keeps every part within the limit at sentence ends", () => {
    const text = Array.from({ length: 40 }, (_, n) => `Sentence number ${n} explains one small idea about closures in JavaScript.`).join(" ");
    const parts = lectureParts(text);
    expect(parts[0].length).toBeLessThanOrEqual(260);
    expect(parts.every(part => part.length <= MAX_PART && /[.!?]$/.test(part))).toBe(true);
    expect(parts.join(" ")).toBe(speakable(text));
    expect(lectureParts("word ".repeat(400)).every(part => part.length <= MAX_PART)).toBe(true);
  });
});

describe("ListenButton", () => {
  it("asks /api/audio for the first part in the default voice and plays it", async () => {
    const play = jest.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ url: "https://example.supabase.co/a.mp3" }) });
    render(<ListenButton id="t1" title="Closures" text="Closures remember their scope. They power callbacks." />);
    fireEvent.click(screen.getByRole("button", { name: /listen: closures/i }));
    await waitFor(() => expect(play).toHaveBeenCalled());
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ voice: "Sulafat", text: "Closures remember their scope. They power callbacks." });
    expect(await screen.findByRole("button", { name: /pause: closures/i })).toBeInTheDocument();
  });
});
