"use client";

import { Input } from "@/components/ui/input";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CornerDownLeft, GraduationCap, Layers, LayoutGrid, PanelsTopLeft, Search, X, type LucideIcon } from "lucide-react";
import { PRO_TRACKS } from "@/lib/pro-learn/types";
import { CATEGORY_LABELS, PREPARATION_GROUPS, PREPARATIONS, type PreparationAccess } from "@/lib/study/preparations";
import { SYSTEM_DESIGN_COURSES } from "@/lib/study/system-design-catalog";

export type SidebarScope = "all" | "pages" | "professional" | "preparation" | "tracks";
export type SidebarSuggestion = { id: string; label: string; hint: string; scope: Exclude<SidebarScope, "all">; href?: string; tab?: "dashboard" | "library"; keywords: string };

const SCOPES: { id: SidebarScope; icon: LucideIcon; en: string; hi: string }[] = [
  { id: "all", icon: LayoutGrid, en: "All results", hi: "सभी परिणाम" },
  { id: "pages", icon: PanelsTopLeft, en: "Pages", hi: "पेज" },
  { id: "professional", icon: BriefcaseBusiness, en: "Professional learning", hi: "प्रोफ़ेशनल लर्निंग" },
  { id: "preparation", icon: GraduationCap, en: "Exams and courses", hi: "परीक्षाएँ और कोर्स" },
  { id: "tracks", icon: Layers, en: "Technology tracks", hi: "टेक्नोलॉजी ट्रैक" },
];

/** Every destination reachable from the sidebar, in the viewer's language and access. */
export function sidebarSuggestions(access: PreparationAccess, hi: boolean): SidebarSuggestion[] {
  const pick = (label: { en: string; hi: string }) => hi ? label.hi : label.en;
  const pages: SidebarSuggestion[] = [
    { id: "page:dashboard", label: hi ? "डैशबोर्ड" : "Dashboard", hint: hi ? "पेज" : "Page", scope: "pages", tab: "dashboard", keywords: "dashboard home डैशबोर्ड" },
    { id: "page:library", label: hi ? "मेरी लाइब्रेरी" : "My library", hint: hi ? "पेज" : "Page", scope: "pages", tab: "library", keywords: "library documents guides लाइब्रेरी" },
    { id: "page:notes", label: hi ? "नोट्स" : "Notes", hint: hi ? "पेज" : "Page", scope: "pages", href: "/dashboard/notes", keywords: "notes topic cards नोट्स" },
    { id: "page:bookmark", label: "Bookmark", hint: hi ? "पेज" : "Page", scope: "pages", href: "/dashboard/bookmark", keywords: "bookmarks saved" },
  ];
  const professional: SidebarSuggestion[] = [
    ["techy", "Techy", "interview answers quiz code examples corporate english"], ["api-docs", "API Docs", "api reference identifiers hooks functions classes"],
    ["lessons", "Lessons", "lessons articles syllabus reading"], ["quiz", "Quiz", "quiz test multiple choice score"],
    ["interview", "Interview", "interview questions company google meta amazon"], ["mentors", "Mentors", "mentor chat ai tutor ask"],
  ].map(([id, label, keywords]) => ({ id: `pro:${id}`, label, hint: "Profissional Learn", scope: "professional" as const, href: `/dashboard/${id}`, keywords }));
  const options = PREPARATIONS.filter(option => access.isSuperAdmin || access.selections.includes(option.id));
  const preparation: SidebarSuggestion[] = PREPARATION_GROUPS.flatMap(group => group.categories.filter(id => options.some(option => option.category === id)).flatMap(id => [
    { id: `cat:${id}`, label: pick(CATEGORY_LABELS[id]), hint: pick(group.label), scope: "preparation" as const, href: `/dashboard/${id}`, keywords: `${CATEGORY_LABELS[id].en} ${CATEGORY_LABELS[id].hi} ${group.label.en}` },
    ...(id === "system-design" ? SYSTEM_DESIGN_COURSES.map(course => ({ id: `course:${course.id}`, label: pick(course.title), hint: pick(CATEGORY_LABELS[id]), scope: "preparation" as const, href: `/dashboard/${id}?course=${course.id}`, keywords: `${course.title.en} ${course.title.hi}` }))
      : options.filter(option => option.category === id).map(option => ({ id: `prep:${option.id}`, label: pick(option.label), hint: pick(CATEGORY_LABELS[id]), scope: "preparation" as const, href: `/dashboard/${id}?preparation=${encodeURIComponent(option.id)}`, keywords: `${option.label.en} ${option.label.hi} ${CATEGORY_LABELS[id].en}` }))),
  ]));
  const tracks: SidebarSuggestion[] = PRO_TRACKS.map(track => ({ id: `track:${track.id}`, label: `${track.icon} ${track.name}`, hint: hi ? "लेसन ट्रैक" : "Lesson track", scope: "tracks", href: `/dashboard/lessons?track=${track.id}`, keywords: `${track.name} ${track.focus} ${track.syllabus.join(" ")}` }));
  return [...pages, ...professional, ...preparation, ...tracks];
}

