"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  BrainCircuit,
  Boxes,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Cloud,
  Code2,
  Database,
  FlaskConical,
  Layers,
  LayoutTemplate,
  type LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ApiPackage } from "@/lib/api-docs";
import ref from "./api-reference.module.css";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  agentic: Sparkles,
  ai: BrainCircuit,
  languages: Code2,
  frontend: LayoutTemplate,
  backend: Server,
  auth: ShieldCheck,
  data: Database,
  testing: FlaskConical,
  platform: Cloud,
};

const PREFS_KEY = "masterclass:api-index";

type Category = { id: string; label: string; packages: ApiPackage[] };

/**
 * Tooltips are drawn in a portal at fixed coordinates, because the index
 * scrolls on its own and would clip anything positioned inside it. Any
 * element inside the index with data-tip gets one on hover or keyboard focus.
 */
function useIndexTooltip(container: React.RefObject<HTMLElement | null>) {
  const [tip, setTip] = useState<{ text: string; top: number; left: number } | null>(null);
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    let active: HTMLElement | null = null;
    const hide = () => {
      active = null;
      setTip(null);
    };
    const show = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-tip]") : null;
      if (!target || !root.contains(target) || target === active) return;
      // Keyboard focus shows the tooltip only for visible focus, not after a mouse click.
      if (event.type === "focusin" && !target.matches(":focus-visible")) return;
      active = target;
      const rect = target.getBoundingClientRect();
      setTip({
        text: target.dataset.tip ?? "",
        top: Math.max(16, Math.min(window.innerHeight - 16, rect.top + rect.height / 2)),
        left: rect.right + 10,
      });
    };
    const leave = (event: Event) => {
      const next = (event as MouseEvent | FocusEvent).relatedTarget;
      if (active && !(next instanceof Node && active.contains(next))) hide();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    root.addEventListener("mouseover", show);
    root.addEventListener("focusin", show);
    root.addEventListener("mouseout", leave);
    root.addEventListener("focusout", leave);
    root.addEventListener("click", hide);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("keydown", escape);
    return () => {
      root.removeEventListener("mouseover", show);
      root.removeEventListener("focusin", show);
      root.removeEventListener("mouseout", leave);
      root.removeEventListener("focusout", leave);
      root.removeEventListener("click", hide);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("keydown", escape);
    };
  }, [container]);
  return tip;
}

