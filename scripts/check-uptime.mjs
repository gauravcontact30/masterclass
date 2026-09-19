// Run once per minute from an independent scheduler, with this application's own Supabase env.
import {createClient} from '@supabase/supabase-js';
const required=name=>{if(!process.env[name])throw new Error(`Missing ${name}`);return process.env[name];};
const target=new URL(required('UPTIME_TARGET_URL'));
if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash)throw new Error('UPTIME_TARGET_URL must be an HTTPS URL without credentials, query or fragment');
const client=createClient(required('NEXT_PUBLIC_SUPABASE_URL'),required('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
const started=performance.now();let status=503;
try{const response=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'Cache-Control':'no-cache'}});status=response.status;await response.body?.cancel();}catch{}
const {error}=await client.from('monitor_events').insert({kind:'uptime',action:'probe',resource:target.pathname,status,duration_ms:Math.round(performance.now()-started),details:{host:target.hostname,healthy:status>=200&&status<300}});
if(error)throw new Error(`Could not persist uptime sample: ${error.code}`);
console.log(JSON.stringify({event:'uptime_recorded',status}));
if(status<200||status>=300)process.exitCode=1;
