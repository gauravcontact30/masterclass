"use client";
import { createElement, useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle, ArrowDownRight, BadgeIndianRupee, CalendarDays, Check, CheckCircle2, Copy, CreditCard, Crown, Download, ExternalLink, Eye, Globe2, Layers,
  PieChart, Receipt, RefreshCw, RotateCcw, Search, ShieldAlert, SlidersHorizontal, Sparkles, TrendingUp, Undo2, Users, Wallet, X, XCircle, Trash2,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table as DataTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { AdminError } from "./super-admin-feedback";
import { AdminSelect } from "./super-admin-select";
import { Pager, valueIcon } from "./super-admin-table";
import table from "./super-admin-table.module.css";
import modal from "./suggestion-box.module.css";
import styles from "./super-admin-transactions.module.css";

type Failure = {
  key: string; title: string; cause: string; action: string; party: string; expected: boolean;
  code: string | null; source: string | null; step: string | null; stepText: string | null; reason: string | null; description: string | null;
};
type Transaction = {
  id: string; createdAt: string; type: string; item: string; customer: string; email: string | null; contact: string | null;
  method: string; methodDetail: string; amount: number; currency: string; status: string; refunded: number; fee: number | null; tax: number | null;
  orderId: string | null; invoiceId: string | null; error: string | null; international: boolean; references: { label: string; value: string }[]; failure: Failure | null;
};
type Group = { name: string; count: number; amount: number; paid: number; failed: number };
type Insights = {
  attempts: number; successRate: number | null; averageTicket: number | null; fees: number; tax: number; net: number; lost: number; recovered: number;
  refundCount: number; customers: number; international: number;
  reasons: { key: string; title: string; party: string; expected: boolean; count: number; amount: number; action: string; last: string }[];
  byParty: { name: string; count: number }[]; byType: Group[]; byMethod: Group[];
  topCustomers: { customer: string; contact: string | null; count: number; amount: number; failed: number; last: string }[];
  recentFailures: Transaction[]; daily: { day: string; amount: number; paid: number; failed: number }[];
};
type Result = {
  rows: Transaction[]; page: number; pages: number; total: number; pageSize: number; suggestions: string[];
  summary: { count: number; captured: number; refunded: number; failed: number; unlocks: number };
  insights?: Insights; facets: { statuses: string[]; types: string[]; methods: string[] }; generatedAt: string;
};
const EMPTY = { q: "", status: "all", type: "all", method: "all", from: "", to: "", window: "90" };
const money = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
const when = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const shortDay = (day: string) => new Date(`${day}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const label = (value: string) => value.toUpperCase() === "UPI" ? "UPI" : value.charAt(0).toUpperCase() + value.slice(1);
const percent = (value: number | null) => value == null ? "—" : `${Math.round(value * 1000) / 10}%`;
const dashboardUrl = (id: string) => `https://learning.razorpay.com/app/payments/${id}`;

/** Every payment made through this website — memberships, download credits and ₹2 card unlocks — read from Razorpay. */
export function SuperAdminTransactions() {
  const formId = useId();
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const [nonce, setNonce] = useState(0);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const handleDeleteTransaction = async (tx: Transaction) => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/super-admin/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tx.id })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete transaction");
      }
      setData(current =>
        current
          ? {
              ...current,
              rows: current.rows.filter(r => r.id !== tx.id),
              total: Math.max(0, current.total - 1)
            }
          : null
      );
      setActionToast(`Transaction ${tx.id} deleted successfully.`);
      setTimeout(() => setActionToast(null), 3500);
      setDeletingTransaction(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete transaction");
    } finally {
      setDeleteLoading(false);
    }
  };
  const box = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  // Busy while the shown data is not yet the answer to the current request.
  const requestKey = JSON.stringify([filters, page, nonce]);
  const busy = loadedKey !== requestKey;

  // Typing settles for a moment before searching, so each keystroke is not a request.
  useEffect(() => { const timer = setTimeout(() => { setFilters(current => current.q === search ? current : { ...current, q: search }); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); const key = requestKey;
    fetch(`/api/super-admin/transactions?${new URLSearchParams({ ...filters, page: String(page) })}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? "service_error"); setData(body); setError(""); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "service_error"); })
      .finally(() => { if (!controller.signal.aborted) setLoadedKey(key); });
    return () => controller.abort();
  }, [filters, page, nonce, requestKey]);
  useEffect(() => { const close = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) setFocused(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);

  const set = (key: keyof typeof EMPTY) => (value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  const activeFilters = (["status", "type", "method", "from", "to", "window"] as const).filter(key => filters[key] !== EMPTY[key]).length;
  const clearFilters = () => { setFilters(current => ({ ...EMPTY, q: current.q })); setPage(1); };
  const suggestions = focused && search ? data?.suggestions ?? [] : [];
  /** Narrows the table from a card (a failure reason, a customer, a type) and brings it into view. */
  const drill = (patch: Partial<typeof EMPTY>) => {
    if (patch.q !== undefined) setSearch(patch.q);
    setFilters(current => ({ ...current, ...patch })); setPage(1);
    tableRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };
  const exportHref = `/api/super-admin/transactions?${new URLSearchParams({ ...filters, format: "csv" })}`;
  const info = data?.insights;

  return <div className={styles.transactions}>
    {data && <div className={styles.summary}>
      <Tile tone="sky" icon={Receipt} title="Transactions" value={String(data.summary.count)} note={info ? `${info.customers} customers · ${info.attempts} paid or failed` : "Matching the filters"} />
      <Tile tone="mint" icon={BadgeIndianRupee} title="Collected" value={money(data.summary.captured)} note="Captured payments" />
      <Tile tone="teal" icon={Wallet} title="Net revenue" value={info ? money(info.net) : "—"} note="After refunds and Razorpay fees" />
      <Tile tone="lavender" icon={TrendingUp} title="Success rate" value={percent(info?.successRate ?? null)} note={info?.averageTicket != null ? `Average ticket ${money(info.averageTicket)}` : "Paid ÷ paid + failed"} />
      <Tile tone="rose" icon={XCircle} title="Failed" value={String(data.summary.failed)} note={info ? `${money(info.lost)} not collected · ${info.recovered} recovered` : "Attempts that did not go through"} onClick={data.summary.failed ? () => drill({ status: "failed" }) : undefined} />
      <Tile tone="peach" icon={Undo2} title="Refunded" value={money(data.summary.refunded)} note={info ? `${info.refundCount} payment${info.refundCount === 1 ? "" : "s"} refunded` : "Full and partial refunds"} />
      <Tile tone="butter" icon={Sparkles} title="Card unlocks" value={String(data.summary.unlocks)} note="Paid ₹2 landing cards" onClick={data.summary.unlocks ? () => drill({ type: "Card unlock" }) : undefined} />
      <Tile tone="slate" icon={Globe2} title="International" value={String(info?.international ?? 0)} note="Cards issued outside India" />
    </div>}

    {info && data && data.summary.failed > 0 && <FailureCard info={info} onReason={title => drill({ status: "failed", q: title })} onOpen={setSelected} />}

    {info && <div className={styles.grid}>
      <TrendCard daily={info.daily} />
      <MoneyCard info={info} collected={data?.summary.captured ?? 0} refunded={data?.summary.refunded ?? 0} />
      <MixCard info={info} onType={type => drill({ type })} onMethod={method => drill({ method })} />
      <CustomersCard customers={info.topCustomers} onCustomer={customer => drill({ q: customer })} />
    </div>}

    <div ref={tableRef} className={styles.anchor} />
    <Card className={table.panel}>
      <div className={table.head}>
        <div className={table.titleRow}><h2><CreditCard size={17} aria-hidden="true" /> Transactions</h2>{data && <Badge variant="secondary">{data.total} records</Badge>}</div>
        <div className={table.tools}>
          <div className={table.searchBox} ref={box}>
            <Search size={15} aria-hidden="true" />
            <input type="search" role="combobox" aria-expanded={suggestions.length > 0} aria-controls={`${formId}-suggest`} aria-autocomplete="list" aria-label="Search transactions"
              placeholder="Payment id, order, email, phone, item or failure…" value={search} onFocus={() => setFocused(true)} onChange={event => { setSearch(event.target.value); setFocused(true); }} onKeyDown={event => { if (event.key === "Escape") setFocused(false); }} />
            {search && <button type="button" className={table.clearSearch} aria-label="Clear search" onClick={() => { setSearch(""); setFocused(false); }}><X size={14} /></button>}
            {suggestions.length > 0 && <ul id={`${formId}-suggest`} role="listbox" className={table.suggest} aria-label="Suggestions">
              {suggestions.map(value => <li key={value} role="option" aria-selected={false} onMouseDown={event => { event.preventDefault(); setSearch(value); setFocused(false); }}><Search size={12} aria-hidden="true" />{value}</li>)}
            </ul>}
          </div>
          <button type="button" className={table.filterButton} aria-pressed={open} aria-expanded={open} aria-controls={`${formId}-filters`} onClick={() => setOpen(value => !value)} title="Advanced filters">
            <SlidersHorizontal size={15} aria-hidden="true" /><span>Filters</span>{activeFilters > 0 && <span className={table.filterCount}>{activeFilters}</span>}
          </button>
          <button type="button" className={table.iconButton} disabled={!activeFilters && !search} onClick={() => { setFilters(EMPTY); setSearch(""); setFocused(false); }} title="Reset search and filters" aria-label="Reset search and filters"><RotateCcw size={15} aria-hidden="true" /></button>
          {data?.total ? <a className={table.filterButton} href={exportHref} download title="Download the filtered transactions as CSV"><Download size={15} aria-hidden="true" /><span>Export CSV</span></a>
            : <button type="button" className={table.filterButton} disabled title="Nothing to export"><Download size={15} aria-hidden="true" /><span>Export CSV</span></button>}
          <button type="button" className={table.filterButton} disabled={busy} onClick={() => setNonce(n => n + 1)} title="Refresh"><RefreshCw size={15} aria-hidden="true" /><span>Refresh</span></button>
        </div>
      </div>
      {data && data.facets.statuses.length > 1 && <div className={table.chips} role="group" aria-label="Filter by status">
        <button type="button" aria-pressed={filters.status === "all"} onClick={() => set("status")("all")}><Layers size={13} aria-hidden="true" />All</button>
        {data.facets.statuses.map(status => { const Icon = valueIcon(status); return <button type="button" key={status} aria-pressed={filters.status === status} onClick={() => set("status")(filters.status === status ? "all" : status)}><Icon size={13} aria-hidden="true" />{label(status)}</button>; })}
      </div>}
      {open && <div id={`${formId}-filters`} className={table.filters}>
        <div className={table.field}><label htmlFor={`${formId}-status`}>Status</label><AdminSelect id={`${formId}-status`} label="Status" value={filters.status} onValueChange={set("status")} options={[{ value: "all", label: "All statuses" }, ...(data?.facets.statuses ?? []).map(value => ({ value, label: label(value) }))]} /></div>
        <div className={table.field}><label htmlFor={`${formId}-type`}>Type</label><AdminSelect id={`${formId}-type`} label="Type" value={filters.type} onValueChange={set("type")} options={[{ value: "all", label: "All types" }, ...(data?.facets.types ?? []).map(value => ({ value, label: value }))]} /></div>
        <div className={table.field}><label htmlFor={`${formId}-method`}>Method</label><AdminSelect id={`${formId}-method`} label="Method" value={filters.method} onValueChange={set("method")} options={[{ value: "all", label: "All methods" }, ...(data?.facets.methods ?? []).map(value => ({ value, label: label(value) }))]} /></div>
        <div className={table.field}><label htmlFor={`${formId}-from`}>From</label><input id={`${formId}-from`} type="date" className={table.date} value={filters.from} max={filters.to || undefined} onChange={event => set("from")(event.target.value)} /></div>
        <div className={table.field}><label htmlFor={`${formId}-to`}>To</label><input id={`${formId}-to`} type="date" className={table.date} value={filters.to} min={filters.from || undefined} onChange={event => set("to")(event.target.value)} /></div>
        <div className={table.field}><label htmlFor={`${formId}-window`}>Look back</label><AdminSelect id={`${formId}-window`} label="Look back" value={filters.window} onValueChange={set("window")} options={[{ value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "180", label: "180 days" }, { value: "365", label: "1 year" }]} /></div>
        <button type="button" className={table.clearFilters} disabled={!activeFilters} onClick={clearFilters}><X size={13} />Clear filters</button>
      </div>}

      {actionToast && <div className={styles.actionToast} role="status"><Check size={14} aria-hidden="true" />{actionToast}</div>}
      {error ? <AdminError>{error === "setup_required" ? "Razorpay is not configured, so transactions cannot be read." : "Transactions could not be loaded from Razorpay. Try Refresh in a moment."}</AdminError>
        : !data ? <p className={table.empty}>Loading transactions…</p>
        : data.rows.length ? <>
          <div className={`${table.tableWrap} ${styles.tableWrap}`} aria-busy={busy}><DataTable><TableHeader><TableRow>{["Date", "Payment ID", "Type", "Item", "Customer", "Method", "Amount", "Status", "Order / Invoice", "Actions"].map(column => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{data.rows.map(row => <TableRow key={row.id} data-failed={row.status === "failed" || undefined} className={styles.row}>
              <TableCell data-label="Date" className={styles.nowrap}>{when(row.createdAt)}</TableCell>
              <TableCell data-label="Payment ID"><code className={styles.code}>{row.id}</code></TableCell>
              <TableCell data-label="Type"><span className={styles.type} data-type={row.type}>{row.type}</span></TableCell>
              <TableCell data-label="Item" className={styles.item}>{row.item}</TableCell>
              <TableCell data-label="Customer"><span className={styles.customer}>{row.email ?? "—"}<small>{row.contact ?? ""}</small></span></TableCell>
              <TableCell data-label="Method"><span className={styles.customer}>{label(row.method)}<small>{row.methodDetail}</small></span></TableCell>
              <TableCell data-label="Amount" className={styles.amount}>{money(row.amount, row.currency)}{row.refunded > 0 && <small>−{money(row.refunded, row.currency)} refunded</small>}{row.fee != null && <small>fee {money(row.fee, row.currency)}</small>}</TableCell>
              <TableCell data-label="Status"><span className={styles.statusCell}><StatusPill status={row.status} />{row.failure && <small className={styles.failReason} title={row.failure.cause}><AlertTriangle size={11} aria-hidden="true" />{row.failure.title}</small>}</span></TableCell>
              <TableCell data-label="Order / Invoice"><span className={styles.customer}><code className={styles.code}>{row.orderId ?? "—"}</code><small>{row.invoiceId ?? ""}</small></span></TableCell>
              <TableCell data-label="Actions" className={styles.actionsCell}>
                <div className={styles.tableActionGroup}>
                  <button
                    type="button"
                    className={styles.actionIconBtn}
                    data-action="view"
                    onClick={() => setSelected(row)}
                    title={`View user & payment details (${row.customer})`}
                    aria-label={`View details of payment ${row.id}`}
                  >
                    <Eye size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.actionIconBtn}
                    data-action="delete"
                    onClick={() => setDeletingTransaction(row)}
                    title={`Delete transaction record ${row.id}`}
                    aria-label={`Delete transaction record ${row.id}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </TableCell>
            </TableRow>)}</TableBody></DataTable></div>
          <Pager page={data.page} pages={data.pages} total={data.total} size={data.pageSize} onPage={setPage} />
        </> : <p className={table.empty}>{activeFilters || search ? "No transactions match your search or filters." : "No payments through this website in this period yet."}</p>}
      <p className={table.note}>Read live from Razorpay (cached for a minute). The Razorpay account is shared with another product, so only this website&apos;s payments are listed: card unlocks, download credits and membership invoices. The cards above follow the same search and filters.</p>
    </Card>

    <Dialog open={!!selected} onOpenChange={value => { if (!value) setSelected(null); }}>
      <DialogContent className={`${modal.modal} ${styles.detailModal}`}>
        <DialogHeader className={modal.header}>
          <span className={`${modal.headerMark} ${styles.detailMark}`} data-status={selected?.status} aria-hidden="true">{selected?.failure ? <XCircle size={22} /> : <Receipt size={22} />}</span>
          <DialogTitle className={modal.title}>{selected ? money(selected.amount, selected.currency) : ""} · {selected ? label(selected.status) : ""}</DialogTitle>
          <DialogDescription className={modal.lede}>{selected ? `${selected.type} — ${selected.item}` : ""}</DialogDescription>
        </DialogHeader>
        {selected && <TransactionDetail row={selected} />}
      </DialogContent>
    </Dialog>

    <Dialog open={!!deletingTransaction} onOpenChange={value => { if (!value && !deleteLoading) setDeletingTransaction(null); }}>
      <DialogContent className={`${modal.modal} ${styles.deleteTxModal}`}>
        <DialogHeader className={modal.header}>
          <span className={`${modal.headerMark} ${styles.deleteTxMark}`} aria-hidden="true">
            <Trash2 size={22} />
          </span>
          <DialogTitle className={modal.title}>Delete Transaction</DialogTitle>
          <DialogDescription className={modal.lede}>
            Are you sure you want to permanently delete transaction <strong className={styles.code}>{deletingTransaction?.id}</strong>? It will be removed from your dashboard table.
          </DialogDescription>
        </DialogHeader>
        {deletingTransaction && (
          <div className={styles.deleteTxSummary}>
            <div className={styles.deleteTxRow}>
              <span>Customer</span>
              <strong>{deletingTransaction.customer}</strong>
            </div>
            {deletingTransaction.email && (
              <div className={styles.deleteTxRow}>
                <span>Email</span>
                <span>{deletingTransaction.email}</span>
              </div>
            )}
            {deletingTransaction.contact && (
              <div className={styles.deleteTxRow}>
                <span>Phone</span>
                <span>{deletingTransaction.contact}</span>
              </div>
            )}
            <div className={styles.deleteTxRow}>
              <span>Amount</span>
              <strong>{money(deletingTransaction.amount, deletingTransaction.currency)} · {label(deletingTransaction.status)}</strong>
            </div>
            <div className={styles.deleteTxRow}>
              <span>Item</span>
              <span>{deletingTransaction.item}</span>
            </div>
          </div>
        )}
        <div className={styles.deleteTxActions}>
          <button
            type="button"
            className={styles.deleteTxCancelBtn}
            onClick={() => setDeletingTransaction(null)}
            disabled={deleteLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.deleteTxConfirmBtn}
            onClick={() => deletingTransaction && handleDeleteTransaction(deletingTransaction)}
            disabled={deleteLoading}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>{deleteLoading ? "Deleting..." : "Delete Transaction"}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}

