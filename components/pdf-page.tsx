"use client";
import { useEffect,useRef,useState } from "react";
import { useLanguage } from "./language-provider";
export function PdfPage({url,page,zoom}:{url:string;page:number;zoom:number}) {
  const canvas=useRef<HTMLCanvasElement>(null);const [error,setError]=useState(false);const [loading,setLoading]=useState(true);const {t}=useLanguage();
  useEffect(()=>{let cancelled=false;let destroy:(()=>void)|undefined;
    void (async()=>{setLoading(true);setError(false);const pdfjs=await import("pdfjs-dist");pdfjs.GlobalWorkerOptions.workerSrc="/pdf.worker.min.mjs";const task=pdfjs.getDocument({url});destroy=()=>{void task.destroy();};const pdf=await task.promise;const content=await pdf.getPage(page);if(cancelled||!canvas.current)return;const viewport=content.getViewport({scale:zoom});const node=canvas.current;node.height=viewport.height;node.width=viewport.width;await content.render({canvas:node,viewport}).promise;if(!cancelled)setLoading(false);})().catch(()=>{if(!cancelled){setError(true);setLoading(false);}});
    return()=>{cancelled=true;destroy?.();};
  },[url,page,zoom]);
  return <>{loading&&<p role="status">{t("loading")}</p>}{error?<p role="alert">{t("service_error")}</p>:<canvas ref={canvas} aria-label={`${t("page")} ${page}`} role="img"/>}</>;
}
