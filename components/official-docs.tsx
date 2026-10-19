"use client";
import { AccordionChevron } from "@/components/ui/accordion-chevron";

import { ImportedDocumentation } from "./documentation-refresh";
import learningCard from "./learning-card.module.css";
import { LearningPicture } from "@/components/learning-picture";
import { learningImageUrl } from "@/lib/learning-image";
import { useState, useMemo, useCallback, useEffect, type CSSProperties } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code2,
  ExternalLink,
  Layers,
  Search,
  Sparkles,
  Terminal,
  Lightbulb,
  X,
  ArrowRight,
  SlidersHorizontal,
  Workflow,
  Binary,
  Database,
  Bot,
  Cloud,
  Shield,
  RotateCcw,
  LayoutGrid,
} from "lucide-react";
import {
  OFFICIAL_DOCS,
  OFFICIAL_DOCS_CATEGORIES,
  type OfficialTechnologyDoc,
  type OfficialDocsCategory,
} from "@/lib/official-docs-data";
import { OfficialDocsLearning } from "./official-docs-learning";
import { OfficialDocsDirectory } from "./official-docs-directory";
import { COMPLEX_DOCS_PROJECTS } from "@/lib/official-docs-complex";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { pageWindow } from "./pager";
import { OfficialDocsReader } from "./official-docs-reader";
import styles from "./official-docs.module.css";

export const CARDS_PER_PAGE = 6;
export const CATEGORIES_PER_PAGE = 3;

/**
 * Pastel tone washes that harmonize with the platform's cream ground.
 * Gives every card a distinct, elegant aesthetic matching 'On The Go' and 'Search'.
 */
export const CARD_TONES = [
  { bg: "#fbeee6", ink: "#9a4a2c" },
  { bg: "#eaf1e6", ink: "#5f6f45" },
  { bg: "#e6f0f7", ink: "#2f5f82" },
  { bg: "#efeaf7", ink: "#5e4a8f" },
  { bg: "#fbf3dc", ink: "#7a5d10" },
  { bg: "#f8e8ec", ink: "#8f3a55" },
  { bg: "#e3f3ef", ink: "#26695a" },
  { bg: "#f3ede3", ink: "#6b5536" },
  { bg: "#e8ebf8", ink: "#3f4c93" },
  { bg: "#e2f1f4", ink: "#1f6474" },
  { bg: "#f5e9f5", ink: "#7b3f7b" },
  { bg: "#eff1e0", ink: "#5b6320" },
] as const;

export const toneStyle = (tone: number): CSSProperties =>
  ({
    "--tone": CARD_TONES[tone % CARD_TONES.length].bg,
    "--tone-ink": CARD_TONES[tone % CARD_TONES.length].ink,
  } as CSSProperties);

/**
 * 8 distinct, elegant light pastel palettes for Key Points cards
 */
export const KEY_POINT_TONES = [
  { bg: "#f0f7fc", border: "#cbe3f7", ink: "#194a6e" }, // Sky Blue
  { bg: "#f6f1fc", border: "#e3d3f8", ink: "#4a2c7a" }, // Soft Lavender
  { bg: "#f2f8f0", border: "#d1e9cc", ink: "#28591f" }, // Mint Sage
  { bg: "#fdf7ec", border: "#f6e2be", ink: "#734c08" }, // Warm Amber
  { bg: "#fdf2f4", border: "#f9d1d8", ink: "#85253b" }, // Rose Blossom
  { bg: "#f0f9fa", border: "#c8ebee", ink: "#155864" }, // Sea Cyan
  { bg: "#f3f4fd", border: "#d5daf9", ink: "#263688" }, // Indigo Slate
  { bg: "#eef9f5", border: "#c3edd7", ink: "#145f3c" }, // Emerald Teal
] as const;

/**
 * Distinct light color tints & icons for each category pill
 */
export const CATEGORY_CONFIG: Record<
  OfficialDocsCategory,
  {
    bg: string;
    ink: string;
    border: string;
    icon: typeof BookOpen;
  }
