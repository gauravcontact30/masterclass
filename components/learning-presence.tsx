"use client";
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
export function LearningPresence({enabled}:{enabled:boolean}) {
  const path=usePathname();
  useEffect(()=>{
    if(!enabled||!path.startsWith('/dashboard')||path.startsWith('/dashboard/super-admin')) return;
    let sessionId:string;
    try {sessionId=sessionStorage.getItem('masterclass:presence')||crypto.randomUUID();sessionStorage.setItem('masterclass:presence',sessionId);}catch{sessionId=crypto.randomUUID();}
    const controller=new AbortController();let first=true;let disabled=false;let sending=false;
    async function heartbeat() {
      if(disabled||sending||document.visibilityState!=='visible')return;
      sending=true;
      try {
        const entry=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
        const response=await fetch('/api/monitoring/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,path,view:first,...(first&&entry?.loadEventEnd&&new URL(entry.name).pathname===path?{loadMs:Math.min(120000,Math.round(entry.loadEventEnd-entry.startTime))}:{})}),signal:controller.signal});
        if(response.ok)first=false;
        else if([401,403,500,503].includes(response.status))disabled=true;
      }catch{}finally{sending=false;}
    }
    void heartbeat();const timer=setInterval(()=>void heartbeat(),30000);
    const visible=()=>void heartbeat();document.addEventListener('visibilitychange',visible);
    return()=>{disabled=true;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[enabled,path]);
  return null;
}
