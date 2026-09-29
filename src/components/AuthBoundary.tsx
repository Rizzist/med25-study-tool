"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {clearStudyCaches,requireStudySession} from '../../public/med25-auth-cache.mjs';

type AccountSession={displayName:string|null;isOwner:boolean;isAdmin:boolean};
const AccountContext=createContext<AccountSession>({displayName:null,isOwner:false,isAdmin:false});
export const useAuthAccount=()=>useContext(AccountContext);

export async function signOut(){
  const response=await fetch('/api/auth/logout',{method:'POST',headers:{'content-type':'application/json','x-med25-auth':'1'},body:'{}'});
  if(!response.ok)throw new Error('Could not sign out. Please retry.');
  try{localStorage.setItem('med25-auth-logout',String(Date.now()));}catch{/* Optional cross-tab notification. */}
  const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('med25-auth'):null;channel?.postMessage('logout');channel?.close();
  await clearStudyCaches().catch(()=>{});location.replace('/login');
}
export function SignOutButton(){const [error,setError]=useState(''),[busy,setBusy]=useState(false);return <><button type="button" className="auth-signout" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await signOut();}catch{setError('Sign out failed. Retry.');setBusy(false);}}}>{busy?'Signing out…':'Sign out'}</button>{error&&<span role="alert">{error}</span>}</>;}
export function AuthBoundary({children,initialSession}:{children:ReactNode;initialSession:AccountSession}){
  const [account,setAccount]=useState<AccountSession>(initialSession);
  const [ready,setReady]=useState(false);
  const [verifiedOnce,setVerifiedOnce]=useState(false);
  const [unavailable,setUnavailable]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{
    let alive=true;
    const lock=()=>{setReady(false);location.replace('/login');};
    const check=async()=>{if(!alive)return;try{const session=await requireStudySession();if(alive){setAccount({displayName:session.displayName??null,isOwner:session.isOwner===true,isAdmin:session.isAdmin===true});setReady(true);setVerifiedOnce(true);setUnavailable(false);}}catch(error){if(alive){if((error as {code?:string}).code==='AUTH_REQUIRED')lock();else{setReady(false);setUnavailable(true);}}}};
    const wake=()=>{if(document.visibilityState==='visible'){setReady(false);void check();}};
    const storage=(event:StorageEvent)=>{if(event.key==='med25-auth-logout')lock();};
    const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('med25-auth'):null;if(channel)channel.onmessage=lock;
    void check();const timer=setInterval(check,60000);window.addEventListener('pageshow',wake);window.addEventListener('storage',storage);document.addEventListener('visibilitychange',wake);
    // Replace old cache-first workers, including the pre-auth version.
    if('serviceWorker' in navigator)void navigator.serviceWorker.register('/med25-sw.js',{type:'module',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
    return()=>{alive=false;clearInterval(timer);channel?.close();window.removeEventListener('pageshow',wake);window.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',wake);};
  },[retry]);
  // Hide during revalidation without discarding an in-progress question/PDF state.
  return <AccountContext.Provider value={account}>{verifiedOnce&&<div hidden={!ready} style={{display:ready?'contents':'none'}}>{children}</div>}{!ready&&<main className="auth-screen">{unavailable?<section className="auth-card"><h1>Session check unavailable</h1><p>Reconnect to verify your sign-in. Your saved study progress is unchanged.</p><button type="button" className="primary" onClick={()=>{setUnavailable(false);setRetry(value=>value+1);}}>Retry</button></section>:<p role="status">Checking your secure session…</p>}</main>}</AccountContext.Provider>;
}
