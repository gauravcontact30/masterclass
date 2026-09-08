"use client";
import { createContext,useContext,useSyncExternalStore,useEffect,useCallback } from "react";
import { Language } from "@/lib/domain";
import { en,hi,TranslationKey } from "@/lib/i18n";
const Context=createContext<{language:Language;setLanguage:(value:Language,persist?:boolean)=>void;t:(key:TranslationKey)=>string}>({language:"en",setLanguage:()=>{},t:key=>en[key]});
let memoryLanguage:Language="en";
function subscribe(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener("masterclass-language",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("masterclass-language",callback);};}
function snapshot():Language{try{return localStorage.getItem("masterclass:language")==="hi"?"hi":"en";}catch{return memoryLanguage;}}
export function LanguageProvider({children}:{children:React.ReactNode}) {
  const language=useSyncExternalStore(subscribe,snapshot,()=>"en" as Language);
  useEffect(()=>{document.documentElement.lang=language;},[language]);
  const setLanguage=useCallback((value:Language,persist=true)=>{memoryLanguage=value;try{localStorage.setItem("masterclass:language",value);}catch{}window.dispatchEvent(new Event("masterclass-language"));if(persist)void fetch("/api/account",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({language:value})}).catch(()=>{});},[]);
  return <Context.Provider value={{language,setLanguage,t:key=>(language==="hi"?hi:en)[key]??en[key]}}>{children}</Context.Provider>;
}
export const useLanguage=()=>useContext(Context);
