import { privateMetadata } from "@/lib/seo";
export const metadata = { ...privateMetadata, title: "Sign in" };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
