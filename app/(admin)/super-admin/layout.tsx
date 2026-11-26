import { privateMetadata } from "@/lib/seo";
import { DashboardFrame } from "@/components/dashboard-frame";
// The dashboards' shared global styles, as in the Learning Dashboard (app/(learning)/learning/layout.tsx).
import "@/app/dashboard.css";

// The Super Admin console lives in its own route group, (admin), at /super-admin (it was /dashboard/super-admin until
// 2026-10-25). It shares the Learning Dashboard's private metadata, frame and announcement banner, but not the
// learners' Study Buddy launcher.
export const metadata = { ...privateMetadata, title: "Your learning dashboard" };
// The console renders once its data is ready, with no loading screen.
export const instant = false;
export default function Layout({ children }: { children: React.ReactNode }) { return <DashboardFrame>{children}</DashboardFrame>; }