> = {
  All: {
    bg: "#f6f4ee",
    ink: "#4a483f",
    border: "#dedad0",
    icon: BookOpen,
  },
  "Backend & APIs": {
    bg: "#e8f5f1",
    ink: "#286b58",
    border: "#9ac7b8",
    icon: Code2,
  },
  "Frontend Frameworks": {
    bg: "#e6f0f7",
    ink: "#1d4f73",
    border: "#bdd7eb",
    icon: Layers,
  },
  "State Management": {
    bg: "#efeaf7",
    ink: "#4e357d",
    border: "#d5c7ea",
    icon: Workflow,
  },
  "State & Data Libraries": {
    bg: "#eaf1e6",
    ink: "#3d5c2e",
    border: "#c6ddbc",
    icon: Binary,
  },
  "Databases & Storage": {
    bg: "#fbf3dc",
    ink: "#6e4f07",
    border: "#eed89d",
    icon: Database,
  },
  "Testing & Quality": {
    bg: "#f8e8ec",
    ink: "#7c2640",
    border: "#ebbac7",
    icon: CheckCircle2,
  },
  "Languages & Fundamentals": {
    bg: "#e3f3ef",
    ink: "#1b584a",
    border: "#b9dfd5",
    icon: Code2,
  },
  "AI & Agents": {
    bg: "#e8ebf8",
    ink: "#2c3983",
    border: "#c1cded",
    icon: Bot,
  },
  "DevOps & Cloud": {
    bg: "#e2f1f4",
    ink: "#125465",
    border: "#b8dde4",
    icon: Cloud,
  },
  "Tooling & CI/CD": {
    bg: "#f5e9f5",
    ink: "#652765",
    border: "#e4c4e4",
    icon: Terminal,
  },
  "Security & Infrastructure": {
    bg: "#eff1e0",
    ink: "#474f13",
    border: "#d5dbaa",
    icon: Shield,
  },
};

/**
 * Numbered pagination controls matching 'On The Go' (components/step-by-step.tsx)
 */
function CardPagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Official docs pagination">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={14} aria-hidden="true" />
        Previous
      </Button>
      <div className={styles.pageNumbers}>
        {pageWindow(page, pages).map((index, position) =>
          index === "gap" ? (
            <span
              key={`gap-${position}`}
              className={styles.pageGap}
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={index}
              type="button"
              size="icon-sm"
              variant={index === page ? "default" : "ghost"}
              aria-label={`Page ${index + 1}`}
              aria-current={index === page ? "page" : undefined}
              onClick={() => onPage(index)}
            >
              {index + 1}
            </Button>
          )
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page === pages - 1}
        onClick={() => onPage(page + 1)}
        aria-label="Next page"
      >
        Next
        <ChevronRight size={14} aria-hidden="true" />
      </Button>
    </nav>
  );
}