function Tile({ tone, icon: Icon, title, value, note, onClick }: { tone: string; icon: typeof Receipt; title: string; value: string; note: string; onClick?: () => void }) {
  const body = <><span className={styles.tileHead}><span className={styles.tileIcon} aria-hidden="true"><Icon size={15} /></span>{title}</span><strong>{value}</strong><small>{note}</small></>;
  return onClick ? <button type="button" className={styles.tile} data-tone={tone} onClick={onClick} title={`Show ${title.toLowerCase()} in the table`}>{body}</button>
    : <div className={styles.tile} data-tone={tone}>{body}</div>;
}

function StatusPill({ status }: { status: string }) {
  const icon = createElement(valueIcon(status), { size: 12, "aria-hidden": true });
  return <span className={styles.status} data-status={status}>{icon}{label(status)}</span>;
}

/** Why payments failed: each reason with its count, who it was down to and what to do, then the latest failures in full. */
function FailureCard({ info, onReason, onOpen }: { info: Insights; onReason: (title: string) => void; onOpen: (row: Transaction) => void }) {
  const top = Math.max(...info.reasons.map(r => r.count), 1);
  const failed = info.reasons.reduce((total, r) => total + r.count, 0);
  const needsAction = info.reasons.filter(r => !r.expected).reduce((total, r) => total + r.count, 0);
  return <Card className={`${styles.card} ${styles.failCard}`} data-tone="rose">
    <div className={styles.cardHead}>
      <h3><ShieldAlert size={17} aria-hidden="true" /> Why payments failed</h3>
      <span className={styles.cardMeta}>{failed} failed · {info.recovered} later paid · {needsAction ? `${needsAction} may need action` : "none need action from you"}</span>
    </div>
    <div className={styles.failLayout}>
      <ul className={styles.reasons} aria-label="Failure reasons">
        {info.reasons.map(reason => <li key={reason.key}>
          <button type="button" onClick={() => onReason(reason.title)} title="Show these failures in the table">
            <span className={styles.reasonTop}><strong>{reason.title}</strong><span className={styles.reasonCount}>{reason.count}×</span></span>
            <span className={styles.bar} aria-hidden="true"><span style={{ width: `${(reason.count / top) * 100}%` }} /></span>
            <span className={styles.reasonMeta}>
              <span className={styles.party}>{reason.party}</span>
              <span className={styles.expected} data-expected={reason.expected}>{reason.expected ? <><Check size={11} aria-hidden="true" />Normal</> : <><AlertTriangle size={11} aria-hidden="true" />Check this</>}</span>
              <span>{money(reason.amount)} · last {when(reason.last)}</span>
            </span>
            <span className={styles.reasonAction}>{reason.action}</span>
          </button>
        </li>)}
      </ul>
      <div className={styles.failSide}>
        <h4>Failed because of</h4>
        <ul className={styles.parties}>{info.byParty.map(party => <li key={party.name}><span>{party.name}</span><span className={styles.bar} aria-hidden="true"><span style={{ width: `${(party.count / failed) * 100}%` }} /></span><strong>{party.count}</strong></li>)}</ul>
        <p className={styles.sideNote}><CheckCircle2 size={13} aria-hidden="true" />{info.recovered} of {failed} failed customers paid successfully afterwards.</p>
      </div>
    </div>
    <h4 className={styles.subhead}>Latest failures in full</h4>
    <div className={styles.failList}>
      {info.recentFailures.map(row => <details key={row.id} className={styles.failItem}>
        <summary>
          <span className={styles.failTitle}><XCircle size={14} aria-hidden="true" />{row.failure?.title ?? "Failed"}</span>
          <span className={styles.failSummary}>{money(row.amount, row.currency)} · {row.customer} · {label(row.method)} · {when(row.createdAt)}</span>
        </summary>
        {row.failure && <FailureExplain failure={row.failure} />}
        <button type="button" className={styles.detailButton} onClick={() => onOpen(row)}><Eye size={14} aria-hidden="true" />Open full transaction</button>
      </details>)}
    </div>
  </Card>;
}

