import { NextResponse } from "next/server";
import { COUNTRY_TO_LANGUAGE, SUPPORTED_LANGUAGES } from "@/lib/i18n";
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

  const acceptLang = (headers.get("accept-language") || "").toLowerCase();

  let detectedLanguage: Language = "en";
  if (rawCountry && COUNTRY_TO_LANGUAGE[rawCountry]) {
    detectedLanguage = COUNTRY_TO_LANGUAGE[rawCountry];
  } else if (acceptLang) {
    if (acceptLang.includes("es")) detectedLanguage = "es";
    else if (acceptLang.includes("ja")) detectedLanguage = "ja";
    else if (acceptLang.includes("zh")) detectedLanguage = "zh";
    else if (acceptLang.includes("de")) detectedLanguage = "de";
    else if (acceptLang.includes("fr")) detectedLanguage = "fr";
    else if (acceptLang.includes("hi") || acceptLang.includes("mr") || acceptLang.includes("gu") || acceptLang.includes("bn")) detectedLanguage = "hi";
  }

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
