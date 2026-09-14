"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useState } from "react";
import { requestJson } from "@/lib/client";
import { PreparationPicker } from "./preparation-picker";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
export function PreparationSetup({ onSaved }: { onSaved: () => Promise<void> }) {
  const { language } = useLanguage(); const hi = language === "hi";
  const [value, setValue] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  async function save() { setBusy(true); setError(false); try { await requestJson("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selections: value }) }); await onSaved(); } catch { setError(true); } finally { setBusy(false); } }
  return <section><PreparationPicker value={value} onChange={setValue} disabled={busy} />{error && <p role="alert"><ExpandedText text={hi ? "चयन सहेजा नहीं जा सका। फिर प्रयास करें।" : "Could not save your choices. Please retry."} /></p>}<Button disabled={!value.length || busy} onClick={() => void save()}><ExpandedText text={busy ? hi ? "सहेज रहे हैं…" : "Saving…" : hi ? "मेरा डैशबोर्ड तैयार करें" : "Prepare my dashboard"} /></Button></section>;
}