function FailureExplain({ failure }: { failure: Failure }) {
  const facts: [string, string | null][] = [
    ["Failed because of", failure.party], ["Stopped while", failure.stepText], ["Error code", failure.code], ["Error source", failure.source],
    ["Error step", failure.step], ["Error reason", failure.reason], ["Provider message", failure.description],
  ];
  return <div className={styles.explain}>
    <p><strong>What happened.</strong> {failure.cause}</p>
    <p><strong>What to do.</strong> {failure.action}</p>
    <dl className={styles.facts}>{facts.filter(([, value]) => value).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{name.startsWith("Error") ? <code className={styles.code}>{value}</code> : value}</dd></div>)}</dl>
  </div>;
}

/** Collected per day for the last two weeks, with failed attempts in each bar's tooltip. */
function TrendCard({ daily }: { daily: Insights["daily"] }) {
  const top = Math.max(...daily.map(d => d.amount), 1);
  const total = daily.reduce((sum, d) => sum + d.amount, 0);
  const failed = daily.reduce((sum, d) => sum + d.failed, 0);
  return <Card className={styles.card} data-tone="sky">
    <div className={styles.cardHead}><h3><CalendarDays size={17} aria-hidden="true" /> Collected, last 14 days</h3><span className={styles.cardMeta}>{money(total)} · {failed} failed</span></div>
    <ol className={styles.trend} aria-label="Amount collected per day, last 14 days">
      {daily.map(day => {
        const text = `${shortDay(day.day)}: ${money(day.amount)} from ${day.paid} payment${day.paid === 1 ? "" : "s"}${day.failed ? `, ${day.failed} failed` : ""}`;
        return <li key={day.day} tabIndex={0} aria-label={text} data-tip={text}>
          <span className={styles.trendBar} style={{ height: `${Math.max(day.amount ? 6 : 2, (day.amount / top) * 100)}%` }} data-empty={!day.amount || undefined} />
          {day.failed > 0 && <span className={styles.trendFail} aria-hidden="true">{day.failed}</span>}
        </li>;
      })}
    </ol>
    <div className={styles.trendAxis} aria-hidden="true"><span>{shortDay(daily[0].day)}</span><span>Today</span></div>
    <p className={styles.sideNote}>Hover a day for the amount and failed attempts. A small red number above a bar counts that day&apos;s failures.</p>
  </Card>;
}

