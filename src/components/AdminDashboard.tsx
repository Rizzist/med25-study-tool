"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type {ManagedAccount} from '../lib/server/auth-core.mjs';
import {accountSummary,accountTermOptions,filterAccounts} from '../lib/admin-accounts.mjs';
import {useAuthAccount} from './AuthBoundary';

const headers={'content-type':'application/json','x-med25-auth':'1'};
const ActivityDashboard=dynamic(()=>import('./ActivityDashboard').then(m=>m.ActivityDashboard),{loading:()=> <p className="admin-loading" role="status">Loading activity view…</p>});
type Editor={kind:'add'}|{kind:'manage';account:ManagedAccount};
type AccessFilter='all'|'active'|'pending'|'removed';

export function AdminDashboard(){
  const {isOwner,isAdmin,canAccessAdmin}=useAuthAccount();
  const [accounts,setAccounts]=useState<ManagedAccount[]>([]),[loaded,setLoaded]=useState(false);
  const [view,setView]=useState<'accounts'|'activity'>('accounts');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [loadError,setLoadError]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [query,setQuery]=useState(''),[termFilter,setTermFilter]=useState<'all'|number>('all'),[accessFilter,setAccessFilter]=useState<AccessFilter>('all');
  const [editor,setEditor]=useState<Editor|null>(null),[editorError,setEditorError]=useState('');
  const [name,setName]=useState('');
  const [defaultTerm,setDefaultTerm]=useState(3),[term,setTerm]=useState(3);
  const dialog=useRef<HTMLDialogElement>(null),nameInput=useRef<HTMLInputElement>(null),idInput=useRef<HTMLInputElement>(null);
  const load=useCallback(()=>fetch('/api/admin/accounts',{cache:'no-store'})
    .then(async response=>{
      const body=await response.json();
      if(!response.ok)throw new Error(body.error??'Could not load accounts.');
      return body;
    })
    .then(body=>{setAccounts(body.accounts);setDefaultTerm(body.defaultTerm);setLoaded(true);setLoadError('');})
    .catch(error=>{setLoadError(error instanceof Error?error.message:'Could not load accounts.');})
    .finally(()=>setLoading(false)),[]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    if(editor){dialog.current?.showModal();(editor.kind==='add'?idInput:nameInput).current?.focus();}
    else dialog.current?.close();
  },[editor]);
  function openEditor(value:Editor){setEditorError('');setName(value.kind==='manage'?value.account.displayName??'':'');setTerm(value.kind==='manage'?value.account.currentTerm:defaultTerm);setEditor(value);}
  function refresh(){setLoading(true);void load();}
  function clearFilters(){setQuery('');setTermFilter('all');setAccessFilter('all');}
  async function mutate(method:string,body:Record<string,unknown>,success:string,inDialog=false){
    setBusy(true);setError('');setEditorError('');setNotice('');
    try{
      const response=await fetch('/api/admin/accounts',{method,headers,body:JSON.stringify(body)}),result=await response.json();
      if(!response.ok)throw new Error(result.error??'Could not update the account.');
      setNotice(success);if(inDialog)setEditor(null);setLoading(true);await load();return true;
    }catch(error){(inDialog?setEditorError:setError)(error instanceof Error?error.message:'Could not update the account.');return false;}
    finally{setBusy(false);}
  }
  function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!editor)return;
    if(editor.kind==='add'){
      const fields=new FormData(event.currentTarget);
      void mutate('POST',{userId:fields.get('userId'),displayName:name,currentTerm:term},'Student added. They sign in with their student ID, then confirm their name and change their password.',true);
    }else{
      const account=editor.account;
      void mutate(account.active?'PATCH':'POST',{userId:account.userId,displayName:name,...(term!==account.currentTerm?{currentTerm:term}:{})},account.active?'Account updated.':'Access restored as a student. First-login setup is required.',true);
    }
  }
  const filtered=filterAccounts(accounts,{query,term:termFilter,access:accessFilter}),summary=loaded?accountSummary(accounts):null;
  const termOptions=accountTermOptions(accounts),hasFilters=Boolean(query.trim()||termFilter!=='all'||accessFilter!=='all');
  const current=editor?.kind==='manage'?editor.account:null;
  return <main className="admin-screen">
    <header className="admin-header">
      <div className="admin-header-copy">
        <div className="admin-breadcrumb"><Link href="/" aria-label="Back to MED25">← MED//25</Link><span>Administration</span></div>
        <h1>Student accounts</h1>
        <p className="admin-permissions">{isOwner?'Manage access and assign roles for your students.':isAdmin?'Manage student access. The owner assigns account roles.':'Add new students. An owner or admin can manage existing accounts.'}</p>
      </div>
      <button type="button" className="primary admin-add" disabled={!loaded||loading||busy||!canAccessAdmin} onClick={()=>openEditor({kind:'add'})}><span aria-hidden="true">+</span> Add student</button>
    </header>
    {isOwner&&<div className="admin-views" role="group" aria-label="Owner dashboard view"><button type="button" aria-pressed={view==='accounts'} onClick={()=>setView('accounts')}>Accounts</button><button type="button" aria-pressed={view==='activity'} onClick={()=>setView('activity')}>Activity <span>Owner only</span></button></div>}
    {error&&<p className="auth-error" role="alert">{error}</p>}
    {notice&&<p className="admin-notice" role="status">{notice}</p>}
    {view==='activity'&&isOwner?<ActivityDashboard/>:<>
      <dl className="admin-summary" aria-label="Account overview" aria-busy={loading}>
        <div><dt>Total accounts</dt><dd>{summary?.total??'—'}</dd><dd className="admin-summary-hint">All students and staff</dd></div>
        <div><dt><i className="admin-dot active" aria-hidden="true"/>Active access</dt><dd>{summary?.active??'—'}</dd><dd className="admin-summary-hint">Includes first-login setup</dd></div>
        <div><dt><i className="admin-dot pending" aria-hidden="true"/>Setup required</dt><dd>{summary?.pending??'—'}</dd><dd className="admin-summary-hint">New password needed</dd></div>
        <div><dt><i className="admin-dot removed" aria-hidden="true"/>Removed</dt><dd>{summary?.removed??'—'}</dd><dd className="admin-summary-hint">Access can be restored</dd></div>
      </dl>
      <section className="admin-list" aria-labelledby="admin-directory-title">
        <div className="admin-list-heading"><div><h2 id="admin-directory-title">Account directory</h2><p>Find a student, check their term, and manage access.</p></div><button type="button" disabled={loading||busy} onClick={refresh}>{loading?'Refreshing…':'Refresh'}</button></div>
        <div className="admin-filters">
          <label className="admin-search">Search students<span className="admin-search-field"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input type="search" aria-label="Find a student by name or ID" placeholder="Name or student ID" value={query} disabled={!loaded} onChange={event=>setQuery(event.target.value)}/></span></label>
          <label>Academic term<select aria-label="Filter by academic term" value={termFilter} disabled={!loaded} onChange={event=>setTermFilter(event.target.value==='all'?'all':Number(event.target.value))}><option value="all">All terms</option>{termFilter!=='all'&&!termOptions.includes(termFilter)&&<option value={termFilter}>Term {termFilter}</option>}{termOptions.map(value=><option key={value} value={value}>Term {value}</option>)}</select></label>
          <label>Account access<select aria-label="Filter by account access" value={accessFilter} disabled={!loaded} onChange={event=>setAccessFilter(event.target.value as AccessFilter)}><option value="all">All access</option><option value="active">Active access</option><option value="pending">Setup required</option><option value="removed">Removed</option></select></label>
        </div>
        <div className="admin-results-bar"><p role="status" aria-live="polite">{!loaded?(loading?'Loading accounts…':'Accounts unavailable'):loading?'Updating accounts…':<>Showing <strong>{filtered.length}</strong> of {summary?.total} accounts{loadError?' · Last loaded data':''}</>}</p>{hasFilters&&<button type="button" className="admin-clear" onClick={clearFilters}>Clear filters</button>}</div>
        {loadError&&<div className="admin-load-error" role="alert"><div><strong>{loaded?'Could not refresh accounts':'Could not load accounts'}</strong><p>{loadError}{loaded?' Showing the last successful load.':''}</p></div><button type="button" disabled={loading||busy} onClick={refresh}>Try again</button></div>}
        {!loaded&&!loadError?<div className="admin-loading" role="status"><span className="admin-loading-mark" aria-hidden="true"/>Loading your account directory…</div>:loaded&&<>
          {filtered.length>0?<div className="admin-account-table-wrap" aria-busy={loading}>
            <table className="admin-table" role="table" aria-label="Student accounts">
              <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader" className="admin-student-column">Student</th><th scope="col" role="columnheader" className="admin-term-column">Academic term</th><th scope="col" role="columnheader" className="admin-role-column">Role</th><th scope="col" role="columnheader" className="admin-access-column">Access</th><th scope="col" role="columnheader" className="admin-added-column">Added by</th>{isOwner&&<th scope="col" role="columnheader" className="admin-sessions" title="Valid login tokens, not visits">Logins</th>}{isAdmin&&<th scope="col" role="columnheader" className="admin-actions-cell"><span className="admin-sr-only">Actions</span></th>}</tr></thead>
              <tbody role="rowgroup">{filtered.map(account=>{
                const canManage=isAdmin&&(isOwner||account.role==='student'),label=account.displayName??'Name pending';
                const creator=account.createdBy?[account.createdBy.displayName,account.createdBy.userId,account.createdAt===null?null:'Added '+new Date(account.createdAt).toLocaleString()].filter(Boolean).join(' · '):'Creator history was not recorded for this existing or configured account.';
                return <tr role="row" key={account.userId} className={account.active?'':'admin-inactive'}>
                  <th scope="row" role="rowheader" className="admin-student-cell"><span className="admin-avatar" aria-hidden="true">{label.trim().charAt(0).toUpperCase()}</span><div><span className="admin-name" title={label}>{label}</span><code>{account.userId}</code></div></th>
                  <td role="cell"><span className="admin-cell-label" aria-hidden="true">Academic term</span><span className="admin-term">Term {account.currentTerm}</span></td>
                  <td role="cell"><span className="admin-cell-label" aria-hidden="true">Role</span>{isOwner&&!account.isOwner?<select aria-label={'Role for '+(account.displayName??account.userId)} value={account.role} disabled={busy||loading||!account.active} onChange={event=>{const role=event.target.value;if(confirm('Change '+(account.displayName??account.userId)+' to '+role+'?'))void mutate('PATCH',{action:'role',userId:account.userId,role},'Role updated to '+role+'.');}}><option value="student">Student</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select>:<span className={'admin-role '+account.role}>{account.role}</span>}</td>
                  <td role="cell"><span className="admin-cell-label" aria-hidden="true">Access</span><span className={'admin-access '+(!account.active?'removed':account.mustChangePassword?'pending':'active')}><i className="admin-dot" aria-hidden="true"/>{!account.active?'Removed':account.mustChangePassword?'Setup required':'Active'}</span></td>
                  <td role="cell" className="admin-added-cell"><span className="admin-cell-label" aria-hidden="true">Added by</span><span className={'admin-creator'+(account.createdBy?'':' unknown')} title={creator}>{account.createdBy?.displayName||account.createdBy?.userId||'Not recorded'}</span>{account.createdAt!==null&&<small className="admin-created-date">{new Date(account.createdAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</small>}</td>
                  {isOwner&&<td role="cell" className="admin-sessions"><span className="admin-cell-label" aria-hidden="true">Active logins</span>{account.sessionCount}</td>}
                  {isAdmin&&<td role="cell" className="admin-actions-cell"><button type="button" disabled={busy||loading||!canManage} aria-label={'Manage '+(account.displayName??account.userId)} title={canManage?'Edit name or academic term, reset password, or change access':'Only the owner can manage moderators and admins'} onClick={()=>openEditor({kind:'manage',account})}>Manage <span aria-hidden="true">↗</span></button></td>}
                </tr>;
              })}</tbody>
            </table>
          </div>:<div className="admin-empty" role="status"><span className="admin-empty-mark" aria-hidden="true">⌕</span><h3>{hasFilters?'No matching accounts':'No accounts yet'}</h3><p>{hasFilters?'Try another name, student ID, academic term, or access status.':'Added students will appear in this directory.'}</p>{hasFilters&&<button type="button" onClick={clearFilters}>Clear filters</button>}</div>}
          <p className="admin-term-note">Academic terms advance on 1 February and 1 September, Tehran time. These are students’ current terms, separate from course labels.</p>
        </>}
      </section>
    </>}
    <dialog ref={dialog} className="admin-dialog" aria-labelledby="admin-editor-title" onCancel={event=>{if(busy)event.preventDefault();}} onClose={()=>setEditor(null)}>
      <div className="admin-dialog-heading"><div><p className="admin-dialog-eyebrow">STUDENT ACCOUNT</p><h2 id="admin-editor-title">{editor?.kind==='add'?'Add student':'Manage account'}</h2></div><button type="button" aria-label="Close account editor" disabled={busy} onClick={()=>setEditor(null)}>×</button></div>
      {current&&<p className="admin-dialog-id">{current.userId} · {current.role}</p>}
      {current?.createdBy&&<p className="admin-dialog-id">Added by {current.createdBy.displayName||current.createdBy.userId}{current.createdBy.displayName&&<> ({current.createdBy.userId})</>}{current.createdAt!==null&&<> · {new Date(current.createdAt).toLocaleString()}</>}</p>}
      {editorError&&<p role="alert" className="auth-error">{editorError}</p>}
      <form onSubmit={save}>
        {editor?.kind==='add'&&<label>Student ID<input ref={idInput} name="userId" inputMode="numeric" pattern="4[0-9]{10}" minLength={11} maxLength={11} title="11 digits, starting with 4" required autoComplete="off"/><small>11 digits, starting with 4. Format is checked; university enrollment is not verified.</small></label>}
        <label>Full name<input ref={nameInput} value={name} onChange={event=>setName(event.target.value)} minLength={2} maxLength={80} required autoComplete="off"/></label>
        <label>Current academic term<select name="currentTerm" value={term} onChange={event=>setTerm(Number(event.target.value))} required>{Array.from({length:Math.max(30,term)},(_,index)=><option key={index+1} value={index+1}>Term {index+1}</option>)}</select><small>Advances automatically on 1 February and 1 September (Tehran time). August keeps the same term.</small></label>
        {(editor?.kind==='add'||current&&!current.active)&&<p className="admin-dialog-help">The student ID is the temporary password. They must confirm their name and set a new password before studying.</p>}
        <button className="primary" disabled={busy||!canAccessAdmin}>{busy?'Saving…':editor?.kind==='add'?'Add student':current?.active?'Save changes':'Restore as student'}</button>
      </form>
      {current?.active&&!current.isOwner&&<div className="admin-dialog-actions">
        <button type="button" disabled={busy} onClick={()=>{if(confirm('Reset the password for '+(current.displayName??current.userId)+' to their student ID? This signs out all their sessions and requires a new password.'))void mutate('POST',{action:'reset',userId:current.userId},'Password reset. First-login setup is required.',true);}}>Reset password</button>
        <button type="button" className="danger" disabled={busy} onClick={()=>{if(confirm('Remove access for '+(current.displayName??current.userId)+'? All their sessions will be signed out.'))void mutate('DELETE',{userId:current.userId},'Access removed and sessions signed out.',true);}}>Remove access</button>
      </div>}
    </dialog>
  </main>;
}
