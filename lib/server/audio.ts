import "server-only";
import { createHash } from "node:crypto";
import { gateway, generateSpeech } from "ai";
import { db } from "./db";
import { HttpError } from "./http";
import { providerConfigured } from "./ai-providers";

/*
 * Audio lectures: one part of a lecture read aloud by a chosen voice, through Vercel AI Gateway (Gemini TTS by
 * default, AUDIO_TTS_MODEL to change it). The gateway returns WAV, about 48 KB a second, so it is encoded to 48 kbps
 * mono MP3 (about 6 KB a second) and kept in the public "learning-audio" bucket under a hash of model, voice and
 * text: the same part in the same voice is generated once and then served from storage to everyone.
 */
const MODEL = process.env.AUDIO_TTS_MODEL || "google/gemini-3.8-flash-tts";
const BUCKET = "learning-audio";
const READING = "Read this aloud as a warm, patient teacher giving a clear lecture to a student: natural pace, gentle emphasis on key terms, short pauses between ideas.";

export const audioConfigured = () => providerConfigured("gateway");
const keyOf = (voice: string, text: string) => createHash("sha256").update(`${MODEL}\n${voice}\n${text}`).digest("hex");
const pathOf = (key: string) => `tts/${key.slice(0, 2)}/${key}.mp3`;
const publicUrl = (path: string) => db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

/** The stored part, if it has been made before. */
export async function cachedAudio(voice: string, text: string): Promise<string | null> {
  const path = pathOf(keyOf(voice, text));
  const slash = path.lastIndexOf("/");
  const { data, error } = await db().storage.from(BUCKET).list(path.slice(0, slash), { search: path.slice(slash + 1), limit: 1 });
  if (error || !data?.some(file => file.name === path.slice(slash + 1))) return null;
  return publicUrl(path);
}

/** PCM samples of a 16-bit WAV, with its sample rate and channel count. */
export function readWav(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number) => String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);
  if (bytes.length < 44 || tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("audio_not_wav");
  let rate = 24_000, channels = 1, bits = 16, at = 12;
  while (at + 8 <= bytes.length) {
    const id = tag(at), size = view.getUint32(at + 4, true), body = at + 8;
    if (id === "fmt ") { channels = view.getUint16(body + 2, true); rate = view.getUint32(body + 4, true); bits = view.getUint16(body + 14, true); }
    if (id === "data") {
      if (bits !== 16) throw new Error("audio_not_16_bit");
      // Some encoders write 0 or 0xFFFFFFFF for a streamed data size: read to the end then.
      const end = size && body + size <= bytes.length ? body + size : bytes.length;
      const samples = new Int16Array(Math.floor((end - body) / 2));
      for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(body + i * 2, true);
      return { samples, rate, channels };
    }
    at = body + size + (size % 2);
  }
  throw new Error("audio_no_data");
}

/**
 * 16-bit PCM to MP3 (mono; a stereo source is mixed down). The encoder is imported dynamically: its CommonJS entry
 * is a browser IIFE that exports nothing, and import() always resolves the ES module build.
 */
export async function toMp3({ samples, rate, channels }: ReturnType<typeof readWav>, kbps = 48) {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  let mono = samples;
  if (channels === 2) { mono = new Int16Array(samples.length / 2); for (let i = 0; i < mono.length; i++) mono[i] = (samples[2 * i] + samples[2 * i + 1]) >> 1; }
  const encoder = new Mp3Encoder(1, rate, kbps);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < mono.length; i += 1152) { const out = encoder.encodeBuffer(mono.subarray(i, i + 1152)); if (out.length) chunks.push(out); }
  const tail = encoder.flush(); if (tail.length) chunks.push(tail);
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk.buffer, chunk.byteOffset, chunk.length)));
}

/** Reads one part aloud and stores it; returns its public URL. */
export async function speak(voice: string, text: string): Promise<string> {
  if (!audioConfigured()) throw new HttpError(503, "audio_unavailable");
  const path = pathOf(keyOf(voice, text));
  const { audio } = await generateSpeech({ model: gateway.speech(MODEL), text, voice, instructions: READING, maxRetries: 1, abortSignal: AbortSignal.timeout(60_000) });
  const mp3 = audio.mediaType.includes("wav") ? await toMp3(readWav(audio.uint8Array)) : Buffer.from(audio.uint8Array);
  const storage = db().storage;
  const put = () => storage.from(BUCKET).upload(path, mp3, { contentType: "audio/mpeg", cacheControl: "31536000", upsert: true });
  let { error } = await put();
  if (error && /bucket not found/i.test(error.message)) {
    await storage.createBucket(BUCKET, { public: true, allowedMimeTypes: ["audio/mpeg"], fileSizeLimit: "5MB" });
    ({ error } = await put());
  }
  if (error) throw new Error(error.message);
  return publicUrl(path);
}
