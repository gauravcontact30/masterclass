import { SiteChrome } from "@/app/(site)/site-chrome";
import { JsonLd } from "@/components/json-ld";
import { StreamsHeader } from "@/components/streams-header";
import { organizationSchema } from "@/lib/seo";

/*
 * Route group for /streams (MCB Streams): the shared site footer, with Streams' own header, laid out like Tech Buzz.
 * Group folders add nothing to the URL.
 */
export default function StreamsGroupLayout({ children }: { children: React.ReactNode }) {
  return <><JsonLd data={organizationSchema()} /><SiteChrome header={<StreamsHeader />}>{children}</SiteChrome></>;
}
