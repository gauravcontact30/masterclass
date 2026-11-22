"use client";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BookOpenCheck, CheckCircle2, Clock, Eye, GraduationCap, Hourglass, Search, Target, UserPlus, Users, Wallet, X, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Pager } from "./super-admin-pager";
import { STUDENT_SEGMENTS, type StudentRow, type StudentSegment, type StudentsReport, type StudentTrace } from "@/lib/admin-students";
import styles from "./super-admin-students.module.css";

/*
 * Super Admin → Students: one section per audience (Tech Professional, Board Exams, Competitive Exams, TET Exams).
 * Tracking: who the students are, their plan (trial, paid, trial ended), activity and accuracy in the reporting window,
 * and what they practise most. Tracing: pick a student to see their pages and answers as a timeline.
 * Reads /api/super-admin/students (refreshed every two minutes while visible) and /api/super-admin/students/trace.
 */
const ROWS = 8;
type AccessFilter = "all" | "trial" | "paying" | "free" | "active";
const FILTERS: { id: AccessFilter; label: string }[] = [
  { id: "all", label: "All" }, { id: "active", label: "Active in window" }, { id: "trial", label: "On trial" }, { id: "paying", label: "Paying" }, { id: "free", label: "Trial ended" },
];
const n = (value: number | null | undefined) => value === null || value === undefined ? "—" : new Intl.NumberFormat("en-IN").format(value);
const when = (iso: string | null) => iso ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso)) : "—";
const ACCESS_LABEL: Record<StudentRow["access"], string> = { trial: "Trial", monthly: "Monthly", yearly: "Yearly", free: "Trial ended" };

