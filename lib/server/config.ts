import "server-only";
import { statSync } from "node:fs";
import { resolve } from "node:path";
export function required(name: string) {
  const value = process.env[name];
  if (!value || value.includes("xxx")) throw new Error(`CONFIG:${name}`);
  return value;
}

// Rendering needs a Chromium build and a font with Devanagari coverage. Both are
// usually already on the machine, so an unset variable falls back to probing the
// usual install locations rather than failing setup outright. An explicit env
// value always wins.
const CHROMIUM_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];
// The repo ships Noto Sans Devanagari (public/fonts, OFL) precisely so guides
// render Latin and Devanagari without depending on what the host has installed.
// The system paths are only a fallback for deployments that prune public/.
const FONT_PATHS = [
  resolve("public/fonts/NotoSansDevanagari.ttf"),
  "C:/Windows/Fonts/Nirmala.ttf",
  "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf",
];
const usableFile = (path: string) => { try { return statSync(path).isFile(); } catch { return false; } };
// A configured value only wins if it actually points at a file. Pointing at a
// directory (C:/Windows/Fonts rather than the .ttf inside it) is an easy mistake
// that would otherwise surface as EISDIR deep inside the renderer.
function resolved(name: string, candidates: string[]) {
  const configured = process.env[name];
  if (configured && !configured.includes("xxx") && usableFile(configured)) return configured;
  const found = candidates.find(usableFile);
  if (!found) throw new Error(`CONFIG:${name}`);
  return found;
}
export const chromiumPath = () => resolved("CHROMIUM_EXECUTABLE_PATH", CHROMIUM_PATHS);
export const documentFontPath = () => resolved("DOCUMENT_FONT_PATH", FONT_PATHS);
export const databaseConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const authConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export function quota(tier: string) {
  const amount = Number(process.env[tier === "free" ? "FREE_MONTHLY_GENERATIONS" : "PRO_MONTHLY_GENERATIONS"] ?? (tier === "free" ? 3 : 50));
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("CONFIG:quota");
  return amount;
}
export function billingConfigured() { return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_MONTHLY_PLAN_ID && process.env.RAZORPAY_YEARLY_PLAN_ID && process.env.BILLING_ENABLED === "true"); }
