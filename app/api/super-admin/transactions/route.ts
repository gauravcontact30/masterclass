import { z } from "zod";
import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { razorpay } from "@/lib/server/billing";
import { explainFailure, describeStep, type FailureExplanation } from "@/lib/payment-failures";

/*
 * Every payment made through the website, read from Razorpay (the authoritative record, including failed and
 * refunded attempts), labelled by what was bought, then searched, filtered and paged on the server. Failed
 * payments carry Razorpay's full error trail plus a plain-English explanation, and the response includes the
 * totals, trend, mix and failure breakdown the admin page shows as cards. `format=csv` exports the filtered rows.
 */
const paymentSchema = z.object({
  id: z.string(), entity: z.string().optional(), amount: z.number(), currency: z.string(), status: z.string(),
  order_id: z.string().nullable().optional(), invoice_id: z.string().nullable().optional(), method: z.string().nullable().optional(),
  amount_refunded: z.number().nullable().optional(), refund_status: z.string().nullable().optional(), captured: z.boolean().nullable().optional(),
  description: z.string().nullable().optional(), email: z.string().nullable().optional(), contact: z.string().nullable().optional(),
  fee: z.number().nullable().optional(), tax: z.number().nullable().optional(), error_description: z.string().nullable().optional(),
  error_code: z.string().nullable().optional(), error_source: z.string().nullable().optional(), error_step: z.string().nullable().optional(), error_reason: z.string().nullable().optional(),
  base_amount: z.number().nullable().optional(), base_currency: z.string().nullable().optional(),
  international: z.boolean().nullable().optional(), acquirer_data: z.record(z.string(), z.unknown()).nullable().optional(),
  bank: z.string().nullable().optional(), wallet: z.string().nullable().optional(), vpa: z.string().nullable().optional(),
  card: z.object({ network: z.string().nullable().optional(), last4: z.string().nullable().optional() }).passthrough().nullable().optional(),
  notes: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).nullable().optional(),
  created_at: z.number(),
}).passthrough();
type Payment = z.infer<typeof paymentSchema>;

export type TransactionFailure = FailureExplanation & { code: string | null; source: string | null; step: string | null; stepText: string | null; reason: string | null; description: string | null };
export type Transaction = {
  id: string; createdAt: string; type: "Membership" | "Card unlock" | "Download credit" | "Other"; item: string;
  customer: string; email: string | null; contact: string | null; method: string; methodDetail: string;
  amount: number; currency: string; status: string; refunded: number; fee: number | null; tax: number | null;
  /** The amount and refund in rupees, for totals: an international payment's `amount` is in the buyer's currency, and Razorpay settles (and charges fees) in rupees. */
  inr: number; refundedInr: number;
  orderId: string | null; invoiceId: string | null; error: string | null; international: boolean;
  /** Bank and network reference numbers, for tracing a payment with a customer's bank. */
  references: { label: string; value: string }[];
  /** Everything known about why a failed payment failed; null for every other status. */
  failure: TransactionFailure | null;
};
const REFERENCES: [string, string][] = [["rrn", "Bank reference (RRN)"], ["upi_transaction_id", "UPI transaction ID"], ["auth_code", "Authorisation code"], ["bank_transaction_id", "Bank transaction ID"], ["arn", "Acquirer reference (ARN)"]];

