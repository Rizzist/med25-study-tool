import test from 'node:test';
import assert from 'node:assert/strict';
import {
  academicSemesterIndex,
  academicTermProblem,
  currentAcademicTerm,
  defaultAcademicTerm,
  LEGACY_ACADEMIC_TERM_ANCHOR,
  MAX_ACADEMIC_TERM,
} from '../src/lib/academic-term.mjs';

const at=value=>Date.parse(value);

test('Academic semesters change at Tehran midnight on February 1 and September 1',()=>{
  const boundaries=[
    ['2026-01-31T20:29:59.999Z',4051],
    ['2026-01-31T20:30:00.000Z',4052],
    ['2026-08-31T20:29:59.999Z',4052],
    ['2026-08-31T20:30:00.000Z',4053],
    ['2027-01-31T20:29:59.999Z',4053],
    ['2027-01-31T20:30:00.000Z',4054],
    ['2027-08-31T20:29:59.999Z',4054],
    ['2027-08-31T20:30:00.000Z',4055],
  ];
  for(const [timestamp,expected] of boundaries){
    assert.equal(academicSemesterIndex(at(timestamp)),expected,timestamp);
    assert.equal(academicSemesterIndex(new Date(timestamp)),expected,`Date input: ${timestamp}`);
  }
});

test('August and the January year rollover stay within their existing semester',()=>{
  for(const timestamp of ['2026-07-31T20:30:00Z','2026-08-15T12:00:00Z','2026-08-31T20:29:59Z']){
    assert.equal(academicSemesterIndex(at(timestamp)),4052,timestamp);
  }
  for(const timestamp of ['2026-12-31T20:29:59Z','2026-12-31T20:30:00Z','2027-01-15T12:00:00Z']){
    assert.equal(academicSemesterIndex(at(timestamp)),4053,timestamp);
  }
  assert.equal(academicSemesterIndex(at('2028-02-29T12:00:00Z')),4056,'Leap day stays in the February semester');
});

test('The legacy default is anchored to Term 3 in September 2026 and advances only forward',()=>{
  assert.deepEqual(LEGACY_ACADEMIC_TERM_ANCHOR,{term:3,semesterIndex:4053});
  for(const [timestamp,expected] of [
    ['2025-09-01T12:00:00Z',3],
    ['2026-01-01T12:00:00Z',3],
    ['2026-08-31T20:29:59.999Z',3],
    ['2026-08-31T20:30:00.000Z',3],
    ['2027-01-31T20:29:59.999Z',3],
    ['2027-01-31T20:30:00.000Z',4],
    ['2027-08-31T20:29:59.999Z',4],
    ['2027-08-31T20:30:00.000Z',5],
    ['2028-01-31T20:30:00.000Z',6],
  ]){
    assert.equal(defaultAcademicTerm(at(timestamp)),expected,timestamp);
    assert.equal(currentAcademicTerm({},at(timestamp)),expected,`Unmigrated account: ${timestamp}`);
    assert.equal(currentAcademicTerm({termAnchor:LEGACY_ACADEMIC_TERM_ANCHOR},at(timestamp)),expected,`Migrated account: ${timestamp}`);
  }
});

test('Selected terms advance from their own anchor, without regressing or mutating metadata',()=>{
  const metadata={termAnchor:{term:7,semesterIndex:4052}};
  for(const [timestamp,expected] of [
    ['2025-01-01T00:00:00Z',7],
    ['2026-08-31T20:29:59.999Z',7],
    ['2026-08-31T20:30:00.000Z',8],
    ['2027-01-31T20:29:59.999Z',8],
    ['2027-01-31T20:30:00.000Z',9],
  ])assert.equal(currentAcademicTerm(metadata,at(timestamp)),expected,timestamp);
  assert.deepEqual(metadata,{termAnchor:{term:7,semesterIndex:4052}});
  assert.equal(currentAcademicTerm({termAnchor:{term:30,semesterIndex:4053}},at('2027-02-01T12:00:00Z')),31,'Automatic progression is not capped by the assignment selector');
});

test('Explicit academic terms accept integer numbers from 1 through 30 only',()=>{
  assert.equal(MAX_ACADEMIC_TERM,30);
  for(let term=1;term<=MAX_ACADEMIC_TERM;term++)assert.equal(academicTermProblem(term),null,`Term ${term}`);
  for(const invalid of [undefined,null,'','3','03',0,-1,31,3.5,NaN,Infinity,-Infinity,true,false,[],[3],{},Number.MAX_SAFE_INTEGER]){
    assert.ok(academicTermProblem(invalid),`Reject ${String(invalid)}`);
  }
});

test('Malformed saved anchors fail closed instead of being treated as legacy accounts',()=>{
  for(const termAnchor of [null,{},[],{term:3},{semesterIndex:4053},{term:0,semesterIndex:4053},{term:-1,semesterIndex:4053},{term:1.5,semesterIndex:4053},{term:'3',semesterIndex:4053},{term:3,semesterIndex:-1},{term:3,semesterIndex:4053.5},{term:3,semesterIndex:'4053'},{term:3,semesterIndex:Infinity}]){
    assert.throws(()=>currentAcademicTerm({termAnchor},at('2026-10-08T12:00:00Z')),TypeError,JSON.stringify(termAnchor));
  }
});
