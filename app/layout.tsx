import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import { StudentChatbot } from "@/components/student-chatbot";
import "./globals.css";
import { isIndexable, siteDescription, siteTitle, siteUrl } from "@/lib/seo";
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: siteTitle, template: "%s | MasterClass" },
  description: siteDescription,
  applicationName: "MasterClass",
  robots: { index: isIndexable(), follow: true },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
};
export default function RootLayout({ children }: {children: React.ReactNode}) {
  return <html lang="en" className="h-full antialiased"><body className="min-h-full"><AppProviders>{children}<StudentChatbot /></AppProviders></body></html>;
}
