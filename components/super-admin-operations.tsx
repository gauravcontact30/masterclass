"use client";
import { AdminError, AdminLoading, AdminFormMessage } from "./super-admin-feedback";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Card } from "./ui/card";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "./ui/field";
import { AdminSelect } from "./super-admin-select";
import { Textarea } from "@/components/ui/textarea";
import {useCallback,useEffect,useState,useId} from 'react';
import styles from './super-admin-dashboard.module.css';
import { AdminTable } from './super-admin-table';
type Row=Record<string,unknown>;
type Operations={generatedAt:string;liveCount:number;openReports:number;live:Row[];traffic:Row[];pages:Row[];ai:Row[];reports:Row[];alerts:Row[];security:Row[]};
const value=(item:unknown)=>item===null||item===undefined?'—':typeof item==='object'?JSON.stringify(item):String(item);
function Records({title,rows,columns,query}:{title:string;rows:Row[];columns:string[];query:string}){
  return <AdminTable title={title} rows={rows} columns={columns} query={query}/>;
}
function Review({report,onSaved}:{report:Row;onSaved:()=>void}){
  const formId = useId();
  const [status,setStatus]=useState('reviewing'),[resolution,setResolution]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function save(event:React.FormEvent){event.preventDefault();setBusy(true);setMessage('');try{const result=await fetch('/api/super-admin/reports',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:report.id,status,resolution})});if(!result.ok)throw new Error('Review could not be saved.');setMessage('Review saved.');onSaved();}catch(error){setMessage(String(error));}finally{setBusy(false);}}
  return <Accordion className={styles.panel}><AccordionItem value={String(report.id)}><AccordionTrigger>{value(report.reason)} · {value(report.path)} · {value(report.status)}</AccordionTrigger><AccordionContent><p>{value(report.description)}</p><p className={styles.note}>Reported {value(report.created_at)} · Account {value(report.user_id)}</p>{report.resolution!==null&&<p>Latest resolution: {value(report.resolution)}</p>}<form className={styles.adminForm} onSubmit={save} aria-busy={busy}>
      <Field><FieldLabel htmlFor={`${formId}-status`}>Review status</FieldLabel>
        <AdminSelect id={`${formId}-status`} label="Review status" disabled={busy} value={status} onValueChange={setStatus} options={[{value:"reviewing",label:"Reviewing"},{value:"resolved",label:"Resolved"},{value:"dismissed",label:"Dismissed"}]} />
      </Field>
      <Field className={styles.fullWidth}><FieldLabel htmlFor={`${formId}-resolution`}>Resolution</FieldLabel>
        <Textarea id={`${formId}-resolution`} aria-describedby={`${formId}-resolution-help`} disabled={busy} required minLength={5} maxLength={1000} placeholder="Describe the outcome and actions taken" value={resolution} onChange={e=>setResolution(e.target.value)} />
        <FieldDescription id={`${formId}-resolution-help`}>Use 5 to 1,000 characters. This explanation is recorded with the review.</FieldDescription>
      </Field>
      <div className={styles.formActions}><Button type="submit" disabled={busy || resolution.trim().length < 5}>{busy ? "Saving review..." : "Save review"}</Button></div>
      <AdminFormMessage message={message} success={message === "Review saved."}/>
    </form></AccordionContent></AccordionItem></Accordion>;
}
export function SuperAdminOperations({section,days,query}:{section:string;days:number;query:string}){
  const [data,setData]=useState<Operations|null>(null),[error,setError]=useState('');
  const refresh=useCallback(async(signal?:AbortSignal)=>{try{const response=await fetch(`/api/super-admin/operations?days=${days}`,{cache:'no-store',signal});if(!response.ok){if(response.status===401||response.status===403)setData(null);throw new Error(response.status===401||response.status===403?'Super admin access is required.':'Operations data is unavailable. Apply migrations 0018 and 0019 to this application’s Supabase project.');}const result=await response.json();if(!signal?.aborted){setData(result);setError('');}}catch(error){if(!signal?.aborted)setError(error instanceof Error?error.message:'Unable to load operations.');}},[days]);
  useEffect(()=>{const controller=new AbortController();void Promise.resolve().then(()=>{if(!controller.signal.aborted)void refresh(controller.signal);});const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh(controller.signal);},30000);return()=>{controller.abort();clearInterval(timer);};},[refresh]);
  const table=(title:string,rows:Row[],columns:string[])=><Records key={`${title}:${days}`} title={title} rows={rows} columns={columns} query={query}/>;
  if(!data)return error?<AdminError>{error}</AdminError>:<AdminLoading>Loading operations...</AdminLoading>;
  return <>{error&&<AdminError>{error} Showing the previous snapshot.</AdminError>}<div className={styles.toolbar}><span>Updated {new Date(data.generatedAt).toLocaleTimeString()} · refreshes every 30 seconds</span><Button variant="outline" className={styles.refresh} onClick={()=>void refresh()}>Refresh operations</Button></div>
    {(section==='overview'||section==='live')&&<div className={styles.metrics}><Card className={styles.metric}><span>Live learners</span><strong>{data.liveCount}</strong><small>Signed-in users with a visible-page heartbeat in the last 90 seconds</small></Card><Card className={styles.metric}><span>Reports needing review</span><strong>{data.openReports}</strong><small>Open or reviewing reports across the platform</small></Card><Card className={styles.metric}><span>Application alerts</span><strong>{data.alerts.length}</strong><small>Routes with at least 3 server failures in 15 minutes</small></Card></div>}
    {section==='overview'&&table('Needs attention',data.alerts,['resource','failures','last_seen'])}
    {section==='live'&&table('Live sessions',data.live,['email','path','device','started_at','last_seen_at'])}
    {section==='analytics'&&<><p className={styles.note}>Authenticated dashboard activity only. Views are client-reported; blocked tracking or hidden tabs reduce coverage. Daily groups use UTC. Load time measures full browser navigations when available.</p>{table('Daily learning activity',data.traffic,['day','views','learners','load_ms'])}{table('Popular learning pages',data.pages,['path','views','learners','load_ms'])}</>}
    {section==='moderation'&&<><p className={styles.note}>{data.openReports} reports need attention. Resolve or dismiss with a written explanation. The database audit trail records each review.</p>{data.reports.filter(row=>JSON.stringify(row).toLowerCase().includes(query.toLowerCase())).map(report=><Review key={String(report.id)} report={report} onSaved={()=>void refresh()}/>)}{!data.reports.length&&<p className={styles.empty}>No reports submitted yet.</p>}</>}
    {section==='security'&&table('Access denials & rate limits',data.security,['resource','status','attempts','last_seen'])}
  </>;
}
export function AdminAccountControls({users,onSaved}:{users:Row[];onSaved:()=>void}){
  const formId = useId();
  const [id,setId]=useState(''),[action,setAction]=useState('role'),[role,setRole]=useState('viewer'),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setMessage('');try{const response=await fetch('/api/super-admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action,...(action==='role'?{role}:{}),reason})});if(!response.ok)throw new Error(response.status===409?'The owner account cannot be changed here.':'Account change failed. Refresh to check its latest status before retrying.');setMessage('Account updated.');onSaved();}catch(error){setMessage(error instanceof Error?error.message:'Account update failed.');}finally{setBusy(false);}}
  return <Card className={styles.panel}><h2>Account controls</h2><p className={styles.note}>Role labels are audited. They do not grant Super Admin access or paid subscriptions. Ban enforcement follows Supabase Auth session rules.</p><form className={styles.adminForm} onSubmit={submit} aria-busy={busy}>
      <Field className={styles.fullWidth}><FieldLabel htmlFor={`${formId}-account`}>Account</FieldLabel>
        <AdminSelect id={`${formId}-account`} label="Account" disabled={busy} required value={id} onValueChange={setId} placeholder="Choose an account" options={users.filter(user=>String(user.email).trim().toLowerCase()!=="garvcontact30@gmail.com").map(user=>({value:String(user.id),label:String(user.email)}))} />
      </Field>
      <Field><FieldLabel htmlFor={`${formId}-action`}>Action</FieldLabel>
        <AdminSelect id={`${formId}-action`} label="Action" disabled={busy} value={action} onValueChange={setAction} options={[{value:"role",label:"Change role label"},{value:"ban",label:"Ban account"},{value:"unban",label:"Unban account"}]} />
      </Field>
      {action === "role" && <Field><FieldLabel htmlFor={`${formId}-role`}>Role</FieldLabel>
        <AdminSelect id={`${formId}-role`} label="Role" disabled={busy} value={role} onValueChange={setRole} options={[{value:"viewer",label:"Viewer"},{value:"editor",label:"Editor"},{value:"admin",label:"Admin"}]} />
      </Field>}
      <Field className={styles.fullWidth}><FieldLabel htmlFor={`${formId}-reason`}>Reason for change</FieldLabel>
        <Textarea id={`${formId}-reason`} aria-describedby={`${formId}-reason-help`} disabled={busy} required minLength={5} maxLength={500} placeholder="Explain why this account needs updating" value={reason} onChange={e=>setReason(e.target.value)} />
        <FieldDescription id={`${formId}-reason-help`}>Use 5 to 500 characters. Your reason is saved in the audit trail.</FieldDescription>
      </Field>
      <div className={styles.formActions}><Button type="submit" variant={action === "ban" ? "destructive" : "default"} disabled={busy || !id || reason.trim().length < 5}>{busy ? "Applying change..." : "Apply account change"}</Button></div>
      <AdminFormMessage message={message} success={message === "Account updated."}/>
    </form></Card>;
}
