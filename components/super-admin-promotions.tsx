"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Camera, Check, CircleDot, Copy, Link2, MessageCircle, Pencil, PlayCircle, Plus, Send, ThumbsUp, Trash2, AtSign, type LucideIcon } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Card } from "./ui/card";
import { AdminTable } from "./super-admin-table";
import { PLATFORMS, PLATFORM_LABEL, PROMOTION_FORMATS, PROMOTION_STATUSES, campaignSlug, utmLink, type Attribution, type Platform, type Promotion, type PromotionFormat } from "@/lib/promotions";
import { SuperAdminDailySocial } from "./super-admin-daily-social";
import styles from "./super-admin-promotions.module.css";

type Data = Attribution & { promotions: Promotion[]; days: number; capped: boolean; generatedAt: string };
export const PLATFORM_ICON: Record<Platform, LucideIcon> = { instagram: Camera, facebook: ThumbsUp, linkedin: Briefcase, telegram: Send, youtube: PlayCircle, x: AtSign, whatsapp: MessageCircle, other: CircleDot };
/** Validated categorical palette (dataviz default order); stacking order follows it, so colour follows the platform. */
const PLATFORM_COLOR: Record<Platform, string> = { facebook: "#2a78d6", instagram: "#eb6834", telegram: "#1baf7a", linkedin: "#eda100", x: "#e87ba4", whatsapp: "#008300", other: "#6250d6", youtube: "#e34948" };
const STACK: Platform[] = ["facebook", "instagram", "telegram", "linkedin", "x", "whatsapp", "other", "youtube"];
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const num = (n: number) => n.toLocaleString("en-IN");
const blank = { platform: "instagram" as Platform, title: "", format: "post" as PromotionFormat, status: "planned", url: "", utm_campaign: "", audience: "", owner: "", starts_on: "", ends_on: "", budget_inr: 0, spend_inr: 0, reach: 0, impressions: 0, engagements: 0, followers_gained: 0, notes: "" };
type Draft = typeof blank & { id?: string };

/**
 * Promotional Tracking: how Instagram, Facebook, LinkedIn, Telegram and other platforms bring people to the site.
 * Real traffic comes from site_visits (UTM tags and referrers), outcomes from new accounts and paid memberships,
 * and the platform-reported figures (reach, impressions, spend) from the promotions an admin registers here.
 */
