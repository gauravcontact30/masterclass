"use client";
import { AccordionChevron } from "@/components/ui/accordion-chevron";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Landmark, Rocket, Languages, Code2, BookOpen, PanelTopOpen, PanelTopClose } from "lucide-react";
import { PREPARATION_GROUPS, PREPARATIONS, CATEGORY_LABELS, type PreparationAccess } from "@/lib/study/preparations";
import { SYSTEM_DESIGN_COURSES } from "@/lib/study/system-design-catalog";
import { useLanguage } from "./language-provider";

/** Preparation groups, filtered by the query typed into the sidebar search. */
export function StudyNavigation({ access, collapsed, category, preparation, course, query = "" }: { access: PreparationAccess; collapsed: boolean; category?: string; preparation?: string; course?: string; query?: string }) {
  const { language } = useLanguage(); const hi = language === "hi";
  const [mobile, setMobile] = useState(false);
  const [groupChoice, setGroupChoice] = useState<{ query: string; id: string | null }>({ query: "", id: null });
  const [childChoice, setChildChoice] = useState<{ query: string; id: string | null }>({ query: "", id: null });
  const normalized = query.trim().toLocaleLowerCase();
  const options = PREPARATIONS.filter(option => access.isSuperAdmin || access.selections.includes(option.id));
  const groups = [...PREPARATION_GROUPS].sort((a, b) => Number(b.categories.some(id => id === category)) - Number(a.categories.some(id => id === category)));
  const visibleGroups = groups.map(group => ({
    ...group,
    matching: group.categories.filter(id => options.some(option => option.category === id)).filter(id => !normalized || [
      group.label.en, group.label.hi, CATEGORY_LABELS[id].en, CATEGORY_LABELS[id].hi,
      ...options.filter(option => option.category === id).flatMap(option => [option.label.en, option.label.hi]),
      ...(id === "system-design" ? SYSTEM_DESIGN_COURSES.flatMap(item => [item.title.en, item.title.hi]) : []),
    ].join(" ").toLocaleLowerCase().includes(normalized)),
  })).filter(group => group.matching.length);
  // Main categories start closed. Only one group and one child accordion can open.
  // A new search reveals its first matching group without changing access.
  const openGroup = groupChoice.query === normalized ? groupChoice.id : normalized ? visibleGroups[0]?.id : null;
  return <div className="study-nav-shell">
    <button className="study-mobile-toggle" aria-expanded={mobile} aria-controls="preparation-navigation" onClick={() => setMobile(value => !value)}>{mobile ? <PanelTopClose size={17}/> : <PanelTopOpen size={17}/>} {hi ? "तैयारी खोजें" : "Browse preparation"}<AccordionChevron /></button>
    <nav id="preparation-navigation" className={`study-navigation ${mobile ? "study-mobile-open" : ""}`} aria-label={hi ? "तैयारी की श्रेणियाँ" : "Preparation categories"}>
      
      {visibleGroups.map(group => {
        const GroupIcon = ({ government: Landmark, entrance: Rocket, boards: GraduationCap, languages: Languages, technology: Code2 })[group.id];
        const groupOpen = openGroup === group.id;
        return <section key={group.id} className="study-nav-group" data-category={group.id}>
          <h3><button className="study-main-trigger" title={group.label[language]} aria-label={group.label[language]} aria-expanded={groupOpen} aria-controls={`mainnav-${group.id}`} onClick={() => { setGroupChoice({ query: normalized, id: groupOpen ? null : group.id }); setChildChoice({ query: normalized, id: null }); }}><GroupIcon size={16} aria-hidden="true"/>{!collapsed && <><span>{group.label[language]}</span><AccordionChevron /></>}</button></h3>
          <div id={`mainnav-${group.id}`} className="study-subnav-slide" data-open={groupOpen} aria-hidden={!groupOpen} inert={!groupOpen}><div className="study-subnav-inner">
            {group.matching.map(id => {
              const children = id === "system-design" ? SYSTEM_DESIGN_COURSES.map(item => ({ id: item.id, label: item.title, url: `/dashboard/${id}?course=${item.id}`, active: course === item.id }))
                : options.filter(option => option.category === id).map(option => ({ id: option.id, label: option.label, url: `/dashboard/${id}?preparation=${encodeURIComponent(option.id)}`, active: preparation === option.id }));
              const matches = children.filter(child => !normalized || `${child.label.en} ${child.label.hi} ${CATEGORY_LABELS[id].en} ${CATEGORY_LABELS[id].hi} ${group.label.en} ${group.label.hi}`.toLocaleLowerCase().includes(normalized));
              const childOpen = childChoice.query === normalized ? childChoice.id === id : !!normalized && group.matching[0] === id;
              if (collapsed) return <Link className="study-short-link" key={id} href={`/dashboard/${id}`} title={CATEGORY_LABELS[id][language]} aria-label={CATEGORY_LABELS[id][language]} aria-current={category === id ? "page" : undefined}>{CATEGORY_LABELS[id].en.slice(0, 3).toUpperCase()}</Link>;
              return <div key={id} className="study-nav-category"><button className="study-nav-trigger" aria-expanded={childOpen} aria-controls={`subnav-${id}`} onClick={() => setChildChoice({ query: normalized, id: childOpen ? null : id })}><BookOpen size={14}/><span>{CATEGORY_LABELS[id][language]}</span><small aria-hidden="true">{children.length}</small><AccordionChevron /></button>
                <div id={`subnav-${id}`} className="study-subnav-slide" data-open={childOpen} aria-hidden={!childOpen} inert={!childOpen}><div className="study-subnav-inner"><Link className="study-all-link" href={`/dashboard/${id}`} aria-current={category === id && !preparation && !course ? "page" : undefined}>{CATEGORY_LABELS[id][language]}</Link>{matches.map(child => <Link key={child.id} href={child.url} aria-current={child.active ? "page" : undefined} onClick={() => setMobile(false)}>{child.label[language]}</Link>)}</div></div>
              </div>;
            })}
          </div></div>
        </section>;
      })}
      {!visibleGroups.length && normalized && <p className="study-nav-empty">{hi ? "कोई चयनित पथ नहीं मिला।" : "No selected paths match."}</p>}
    </nav>
  </div>;
}
