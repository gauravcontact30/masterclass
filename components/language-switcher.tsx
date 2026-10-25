"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Languages, MapPin } from "lucide-react";
import { useLanguage } from "./language-provider";
import { FlagIcon } from "./flag-icon";
import type { Language } from "@/lib/domain";
import styles from "./language-switcher.module.css";

export interface LanguageSwitcherProps {
  className?: string;
  /** Save the choice to the signed-in account as well as this browser. */
  persist?: boolean;
  size?: "sm" | "md";
}

/**
 * The one language control used across the app (landing, auth, checkout, courses, Tech Buzz, dashboards): the
 * language symbol, the country flag and the language's own name, opening a list of every language with its flag,
 * country and code. The list renders into document.body and is placed against the viewport, so a header with
 * overflow, a transform or a narrow phone screen can never clip it. Phones show a round flag-only trigger.
 */
export function LanguageSwitcher({ className = "", persist = true, size = "md" }: LanguageSwitcherProps) {
  const { language, setLanguage, languages, detectedCountry, isDetected, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const current = languages.find(item => item.code === language) ?? languages[0];

  const position = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
    setPlace({ top: Math.round(rect.bottom + 8), left: Math.round(left), width });
  }, []);

  useLayoutEffect(() => { if (open) position(); }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    // Keyboard users land on the current language.
    popoverRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, position]);

  const choose = (code: Language) => { setLanguage(code, persist); setOpen(false); triggerRef.current?.focus(); };
  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const options = [...(popoverRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
    const at = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (at + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  };

  return <div className={`${styles.wrapper} ${className}`} data-size={size}>
    <button ref={triggerRef} type="button" className={styles.trigger} aria-expanded={open} aria-haspopup="listbox"
      aria-label={`${t("language") || "Language"}: ${current.nativeName} (${current.country})`} title={`${current.nativeName} · ${current.country}`}
      onClick={() => setOpen(value => !value)}>
      <Languages size={15} strokeWidth={2} className={styles.symbol} aria-hidden="true" />
      <FlagIcon country={current.countryCode} size={20} className={styles.flag} />
      <span className={styles.label}>{current.nativeName}</span>
      <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
    </button>

    {open && typeof document !== "undefined" && createPortal(
      <div ref={popoverRef} className={styles.popover} style={place} role="dialog" aria-label={t("selectLanguage") || "Select language"}>
        <div className={styles.popoverHeader}>
          <span><Languages size={14} strokeWidth={2} aria-hidden="true" />{t("selectLanguage") || "Select language"}</span>
          {isDetected && detectedCountry && <span className={styles.geoBadge} title={t("detectedCountry")}><MapPin size={11} aria-hidden="true" />{detectedCountry}</span>}
        </div>
        <ul className={styles.list} role="listbox" aria-label={t("selectLanguage") || "Select language"} onKeyDown={onListKey}>
          {languages.map(item => {
            const selected = item.code === language;
            return <li key={item.code}>
              <button type="button" role="option" aria-selected={selected} className={styles.item} lang={item.code} onClick={() => choose(item.code)}>
                <FlagIcon country={item.countryCode} size={26} />
                <span className={styles.itemText}>
                  <span className={styles.itemNative}>{item.nativeName}</span>
                  <span className={styles.itemMeta}>{item.country} · {item.name}</span>
                </span>
                <span className={styles.code}>{item.code.toUpperCase()}</span>
                <Check size={16} strokeWidth={2.4} className={styles.itemCheck} aria-hidden="true" />
              </button>
            </li>;
          })}
        </ul>
      </div>, document.body)}
  </div>;
}
