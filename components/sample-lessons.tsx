"use client";
import { useState } from "react";
import { BookOpen,ArrowUpRight } from "lucide-react";
import { DocumentRecord,Progress } from "@/lib/domain";
import { requestJson,errorKey } from "@/lib/client";
import { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { LearnModal,ReaderResource } from "./learn-modal";
import { Button } from "./ui/button";
export function SampleLessons(){const {t,language}=useLanguage();const [selected,setSelected]=useState<{resource:ReaderResource;progress?:Progress}|null>(null);const [error,setError]=useState<TranslationKey|null>(null);const [busy,setBusy]=useState(false);
 async function open(format:"pdf"|"pptx"){setBusy(true);setError(null);try{const document=await requestJson<DocumentRecord>(`/samples/${language}-${format}.json`);let progress:Progress|undefined;try{const saved=localStorage.getItem(`masterclass:sample:${document.id}`);if(saved)progress=JSON.parse(saved);}catch{}setSelected({resource:{document,url:`/samples/${language}-${format}.${format}`,previews:document.preview_paths},progress});}catch(e){setError(errorKey(e));}finally{setBusy(false);}}
 return <><section className="sample-strip"><div className="section-icon"><BookOpen size={20}/></div><div><h3>{t("sampleLesson")}</h3><p>{language==="hi"?"JavaScript में फ़ंक्शन सीखें":"Functions make JavaScript reusable"}</p></div><div className="sample-actions"><Button variant="outline" disabled={busy} onClick={()=>void open("pdf")}>PDF <ArrowUpRight size={15}/></Button><Button variant="outline" disabled={busy} onClick={()=>void open("pptx")}>PPTX <ArrowUpRight size={15}/></Button></div></section>{error&&<p className="error-banner">{t(error)}</p>}{selected&&<LearnModal key={selected.resource.document.id} document={selected.resource.document} initialProgress={selected.progress} sampleResource={selected.resource} onClose={()=>setSelected(null)}/>}</>;
}
