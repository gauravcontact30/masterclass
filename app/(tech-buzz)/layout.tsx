import { SiteChrome } from "@/app/(site)/site-chrome";

/*
 * Route group for every /tech-buzz page (the hub and each story). Group folders add nothing to the URL, so the
 * paths are unchanged; the site header and footer are shared with (site), and tech-buzz/layout.tsx widens the page.
 */
export default function TechBuzzGroupLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
