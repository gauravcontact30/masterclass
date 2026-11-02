import { PageBack } from "@/components/page-back";
import { privateMetadata } from "@/lib/seo";
export const metadata = { ...privateMetadata, title: "Sign in" };
export default function Layout({ children }: { children: React.ReactNode }) { return <><PageBack />{children}</>; }
