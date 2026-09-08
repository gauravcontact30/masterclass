"use client";
import { useEffect,useRef,useState } from "react";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
export function CodePlayground({initialCode}:{initialCode:string}){
  const {t}=useLanguage();const [code,setCode]=useState(initialCode);const [input,setInput]=useState("{}");const [output,setOutput]=useState("");const frame=useRef<HTMLIFrameElement>(null);
  useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.source===frame.current?.contentWindow&&event.data?.type==="result")setOutput(String(event.data.output).slice(0,12000));};window.addEventListener("message",receive);return()=>window.removeEventListener("message",receive);},[]);
  return <section className="reader-notes"><h3>{t("playground")}</h3><p>{t("playgroundHint")}</p><label>JavaScript<textarea aria-label="JavaScript" value={code} maxLength={10000} onChange={e=>setCode(e.target.value)}/></label><label>{t("input")}<textarea value={input} maxLength={2000} onChange={e=>setInput(e.target.value)}/></label><Button onClick={()=>{setOutput("");frame.current?.contentWindow?.postMessage({type:"run",code,input},"*");}}>{t("run")}</Button><Button variant="outline" onClick={()=>{setCode(initialCode);setOutput("");frame.current?.contentWindow?.postMessage({type:"stop"},"*");}}>{t("reset")}</Button><pre aria-label={t("output")} aria-live="polite">{output}</pre><iframe title={t("playground")} ref={frame} sandbox="allow-scripts" src="/playground.html" className="hidden"/></section>;
}
