import { privateMetadata } from "@/lib/seo";
import { AnnouncementBanner } from "@/components/announcement-banner";
export const metadata = { ...privateMetadata, title: "Your learning dashboard" };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}<AnnouncementBanner /></>; }
