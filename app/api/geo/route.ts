import { NextResponse } from "next/server";
import { COUNTRY_TO_LANGUAGE, type SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { Language } from "@/lib/domain";

/**
 * Detects visitor location and suggests the appropriate native language.
 * Grounded in edge CDN headers (Vercel IP country, Cloudflare IP country).
 */
export async function GET(request: Request) {
  const headers = request.headers;
  const rawCountry = (
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    ""
  ).trim().toUpperCase();

  const detectedLanguage: Language = rawCountry && COUNTRY_TO_LANGUAGE[rawCountry]
    ? COUNTRY_TO_LANGUAGE[rawCountry]
    : "en";

  const langInfo = SUPPORTED_LANGUAGES.find(item => item.code === detectedLanguage);

  return NextResponse.json(
    {
      country: rawCountry || null,
      language: detectedLanguage,
      isDetected: Boolean(rawCountry),
      info: langInfo || null,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "x-vercel-ip-country, cf-ipcountry",
      },
    }
  );
}
