import React, {useEffect,useRef,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '../lib/supabase';
import {clearLocalSessionOnSignOut,hasImportableGuestData,importGuestData,loadAccountData,saveAccountData} from '../lib/cloudSave';
import {CloudLogin} from './CloudLogin';

export function CloudGate({children}:{children:React.ReactNode}) {
  const [user,setUser]=useState<User|null>(null);
  const currentId=useRef<string|null>(null);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  const [importAvailable,setImportAvailable]=useState(false);
  const [importBusy,setImportBusy]=useState(false);
  useEffect(()=>{
    if (!supabase) {setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.');setReady(true);return;}
    let active=true;
    const apply=async(next:User|null)=>{
      if (!active) return;
      if (!next) {currentId.current=null;setUser(null);setReady(true);return;}
      if (currentId.current===next.id) {setUser(next);return;}
      setReady(false);
      try {
        await loadAccountData(next.id);
        if(active) {currentId.current=next.id;setUser(next);setImportAvailable(hasImportableGuestData(next.id));setError('');setReady(true);}
      } catch(e) {if(active){setError(e instanceof Error?e.message:'Unable to load cloud trips');setReady(true);}}
    };
    void supabase.auth.getUser().then(({data,error})=>{
      if (!active) return;
      if (error) {setError(error.message);setReady(true);} else void apply(data.user);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      // Supabase callbacks must not await database requests; defer the work.
      if (event==='SIGNED_IN' || event==='INITIAL_SESSION' || event==='USER_UPDATED')
        window.setTimeout(()=>{if(active)void apply(session?.user??null);},0);
      if (event==='SIGNED_OUT') window.setTimeout(()=>{if(active){clearLocalSessionOnSignOut();void apply(null);}},0);
    });
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);
  useEffect(()=>{
    if(!user || !ready || error || importBusy)return;
    const save=()=>{void saveAccountData(user.id).catch(console.error);};
    const id=window.setInterval(save,3000);
    const visibility=()=>{if(document.visibilityState==='hidden')save();};
    document.addEventListener('visibilitychange',visibility);
    return ()=>{window.clearInterval(id);document.removeEventListener('visibilitychange',visibility);save();};
  },[user?.id,ready,error,importBusy]);
  if(!ready)return <div className="min-h-screen grid place-items-center">Loading your WanderLust account…</div>;
  if(error)return <div role="alert" className="p-8">Could not open your WanderLust account: {error}. <button className="underline" onClick={()=>window.location.reload()}>Retry</button></div>;
  if(!user)return <CloudLogin/>;
  if(importAvailable)return <main className="min-h-screen grid place-items-center p-6"><section className="max-w-lg space-y-4 rounded-xl border p-6"><h1 className="text-xl font-bold">Existing trips found on this browser</h1><p>We backed up your previous browser-only trips. You can import them into this account, or keep your current cloud trips. Importing replaces this account's currently loaded trips; it will not merge the two sets.</p><div className="flex gap-3"><button disabled={importBusy} className="rounded bg-teal-700 text-white px-4 py-2" onClick={()=>{setImportBusy(true);void importGuestData(user.id).then(()=>window.location.reload()).catch(e=>{setError(String(e));setImportBusy(false);});}}>Import browser trips</button><button disabled={importBusy} className="rounded border px-4 py-2" onClick={()=>{localStorage.removeItem('wl_import_pending_'+user.id);setImportAvailable(false);}}>Keep cloud trips</button></div></section></main>;
  return <React.Fragment key={user.id}>{children}</React.Fragment>;
}
