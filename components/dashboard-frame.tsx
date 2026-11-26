import { Suspense } from "react";
import { LearningMarksProvider } from "@/components/learning-marks";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { AuthNoticeToast } from "@/components/auth-notice-toast";

/**
 * The Learning Dashboard's and Super Admin console's shared frame (app/(learning)/learning/layout.tsx,
 * app/(admin)/super-admin/layout.tsx). The banner reads usePathname(), which is request data on /learning/[category];
 * its own boundary keeps it out of the page's render. AuthNoticeToast sits outside the page, so the sign-in toast does
 * not wait for the whole dashboard to hydrate. Highlighting and personal text edits (LearningRegion) exist only in the
 * dashboards, so their provider and its ~30 KB of client code load here instead of on every public page.
 */
export function DashboardFrame({ children }: { children: React.ReactNode }) {
  return <><AuthNoticeToast /><LearningMarksProvider>{children}</LearningMarksProvider><Suspense fallback={null}><AnnouncementBanner /></Suspense></>;
}
