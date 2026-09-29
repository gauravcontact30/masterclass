"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { requestJson } from "@/lib/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import styles from "./super-admin-dashboard.module.css";

type Setup={enabled:boolean;mode:string;checks:{name:string;configured:boolean}[];monthly:number;yearly:number;webhookPath:string};
const labels:Record<string,string>={RAZORPAY_KEY_ID:"API key",RAZORPAY_KEY_SECRET:"API secret",RAZORPAY_WEBHOOK_SECRET:"Webhook signature secret",RAZORPAY_MONTHLY_PLAN_ID:"Monthly plan",RAZORPAY_YEARLY_PLAN_ID:"Yearly plan"};
export function SuperAdminBilling() {
  const [setup,setSetup]=useState<Setup|null>(null);
  const [error,setError]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
  useEffect(()=>{const controller=new AbortController();void requestJson<Setup>("/api/super-admin/billing",{signal:controller.signal}).then(setSetup).catch(()=>{if(!controller.signal.aborted)setError("Payment setup could not be loaded.");});return()=>controller.abort();},[]);
  async function validate(){setBusy(true);setError("");setMessage("");try{await requestJson("/api/super-admin/billing",{method:"POST"});setMessage("Both Razorpay plans match your configured INR prices and billing periods.");}catch{setError("Plan verification failed. Check the configured keys, plan IDs, prices, and live-mode permission.");}finally{setBusy(false);}}
  return <Card className={styles.billingSetup}>
    <CardHeader><CardTitle className={styles.billingTitle}><ShieldCheck size={18}/>Razorpay subscriptions {setup&&<Badge variant={setup.enabled?"secondary":"outline"}>{setup.enabled?"Checkout enabled":"Setup required"}</Badge>}</CardTitle><CardDescription>Monthly and yearly memberships with automatic renewal.</CardDescription></CardHeader>
    <CardContent>
      {error&&<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {!setup&&!error&&<Skeleton className={styles.metricSkeleton}/>}
      {setup&&<><div className={styles.billingChecks}>{setup.checks.map(check=><div key={check.name}><span>{labels[check.name]}</span><Badge variant={check.configured?"secondary":"outline"}>{check.configured?"Configured":"Missing"}</Badge></div>)}</div>
        <p className={styles.note}><strong>{setup.mode==="test"?"Test mode":"Live mode"}</strong> · ₹{setup.monthly}/month · ₹{setup.yearly}/year</p>
        <p className={styles.note}>Webhook endpoint: <code>{setup.webhookPath}</code>. Configure this path on your public HTTPS domain in Razorpay.</p>
        <Button variant="outline" disabled={busy||setup.checks.some(check=>!check.configured)} onClick={()=>void validate()}><RefreshCw size={15} className={busy?"spin":""}/>{busy?"Verifying plans...":"Verify Razorpay plans"}</Button>
        {message&&<p role="status" className={styles.note}>{message}</p>}
      </>}
    </CardContent>
  </Card>;
}
