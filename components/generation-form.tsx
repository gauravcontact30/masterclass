"use client";
import { useState } from "react";
import { ArrowUpRight,FileText,Presentation,Sparkles } from "lucide-react";
import { GenerationRequest,Technology,Topic } from "@/lib/domain";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
export function GenerationForm({technologies,topics,onGenerate,busy,disabled}:{technologies:Technology[];topics:Topic[];onGenerate:(request:GenerationRequest)=>void;busy:boolean;disabled:boolean}) {
  const {t,language}=useLanguage();
  const [input,setInput]=useState<GenerationRequest>({technologyId:"",topicId:"",format:"pdf",language:"en",level:"beginner",theme:"minimal"});
  function update<K extends keyof GenerationRequest>(key:K,value:GenerationRequest[K]){setInput(prev=>({...prev,[key]:value,...(key==="technologyId"?{topicId:""}:{})}));}
  const label=(item:{title:string;title_hi:string})=>language==="hi"?item.title_hi:item.title;
  // The catalogue is large enough that a flat list is hard to scan, so both
  // selects group: technologies by category, topics by full path vs single topic.
  const byCategory=technologies.reduce<Record<string,Technology[]>>((groups,item)=>{(groups[item.category] ??= []).push(item);return groups;},{});
  const scoped=topics.filter(item=>item.technology_id===input.technologyId);
  const topicGroups=[{key:"fullPathGroup" as const,items:scoped.filter(item=>item.full_track)},{key:"singleTopicGroup" as const,items:scoped.filter(item=>!item.full_track)}];
  return <section className="panel generation-panel"><div className="section-heading"><div className="section-icon"><Sparkles size={20}/></div><div><h2>{t("create")}</h2><p>{t("guideHint")}</p></div><span className="step-label">01 — 02</span></div>
    <form onSubmit={event=>{event.preventDefault();onGenerate(input);}}>
      <div className="selection-grid"><label><span className="field-number">01</span>{t("technology")}<select aria-label={t("technology")} required value={input.technologyId} onChange={e=>update("technologyId",e.target.value)} disabled={disabled||busy}><option value="">{t("chooseTechnology")}</option>
        {Object.entries(byCategory).map(([category,items])=><optgroup key={category} label={category}>{items.map(item=><option key={item.id} value={item.id}>{label(item)}</option>)}</optgroup>)}</select></label>
      <label><span className="field-number">02</span>{t("topic")}<select aria-label={t("topic")} required value={input.topicId} onChange={e=>update("topicId",e.target.value)} disabled={!input.technologyId||disabled||busy}><option value="">{t("chooseTopic")}</option>
        {topicGroups.filter(group=>group.items.length>0).map(group=><optgroup key={group.key} label={t(group.key)}>{group.items.map(item=><option key={item.id} value={item.id}>{label(item)}</option>)}</optgroup>)}</select></label></div>
      <div className="options-grid"><fieldset><legend>{t("format")}</legend><div className="format-switch">{(["pdf","pptx"] as const).map(format=><button type="button" key={format} aria-pressed={input.format===format} onClick={()=>update("format",format)}>{format==="pdf"?<FileText size={16}/>:<Presentation size={16}/>} {format.toUpperCase()}</button>)}</div></fieldset>
      <label>{t("documentLanguage")}<select value={input.language} onChange={e=>update("language",e.target.value as GenerationRequest["language"])}><option value="en">English</option><option value="hi">हिन्दी</option></select></label>
      <label>{t("level")}<select value={input.level} onChange={e=>update("level",e.target.value as GenerationRequest["level"])}>{(["beginner","intermediate","advanced"] as const).map(level=><option key={level} value={level}>{t(level)}</option>)}</select></label>
      <label>{t("theme")}<select value={input.theme} onChange={e=>update("theme",e.target.value as GenerationRequest["theme"])}>{(["minimal","corporate","cyberpunk"] as const).map(theme=><option key={theme} value={theme}>{t(theme)}</option>)}</select></label></div>
      <div className="form-footer"><span><span className="tiny-dot"/> PDF · PPTX · English · हिन्दी</span><Button className="primary-action" type="submit" disabled={disabled||busy||!input.topicId}>{busy?t("loading"):t("generate")}<ArrowUpRight size={18}/></Button></div>
    </form></section>;
}
