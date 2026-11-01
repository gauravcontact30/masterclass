import { Suspense } from "react";
import { privateMetadata } from "@/lib/seo";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { AuthNoticeToast } from "@/components/auth-notice-toast";
// The dashboards' own global styles (app shell, sidebar, workspace), split out of globals.css so public pages skip them.
// app/(admin)/super-admin/layout.tsx re-exports this layout, so the console gets them too.
import "@/app/dashboard.css";
export const metadata = { ...privateMetadata, title: "Your learning dashboard" };
// The banner reads usePathname(), which is request data on /learning/[category]; its own boundary keeps it out of
// the page's render. Dashboard pages render once the signed-in user and their content are ready, with no loading screen.
// AuthNoticeToast sits outside the page, so the sign-in toast no longer waits for the whole dashboard to hydrate.
export const instant = false;
export default function Layout({ children }: { children: React.ReactNode }) { return <><AuthNoticeToast />{children}<Suspense fallback={null}><AnnouncementBanner /></Suspense></>; }
