import { privateMetadata } from "@/lib/seo";
import { DashboardFrame } from "@/components/dashboard-frame";
import { StudentChatbot } from "@/components/student-chatbot";
// The dashboards' own global styles (app shell, sidebar, workspace), split out of globals.css so public pages skip them.
// app/(admin)/super-admin/layout.tsx imports them too.
import "@/app/dashboard.css";
export const metadata = { ...privateMetadata, title: "Your learning dashboard" };
// Dashboard pages render once the signed-in user and their content are ready, with no loading screen.
export const instant = false;
// Study Buddy is in the server HTML here, so it paints with the page instead of after hydration (components/student-chatbot.tsx).
export default function Layout({ children }: { children: React.ReactNode }) { return <DashboardFrame>{children}<StudentChatbot /></DashboardFrame>; }
