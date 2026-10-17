export type TraceRow = Record<string, unknown>;

export function traceFields(row: TraceRow): TraceRow {
  const details = row.details && typeof row.details === "object" && !Array.isArray(row.details) ? row.details as TraceRow : {};
  return { ...row, request_id: details.request_id ?? row.request_id, record_id: details.record_id ?? row.record_id, owner_id: details.owner_id ?? row.owner_id };
}

export function filterTraces(rows: TraceRow[], identity: string, mode: string) {
  const key = identity.trim().toLowerCase();
  return rows.map(traceFields).filter(row => {
    if (key && ![row.id, row.request_id, row.actor_id, row.owner_id, row.record_id].some(value => value != null && String(value).toLowerCase() === key)) return false;
    if (mode === "errors") return Number(row.status) >= 400;
    if (mode === "slow") return row.kind === "request" && Number(row.duration_ms) >= 1000;
    if (mode === "audit") return row.kind === "audit";
    return true;
  }).sort((a, b) => (Date.parse(String(b.created_at)) || 0) - (Date.parse(String(a.created_at)) || 0));
}
