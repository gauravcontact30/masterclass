"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, BellRing, CheckCheck, CreditCard, GraduationCap, LogIn, Megaphone, MailCheck, ShieldAlert, UserPlus, type LucideIcon } from "lucide-react";
import { useLanguage } from "./language-provider";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import styles from "./notification-center.module.css";

export type AppNotification = { id: string; kind: string; title: string; body: string; link: string | null; created_at: string; read_at: string | null };
const ICONS: Record<string, LucideIcon> = { account_created: UserPlus, email_verified: MailCheck, sign_in: LogIn, announcement: Megaphone, billing: CreditCard, learning: GraduationCap, security: ShieldAlert };
/** Account events already confirmed by the sign-in toast (components/auth-notice-toast.tsx); everything else new is toasted once as it arrives. */
const QUIET = new Set(["account_created", "email_verified", "sign_in"]);
const SEEN = "mc:notifications-toasted";
const POLL_MS = 60_000;

function ago(iso: string, hi: boolean) {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (minutes < 1) return hi ? "अभी" : "just now";
  if (minutes < 60) return hi ? `${minutes} मिनट पहले` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hi ? `${hours} घंटे पहले` : `${hours} h ago`;
  return new Date(iso).toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}
function seen(): Set<string> { try { return new Set(JSON.parse(sessionStorage.getItem(SEEN) ?? "[]")); } catch { return new Set(); } }
function remember(ids: Set<string>) { try { sessionStorage.setItem(SEEN, JSON.stringify([...ids].slice(-100))); } catch { /* blocked */ } }

/**
 * The dashboard's notification centre: a bell listing the learner's notifications from /api/notifications with an unread badge.
 */
export function NotificationCenter() {
  const { language } = useLanguage(); const hi = language === "hi";
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const first = useRef(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const body = await response.json() as { notifications: AppNotification[]; unread: number };
      setItems(body.notifications); setUnread(body.unread); setLoaded(true);
      // New, unread, non-account notifications are toasted once; on the first load only recent ones.
      const toasted = seen();
      for (const n of body.notifications) {
        if (n.read_at || QUIET.has(n.kind) || toasted.has(n.id)) continue;
        toasted.add(n.id);
        if (first.current && Date.now() - Date.parse(n.created_at) > 10 * 60_000) continue;
        toast(n.title, { description: n.body || undefined });
      }
      remember(toasted); first.current = false;
    } catch { /* offline: try again on the next tick */ }
  }, []);

  useEffect(() => {
    const kick = setTimeout(() => void load(), 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(kick); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  async function mark(body: { ids: string[] } | { all: true }) {
    const now = new Date().toISOString();
    const ids = "ids" in body ? new Set(body.ids) : null;
    setItems(list => list.map(n => !n.read_at && (!ids || ids.has(n.id)) ? { ...n, read_at: now } : n));
    setUnread(count => ids ? Math.max(0, count - items.filter(n => !n.read_at && ids.has(n.id)).length) : 0);
    try { await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); } catch { void load(); }
  }

  const Icon = unread ? BellRing : Bell;
  const label = hi ? `सूचनाएँ${unread ? `, ${unread} अपठित` : ""}` : `Notifications${unread ? `, ${unread} unread` : ""}`;
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) void load(); }}>
    <PopoverTrigger className={styles.bell} aria-label={label} title={label}>
      <Icon size={17} aria-hidden="true" />
      {unread > 0 && <span className={styles.badge} aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
    </PopoverTrigger>
    <PopoverContent align="end" className={styles.panel}>
      <header className={styles.head}>
        <h2>{hi ? "सूचनाएँ" : "Notifications"}</h2>
        {unread > 0 && <button type="button" onClick={() => void mark({ all: true })}><CheckCheck size={14} aria-hidden="true" />{hi ? "सभी पढ़े गए" : "Mark all read"}</button>}
      </header>
      {items.length ? <ol className={styles.list}>{items.map(n => {
        const KindIcon = ICONS[n.kind] ?? Bell;
        const content = <><span className={styles.icon} data-kind={n.kind} aria-hidden="true"><KindIcon size={15} /></span>
          <span className={styles.text}><b>{n.title}</b>{n.body && <small>{n.body}</small>}<time dateTime={n.created_at}>{ago(n.created_at, hi)}</time></span>
          {!n.read_at && <span className={styles.dot} aria-label={hi ? "अपठित" : "Unread"} />}</>;
        return <li key={n.id} data-unread={!n.read_at || undefined}>
          {n.link ? <Link href={n.link} onClick={() => { setOpen(false); if (!n.read_at) void mark({ ids: [n.id] }); }}>{content}</Link>
            : <button type="button" onClick={() => { if (!n.read_at) void mark({ ids: [n.id] }); }}>{content}</button>}
        </li>;
      })}</ol> : <p className={styles.empty}>{loaded ? (hi ? "अभी कोई सूचना नहीं।" : "You are all caught up.") : (hi ? "लोड हो रहा है…" : "Loading…")}</p>}
    </PopoverContent>
  </Popover>;
}