export function OfficialDocs() {
  const [websiteId, setWebsiteId] = useState("react");
  const [selectedCategory, setSelectedCategory] = useState<OfficialDocsCategory>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [categoryPage, setCategoryPage] = useState<number>(0);
  const [isExpandedCategories, setIsExpandedCategories] = useState<boolean>(false);
  const [advanced, setAdvanced] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"default" | "name" | "features" | "commands">("default");
  const [requireCli, setRequireCli] = useState<boolean>(false);
  const [requireCode, setRequireCode] = useState<boolean>(false);
  const [requireComplex, setRequireComplex] = useState(false);
  const [requireBestPractices, setRequireBestPractices] = useState<boolean>(false);
  const [selectedModalDoc, setSelectedModalDoc] = useState<OfficialTechnologyDoc | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [customDocOrder, setCustomDocOrder] = useState<string[]>([]);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("masterclass:official-docs-order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          queueMicrotask(() => setCustomDocOrder(parsed));
        }
      }
    } catch {}
  }, []);

  const toggleCardSelection = useCallback((id: string) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const moveDoc = useCallback((sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setCustomDocOrder((prevOrder) => {
      const defaultIds = OFFICIAL_DOCS.map((d) => d.id);
      const base = prevOrder.length > 0 ? [...prevOrder] : defaultIds;
      // Ensure all IDs are in list
      for (const id of defaultIds) {
        if (!base.includes(id)) base.push(id);
      }
      const sourceIndex = base.indexOf(sourceId);
      const targetIndex = base.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prevOrder;

      const updated = [...base];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);

      try {
        localStorage.setItem("masterclass:official-docs-order", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const resetCardOrder = useCallback(() => {
    setCustomDocOrder([]);
    try {
      localStorage.removeItem("masterclass:official-docs-order");
    } catch {}
  }, []);

  // Compute live count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: OFFICIAL_DOCS.length };
    for (const doc of OFFICIAL_DOCS) {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    }
    return counts;
  }, []);

  // Filtered & sorted documentation cards
  const filteredDocs = useMemo(() => {
    let list = OFFICIAL_DOCS.filter((doc) => {
      const matchesCategory =
        selectedCategory === "All" || doc.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const compactQuery = query.replace(/[^a-z0-9]/g, "");
      const matchesQuery =
        !query ||
        (compactQuery.length > 0 && doc.title.toLowerCase().replace(/[^a-z0-9]/g, "").includes(compactQuery)) ||
        (doc.id === "aws" && "aws all services".includes(query)) ||
        doc.title.toLowerCase().includes(query) ||
        doc.tagline.toLowerCase().includes(query) ||
        doc.overview.en.toLowerCase().includes(query) ||
        doc.keyFeatures.some((f) => f.title.toLowerCase().includes(query)) ||
        doc.keyPoints.some((p) => p.toLowerCase().includes(query));
      if (!matchesCategory || !matchesQuery) return false;
      if (requireComplex && !COMPLEX_DOCS_PROJECTS[doc.id]) return false;
      if (requireCli && doc.cliCommands.length === 0) return false;
      if (requireCode && !doc.codeExample.code) return false;
      if (requireBestPractices && doc.bestPractices.length === 0) return false;
      return true;
    });

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "features") {
      list = [...list].sort((a, b) => b.keyFeatures.length - a.keyFeatures.length);
    } else if (sortBy === "commands") {
      list = [...list].sort((a, b) => b.cliCommands.length - a.cliCommands.length);
    } else if (customDocOrder.length > 0) {
      const orderMap = new Map(customDocOrder.map((id, index) => [id, index]));
      list = [...list].sort((a, b) => {
        const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
        const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
        return idxA - idxB;
      });
    }
    return list;
  }, [selectedCategory, searchQuery, sortBy, requireCli, requireCode, requireComplex, requireBestPractices, customDocOrder]);

  // Categories list excluding 'All' for pagination
  const nonAllCategories = useMemo(
    () => OFFICIAL_DOCS_CATEGORIES.filter((c) => c !== "All"),
    []
  );
  const categoryPages = Math.ceil(nonAllCategories.length / CATEGORIES_PER_PAGE);
  const shownCategories = useMemo(() => {
    if (isExpandedCategories) return nonAllCategories;
    const start = categoryPage * CATEGORIES_PER_PAGE;
    return nonAllCategories.slice(start, start + CATEGORIES_PER_PAGE);
  }, [isExpandedCategories, categoryPage, nonAllCategories]);

  // Total pages and sliced items for cards pagination
  const totalPages = Math.ceil(filteredDocs.length / CARDS_PER_PAGE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const displayedDocs = useMemo(() => {
    const start = safePage * CARDS_PER_PAGE;
    return filteredDocs.slice(start, start + CARDS_PER_PAGE);
  }, [filteredDocs, safePage]);

  // Handle category switch
  const handleCategoryChange = useCallback((cat: OfficialDocsCategory) => {
    setSelectedCategory(cat);
    setPage(0);
  }, []);

  // Handle search query change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
  }, []);

  // Reset all filters
  const resetAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSortBy("default");
    setRequireCli(false);
    setRequireCode(false);
    setRequireComplex(false);
    setRequireBestPractices(false);
    setPage(0);
    setCategoryPage(0);
  }, []);

  const startIndex = safePage * CARDS_PER_PAGE;
  const endIndex = Math.min(startIndex + CARDS_PER_PAGE, filteredDocs.length);

  return (
    <div className={styles.page}>
      {/* Eyebrow and Page Header matching 'Search' and 'On The Go' */}
      <header className={styles.head}>
        <div className={styles.eyebrow}>
          <Sparkles size={13} aria-hidden="true" />
          <span>Developer reference</span>
        </div>
        <div className={styles.headTitleRow}>
          <div>
            <h1 className={styles.heading}>Official Documentation Hub</h1>
            <p className={styles.subheading}>
              Key concepts for {OFFICIAL_DOCS.length} technologies, with learning objectives, highlighted takeaways, and rated questions with answers.
            </p>
          </div>
        </div>
      </header>

      <ImportedDocumentation technologyId={websiteId} />
      <OfficialDocsReader selectedId={websiteId} onSelect={setWebsiteId} />

      {/* Sticky Search & Filter Toolbar with Advance Search & Clear Search */}
      <section id="documentation-catalog" className={styles.panel} aria-label="Search and filter documentation">
        <div className={styles.catalogHeadingRow}>
          <div className={styles.catalogHeading}><h2>Explore the documentation</h2><p>Find your next framework, tool, or concept.</p></div>
          <button type="button" className={styles.complexFilter} aria-pressed={requireComplex} onClick={() => { setRequireComplex(value => !value); setPage(0); }}>
            <Code2 size={15} aria-hidden="true" /> Complex projects <span>{Object.keys(COMPLEX_DOCS_PROJECTS).length}</span>
          </button>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.field}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              placeholder={`Search ${OFFICIAL_DOCS.length} technologies...`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
              aria-label="Search technologies"
            />
            <div className={styles.searchActions}>
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={styles.clearSearchBtn}
                  onClick={() => handleSearchChange("")}
                  aria-label="Clear search query"
                >
                  <X size={13} aria-hidden="true" />
                  <span>Clear</span>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdvanced((v) => !v)}
                className={`${styles.advancedToggleBtn} ${advanced ? styles.advancedToggleActive : ""}`}
                aria-expanded={advanced}
                aria-controls="advanced-filter-panel"
                aria-label="Toggle advanced filters"
              >
                <SlidersHorizontal size={13} aria-hidden="true" />
                <span>Filters</span>
                <AccordionChevron />
              </Button>
            </div>
          </div>
        </div>

        {/* Collapsible/Expandable Advanced Filters Panel */}
        {advanced && (
          <div id="advanced-filter-panel" className={styles.advancedDrawer}>
            <div className={styles.advancedHeader}>
              <span className={styles.advancedTitle}>
                <SlidersHorizontal size={13} aria-hidden="true" />
                Advanced Filtering &amp; Sorting
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={resetAllFilters}
                className={styles.resetFiltersBtn}
              >
                <RotateCcw size={12} aria-hidden="true" />
                Reset Filters
              </Button>
            </div>

            <div className={styles.advancedGrid}>
              {/* Sort Order */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Sort Order</span>
                <div className={styles.filterPills}>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${sortBy === "default" ? styles.filterSubPillActive : ""}`}
                    onClick={() => setSortBy("default")}
                  >
                    Verified Order
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${sortBy === "name" ? styles.filterSubPillActive : ""}`}
                    onClick={() => setSortBy("name")}
                  >
                    Alphabetical (A–Z)
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${sortBy === "features" ? styles.filterSubPillActive : ""}`}
                    onClick={() => setSortBy("features")}
                  >
                    Most Features
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${sortBy === "commands" ? styles.filterSubPillActive : ""}`}
                    onClick={() => setSortBy("commands")}
                  >
                    Most CLI Commands
                  </button>
                </div>
              </div>

              {/* Required Content Flags */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Required Content</span>
                <div className={styles.filterPills}>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${requireCli ? styles.filterSubPillActive : ""}`}
                    onClick={() => setRequireCli((v) => !v)}
                  >
                    <Terminal size={12} aria-hidden="true" />
                    Has CLI Workflows
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${requireCode ? styles.filterSubPillActive : ""}`}
                    onClick={() => setRequireCode((v) => !v)}
                  >
                    <Code2 size={12} aria-hidden="true" />
                    Has Annotated Code
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${requireBestPractices ? styles.filterSubPillActive : ""}`}
                    onClick={() => setRequireBestPractices((v) => !v)}
                  >
                    <Lightbulb size={12} aria-hidden="true" />
                    Has Best Practices
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Elegant Light Color Pills with Pagination & Collapse/Expand */}
        <div className={styles.categoryToolbar}>
          <div id="catalog-category-tabs" className={styles.categoryNavLeft} role="tablist" aria-label="Technology Categories">
            {/* 'All' category pill is always pinned */}
            {(() => {
              const isAll = selectedCategory === "All";
              const config = CATEGORY_CONFIG["All"];
              const AllIcon = config.icon;
              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isAll}
                  style={
                    {
                      "--cat-bg": config.bg,
                      "--cat-ink": config.ink,
                      "--cat-border": config.border,
                    } as CSSProperties
                  }
                  className={`${styles.categoryPill} ${isAll ? styles.categoryPillActive : ""}`}
                  onClick={() => handleCategoryChange("All")}
                >
                  <AllIcon size={13} className={styles.pillIcon} aria-hidden="true" />
                  <span>All</span>
                  <span className={styles.pillCount}>{categoryCounts["All"]}</span>
                </button>
              );
            })()}

            {/* Paged/Expanded light color technology type pills */}
            <div
              className={`${styles.categoryPillsWrap} ${isExpandedCategories ? styles.categoryPillsExpanded : ""}`}
            >
              {shownCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const config = CATEGORY_CONFIG[cat];
                const IconComponent = config.icon;
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    style={
                      {
                        "--cat-bg": config.bg,
                        "--cat-ink": config.ink,
                        "--cat-border": config.border,
                      } as CSSProperties
                    }
                    className={`${styles.categoryPill} ${isSelected ? styles.categoryPillActive : ""}`}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    <IconComponent size={13} className={styles.pillIcon} aria-hidden="true" />
                    <span>{cat}</span>
                    <span className={styles.pillCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          </div>

        <div className={styles.catalogFooter}>
          <div className={styles.filterMetaRow} role="status" aria-live="polite" aria-atomic="true">
            <span className={styles.countText}>
              {filteredDocs.length > 0
                ? `Showing ${startIndex + 1}–${endIndex} of ${filteredDocs.length} technologies`
                : "0 technologies match your query"}
            </span>
            {searchQuery && <span className={styles.queryIndicator}>Filtered by: “<strong>{searchQuery}</strong>”</span>}
          </div>

          {/* Category controls sit below the tabs, at the bottom right. */}
          <div className={styles.categoryControls}>
            {!isExpandedCategories && categoryPages > 1 && (
              <nav className={styles.categoryPagination} aria-label="Category pages">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setCategoryPage((p) => Math.max(0, p - 1))}
                  disabled={categoryPage === 0}
                  aria-label="Previous categories"
                  className={styles.catPageBtn}
                >
                  <ChevronLeft size={13} aria-hidden="true" />
                </Button>
                <span className={styles.catPageIndicator} aria-live="polite" aria-atomic="true">
                  {categoryPage + 1} / {categoryPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setCategoryPage((p) => Math.min(categoryPages - 1, p + 1))}
                  disabled={categoryPage === categoryPages - 1}
                  aria-label="Next categories"
                  className={styles.catPageBtn}
                >
                  <ChevronRight size={13} aria-hidden="true" />
                </Button>
              </nav>
            )}

            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setIsExpandedCategories((v) => !v)}
              className={styles.expandCategoriesBtn}
              aria-expanded={isExpandedCategories}
              aria-controls="catalog-category-tabs"
              aria-label={isExpandedCategories ? "Collapse categories to single row" : "Expand all categories"}
            >
              {isExpandedCategories ? (
                <>
                  <ChevronUp size={12} aria-hidden="true" />
                  <span>Show fewer</span>
                </>
              ) : (
                <>
                  <LayoutGrid size={12} aria-hidden="true" />
                  <span>Show all categories</span>
                </>
              )}
            </Button>
          </div>
        </div>

      </section>

      {/* Cards Grid */}
      {(selectedCards.size > 0 || customDocOrder.length > 0) && (
        <div className={styles.selectionBar}>
          {selectedCards.size > 0 && (
            <span className={styles.selectedCount}>
              <Check size={13} aria-hidden="true" />
              {selectedCards.size} card{selectedCards.size === 1 ? "" : "s"} selected
            </span>
          )}
          {selectedCards.size > 0 && (
            <Button size="xs" variant="outline" onClick={() => setSelectedCards(new Set())}>
              Clear selection
            </Button>
          )}
          {customDocOrder.length > 0 && (
            <Button size="xs" variant="ghost" onClick={resetCardOrder} title="Reset cards to default order">
              <RotateCcw size={12} aria-hidden="true" />
              Reset card order
            </Button>
          )}
        </div>
      )}
      {displayedDocs.length > 0 ? (
        <div className={styles.grid}>
          {displayedDocs.map((doc, idx) => {
            const globalIdx = startIndex + idx;
            const isChecked = selectedCards.has(doc.id);
            const isDragging = draggedCardId === doc.id;
            const isDragOver = dragOverCardId === doc.id && draggedCardId !== doc.id;
            return (
              <Card
                key={doc.id}
                role="article"
                draggable
                className={`${styles.card} ${learningCard.card}`}
                style={toneStyle(globalIdx)}
                data-dragging={isDragging ? "true" : undefined}
                data-dragover={isDragOver ? "true" : undefined}
                data-checked={isChecked ? "true" : undefined}
                aria-label={`${doc.title} official documentation`}
                onClick={() => setSelectedModalDoc(doc)}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", doc.id);
                  e.dataTransfer.effectAllowed = "move";
                  setDraggedCardId(doc.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverCardId !== doc.id) {
                    setDragOverCardId(doc.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverCardId === doc.id) {
                    setDragOverCardId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const sourceId = e.dataTransfer.getData("text/plain") || draggedCardId;
                  if (sourceId && sourceId !== doc.id) {
                    moveDoc(sourceId, doc.id);
                  }
                  setDraggedCardId(null);
                  setDragOverCardId(null);
                }}
                onDragEnd={() => {
                  setDraggedCardId(null);
                  setDragOverCardId(null);
                }}
              >
                <LearningPicture variant="card" className={styles.cardPicture} src={learningImageUrl("docs", [doc.id])} alt={`Illustration of how ${doc.title} works`} />
                {/* Drag & Drop handler icon on top left corner */}
                <div
                  className={styles.cardDragHandle}
                  title="Drag & drop to reposition card"
                  aria-label="Drag & drop to reposition card"
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData("text/plain", doc.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedCardId(doc.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical size={16} aria-hidden="true" />
                </div>

                {/* Clickable checkbox on top right corner */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  className={styles.cardCheckbox}
                  title={isChecked ? "Deselect card" : "Select card"}
                  aria-label={`Select ${doc.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCardSelection(doc.id);
                  }}
                >
                  <span className={styles.cardCheckboxInner}>
                    {isChecked && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                  </span>
                </button>

                <CardHeader className={styles.cardHead}>
                  <div className={styles.cardTop}>
                    <Badge className={styles.toneBadge}>{doc.category}</Badge>
                    <Badge variant="outline" className={styles.softBadge}>
                      {doc.version}
                    </Badge>
                  </div>
                  <h2 className={styles.cardTitle}>{doc.title}</h2>
                </CardHeader>

                <CardContent className={styles.cardBody}>
                  <p className={styles.cardText}>{doc.tagline}</p>

                  <ul className={styles.catalogPoints}>
                    {doc.keyFeatures.slice(0, 3).map(feature => <li key={feature.title}>{feature.title}</li>)}
                  </ul>
                  <p className={styles.cardMeta}>3 key concepts · 5 questions with answers</p>
                  {COMPLEX_DOCS_PROJECTS[doc.id] && <p className={styles.complexCardNote}><Code2 size={13} aria-hidden="true" /> Complete Complex codebase · {COMPLEX_DOCS_PROJECTS[doc.id].files.filter(file => !/(^|\/)(\.gitignore|README\.md)$/i.test(file.path)).length} files</p>}
                  {doc.id === "aws" && <p className={styles.complexCardNote}>AWS All Services · searchable service and API directory</p>}
                </CardContent>

                {/* Elegant Footer: Clean tone integration, no dark muted bar */}
                <CardFooter className={styles.cardFoot}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label={`Read ${doc.title} website here`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setWebsiteId(doc.id);
                      const reader = document.getElementById("official-website-reader");
                      reader?.focus({ preventScroll: true });
                      reader?.scrollIntoView?.({ block: "start" });
                    }}
                  >
                    <BookOpen size={13} aria-hidden="true" /> Learn &amp; browse
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={styles.viewButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModalDoc(doc);
                    }}
                    aria-label={`Explore ${doc.title} documentation`}
                  >
                    <span>Open study guide</span>
                    <ArrowRight size={13} className={styles.arrowIcon} aria-hidden="true" />
                  </Button>
                  <a
                    href={doc.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cardExtLink}
                    title={`Visit ${doc.title} official documentation website`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Visit ${doc.title} official website`}
                  >
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <BookOpen size={36} className={styles.emptyIcon} aria-hidden="true" />
          <h3 className={styles.emptyTitle}>No matching documentation found</h3>
          <p className={styles.emptyText}>
            No technologies match “{searchQuery}” in category “{selectedCategory}”.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetAllFilters}
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      <div className={styles.paginationWrapper}>
        <CardPagination
          page={safePage}
          pages={totalPages}
          onPage={(p) => {
            setPage(p);
            if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
              try {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } catch {
                // Environment without smooth scroll support
              }
            }
          }}
        />
      </div>

      {/* Elegant Full Documentation Modal Window */}
      <Dialog
        open={!!selectedModalDoc}
        onOpenChange={(open) => {
          if (!open) setSelectedModalDoc(null);
        }}
      >
        <DialogContent className={styles.modalContent} showCloseButton={true}>
          {selectedModalDoc && (
            <div className={styles.modalBody}>
              {/* Modal Top Header */}
              <DialogHeader className={styles.modalHeader}>
                <div className={styles.modalBadges}>
                  <Badge className={styles.modalCategoryBadge}>
                    {selectedModalDoc.category}
                  </Badge>
                  <Badge variant="outline" className={styles.modalVersionBadge}>
                    {selectedModalDoc.version}
                  </Badge>
                </div>

                <DialogTitle className={styles.modalTitle}>
                  {selectedModalDoc.title}
                </DialogTitle>

                <DialogDescription className={styles.modalTagline}>
                  {selectedModalDoc.tagline}
                </DialogDescription>

                <LearningPicture src={learningImageUrl("docs", [selectedModalDoc.id])} alt={`Illustration of how ${selectedModalDoc.title} works`} />

                {/* External Links */}
                <div className={styles.modalLinksRow}>
                  <a
                    href={selectedModalDoc.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.modalLinkBtn} ${styles.modalLinkPrimary}`}
                  >
                    Official Documentation <ExternalLink size={13} aria-hidden="true" />
                  </a>
                  {selectedModalDoc.githubUrl && (
                    <a
                      href={selectedModalDoc.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.modalLinkBtn}
                    >
                      GitHub Repository <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </DialogHeader>

              <OfficialDocsLearning key={selectedModalDoc.id} doc={selectedModalDoc} idPrefix={`modal-learning-${selectedModalDoc.id}`} />
              {selectedModalDoc.id === "aws" && <OfficialDocsDirectory docId="aws" />}

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedModalDoc(null)}
                >
                  Close guide
                </Button>
                <a
                  href={selectedModalDoc.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.modalFooterExtLink}
                >
                  Visit Official Website <ExternalLink size={13} aria-hidden="true" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
