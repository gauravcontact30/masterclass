import { privateMetadata } from "@/lib/seo";
export const metadata = { ...privateMetadata, title: "UI review" };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