function rupees(payment: Payment) {
  const rate = payment.currency !== "INR" && payment.base_amount != null && payment.base_currency === "INR" && payment.amount > 0 ? payment.base_amount / payment.amount : 1;
  return { inr: Math.round(payment.amount * rate) / 100, refundedInr: Math.round((payment.amount_refunded ?? 0) * rate) / 100 };
}
function describe(payment: Payment): Transaction {
  const notes = payment.notes && !Array.isArray(payment.notes) ? payment.notes : {};
  const kind = String(notes.kind ?? "");
  const type: Transaction["type"] = kind === "card_unlock" ? "Card unlock" : kind === "download_credit" ? "Download credit"
    : payment.invoice_id || /subscription|membership|plan/i.test(payment.description ?? "") ? "Membership" : "Other";
  const item = kind === "card_unlock" ? `${notes.unlock_kind === "word" ? "Word" : "AI pulse"}: ${String(notes.title ?? notes.unlock_id ?? "")} (${String(notes.unlock_day ?? "")})`
    : kind === "download_credit" ? "1 download credit" : payment.description ?? (payment.invoice_id ? "Membership renewal" : "—");
  const detail = payment.method === "card" && payment.card ? `${payment.card.network ?? "Card"} ····${payment.card.last4 ?? ""}` : payment.vpa ?? payment.bank ?? payment.wallet ?? "";
  const raw = { code: payment.error_code ?? null, source: payment.error_source ?? null, step: payment.error_step ?? null, reason: payment.error_reason ?? null, description: payment.error_description ?? null };
  return {
    id: payment.id, createdAt: new Date(payment.created_at * 1000).toISOString(), type, item,
    customer: payment.email || payment.contact || "—", email: payment.email ?? null, contact: payment.contact ?? null,
    method: payment.method ?? "—", methodDetail: detail, amount: payment.amount / 100, currency: payment.currency,
    status: payment.refund_status === "full" ? "refunded" : payment.refund_status === "partial" ? "partially refunded" : payment.status,
    refunded: (payment.amount_refunded ?? 0) / 100, ...rupees(payment), fee: payment.fee == null ? null : payment.fee / 100, tax: payment.tax == null ? null : payment.tax / 100,
    orderId: payment.order_id ?? null, invoiceId: payment.invoice_id ?? null, error: payment.error_description ?? null, international: !!payment.international,
    references: REFERENCES.flatMap(([key, label]) => { const value = payment.acquirer_data?.[key]; return value ? [{ label, value: String(value) }] : []; }),
    failure: payment.status === "failed" ? { ...explainFailure(raw), ...raw, stepText: describeStep(raw.step) } : null,
  };
}

/**
 * Whether a payment was made through this website. The Razorpay account is shared with another product, so a
 * payment counts only when it carries this site's own marks: a card-unlock or download-credit order (both tagged
 * with `notes.kind` here), or a membership invoice, and never one tagged with another brand or website.
 */
function ours(payment: Payment) {
  const notes = payment.notes && !Array.isArray(payment.notes) ? payment.notes : {};
  if (notes.website || notes.brand || notes.product) return false;
  return notes.kind === "card_unlock" || notes.kind === "download_credit" || !!payment.invoice_id;
}

/** Recent payments, cached for a minute per window so paging and filtering do not call Razorpay every time. */
const cache = new Map<string, { at: number; rows: Transaction[] }>();
async function payments(fromDays: number): Promise<Transaction[]> {
  const key = String(fromDays); const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60_000) return hit.rows;
  const from = Math.floor(Date.now() / 1000) - fromDays * 86400;
  const rows: Transaction[] = [];
  for (let skip = 0; skip < 2000; skip += 100) {
    const page = z.object({ items: z.array(paymentSchema) }).parse(await razorpay(`payments?count=100&skip=${skip}&from=${from}`));
    rows.push(...page.items.filter(ours).map(describe));
    if (page.items.length < 100) break;
  }
  cache.set(key, { at: Date.now(), rows });
  return rows;
}

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  q: z.string().trim().max(120).default(""),
  status: z.string().max(30).default("all"), type: z.string().max(30).default("all"), method: z.string().max(30).default("all"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  window: z.coerce.number().int().refine(value => [30, 90, 180, 365].includes(value)).default(90),
  format: z.enum(["json", "csv"]).default("json"),
});
const PAGE_SIZE = 5;

