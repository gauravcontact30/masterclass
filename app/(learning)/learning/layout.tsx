import { Suspense } from "react";
import { privateMetadata } from "@/lib/seo";
import { AnnouncementBanner } from "@/components/announcement-banner";
export const metadata = { ...privateMetadata, title: "Your learning dashboard" };
// The banner reads usePathname(), which is request data on /learning/[category]; its own boundary keeps it out of
// the prerendered shell (the dashboard's loading.tsx only wraps the pages below this layout, not the layout itself).
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}<Suspense fallback={null}><AnnouncementBanner /></Suspense></>; }
