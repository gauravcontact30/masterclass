"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Keep the shared footer off the sign-in and sign-up screens, including client navigations. */
export function FooterVisibility({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const path = pathname?.replace(/\/+$/, "");
  if (path === "/sign-in" || path === "/sign-up") return null;
  return <>{children}</>;
}
