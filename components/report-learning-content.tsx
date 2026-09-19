"use client";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {useState} from 'react';
import {usePathname} from 'next/navigation';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogHeader} from './ui/dialog';
import {Button} from './ui/button';
export function ReportLearningContent() {
  const path=usePathname();const [open,setOpen]=useState(false),[reason,setReason]=useState('incorrect'),[description,setDescription]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent) {
    event.preventDefault();setBusy(true);setStatus('');
    try {const response=await fetch('/api/monitoring/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,reason,description})});
      if(!response.ok)throw new Error(response.status===429?'Report limit reached. Please try later.':response.status===401?'Sign in to submit a report.':'The report could not be saved. Please try again.');
      setDescription('');setStatus('Report saved. The super admin can now review it.');
    }catch(error){setStatus(error instanceof Error?error.message:'Unable to save report.');}finally{setBusy(false);}
  }
  return <><button type="button" className="learning-report-link" onClick={()=>{setOpen(true);setStatus('');}}>Report a content issue</button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Report a content issue</DialogTitle><DialogDescription>Include the topic name and what needs attention on this page.</DialogDescription></DialogHeader><form onSubmit={submit} className="learning-report-form"><Label>Reason<NativeSelect value={reason} onChange={event=>setReason(event.target.value)}><NativeSelectOption value="incorrect">Incorrect information</NativeSelectOption><NativeSelectOption value="broken">Broken example or link</NativeSelectOption><NativeSelectOption value="inappropriate">Inappropriate content</NativeSelectOption><NativeSelectOption value="spam">Spam</NativeSelectOption></NativeSelect></Label><Label>Details<Textarea value={description} onChange={event=>setDescription(event.target.value)} minLength={10} maxLength={2000} required rows={5}/></Label><Button type="submit" disabled={busy}>{busy?'Saving…':'Submit report'}</Button><p role="status">{status}</p></form></DialogContent></Dialog></>;
}
