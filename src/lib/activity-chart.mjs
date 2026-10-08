export const ACTIVITY_TIME_ZONE='Asia/Tehran';
const calendar=new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn',{timeZone:ACTIVITY_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'});
const dayLabel=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',month:'short',day:'numeric'});
const DAY_MS=86_400_000;

function dayKey(timestamp){
  const parts=calendar.formatToParts(timestamp),part=type=>parts.find(value=>value.type===type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Historical records contain visit totals, not a per-day time ledger.
 * Group whole visits by their Tehran start date; never invent a midnight split.
 */
export function buildUsageSeries(visits,{days=30,now=Date.now()}={}){
  if(![7,30,90].includes(days)||!Number.isFinite(now)||!Number.isFinite(new Date(now).getTime()))throw new RangeError('Choose a valid activity window and snapshot time.');
  const today=dayKey(now),calendarMidnight=Date.parse(today+'T00:00:00Z');
  const points=Array.from({length:days},(_,index)=>{
    const date=new Date(calendarMidnight-(days-1-index)*DAY_MS);
    return {date:date.toISOString().slice(0,10),label:dayLabel.format(date),activeMs:0,visits:0};
  });
  const buckets=new Map(points.map(point=>[point.date,point])),unique=new Map();
  for(const visit of visits){
    if(!visit||typeof visit.id!=='string'||!visit.id||![visit.startedAt,visit.lastSeenAt,visit.activeMs].every(Number.isFinite)||visit.startedAt<0||visit.startedAt>now||visit.lastSeenAt<visit.startedAt||visit.activeMs<0)continue;
    const previous=unique.get(visit.id);
    if(!previous||visit.lastSeenAt>previous.lastSeenAt||visit.lastSeenAt===previous.lastSeenAt&&visit.activeMs>previous.activeMs)unique.set(visit.id,visit);
  }
  let totalActiveMs=0,totalVisits=0,unplottedVisits=0,unplottedActiveMs=0;
  for(const visit of unique.values()){
    const lastSeenAt=Math.min(visit.lastSeenAt,now),activeMs=Math.min(visit.activeMs,lastSeenAt-visit.startedAt);
    const startDate=dayKey(visit.startedAt),bucket=buckets.get(startDate);
    if(bucket){bucket.activeMs+=activeMs;bucket.visits++;totalActiveMs+=activeMs;totalVisits++;}
    else if(startDate<points[0].date&&dayKey(lastSeenAt)>=points[0].date){unplottedVisits++;unplottedActiveMs+=activeMs;}
  }
  return {days:points,totalActiveMs,totalVisits,recordedDays:points.filter(point=>point.visits>0).length,unplottedVisits,unplottedActiveMs};
}

export function formatActivityDuration(value){
  const ms=Number.isFinite(value)?Math.max(0,value):0;
  if(ms<60_000)return Math.floor(ms/1000)+'s';
  if(ms<3_600_000)return Math.floor(ms/60_000)+'m';
  return Math.floor(ms/3_600_000)+'h '+Math.floor(ms%3_600_000/60_000)+'m';
}
