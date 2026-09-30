import path from 'node:path';
import {AuthError,createAuth} from './auth-core.mjs';
import {authStore} from './auth-store.mjs';

export const RETENTION_MS=90*24*60*60*1000;
export const MAX_VISITS=100;
const RATE_WINDOW=5*60*1000,MAX_REPORTS=30;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// Separate records and files: activity must never overwrite the credential state.
export function activityStore(userId,env=process.env){
  if(!/^\d{5,32}$/.test(userId))throw new Error('Invalid activity account.');
  const file=env.MED25_AUTH_FILE?path.resolve(/*turbopackIgnore: true*/ env.MED25_AUTH_FILE):path.join(process.cwd(),'.med25-auth','state.json');
  return authStore({...env,MED25_AUTH_KEY:(env.MED25_AUTH_KEY??'med25:private-auth:v1')+':activity:'+userId,MED25_AUTH_FILE:path.join(path.dirname(file),'activity',userId+'.json')});
}
function decode(raw){
  if(raw===null)return {schema:1,visits:[],rate:{start:0,count:0}};
  const state=JSON.parse(raw);
  if(state.schema!==1||!Array.isArray(state.visits)||!Number.isFinite(state.rate?.start)||!Number.isInteger(state.rate?.count))throw new Error('Invalid activity state.');
  for(const v of state.visits)if(!uuid.test(v.id)||![v.startedAt,v.lastSeenAt,v.activeMs,v.sequence].every(Number.isFinite))throw new Error('Invalid visit.');
  return state;
}
function trim(state,time){state.visits=state.visits.filter(v=>v.lastSeenAt>=time-RETENTION_MS).sort((a,b)=>b.lastSeenAt-a.lastSeenAt).slice(0,MAX_VISITS);}
export function createActivity({auth=createAuth(),storeFor=activityStore,now=Date.now}={}){
  return {
    async record(token,body){
      const session=await auth.session(token);
      if(!session)throw new AuthError('Please sign in.',401,'LOGIN_REQUIRED');
      if(session.mustChangePassword)throw new AuthError('Complete account setup first.',403,'PASSWORD_CHANGE_REQUIRED');
      if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['id','sequence','activeMs'].includes(k))||!uuid.test(body.id)||!Number.isSafeInteger(body.sequence)||body.sequence<1||!Number.isSafeInteger(body.activeMs)||body.activeMs<0||body.activeMs>7*24*60*60*1000)throw new AuthError('Invalid activity report.');
      const store=storeFor(session.userId);
      for(let attempt=0;attempt<8;attempt++){
        const raw=await store.read(),state=decode(raw),time=now();trim(state,time);
        let visit=state.visits.find(v=>v.id===body.id);
        if(visit&&body.sequence<=visit.sequence)return {recorded:true}; // Retry/out-of-order reports are idempotent.
        if(time-state.rate.start>=RATE_WINDOW)state.rate={start:time,count:0};
        if(state.rate.count>=MAX_REPORTS)throw new AuthError('Activity updates are temporarily limited.',429,'RATE_LIMITED');
        state.rate.count++;
        if(!visit){visit={id:body.id,startedAt:time,lastSeenAt:time,activeMs:0,sequence:0};state.visits.unshift(visit);}
        // The browser reports foreground time, but the server caps it by elapsed time.
        // Never trust a client timestamp, account ID, page, answer, or arbitrary field.
        visit.activeMs=Math.max(visit.activeMs,Math.min(body.activeMs,Math.max(0,time-visit.startedAt)));
        visit.lastSeenAt=Math.max(visit.lastSeenAt,time);visit.sequence=body.sequence;trim(state,time);
        if(await store.cas(raw,JSON.stringify(state)))return {recorded:true};
      }
      throw new AuthError('Please retry later.',503,'ACTIVITY_UNAVAILABLE');
    },
    async report(token){
      const session=await auth.session(token);
      if(!session)throw new AuthError('Please sign in.',401,'LOGIN_REQUIRED');
      if(session.mustChangePassword||!session.isOwner)throw new AuthError('Only the owner can view activity.',403,'OWNER_REQUIRED');
      const accounts=await auth.listAccounts(token),rows=[];
      // Bound concurrency and payloads; no timer refresh on the dashboard.
      for(let start=0;start<accounts.length;start+=4){
        rows.push(...await Promise.all(accounts.slice(start,start+4).map(async account=>{
          const store=storeFor(account.userId),raw=await store.read(),state=decode(raw);trim(state,now());
          const clean=JSON.stringify(state);
          if(raw!==null&&raw!==clean)await store.cas(raw,clean); // Prune when next accessed; never overwrite a concurrent report.
          return {userId:account.userId,displayName:account.displayName,active:account.active,visits:state.visits.map(({sequence,...visit})=>visit),lastSeenAt:state.visits[0]?.lastSeenAt??null,activeMs:state.visits.reduce((sum,v)=>sum+v.activeMs,0)};
        })));
      }
      // Recheck after potentially slow reads: a revoked owner session must not receive data.
      const current=await auth.session(token);if(!current?.isOwner||current.mustChangePassword)throw new AuthError('Only the owner can view activity.',403,'OWNER_REQUIRED');
      return {generatedAt:now(),retentionDays:90,maxVisitsPerUser:MAX_VISITS,users:rows.sort((a,b)=>(b.lastSeenAt??0)-(a.lastSeenAt??0))};
    },
  };
}
