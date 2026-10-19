"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";
import { ExpandedText } from "@/components/expanded-text";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, GraduationCap, NotebookText, SlidersHorizontal, Compass, ArrowDownUp } from "lucide-react";
import { fill, paginate } from "@/lib/library";
import { LearningCard, LearningLibraryHeading, LearningLibraryPager } from "./learning-library-parts";
import { Button } from "./ui/button";
import libraryStyles from "./library.module.css";
import { requestJson } from "@/lib/client";
import { canReadStudy, courseCategory, CATEGORY_LABELS, PREPARATIONS, type PreparationAccess } from "@/lib/study/preparations";
import { SUBJECTS } from "@/lib/study/catalog";
import type { StudyCourse, StudyPack } from "@/lib/study/types";
import { useLanguage } from "./language-provider";
import { StudyReader } from "./study-reader";
import styles from "./study.module.css";
import classStyles from "./class-sections.module.css";
import { LearningFilters, type LearningFilter } from "./learning-filters";
/** `beforeLibrary` renders between the search panel and the class sections, so one panel sits at the top of the page. */
export function StudyCatalog({beforeLibrary,category,preparations,onPlans,initialPreparation="",initialCourse,searchQuery,onSearchChange,initialCourses}: {category?:string;preparations:PreparationAccess;onPlans:()=>void;initialPreparation?:string;initialCourse?:string;searchQuery?:string;onSearchChange?:(value:string)=>void;initialCourses?:StudyCourse[];beforeLibrary?:ReactNode}) {
  const {language,t}=useLanguage(); const headingId=useId(); const sectionRef=useRef<HTMLElement>(null); const hi=language==="hi";
  const [courses,setCourses]=useState<StudyCourse[]>(initialCourses??[]);const [localSearch,setSearch]=useState("");const search=searchQuery??localSearch;
  const [path,setPath]=useState(initialPreparation);const [grade,setGrade]=useState("");const [subject,setSubject]=useState("");const [sort,setSort]=useState("curriculum");
  const [loading,setLoading]=useState(!initialCourses);const [error,setError]=useState(false);const [retry,setRetry]=useState(0);
  const [selected,setSelected]=useState<string|null>(initialCourse??null);const [pack,setPack]=useState<StudyPack|null>(null);const [opening,setOpening]=useState(!!initialCourse);
  const selectionKey=preparations.selections.join(",");
  useEffect(()=>{if(initialCourses)return;let active=true;requestJson<{courses:StudyCourse[]}>("/api/study").then(data=>{if(active){setCourses(data.courses);setError(false);}}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[selectionKey,preparations.isSuperAdmin,retry,initialCourses]);
  useEffect(()=>{if(!selected)return;let active=true;requestJson<{pack:StudyPack}>(`/api/study/${encodeURIComponent(selected)}?language=${language}`).then(data=>{if(active){setPack(data.pack);setError(false);}}).catch(()=>{if(active){setError(true);setSelected(null);}}).finally(()=>{if(active)setOpening(false);});return()=>{active=false;};},[selected,language]);
  const available=courses.filter(course=>canReadStudy(preparations,course)&&(!category||courseCategory(course)===category));
  const pathId=(course:StudyCourse)=>course.category==="course"?"system-design":course.board?`${course.board}-${course.grade}`:course.id;
  const pathOptions=PREPARATIONS.filter(option=>available.some(course=>pathId(course)===option.id));
  const scoped=available.filter(course=>!path||pathId(course)===path);
  const grades=[...new Set(scoped.flatMap(course=>course.grade?[course.grade]:[]))].sort((a,b)=>a-b);
  const subjects=[...new Set(scoped.filter(course=>!grade||course.grade===Number(grade)).flatMap(course=>course.subjects))];
  const visible=scoped.filter(course=>(!grade||course.grade===Number(grade))&&(!subject||course.subjects.includes(subject as keyof typeof SUBJECTS))&&`${course.title.en} ${course.title.hi} ${course.aliases.join(" ")} ${course.subjects.map(id=>SUBJECTS[id].en+" "+SUBJECTS[id].hi).join(" ")}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a,b)=>sort==="curriculum"?0:sort==="class"?(a.grade??99)-(b.grade??99)||a.title[language].localeCompare(b.title[language],language):a.title[language].localeCompare(b.title[language],language)*(sort==="za"?-1:1));
  const pagingKey=JSON.stringify([category,path,grade,subject,search,sort,language,selectionKey]);
  const classGrades=[...new Set(visible.flatMap(course=>course.grade?[course.grade]:[]))].sort((a,b)=>a-b);
  const groups=[
    ...classGrades.map(value=>({id:`class-${value}`,title:`${hi?"कक्षा":"Class"} ${value}`,courses:visible.filter(course=>course.grade===value)})),
    ... (visible.some(course=>!course.grade)?[{id:"other",title:classGrades.length?(hi?"परीक्षाएँ और कोर्स":"Exams & courses"):undefined,courses:visible.filter(course=>!course.grade)}]:[]),
  ];
  const filtered=!!(path||grade||subject||search||sort!=="curriculum");
  const updateSearch=onSearchChange??setSearch;
  function reset(){setPath("");setGrade("");setSubject("");updateSearch("");setSort("curriculum");}
  const filters:LearningFilter[]=[
    {id:"preparation",label:hi?"तैयारी":"Preparation",icon:Compass,value:path,defaultValue:"",options:[{value:"",label:hi?"सभी चयनित पथ":"All selected paths"},...pathOptions.map(option=>({value:option.id,label:option.label[language]}))],onChange:value=>{setPath(value);setGrade("");setSubject("");}},
    ...(grades.length?[{id:"class",label:hi?"कक्षा":"Class",icon:GraduationCap,value:grade,defaultValue:"",options:[{value:"",label:hi?"सभी कक्षाएँ":"All classes"},...grades.map(value=>({value:String(value),label:`${hi?"कक्षा":"Class"} ${value}`}))],onChange:(value:string)=>{setGrade(value);setSubject("");}}]:[]),
    {id:"subject",label:hi?"विषय":"Subject",icon:BookOpen,value:subject,defaultValue:"",options:[{value:"",label:hi?"सभी विषय":"All subjects"},...subjects.map(id=>({value:id,label:SUBJECTS[id][language]}))],onChange:setSubject},
    {id:"sort",label:hi?"क्रम":"Sort by",icon:ArrowDownUp,value:sort,defaultValue:"curriculum",options:[{value:"curriculum",label:hi?"पाठ्य क्रम":"Learning order"},{value:"az",label:hi?"नाम: अ–ज्ञ":"Name: A–Z"},{value:"za",label:hi?"नाम: ज्ञ–अ":"Name: Z–A"},{value:"class",label:hi?"कक्षा: छोटी से बड़ी":"Class: low to high"}],onChange:setSort},
  ];
  return <>
    <LearningFilters search={search} onSearchChange={updateSearch} searchLabel={searchQuery===undefined?(hi?"नोट्स खोजें":"Search notes"):(hi?"अपने सभी नोट्स खोजें":"Search all your learning")} filters={filters} loading={loading} total={visible.length} size={hi?`${available.length} गाइड`:`${available.length} ${available.length===1?"guide":"guides"}`} onReset={reset}/>
    {beforeLibrary}
    <section ref={sectionRef} className={`${styles.catalog} ${libraryStyles.library}`} aria-labelledby={headingId}>
    <div className={libraryStyles.header}><LearningLibraryHeading id={headingId} total={available.length} /></div>
    <div className={libraryStyles.toolbar}>
      <p className={libraryStyles.hint}><NotebookText size={13} aria-hidden="true" /><ExpandedText text={hi?"किसी भी गाइड को ऐप में खोलें और पाठ दर पाठ सीखें।":"Open any guide in Learn in App: lesson by lesson, at your own pace."} /></p>
    </div>
    {error&&<p role="alert" className={styles.notice}><ExpandedText text={hi?"सामग्री नहीं खुली। सदस्यता और चयन जाँचें।":"Could not open the content. Check your membership and selections."} /><button onClick={()=>setRetry(value=>value+1)}><ExpandedText text={hi?"फिर प्रयास करें":"Retry"} /></button><button onClick={onPlans}><ExpandedText text={hi?"सदस्यता":"Membership"} /></button></p>}
    {loading&&<ul className={libraryStyles.grid} aria-hidden="true">{[0,1,2].map(i=><li key={i} className={libraryStyles.skeleton}><span/><span/><span/></li>)}</ul>}
    {!loading&&<>{groups.map(group=><StudyCourseSection key={`${pagingKey}:${group.id}`} title={group.title} courses={group.courses} renderCourse={(course, dragProps)=>{
      const title=course.grade&&course.subject?SUBJECTS[course.subject][language]:course.title[language];
      const CardHeading=group.title?"h4":"h3";
      const titleId=`${headingId}-${course.id}`;
      const categoryLabel=CATEGORY_LABELS[courseCategory(course)][language];
      return <li className={libraryStyles.item} key={course.id}>
        <LearningCard title={title} titleId={titleId} accentId={course.subject??course.subjects[0]??courseCategory(course)} label={course.subject?SUBJECTS[course.subject][language]:categoryLabel} {...dragProps}>
          <div className={libraryStyles.meta}>
            <span className={libraryStyles.status} data-status="ready">{t("ready")}</span>
            <span className={libraryStyles.lang} lang={language}>{hi?"हिन्दी":"English"}</span>
          </div>
          <CardHeading id={titleId} className={libraryStyles.title} title={title}>{title}</CardHeading>
          <p className={libraryStyles.sub}><span>{categoryLabel}</span>{course.subjects.map(id=><span key={id}>{SUBJECTS[id][language]}</span>)}</p>
          <details className={libraryStyles.coverage}><AccordionSummary>{hi?"कवरेज देखें":"View coverage"}</AccordionSummary><p>{course.scope[language]} {course.category!=="course"&&(hi?"आधारभूत पाठ और मौलिक अभ्यास; पूरा पाठ्यक्रम नहीं।":"Foundation lessons and original practice; not a complete syllabus.")}</p></details>
          <div className={libraryStyles.actions}>
            <Button size="sm" className={libraryStyles.learn} disabled={opening} aria-label={`${t("learn")}: ${course.title[language]}`} onClick={()=>{setPack(null);setSelected(course.id);setOpening(true);}}><BookOpen size={14} aria-hidden="true"/>{opening&&selected===course.id?hi?"खुल रहा है…":"Opening…":t("learn")}</Button>
          </div>
        </LearningCard>
      </li>;
    }}/>)}
    {!visible.length&&<div className={libraryStyles.empty}><SlidersHorizontal size={28}/><h3><ExpandedText text={hi?"कोई गाइड नहीं मिला":"No guides match these filters"} /></h3><p><ExpandedText text={hi?"कोई दूसरा शब्द खोजें या फ़िल्टर साफ़ करें।":"Try a different search or clear filters to broaden your results."} /></p>{filtered&&<button onClick={reset}><ExpandedText text={hi?"फ़िल्टर साफ़ करें":"Clear filters"} /></button>}</div>}</>}
    {selected&&pack&&pack.course.id===selected&&canReadStudy(preparations,pack.course)&&pack.language===language&&<StudyReader key={`${pack.course.id}:${language}:${pack.access.viewerKey}`} pack={pack} onClose={()=>{setSelected(null);setPack(null);}} onPlans={()=>{setSelected(null);setPack(null);onPlans();}}/>}
  </section></>;
}

type CardDragProps = {
  checked?: boolean;
  onToggleCheck?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
};

function StudyCourseSection({title,courses,renderCourse}:{title?:string;courses:StudyCourse[];renderCourse:(course:StudyCourse, dragProps: CardDragProps)=>ReactNode}) {
  const {language,t}=useLanguage();
  const headingId=useId();
  const sectionRef=useRef<HTMLElement>(null);
  const [page,setPage]=useState(1);
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storageKey = `masterclass:study-order:${title || "catalog"}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) queueMicrotask(() => setCustomOrder(parsed));
      }
    } catch {}
  }, [title]);

  const moveCourse = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const currentIds = courses.map(c => c.id);
    const base = customOrder.length > 0 ? [...customOrder] : currentIds;
    for (const id of currentIds) {
      if (!base.includes(id)) base.push(id);
    }
    const sourceIndex = base.indexOf(sourceId);
    const targetIndex = base.indexOf(targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const nextOrder = [...base];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);
    setCustomOrder(nextOrder);
    try {
      localStorage.setItem(`masterclass:study-order:${title || "catalog"}`, JSON.stringify(nextOrder));
    } catch {}
  };

  const orderedCourses = useMemo(() => {
    if (!customOrder.length) return courses;
    const map = new Map(customOrder.map((id, idx) => [id, idx]));
    return [...courses].sort((a, b) => {
      const idxA = map.has(a.id) ? map.get(a.id)! : 999999;
      const idxB = map.has(b.id) ? map.get(b.id)! : 999999;
      return idxA - idxB;
    });
  }, [courses, customOrder]);

  const view=paginate(orderedCourses,page);
  function goToPage(next:number) {
    setPage(next);
    if(sectionRef.current && sectionRef.current.getBoundingClientRect().top<0) sectionRef.current.scrollIntoView({block:"start",behavior:"auto"});
  }
  return <section ref={sectionRef} className={title?classStyles.classSection:undefined} aria-labelledby={title?headingId:undefined}>
    {title&&<header className={classStyles.classHeader}>
      <span className={classStyles.classIcon} aria-hidden="true"><GraduationCap size={24}/></span>
      <div><h3 id={headingId}><ExpandedText text={title} /></h3><p><ExpandedText text={language==="hi"?"अपना विषय चुनें और सीखना शुरू करें।":"Choose a subject and continue learning."} /></p></div>
      <span className={classStyles.classCount}>{courses.length} <ExpandedText text={language==="hi"?"गाइड":courses.length===1?"guide":"guides"} /></span>
    </header>}
    <p className={`${libraryStyles.summary} ${classStyles.classSummary}`} aria-live="polite"><ExpandedText text={fill(t("libraryShowing"),{from:view.from,to:view.to,total:view.total})} /></p>
    <ul key={view.page} className={`${libraryStyles.grid} ${classStyles.classPage}`}>
      {view.items.map(course => {
        const isChecked = checkedIds.has(course.id);
        const isDragging = draggedId === course.id;
        const isDragOver = dragOverId === course.id && draggedId !== course.id;
        return renderCourse(course, {
          checked: isChecked,
          onToggleCheck: () => setCheckedIds(prev => {
            const next = new Set(prev);
            if (next.has(course.id)) next.delete(course.id);
            else next.add(course.id);
            return next;
          }),
          draggable: true,
          onDragStart: (e) => {
            e.dataTransfer.setData("text/plain", course.id);
            e.dataTransfer.effectAllowed = "move";
            setDraggedId(course.id);
          },
          onDragOver: (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dragOverId !== course.id) setDragOverId(course.id);
          },
          onDragLeave: () => {
            if (dragOverId === course.id) setDragOverId(null);
          },
          onDrop: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sourceId = e.dataTransfer.getData("text/plain") || draggedId;
            if (sourceId && sourceId !== course.id) {
              moveCourse(sourceId, course.id);
            }
            setDraggedId(null);
            setDragOverId(null);
          },
          onDragEnd: () => {
            setDraggedId(null);
            setDragOverId(null);
          },
          isDragging,
          isDragOver,
        });
      })}
    </ul>
    <LearningLibraryPager page={view.page} pages={view.pages} onPage={goToPage}/>
  </section>;
}
