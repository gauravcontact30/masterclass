"use client";

import { useId, useMemo, useState } from "react";
import { Check, ChevronDown, Search, Sparkles, Star, Type, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { loadGoogleFont } from "@/lib/google-fonts";
import { READING_FONTS, type FontOption } from "@/lib/tech-buzz-public";
import styles from "./font-family-dropdown.module.css";

export interface FontFamilyDropdownProps {
  value: string;
  onChange: (value: string) => void;
  /** "Reset to default" calls this instead of selecting `defaultVal`, e.g. to restore the site's own typography. */
  onReset?: () => void;
  fonts?: FontOption[];
  ariaLabel?: string;
  variant?: "pill" | "toolbar";
  valueType?: "id" | "name";
  defaultVal?: string;
  className?: string;
  matchTriggerWidth?: boolean;
}

export function FontFamilyDropdown({
  value,
  onChange,
  onReset,
  fonts: passedFonts,
  ariaLabel = "Font family",
  variant = "pill",
  valueType = "id",
  defaultVal = "georgia",
  className,
  matchTriggerWidth = false,
}: FontFamilyDropdownProps) {
  const fonts: FontOption[] = passedFonts ?? READING_FONTS;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const selectId = useId();

  // Find the currently active font
  const activeFont = useMemo(() => {
    if (valueType === "name") {
      return (
        fonts.find(f => f.name.toLowerCase() === value.toLowerCase()) ??
        fonts.find(f => f.id.toLowerCase() === value.toLowerCase()) ??
        fonts[0]
      );
    }
    return fonts.find(f => f.id === value) ?? fonts[0];
  }, [fonts, value, valueType]);

  // Categories list with counts
  const categories = useMemo(() => {
    return [
      { id: "All", label: "All", count: fonts.length },
      { id: "Top-Rated", label: "⭐ 5.0★ Rated", count: fonts.filter(f => (f.rating ?? 5.0) >= 5.0).length },
      { id: "Sans-Serif", label: "Sans-Serif", count: fonts.filter(f => f.category === "Sans-Serif").length },
      { id: "Serif", label: "Serif", count: fonts.filter(f => f.category === "Serif").length },
      { id: "Monospace", label: "Monospace", count: fonts.filter(f => f.category === "Monospace").length },
      { id: "Display/Creative", label: "Creative", count: fonts.filter(f => f.category === "Display/Creative").length },
    ].filter(cat => cat.id === "All" || cat.count > 0);
  }, [fonts]);

  // Filtered fonts based on search and selected category
  const filteredFonts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fonts.filter(font => {
      const matchesCategory =
        selectedCategory === "All"
          ? true
          : selectedCategory === "Top-Rated"
          ? (font.rating ?? 5.0) >= 5.0
          : font.category === selectedCategory;
      const matchesSearch = !q || font.name.toLowerCase().includes(q) || font.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [fonts, search, selectedCategory]);

  const handleSelect = (font: FontOption) => {
    loadGoogleFont(font.name);
    const nextVal = valueType === "name" ? font.name : font.id;
    onChange(nextVal);
    setOpen(false);
    setSearch("");
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
      setOpen(false);
      setSearch("");
      return;
    }
    const target = fonts.find(f => (valueType === "name" ? f.name === defaultVal : f.id === defaultVal)) ?? fonts[0];
    if (target) {
      handleSelect(target);
    }
  };

  // Grouped fonts for the accessible select element
  const serifFonts = useMemo(() => fonts.filter(f => f.category === "Serif"), [fonts]);
  const sansFonts = useMemo(() => fonts.filter(f => f.category === "Sans-Serif"), [fonts]);
  const monoFonts = useMemo(() => fonts.filter(f => f.category === "Monospace"), [fonts]);
  const creativeFonts = useMemo(() => fonts.filter(f => f.category === "Display/Creative"), [fonts]);

  return (
    <div className={`${styles.wrapper} ${matchTriggerWidth ? styles.wrapperFullWidth : ""} ${className ?? ""}`}>
      {/* Accessible native select for full assistive tech & automated testing compatibility */}
      <select
        id={selectId}
        aria-label={ariaLabel}
        value={value}
        suppressHydrationWarning
        onChange={e => {
          const val = e.target.value;
          const selected = fonts.find(f => (valueType === "name" ? f.name === val : f.id === val));
          if (selected) {
            loadGoogleFont(selected.name);
          }
          onChange(val);
        }}
        className={styles.accessibleSelect}
      >
        {serifFonts.length > 0 && (
          <optgroup label="Serif (Editorial & Books)">
          {serifFonts.map(f => (
            <option key={f.id} value={valueType === "name" ? f.name : f.id}>
              {f.name}
            </option>
          ))}
        </optgroup>
        )}
        {sansFonts.length > 0 && (
          <optgroup label="Sans-Serif (Modern & Crisp)">
          {sansFonts.map(f => (
            <option key={f.id} value={valueType === "name" ? f.name : f.id}>
              {f.name}
            </option>
          ))}
        </optgroup>
        )}
        {monoFonts.length > 0 && (
          <optgroup label="Monospace & Technical">
          {monoFonts.map(f => (
            <option key={f.id} value={valueType === "name" ? f.name : f.id}>
              {f.name}
            </option>
          ))}
        </optgroup>
        )}
        {creativeFonts.length > 0 && (
          <optgroup label="Handwriting & Creative">
            {creativeFonts.map(f => (
              <option key={f.id} value={valueType === "name" ? f.name : f.id}>
                {f.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {/* Modern Shadcn UI Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          aria-label={`Open ${ariaLabel.toLowerCase()} picker`}
          aria-expanded={open}
          suppressHydrationWarning
          className={`${variant === "toolbar" ? styles.toolbarTrigger : styles.pillTrigger} ${matchTriggerWidth ? styles.triggerFullWidth : ""}`}
          data-state={open ? "open" : "closed"}
          title={`Font family: ${activeFont ? activeFont.name : "Default"} (${(activeFont?.rating ?? 5.0).toFixed(1)}★)`}
        >
          <Type size={variant === "toolbar" ? 15 : 14} className={styles.triggerIcon} aria-hidden="true" />
          <span className={styles.fontName} data-own-font style={{ fontFamily: activeFont?.stack }}>
            {activeFont ? activeFont.name : "Font"}
          </span>
          <span className={styles.triggerRating} aria-label={`Rating: ${(activeFont?.rating ?? 5.0).toFixed(1)} out of 5 stars`}>
            <Star size={11} className={styles.starIcon} fill="#eab308" color="#eab308" aria-hidden="true" />
            <span>{(activeFont?.rating ?? 5.0).toFixed(1)}</span>
          </span>
          {activeFont && (
            <span className={styles.badgePill} data-cat={activeFont.category}>
              {activeFont.category === "Display/Creative" ? "Script" : activeFont.category.replace("-Serif", "")}
            </span>
          )}
          <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className={`${styles.popoverCard} ${matchTriggerWidth ? styles.popoverMatchAnchor : ""}`}
        >
          {/* Header */}
          <div className={styles.popoverHeader}>
            <div className={styles.popoverTitleGroup}>
              <Sparkles size={14} className={styles.triggerIcon} aria-hidden="true" />
              <h3 className={styles.popoverTitle}>Google Fonts Library</h3>
            </div>
            <div className={styles.headerBadges}>
              <span className={styles.starHeaderBadge}>
                <Star size={11} fill="#eab308" color="#eab308" aria-hidden="true" /> Top Rated
              </span>
              <span className={styles.countBadge}>{fonts.length} Fonts</span>
            </div>
          </div>

          {/* Search Box */}
          <div className={styles.searchBox}>
            <Search size={14} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={`Search ${fonts.length} fonts (e.g. Inter, Roboto)…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus={open}
            />
            {search && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={11} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className={styles.categoryBar} role="tablist" aria-label="Font categories">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                data-active={selectedCategory === cat.id ? "true" : undefined}
                className={styles.categoryChip}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Scrollable Font List */}
          <div className={styles.fontList} role="listbox" aria-label="Font options">
            {filteredFonts.length === 0 ? (
              <div className={styles.emptyState}>No fonts match &ldquo;{search}&rdquo;</div>
            ) : (
              filteredFonts.map(font => {
                const isSelected =
                  valueType === "name"
                    ? font.name.toLowerCase() === value.toLowerCase()
                    : font.id === value;

                return (
                  <button
                    key={font.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected ? "true" : undefined}
                    className={styles.fontItem}
                    onMouseEnter={() => loadGoogleFont(font.name)}
                    onClick={() => handleSelect(font)}
                  >
                    <div className={styles.fontItemText}>
                      <div className={styles.fontItemHeader}>
                        <span className={styles.fontItemName}>{font.name}</span>
                        <div className={styles.fontItemBadges}>
                          <span className={styles.starRatingBadge} title={`Google popularity rating: ${(font.rating ?? 5.0).toFixed(1)}/5 (${font.reviewsCount ?? "10M+"} uses)`}>
                            <Star size={10} className={styles.starIcon} fill="#eab308" color="#eab308" aria-hidden="true" />
                            <span>{(font.rating ?? 5.0).toFixed(1)}</span>
                            {font.reviewsCount && <span className={styles.reviewsCount}>· {font.reviewsCount}</span>}
                          </span>
                          <span className={styles.badgePill} data-cat={font.category}>
                            {font.category === "Display/Creative" ? "Script" : font.category.replace("-Serif", "")}
                          </span>
                        </div>
                      </div>
                      <div className={styles.fontItemPreview} data-own-font style={{ fontFamily: font.stack }}>
                        Sphinx of black quartz, judge my vow · 123
                      </div>
                    </div>

                    <div className={styles.fontItemRight}>
                      {isSelected && <Check size={16} className={styles.checkIcon} aria-hidden="true" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with Active Font Preview & Reset */}
          <div className={styles.popoverFooter}>
            <div className={styles.activeFontSample} data-own-font style={{ fontFamily: activeFont?.stack }}>
              Current: {activeFont?.name}
            </div>
            <button type="button" className={styles.resetBtn} onClick={handleReset}>
              Reset to default
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