/** The day a timestamp falls on in India, as YYYY-MM-DD. */
const istDay = (ms: number) => new Date(ms + 330 * 60_000).toISOString().slice(0, 10);
const paid = (row: Transaction) => row.status === "captured" || row.status.includes("refunded");
const sum = (list: Transaction[], pick: (row: Transaction) => number | null = row => row.inr) => list.reduce((total, row) => total + (pick(row) ?? 0), 0);

/** Totals, trend, mix, failure reasons and top customers over the filtered rows, for the cards above the table. */
function insights(rows: Transaction[], all: Transaction[], now = Date.now()) {
  const captured = rows.filter(paid); const failed = rows.filter(row => row.status === "failed");
  const attempts = captured.length + failed.length;
  const fees = sum(captured, row => row.fee); const refunded = sum(rows, row => row.refundedInr);
  // A failure is recovered when the same customer paid successfully afterwards.
  const recovered = failed.filter(row => all.some(other => paid(other) && other.createdAt > row.createdAt
    && ((!!row.email && other.email === row.email) || (!!row.contact && other.contact === row.contact)))).length;

  const reasons = new Map<string, { key: string; title: string; party: string; expected: boolean; count: number; amount: number; action: string; last: string }>();
  for (const row of failed) {
    const f = row.failure!; const hit = reasons.get(f.key);
    if (hit) { hit.count += 1; hit.amount += row.inr; if (row.createdAt > hit.last) hit.last = row.createdAt; }
    else reasons.set(f.key, { key: f.key, title: f.title, party: f.party, expected: f.expected, count: 1, amount: row.inr, action: f.action, last: row.createdAt });
  }
  const parties = new Map<string, number>();
  for (const row of failed) parties.set(row.failure!.party, (parties.get(row.failure!.party) ?? 0) + 1);
  const group = (key: (row: Transaction) => string) => {
    const map = new Map<string, { name: string; count: number; amount: number; paid: number; failed: number }>();
    for (const row of rows) {
      const name = key(row); const hit = map.get(name) ?? { name, count: 0, amount: 0, paid: 0, failed: 0 };
      hit.count += 1;
      if (paid(row)) { hit.paid += 1; hit.amount += row.inr; }
      if (row.status === "failed") hit.failed += 1;
      map.set(name, hit);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount || b.count - a.count);
  };
  const customers = new Map<string, { customer: string; contact: string | null; count: number; amount: number; failed: number; last: string }>();
  for (const row of rows) {
    if (row.customer === "—") continue;
    const hit = customers.get(row.customer) ?? { customer: row.customer, contact: row.email ? row.contact : null, count: 0, amount: 0, failed: 0, last: row.createdAt };
    if (paid(row)) { hit.count += 1; hit.amount += row.inr - row.refundedInr; }
    if (row.status === "failed") hit.failed += 1;
    if (row.createdAt > hit.last) hit.last = row.createdAt;
    customers.set(row.customer, hit);
  }
  const daily = Array.from({ length: 14 }, (_, i) => istDay(now - (13 - i) * 86_400_000)).map(day => {
    const list = rows.filter(row => istDay(new Date(row.createdAt).getTime()) === day); const ok = list.filter(paid);
    return { day, amount: sum(ok), paid: ok.length, failed: list.filter(row => row.status === "failed").length };
  });
  return {
    attempts, successRate: attempts ? captured.length / attempts : null, averageTicket: captured.length ? sum(captured) / captured.length : null,
    fees, tax: sum(captured, row => row.tax), net: sum(captured) - refunded - fees, lost: sum(failed), recovered,
    refundCount: rows.filter(row => row.refundedInr > 0).length, customers: new Set(rows.map(row => row.customer).filter(c => c !== "—")).size,
    international: rows.filter(row => row.international).length,
    reasons: [...reasons.values()].sort((a, b) => b.count - a.count),
    byParty: [...parties].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    byType: group(row => row.type), byMethod: group(row => row.method === "—" ? "unknown" : row.method),
    topCustomers: [...customers.values()].filter(c => c.count > 0).sort((a, b) => b.amount - a.amount).slice(0, 5),
    recentFailures: failed.slice(0, 5), daily,
  };
}

