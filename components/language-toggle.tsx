"use client";

import { LanguageSwitcher } from "./language-switcher";

export interface LanguageToggleProps {
  className?: string;
  persist?: boolean;
  size?: "sm" | "md";
}

/**
 * The language control for pages outside the signed-in app (auth, checkout, courses, Tech Buzz). It is the same
 * control as LanguageSwitcher, only defaulting to this browser alone, so the choice is never saved to an account.
 */
export function LanguageToggle({ className, persist = false, size = "md" }: LanguageToggleProps) {
  return <LanguageSwitcher className={className} persist={persist} size={size} />;
}
