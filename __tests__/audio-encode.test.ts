/** @jest-environment node */
import { readWav, toMp3 } from "@/lib/server/audio";

// The encoder ships an ES module and a browser IIFE that exports nothing to require(); Jest compiles import() to
// require(), so evaluate the IIFE here to test the real encoder. `ai` (ESM only) is not used by the encoder.
jest.mock("ai", () => ({}));
jest.mock("@breezystack/lamejs", () => {
  const source = jest.requireActual<typeof import("node:fs")>("node:fs").readFileSync(require.resolve("@breezystack/lamejs"), "utf8");
  return new Function(`${source}; return lamejs;`)();
});

function wav(samples: number, rate = 24_000) {
  const bytes = new Uint8Array(44 + samples * 2), view = new DataView(bytes.buffer);
  const tag = (at: number, text: string) => [...text].forEach((c, i) => { bytes[at + i] = c.charCodeAt(0); });
  tag(0, "RIFF"); view.setUint32(4, 36 + samples * 2, true); tag(8, "WAVE"); tag(12, "fmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  tag(36, "data"); view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) view.setInt16(44 + i * 2, Math.round(Math.sin(i / 10) * 8000), true);
  return bytes;
}
describe("WAV to MP3", () => {
  it("reads 16-bit PCM and encodes much smaller MP3 frames", async () => {
    const pcm = readWav(wav(24_000));
    expect(pcm).toMatchObject({ rate: 24_000, channels: 1 });
    expect(pcm.samples).toHaveLength(24_000);
    const mp3 = await toMp3(pcm);
    expect(mp3[0]).toBe(0xff);
    expect(mp3.length).toBeLessThan(48_000 / 4);
  });
  it("rejects audio that is not WAV", () => {
    expect(() => readWav(new Uint8Array(64))).toThrow("audio_not_wav");
  });
});
