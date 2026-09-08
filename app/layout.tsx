import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import { authConfigured } from "@/lib/server/config";
import "./globals.css";
export const metadata: Metadata = { title: "Masterclass | Learn one step at a time", description: "Step-by-step technology and AI learning guides in English and Hindi." };
export default function RootLayout({ children }: {children: React.ReactNode}) {
  return <html lang="en" className="h-full antialiased"><body className="min-h-full"><AppProviders authEnabled={authConfigured()}>{children}</AppProviders></body></html>;
}
