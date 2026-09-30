"use client";
import {useEffect,useState,type FormEvent} from 'react';
import {clearStudyCaches} from '../../public/med25-auth-cache.mjs';
import {SignOutButton} from './AuthBoundary';
import {InstallAppButton} from './PwaProvider';

export function AuthForm({mode='login',forced=false,displayName=null}:{mode?:'login'|'password';forced?:boolean;displayName?:string|null}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{if(mode==='login')void clearStudyCaches().catch(()=>{});},[mode]);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError('');
    const fields=Object.fromEntries(new FormData(event.currentTarget));
    try{
      const response=await fetch(mode==='login'?'/api/auth/login':'/api/auth/password',{method:'POST',headers:{'content-type':'application/json','x-med25-auth':'1'},body:JSON.stringify({...fields,next:new URLSearchParams(location.search).get('next')})});
      const result=await response.json();if(!response.ok)throw new Error(result.error??'Please retry.');
      location.replace(result.next);
    }catch(error){setError(error instanceof Error?error.message:'Could not connect. Please retry.');setBusy(false);}
  }
  return <main className="auth-screen"><section className="auth-card" aria-labelledby="auth-title"><span className="auth-brand">MED//25</span><p className="auth-eyebrow">Private study space</p><h1 id="auth-title">{mode==='login'?'Welcome back':forced?'Set your private password':'Change password'}</h1><p className="auth-intro">{mode==='login'?'Sign in with your student account to continue.':forced?'Before you can open your study materials, replace your temporary password. This step is required.':'A password change signs out your other sessions.'}</p>
    <form onSubmit={submit}>
      {mode==='login'?<><label>Student ID<input name="username" autoComplete="username" inputMode="numeric" required maxLength={80} autoFocus/></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={128}/></label></>:<><label>Full name<input name="displayName" autoComplete="name" required minLength={2} maxLength={80} defaultValue={displayName??''} autoFocus/></label>{!forced&&<label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128}/></label>}<label>New password<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} aria-describedby="password-help"/></label><label>Confirm new password<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label><small id="password-help">12–128 characters. Use a unique passphrase, not your student ID.</small></>}
      {error&&<p className="auth-error" role="alert">{error}</p>}
      <button className="primary" type="submit" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':'Save password & continue'}</button>
    </form>
    {mode==='password'&&<div className="auth-actions">{!forced&&<a href="/">Cancel</a>}<SignOutButton/></div>}
    <InstallAppButton/>
    <p className="auth-footnote">Only authorized student accounts can sign in. Your study progress stays on this device. The owner can see visit times and approximate active duration, but not your answers or keystrokes. Up to 100 recent visits per account are kept; entries older than 90 days are pruned when next accessed.</p>
  </section></main>;
}
