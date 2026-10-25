"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe2, MapPin } from "lucide-react";
import { useLanguage } from "./language-provider";
import type { Language } from "@/lib/domain";
import type { SupportedLanguage } from "@/lib/i18n";
import styles from "./language-switcher.module.css";

export interface LanguageSwitcherProps {
  className?: string;
  variant?: "dropdown" | "compact" | "navbar";
  showLabel?: boolean;
}

export function LanguageSwitcher({
  className = "",
  variant = "dropdown",
  showLabel = true,
}: LanguageSwitcherProps) {
  const { language, setLanguage, languages, detectedCountry, isDetected, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = languages.find(l => l.code === language) ?? languages[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selectLang = (code: Language) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`${styles.wrapper} ${className}`}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t("language")}: ${current.nativeName} (${current.country})`}
        onClick={() => setOpen(prev => !prev)}
        title={t("selectLanguage")}
      >
        <span className={styles.flag} aria-hidden="true">{current.flag}</span>
        {showLabel && <span className={styles.label}>{current.nativeName}</span>}
        <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
      </button>

      {open && (
        <div className={styles.popover} role="listbox" aria-label={t("selectLanguage")}>
          <div className={styles.popoverHeader}>
            <span>{t("selectLanguage")}</span>
            {isDetected && detectedCountry && (
              <span className={styles.geoBadge} title={t("detectedCountry")}>
                <MapPin size={11} aria-hidden="true" />
                {detectedCountry}
              </span>
            )}
          </div>
          <ul className={styles.list}>
            {languages.map((item: SupportedLanguage) => {
              const selected = item.code === language;
              return (
                <li key={item.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={styles.item}
                    onClick={() => selectLang(item.code)}
                  >
                    <div className={styles.itemLeft}>
                      <span className={styles.itemFlag} aria-hidden="true">{item.flag}</span>
                      <div className={styles.itemText}>
                        <span className={styles.itemNative}>{item.nativeName}</span>
                        <span className={styles.itemMeta}>{item.country} · {item.name}</span>
                      </div>
                    </div>
                    {selected && <Check size={16} className={styles.itemCheck} aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