export function SidebarSearch({ query, onQueryChange, access, hi, collapsed, onExpand, onNavigateTab }: { query: string; onQueryChange: (value: string) => void; access: PreparationAccess; hi: boolean; collapsed: boolean; onExpand: () => void; onNavigateTab: (tab: "dashboard" | "library") => void }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [scope, setScope] = useState<SidebarScope>("all");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const all = useMemo(() => sidebarSuggestions(access, hi), [access, hi]);
  const normalized = query.trim().toLocaleLowerCase();
  const results = normalized ? all.filter(item => (scope === "all" || item.scope === scope) && `${item.label} ${item.hint} ${item.keywords}`.toLocaleLowerCase().includes(normalized))
    // Label matches rank ahead of keyword-only matches.
    .sort((a, b) => Number(!a.label.toLocaleLowerCase().includes(normalized)) - Number(!b.label.toLocaleLowerCase().includes(normalized))).slice(0, 8) : [];
  const showList = open && !!normalized;
  const current = Math.min(active, Math.max(results.length - 1, 0));

  function choose(item: SidebarSuggestion) {
    setOpen(false); onQueryChange("");
    if (item.tab) onNavigateTab(item.tab); else if (item.href) router.push(item.href);
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setOpen(true); setActive((current + 1) % results.length); }
    else if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setOpen(true); setActive((current - 1 + results.length) % results.length); }
    else if (event.key === "Enter" && showList && results[current]) { event.preventDefault(); choose(results[current]); }
    else if (event.key === "Escape") { if (showList) setOpen(false); else onQueryChange(""); }
  }

  if (collapsed) return <button type="button" className="sidebar-search-collapsed" aria-label={hi ? "साइडबार खोज खोलें" : "Open sidebar search"} onClick={() => { onExpand(); requestAnimationFrame(() => inputRef.current?.focus()); }}><Search size={17}/><span className="sidebar-tooltip">{hi ? "खोजें" : "Search"}</span></button>;
  return <div className="sidebar-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <div className="sidebar-search-field">
      <Search size={14} aria-hidden="true"/>
      <Input ref={inputRef} type="search" aria-label={hi ? "साइडबार में खोजें" : "Search sidebar"} aria-autocomplete="list" aria-controls={listId} aria-activedescendant={showList && results[current] ? `${listId}-${current}` : undefined} placeholder={hi ? "पेज, परीक्षा, कोर्स…" : "Pages, exams, courses…"} value={query} onChange={event => { onQueryChange(event.target.value); setOpen(true); setActive(0); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}/>
      {query && <button type="button" className="sidebar-search-clear" aria-label={hi ? "साइडबार खोज साफ़ करें" : "Clear sidebar search"} onClick={() => { onQueryChange(""); setActive(0); inputRef.current?.focus(); }}><X size={13}/></button>}
    </div>
    <div className="sidebar-search-scopes" role="group" aria-label={hi ? "खोज फ़िल्टर" : "Search filters"}>
      {SCOPES.map(item => <button key={item.id} type="button" aria-pressed={scope === item.id} aria-label={hi ? item.hi : item.en} title={hi ? item.hi : item.en} onClick={() => { setScope(item.id); setActive(0); if (normalized) setOpen(true); }}><item.icon size={14} aria-hidden="true"/></button>)}
    </div>
    {showList && <ul id={listId} role="listbox" aria-label={hi ? "खोज सुझाव" : "Search suggestions"} className="sidebar-search-results">
      {results.map((item, index) => <li key={item.id} id={`${listId}-${index}`} role="option" aria-selected={index === current} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(item)}>
        <span><strong>{item.label}</strong><small>{item.hint}</small></span>{index === current && <CornerDownLeft size={12} aria-hidden="true"/>}
      </li>)}
      {!results.length && <li className="sidebar-search-empty" role="presentation">{hi ? "कोई सुझाव नहीं मिला" : "No matching destinations"}</li>}
    </ul>}
  </div>;
}
