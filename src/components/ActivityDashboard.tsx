"use client";
import {useCallback,useEffect,useId,useRef,useState} from 'react';
import type {ActivityReport} from '../lib/server/activity.mjs';
import {ACTIVITY_TIME_ZONE,buildUsageSeries,formatActivityDuration} from '../lib/activity-chart.mjs';

type UsageSeries=ReturnType<typeof buildUsageSeries>;
type Timeframe=7|30|90;
const timestamp=(at:number|null)=>at===null?'No recorded activity':new Date(at).toLocaleString(undefined,{timeZone:ACTIVITY_TIME_ZONE,dateStyle:'medium',timeStyle:'short'});
const normalize=(value:string)=>value.normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase().trim().replace(/\s+/g,' ');

function UsageChart({series,studentName}:{series:UsageSeries;studentName:string}){
  const container=useRef<HTMLDivElement>(null),chartId=useId();
  const [width,setWidth]=useState(760);
  useEffect(()=>{
    const element=container.current;if(!element)return;
    const observer=new ResizeObserver(entries=>{const next=entries[0]?.contentRect.width;if(next)setWidth(Math.max(200,Math.round(next)));});
    observer.observe(element);return()=>observer.disconnect();
  },[]);
  const chartHeight=232,left=46,right=12,top=16,bottom=32,plotHeight=chartHeight-top-bottom,plotWidth=width-left-right;
  const maximum=Math.max(0,...series.days.map(day=>day.activeMs));
  const unit=maximum>=3_600_000?900_000:maximum>=60_000?60_000:1000;
  const ceiling=maximum?Math.max(unit*4,Math.ceil(maximum/(unit*4))*unit*4):3_600_000;
  const step=plotWidth/series.days.length,barWidth=Math.max(.5,Math.min(34,step*.68));
  const labelEvery=Math.max(1,Math.ceil((series.days.length-1)/(width<480?3:6)));
  return <div ref={container} className="usage-chart-canvas">
    <svg role="img" aria-labelledby={chartId+'-title '+chartId+'-description'} viewBox={`0 0 ${width} ${chartHeight}`} width="100%" height={chartHeight}>
      <title id={chartId+'-title'}>{studentName}: recorded active estimate by visit start date</title>
      <desc id={chartId+'-description'}>{formatActivityDuration(series.totalActiveMs)} across {series.totalVisits} recorded visits during {series.days.length} days. Each visit total is assigned to its start date in Tehran and is not split at midnight. The daily data table provides every value. Missing records do not establish that no studying occurred.</desc>
      {[0,1,2,3,4].map(index=>{
        const value=ceiling*index/4,y=top+plotHeight-plotHeight*index/4;
        return <g key={index} aria-hidden="true"><line x1={left} x2={width-right} y1={y} y2={y} className="usage-grid-line"/><text x={left-9} y={y+4} textAnchor="end" className="usage-axis-label">{formatActivityDuration(value)}</text></g>;
      })}
      {series.days.map((day,index)=>{
        const x=left+step*index+step/2,height=day.activeMs/ceiling*plotHeight;
        const showLabel=labelEvery===1||index===0||index===series.days.length-1||(index%labelEvery===0&&index<series.days.length-2);
        return <g key={day.date} aria-hidden="true">
          {day.activeMs>0&&<rect x={x-barWidth/2} y={top+plotHeight-height} width={barWidth} height={height} rx={Math.min(3,barWidth/2)} className="usage-bar"><title>{day.label}: {formatActivityDuration(day.activeMs)}, {day.visits} {day.visits===1?'visit':'visits'}</title></rect>}
          {day.visits>0&&day.activeMs===0&&<circle cx={x} cy={top+plotHeight} r={2} className="usage-zero-mark"><title>{day.label}: {day.visits} recorded visits, no active time reported</title></circle>}
          {showLabel&&<text x={index===0?left:index===series.days.length-1?width-right:x} y={chartHeight-8} textAnchor={index===0?'start':index===series.days.length-1?'end':'middle'} className="usage-axis-label">{day.label}</text>}
        </g>;
      })}
    </svg>
  </div>;
}

