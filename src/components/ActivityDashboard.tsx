"use client";
import {useCallback,useEffect,useState} from 'react';
import type {ActivityReport} from '../lib/server/activity.mjs';
const duration=(ms:number)=>ms<60_000?Math.floor(ms/1000)+'s':ms<3_600_000?Math.floor(ms/60_000)+'m':Math.floor(ms/3_600_000)+'h '+Math.floor(ms%3_600_000/60_000)+'m';
const date=(at:number|null)=>at===null?'No visits recorded':new Date(at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
export function ActivityDashboard(){
  const [report,setReport]=useState<ActivityReport|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState('');
  const load=useCallback(async()=>{setLoading(true);try{const response=await fetch('/api/admin/activity',{cache:'no-store'}),body=await response.json();if(!response.ok)throw new Error(body.error??'Unable to load activity.');setReport(body);setError('');}catch(e){setError(e instanceof Error?e.message:'Unable to load activity.');}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  const users=report?.users.filter(u=>(u.displayName??'').toLowerCase().includes(query.toLowerCase())||u.userId.includes(query))??[];
  return <section className="admin-activity" aria-label="Owner-only activity">
    <div className="admin-toolbar"><input type="search" aria-label="Find activity by name or ID" placeholder="Find name or student ID…" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" disabled={loading} onClick={()=>void load()}>{loading?'Loading…':'Refresh activity'}</button></div>
    <p className="activity-help">Only you can see this. Last 90 days, up to 100 recent page visits per account. A reload or new tab starts a visit. Times are in {Intl.DateTimeFormat().resolvedOptions().timeZone}. Active time excludes hidden tabs and pauses after 2 idle minutes. It is an estimate, not an attendance record. Concurrent windows can overlap; totals are not deduplicated across devices.</p>
    <p className="activity-help">Updates approximately every 5 active minutes and on leaving a page. Browser closure or lost connectivity can omit the final update. No answers, keystrokes, IP addresses, or outside browsing are recorded.</p>
    {error&&<p role="alert" className="auth-error">{error}</p>}
    {report&&<p className="activity-updated">Snapshot: {date(report.generatedAt)} · {report.users.reduce((sum,u)=>sum+u.visits.length,0)} recorded visits</p>}
    {users.map(user=><details className="activity-user" key={user.userId}>
      <summary><span><b>{user.displayName??'Name pending'}</b><code>{user.userId}{!user.active?' · removed':''}</code></span><span>Last seen: {date(user.lastSeenAt)}</span><span>{user.visits.length} visits · {duration(user.activeMs)} active</span></summary>
      {user.visits.length?<div className="admin-table-scroll" tabIndex={0} role="region" aria-label={'Visits for '+(user.displayName??user.userId)}><table className="activity-table"><thead><tr><th>Opened</th><th>Last update</th><th>Elapsed</th><th>Active estimate</th></tr></thead><tbody>{user.visits.map(v=><tr key={v.id}><td>{date(v.startedAt)}</td><td>{date(v.lastSeenAt)}</td><td>{duration(v.lastSeenAt-v.startedAt)}</td><td>{duration(v.activeMs)}</td></tr>)}</tbody></table></div>:<p className="activity-help">No visits recorded since tracking was enabled. Historical visits cannot be reconstructed.</p>}
    </details>)}
    {!loading&&report&&!users.length&&<p className="admin-empty">No matching accounts.</p>}
  </section>;
}
