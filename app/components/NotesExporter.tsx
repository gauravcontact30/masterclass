"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ExpandedText } from "@/components/expanded-text";


import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Check, Download, LoaderCircle, NotebookPen, TriangleAlert } from "lucide-react";
import { downloadFilename, filenameFromDisposition } from "@/lib/artistic-notes/download";
import { plainInline } from "@/lib/artistic-notes/inline";
import { markupToPayloads, SAMPLE_MARKUP } from "@/lib/artistic-notes/markup";
import { buildNotebook } from "@/lib/artistic-notes/notebook";
import { exportSchemas, requestLimits, type ExportFormat, type NotebookRequest } from "@/lib/artistic-notes/schema";
import { artisticThemes, themeNames, type ArtisticTheme, type ArtisticThemeName } from "@/lib/artistic-notes/themes";

/*
 * Internal exporter for the artistic-notes pipeline. Content comes in either
 * as quick markup (parsed client-side into the notebook payload) or as the
 * JSON bundle the artistic-notes-generator skill emits. Each payload is validated
 * with the same zod schema the endpoint uses before the download button is
 * enabled, so the server's 400 is a backstop rather than the feedback loop.
 *
 * Styling note: app/globals.css sets unlayered element rules (label, legend,
 * input/textarea "font: inherit"), which beat Tailwind's layered utilities.
 * Text styles therefore live on wrappers and inner spans, not on those
 * elements themselves.
 */

type Outputs = { notebook: NotebookRequest };
type Issue = NonNullable<ReturnType<(typeof exportSchemas)["notebook"]["safeParse"]>["error"]>["issues"][number];
type Prepared<F extends ExportFormat> =
  | { kind: "ready"; data: Outputs[F]; body: string }
  | { kind: "invalid"; issues: string[] }
  | { kind: "absent" };
type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; filename: string; body: string }
  | { state: "error"; message: string; body: string };
type Mode = "markup" | "json";

const FORMATS: ExportFormat[] = ["notebook"];
const FORMAT_META: Record<ExportFormat, { badge: string; name: string; extension: string; Icon: typeof NotebookPen }> = {
  notebook: { badge: "IPYNB", name: "Jupyter notebook", extension: ".ipynb", Icon: NotebookPen },
};

/** Server error codes (lib/server/http.ts) mapped to something a person can act on. */
export const EXPORT_ERROR_MESSAGES: Record<string, string> = {
  signin_required: "Sign in first: exports are tied to your account.",
  invalid_origin: "Blocked: the request has to come from this site.",
  invalid_request: "The server rejected the content. Check the issues listed above and try again.",
  request_too_large: "Too much content for this format. Split it into smaller documents.",
  rate_limited: "Too many exports in the last minute. Wait a moment, then retry.",
  setup_required: "This server is not configured for exports yet (auth, database or renderer missing).",
  network: "Network error. Check your connection and retry.",
  service_error: "The export failed on the server. Try again.",
};

/** Delay before the object URL is revoked: some browsers read it after click() returns. */
export const REVOKE_DELAY_MS = 1500;

const SEGMENTS: Record<string, string> = { sections: "Section", summary: "Summary line", recall: "recall prompt", code: "code cell", formulas: "formula", takeaways: "takeaway" };

function describeIssue(issue: Issue): string {
  const parts: string[] = [];
  for (let index = 0; index < issue.path.length; index++) {
    const key = String(issue.path[index]);
    const next = issue.path[index + 1];
    if (typeof next === "number" && SEGMENTS[key]) { parts.push(`${SEGMENTS[key]} ${next + 1}`); index++; }
    else parts.push(key);
  }
  // Rephrase zod's generic defaults; a schema's own message is kept.
  let message = issue.message;
  if (issue.code === "too_small" && issue.origin === "array" && message.startsWith("Too small")) message = `needs at least ${String(issue.minimum)}`;
  if (issue.code === "too_big" && issue.origin === "array" && message.startsWith("Too big")) message = `allows at most ${String(issue.maximum)}`;
  if (issue.code === "unrecognized_keys") message = `unknown key${issue.keys.length === 1 ? "" : "s"}: ${issue.keys.join(", ")}`;
  if (issue.code === "invalid_type") message = `expected ${issue.expected}`;
  const where = parts.join(" › ");
  return where ? `${where}: ${message}` : message;
}