/** Where the money went: collected, minus refunds and Razorpay fees, to net. */
function MoneyCard({ info, collected, refunded }: { info: Insights; collected: number; refunded: number }) {
  const lines: [string, number, string][] = [["Collected", collected, "plus"], ["Refunded to customers", -refunded, "minus"], ["Razorpay fees (incl. GST)", -info.fees, "minus"]];
  return <Card className={styles.card} data-tone="mint">
    <div className={styles.cardHead}><h3><Wallet size={17} aria-hidden="true" /> Money breakdown</h3><span className={styles.cardMeta}>GST on fees {money(info.tax)}</span></div>
    <dl className={styles.ledger}>
      {lines.map(([name, value, kind]) => <div key={name} data-kind={kind}><dt>{kind === "minus" ? <ArrowDownRight size={13} aria-hidden="true" /> : <BadgeIndianRupee size={13} aria-hidden="true" />}{name}</dt><dd>{money(value)}</dd></div>)}
      <div data-kind="total"><dt>Net to bank</dt><dd>{money(info.net)}</dd></div>
    </dl>
    <dl className={styles.miniStats}>
      <div><dt>Average ticket</dt><dd>{info.averageTicket == null ? "—" : money(info.averageTicket)}</dd></div>
      <div><dt>Not collected (failed)</dt><dd>{money(info.lost)}</dd></div>
      <div><dt>Fee share</dt><dd>{collected ? percent(info.fees / collected) : "—"}</dd></div>
    </dl>
  </Card>;
}

