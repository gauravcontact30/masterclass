import { SiteChrome } from "./site-chrome";
import { JsonLd } from "@/components/json-ld";
import { organizationSchema } from "@/lib/seo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <><JsonLd data={organizationSchema()} /><SiteChrome>{children}</SiteChrome></>;
}