export function SuperAdminStudents({ segment, days }: { segment: StudentSegment; days: number }) {
  const [data, setData] = useState<StudentsReport | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState<AccessFilter>("all"); const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/super-admin/students?segment=${segment}&days=${days}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("failed");
        setData(await response.json() as StudentsReport); setFailed(false);
      } catch { if (!controller.signal.aborted) setFailed(true); }
    };
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 120_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [segment, days]);

  // "Active in window" is measured from when the report was generated, so filtering stays pure.
  const since = data ? Date.parse(data.generatedAt) - days * 86_400_000 : 0;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.students ?? []).filter(row => (filter === "all" || (filter === "paying" ? row.access === "monthly" || row.access === "yearly" : filter === "active" ? !!row.lastActive && Date.parse(row.lastActive) >= since : row.access === filter))
      && (!q || `${row.name ?? ""} ${row.email} ${row.focus ?? ""}`.toLowerCase().includes(q)));
  }, [data, query, filter, since]);
  const pages = Math.max(1, Math.ceil(rows.length / ROWS)); const safePage = Math.min(page, pages);
  const visible = rows.slice((safePage - 1) * ROWS, safePage * ROWS);
  const info = STUDENT_SEGMENTS[segment];

  if (failed && !data) return <p className={styles.error} role="status"><AlertTriangle size={14} aria-hidden="true" /> Student tracking is unavailable right now; retrying every two minutes.</p>;
  if (!data) return <div className={styles.loading} aria-busy="true">Loading {info.label} students…</div>;
  if (!data.available || !data.summary) return <p className={styles.error} role="status"><AlertTriangle size={14} aria-hidden="true" /> Portal accounts cannot be read. Apply migrations 0054 to 0056.</p>;
  const s = data.summary;
  const tiles = [
    { label: "Students", value: n(s.students), icon: Users, tone: "ink" }, { label: `New in ${days} days`, value: n(s.newInWindow), icon: UserPlus, tone: "violet" },
    { label: "Active in window", value: n(s.active), icon: Activity, tone: "sky" }, { label: "On 1-day trial", value: n(s.trial), icon: Hourglass, tone: "amber" },
    { label: "Paying", value: n(s.paying), icon: Wallet, tone: "mint" }, { label: "Trial ended", value: n(s.expired), icon: Clock, tone: "rose" },
    { label: "Practice answers", value: n(s.answers), icon: BookOpenCheck, tone: "violet" }, { label: "Accuracy", value: s.accuracy === null ? "—" : `${s.accuracy}%`, icon: Target, tone: "mint" },
  ] as const;

  return <div className={styles.wrap}>
    <header className={styles.head}>
      <span className={styles.badge}><GraduationCap size={15} aria-hidden="true" />{info.label}</span>
      <p>{info.audience}. Window: last {days} {days === 1 ? "day" : "days"} · {n(s.views)} page views tracked.</p>
    </header>

    <dl className={styles.tiles}>{tiles.map(tile => <div key={tile.label} data-tone={tile.tone}><dt><tile.icon size={15} aria-hidden="true" />{tile.label}</dt><dd>{tile.value}</dd></div>)}</dl>

    {data.scopes.length > 0 && <section className={styles.card} aria-labelledby={`${segment}-scopes`}>
      <h3 id={`${segment}-scopes`}>{segment === "tech" ? "Practice sets" : segment === "boards" ? "Boards, classes and subjects" : "Exams"} practised</h3>
      <ul className={styles.scopes}>{data.scopes.map(scope => <li key={scope.scope}>
        <span className={styles.scopeName}>{scope.label}</span>
        <span className={styles.bar} aria-hidden="true"><i style={{ width: `${Math.max(4, scope.answers / data.scopes[0].answers * 100)}%` }} /></span>
        <span className={styles.scopeMeta}>{n(scope.answers)} answers · {n(scope.students)} students · {scope.accuracy}% correct</span>
      </li>)}</ul>
    </section>}

    <section className={styles.card} aria-labelledby={`${segment}-students`}>
      <div className={styles.tableHead}>
        <h3 id={`${segment}-students`}>Students</h3>
        <div className={styles.search}><Search size={15} aria-hidden="true" />
          <Input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search name, email or subject…" aria-label="Search students" className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}
        </div>
      </div>
      <div className={styles.filters} role="group" aria-label="Filter students">{FILTERS.map(item => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setPage(1); }}>{item.label}</button>)}</div>
      {rows.length === 0 ? <p className={styles.empty}>No student matches.</p> : <>
        <Table>
          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Plan</TableHead><TableHead>Joined</TableHead><TableHead>Last active</TableHead><TableHead className="text-right">Views</TableHead><TableHead className="text-right">Answers</TableHead><TableHead className="text-right">Accuracy</TableHead><TableHead>Focus</TableHead></TableRow></TableHeader>
          <TableBody>{visible.map(row => <TableRow key={row.accountId} data-selected={selected?.accountId === row.accountId || undefined} className={styles.row} onClick={() => setSelected(row)}>
            <TableCell><button type="button" className={styles.student} onClick={() => setSelected(row)}><b>{row.name || "Unnamed"}</b><small>{row.email || row.accountId.slice(0, 8)}</small></button></TableCell>
            <TableCell><span className={styles.plan} data-access={row.access}>{ACCESS_LABEL[row.access]}</span>{row.access === "trial" && row.trialEndsAt && <small className={styles.sub}>ends {when(row.trialEndsAt)}</small>}</TableCell>
            <TableCell>{when(row.joinedAt)}</TableCell><TableCell>{when(row.lastActive)}</TableCell>
            <TableCell className="text-right">{n(row.views)}</TableCell><TableCell className="text-right">{n(row.answers)}</TableCell>
            <TableCell className="text-right">{row.accuracy === null ? "—" : `${row.accuracy}%`}</TableCell><TableCell>{row.focus ?? "—"}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
        <Pager page={safePage} pages={pages} total={rows.length} size={ROWS} onPage={setPage} />
      </>}
      {data.students.length >= 500 && <p className={styles.note}>Showing the 500 most recently active students.</p>}
    </section>

    {selected && <StudentTraceCard key={selected.accountId} segment={segment} student={selected} onClose={() => setSelected(null)} />}
  </div>;
}

function StudentTraceCard({ segment, student, onClose }: { segment: StudentSegment; student: StudentRow; onClose: () => void }) {
  const [trace, setTrace] = useState<StudentTrace | null>(null); const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/super-admin/students/trace?segment=${segment}&account=${encodeURIComponent(student.accountId)}`, { cache: "no-store", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("failed"); return response.json() as Promise<StudentTrace>; })
      .then(setTrace).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [segment, student.accountId]);
  return <section className={styles.card} aria-labelledby="student-trace">
    <div className={styles.tableHead}>
      <h3 id="student-trace">Trace · {student.name || student.email || "Student"}</h3>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close trace"><X size={15} /></button>
    </div>
    <p className={styles.traceMeta}>{student.email} · {ACCESS_LABEL[student.access]} · joined {when(student.joinedAt)} · {n(student.answers)} answers, {student.accuracy === null ? "no" : `${student.accuracy}%`} accuracy in the window</p>
    {failed ? <p className={styles.error}><AlertTriangle size={14} aria-hidden="true" /> The trace could not be loaded.</p>
      : !trace ? <div className={styles.loading} aria-busy="true">Loading trace…</div>
      : trace.events.length === 0 ? <p className={styles.empty}>No pages or answers recorded for this student yet.</p>
      : <ol className={styles.timeline}>{trace.events.map((event, index) => <li key={`${event.at}-${index}`} data-kind={event.kind} data-correct={event.correct === undefined || event.correct === null ? undefined : String(event.correct)}>
          <span className={styles.dot} aria-hidden="true">{event.kind === "view" ? <Eye size={13} /> : event.correct === false ? <XCircle size={13} /> : <CheckCircle2 size={13} />}</span>
          <div><b>{event.title}</b><small>{event.detail}</small></div><time dateTime={event.at}>{when(event.at)}</time>
        </li>)}</ol>}
  </section>;
}