/** What was bought and how it was paid, each with its success rate. */
function MixCard({ info, onType, onMethod }: { info: Insights; onType: (type: string) => void; onMethod: (method: string) => void }) {
  const rows = (groups: Group[], onPick: (name: string) => void, kind: string) => {
    const top = Math.max(...groups.map(g => g.amount), 1);
    return <ul className={styles.mix} aria-label={kind}>{groups.map(group => {
      const tried = group.paid + group.failed;
      return <li key={group.name}><button type="button" onClick={() => onPick(group.name)} title={`Show ${group.name} in the table`}>
        <span className={styles.mixTop}><strong>{label(group.name)}</strong><span>{money(group.amount)}</span></span>
        <span className={styles.bar} aria-hidden="true"><span style={{ width: `${(group.amount / top) * 100}%` }} /></span>
        <span className={styles.mixMeta}>{group.count} total · {group.paid} paid · {group.failed} failed · {tried ? percent(group.paid / tried) : "—"} success</span>
      </button></li>;
    })}</ul>;
  };
  return <Card className={styles.card} data-tone="lavender">
    <div className={styles.cardHead}><h3><PieChart size={17} aria-hidden="true" /> Payment mix</h3></div>
    <h4 className={styles.subhead}>By what was bought</h4>{rows(info.byType, onType, "By type")}
    <h4 className={styles.subhead}>By payment method</h4>{rows(info.byMethod.filter(m => m.name !== "unknown"), onMethod, "By method")}
  </Card>;
}

