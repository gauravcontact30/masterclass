"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Camera, Check, CircleDot, Copy, GraduationCap, Link2, MessageCircle, PenLine, Pencil, Pin, PlayCircle, Plus, Search, Send, ThumbsUp, Trash2, AtSign, type LucideIcon } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Card } from "./ui/card";
import { AdminTable } from "./super-admin-table";
import { DEFAULT_FORMAT, LINK_HINT, PLATFORMS, PLATFORM_LABEL, PLATFORM_METRICS, PROMOTION_FORMATS, PROMOTION_STATUSES, campaignSlug, derivedRates, hasPlatformMetrics, utmLink, type Attribution, type MetricKey, type Platform, type PlatformStats, type Promotion, type PromotionFormat } from "@/lib/promotions";
import { SuperAdminDailySocial } from "./super-admin-daily-social";
import { SuperAdminOverallVisitors } from "./super-admin-overall-visitors";
import { SuperAdminSearchConsole } from "./super-admin-search-console";
import styles from "./super-admin-promotions.module.css";

type Data = Attribution & { promotions: Promotion[]; days: number; capped: boolean; generatedAt: string; retentionDays: number };
export const PLATFORM_ICON: Record<Platform, LucideIcon> = { instagram: Camera, facebook: ThumbsUp, linkedin: Briefcase, telegram: Send, medium: PenLine, pinterest: Pin, coursera: GraduationCap, youtube: PlayCircle, x: AtSign, whatsapp: MessageCircle, google_search: Search, other: CircleDot };
/** Validated categorical palette (dataviz default order); stacking order follows it, so colour follows the platform. */
const PLATFORM_COLOR: Record<Platform, string> = { facebook: "#2a78d6", instagram: "#eb6834", telegram: "#1baf7a", linkedin: "#eda100", x: "#e87ba4", whatsapp: "#008300", other: "#6250d6", youtube: "#e34948", medium: "#3d3d3a", pinterest: "#a3176a", coursera: "#00838f", google_search: "#4285f4" };
const STACK: readonly Platform[] = PLATFORMS;
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const num = (n: number) => n.toLocaleString("en-IN");
const pct = (n: number | null) => n === null ? "—" : `${(n * 100).toFixed(n < 0.1 ? 2 : 1)}%`;
const blank = { platform: "instagram" as Platform, title: "", format: "post" as PromotionFormat, status: "planned", url: "", utm_campaign: "", audience: "", owner: "", starts_on: "", ends_on: "", budget_inr: 0, spend_inr: 0, reach: 0, impressions: 0, engagements: 0, followers_gained: 0, notes: "", platform_metrics: {} as Partial<Record<MetricKey, number>> };
/** A platform figure as the platform shows it: money in rupees, a rating to one decimal, counts grouped. */
function metricValue(platform: Platform, key: MetricKey, value: number | undefined) {
  if (value === undefined) return "—";
  const def = hasPlatformMetrics(platform) ? PLATFORM_METRICS[platform].find(item => item.key === key) : undefined;
  if (key === "earnings_inr") return money(value);
  return def && "decimals" in def ? value.toFixed(def.decimals) : num(value);
}
type Draft = typeof blank & { id?: string };

/**
 * Promotional Tracking: how Instagram, Facebook, LinkedIn, Telegram, Medium, Pinterest, Coursera and other platforms bring people to the site.
 * Real traffic comes from site_visits (UTM tags and referrers), outcomes from new accounts and paid memberships,
 * and the platform-reported figures (reach, impressions, spend) from the promotions an admin registers here.
 */
