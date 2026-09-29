"use client";
import {useCallback,useEffect,useState,type FormEvent} from 'react';

type ManagedAccount={userId:string;displayName:string|null;active:boolean;mustChangePassword:boolean;sessionCount:number;isAdmin:boolean};
const headers={'content-type':'application/json','x-med25-auth':'1'};

export function AdminDashboard(){
  const [accounts,setAccounts]=useState<ManagedAccount[]>([]),[drafts,setDrafts]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const load=useCallback(async()=>{
    setError('');try{const response=await fetch('/api/admin/accounts',{cache:'no-store'}),body=await response.json();if(!response.ok)throw new Error(body.error??'Could not load accounts.');setAccounts(body.accounts);setDrafts(Object.fromEntries(body.accounts.map((account:ManagedAccount)=>[account.userId,account.displayName??''])));}
    catch(error){setError(error instanceof Error?error.message:'Could not load accounts.');}finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  async function mutate(key:string,url:string,method:string,body:Record<string,unknown>,success:string){
    setBusy(key);setError('');setNotice('');try{const response=await fetch(url,{method,headers,body:JSON.stringify(body)}),result=await response.json();if(!response.ok)throw new Error(result.error??'Could not update the account.');setNotice(success);await load();return true;}
    catch(error){setError(error instanceof Error?error.message:'Could not update the account.');return false;}finally{setBusy('');}
  }
  async function add(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget,fields=Object.fromEntries(new FormData(form));
    if(await mutate('add','/api/admin/accounts','POST',{userId:fields.userId,displayName:fields.displayName},'Student added. Their temporary password is their student ID; a new name and password are required before study access.'))form.reset();
  }
  return <main className="admin-screen">
    <header className="admin-header"><div><a href="/">← Back to MED//25</a><p className="auth-eyebrow">Owner controls</p><h1>Account dashboard</h1><p>Add students, update names, revoke access, or reset a forgotten password.</p></div><span>{accounts.filter(account=>account.active).length} active</span></header>
    {error&&<p className="auth-error" role="alert">{error}</p>}{notice&&<p className="admin-notice" role="status">{notice}</p>}
    <section className="admin-add" aria-labelledby="add-student"><div><h2 id="add-student">Add a student</h2><p>Their student ID becomes a one-time password. They cannot reach study content until they set their full name and a new private password.</p></div><form onSubmit={add}><label>Student ID<input name="userId" inputMode="numeric" pattern="[0-9]{5,32}" required placeholder="Student ID"/></label><label>Full name<input name="displayName" autoComplete="off" minLength={2} maxLength={80} required placeholder="Full name"/></label><button className="primary" disabled={busy!==''}>{busy==='add'?'Adding…':'Add student'}</button></form></section>
    <section className="admin-list" aria-labelledby="student-accounts"><div className="admin-list-heading"><h2 id="student-accounts">Student accounts</h2><button type="button" onClick={()=>void load()} disabled={loading||busy!==''}>Refresh</button></div>
      {loading?<p role="status">Loading secure account list…</p>:accounts.map(account=><article key={account.userId} className={!account.active?'disabled':''}>
        <div className="admin-account-summary"><div><h3>{account.displayName??'Name pending'} {account.isAdmin&&<small>Owner</small>}</h3><code>{account.userId}</code></div><div className="admin-status"><span className={account.active?'active':'inactive'}>{account.active?'Active':'Removed'}</span>{account.active&&<span>{account.mustChangePassword?'Setup required':'Password set'}</span>}<span>{account.sessionCount} session{account.sessionCount===1?'':'s'}</span></div></div>
        <div className="admin-account-actions"><label>Display name<input value={drafts[account.userId]??''} minLength={2} maxLength={80} onChange={event=>setDrafts(current=>({...current,[account.userId]:event.target.value}))}/></label>
          <button type="button" disabled={!account.active||busy!==''||drafts[account.userId]===account.displayName} onClick={()=>void mutate('name-'+account.userId,'/api/admin/accounts','PATCH',{userId:account.userId,displayName:drafts[account.userId]},'Name updated.')}>Save name</button>
          {!account.isAdmin&&account.active&&<><button type="button" disabled={busy!==''} onClick={()=>{if(confirm(`Reset ${account.displayName??'this student'}'s password to their student ID and sign out all their sessions?`))void mutate('reset-'+account.userId,'/api/admin/accounts','POST',{action:'reset',userId:account.userId},'Temporary password restored; the student must change it at next login.');}}>Reset password</button><button type="button" className="danger" disabled={busy!==''} onClick={()=>{if(confirm(`Remove access for ${account.displayName??'this student'}? Their current sessions will be revoked immediately.`))void mutate('remove-'+account.userId,'/api/admin/accounts','DELETE',{userId:account.userId},'Student access removed and sessions revoked.');}}>Remove access</button></>}
          {!account.active&&<button type="button" disabled={busy!==''} onClick={()=>void mutate('restore-'+account.userId,'/api/admin/accounts','POST',{userId:account.userId,displayName:drafts[account.userId]||account.displayName},'Student restored with their student ID as a one-time password.')}>Restore access</button>}
        </div>
      </article>)}
    </section>
    <p className="admin-security-note">Account changes are stored in the private MED25 database. Passwords are never shown here; resetting creates a one-time student-ID password and revokes every existing session for that student.</p>
  </main>;
}
