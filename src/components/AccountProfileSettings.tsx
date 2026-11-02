import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signOutAccount } from '../lib/cloudSave';

/** Authentication identity belongs to Supabase, not the travel-profile fields. */
export function AccountProfileSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setEmail(data.user?.email ?? ''); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { setUser(session?.user ?? null); setEmail(session?.user?.email ?? ''); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  async function changeEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !user || busy) return;
    const next = email.trim();
    if (!next || next.toLowerCase() === (user.email ?? '').toLowerCase()) return;
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.auth.updateUser({ email: next }, { emailRedirectTo: window.location.origin });
      if (error) throw error;
      setNotice('Email change requested. Follow the verification links sent by Supabase. Your current email remains active until the change is confirmed.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to update email.'); }
    finally { setBusy(false); }
  }
  async function resetPassword() {
    if (!supabase || !user?.email || busy) return;
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin });
      if (error) throw error;
      setNotice('Password reset email requested. Check your inbox.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to send password reset.'); }
    finally { setBusy(false); }
  }
  async function linkGoogle() {
    if (!supabase || !user || busy) return;
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
      // OAuth redirects away from the page on success.
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to connect Google.');
      setBusy(false);
    }
  }
  async function unlinkIdentity(identityId: string) {
    if (!supabase || !user || busy) return;
    const identities = user.identities ?? [];
    if (identities.length < 2) {
      setNotice('Add another sign-in method before disconnecting this one.');
      return;
    }
    const identity = identities.find(item => item.id === identityId);
    if (!identity || !window.confirm(`Disconnect ${identity.provider} from this WanderLust account?`)) return;
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;
      const { data, error: refreshError } = await supabase.auth.getUser();
      if (refreshError) throw refreshError;
      setUser(data.user);
      setNotice('Sign-in identity disconnected. Your trips remain with this WanderLust account.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to disconnect identity.'); }
    finally { setBusy(false); }
  }
  const providers = [...new Set((user?.identities ?? []).map(identity => identity.provider))];
  return <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4" aria-label="Account and profile settings">
    <div><h3 className="font-display font-bold text-base text-slate-950 dark:text-white">Account & profile</h3><p className="text-xs text-slate-500 mt-1">Manage the account that saves your WanderLust trips across devices.</p></div>
    {!supabase ? <p className="text-sm text-amber-700">Cloud login is not configured. Add your Supabase environment variables to enable account settings.</p> : !user ? <p className="text-sm">Sign in to manage your account.</p> : <>
      <div className="text-sm space-y-1"><p><span className="font-semibold">Signed-in email:</span> {user.email || 'Not available'}</p><p><span className="font-semibold">Connected sign-in methods:</span> {providers.length ? providers.join(', ') : (user.app_metadata?.provider ?? 'Email')}</p></div>
      <div className="space-y-2 max-w-md" aria-label="Connected accounts">
        <h4 className="font-semibold text-sm">Connected accounts</h4>
        <p className="text-xs text-slate-500">Connect another Google identity to sign in to this same WanderLust account. Connecting is different from switching to another account.</p>
        {(user.identities ?? []).map(identity => <div key={identity.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-sm">
          <span>{identity.provider === 'email' ? 'Email / password' : identity.provider === 'google' ? 'Google' : identity.provider} · {identity.identity_data?.email ?? 'Connected'}</span>
          <button type="button" disabled={busy || (user.identities ?? []).length < 2} onClick={() => void unlinkIdentity(identity.id)} className="rounded border px-2 py-1 text-xs disabled:opacity-40" aria-label={`Disconnect ${identity.provider}`}>Disconnect</button>
        </div>)}
        <button type="button" disabled={busy} onClick={() => void linkGoogle()} className="rounded-lg border border-teal-600 px-4 py-2 text-sm disabled:opacity-50">Connect another Google account</button>
        <p className="text-xs text-slate-500">Google linking requires manual identity linking enabled in Supabase. If the Google identity already belongs to another user, linking will fail; accounts and trip data will not be merged automatically. You must retain another working sign-in method before unlinking.</p>
      </div>
      <form onSubmit={changeEmail} className="space-y-2 max-w-md"><label htmlFor="wl-account-email" className="block text-sm font-semibold">Change account email</label><input id="wl-account-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-transparent"/><button type="submit" disabled={busy || email.trim().toLowerCase() === (user.email ?? '').toLowerCase()} className="rounded-lg bg-teal-700 px-4 py-2 text-white text-sm disabled:opacity-50">Request email change</button><p className="text-xs text-slate-500">Changing your email keeps the same account and saved trips. Email confirmation may be required. Signing in with a different Google account does not automatically transfer trips or link accounts.</p></form>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>void resetPassword()} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Reset password by email</button><button type="button" disabled={busy} onClick={()=>{if(window.confirm('Sign out of WanderLust on this device?')) void signOutAccount();}} className="rounded-lg border border-red-300 text-red-700 px-4 py-2 text-sm">Sign out</button></div>
      {notice && <p role="status" className="text-sm text-teal-700 dark:text-teal-300">{notice}</p>}
    </>}
  </section>;
}
