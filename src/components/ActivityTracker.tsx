"use client";
import {useEffect} from 'react';
import {createActivityMeter,REPORT_INTERVAL_MS} from '../lib/client/activity-meter.mjs';

/** Best-effort, low-frequency telemetry. It never blocks study or revalidates auth. */
export function ActivityTracker(){
  useEffect(()=>{
    const isActive=()=>document.visibilityState==='visible'&&document.hasFocus();
    const meter=createActivityMeter({active:isActive()}),id=crypto.randomUUID();
    let sequence=0,lastSent=-1,lastReportAt=-Infinity,started=false,stopped=false;
    const flush=(leavingPage=false)=>{
      if(stopped||!started)return;
      if(!leavingPage&&performance.now()-lastReportAt<30_000)return;
      const activeMs=meter.snapshot();if(activeMs===lastSent)return;
      const previous=lastSent;lastSent=activeMs;lastReportAt=performance.now();
      void fetch('/api/activity',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'content-type':'application/json','x-med25-auth':'1'},body:JSON.stringify({id,sequence:++sequence,activeMs})}).then(response=>{
        if(response.status===401||response.status===403)stopped=true;
        // Retry only on the next scheduled report; no noisy immediate retry loop.
        else if(!response.ok&&lastSent===activeMs)lastSent=previous;
      }).catch(()=>{if(lastSent===activeMs)lastSent=previous;});
    };
    const change=()=>{const active=isActive();meter.setActive(active);if(active&&!started){started=true;flush();}else if(!active)flush();};
    const interact=()=>{if(isActive())meter.interact();};
    const hide=()=>{meter.setActive(false);flush(true);};
    const logout=()=>{hide();stopped=true;};
    // Defer the first report so React's development-only effect rehearsal creates no duplicate visit.
    const initial=setTimeout(change,0),timer=setInterval(flush,REPORT_INTERVAL_MS);
    document.addEventListener('visibilitychange',change);
    window.addEventListener('focus',change);window.addEventListener('blur',change);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',change);window.addEventListener('med25-signing-out',logout);
    for(const type of ['pointerdown','keydown','scroll','touchstart'])window.addEventListener(type,interact,{passive:true});
    return()=>{clearTimeout(initial);clearInterval(timer);hide();stopped=true;document.removeEventListener('visibilitychange',change);window.removeEventListener('focus',change);window.removeEventListener('blur',change);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',change);window.removeEventListener('med25-signing-out',logout);for(const type of ['pointerdown','keydown','scroll','touchstart'])window.removeEventListener(type,interact);};
  },[]);
  return null;
}
