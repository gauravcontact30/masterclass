"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Info, Megaphone, TriangleAlert, Wrench, X } from "lucide-react";
import styles from "./announcement-banner.module.css";

type Announcement = { id: string; title: string; body: string; tone: "info" | "success" | "warning" | "maintenance" };
const ICON = { info: Info, success: CheckCircle2, warning: TriangleAlert, maintenance: Wrench };
const KEY = "masterclass:dismissed-announcements";

function dismissed(): string[] { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }

/** Live announcements from the super admin, floating over the dashboard until the learner dismisses each one. */
export function AnnouncementBanner() {
  const pathname = usePathname();
  const [items, setItems] = useState<Announcement[]>([]);
  useEffect(() => {
    if (pathname?.startsWith("/dashboard/super-admin")) return;
    const controller = new AbortController();
    fetch("/api/announcements", { signal: controller.signal })
      .then(response => response.ok ? response.json() : { announcements: [] })
      .then((data: { announcements: Announcement[] }) => { const hidden = dismissed(); setItems(data.announcements.filter(item => !hidden.includes(item.id))); })
      .catch(() => {});
    return () => controller.abort();
  }, [pathname]);
  if (!items.length || pathname?.startsWith("/dashboard/super-admin")) return null;
  function close(id: string) {
    try { localStorage.setItem(KEY, JSON.stringify([...dismissed(), id].slice(-50))); } catch { /* private mode */ }
    setItems(list => list.filter(item => item.id !== id));
  }
  return <div className={styles.stack} role="region" aria-label="Announcements">
    {items.map(item => { const Icon = ICON[item.tone] ?? Megaphone; return <div key={item.id} className={styles.card} data-tone={item.tone} role={item.tone === "maintenance" || item.tone === "warning" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <div><b>{item.title}</b><p>{item.body}</p></div>
      <button type="button" onClick={() => close(item.id)} aria-label={`Dismiss: ${item.title}`}><X size={15} /></button>
    </div>; })}
  </div>;
}
