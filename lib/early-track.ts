/**
 * Records the first view after one continuous visible second, before hydration. The hydrated tracker adopts
 * both its pending cookie-setting request and the current visible stretch. Hidden time never counts as reading.
 * Private-window detection remains best effort, with a 500 ms deadline; Chromium reports unknown.
 */
export const EARLY_TRACK_SCRIPT = `(function(){try{
  var p=location.pathname;
  if(/^\\/(dashboard\\/)?super-admin(\\/|$)/.test(p))return;
  var e=window.__mcEarly={path:p,sent:false,taken:false,priv:null,since:document.visibilityState==="hidden"?null:0};
  var n=navigator,s=n.storage,timer;
  e.ready=Promise.race([
    (n.userAgentData||!s||!s.getDirectory?Promise.resolve(null):s.getDirectory().then(function(){return false},function(x){return/security error|unknown transient reason/i.test(String(x&&x.message||x))||null})).then(function(v){e.priv=v},function(){}),
    new Promise(function(r){setTimeout(r,500)})
  ]);
  var send=function(b){
    var d=JSON.stringify(b);
    e.pending=(e.pending||Promise.resolve()).then(function(){return fetch("/api/track",{method:"POST",body:d,keepalive:true,signal:AbortSignal.timeout(10000),headers:{"content-type":"application/json"}})}).catch(function(){});
  };
  var view=function(){
    if(e.taken||e.sent||e.since===null||document.visibilityState==="hidden")return;
    if(performance.now()-e.since<1000){wait();return;}
    var q=new URLSearchParams(location.search);
    send({type:"view",path:p,title:document.title,referrer:document.referrer||null,utm:{source:q.get("utm_source"),medium:q.get("utm_medium"),campaign:q.get("utm_campaign")},language:navigator.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,screen:screen.width+"x"+screen.height,private:e.priv});
    e.sent=true;
  };
  var wait=function(){
    clearTimeout(timer);
    if(e.sent||e.taken||e.since===null)return;
    timer=setTimeout(function(){e.ready.then(view)},Math.max(0,1000-(performance.now()-e.since)));
  };
  var pause=function(){
    if(e.taken)return;
    clearTimeout(timer);
    if(e.sent&&e.since!==null)send({type:"leave",path:p,duration:Math.round(performance.now()-e.since)});
    e.since=null;
  };
  var resume=function(){
    if(e.taken||document.visibilityState==="hidden"||e.since!==null)return;
    e.since=performance.now();
    if(e.sent)send({type:"ping",path:p,duration:0});else wait();
  };
  document.addEventListener("visibilitychange",function(){document.visibilityState==="hidden"?pause():resume()});
  addEventListener("pagehide",pause);
  addEventListener("pageshow",resume);
  wait();
}catch(x){}})()`;
