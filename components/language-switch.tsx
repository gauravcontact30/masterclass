"use client";
import { useLanguage } from "./language-provider";
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <div role="group" aria-label="Language / भाषा" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
    <span style={{ fontSize: 12 }}>Language / भाषा</span>
    {(["en", "hi"] as const).map(code => <button key={code} type="button" lang={code} aria-pressed={language === code} onClick={() => setLanguage(code)}
      style={{ padding: "7px 12px", border: "1px solid #8c9d8c", borderRadius: 4, background: language === code ? "#e4edde" : "#fffefa", color: "#233e2c", font: "inherit", fontSize: 12, cursor: "pointer" }}>{code === "hi" ? "हिन्दी" : "English"}</button>)}
  </div>;
}

/** Header EN / हिन्दी switch, icon style: an "A" and an "अ" glyph with a thumb that slides under the active one.
 *  The host passes its classes (the landing navbar styles it for the transparent and the solid bar). */
export function HeaderLanguageSwitch({ classes }: { classes?: { root?: string; thumb?: string; glyph?: string } } = {}) {
  const { language, setLanguage } = useLanguage(); const hi = language === "hi";
  return <button type="button" role="switch" className={classes?.root} data-lang={hi ? "hi" : "en"} aria-label="Hindi language" aria-checked={hi}
    title={hi ? "Switch to English" : "हिन्दी चुनें"} onClick={() => setLanguage(hi ? "en" : "hi")}>
    <span className={classes?.thumb} aria-hidden="true" />
    <span className={classes?.glyph} lang="en" aria-hidden="true" data-on={!hi || undefined}>A</span>
    <span className={classes?.glyph} lang="hi" aria-hidden="true" data-on={hi || undefined}>अ</span>
  </button>;
}
