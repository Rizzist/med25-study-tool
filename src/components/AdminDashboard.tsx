"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import type {ManagedAccount} from '../lib/server/auth-core.mjs';
import {useAuthAccount} from './AuthBoundary';

const headers={'content-type':'application/json','x-med25-auth':'1'};
type Editor={kind:'add'}|{kind:'manage';account:ManagedAccount};

export function AdminDashboard(){
  const {isOwner,isAdmin}=useAuthAccount();
  const [accounts,setAccounts]=useState<ManagedAccount[]>([]);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[query,setQuery]=useState('');
  const [editor,setEditor]=useState<Editor|null>(null),[editorError,setEditorError]=useState('');
  const [name,setName]=useState('');
  const dialog=useRef<HTMLDialogElement>(null);
  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const response=await fetch('/api/admin/accounts',{cache:'no-store'}),body=await response.json();
      if(!response.ok)throw new Error(body.error??'Could not load accounts.');
      setAccounts(body.accounts);setError('');
    }catch(error){setError(error instanceof Error?error.message:'Could not load accounts.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{if(editor)dialog.current?.showModal();else dialog.current?.close();},[editor]);
  function openEditor(value:Editor){setEditorError('');setName(value.kind==='manage'?value.account.displayName??'':'');setEditor(value);}
  async function mutate(method:string,body:Record<string,unknown>,success:string,inDialog=false){
    setBusy(true);setError('');setEditorError('');setNotice('');
    try{
      const response=await fetch('/api/admin/accounts',{method,headers,body:JSON.stringify(body)}),result=await response.json();
      if(!response.ok)throw new Error(result.error??'Could not update the account.');
      setNotice(success);if(inDialog)setEditor(null);await load();return true;
    }catch(error){(inDialog?setEditorError:setError)(error instanceof Error?error.message:'Could not update the account.');return false;}
    finally{setBusy(false);}
  }
  function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!editor)return;
    if(editor.kind==='add'){
      const fields=new FormData(event.currentTarget);
      void mutate('POST',{userId:fields.get('userId'),displayName:name},'Student added. They sign in with their student ID, then confirm their name and change their password.',true);
    }else{
      const account=editor.account;
      void mutate(account.active?'PATCH':'POST',{userId:account.userId,displayName:name},account.active?'Name updated.':'Access restored as a student. First-login setup is required.',true);
    }
  }
  const filtered=accounts.filter(account=>(account.displayName??'Name pending').toLowerCase().includes(query.trim().toLowerCase())||account.userId.includes(query.trim()));
  const current=editor?.kind==='manage'?editor.account:null;
  return <main className="admin-screen">
    <header className="admin-header">
      <a href="/" aria-label="Back to MED25">← MED//25</a><h1>Accounts</h1>
      <span className="admin-count">{loading&&!accounts.length?'Loading…':accounts.filter(account=>account.active).length+' active'}</span>
      <button type="button" className="primary" disabled={busy||!isAdmin} onClick={()=>openEditor({kind:'add'})}>+ Add student</button>
    </header>
    <p className="admin-permissions">{isOwner?'You control admin access. Admins can manage students; only you can change roles.':'Manage student accounts. Administrator roles are controlled by the owner.'}</p>
    {error&&<p className="auth-error" role="alert">{error}</p>}
    {notice&&<p className="admin-notice" role="status">{notice}</p>}
    <section className="admin-list" aria-label="Student accounts">
      <div className="admin-toolbar">
        <input type="search" aria-label="Find a student by name or ID" placeholder="Find name or student ID…" value={query} onChange={event=>setQuery(event.target.value)}/>
        <span>{filtered.length} {filtered.length===1?'account':'accounts'}</span>
        <button type="button" disabled={loading||busy} onClick={()=>void load()}>{loading?'Loading…':'Refresh'}</button>
      </div>
      <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Student account table, scroll horizontally on smaller screens" aria-busy={loading}>
        <table className="admin-table">
          <thead><tr><th scope="col">Name</th><th scope="col">Student ID</th><th scope="col">Role</th><th scope="col">Access</th><th scope="col" className="admin-sessions">Sessions</th><th scope="col"><span className="admin-sr-only">Actions</span></th></tr></thead>
          <tbody>{filtered.map(account=>{
            const canManage=isAdmin&&(isOwner||!account.isAdmin);
            return <tr key={account.userId} className={account.active?'':'admin-inactive'}>
              <th scope="row"><span className="admin-name" title={account.displayName??'Name pending'}>{account.displayName??'Name pending'}</span></th>
              <td><code>{account.userId}</code></td>
              <td>{isOwner&&!account.isOwner?<select aria-label={'Role for '+(account.displayName??account.userId)} value={account.role} disabled={busy||!account.active} onChange={event=>{void mutate('PATCH',{action:'role',userId:account.userId,role:event.target.value},event.target.value==='admin'?'Admin access granted. Only you can assign roles.':'Admin access revoked. Student access remains active.');}}><option value="student">Student</option><option value="admin">Admin</option></select>:<span className={'admin-role '+account.role}>{account.isOwner?'Owner':account.isAdmin?'Admin':'Student'}</span>}</td>
              <td><span className={'admin-access '+(!account.active?'removed':account.mustChangePassword?'pending':'active')}>{!account.active?'Removed':account.mustChangePassword?'Setup required':'Active'}</span></td>
              <td className="admin-sessions">{account.sessionCount}</td>
              <td><button type="button" disabled={busy||!canManage} aria-label={'Manage '+(account.displayName??account.userId)} title={canManage?'Edit name, reset password, or change access':'Only the owner can manage admins'} onClick={()=>openEditor({kind:'manage',account})}>Manage</button></td>
            </tr>;
          })}</tbody>
        </table>
        {!filtered.length&&<p className="admin-empty" role="status">{loading?'Loading accounts…':query?'No matching students.':'No accounts to show.'}</p>}
      </div>
    </section>
    <dialog ref={dialog} className="admin-dialog" aria-labelledby="admin-editor-title" onCancel={event=>{if(busy)event.preventDefault();}} onClose={()=>setEditor(null)}>
      <div className="admin-dialog-heading"><h2 id="admin-editor-title">{editor?.kind==='add'?'Add student':'Manage account'}</h2><button type="button" aria-label="Close account editor" disabled={busy} onClick={()=>setEditor(null)}>×</button></div>
      {current&&<p className="admin-dialog-id">{current.userId} · {current.isOwner?'Owner':current.isAdmin?'Admin':'Student'}</p>}
      {editorError&&<p role="alert" className="auth-error">{editorError}</p>}
      <form onSubmit={save}>
        {editor?.kind==='add'&&<label>Student ID<input name="userId" inputMode="numeric" pattern="[0-9]{5,32}" maxLength={32} required autoFocus autoComplete="off"/></label>}
        <label>Full name<input value={name} onChange={event=>setName(event.target.value)} minLength={2} maxLength={80} required autoComplete="off" autoFocus={editor?.kind==='manage'}/></label>
        {(editor?.kind==='add'||current&&!current.active)&&<p className="admin-dialog-help">The student ID is the temporary password. They must confirm their name and set a new password before studying.</p>}
        <button className="primary" disabled={busy||!isAdmin}>{busy?'Saving…':editor?.kind==='add'?'Add student':current?.active?'Save name':'Restore as student'}</button>
      </form>
      {current?.active&&!current.isOwner&&<div className="admin-dialog-actions">
        <button type="button" disabled={busy} onClick={()=>{if(confirm('Reset the password for '+(current.displayName??current.userId)+' to their student ID? This signs out all their sessions and requires a new password.'))void mutate('POST',{action:'reset',userId:current.userId},'Password reset. First-login setup is required.',true);}}>Reset password</button>
        <button type="button" className="danger" disabled={busy} onClick={()=>{if(confirm('Remove access for '+(current.displayName??current.userId)+'? All their sessions will be signed out.'))void mutate('DELETE',{userId:current.userId},'Access removed and sessions signed out.',true);}}>Remove access</button>
      </div>}
    </dialog>
  </main>;
}
