"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Dashboards close with a one-line footer of their own (components/app-footline.tsx). */
const NO_FOOTER = /^\/(learning|super-admin)(\/|$)/;

/** Keep the shared footer off the sign-in and sign-up screens and the dashboards, including client navigations. */
export function FooterVisibility({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const path = pathname?.replace(/\/+$/, "");
  if (path === "/sign-in" || path === "/sign-up" || NO_FOOTER.test(path ?? "")) return null;
  return <>{children}</>;
}
