import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";
export const metadata: Metadata = { title: "MasterClass | Learn one step at a time", description: "Step-by-step technology and AI learning guides in English and Hindi, generated as PDF or PowerPoint." };
export default function RootLayout({ children }: {children: React.ReactNode}) {
  return <html lang="en" className="h-full antialiased"><body className="min-h-full"><AppProviders>{children}</AppProviders></body></html>;
}
