import test from 'node:test';
import assert from 'node:assert/strict';
import {accountSummary,accountTermOptions,filterAccounts} from '../src/lib/admin-accounts.mjs';

function deepFreeze(value){
  if(value&&typeof value==='object'){
    for(const child of Object.values(value))deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

// Synthetic managed-account rows: the pending state overlaps active access,
// while a removed account can still retain its password-setup flag.
const ACCOUNTS=deepFreeze([
  {userId:'40000000811',displayName:'Zoë Example',currentTerm:10,active:true,mustChangePassword:false,role:'admin'},
  {userId:'40000000812',displayName:'José Núñez',currentTerm:2,active:true,mustChangePassword:true,role:'student'},
  {userId:'40000000813',displayName:'Ámina  Test',currentTerm:3,active:true,mustChangePassword:false,role:'owner'},
  {userId:'40000000814',displayName:null,currentTerm:12,active:true,mustChangePassword:false,role:'student'},
  {userId:'40000000815',displayName:'Amina Test',currentTerm:3,active:false,mustChangePassword:true,role:'student'},
  {userId:'40000000816',displayName:'AMINA Test',currentTerm:2,active:true,mustChangePassword:true,role:'student'},
  {userId:'40000000817',displayName:'مریم رضایی',currentTerm:10,active:false,mustChangePassword:false,role:'student'},
]);
const ids=accounts=>accounts.map(account=>account.userId);

test('Default account filters retain every row and its original ordering',()=>{
  assert.deepEqual(filterAccounts(ACCOUNTS),ACCOUNTS);
  assert.deepEqual(filterAccounts(ACCOUNTS,{}),ACCOUNTS);
  assert.deepEqual(filterAccounts(ACCOUNTS,{query:'',term:'all',access:'all'}),ACCOUNTS);
  assert.deepEqual(filterAccounts(ACCOUNTS,{query:' \t\n  '}),ACCOUNTS);
});

test('Account search folds case and accents on both the name and the query',()=>{
  for(const query of ['jose nunez','  JOSÉ NÚÑEZ  ','Jose\u0301 Nu\u0301n\u0303ez']){
    assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query})),['40000000812'],query);
  }
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'zoe'})),['40000000811']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'  áMÍná  '})),['40000000813','40000000815','40000000816']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'míNA t'})),['40000000813','40000000815','40000000816'],'Substring search remains useful after normalization');
});

test('Account search trims and collapses whitespace in both queries and names',()=>{
  for(const query of ['Amina Test','  AMINA    TEST  ','Amina\tTest','Amina\nTest']){
    assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query})),['40000000813','40000000815','40000000816'],JSON.stringify(query));
  }
});

test('Account search matches student IDs, supports unnamed accounts, and preserves non-Latin names',()=>{
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'40000000814'})),['40000000814']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'  00814  '})),['40000000814']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'0081'})),ids(ACCOUNTS));
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'مریم'})),['40000000817']);
  assert.deepEqual(filterAccounts(ACCOUNTS,{query:'No Matching Fixture'}),[]);
  assert.deepEqual(filterAccounts(ACCOUNTS,{query:'null'}),[],'A missing name is not converted to the searchable word null');
});

test('Access filters distinguish enabled, pending setup, and removed accounts',()=>{
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{access:'active'})),['40000000811','40000000812','40000000813','40000000814','40000000816']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{access:'pending'})),['40000000812','40000000816']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{access:'removed'})),['40000000815','40000000817']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{access:'all'})),ids(ACCOUNTS));
});

test('Term filtering uses the current term and composes with search and access status',()=>{
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{term:3})),['40000000813','40000000815']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'amina test',term:3,access:'active'})),['40000000813']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'amina test',term:3,access:'removed'})),['40000000815']);
  assert.deepEqual(ids(filterAccounts(ACCOUNTS,{query:'mina',term:2,access:'pending'})),['40000000816']);
  assert.deepEqual(filterAccounts(ACCOUNTS,{query:'mina',term:3,access:'pending'}),[],'A removed pending account cannot satisfy the pending filter');
  assert.deepEqual(filterAccounts(ACCOUNTS,{term:1}),[]);
});

test('Available terms are unique and numerically sorted across all account statuses',()=>{
  assert.deepEqual(accountTermOptions(ACCOUNTS),[2,3,10,12]);
  assert.deepEqual(accountTermOptions([ACCOUNTS[6],ACCOUNTS[4]]),[3,10],'Removed accounts remain available through the term filter');
  assert.deepEqual(accountTermOptions([ACCOUNTS[0],ACCOUNTS[6],ACCOUNTS[0]]),[10]);
});

test('Account summaries count pending setup as active and exclude removed accounts from pending',()=>{
  assert.deepEqual(accountSummary(ACCOUNTS),{total:7,active:5,pending:2,removed:2});
  assert.deepEqual(accountSummary([ACCOUNTS[1],ACCOUNTS[5]]),{total:2,active:2,pending:2,removed:0});
  assert.deepEqual(accountSummary([ACCOUNTS[4],ACCOUNTS[6]]),{total:2,active:0,pending:0,removed:2});
  assert.deepEqual(accountSummary(filterAccounts(ACCOUNTS,{term:3})),{total:2,active:1,pending:0,removed:1});
});

test('Empty account lists yield empty results, term choices, and zero counts',()=>{
  const empty=Object.freeze([]);
  assert.deepEqual(filterAccounts(empty),[]);
  assert.deepEqual(filterAccounts(empty,{query:'Fixture',term:3,access:'pending'}),[]);
  assert.deepEqual(accountTermOptions(empty),[]);
  assert.deepEqual(accountSummary(empty),{total:0,active:0,pending:0,removed:0});
});

test('Filtering and aggregation do not mutate account rows, array ordering, or filter options',()=>{
  const accounts=deepFreeze(structuredClone(ACCOUNTS)),before=structuredClone(accounts);
  const options=deepFreeze({query:'  ÁMINA   TEST  ',term:3,access:'all'}),optionsBefore=structuredClone(options);
  filterAccounts(accounts,options);
  accountTermOptions(accounts);
  accountSummary(accounts);
  assert.deepEqual(accounts,before);
  assert.deepEqual(options,optionsBefore);
  assert.deepEqual(filterAccounts(accounts,{query:'amina',term:3,access:'active'}),[accounts[2]],'Repeated calls remain independent');
});
