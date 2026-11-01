"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { SUPPORT } from "@/lib/site-contact";

const [user, domain] = SUPPORT.email.split("@");
const noSubscribe = () => () => {};

/**
 * The support email, kept out of the page's HTML so address harvesters (and SEO checkers' "plaintext email" test) find
 * nothing: the visible text is rendered as separate text nodes (React puts a comment between them, so no
 * `name@domain` string exists in the markup) and the `mailto:` link is attached only after hydration; until then it
 * points at the Contact page. It reads lib/site-contact.ts itself, so the address never travels as a server prop in
 * the RSC payload either.
 */
export function EmailLink({ className, children }: Readonly<{ className?: string; children?: ReactNode }>) {
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return <a className={className} href={hydrated ? `mailto:${user}@${domain}` : "/contact"}>{children}{user}{"@"}{domain}</a>;
}