export function SuperAdminPromotions({ days, query }: Readonly<{ days: number; query: string }>) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const load = useCallback(async (signal?: AbortSignal) => {
    const version = ++requestVersion.current;
    try {
      const response = await fetch(`/api/super-admin/promotions?days=${days}`, { cache: "no-store", signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error === "migration_required" ? "Apply the promotional tracking migrations through 0047_promotions_google_search.sql." : "Promotional tracking is unavailable right now.");
      if (!signal?.aborted && version === requestVersion.current) { setData(body); setError(""); }
    } catch (e) { if (!signal?.aborted && version === requestVersion.current) setError(e instanceof Error ? e.message : "Unable to load promotions."); }
  }, [days]);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const run = async () => {
      if (pending || controller.signal.aborted || document.visibilityState === "hidden") return;
      pending = true; await load(controller.signal); pending = false;
    };
    queueMicrotask(() => void run());
    const timer = setInterval(() => void run(), 30_000);
    const visible = () => { void run(); };
    document.addEventListener("visibilitychange", visible);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [load]);

  async function save() {
    if (!draft) return;
    setSaving(true); setError("");
    const { id, ...fields } = draft;
    const { platform_metrics: metrics, ...rest } = fields;
    const payload: Record<string, unknown> = Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, value === "" ? null : value]));
    payload.platform_metrics = hasPlatformMetrics(draft.platform) ? Object.fromEntries(PLATFORM_METRICS[draft.platform].map(def => [def.key, metrics?.[def.key as MetricKey]]).filter(([, value]) => typeof value === "number" && Number.isFinite(value))) : {};
    try {
      const response = await fetch("/api/super-admin/promotions", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id, ...payload } : payload) });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error === "invalid_request" ? "Check the fields: title, campaign and a valid https link are required." : body.error === "promotions_window" ? "The end date must be on or after the start date." : body.error === "migration_required" ? "Apply the promotional tracking migrations through 0047_promotions_google_search.sql." : body.error === "invalid_platform_metrics" ? "The entered figures do not belong to the selected platform." : "The promotion could not be saved."); }
      setDraft(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "The promotion could not be saved."); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    try {
    const response = await fetch(`/api/super-admin/promotions?id=${id}`, { method: "DELETE" });
    setConfirm(null);
    if (!response.ok) setError("The promotion could not be deleted."); else await load();
    } catch { setError("The promotion could not be deleted. Check your connection and try again."); }
  }

  const promotionRows = useMemo(() => (data?.promotions ?? []).map(item => ({ ...item, platform_name: PLATFORM_LABEL[item.platform], cost_per_visit: "",
    platform_figures: hasPlatformMetrics(item.platform) ? PLATFORM_METRICS[item.platform].filter(def => item.platform_metrics?.[def.key as MetricKey] !== undefined).map(def => `${def.label.replace(/ \(.*\)$/, "")} ${metricValue(item.platform, def.key as MetricKey, item.platform_metrics?.[def.key as MetricKey])}`).join(" · ") || "—" : "—" })), [data]);
  const campaignRows = useMemo(() => (data?.campaigns ?? []).map(item => ({ ...item, conversion: item.visitors ? `${((item.signups / item.visitors) * 100).toFixed(1)}%` : "—", spend_label: item.spend ? money(item.spend) : "—", cost_per_signup: item.costPerSignup ? money(item.costPerSignup) : "—" })), [data]);
  const landingRows = useMemo(() => (data?.landingPages ?? []).map(item => ({ ...item, platform_name: PLATFORM_LABEL[item.platform] })), [data]);

  return <div className={styles.page}>
    <SuperAdminDailySocial query={query} />
    <SuperAdminOverallVisitors query={query} />
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {(!data || data.days !== days) && !error && <p className={styles.loading} role="status">Loading promotional tracking…</p>}
    {data && data.days === days && <>
      <section aria-labelledby="promo-funnel" className={styles.kpis}>
        <h2 id="promo-funnel" className={styles.srOnly}>Platform funnel</h2>
        {[["Platform page views", num(data.totals.visits), `Recorded traffic in the selected ${data.days}-day window`], ["Unique visitors", num(data.totals.visitors), "Browsers deduplicated across platforms"], ["New accounts observed", num(data.totals.signups), "Accounts created in this window and observed via a platform"], ["Active members", num(data.totals.members), "Of those accounts, with an unexpired active membership"], ["Registered spend", money(data.totals.spend), "Manually entered totals; may cover a different period"], ["Sessions", num(data.totals.sessions), "Distinct recorded browser sessions"]].map(([label, value, note]) =>
          <Card key={label} className={styles.kpi}><span>{label}</span><strong>{value}</strong><small>{note}</small></Card>)}
      </section>

      <section aria-labelledby="promo-platforms">
        <h2 id="promo-platforms" className={styles.heading}>Platforms</h2>
        <p className={styles.note} role="status">Website traffic refreshes every 30 seconds while visible. Last successful refresh: {new Date(data.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST.{error && " Refresh failed; figures below may be stale."}</p>
        <p className={styles.note}>Visits are measured on this website using UTM links and referrers. Retention is {data.retentionDays} days, even when a longer window is selected. Platform reach, impressions, engagements and spend are manually entered promotion totals, not live platform API data. Missing referrals cannot be reconstructed.</p>
        <div className={styles.platforms}>{data.platforms.map(item => { const Icon = PLATFORM_ICON[item.platform]; return <Card key={item.platform} className={styles.platform} style={{ "--brand": PLATFORM_COLOR[item.platform] } as React.CSSProperties}>
          <header><span className={styles.platformIcon} aria-hidden="true"><Icon size={18} /></span><b>{PLATFORM_LABEL[item.platform]}</b><span className={styles.live}>{item.live} marked live · {item.promotions} promotions</span></header>
          <dl>
            <div><dt>Website page views</dt><dd>{num(item.visits)}</dd></div><div><dt>Unique browsers</dt><dd>{num(item.visitors)}</dd></div>
            <div><dt>New accounts observed</dt><dd>{num(item.signups)}</dd></div><div><dt>Active members</dt><dd>{num(item.members)}</dd></div>
            <div><dt>Entered reach total</dt><dd>{item.promotions ? num(item.reach) : "Not entered"}</dd></div><div><dt>Entered engagements</dt><dd>{item.promotions ? num(item.engagements) : "Not entered"}</dd></div>
            <div><dt>Entered spend</dt><dd>{item.promotions ? money(item.spend) : "Not entered"}</dd></div><div><dt>Website sessions</dt><dd>{num(item.sessions)}</dd></div>
            {item.followers > 0 && <div><dt>Followers gained</dt><dd>{num(item.followers)}</dd></div>}
          </dl>
          <p className={styles.note}>{item.lastSeen ? `Last recorded view: ${new Date(item.lastSeen).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST.` : "No attributed visits recorded in this window; this does not verify the integration is working."}</p>
          <dl><div><dt>UTM-attributed views</dt><dd>{num(item.taggedViews)}</dd></div><div><dt>Referrer-attributed views</dt><dd>{num(item.referrerViews)}</dd></div><div><dt>Tagged paid views</dt><dd>{num(item.paidTaggedViews)}</dd></div><div><dt>Tagged organic views</dt><dd>{num(item.organicTaggedViews)}</dd></div><div><dt>Entered impressions</dt><dd>{item.promotions ? num(item.impressions) : "Not entered"}</dd></div></dl>
          {LINK_HINT[item.platform] && <p className={styles.note}>{LINK_HINT[item.platform]}</p>}
          {item.platform === "google_search" && <p className={styles.note}>A Google referrer alone cannot prove organic versus paid traffic or reveal a search query. Tagged paid/organic views are subsets of UTM-attributed views.</p>}
          <PlatformAnalytics stats={item} />
        </Card>; })}</div>
      </section>

      <DailyChart data={data} />

      <AdminTable title="Registered promotions" rows={promotionRows} query={query} empty="No promotions yet. Add one to start tracking its campaign."
        actions={<button type="button" className={styles.primary} onClick={() => setDraft({ ...blank })}><Plus size={15} aria-hidden="true" />Add promotion</button>}
        note="Each promotion's link should carry its utm_campaign (use the link builder below); visits, sign-ups and members then appear in Campaign performance."
        columns={[
          { key: "platform", label: "Platform", render: row => { const p = row.platform as Platform; const Icon = PLATFORM_ICON[p]; return <span className={styles.platformCell}><Icon size={14} aria-hidden="true" style={{ color: PLATFORM_COLOR[p] }} />{PLATFORM_LABEL[p]}</span>; } },
          { key: "title", label: "Promotion" }, "format", { key: "status", render: row => <span className={styles.status} data-status={String(row.status)}>{String(row.status)}</span> },
          { key: "utm_campaign", label: "Campaign" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" },
          { key: "reach", label: "Reach", filter: false }, { key: "impressions", label: "Impressions", filter: false }, { key: "engagements", label: "Engagements", filter: false },
          { key: "spend_inr", label: "Spend", filter: false, render: row => money(Number(row.spend_inr)) },
          { key: "platform_figures", label: "Platform figures", filter: false, sort: false },
          { key: "url", label: "Link", filter: false, sort: false, render: row => row.url ? <a href={String(row.url)} target="_blank" rel="noopener noreferrer" className={styles.link}>Open</a> : "—" },
          { key: "id", label: "Actions", filter: false, sort: false, render: row => confirm === row.id
            ? <span className={styles.rowActions}><button type="button" className={styles.danger} onClick={() => void remove(String(row.id))}>Delete</button><button type="button" onClick={() => setConfirm(null)}>Keep</button></span>
            : <span className={styles.rowActions}><button type="button" aria-label={`Edit ${String(row.title)}`} title="Edit" onClick={() => setDraft({ ...blank, ...Object.fromEntries(Object.entries(row).filter(([key]) => key in blank || key === "id").map(([key, value]) => [key, value ?? (key === "platform_metrics" ? {} : "")])) } as Draft)}><Pencil size={14} /></button><button type="button" aria-label={`Delete ${String(row.title)}`} title="Delete" onClick={() => setConfirm(String(row.id))}><Trash2 size={14} /></button></span> },
        ]} />

      {draft && <PromotionForm draft={draft} saving={saving} onChange={setDraft} onCancel={() => setDraft(null)} onSave={() => void save()} />}

      <AdminTable title="Campaign performance" rows={campaignRows} query={query} empty="No campaign traffic in this window. Share a tracked link from the builder below."
        note="Matched on utm_campaign. Campaigns marked 'untracked' brought traffic but are not registered as a promotion yet."
        columns={[{ key: "campaign", label: "Campaign" }, { key: "platform", label: "Platform" }, { key: "title", label: "Promotion" }, "status", { key: "visits", filter: false }, { key: "visitors", filter: false }, { key: "signups", label: "Sign-ups", filter: false }, { key: "members", filter: false }, { key: "conversion", label: "Visitor → sign-up", filter: false }, { key: "spend_label", label: "Spend", filter: false }, { key: "cost_per_signup", label: "Cost / sign-up", filter: false }]} />

      <AdminTable title="Top landing pages from platforms" rows={landingRows} query={query} empty="No platform traffic in this window."
        columns={[{ key: "path", label: "Page" }, { key: "platform", label: "Platform" }, { key: "visits", label: "Sessions started", filter: false }, { key: "visitors", filter: false }]} />

      <LinkBuilder />
    </>}
    <SuperAdminSearchConsole days={days} query={query} />
  </div>;
}

/** Visits per day stacked by platform, with a legend, a tooltip per bar and a table view of the same numbers. */
function DailyChart({ data }: Readonly<{ data: Data }>) {
  const [asTable, setAsTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const series = STACK.filter(platform => data.daily.some(point => point[platform] > 0));
  const totals = data.daily.map(point => series.reduce((sum, platform) => sum + point[platform], 0));
  const max = Math.max(1, ...totals);
  return <Card className={styles.chartCard}>
    <header className={styles.chartHead}><h2 className={styles.heading}>Platform page views per day</h2>
      {data.daily.length > 0 && <div className={styles.toggle} role="group" aria-label="View"><button type="button" aria-pressed={!asTable} onClick={() => setAsTable(false)}>Chart</button><button type="button" aria-pressed={asTable} onClick={() => setAsTable(true)}>Table</button></div>}
    </header>
    {data.daily.length === 0 ? <p className={styles.loading}>No platform visits in this window yet.</p> : <>
      {series.length > 1 && <ul className={styles.legend}>{series.map(platform => <li key={platform}><i style={{ background: PLATFORM_COLOR[platform] }} aria-hidden="true" />{PLATFORM_LABEL[platform]}</li>)}</ul>}
      {asTable ? <div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th scope="col">Day</th>{series.map(platform => <th key={platform} scope="col">{PLATFORM_LABEL[platform]}</th>)}<th scope="col">Total</th></tr></thead>
        <tbody>{data.daily.map((point, i) => <tr key={point.day}><th scope="row">{point.day}</th>{series.map(platform => <td key={platform}>{point[platform]}</td>)}<td>{totals[i]}</td></tr>)}</tbody></table></div>
        : <div className={styles.chart} role="img" aria-label={`Platform page views per day for ${data.daily.length} days, peaking at ${max}. Switch to Table for the numbers.`} onMouseLeave={() => setHover(null)}>
          <span className={styles.axisMax} aria-hidden="true">{max}</span>
          <div className={styles.bars}>{data.daily.map((point, i) => <div key={point.day} className={styles.barSlot} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${point.day}: ${totals[i]} visits`}>
            <div className={styles.bar} style={{ height: `${(totals[i] / max) * 100}%` }}>{series.filter(platform => point[platform] > 0).map(platform => <span key={platform} style={{ flexGrow: point[platform], background: PLATFORM_COLOR[platform] }} />)}</div>
            {hover === i && <div className={styles.tooltip} role="tooltip"><b>{point.day}</b>{series.filter(platform => point[platform] > 0).map(platform => <span key={platform}><i style={{ background: PLATFORM_COLOR[platform] }} aria-hidden="true" />{PLATFORM_LABEL[platform]} {point[platform]}</span>)}<span>Total {totals[i]}</span></div>}
          </div>)}</div>
          <div className={styles.axisDays} aria-hidden="true"><span>{data.daily[0].day}</span><span>{data.daily.at(-1)!.day}</span></div>
        </div>}
    </>}
  </Card>;
}

/** Medium, Pinterest and Coursera report figures no other platform has; their cards show them with the headline rates. */
function PlatformAnalytics({ stats }: Readonly<{ stats: PlatformStats }>) {
  if (!hasPlatformMetrics(stats.platform)) return null;
  const rates = derivedRates(stats.platform, stats.metrics, stats.impressions);
  return <div className={styles.analytics}>
    <h3>{PLATFORM_LABEL[stats.platform]} figures (manual)</h3>
    <dl>
      {PLATFORM_METRICS[stats.platform].map(def => <div key={def.key}><dt>{def.label}</dt><dd>{metricValue(stats.platform, def.key as MetricKey, stats.metrics[def.key as MetricKey])}</dd></div>)}
      {stats.platform === "pinterest" && <div><dt>Impressions</dt><dd>{num(stats.impressions)}</dd></div>}
      {rates.map(rate => <div key={rate.label} title={rate.hint}><dt>{rate.label}</dt><dd>{rate.label === "Claps per read" ? rate.value === null ? "?" : rate.value.toFixed(2) : pct(rate.value)}</dd></div>)}
    </dl>
    {stats.promotions === 0 && <p>Add a {PLATFORM_LABEL[stats.platform]} promotion and enter its figures from {stats.platform === "coursera" ? "the instructor dashboard" : `${PLATFORM_LABEL[stats.platform]} analytics`}.</p>}
  </div>;
}

function PromotionForm({ draft, saving, onChange, onCancel, onSave }: Readonly<{ draft: Draft; saving: boolean; onChange: (draft: Draft) => void; onCancel: () => void; onSave: () => void }>) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => onChange({ ...draft, [key]: value });
  const field = (key: keyof Draft, label: string, type: "text" | "number" | "date" | "url" = "text", wide = false) => <label className={wide ? styles.wide : undefined}><span>{label}</span>
    <input type={type} value={String(draft[key] ?? "")} min={type === "number" ? 0 : undefined} onChange={event => set(key, (type === "number" ? Number(event.target.value) : event.target.value) as never)} /></label>;
  return <Card className={styles.form}>
    <form onSubmit={event => { event.preventDefault(); onSave(); }} aria-label={draft.id ? "Edit promotion" : "Add promotion"}>
      <h2 className={styles.heading}>{draft.id ? "Edit promotion" : "Add promotion"}</h2>
      <div className={styles.grid}>
        <label><span>Platform</span><select value={draft.platform} onChange={event => { const platform = event.target.value as Platform; onChange({ ...draft, platform, format: DEFAULT_FORMAT[platform] ?? "post", platform_metrics: {} }); }}>{PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}</select></label>
        <label><span>Format</span><select value={draft.format} onChange={event => set("format", event.target.value as PromotionFormat)}>{PROMOTION_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}</select></label>
        <label><span>Status</span><select value={draft.status} onChange={event => set("status", event.target.value)}>{PROMOTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
        {field("title", "Title", "text", true)}
        <label><span>Campaign (utm_campaign)</span><input value={draft.utm_campaign} onChange={event => set("utm_campaign", campaignSlug(event.target.value))} placeholder="diwali-offer" required /></label>
        {field("url", "Post or ad link", "url", true)}
        {field("starts_on", "Starts", "date")}{field("ends_on", "Ends", "date")}{field("owner", "Owner")}
        {field("audience", "Audience", "text", true)}
        {field("budget_inr", "Budget (₹)", "number")}{field("spend_inr", "Spend (₹)", "number")}{field("reach", "Reach", "number")}
        {field("impressions", "Impressions", "number")}{field("engagements", "Engagements", "number")}{field("followers_gained", "Followers gained", "number")}
        <label className={styles.wide}><span>Notes</span><textarea rows={2} value={draft.notes} onChange={event => set("notes", event.target.value)} /></label>
      </div>
      {hasPlatformMetrics(draft.platform) && <fieldset className={styles.metricsSet}>
        <legend>{PLATFORM_LABEL[draft.platform]} figures</legend>
        {LINK_HINT[draft.platform] && <p className={styles.note}>{LINK_HINT[draft.platform]}</p>}
        <div className={styles.grid}>{PLATFORM_METRICS[draft.platform].map(def => { const key = def.key as MetricKey; const value = draft.platform_metrics?.[key]; return <label key={def.key}><span>{def.label}</span>
          <input type="number" inputMode="decimal" min={0} max={"max" in def ? def.max : undefined} step={"decimals" in def ? 1 / 10 ** def.decimals : 1} value={value ?? ""}
            onChange={event => { const next = { ...draft.platform_metrics }; if (event.target.value === "") delete next[key]; else next[key] = Number(event.target.value); set("platform_metrics", next); }} /></label>; })}</div>
      </fieldset>}
      <div className={styles.formActions}><button type="button" onClick={onCancel}>Cancel</button><button type="submit" className={styles.primary} disabled={saving || draft.title.trim().length < 3 || !draft.utm_campaign}>{saving ? "Saving…" : draft.id ? "Save changes" : "Add promotion"}</button></div>
    </form>
  </Card>;
}

/** Builds a tracked link so every visit from a promotion is attributed to its platform and campaign. */
function LinkBuilder() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [format, setFormat] = useState<PromotionFormat>("post");
  const [campaign, setCampaign] = useState("");
  const [base, setBase] = useState(() => typeof window === "undefined" ? "https://example.com/" : `${window.location.origin}/`);
  const [copied, setCopied] = useState(false);
  let link = "";
  try { link = campaign ? utmLink(base, platform, format, campaign) : ""; } catch { link = ""; }
  return <Card className={styles.builder}>
    <h2 className={styles.heading}><Link2 size={16} aria-hidden="true" />Tracked link builder</h2>
    <p className={styles.note}>Share this link in the post, bio, ad, channel, article, Pin or course. Visits arrive tagged with the platform and campaign above.</p>
    <div className={styles.grid}>
      <label><span>Platform</span><select value={platform} onChange={event => { const next = event.target.value as Platform; setPlatform(next); setFormat(DEFAULT_FORMAT[next] ?? "post"); }}>{PLATFORMS.filter(p => p !== "other").map(p => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}</select></label>
      <label><span>Format</span><select value={format} onChange={event => setFormat(event.target.value as PromotionFormat)}>{PROMOTION_FORMATS.filter(f => platform !== "google_search" || f === "ad").map(f => <option key={f} value={f}>{f}</option>)}</select></label>
      <label><span>Campaign</span><input value={campaign} onChange={event => setCampaign(event.target.value)} placeholder="e.g. react-interview-week" /></label>
      <label className={styles.wide}><span>Landing page</span><input type="url" value={base} onChange={event => setBase(event.target.value)} /></label>
    </div>
    {LINK_HINT[platform] && <p className={styles.note}>{LINK_HINT[platform]}</p>}
    <div className={styles.result}><code>{link || "Enter a campaign to build the link."}</code>
      <button type="button" disabled={!link} onClick={() => { void navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}>{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button>
    </div>
  </Card>;
}
