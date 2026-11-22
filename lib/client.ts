import { en,TranslationKey } from "./i18n";
import { PORTAL_HEADER, examPortalOfPath } from "./portal";
export async function requestJson<T>(url:string,init?:RequestInit):Promise<T> {
  // Requests from an exam portal (Board Scholars or Exam Aspirants) act on the caller's account there (lib/server/http.ts).
  const portal=typeof window!=="undefined"&&url.startsWith("/api/")?examPortalOfPath(window.location.pathname):null;
  const response=await fetch(url,portal?{...init,headers:{...(init?.headers as Record<string,string>|undefined),[PORTAL_HEADER]:portal}}:init);
  const data=await response.json().catch(()=>{throw new Error(response.status===401?"signin_required":"service_error");});
  if(!response.ok)throw new Error(data.error??"service_error");
  return data as T;
}
export function errorKey(error:unknown):TranslationKey {const key=error instanceof Error ? error.message : "service_error";return key in en ? key as TranslationKey : "service_error";}
