import { z } from "zod";
import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { razorpay } from "@/lib/server/billing";

/*
 * Every payment made through the website, read from Razorpay (the authoritative record, including failed and
 * refunded attempts), labelled by what was bought, then searched, filtered and paged ten at a time on the server.
 */
const paymentSchema = z.object({
  id: z.string(), entity: z.string().optional(), amount: z.number(), currency: z.string(), status: z.string(),
  order_id: z.string().nullable().optional(), invoice_id: z.string().nullable().optional(), method: z.string().nullable().optional(),
  amount_refunded: z.number().nullable().optional(), refund_status: z.string().nullable().optional(), captured: z.boolean().nullable().optional(),
  description: z.string().nullable().optional(), email: z.string().nullable().optional(), contact: z.string().nullable().optional(),
  fee: z.number().nullable().optional(), tax: z.number().nullable().optional(), error_description: z.string().nullable().optional(),
  bank: z.string().nullable().optional(), wallet: z.string().nullable().optional(), vpa: z.string().nullable().optional(),
  card: z.object({ network: z.string().nullable().optional(), last4: z.string().nullable().optional() }).passthrough().nullable().optional(),
  notes: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).nullable().optional(),
  created_at: z.number(),
}).passthrough();
type Payment = z.infer<typeof paymentSchema>;

export type Transaction = {
  id: string; createdAt: string; type: "Membership" | "Card unlock" | "Download credit" | "Other"; item: string;
  customer: string; email: string | null; contact: string | null; method: string; methodDetail: string;
  amount: number; currency: string; status: string; refunded: number; fee: number | null; orderId: string | null; invoiceId: string | null; error: string | null;
};

function describe(payment: Payment): Transaction {
  const notes = payment.notes && !Array.isArray(payment.notes) ? payment.notes : {};
  const kind = String(notes.kind ?? "");
  const type: Transaction["type"] = kind === "card_unlock" ? "Card unlock" : kind === "download_credit" ? "Download credit"
    : payment.invoice_id || /subscription|membership|plan/i.test(payment.description ?? "") ? "Membership" : "Other";
  const item = kind === "card_unlock" ? `${notes.unlock_kind === "word" ? "Word" : "AI pulse"}: ${String(notes.title ?? notes.unlock_id ?? "")} (${String(notes.unlock_day ?? "")})`
    : kind === "download_credit" ? "1 download credit" : payment.description ?? (payment.invoice_id ? "Membership renewal" : "—");
  const detail = payment.method === "card" && payment.card ? `${payment.card.network ?? "Card"} ····${payment.card.last4 ?? ""}` : payment.vpa ?? payment.bank ?? payment.wallet ?? "";
  return {
    id: payment.id, createdAt: new Date(payment.created_at * 1000).toISOString(), type, item,
    customer: payment.email || payment.contact || "—", email: payment.email ?? null, contact: payment.contact ?? null,
    method: payment.method ?? "—", methodDetail: detail, amount: payment.amount / 100, currency: payment.currency,
    status: payment.refund_status === "full" ? "refunded" : payment.refund_status === "partial" ? "partially refunded" : payment.status,
    refunded: (payment.amount_refunded ?? 0) / 100, fee: payment.fee == null ? null : payment.fee / 100,
    orderId: payment.order_id ?? null, invoiceId: payment.invoice_id ?? null, error: payment.error_description ?? null,
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
});
const PAGE_SIZE = 5;

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const input = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    let all: Transaction[];
    try { all = await payments(input.window); } catch (error) { if (error instanceof HttpError && error.status === 503) throw error; throw new HttpError(502, "razorpay_unavailable"); }
    const q = input.q.toLowerCase();
    const from = input.from ? new Date(`${input.from}T00:00:00+05:30`).getTime() : -Infinity;
    const to = input.to ? new Date(`${input.to}T23:59:59.999+05:30`).getTime() : Infinity;
    const rows = all.filter(row => (input.status === "all" || row.status === input.status) && (input.type === "all" || row.type === input.type)
      && (input.method === "all" || row.method === input.method)
      && new Date(row.createdAt).getTime() >= from && new Date(row.createdAt).getTime() <= to
      && (!q || [row.id, row.orderId, row.invoiceId, row.email, row.contact, row.item, row.methodDetail].some(value => value?.toLowerCase().includes(q))));
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); const page = Math.min(input.page, pages);
    const sum = (list: Transaction[]) => list.reduce((total, row) => total + row.amount, 0);
    const captured = rows.filter(row => row.status === "captured" || row.status.includes("refunded"));
    return Response.json({
      rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, pages, total: rows.length, pageSize: PAGE_SIZE,
      summary: { count: rows.length, captured: sum(captured), refunded: rows.reduce((total, row) => total + row.refunded, 0), failed: rows.filter(row => row.status === "failed").length, unlocks: rows.filter(row => row.type === "Card unlock" && row.status === "captured").length },
      // Suggestions for the search box: distinct emails, phones, items and ids containing what was typed.
      suggestions: q ? [...new Set(all.flatMap(row => [row.email, row.contact, row.item, row.id, row.orderId]).filter((value): value is string => !!value && value.toLowerCase().includes(q) && value.toLowerCase() !== q))].sort((x, y) => x.length - y.length).slice(0, 6) : [],
      facets: { statuses: [...new Set(all.map(row => row.status))].sort(), types: [...new Set(all.map(row => row.type))].sort(), methods: [...new Set(all.map(row => row.method))].filter(m => m !== "—").sort() },
      generatedAt: new Date().toISOString(),
    });
  }, request);
}
