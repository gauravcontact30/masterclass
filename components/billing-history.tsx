"use client";
import { useEffect, useState } from "react";
import { requestJson } from "@/lib/client";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";

type Invoice = { id:string; status:string; amount:number|null; amountPaid:number|null; currency:string; createdAt:string; url:string|null };
export function BillingHistory({ version }: { version:string }) {
  const { t, language } = useLanguage();
  const [invoices,setInvoices] = useState<Invoice[]>([]);
  const [state,setState] = useState("loading");
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    const controller=new AbortController();
    void requestJson<{invoices:Invoice[]}>("/api/billing/invoices",{signal:controller.signal})
      .then(result=>{if(!controller.signal.aborted){setInvoices(result.invoices);setState("ready");}})
      .catch(()=>{if(!controller.signal.aborted)setState("error");});
    return ()=>controller.abort();
  },[version,attempt]);
  return <section className="panel" aria-label={t("billing_history")} style={{padding:24,marginTop:24}}>
    <h2>{t("billing_history")}</h2>
    <p>{t("billing_history_help")}</p>
    {state==="loading"&&<p role="status">{t("billing_loading")}</p>}
    {state==="error"&&<><p role="alert">{t("billing_history_error")}</p><Button variant="outline" onClick={()=>{setState("loading");setAttempt(value=>value+1);}}>{t("retry")}</Button></>}
    {state==="ready"&&(invoices.length ? <ul style={{listStyle:"none",padding:0}}>{invoices.map(invoice=><li key={invoice.id} style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:16,padding:"16px 0",borderBottom:"1px solid var(--border)"}}>
      <time dateTime={invoice.createdAt}>{new Intl.DateTimeFormat(language==="hi"?"hi-IN":"en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(invoice.createdAt))}</time>
      <span>{invoice.amount===null?"—":new Intl.NumberFormat(language==="hi"?"hi-IN":"en-IN",{style:"currency",currency:invoice.currency}).format(invoice.amount/100)}</span>
      <span>{invoice.status}</span>
      {invoice.url&&<a href={invoice.url} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",textDecoration:"underline"}}>{t("view_invoice")}</a>}
    </li>)}</ul>:<p>{t("no_invoices")}</p>)}
  </section>;
}
