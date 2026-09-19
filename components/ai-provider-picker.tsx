"use client";

import { useCallback, useEffect, useId, useState } from "react";
import type React from "react";
import { Globe, Sparkles } from "lucide-react";
import styles from "./ai-provider-picker.module.css";

export type AiProviderOption = { id: string; label: string; grounded: boolean; description: string };
const STORAGE_KEY = "masterclass:ai-provider";

function remembered() {
  try { return localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
}

/** The response is validated rather than trusted: a bad payload must not break the page. */
function options(result: unknown): AiProviderOption[] {
  const list = (result as { providers?: unknown })?.providers;
  if (!Array.isArray(list)) return [];
  return list.flatMap(item => typeof item?.id === "string" && typeof item?.label === "string"
    ? [{ id: item.id, label: item.label, grounded: item.grounded === true, description: typeof item.description === "string" ? item.description : "" }]
    : []);
}

/**
 * The learner's choice of model, shared by every generated surface.
 *
 * The list comes from the server, because only the server knows which
 * credentials exist. Until it arrives, and whenever a deployment has one
 * provider, `provider` is undefined and requests simply omit it — so the server
 * default applies and nothing depends on this hook resolving.
 */
export function useAiProvider(enabled = true) {
  const [providers, setProviders] = useState<AiProviderOption[]>([]);
  const [provider, setProvider] = useState<string | undefined>(undefined);
  useEffect(() => {
    // Nothing will be generated on this surface, so ask for nothing.
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/api/pro-learn/providers", { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("unavailable")))
      .then((result: unknown) => {
        if (controller.signal.aborted) return;
        const list = options(result);
        setProviders(list);
        const saved = remembered();
        const fallback = typeof (result as { default?: unknown })?.default === "string" ? (result as { default: string }).default : undefined;
        setProvider(list.some(item => item.id === saved) ? saved : list.some(item => item.id === fallback) ? fallback : undefined);
      })
      .catch(() => { /* One provider, or none: the server default decides. */ });
    return () => controller.abort();
  }, [enabled]);
  const choose = useCallback((id: string) => {
    setProvider(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* Remembering the choice is optional. */ }
  }, []);
  return { providers, provider, choose };
}

/** Rendered only when there is a real choice to make. */
export function AiProviderPicker({ providers, provider, onChoose, label = "Prepare with" }: {
  providers: AiProviderOption[]; provider?: string; onChoose: (id: string) => void; label?: string;
}) {
  const id = useId();
  if (providers.length < 2) return null;
  const active = providers.find(item => item.id === provider);
  return <div className={styles.picker}>
    <span className={styles.label} id={`${id}-label`}><Sparkles size={14} aria-hidden="true" />{label}</span>
    <div className={styles.options} role="radiogroup" aria-labelledby={`${id}-label`}>
      {providers.map(item => <button key={item.id} type="button" role="radio" aria-checked={item.id === provider} className={styles.option}
        onClick={() => onChoose(item.id)} title={item.description}>{item.label}{item.grounded && <span className={styles.grounded}>web</span>}</button>)}
    </div>
    {active && <p className={styles.hint}>{active.description}</p>}
  </div>;
}

/**
 * The brand glyph for a model, drawn rather than imported so the switch stays
 * one file with no icon package behind it. Anything unrecognised falls back to
 * the generic spark, so a third provider still gets a mark.
 */
function ProviderIcon({ id, size = 14 }: { id: string; size?: number }) {
  const frame: React.SVGProps<SVGSVGElement> = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
    className: styles.brandIcon, "aria-hidden": true, focusable: "false",
  };
  // Claude: the ten-ray burst. Perplexity: the two wings either side of a stem.
  if (id === "anthropic") return <svg {...frame}><path d="M12 2.9v18.2M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4M3.4 9.2l17.2 5.6M3.4 14.8l17.2-5.6" /></svg>;
  if (id === "perplexity") return <svg {...frame}><path d="M12 3.7v16.6M12 9.7 5 4.4v15.2l7-5.3M12 9.7l7-5.3v15.2l-7-5.3" /></svg>;
  return <Sparkles size={size} className={styles.brandIcon} aria-hidden="true" />;
}

/**
 * The same choice as AiProviderPicker, drawn as one sliding switch that lives
 * *inside* the search field.
 *
 * The search page asks this question on every visit, and the answer it changes
 * is the one the field is about to fetch — so the control belongs in the field
 * rather than under it. That placement pays for itself in height and in
 * meaning, but it also sets the budget: no heading, no description line, just
 * two stops on a track behind a hairline. Each stop leads with the model's own
 * mark, which is what a reader actually recognises, so the names can shrink and
 * drop away entirely on a narrow screen.
 *
 * It stays a radiogroup so arrow keys and screen readers treat it as the pair
 * of named options it is — a `switch` would say "on/off", which is not what is
 * being chosen. The group carries `label` as its accessible name, and each
 * stop's tooltip carries the description the hint line used to show. Like the
 * picker, it renders only when there is a real choice.
 */
export function AiProviderSwitch({ providers, provider, onChoose, label = "Answer with" }: {
  providers: AiProviderOption[]; provider?: string; onChoose: (id: string) => void; label?: string;
}) {
  if (providers.length < 2) return null;
  // The thumb travels between the first two stops; any further provider stays a plain stop.
  const index = Math.max(0, providers.findIndex(item => item.id === provider));
  const active = providers[index];
  return <div className={styles.switchRow}>
    <div className={styles.track} role="radiogroup" aria-label={label} style={{ "--stops": providers.length, "--active": index } as React.CSSProperties}>
      <span className={styles.thumb} aria-hidden="true" />
      {providers.map(item => <button key={item.id} type="button" role="radio" aria-checked={item.id === active?.id} className={styles.stop}
        data-provider={item.id} onClick={() => onChoose(item.id)} title={`${label} ${item.label}. ${item.description}`}>
        <ProviderIcon id={item.id} />
        {/* Hidden below tablet width, where the mark carries the stop on its own. */}
        <span className={styles.stopName}>{item.label}</span>
        {item.grounded && <Globe size={10} className={styles.web} role="img" aria-label="searches the web" />}
      </button>)}
    </div>
  </div>;
}

/** Plain-text provenance: hostnames a grounded answer used, never outbound links. */
export function AiProvenance({ provider, sources, providers }: { provider?: string; sources?: string[]; providers: AiProviderOption[] }) {
  if (!provider) return null;
  const label = providers.find(item => item.id === provider)?.label ?? provider;
  return <p className={styles.provenance}>
    Prepared with {label}
    {sources?.length ? ` · sources searched: ${sources.join(", ")}` : ""}
  </p>;
}
