import { privateMetadata } from "@/lib/seo";
export const metadata = { ...privateMetadata, title: "Your learning dashboard" };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
