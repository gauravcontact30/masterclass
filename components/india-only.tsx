"use client";
import type { ReactNode } from "react";
import { useIndiaAccess } from "./audience-provider";

/** Renders its children only for visitors in India (server geo decision, components/audience-provider.tsx). */
export function IndiaOnly({ children }: { children: ReactNode }) {
  return useIndiaAccess() ? children : null;
}
