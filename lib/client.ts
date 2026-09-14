import { en,TranslationKey } from "./i18n";
export async function requestJson<T>(url:string,init?:RequestInit):Promise<T> {
  const response=await fetch(url,init);
  const data=await response.json().catch(()=>{throw new Error(response.status===401?"signin_required":"service_error");});
  if(!response.ok)throw new Error(data.error??"service_error");
  return data as T;
}
export function errorKey(error:unknown):TranslationKey {const key=error instanceof Error ? error.message : "service_error";return key in en ? key as TranslationKey : "service_error";}