function prepare<F extends ExportFormat>(format: F, payload: unknown, theme: ArtisticThemeName): Prepared<F> {
  if (payload === undefined) return { kind: "absent" };
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { kind: "invalid", issues: [`"${format}" must be a JSON object`] };
  const result = exportSchemas[format].safeParse({ ...payload, theme });
  if (!result.success) return { kind: "invalid", issues: result.error.issues.slice(0, 4).map(describeIssue).concat(result.error.issues.length > 4 ? [`…and ${result.error.issues.length - 4} more`] : []) };
  const body = JSON.stringify(result.data);
  const bytes = new Blob([body]).size; // UTF-8 byte length, as jsonBody() counts it
  if (bytes > requestLimits[format]) return { kind: "invalid", issues: [`${Math.ceil(bytes / 1000)} KB is over the ${requestLimits[format] / 1000} KB limit for this format`] };
  return { kind: "ready", data: result.data as Outputs[F], body };
}

function parseBundle(text: string): { error: string } | { value: Record<string, unknown>; notice: string | null } {
  if (!text.trim()) return { error: "Paste a JSON bundle: { \"notebook\": {…} }." };
  let value: unknown;
  try { value = JSON.parse(text); } catch (error) { return { error: `Invalid JSON: ${error instanceof Error ? error.message : "parse error"}` }; }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "The bundle must be a JSON object with a notebook key." };
  const unknown = Object.keys(value).filter(key => !FORMATS.includes(key as ExportFormat));
  const record = value as Record<string, unknown>;
  if (FORMATS.every(format => record[format] === undefined)) return { error: "The bundle has no notebook key." };
  return { value: record, notice: unknown.length ? `Ignored unknown key${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}` : null };
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

class ExportError extends Error {
  constructor(public code: string) { super(code); }
}

function themeVars(theme: ArtisticTheme): CSSProperties {
  const c = (hex: string) => `#${hex}`;
  return {
    "--t-bg": c(theme.background), "--t-surface": c(theme.surface), "--t-text": c(theme.text), "--t-muted": c(theme.muted),
    "--t-accent": c(theme.accent), "--t-accent2": c(theme.accent2), "--t-rule": c(theme.rule),
    "--t-code-bg": c(theme.codeBackground), "--t-code": c(theme.codeText),
    "--t-definition-bg": c(theme.callouts.definition.background), "--t-definition": c(theme.callouts.definition.label),
    "--t-takeaway-bg": c(theme.callouts.takeaway.background), "--t-takeaway": c(theme.callouts.takeaway.label),
    "--t-warning-bg": c(theme.callouts.warning.background), "--t-warning": c(theme.callouts.warning.label),
    "--t-recall-bg": c(theme.callouts.recall.background), "--t-recall": c(theme.callouts.recall.label),
  } as CSSProperties;
}

/* ------------------------------------------------------------ Preview -- */