export function SuperAdminPromotions({ days, query }: Readonly<{ days: number; query: string }>) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/super-admin/promotions?days=${days}`, { cache: "no-store", signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error === "migration_required" ? "Apply migration 0024_promotions.sql to start tracking promotions." : "Promotional tracking is unavailable right now.");
      if (!signal?.aborted) { setData(body); setError(""); }
    } catch (e) { if (!signal?.aborted && !(e instanceof DOMException)) setError(e instanceof Error ? e.message : "Unable to load promotions."); }
  }, [days]);
  useEffect(() => { const controller = new AbortController(); queueMicrotask(() => void load(controller.signal)); return () => controller.abort(); }, [load]);

  async function save() {
    if (!draft) return;
    setSaving(true); setError("");
    const { id, ...fields } = draft;
    const payload = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value === "" ? null : value]));
    try {
      const response = await fetch("/api/super-admin/promotions", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id, ...payload } : payload) });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error === "invalid_request" ? "Check the fields: title, campaign and a valid https link are required." : body.error === "promotions_window" ? "The end date must be on or after the start date." : "The promotion could not be saved."); }
      setDraft(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "The promotion could not be saved."); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    const response = await fetch(`/api/super-admin/promotions?id=${id}`, { method: "DELETE" });
    setConfirm(null);
    if (!response.ok) setError("The promotion could not be deleted."); else await load();
  }

  const promotionRows = useMemo(() => (data?.promotions ?? []).map(item => ({ ...item, platform_name: PLATFORM_LABEL[item.platform], cost_per_visit: "" })), [data]);
  const campaignRows = useMemo(() => (data?.campaigns ?? []).map(item => ({ ...item, conversion: item.visitors ? `${((item.signups / item.visitors) * 100).toFixed(1)}%` : "—", spend_label: item.spend ? money(item.spend) : "—", cost_per_signup: item.costPerSignup ? money(item.costPerSignup) : "—" })), [data]);
  const landingRows = useMemo(() => (data?.landingPages ?? []).map(item => ({ ...item, platform_name: PLATFORM_LABEL[item.platform] })), [data]);

  return <div className={styles.page}>
    <SuperAdminDailySocial query={query} />
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {data?.capped && <Alert><AlertDescription>This window has more than 20,000 page views; the figures cover the first 20,000. Choose a shorter reporting window for exact numbers.</AlertDescription></Alert>}
    {!data && !error && <p className={styles.loading} role="status">Loading promotional tracking…</p>}
    {data && <>
      <section aria-labelledby="promo-funnel" className={styles.kpis}>
        <h2 id="promo-funnel" className={styles.srOnly}>Social funnel</h2>
        {[["Social visits", num(data.totals.visits), `Page views from social platforms in the last ${data.days} days`], ["Unique visitors", num(data.totals.visitors), "Browsers counted once"], ["Sign-ups", num(data.totals.signups), "New accounts whose first visit came from social"], ["Paying members", num(data.totals.members), "Of those sign-ups, with an active membership"], ["Spend", money(data.totals.spend), "Entered on registered promotions"], ["Cost per sign-up", data.totals.spend && data.totals.signups ? money(data.totals.spend / data.totals.signups) : "—", "Spend ÷ social sign-ups"]].map(([label, value, note]) =>
          <Card key={label} className={styles.kpi}><span>{label}</span><strong>{value}</strong><small>{note}</small></Card>)}
      </section>

      <section aria-labelledby="promo-platforms">
        <h2 id="promo-platforms" className={styles.heading}>Platforms</h2>
        <div className={styles.platforms}>{data.platforms.map(item => { const Icon = PLATFORM_ICON[item.platform]; return <Card key={item.platform} className={styles.platform} style={{ "--brand": PLATFORM_COLOR[item.platform] } as React.CSSProperties}>
          <header><span className={styles.platformIcon} aria-hidden="true"><Icon size={18} /></span><b>{PLATFORM_LABEL[item.platform]}</b><span className={styles.live}>{item.live} live · {item.promotions} total</span></header>
          <dl>
            <div><dt>Visits</dt><dd>{num(item.visits)}</dd></div><div><dt>Visitors</dt><dd>{num(item.visitors)}</dd></div>
            <div><dt>Sign-ups</dt><dd>{num(item.signups)}</dd></div><div><dt>Members</dt><dd>{num(item.members)}</dd></div>
            <div><dt>Reach</dt><dd>{num(item.reach)}</dd></div><div><dt>Engagements</dt><dd>{num(item.engagements)}</dd></div>
            <div><dt>Spend</dt><dd>{money(item.spend)}</dd></div><div><dt>Cost / sign-up</dt><dd>{item.costPerSignup ? money(item.costPerSignup) : "—"}</dd></div>
          </dl>
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
          { key: "url", label: "Link", filter: false, sort: false, render: row => row.url ? <a href={String(row.url)} target="_blank" rel="noopener noreferrer" className={styles.link}>Open</a> : "—" },
          { key: "id", label: "Actions", filter: false, sort: false, render: row => confirm === row.id
            ? <span className={styles.rowActions}><button type="button" className={styles.danger} onClick={() => void remove(String(row.id))}>Delete</button><button type="button" onClick={() => setConfirm(null)}>Keep</button></span>
            : <span className={styles.rowActions}><button type="button" aria-label={`Edit ${String(row.title)}`} title="Edit" onClick={() => setDraft({ ...blank, ...Object.fromEntries(Object.entries(row).filter(([key]) => key in blank || key === "id").map(([key, value]) => [key, value ?? ""])) } as Draft)}><Pencil size={14} /></button><button type="button" aria-label={`Delete ${String(row.title)}`} title="Delete" onClick={() => setConfirm(String(row.id))}><Trash2 size={14} /></button></span> },
        ]} />

      {draft && <PromotionForm draft={draft} saving={saving} onChange={setDraft} onCancel={() => setDraft(null)} onSave={() => void save()} />}

      <AdminTable title="Campaign performance" rows={campaignRows} query={query} empty="No campaign traffic in this window. Share a tracked link from the builder below."
        note="Matched on utm_campaign. Campaigns marked 'untracked' brought traffic but are not registered as a promotion yet."
        columns={[{ key: "campaign", label: "Campaign" }, { key: "platform", label: "Platform" }, { key: "title", label: "Promotion" }, "status", { key: "visits", filter: false }, { key: "visitors", filter: false }, { key: "signups", label: "Sign-ups", filter: false }, { key: "members", filter: false }, { key: "conversion", label: "Visitor → sign-up", filter: false }, { key: "spend_label", label: "Spend", filter: false }, { key: "cost_per_signup", label: "Cost / sign-up", filter: false }]} />

      <AdminTable title="Top landing pages from social" rows={landingRows} query={query} empty="No social traffic in this window."
        columns={[{ key: "path", label: "Page" }, { key: "platform", label: "Platform" }, { key: "visits", label: "Sessions started", filter: false }, { key: "visitors", filter: false }]} />

      <LinkBuilder />
    </>}
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
    <header className={styles.chartHead}><h2 className={styles.heading}>Social visits per day</h2>
      {data.daily.length > 0 && <div className={styles.toggle} role="group" aria-label="View"><button type="button" aria-pressed={!asTable} onClick={() => setAsTable(false)}>Chart</button><button type="button" aria-pressed={asTable} onClick={() => setAsTable(true)}>Table</button></div>}
    </header>
    {data.daily.length === 0 ? <p className={styles.loading}>No social visits in this window yet.</p> : <>
      {series.length > 1 && <ul className={styles.legend}>{series.map(platform => <li key={platform}><i style={{ background: PLATFORM_COLOR[platform] }} aria-hidden="true" />{PLATFORM_LABEL[platform]}</li>)}</ul>}
      {asTable ? <div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th scope="col">Day</th>{series.map(platform => <th key={platform} scope="col">{PLATFORM_LABEL[platform]}</th>)}<th scope="col">Total</th></tr></thead>
        <tbody>{data.daily.map((point, i) => <tr key={point.day}><th scope="row">{point.day}</th>{series.map(platform => <td key={platform}>{point[platform]}</td>)}<td>{totals[i]}</td></tr>)}</tbody></table></div>
        : <div className={styles.chart} role="img" aria-label={`Social visits per day for ${data.daily.length} days, peaking at ${max}. Switch to Table for the numbers.`} onMouseLeave={() => setHover(null)}>
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

function PromotionForm({ draft, saving, onChange, onCancel, onSave }: Readonly<{ draft: Draft; saving: boolean; onChange: (draft: Draft) => void; onCancel: () => void; onSave: () => void }>) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => onChange({ ...draft, [key]: value });
  const field = (key: keyof Draft, label: string, type: "text" | "number" | "date" | "url" = "text", wide = false) => <label className={wide ? styles.wide : undefined}><span>{label}</span>
    <input type={type} value={String(draft[key] ?? "")} min={type === "number" ? 0 : undefined} onChange={event => set(key, (type === "number" ? Number(event.target.value) : event.target.value) as never)} /></label>;
  return <Card className={styles.form}>
    <form onSubmit={event => { event.preventDefault(); onSave(); }} aria-label={draft.id ? "Edit promotion" : "Add promotion"}>
      <h2 className={styles.heading}>{draft.id ? "Edit promotion" : "Add promotion"}</h2>
      <div className={styles.grid}>
        <label><span>Platform</span><select value={draft.platform} onChange={event => set("platform", event.target.value as Platform)}>{PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}</select></label>
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
    <p className={styles.note}>Share this link in the post, bio, ad or channel. Visits arrive tagged with the platform and campaign above.</p>
    <div className={styles.grid}>
      <label><span>Platform</span><select value={platform} onChange={event => setPlatform(event.target.value as Platform)}>{PLATFORMS.filter(p => p !== "other").map(p => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}</select></label>
      <label><span>Format</span><select value={format} onChange={event => setFormat(event.target.value as PromotionFormat)}>{PROMOTION_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}</select></label>
      <label><span>Campaign</span><input value={campaign} onChange={event => setCampaign(event.target.value)} placeholder="e.g. react-interview-week" /></label>
      <label className={styles.wide}><span>Landing page</span><input type="url" value={base} onChange={event => setBase(event.target.value)} /></label>
    </div>
    <div className={styles.result}><code>{link || "Enter a campaign to build the link."}</code>
      <button type="button" disabled={!link} onClick={() => { void navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}>{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button>
    </div>
  </Card>;
}
