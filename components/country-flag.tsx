"use client";
import { useState } from "react";
import { Globe2 } from "lucide-react";

/*
 * A country's real flag, from the flag-icons set bundled in public/images/flags (MIT, lipis/flag-icons 7.2.3; licence
 * beside the files), so flags load from this site instead of a third-party CDN and show on every platform (Windows
 * does not draw emoji flags). `code` is an ISO 3166-1 alpha-2 code ("IN", "us"); anything else, or a code with no
 * flag, shows a globe. Decorative by default: the country name is always written beside it.
 */
export function CountryFlag({ code, size = 20, title }: { code: string | null | undefined; size?: number; title?: string }) {
  const [failed, setFailed] = useState(false);
  const iso = (code ?? "").trim().toLowerCase();
  const height = Math.round(size * 0.75);
  const box = { display: "inline-flex", flex: "none", alignItems: "center", justifyContent: "center", width: size, height, verticalAlign: "middle", marginRight: 6 } as const;
  if (!/^[a-z]{2}$/.test(iso) || failed) return <span style={{ ...box, color: "#8a877d" }} aria-hidden="true"><Globe2 size={Math.round(size * 0.65)} /></span>;
  // eslint-disable-next-line @next/next/no-img-element -- small static SVGs; next/image would rasterise them for no gain.
  return <img src={`/images/flags/${iso}.svg`} width={size} height={height} alt={title ?? ""} title={title} aria-hidden={title ? undefined : true} loading="lazy" decoding="async"
    style={{ ...box, objectFit: "cover", borderRadius: 3, boxShadow: "0 0 0 1px rgba(0, 0, 0, .12)" }} onError={() => setFailed(true)} />;
}