function CustomersCard({ customers, onCustomer }: { customers: Insights["topCustomers"]; onCustomer: (customer: string) => void }) {
  return <Card className={styles.card} data-tone="peach">
    <div className={styles.cardHead}><h3><Crown size={17} aria-hidden="true" /> Top customers</h3><span className={styles.cardMeta}><Users size={13} aria-hidden="true" /> by net spend</span></div>
    {customers.length ? <ol className={styles.customers}>{customers.map((c, index) => <li key={c.customer}><button type="button" onClick={() => onCustomer(c.customer)} title="Show this customer's payments">
      <span className={styles.rank}>{index + 1}</span>
      <span className={styles.customer}><strong className={styles.ellipsis}>{c.customer}</strong><small>{c.count} paid{c.failed ? ` · ${c.failed} failed` : ""} · last {when(c.last)}</small></span>
      <strong className={styles.amount}>{money(c.amount)}</strong>
    </button></li>)}</ol> : <p className={styles.sideNote}>No paid customers in this selection.</p>}
  </Card>;
}

function CopyButton({ value, name }: { value: string; name: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className={styles.copy} aria-label={`Copy ${name}`} title={`Copy ${name}`} onClick={() => { void navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }); }}>
    {done ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
  </button>;
}

/** Everything known about one payment, with the failure explained in full when it failed. */
function TransactionDetail({ row }: { row: Transaction }) {
  const ids: [string, string | null][] = [["Payment ID", row.id], ["Order ID", row.orderId], ["Invoice ID", row.invoiceId], ...row.references.map(r => [r.label, r.value] as [string, string])];
  const facts: [string, string][] = [
    ["Date", when(row.createdAt)], ["Status", label(row.status)], ["Type", row.type], ["Item", row.item],
    ["Customer email", row.email ?? "—"], ["Customer phone", row.contact ?? "—"], ["Method", `${label(row.method)}${row.methodDetail ? ` · ${row.methodDetail}` : ""}`],
    ["Amount", money(row.amount, row.currency)], ["Refunded", row.refunded ? money(row.refunded, row.currency) : "—"],
    ["Razorpay fee", row.fee == null ? "—" : money(row.fee, row.currency)], ["GST on fee", row.tax == null ? "—" : money(row.tax, row.currency)],
    ["Net", row.status === "failed" ? "—" : money(row.amount - row.refunded - (row.fee ?? 0), row.currency)], ["International", row.international ? "Yes" : "No"],
  ];
  return <div className={styles.detail}>
    {row.failure && <section className={styles.detailFail} aria-label="Why this payment failed">
      <h4><XCircle size={15} aria-hidden="true" />{row.failure.title}</h4>
      <FailureExplain failure={row.failure} />
    </section>}
    <dl className={styles.detailGrid}>{facts.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
    <h4 className={styles.subhead}>Reference numbers</h4>
    <dl className={styles.ids}>{ids.filter(([, value]) => value).map(([name, value]) => <div key={name}><dt>{name}</dt><dd><code className={styles.code}>{value}</code><CopyButton value={value!} name={name} /></dd></div>)}</dl>
    <a className={styles.razorpayLink} href={dashboardUrl(row.id)} target="_blank" rel="noreferrer"><ExternalLink size={14} aria-hidden="true" />Open in Razorpay dashboard</a>
  </div>;
}
