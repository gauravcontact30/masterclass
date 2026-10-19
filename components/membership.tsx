"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";
import { ExpandedText } from "@/components/expanded-text";

import { useEffect,useState } from "react";
import { Check,ArrowUpRight } from "lucide-react";
import type { Tier } from "@/lib/domain";
import { requestJson,errorKey } from "@/lib/client";
import { PreparationPicker } from "./preparation-picker";
import { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import { openSubscriptionCheckout } from "@/lib/razorpay-checkout";
import { BillingHistory } from "./billing-history";
export function Membership({enabled,data,onRefresh,selections=[]}:{selections?:string[];enabled:boolean;data:{tier:Tier;used:number;limit:number;subscription:{current_period_end:string|null;status:string;cancel_at_cycle_end:boolean}|null;creditBalance:number}|null;onRefresh:()=>Promise<void>}){
  const {t,language}=useLanguage();const [prices,setPrices]=useState({monthly:299,yearly:2999,proLimit:50});const [busy,setBusy]=useState(false);const [error,setError]=useState<TranslationKey|null>(null);const [confirm,setConfirm]=useState(false);const [cycle,setCycle]=useState<"monthly"|"yearly">("monthly");const [selected,setSelected]=useState(selections);const [saved,setSaved]=useState(false);const hi=language==="hi";
  const [notice,setNotice]=useState<TranslationKey|null>(null);
  const [checkoutEnabled,setCheckoutEnabled]=useState(false);
  useEffect(()=>{void requestJson<typeof prices & {enabled:boolean}>("/api/billing").then(result=>{setPrices(result);setCheckoutEnabled(result.enabled);}).catch(()=>setError("payment_unavailable"));},[]);
  async function action(action:"checkout"|"cancel"|"refresh",tier?:"monthly"|"yearly"){setBusy(true);setError(null);try{
    setNotice(null);
    const result=await requestJson<{subscriptionId?:string;keyId?:string}>("/api/billing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...(tier?{tier}:{})})});
    if(action==="checkout"){
      if(!result.subscriptionId||!result.keyId)throw new Error("payment_unavailable");
      const payment=await openSubscriptionCheckout({key:result.keyId,subscription_id:result.subscriptionId,name:"MasterClass",description:tier==="yearly"?t("yearly"):t("monthly")});
      if(payment){
        const verified=await requestJson<{active:boolean}>("/api/billing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"verify",...payment})});
        setNotice(verified.active?"payment_success":"payment_processing");
      }else setNotice("checkout_closed");
    }
    await onRefresh();setConfirm(false);
  }catch(e){setError(errorKey(e));}finally{setBusy(false);}}
  const money=(amount:number)=>new Intl.NumberFormat(language==="hi"?"hi-IN":"en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(amount);
  async function savePreparation(){setBusy(true);setError(null);try{await requestJson("/api/account",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({selections:selected})});setSaved(true);await onRefresh();}catch(e){setError(errorKey(e));}finally{setBusy(false);}}
  const saving=Math.max(0,Math.round((1-prices.yearly/(prices.monthly*12))*100));
  return <section>{!enabled&&<p className="setup-banner"><ExpandedText text={t("provisional")} /></p>}{error&&<p className="error-banner" role="alert"><ExpandedText text={t(error)} /></p>}
    {notice&&<p className="setup-banner" role="status"><ExpandedText text={t(notice)} /></p>}
    <div className="billing-toggle" role="group" aria-label={hi?"भुगतान अवधि":"Billing period"}>{(["monthly","yearly"] as const).map(value=><button key={value} aria-pressed={cycle===value} onClick={()=>setCycle(value)}><ExpandedText text={t(value)} />{value==="yearly"&&saving>0&&<small><ExpandedText text={hi?`${saving}% बचाएँ`:`Save ${saving}%`} /></small>}</button>)}</div>
    <div className="subscription-plan">
    <article className="panel pricing-card featured"><span className="eyebrow">LEARN IN APP · <ExpandedText text={t(cycle)} /></span><h2><ExpandedText text={money(prices[cycle])} /></h2><p><ExpandedText text={cycle==="yearly"?t("perYear"):t("perMonth")} /></p>{cycle==="yearly"&&<p><ExpandedText text={hi?`${money(prices.yearly/12)} प्रति माह के बराबर; वार्षिक भुगतान`:`Equivalent to ${money(prices.yearly/12)}/month, billed yearly`} /></p>}<ul>{[hi?"हर कोर्स और श्रेणी के सभी प्रकाशित पाठ":"All published lessons across every course and category",hi?"हल सहित वस्तुनिष्ठ और विषयनिष्ठ प्रश्न":"Objective and subjective questions with solutions",hi?"समयबद्ध अभ्यास और उत्तर समीक्षा":"Timed practice and answer review",hi?"बुकमार्क और पुनरावृत्ति नोट्स":"Bookmarks and revision notes","English / हिन्दी"].map(item=><li key={item}><Check size={17}/><ExpandedText text={item} /></li>)}</ul><Button disabled={busy||!enabled||!checkoutEnabled||!!data?.subscription&&!(['created','authenticated'].includes(data.subscription.status)||['cancelled','completed','expired'].includes(data.subscription.status)&&(data.tier==='free'||data.tier==='trial'))} onClick={()=>void action("checkout",cycle)}><ExpandedText text={data?.tier===cycle?t("currentPlan"):t("subscribe")} /><ArrowUpRight size={16}/></Button><small><ExpandedText text={hi?"कोर्स चुनने की ज़रूरत नहीं — एक सदस्यता में सब कुछ शामिल है।":"No course selection needed — one membership includes everything."} /></small></article></div>
    <p className="preview-note"><ExpandedText text={t("billing_renewal_notice")} /></p>
    <details className="panel membership-focus"><AccordionSummary><ExpandedText text={hi?"अपना डैशबोर्ड केंद्रित करें (वैकल्पिक)":"Focus your dashboard (optional)"} /></AccordionSummary><p><ExpandedText text={hi?"सदस्यता में हर श्रेणी शामिल है। डैशबोर्ड में केवल चुनी हुई तैयारी दिखाने के लिए यहाँ चुनें।":"Your membership includes every category. Pick some here to show only those in your dashboard."} /></p>
    <PreparationPicker value={selected} onChange={value=>{setSelected(value);setSaved(false);}} disabled={busy}/>
    <Button variant="outline" disabled={busy||!selected.length} onClick={()=>void savePreparation()}><ExpandedText text={hi?"तैयारी सहेजें":"Save preparation"} /></Button>{saved&&<p role="status"><ExpandedText text={hi?"डैशबोर्ड अपडेट किया गया।":"Your dashboard has been updated."} /></p>}</details>
    <p className="preview-note"><ExpandedText text={hi?"सदस्यता वर्तमान में प्रकाशित सामग्री खोलती है। प्रत्येक गाइड का कवरेज पढ़ें; सभी परीक्षाओं का पूर्ण पाठ्यक्रम अभी उपलब्ध नहीं है।":"Subscriptions unlock currently published content. Check each guide’s coverage; complete syllabi for every examination are not yet available."} /></p>
    {data?.subscription&&<section className="panel"><h2><ExpandedText text={t("manage")} /></h2><p><ExpandedText text={hi?"स्थिति":"Status"} />: <ExpandedText text={data.subscription.status} /></p>{(data.tier==="free"||data.tier==="trial")&&!["cancelled","completed","expired"].includes(data.subscription.status)&&<p><ExpandedText text={t("paymentPending")} /></p>}{data.subscription.current_period_end&&<p><ExpandedText text={data.subscription.cancel_at_cycle_end?(hi?"पहुँच समाप्त होगी":"Access ends"):t("renewal")} />: <ExpandedText text={new Intl.DateTimeFormat(language==="hi"?"hi-IN":"en-IN",{dateStyle:"long"}).format(new Date(data.subscription.current_period_end))} /></p>}<Button variant="outline" disabled={busy} onClick={()=>void action("refresh")}><ExpandedText text={t("refresh")} /></Button>{!data.subscription.cancel_at_cycle_end&&!['cancelled','completed','expired'].includes(data.subscription.status)&&<Button variant="outline" disabled={busy} onClick={()=>setConfirm(true)}><ExpandedText text={["created","authenticated","pending","halted"].includes(data.subscription.status)?t("cancel_checkout"):t("cancel")} /></Button>}{data.subscription.cancel_at_cycle_end&&<p><ExpandedText text={hi?"नवीनीकरण बंद है। भुगतान की गई अवधि तक पहुँच जारी रहेगी।":"Renewal is cancelled. Access continues through the paid period."} /></p>}{confirm&&<div><p><ExpandedText text={["created","authenticated","pending","halted"].includes(data.subscription.status)?t("cancel_checkout_help"):t("cancelHelp")} /></p><Button disabled={busy} onClick={()=>void action("cancel")}><ExpandedText text={t("cancelConfirm")} /></Button><Button variant="ghost" onClick={()=>setConfirm(false)}><ExpandedText text={t("close")} /></Button></div>}</section>}
  {data?.subscription&&<BillingHistory version={`${data.subscription.status}:${data.subscription.current_period_end}`} />}
  </section>;
}