function NotebookPreview({ data }: { data: NotebookRequest }) {
  const code = data.sections.flatMap(section => section.code)[0]?.source ?? data.setup ?? "quiz()";
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[3px] bg-white text-left shadow-xl shadow-black/40">
      <div className="flex items-center gap-[3px] border-b border-zinc-200 bg-zinc-100 px-[6px] py-[4px]"><i className="block size-[4px] rounded-full bg-(--t-accent)" /><span className="truncate text-[6px] font-semibold text-zinc-800"><ExpandedText text={`${plainInline(data.title)}.ipynb`} /></span></div>
      <div className="flex flex-1 flex-col gap-[4px] p-[6px]">
        <div className="border-l-2 border-(--t-accent) pl-[4px]"><p className="line-clamp-1 text-[8px] font-bold text-zinc-900"><ExpandedText text={plainInline(data.title)} /></p><p className="text-[5px] text-zinc-700">⚡ The 60-second preview</p></div>
        <div className="flex gap-[3px]"><span className="shrink-0 font-mono text-[5px] text-blue-800">In [ ]:</span><pre className="flex-1 overflow-hidden rounded-[2px] border border-zinc-200 bg-zinc-50 p-[3px] font-mono text-[5px] leading-[1.35] text-zinc-900">{code.split("\n").slice(0, 4).join("\n")}</pre></div>
        <div className="rounded-[2px] bg-zinc-100 px-[4px] py-[2px] text-[5px] text-zinc-800">🧠 Q1 · ▸ Reveal answer</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Component -- */

export function NotesExporter() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("markup");
  const [title, setTitle] = useState("Gradient descent in 10 minutes");
  const [subtitle, setSubtitle] = useState("From loss landscapes to the update rule, with a runnable example");
  const [markup, setMarkup] = useState(SAMPLE_MARKUP);
  const [json, setJson] = useState("");
  const [theme, setTheme] = useState<ArtisticThemeName>("retro-cyberpunk");
  const [statuses, setStatuses] = useState<Record<ExportFormat, Status>>({ notebook: { state: "idle" } });
  const controllers = useRef<Partial<Record<ExportFormat, AbortController>>>({});
  const tabs = useRef<Record<Mode, HTMLButtonElement | null>>({ markup: null, json: null });

  useEffect(() => {
    const active = controllers.current;
    return () => { for (const controller of Object.values(active)) controller?.abort(); };
  }, []);

  const derived = useMemo(() => {
    if (mode === "markup") {
      const payloads = markupToPayloads(markup, { title: title.trim(), subtitle: subtitle.trim() || undefined, theme });
      return { notice: null as string | null, bundleError: null as string | null, notebook: prepare("notebook", payloads.notebook, theme) };
    }
    const bundle = parseBundle(json);
    if ("error" in bundle) {
      const blocked = { kind: "invalid" as const, issues: ["Fix the JSON bundle first"] };
      return { notice: null, bundleError: bundle.error, notebook: blocked };
    }
    return { notice: bundle.notice, bundleError: null, notebook: prepare("notebook", bundle.value.notebook, theme) };
  }, [mode, markup, title, subtitle, json, theme]);

  const setStatus = (format: ExportFormat, status: Status) => setStatuses(current => ({ ...current, [format]: status }));

  function selectMode(next: Mode, focus = false) {
    if (next === "json" && !json.trim()) {
      const payloads = markupToPayloads(markup, { title: title.trim(), subtitle: subtitle.trim() || undefined, theme });
      setJson(JSON.stringify(payloads, null, 2));
    }
    setMode(next);
    if (focus) tabs.current[next]?.focus();
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const order: Mode[] = ["markup", "json"];
    const index = order.indexOf(mode);
    const target = event.key === "ArrowRight" ? order[(index + 1) % order.length]
      : event.key === "ArrowLeft" ? order[(index + order.length - 1) % order.length]
      : event.key === "Home" ? order[0]
      : event.key === "End" ? order[order.length - 1]
      : null;
    if (!target) return;
    event.preventDefault();
    selectMode(target, true);
  }

  async function download(format: ExportFormat) {
    const prepared = derived[format];
    if (prepared.kind !== "ready") return;
    controllers.current[format]?.abort();
    const controller = new AbortController();
    controllers.current[format] = controller;
    const { body, data } = prepared;
    setStatus(format, { state: "loading" });
    try {
      const response = await fetch(`/api/generate/${format}`, { method: "POST", headers: { "Content-Type": "application/json" }, body, credentials: "same-origin", signal: controller.signal });
      if (!response.ok) {
        const code = await response.json().then((payload: { error?: unknown }) => (typeof payload?.error === "string" ? payload.error : null), () => null);
        throw new ExportError(code ?? "service_error");
      }
      const blob = await response.blob();
      const filename = filenameFromDisposition(response.headers.get("content-disposition")) ?? downloadFilename(data.title, format);
      saveBlob(blob, filename);
      setStatus(format, { state: "success", filename, body });
    } catch (error) {
      if (controller.signal.aborted) return;
      const code = error instanceof ExportError ? error.code : "network";
      setStatus(format, { state: "error", message: EXPORT_ERROR_MESSAGES[code] ?? EXPORT_ERROR_MESSAGES.service_error, body });
    } finally {
      if (controllers.current[format] === controller) delete controllers.current[format];
    }
  }

  const activeTheme = artisticThemes[theme];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-10 flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-fuchsia-300">Internal tool · Artistic notes</p>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Notes exporter</h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-300">Paste raw notes, pick a theme, and export a runnable Jupyter notebook. The payload is checked against the endpoint schema before it is sent.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section aria-labelledby={`${id}-content`} className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id={`${id}-content`} className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Content</h2>
            <div role="tablist" aria-label="Input format" className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
              {(["markup", "json"] as const).map(option => (
                <button
                  key={option}
                  ref={element => { tabs.current[option] = element; }}
                  id={`${id}-tab-${option}`}
                  type="button"
                  role="tab"
                  aria-selected={mode === option}
                  aria-controls={`${id}-panel-${option}`}
                  tabIndex={mode === option ? 0 : -1}
                  onClick={() => selectMode(option)}
                  onKeyDown={onTabKeyDown}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === option ? "bg-white text-zinc-950" : "text-zinc-300 hover:text-white"}`}
                >
                  <ExpandedText text={option === "markup" ? "Quick markup" : "JSON payloads"} />
                </button>
              ))}
            </div>
          </div>

          <div role="tabpanel" id={`${id}-panel-markup`} aria-labelledby={`${id}-tab-markup`} hidden={mode !== "markup"} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${id}-title`} label="Title">
                <Input id={`${id}-title`} value={title} onChange={event => setTitle(event.target.value)} maxLength={120} required className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-zinc-400 focus:border-white/40" placeholder="What is this about?" />
              </Field>
              <Field id={`${id}-subtitle`} label="Subtitle" hint="optional">
                <Input id={`${id}-subtitle`} value={subtitle} onChange={event => setSubtitle(event.target.value)} maxLength={160} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-zinc-400 focus:border-white/40" placeholder="One line of context" />
              </Field>
            </div>
            <Field id={`${id}-markup`} label="Raw notes" hint="quick markup" mono>
              <Textarea id={`${id}-markup`} value={markup} onChange={event => setMarkup(event.target.value)} rows={20} aria-describedby={`${id}-markup-help`} className="block min-h-72 w-full resize-y rounded-xl border border-white/10 bg-black/40 p-4 text-zinc-100 placeholder:text-zinc-400 focus:border-white/40" placeholder="# First concept&#10;Def: Term = meaning&#10;Key: The one thing to remember&#10;Q: A question&#10;A: Its answer" />
            </Field>
            <p id={`${id}-markup-help`} className="-mt-2 text-xs leading-5 text-zinc-300"># starts a section; prefix lines with Def:, Key:, Warn:, Q: and A:. Full syntax in the cheat sheet below.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setMarkup(SAMPLE_MARKUP); setTitle("Gradient descent in 10 minutes"); setSubtitle("From loss landscapes to the update rule, with a runnable example"); }} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10">Load sample</button>
              <button type="button" onClick={() => setMarkup("")} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10">Clear</button>
            </div>
            <details className="group rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-zinc-300">
              <summary className="cursor-pointer select-none font-semibold text-zinc-100">Markup cheat sheet</summary>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono">
                {[
                  ["# Heading", "new section"],
                  ["TL;DR: …", "spaced-summary line"],
                  ["Def: Term = meaning", "definition (next line e.g. … adds an example)"],
                  ["Key: …", "bold key takeaway"],
                  ["Warn: …", "common trap"],
                  ["Q: … / A: …", "active-recall prompt and answer"],
                  ["$$ \\frac{a}{b} $$", "LaTeX formula"],
                  ["Formula: E = mc²", "plain Unicode formula"],
                  ["- item", "bullet"],
                  ["```python … ```", "code (python becomes notebook cells)"],
                  ["**bold**  `code`", "inline emphasis"],
                ].map(([syntax, meaning]) => <div key={syntax} className="contents"><dt className="text-fuchsia-200"><ExpandedText text={syntax} /></dt><dd className="font-sans text-zinc-300"><ExpandedText text={meaning} /></dd></div>)}
              </dl>
            </details>
          </div>

          <div role="tabpanel" id={`${id}-panel-json`} aria-labelledby={`${id}-tab-json`} hidden={mode !== "json"} className="flex flex-col gap-3">
            <Field id={`${id}-json`} label="JSON bundle" hint="notebook" mono>
              <Textarea id={`${id}-json`} value={json} onChange={event => setJson(event.target.value)} rows={24} spellCheck={false} aria-describedby={`${id}-json-help`} aria-invalid={Boolean(derived.bundleError)} className="block min-h-80 w-full resize-y rounded-xl border border-white/10 bg-black/40 p-4 text-zinc-100 focus:border-white/40" />
            </Field>
            <p id={`${id}-json-help`} className="text-xs leading-5 text-zinc-300">Paste what the <code className="rounded bg-white/10 px-1 font-mono text-fuchsia-200">artistic-notes-generator</code> skill outputs. The theme picker overrides the payload&apos;s <code className="rounded bg-white/10 px-1 font-mono">theme</code>.</p>
            {derived.bundleError && <p role="alert" className="flex items-start gap-2 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100"><TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden /><ExpandedText text={derived.bundleError} /></p>}
            {derived.notice && <p className="text-xs text-zinc-300"><ExpandedText text={derived.notice} /></p>}
            <div><button type="button" onClick={() => setJson(JSON.stringify(markupToPayloads(markup, { title: title.trim(), subtitle: subtitle.trim() || undefined, theme }), null, 2))} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10">Regenerate from markup</button></div>
          </div>
        </section>

        <section aria-labelledby={`${id}-exports`} className="flex min-w-0 flex-col gap-6">
          <fieldset className="min-w-0">
            <legend><span className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Theme</span></legend>
            <RadioGroup aria-label="Color theme" value={theme} onValueChange={value=>setTheme(value as typeof theme)} className="grid gap-2.5 sm:grid-cols-2">
              {themeNames.map(name => {
                const option = artisticThemes[name];
                return (
                  <Label key={name} className="relative cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/30 has-[:checked]:border-white has-[:checked]:bg-white/[0.08] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-fuchsia-300">
                    <RadioGroupItem value={name} className="sr-only" />
                    <span className="flex items-center gap-3">
                      <span aria-hidden className="flex h-10 w-14 shrink-0 flex-col justify-between overflow-hidden rounded-md p-1.5 ring-1 ring-white/15" style={{ background: `#${option.background}` }}>
                        <i className="block h-1 w-full rounded-full" style={{ background: `#${option.text}` }} />
                        <span className="flex gap-1"><i className="block size-2 rounded-full" style={{ background: `#${option.accent}` }} /><i className="block size-2 rounded-full" style={{ background: `#${option.accent2}` }} /><i className="block size-2 rounded-full" style={{ background: `#${option.callouts.takeaway.label}` }} /></span>
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-white"><ExpandedText text={option.label} /></span>
                        <span className="text-xs font-normal leading-4 text-zinc-300"><ExpandedText text={option.description} /></span>
                      </span>
                      {theme === name && <Check className="ml-auto size-4 shrink-0 text-white" aria-hidden />}
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          </fieldset>

          <div className="flex flex-col gap-4">
            <h2 id={`${id}-exports`} className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Exports</h2>
            {FORMATS.map(format => (
              <ExportCard key={format} format={format} prepared={derived[format]} status={statuses[format]} theme={activeTheme} idBase={`${id}-${format}`} onDownload={() => void download(format)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default NotesExporter;

function Field({ id, label, hint, mono = false, children }: { id: string; label: string; hint?: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>
        <span className="text-xs font-semibold text-zinc-100"><ExpandedText text={label} /></span>
        {hint && <span className="ml-2 text-xs font-normal text-zinc-400"><ExpandedText text={hint} /></span>}
      </Label>
      {/* Inputs inherit their font (globals.css sets font: inherit), so size it here. */}
      <div className={mono ? "font-mono text-[13px] leading-6" : "text-sm"}>{children}</div>
    </div>
  );
}

function ExportCard({ format, prepared, status, theme, idBase, onDownload }: { format: ExportFormat; prepared: Prepared<ExportFormat>; status: Status; theme: ArtisticTheme; idBase: string; onDownload: () => void }) {
  const meta = FORMAT_META[format];
  const ready = prepared.kind === "ready";
  const loading = status.state === "loading";
  // A result only describes the content it was produced from.
  const current = status.state === "success" || status.state === "error" ? (ready && prepared.body === status.body ? status : null) : status.state === "loading" ? status : null;

  let summary = "";
  let preview: ReactNode = null;
  if (prepared.kind === "ready") {
    const data = prepared.data as NotebookRequest;
    const cells = buildNotebook(data).cells;
    const code = cells.filter(cell => cell.cell_type === "code").length;
    summary = `nbformat 4.5 · Python 3 · ${cells.length} cells · ${code} runnable`;
    preview = <NotebookPreview data={data} />;
  }

  return (
    <article aria-labelledby={`${idBase}-name`} aria-describedby={`${idBase}-summary`} className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <div aria-hidden className="grid h-44 place-items-center rounded-xl bg-black/40 p-3 ring-1 ring-white/5 sm:h-full sm:min-h-44" style={themeVars(theme)}>
        {preview ?? <meta.Icon className="size-8 text-zinc-500" />}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-zinc-100"><ExpandedText text={meta.badge} /></span>
          <h3 id={`${idBase}-name`} className="text-base font-semibold text-white"><ExpandedText text={meta.name} /></h3>
        </div>
        <p id={`${idBase}-summary`} className="text-xs leading-5 text-zinc-300">
          <ExpandedText text={prepared.kind === "ready" ? summary : prepared.kind === "absent" ? "Not in this bundle: add a \"" + format + "\" key to export it." : "Fix these before exporting:"} />
        </p>
        {prepared.kind === "invalid" && (
          <ul className="flex flex-col gap-1 text-xs leading-5 text-amber-200">
            {prepared.issues.map(issue => <li key={issue} className="flex gap-1.5"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /><span className="min-w-0 break-words"><ExpandedText text={issue} /></span></li>)}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
          <button type="button" onClick={onDownload} disabled={!ready || loading} aria-busy={loading} aria-describedby={`${idBase}-status`} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
            {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
            <ExpandedText text={loading ? "Building…" : `Download ${meta.extension}`} />
          </button>
          <p id={`${idBase}-status`} role="status" aria-live="polite" className="min-w-0 text-xs text-zinc-300">
            {current?.state === "loading" && "Building on the server…"}
            {current?.state === "success" && <span className="inline-flex items-center gap-1.5 text-emerald-300"><Check className="size-3.5" aria-hidden />Saved <ExpandedText text={current.filename} /></span>}
          </p>
        </div>
        {current?.state === "error" && <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs leading-5 text-rose-100"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /><ExpandedText text={current.message} /></p>}
      </div>
    </article>
  );
}
