import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function CloudLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode,setMode] = useState<'signin'|'signup'>('signin');
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>, mode: 'signin'|'signup') {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setMessage('');
    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) setMessage('Check your email to confirm your account, then sign in.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  }
  async function google() {
    if (!supabase || busy) return;
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({provider:'google', options:{redirectTo:window.location.origin + window.location.pathname}});
    if (error) { setMessage(error.message); setBusy(false); }
  }
  async function recover() {
    if (!supabase || !email.trim() || busy) {setMessage('Enter your email address first.'); return;}
    setBusy(true);
    const {error} = await supabase.auth.resetPasswordForEmail(email.trim(), {redirectTo:window.location.origin});
    setMessage(error?.message ?? 'If an account exists, a recovery email has been sent.');
    setBusy(false);
  }
  return <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12">
    <section className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-8 space-y-5" aria-label="WanderLust sign in">
      <div className="text-center"><h1 className="text-3xl font-bold text-teal-700">WanderLust</h1><p className="text-slate-500 mt-2">Your journeys, always with you.</p></div>
      <button type="button" disabled={busy} onClick={()=>void google()} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-3 font-medium disabled:opacity-50">Continue with Google</button>
      <div className="text-center text-sm text-slate-500">or continue with email</div>
      <form id="wl-login" onSubmit={e=>void submit(e,mode)} className="space-y-3">
        <label className="block text-sm">Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full rounded-lg border p-3 text-slate-900" /></label>
        <label className="block text-sm">Password<input required minLength={6} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 block w-full rounded-lg border p-3 text-slate-900" /></label>
        <button disabled={busy} type="submit" className="w-full rounded-lg bg-teal-700 text-white p-3 disabled:opacity-50">{mode === 'signup' ? 'Create account' : 'Sign in'}</button>
      </form>
      <button type="button" disabled={busy || !email.trim()} onClick={()=>void recover()} className="text-sm underline">Forgot password?</button>
      <button type="button" disabled={busy} onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('');}}  className="block w-full text-sm text-teal-700 underline disabled:opacity-50">{mode === 'signin' ? 'Create an account with email' : 'Already have an account? Sign in'}</button>
      {message && <p role="status" className="text-sm text-amber-700">{message}</p>}
      <p className="text-xs text-slate-500">Your saved trips are private to your account. Existing browser-only trips can be imported after signing in.</p>
    </section>
  </main>;
}
