"use client";
import {createContext,useContext,useEffect,useId,useRef,useState,type ReactNode} from 'react';

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
type InstallState={installed:boolean;prompt:InstallEvent|null;clearPrompt:()=>void;ios:boolean;workerReady:boolean};
const InstallContext=createContext<InstallState>({installed:false,prompt:null,clearPrompt:()=>{},ios:false,workerReady:false});
export function PwaProvider({children}:{children:ReactNode}){
  const [installed,setInstalled]=useState(false),[prompt,setPrompt]=useState<InstallEvent|null>(null),[ios,setIos]=useState(false),[workerReady,setWorkerReady]=useState(false);
  useEffect(()=>{
    let mounted=true;
    const mode=window.matchMedia('(display-mode: standalone)'),nav=navigator as Navigator&{standalone?:boolean};
    const updateMode=()=>setInstalled(mode.matches||nav.standalone===true);
    updateMode();setIos(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
    const available=(event:Event)=>{event.preventDefault();setPrompt(event as InstallEvent);};
    const done=()=>{setInstalled(true);setPrompt(null);};
    window.addEventListener('beforeinstallprompt',available);window.addEventListener('appinstalled',done);mode.addEventListener('change',updateMode);
    // One registration per document, not per course or auth check. Never reload
    // an active exam when an updated worker takes control.
    if('serviceWorker' in navigator)void navigator.serviceWorker.register('/med25-sw.js',{type:'module',scope:'/',updateViaCache:'none'}).then(async registration=>{
      if(mounted)setWorkerReady(Boolean(registration.active));
      void navigator.serviceWorker.ready.then(()=>{if(mounted)setWorkerReady(true);});
      await registration.update();
    }).catch(()=>{});
    return()=>{mounted=false;window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',done);mode.removeEventListener('change',updateMode);};
  },[]);
  return <InstallContext.Provider value={{installed,prompt,clearPrompt:()=>setPrompt(null),ios,workerReady}}>{children}</InstallContext.Provider>;
}
export function InstallAppButton(){
  const {installed,prompt,clearPrompt,ios,workerReady}=useContext(InstallContext),dialog=useRef<HTMLDialogElement>(null),title=useId();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{if(installed)dialog.current?.close();},[installed]);
  async function install(){
    if(!prompt)return;
    setBusy(true);setMessage('');
    try{await prompt.prompt();const choice=await prompt.userChoice;setMessage(choice.outcome==='accepted'?'Finish installation in your browser.':'Installation dismissed. You can still use MED25 in this browser.');}
    catch{setMessage('Use your browser’s Install app or Add to Home Screen option.');}
    finally{clearPrompt();setBusy(false);}
  }
  if(installed)return null;
  return <><button type="button" className="pwa-install-button" onClick={()=>dialog.current?.showModal()}>Install app</button>
    <dialog ref={dialog} className="pwa-dialog" aria-labelledby={title}>
      <header><h2 id={title}>MED25 on your home screen</h2><button type="button" aria-label="Close installation help" onClick={()=>dialog.current?.close()}>×</button></header>
      <p>Launch MED25 like an app, with its own icon and a full study window.</p>
      {prompt?<button type="button" className="pwa-install-primary" disabled={busy} onClick={()=>void install()}>{busy?'Opening installer…':'Install MED25'}</button>:ios?<p><b>iPhone or iPad:</b> open MED25 in Safari, tap <b>Share</b>, then <b>Add to Home Screen</b> and confirm <b>Add</b>. Enable “Open as Web App” if offered.</p>:<p>Use your browser’s <b>Install app</b> option or the install icon in the address bar. In Safari on Mac, use <b>File → Add to Dock</b>. If installation is unavailable, MED25 still works in a normal tab.</p>}
      {message&&<p role="status">{message}</p>}
      <div className="pwa-install-note"><b>Connection & privacy</b><p>An internet connection is needed to open the app and verify your login. Existing PDF/media caches are reused after sign-in; the whole question bank is not downloaded by installing. Saved progress stays on this device. Sign out remains available in the app.</p><small>{workerReady?'App service worker is active.':'Offline support is preparing or unavailable in this browser.'}</small></div>
    </dialog></>;
}