const cell = (value: unknown) => { const text = value == null ? "" : String(value); return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; };
function csv(rows: Transaction[]) {
  const head = ["Date", "Payment ID", "Type", "Item", "Email", "Phone", "Method", "Method detail", "Amount", "Currency", "Status", "Refunded", "Fee", "Tax", "Order ID", "Invoice ID", "International",
    "Failure", "Failed because of", "Error code", "Error source", "Error step", "Error reason", "Provider message", "What to do", "References"];
  const body = rows.map(row => [row.createdAt, row.id, row.type, row.item, row.email, row.contact, row.method, row.methodDetail, row.amount, row.currency, row.status, row.refunded, row.fee, row.tax,
    row.orderId, row.invoiceId, row.international ? "yes" : "no", row.failure?.title, row.failure?.party, row.failure?.code, row.failure?.source, row.failure?.step, row.failure?.reason,
    row.failure?.description, row.failure?.action, row.references.map(r => `${r.label}: ${r.value}`).join("; ")].map(cell).join(","));
  return [head.join(","), ...body].join("\r\n");
}

const deletedIds = new Set<string>();

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const input = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    let all: Transaction[];
    try { all = await payments(input.window); } catch (error) { if (error instanceof HttpError && error.status === 503) throw error; throw new HttpError(502, "razorpay_unavailable"); }
    const q = input.q.toLowerCase();
    const from = input.from ? new Date(`${input.from}T00:00:00+05:30`).getTime() : -Infinity;
    const to = input.to ? new Date(`${input.to}T23:59:59.999+05:30`).getTime() : Infinity;
    const rows = all.filter(row => !deletedIds.has(row.id)
      && (input.status === "all" || row.status === input.status) && (input.type === "all" || row.type === input.type)
      && (input.method === "all" || row.method === input.method)
      && new Date(row.createdAt).getTime() >= from && new Date(row.createdAt).getTime() <= to
      && (!q || [row.id, row.orderId, row.invoiceId, row.email, row.contact, row.item, row.methodDetail, row.failure?.title, row.failure?.reason].some(value => value?.toLowerCase().includes(q))));
    if (input.format === "csv") return new Response(`﻿${csv(rows)}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"` } });
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); const page = Math.min(input.page, pages);
    const captured = rows.filter(paid);
    return Response.json({
      rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, pages, total: rows.length, pageSize: PAGE_SIZE,
      summary: { count: rows.length, captured: sum(captured), refunded: rows.reduce((total, row) => total + row.refundedInr, 0), failed: rows.filter(row => row.status === "failed").length, unlocks: rows.filter(row => row.type === "Card unlock" && row.status === "captured").length },
      insights: insights(rows, all),
      // Suggestions for the search box: distinct emails, phones, items and ids containing what was typed.
      suggestions: q ? [...new Set(all.filter(row => !deletedIds.has(row.id)).flatMap(row => [row.email, row.contact, row.item, row.id, row.orderId]).filter((value): value is string => !!value && value.toLowerCase().includes(q) && value.toLowerCase() !== q))].sort((x, y) => x.length - y.length).slice(0, 6) : [],
      facets: { statuses: [...new Set(all.filter(row => !deletedIds.has(row.id)).map(row => row.status))].sort(), types: [...new Set(all.filter(row => !deletedIds.has(row.id)).map(row => row.type))].sort(), methods: [...new Set(all.filter(row => !deletedIds.has(row.id)).map(row => row.method))].filter(m => m !== "—").sort() },
      generatedAt: new Date().toISOString(),
    });
  }, request);
}

export async function DELETE(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) throw new HttpError(400, "missing_transaction_id");
    deletedIds.add(id);
    for (const entry of cache.values()) {
      entry.rows = entry.rows.filter(r => r.id !== id);
    }
    return Response.json({ success: true, id });
  }, request);
}
