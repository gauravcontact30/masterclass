import {apiDetail,aiAvailable} from '../lib/server/pro-learn-ai';
console.log(JSON.stringify({configured:aiAvailable()}));
apiDetail('nextjs','useSearchParams').then(r=>console.log(JSON.stringify({ok:true,source:r.source,files:r.detail.project?.files.length}))).catch(e=>{console.log(JSON.stringify({ok:false,status:e.status,code:e.code}));process.exitCode=1;});
