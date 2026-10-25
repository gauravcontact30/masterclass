"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "./language-provider";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/domain";
import { Languages, ChevronDown, Check, Globe2, MapPin } from "lucide-react";
import styles from "./language-toggle.module.css";

export interface LanguageToggleProps {
  className?: string;
  persist?: boolean;
  size?: "sm" | "md";
  variant?: "dropdown" | "pills";
}

/**
 * Universal Multi-Language Toggle Component
 * - Default "dropdown" mode: Super-compact, attractive capsule pill button with
 *   translate icon (文A), active country flag, terracotta language code, country tag,
 *   and a chevron that opens an elegant glassmorphic list of all 7 languages with
 *   their country names and flags.
 * - "pills" mode: Compact horizontal pills row if needed.
 */
export function LanguageToggle({
  className = "",
  persist = false,
  size = "md",
  variant = "dropdown",
}: LanguageToggleProps) {
  const { language, setLanguage, detectedCountry, isDetected, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active language metadata
  const currentLang = SUPPORTED_LANGUAGES.find(item => item.code === language) || SUPPORTED_LANGUAGES[0];

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code, persist);
    setIsOpen(false);
  };

  // 1. Compact Attractive Dropdown (Recommended & Default)
  if (variant === "dropdown") {
    return (
      <div ref={containerRef} className={`${styles.dropdownWrapper} ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`${styles.dropdownTrigger} ${size === "sm" ? styles.dropdownTriggerSm : ""}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`${t("language") || "Language"}: ${currentLang.name} (${currentLang.country})`}
          title={`${currentLang.name} · ${currentLang.nativeName} (${currentLang.country})`}
        >
          <Languages size={size === "sm" ? 13 : 14} className={styles.translateIcon} aria-hidden="true" />
          <span className={styles.flagIcon} aria-hidden="true">{currentLang.flag}</span>
          <span className={styles.activeCodeBadge}>{currentLang.code.toUpperCase()}</span>
          <span className={styles.countryTag}>{currentLang.countryCode}</span>
          <ChevronDown size={size === "sm" ? 11 : 12} className={styles.chevronIcon} aria-hidden="true" />
        </button>

        {isOpen && (
          <div
            className={styles.dropdownMenu}
            role="listbox"
            aria-label={t("selectLanguage") || "Select Language & Region"}
          >
            <div className={styles.menuHeader}>
              <span className={styles.menuHeaderTitle}>
                <Globe2 size={12} aria-hidden="true" />
                {t("language") || "Language & Region"}
              </span>
              {isDetected && detectedCountry && (
                <span className={styles.detectedPill} title={t("detectedCountry") || "Detected Location"}>
                  <MapPin size={10} aria-hidden="true" />
                  {detectedCountry}
                </span>
              )}
            </div>

            <ul className={styles.menuList}>
              {SUPPORTED_LANGUAGES.map((item: SupportedLanguage) => {
                const isActive = language === item.code;
                return (
                  <li key={item.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      lang={item.code}
                      className={`${styles.menuOption} ${isActive ? styles.menuOptionActive : ""}`}
                      onClick={() => handleSelect(item.code)}
                      title={`${item.nativeName} (${item.country})`}
                    >
                      <div className={styles.optionLeft}>
                        <span className={styles.optionFlag} aria-hidden="true">{item.flag}</span>
                        <div className={styles.optionDetails}>
                          <span className={styles.optionNativeName}>{item.nativeName}</span>
                          <span className={styles.optionCountryName}>
                            {item.country} · {item.name}
                          </span>
                        </div>
                      </div>

                      <div className={styles.optionRight}>
                        <span className={styles.optionCodeBadge}>{item.code.toUpperCase()}</span>
                        {isActive && <Check size={15} className={styles.checkIcon} aria-hidden="true" />}
                      </div>
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

  // 2. Compact Pills Fallback (if explicitly requested via variant="pills")
  return (
    <div
      className={`${styles.langToggle} ${size === "sm" ? styles.langToggleSm : ""} ${className}`}
      role="group"
      aria-label={t("language") || "Language selection"}
    >
      <Languages size={size === "sm" ? 13 : 14} className={styles.langIcon} aria-hidden="true" />
      <div className={styles.pillsContainer}>
        {SUPPORTED_LANGUAGES.map((item: SupportedLanguage) => {
          const active = language === item.code;
          return (
            <button
              key={item.code}
              type="button"
              lang={item.code}
              aria-pressed={active}
              className={`${styles.langBtn} ${active ? styles.langBtnActive : ""}`}
              onClick={() => handleSelect(item.code)}
              title={`${item.flag} ${item.nativeName} (${item.country})`}
              aria-label={`${item.name} - ${item.nativeName}`}
            >
              {item.code.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
