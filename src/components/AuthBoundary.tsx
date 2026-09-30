"use client";
import {createContext,useContext,useEffect,useLayoutEffect,useState,type ReactNode} from 'react';
import {clearStudyCaches,seedStudySession,invalidateStudySession} from '../../public/med25-auth-cache.mjs';
import {ActivityTracker} from './ActivityTracker';

type AccountSession={displayName:string|null;isOwner:boolean;isAdmin:boolean;canAccessAdmin:boolean};
const AccountContext=createContext<AccountSession>({displayName:null,isOwner:false,isAdmin:false,canAccessAdmin:false});
export const useAuthAccount=()=>useContext(AccountContext);

export async function signOut(){
  window.dispatchEvent(new Event('med25-signing-out'));
  const response=await fetch('/api/auth/logout',{method:'POST',headers:{'content-type':'application/json','x-med25-auth':'1'},body:'{}'});
  if(!response.ok)throw new Error('Could not sign out. Please retry.');
  try{localStorage.setItem('med25-auth-logout',String(Date.now()));}catch{/* Optional cross-tab notification. */}
  const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('med25-auth'):null;channel?.postMessage('logout');channel?.close();
  await clearStudyCaches().catch(()=>{});location.replace('/login');
}
export function SignOutButton(){const [error,setError]=useState(''),[busy,setBusy]=useState(false);return <><button type="button" className="auth-signout" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await signOut();}catch{setError('Sign out failed. Retry.');setBusy(false);}}}>{busy?'Signing out…':'Sign out'}</button>{error&&<span role="alert">{error}</span>}</>;}
export function AuthBoundary({children,initialSession}:{children:ReactNode;initialSession:AccountSession&{expiresAt:number}}){
  // The server has already checked the HttpOnly session before rendering this
  // tree. Do not hide it or repeat that request on hydration/focus/a timer.
  useLayoutEffect(()=>{seedStudySession({...initialSession,authenticated:true,mustChangePassword:false});},[initialSession]);
  useEffect(()=>{
    const logoutMarker=()=>{try{return localStorage.getItem('med25-auth-logout');}catch{return null;}};
    const initialLogoutMarker=logoutMarker();
    const lock=()=>{invalidateStudySession();location.replace('/login');};
    // Back/forward-cache restoration needs only the local logout signal, not an API call.
    const restored=()=>{if(logoutMarker()!==initialLogoutMarker)lock();};
    const storage=(event:StorageEvent)=>{if(event.key==='med25-auth-logout'||event.key===null)lock();};
    const workerMessage=(event:MessageEvent)=>{if(event.data?.type==='med25-auth-required')lock();};
    const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('med25-auth'):null;if(channel)channel.onmessage=lock;
    window.addEventListener('pageshow',restored);window.addEventListener('storage',storage);window.addEventListener('med25-auth-required',lock);
    navigator.serviceWorker?.addEventListener('message',workerMessage);
    return()=>{channel?.close();window.removeEventListener('pageshow',restored);window.removeEventListener('storage',storage);window.removeEventListener('med25-auth-required',lock);navigator.serviceWorker?.removeEventListener('message',workerMessage);};
  },[]);
  return <AccountContext.Provider value={initialSession}><ActivityTracker/>{children}</AccountContext.Provider>;
}