export function ActivityDashboard(){
  const [report,setReport]=useState<ActivityReport|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [query,setQuery]=useState(''),[selectedId,setSelectedId]=useState(''),[days,setDays]=useState<Timeframe>(30);
  const load=useCallback(()=>fetch('/api/admin/activity',{cache:'no-store'})
    .then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error??'Unable to load activity.');return body as ActivityReport;})
    .then(body=>{setReport(body);setError('');})
    .catch(error=>setError(error instanceof Error?error.message:'Unable to load activity.'))
    .finally(()=>setLoading(false)),[]);
  useEffect(()=>{void load();},[load]);
  function refresh(){setLoading(true);void load();}
  const search=normalize(query),users=report?.users.filter(user=>normalize(user.displayName??'Name pending').includes(search)||user.userId.includes(search))??[];
  const selected=users.find(user=>user.userId===selectedId)??users[0]??null;
  const series=selected&&report?buildUsageSeries(selected.visits,{days,now:report.generatedAt}):null;
  const name=selected?.displayName??'Name pending';
  return <section className="admin-activity usage-dashboard" aria-labelledby="usage-title">
    <header className="usage-header"><div><div className="usage-eyebrow">Owner only</div><h2 id="usage-title">Recorded activity</h2><p>Explore one student’s recent study visits.</p></div><button type="button" disabled={loading} onClick={refresh}>{loading?'Refreshing…':'Refresh activity'}</button></header>
    {error&&<div className="usage-error" role="alert"><div><strong>{report?'Activity could not be refreshed':'Activity is unavailable'}</strong><p>{error}{report?' The last successful snapshot is shown below.':''}</p></div><button type="button" disabled={loading} onClick={refresh}>Try again</button></div>}
    {!report&&!error&&<p className="usage-loading" role="status">Loading recorded activity…</p>}
    {report&&<>
      <div className="usage-controls">
        <label>Find a student<input type="search" aria-label="Find activity by name or ID" placeholder="Name or student ID" value={query} onChange={event=>setQuery(event.target.value)}/></label>
        <label>Student<select aria-label="Select student activity" value={selected?.userId??''} disabled={!users.length} onChange={event=>setSelectedId(event.target.value)}>{!users.length&&<option value="">No matching accounts</option>}{users.map(user=><option key={user.userId} value={user.userId}>{user.displayName??'Name pending'} · {user.userId}{user.active?'':' · Removed'}</option>)}</select></label>
        <div className="usage-range-control"><span>Time range</span><div className="usage-range" role="group" aria-label="Activity time range">{([7,30,90] as const).map(value=><button key={value} type="button" aria-pressed={days===value} onClick={()=>setDays(value)}>{value} days</button>)}</div></div>
      </div>
      {!selected?<div className="usage-empty" role="status"><h3>{query?'No matching accounts':'No accounts to show'}</h3><p>{query?'Try another name or student ID.':'Activity will appear here when accounts are available.'}</p>{query&&<button type="button" onClick={()=>setQuery('')}>Clear search</button>}</div>:series&&<div className="usage-student" aria-busy={loading}>
        <div className="usage-student-heading"><div><h3>{name}</h3><code>{selected.userId}</code>{!selected.active&&<span className="usage-removed">Access removed</span>}</div><p>{series.days[0].label} – {series.days[series.days.length-1].label}<span>Asia/Tehran</span></p></div>
        <dl className="usage-metrics">
          <div><dt>Active estimate</dt><dd>{formatActivityDuration(series.totalActiveMs)}</dd><dd className="usage-metric-note">Visits started in this range</dd></div>
          <div><dt>Recorded visits</dt><dd>{series.totalVisits}</dd><dd className="usage-metric-note">Visit starts in this range</dd></div>
          <div><dt>Days with records</dt><dd>{series.recordedDays}<small> / {days}</small></dd><dd className="usage-metric-note">Based on visit start dates</dd></div>
          <div className="usage-last-seen"><dt>Last recorded update</dt><dd>{timestamp(selected.lastSeenAt)}</dd><dd className="usage-metric-note">Across all retained visits · Tehran</dd></div>
        </dl>
        <figure className="usage-chart">
          <div className="usage-chart-heading"><div><h4>Active estimate by visit start date</h4><p>Cumulative time from recorded visits</p></div><span className="usage-legend"><i aria-hidden="true"/>Active estimate</span></div>
          <UsageChart series={series} studentName={name}/>
          {series.totalActiveMs===0&&<div className="usage-chart-empty" role="status"><strong>{series.totalVisits===0?'No visits started in this range':'No active time reported for these visits'}</strong><p>No recorded activity is not evidence that a student did not study.</p></div>}
          <figcaption>Each visit’s full active estimate is assigned to its start date in Tehran. Visits crossing midnight are not split into daily time.</figcaption>
        </figure>
        {series.unplottedVisits>0&&<p className="usage-carryover"><strong>{series.unplottedVisits} {series.unplottedVisits===1?'older visit was':'older visits were'} updated in this range.</strong> They started before the range and hold {formatActivityDuration(series.unplottedActiveMs)} of cumulative active estimates. Those totals are excluded from the chart and range metrics because their activity cannot be allocated to individual dates.</p>}
        <details className="usage-details">
          <summary>Daily data <span>{days} days · Tehran start dates</span></summary>
          <div className="usage-data-scroll" role="region" aria-label="Daily recorded activity data" tabIndex={0}>
            <table className="usage-data-table"><caption className="admin-sr-only">{name}: daily active estimates for visits started in the selected {days} days</caption><thead><tr><th scope="col">Visit start date</th><th scope="col">Active estimate</th><th scope="col">Visits</th></tr></thead><tbody>{series.days.map(day=><tr key={day.date}><th scope="row"><time dateTime={day.date}>{day.date}</time></th><td>{day.visits?formatActivityDuration(day.activeMs):'No recorded activity'}</td><td>{day.visits}</td></tr>)}</tbody></table>
          </div>
        </details>
        <details className="usage-details">
          <summary>Retained visit details <span>{selected.visits.length} {selected.visits.length===1?'visit':'visits'}</span></summary>
          <p className="usage-details-note">All retained visits, including visits that started outside the selected range. Times are in Tehran.</p>
          {selected.visits.length?<div className="usage-data-scroll" role="region" aria-label="Retained visits, scroll horizontally on smaller screens" tabIndex={0}><table className="usage-data-table usage-visit-table"><caption className="admin-sr-only">All retained visits for {name}</caption><thead><tr><th scope="col">Opened</th><th scope="col">Last update</th><th scope="col">Elapsed</th><th scope="col">Active estimate</th></tr></thead><tbody>{selected.visits.map(visit=><tr key={visit.id}><td>{timestamp(visit.startedAt)}</td><td>{timestamp(visit.lastSeenAt)}</td><td>{formatActivityDuration(Math.max(0,visit.lastSeenAt-visit.startedAt))}</td><td>{formatActivityDuration(visit.activeMs)}</td></tr>)}</tbody></table></div>:<p className="usage-details-note">No recorded activity is retained for this account.</p>}
        </details>
      </div>}
      <p className="usage-snapshot" role="status">{loading?'Refreshing snapshot…':error?'Last successful snapshot: ':'Snapshot: '}{timestamp(report.generatedAt)} · Tehran</p>
    </>}
    <details className="usage-methodology">
      <summary>About these estimates <span>Retention, timing, and privacy</span></summary>
      <div>
        <p>Only the owner can view this report. Up to {report?.maxVisitsPerUser??100} recent visits per account are retained for {report?.retentionDays??90} days. A reload or a new tab starts a visit. Missing records do not establish that no studying occurred.</p>
        <p>Active time excludes hidden tabs and pauses after 2 idle minutes. Overlapping tabs and devices count separately, so this is an estimate, not an attendance record.</p>
        <p>Stored visits contain cumulative activity, not a historical daily timeline. The chart assigns a visit’s full total to its start date in Asia/Tehran; time across midnight cannot be split accurately from these records.</p>
        <p>Updates arrive approximately every 5 active minutes and on leaving a page. Closing the browser or losing connectivity can omit the final update. No answers, keystrokes, IP addresses, or outside browsing are recorded.</p>
      </div>
    </details>
  </section>;
}
