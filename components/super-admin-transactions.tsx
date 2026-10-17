"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CreditCard, Layers, RefreshCw, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table as DataTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { AdminError } from "./super-admin-feedback";
import { AdminSelect } from "./super-admin-select";
import { Pager, valueIcon } from "./super-admin-table";
import table from "./super-admin-table.module.css";
import styles from "./super-admin-transactions.module.css";

type Transaction = {
  id: string; createdAt: string; type: string; item: string; customer: string; email: string | null; contact: string | null;
  method: string; methodDetail: string; amount: number; currency: string; status: string; refunded: number; fee: number | null;
  orderId: string | null; invoiceId: string | null; error: string | null;
};
type Result = {
  rows: Transaction[]; page: number; pages: number; total: number; pageSize: number; suggestions: string[];
  summary: { count: number; captured: number; refunded: number; failed: number; unlocks: number };
  facets: { statuses: string[]; types: string[]; methods: string[] }; generatedAt: string;
};
const EMPTY = { q: "", status: "all", type: "all", method: "all", from: "", to: "", window: "90" };
const money = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
const when = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const label = (value: string) => value.toUpperCase() === "UPI" ? "UPI" : value.charAt(0).toUpperCase() + value.slice(1);

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
  const box = useRef<HTMLDivElement>(null);
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

  return <div className={styles.transactions}>
    {data && <div className={styles.summary}>
      <div><span>Transactions</span><strong>{data.summary.count}</strong><small>Matching the filters</small></div>
      <div><span>Collected</span><strong>{money(data.summary.captured)}</strong><small>Captured payments</small></div>
      <div><span>Refunded</span><strong>{money(data.summary.refunded)}</strong><small>Full and partial refunds</small></div>
      <div><span>Failed</span><strong>{data.summary.failed}</strong><small>Attempts that did not go through</small></div>
      <div><span>Card unlocks</span><strong>{data.summary.unlocks}</strong><small>Paid ₹2 landing cards</small></div>
    </div>}

    <Card className={table.panel}>
      <div className={table.head}>
        <div className={table.titleRow}><h2><CreditCard size={17} aria-hidden="true" /> Transactions</h2>{data && <Badge variant="secondary">{data.total} records</Badge>}</div>
        <div className={table.tools}>
          <div className={table.searchBox} ref={box}>
            <Search size={15} aria-hidden="true" />
            <input type="search" role="combobox" aria-expanded={suggestions.length > 0} aria-controls={`${formId}-suggest`} aria-autocomplete="list" aria-label="Search transactions"
              placeholder="Payment id, order, email, phone or item…" value={search} onFocus={() => setFocused(true)} onChange={event => { setSearch(event.target.value); setFocused(true); }} onKeyDown={event => { if (event.key === "Escape") setFocused(false); }} />
            {search && <button type="button" className={table.clearSearch} aria-label="Clear search" onClick={() => { setSearch(""); setFocused(false); }}><X size={14} /></button>}
            {suggestions.length > 0 && <ul id={`${formId}-suggest`} role="listbox" className={table.suggest} aria-label="Suggestions">
              {suggestions.map(value => <li key={value} role="option" aria-selected={false} onMouseDown={event => { event.preventDefault(); setSearch(value); setFocused(false); }}><Search size={12} aria-hidden="true" />{value}</li>)}
            </ul>}
          </div>
          <button type="button" className={table.filterButton} aria-pressed={open} aria-expanded={open} aria-controls={`${formId}-filters`} onClick={() => setOpen(value => !value)} title="Advanced filters">
            <SlidersHorizontal size={15} aria-hidden="true" /><span>Filters</span>{activeFilters > 0 && <span className={table.filterCount}>{activeFilters}</span>}
          </button>
          <button type="button" className={table.iconButton} disabled={!activeFilters && !search} onClick={() => { setFilters(EMPTY); setSearch(""); setFocused(false); }} title="Reset search and filters" aria-label="Reset search and filters"><RotateCcw size={15} aria-hidden="true" /></button>
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

      {error ? <AdminError>{error === "setup_required" ? "Razorpay is not configured, so transactions cannot be read." : "Transactions could not be loaded from Razorpay. Try Refresh in a moment."}</AdminError>
        : !data ? <p className={table.empty}>Loading transactions…</p>
        : data.rows.length ? <>
          <div className={`${table.tableWrap} ${styles.tableWrap}`} aria-busy={busy}><DataTable><TableHeader><TableRow>{["Date", "Payment ID", "Type", "Item", "Customer", "Method", "Amount", "Status", "Order / Invoice"].map(column => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{data.rows.map(row => <TableRow key={row.id}>
              <TableCell data-label="Date" className={styles.nowrap}>{when(row.createdAt)}</TableCell>
              <TableCell data-label="Payment ID"><code className={styles.code}>{row.id}</code></TableCell>
              <TableCell data-label="Type"><span className={styles.type} data-type={row.type}>{row.type}</span></TableCell>
              <TableCell data-label="Item" className={styles.item}>{row.item}</TableCell>
              <TableCell data-label="Customer"><span className={styles.customer}>{row.email ?? "—"}<small>{row.contact ?? ""}</small></span></TableCell>
              <TableCell data-label="Method"><span className={styles.customer}>{label(row.method)}<small>{row.methodDetail}</small></span></TableCell>
              <TableCell data-label="Amount" className={styles.amount}>{money(row.amount, row.currency)}{row.refunded > 0 && <small>−{money(row.refunded, row.currency)} refunded</small>}{row.fee != null && <small>fee {money(row.fee, row.currency)}</small>}</TableCell>
              <TableCell data-label="Status"><span className={styles.status} data-status={row.status} title={row.error ?? undefined}>{label(row.status)}</span></TableCell>
              <TableCell data-label="Order / Invoice"><span className={styles.customer}><code className={styles.code}>{row.orderId ?? "—"}</code><small>{row.invoiceId ?? ""}</small></span></TableCell>
            </TableRow>)}</TableBody></DataTable></div>
          <Pager page={data.page} pages={data.pages} total={data.total} size={data.pageSize} onPage={setPage} />
        </> : <p className={table.empty}>{activeFilters || search ? "No transactions match your search or filters." : "No payments through this website in this period yet."}</p>}
      <p className={table.note}>Read live from Razorpay (cached for a minute). The Razorpay account is shared with another product, so only this website&apos;s payments are listed: card unlocks, download credits and membership invoices.</p>
    </Card>
  </div>;
}
