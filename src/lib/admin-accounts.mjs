const searchable=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('en').trim().replace(/\s+/g,' ');

/** Apply independent filters without changing account data or the server's ordering. */
export function filterAccounts(accounts,{query='',term='all',access='all'}={}){
  const needle=searchable(query);
  return accounts.filter(account=>{
    if(term!=='all'&&account.currentTerm!==term)return false;
    if(access==='active'&&!account.active)return false;
    if(access==='pending'&&(!account.active||!account.mustChangePassword))return false;
    if(access==='removed'&&account.active)return false;
    return !needle||searchable(account.displayName??'Name pending').includes(needle)||searchable(account.userId).includes(needle);
  });
}

export function accountTermOptions(accounts){
  return [...new Set(accounts.map(account=>account.currentTerm).filter(term=>Number.isSafeInteger(term)&&term>0))].sort((a,b)=>a-b);
}

export function accountSummary(accounts){
  return accounts.reduce((summary,account)=>{
    summary.total++;
    if(account.active){summary.active++;if(account.mustChangePassword)summary.pending++;}
    else summary.removed++;
    return summary;
  },{total:0,active:0,pending:0,removed:0});
}