export function ApiPackageIndex({
  categories,
  packageId,
  total,
  rail,
  onRailChange,
  onChoose,
  renderMark,
}: {
  categories: Category[];
  packageId: string;
  total: number;
  rail: boolean;
  onRailChange: (rail: boolean) => void;
  onChoose: (id: string) => void;
  renderMark: (pkg: ApiPackage) => ReactNode;
}) {
  const navRef = useRef<HTMLElement>(null);
  const tip = useIndexTooltip(navRef);
  const [closed, setClosed] = useState<string[]>([]);
  const loaded = useRef(false);

  // Restore saved preferences after mount so the server render and first client render match.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as { rail?: boolean; closed?: string[] };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reads a client-only preference after mount; the initial state must match SSR output.
      if (Array.isArray(saved.closed)) setClosed(saved.closed);
      if (typeof saved.rail === "boolean") onRailChange(saved.rail);
    } catch {}
    loaded.current = true;
    // Runs once on mount by design; onRailChange is a stable state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ rail, closed }));
    } catch {}
  }, [rail, closed]);

  const allOpen = closed.length === 0;
  const activeCategory = categories.find(category => category.packages.some(pkg => pkg.id === packageId))?.id;

  function toggleGroup(id: string) {
    setClosed(previous => (previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]));
  }

  function openFromRail(id: string) {
    setClosed(previous => previous.filter(item => item !== id));
    onRailChange(false);
    requestAnimationFrame(() => document.getElementById(`api-index-group-${id}`)?.scrollIntoView({ block: "nearest" }));
  }

  return (
    <nav ref={navRef} className={ref.index} data-rail={rail || undefined} aria-label="Browse packages">
      <div className={ref.indexTop}>
        {!rail && <span className={ref.indexTitle}>Packages</span>}
        {!rail && (
          <button
            type="button"
            className={ref.indexIconButton}
            aria-label={allOpen ? "Collapse all categories" : "Expand all categories"}
            data-tip={allOpen ? "Collapse all categories" : "Expand all categories"}
            onClick={() => setClosed(allOpen ? categories.map(category => category.id) : [])}
          >
            {allOpen ? <ChevronsDownUp size={15} aria-hidden="true" /> : <ChevronsUpDown size={15} aria-hidden="true" />}
          </button>
        )}
        <button
          type="button"
          className={ref.indexIconButton}
          aria-expanded={!rail}
          aria-label={rail ? "Expand package list" : "Collapse package list"}
          data-tip={rail ? "Expand package list" : "Collapse package list"}
          onClick={() => onRailChange(!rail)}
        >
          {rail ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
        </button>
      </div>

      <button
        type="button"
        className={ref.indexAll}
        aria-pressed={packageId === "all"}
        aria-label={rail ? `All packages, ${total.toLocaleString("en-US")} identifiers` : undefined}
        data-tip={`All packages · ${total.toLocaleString("en-US")} identifiers`}
        onClick={() => onChoose("all")}
      >
        <Layers size={16} aria-hidden="true" className={ref.indexIcon} />
        {!rail && (
          <>
            <span className={ref.indexName}>All packages</span>
            <span className={ref.count}>{total.toLocaleString("en-US")}</span>
          </>
        )}
      </button>

      {categories.map(category => {
        const Icon = CATEGORY_ICONS[category.id] ?? Boxes;
        const open = !closed.includes(category.id);
        const identifiers = category.packages.reduce((sum, pkg) => sum + pkg.entries.length, 0);
        const summary = `${category.label} · ${category.packages.length} packages, ${identifiers.toLocaleString("en-US")} identifiers`;
        if (rail) {
          return (
            <button
              key={category.id}
              type="button"
              className={ref.railCategory}
              data-active={activeCategory === category.id || undefined}
              aria-label={`${category.label}, ${category.packages.length} packages. Expand the package list to browse`}
              data-tip={summary}
              onClick={() => openFromRail(category.id)}
            >
              <Icon size={17} aria-hidden="true" />
            </button>
          );
        }
        return (
          <div className={ref.indexGroup} key={category.id} id={`api-index-group-${category.id}`}>
            <button
              type="button"
              className={ref.indexHeading}
              aria-expanded={open}
              aria-controls={`api-index-list-${category.id}`}
              data-active={activeCategory === category.id || undefined}
              data-tip={summary}
              onClick={() => toggleGroup(category.id)}
            >
              <Icon size={15} aria-hidden="true" className={ref.indexIcon} />
              <span className={ref.indexName}>{category.label}</span>
              <span className={ref.count}>{category.packages.length}</span>
              <ChevronDown size={14} aria-hidden="true" className={ref.groupChevron} />
            </button>
            <ul id={`api-index-list-${category.id}`} aria-label={category.label} hidden={!open}>
              {category.packages.map(pkg => (
                <li key={pkg.id}>
                  <button
                    type="button"
                    className={ref.indexItem}
                    aria-pressed={packageId === pkg.id}
                    data-tip={`${pkg.name} · ${pkg.entries.length} identifiers`}
                    onClick={() => onChoose(packageId === pkg.id ? "all" : pkg.id)}
                  >
                    <span className={ref.indexMark} aria-hidden="true">
                      {renderMark(pkg)}
                    </span>
                    <span className={ref.indexName}>{pkg.name}</span>
                    <span className={ref.count}>{pkg.entries.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {tip &&
        createPortal(
          <div className={ref.indexTooltip} style={{ top: tip.top, left: tip.left }} aria-hidden="true">
            {tip.text}
          </div>,
          document.body
        )}
    </nav>
  );
}
