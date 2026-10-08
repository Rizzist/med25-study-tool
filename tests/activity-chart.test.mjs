import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVITY_TIME_ZONE,buildUsageSeries,formatActivityDuration} from '../src/lib/activity-chart.mjs';

const at=value=>Date.parse(value);
const NOW=at('2026-10-08T12:00:00Z');
const id=value=>`00000000-0000-4000-8000-${String(value).padStart(12,'0')}`;
const visit=(index,startedAt,lastSeenAt,activeMs)=>({id:id(index),startedAt:at(startedAt),lastSeenAt:at(lastSeenAt),activeMs});
const bucket=(series,date)=>series.days.find(day=>day.date===date);

function deepFreeze(value){
  if(value&&typeof value==='object'){
    for(const child of Object.values(value))deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function assertConserved(series){
  assert.equal(series.totalActiveMs,series.days.reduce((sum,day)=>sum+day.activeMs,0));
  assert.equal(series.totalVisits,series.days.reduce((sum,day)=>sum+day.visits,0));
  assert.equal(series.recordedDays,series.days.filter(day=>day.visits>0).length);
}

test('Usage charts use the Tehran calendar and fill each supported range through today',()=>{
  assert.equal(ACTIVITY_TIME_ZONE,'Asia/Tehran');
  for(const [days,first] of [[7,'2026-10-02'],[30,'2026-09-09'],[90,'2026-07-11']]){
    const series=buildUsageSeries([],{days,now:NOW});
    assert.equal(series.days.length,days);
    assert.equal(series.days[0].date,first);
    assert.equal(series.days.at(-1).date,'2026-10-08');
    assert.equal(series.days.at(-1).label,'8 Oct');
    const dates=series.days.map(day=>day.date);
    assert.deepEqual(dates,[...dates].sort());
    assert.equal(new Set(dates).size,days);
    for(let index=1;index<dates.length;index++)assert.equal(at(dates[index])-at(dates[index-1]),86_400_000,'No missing calendar days');
    assert.ok(series.days.every(day=>day.activeMs===0&&day.visits===0));
    assert.equal(series.totalActiveMs,0);
    assert.equal(series.totalVisits,0);
    assert.equal(series.recordedDays,0);
    assert.equal(series.unplottedVisits,0);
    assert.equal(series.unplottedActiveMs,0);
    assertConserved(series);
  }
});

test('Today advances at Tehran midnight rather than UTC midnight',()=>{
  const before=buildUsageSeries([],{days:7,now:at('2026-10-08T20:29:59.999Z')});
  const after=buildUsageSeries([],{days:7,now:at('2026-10-08T20:30:00.000Z')});
  assert.equal(before.days.at(-1).date,'2026-10-08');
  assert.equal(after.days.at(-1).date,'2026-10-09');
  assert.equal(after.days[0].date,'2026-10-03');
  assert.equal(after.days.at(-1).label,'9 Oct');
});

test('Daily ranges stay consecutive across year boundaries and leap days',()=>{
  const newYear=buildUsageSeries([],{days:7,now:at('2027-01-02T12:00:00Z')});
  assert.deepEqual(newYear.days.map(day=>day.date),['2026-12-27','2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02']);
  assert.deepEqual(newYear.days.slice(-3).map(day=>day.label),['31 Dec','1 Jan','2 Jan']);
  const leap=buildUsageSeries([],{days:7,now:at('2028-03-02T12:00:00Z')});
  assert.deepEqual(leap.days.map(day=>day.date),['2028-02-25','2028-02-26','2028-02-27','2028-02-28','2028-02-29','2028-03-01','2028-03-02']);
  assert.equal(bucket(leap,'2028-02-29').label,'29 Feb');
  const ordinary=buildUsageSeries([],{days:7,now:at('2027-03-02T12:00:00Z')});
  assert.deepEqual(ordinary.days.map(day=>day.date),['2027-02-24','2027-02-25','2027-02-26','2027-02-27','2027-02-28','2027-03-01','2027-03-02']);
});

test('Visits on either side of Tehran midnight are assigned to their local start dates',()=>{
  const visits=[
    visit(1,'2026-10-07T20:29:59.999Z','2026-10-07T20:30:00.999Z',1000),
    visit(2,'2026-10-07T20:30:00.000Z','2026-10-07T20:30:02.000Z',2000),
  ];
  const series=buildUsageSeries(visits,{days:7,now:NOW});
  assert.deepEqual(bucket(series,'2026-10-07'),{date:'2026-10-07',label:'7 Oct',activeMs:1000,visits:1});
  assert.deepEqual(bucket(series,'2026-10-08'),{date:'2026-10-08',label:'8 Oct',activeMs:2000,visits:1});
  assert.equal(series.totalActiveMs,3000);
  assert.equal(series.totalVisits,2);
  assert.equal(series.recordedDays,2);
  assertConserved(series);
});

test('A visit crossing midnight contributes its entire active estimate to its start day',()=>{
  const series=buildUsageSeries([
    visit(1,'2026-10-06T20:29:50Z','2026-10-06T20:30:50Z',45_000),
    visit(2,'2026-10-06T10:00:00Z','2026-10-06T10:00:10Z',5000),
    visit(3,'2026-10-08T10:00:00Z','2026-10-08T10:01:00Z',30_000),
    visit(4,'2026-10-08T11:00:00Z','2026-10-08T11:00:00Z',0),
  ],{days:7,now:NOW});
  assert.equal(bucket(series,'2026-10-06').activeMs,50_000);
  assert.equal(bucket(series,'2026-10-06').visits,2);
  assert.equal(bucket(series,'2026-10-07').activeMs,0);
  assert.equal(bucket(series,'2026-10-07').visits,0);
  assert.equal(bucket(series,'2026-10-08').activeMs,30_000);
  assert.equal(bucket(series,'2026-10-08').visits,2);
  assert.equal(series.totalActiveMs,80_000);
  assert.equal(series.totalVisits,4);
  assert.equal(series.recordedDays,2);
  assertConserved(series);
});

test('Zero-active visits still count as recorded visits and recorded days',()=>{
  const series=buildUsageSeries([
    visit(1,'2026-10-03T10:00:00Z','2026-10-03T10:00:00Z',0),
    visit(2,'2026-10-05T10:00:00Z','2026-10-05T10:00:10Z',0),
  ],{days:7,now:NOW});
  assert.equal(series.totalActiveMs,0);
  assert.equal(series.totalVisits,2);
  assert.equal(series.recordedDays,2);
  assertConserved(series);
});

test('The first midnight is inclusive and older carryover visits remain outside graph totals',()=>{
  const series=buildUsageSeries([
    visit(1,'2026-10-01T20:30:00.000Z','2026-10-01T20:30:01.000Z',1000),
    visit(2,'2026-10-01T20:29:59.999Z','2026-10-01T20:30:00.000Z',1),
    visit(3,'2026-09-30T10:00:00.000Z','2026-10-03T10:00:00.000Z',5000),
    visit(4,'2026-09-30T10:00:00.000Z','2026-10-01T20:29:59.999Z',9000),
  ],{days:7,now:NOW});
  assert.equal(bucket(series,'2026-10-02').activeMs,1000);
  assert.equal(bucket(series,'2026-10-02').visits,1);
  assert.equal(series.totalActiveMs,1000);
  assert.equal(series.totalVisits,1);
  assert.equal(series.recordedDays,1);
  assert.equal(series.unplottedVisits,2);
  assert.equal(series.unplottedActiveMs,5001);
  assertConserved(series);
});

test('Changing ranges moves a carryover into its start-day bucket without double counting',()=>{
  const visits=[visit(1,'2026-09-30T10:00:00Z','2026-10-03T10:00:00Z',75_000)];
  const short=buildUsageSeries(visits,{days:7,now:NOW});
  const long=buildUsageSeries(visits,{days:30,now:NOW});
  assert.equal(short.totalVisits,0);
  assert.equal(short.totalActiveMs,0);
  assert.equal(short.unplottedVisits,1);
  assert.equal(short.unplottedActiveMs,75_000);
  assert.equal(long.totalVisits,1);
  assert.equal(long.totalActiveMs,75_000);
  assert.equal(long.unplottedVisits,0);
  assert.equal(long.unplottedActiveMs,0);
  assert.equal(bucket(long,'2026-09-30').activeMs,75_000);
  assertConserved(short);assertConserved(long);
});

test('Duplicate visit IDs use the latest update independent of input ordering',()=>{
  const old=visit(1,'2026-10-03T10:00:00Z','2026-10-03T10:01:00Z',30_000);
  const latest=visit(1,'2026-10-03T10:00:00Z','2026-10-03T10:02:00Z',75_000);
  const other=visit(2,'2026-10-04T10:00:00Z','2026-10-04T10:01:00Z',20_000);
  const expected=buildUsageSeries([latest,other],{days:7,now:NOW});
  for(const visits of [[old,latest,other],[latest,old,other],[old,other,latest,latest]]){
    assert.deepEqual(buildUsageSeries(visits,{days:7,now:NOW}),expected);
  }
  assert.equal(expected.totalVisits,2);
  assert.equal(expected.totalActiveMs,95_000);
  assertConserved(expected);
});

test('Duplicate carryovers are counted once in the unplotted callout',()=>{
  const old=visit(1,'2026-09-30T10:00:00Z','2026-10-02T10:00:00Z',20_000);
  const latest=visit(1,'2026-09-30T10:00:00Z','2026-10-03T10:00:00Z',50_000);
  const series=buildUsageSeries([latest,old,latest],{days:7,now:NOW});
  assert.equal(series.totalVisits,0);
  assert.equal(series.totalActiveMs,0);
  assert.equal(series.unplottedVisits,1);
  assert.equal(series.unplottedActiveMs,50_000);
  assertConserved(series);
});

test('Duplicate updates with matching timestamps retain the higher active estimate',()=>{
  const lower=visit(1,'2026-10-03T10:00:00Z','2026-10-03T10:02:00Z',30_000);
  const higher={...lower,activeMs:75_000};
  for(const visits of [[lower,higher],[higher,lower]]){
    const series=buildUsageSeries(visits,{days:7,now:NOW});
    assert.equal(series.totalVisits,1);
    assert.equal(series.totalActiveMs,75_000);
    assertConserved(series);
  }
  const newer={...lower,lastSeenAt:lower.lastSeenAt+1000,activeMs:10_000};
  assert.equal(buildUsageSeries([higher,newer],{days:7,now:NOW}).totalActiveMs,10_000,'Update recency takes priority over the active estimate');
});

test('Malformed, negative, reversed, and future-start visits are excluded',()=>{
  const valid=visit(1,'2026-10-08T11:00:00Z','2026-10-08T11:01:00Z',5000);
  const invalid=[
    null,undefined,{},
    {...valid,id:''},{...valid,id:7},{...valid,id:undefined},
    {...valid,id:id(2),startedAt:NaN},
    {...valid,id:id(3),lastSeenAt:Infinity},
    {...valid,id:id(4),activeMs:NaN},
    {...valid,id:id(5),activeMs:Infinity},
    {...valid,id:id(6),activeMs:-1},
    {...valid,id:id(7),startedAt:-1},
    {...valid,id:id(8),startedAt:String(valid.startedAt)},
    {...valid,id:id(9),lastSeenAt:String(valid.lastSeenAt)},
    {...valid,id:id(10),activeMs:'5000'},
    {...valid,id:id(11),lastSeenAt:valid.startedAt-1},
    {...valid,id:id(12),startedAt:NOW+1,lastSeenAt:NOW+1000},
  ];
  const series=buildUsageSeries([...invalid,valid],{days:7,now:NOW});
  assert.equal(series.totalVisits,1);
  assert.equal(series.totalActiveMs,5000);
  assert.equal(series.recordedDays,1);
  assert.equal(series.unplottedVisits,0);
  assert.equal(series.unplottedActiveMs,0);
  assertConserved(series);
});

test('Active estimates cannot exceed elapsed time and future updates are clamped to the snapshot',()=>{
  const series=buildUsageSeries([
    visit(1,'2026-10-08T11:00:00Z','2026-10-08T11:00:10Z',100_000),
    visit(2,'2026-10-08T11:59:00Z','2026-10-08T12:10:00Z',120_000),
    visit(3,'2026-10-08T11:59:00Z','2026-10-08T12:10:00Z',30_000),
    visit(4,'2026-10-08T12:00:00Z','2026-10-08T12:10:00Z',5000),
  ],{days:7,now:NOW});
  assert.equal(series.totalVisits,4);
  assert.equal(series.totalActiveMs,100_000,'10s elapsed + 60s until snapshot + 30s estimate + 0s since opening');
  assert.equal(series.recordedDays,1);
  assertConserved(series);
});

test('Carryover active estimates are clamped by the same snapshot and elapsed-time rules',()=>{
  const startedAt=at('2026-09-30T10:00:00Z');
  const series=buildUsageSeries([{id:id(1),startedAt,lastSeenAt:NOW+100_000,activeMs:1e12}],{days:7,now:NOW});
  assert.equal(series.totalVisits,0);
  assert.equal(series.totalActiveMs,0);
  assert.equal(series.unplottedVisits,1);
  assert.equal(series.unplottedActiveMs,NOW-startedAt);
  assertConserved(series);
});

test('A malformed duplicate cannot displace a valid visit update',()=>{
  const valid=visit(1,'2026-10-03T10:00:00Z','2026-10-03T10:01:00Z',30_000);
  const invalid={...valid,lastSeenAt:valid.lastSeenAt+1000,activeMs:-1};
  for(const visits of [[valid,invalid],[invalid,valid]]){
    const series=buildUsageSeries(visits,{days:7,now:NOW});
    assert.equal(series.totalVisits,1);
    assert.equal(series.totalActiveMs,30_000);
    assertConserved(series);
  }
});

test('Activity duration text floors partial units and is stable at minute and hour boundaries',()=>{
  for(const [duration,expected] of [[0,'0s'],[999,'0s'],[1000,'1s'],[59_999,'59s'],[60_000,'1m'],[119_999,'1m'],[3_599_999,'59m'],[3_600_000,'1h 0m'],[3_660_000,'1h 1m'],[7_199_999,'1h 59m'],[86_400_000,'24h 0m']]){
    assert.equal(formatActivityDuration(duration),expected,String(duration));
  }
  for(const invalid of [-1,-60_000,NaN,Infinity,-Infinity])assert.equal(formatActivityDuration(invalid),'0s');
});

test('Unsupported windows and invalid snapshot timestamps reject before generating a chart',()=>{
  assert.equal(buildUsageSeries([],{now:NOW}).days.length,30);
  for(const days of [0,1,8,31,91,'7',null,NaN]){
    assert.throws(()=>buildUsageSeries([],{days,now:NOW}),RangeError,`Window ${String(days)}`);
  }
  for(const now of [NaN,Infinity,-Infinity,Number.MAX_VALUE,'2026-10-08']){
    assert.throws(()=>buildUsageSeries([],{days:7,now}),RangeError,`Snapshot ${String(now)}`);
  }
});

test('Usage calculation does not mutate input records, order, or options',()=>{
  const visits=deepFreeze([
    visit(2,'2026-10-08T10:00:00Z','2026-10-08T10:01:00Z',60_000),
    visit(1,'2026-10-02T10:00:00Z','2026-10-02T10:01:00Z',5000),
  ]);
  const options=Object.freeze({days:7,now:NOW}),before=structuredClone(visits);
  const series=buildUsageSeries(visits,options);
  assert.deepEqual(visits,before);
  assert.deepEqual(options,{days:7,now:NOW});
  series.days[0].activeMs=999;
  assert.equal(buildUsageSeries(visits,options).days[0].activeMs,5000,'Returned bucket state is not reused between calls');
});
