import { supabase } from './supabase';

// Allowlisted app data only: never sync tokens, auth state or location caches.
const KEYS = [
  'roamtogether_current_user', 'roamtogether_travelers', 'roamtogether_trips',
  'roamtogether_itineraries', 'roamtogether_activities', 'roamtogether_solo_expenses',
  'roamtogether_shared_expenses', 'roamtogether_chats', 'roamtogether_safety',
  'wanderlust_onboarded_v1', 'wanderlust_registered_at', 'wanderlust_app_settings',
  'wanderlust_app_lang', 'wanderlust_travel_memories', 'wanderlust_checked_packing',
  'wanderlust_target_budget_usd', 'wanderlust_cost_currency',
];
const OWNER_KEY = 'wl_cloud_active_user';
const BACKUP_PREFIX = 'wl_local_backup_';
const IMPORT_PREFIX = 'wl_import_pending_';
let lastSaved = '';
let activeOwner: string | null = null;
let pendingSave: Promise<void> = Promise.resolve();
let generation = 0;

function snapshot(): Record<string,string> {
  return Object.fromEntries(KEYS.flatMap(key => {
    const value = localStorage.getItem(key);
    return value === null ? [] : [[key,value]];
  }));
}
function replaceData(data: Record<string,unknown>) {
  for (const key of KEYS) localStorage.removeItem(key);
  for (const key of KEYS) if (typeof data[key] === 'string') localStorage.setItem(key,data[key] as string);
}
function backup(owner: string) {
  const data = snapshot();
  if (Object.keys(data).length) localStorage.setItem(BACKUP_PREFIX + owner, JSON.stringify(data));
}
export function hasImportableGuestData(userId: string): boolean {
  return localStorage.getItem(IMPORT_PREFIX + userId) === '1';
}
export async function importGuestData(userId: string) {
  if (!supabase || activeOwner !== userId || !hasImportableGuestData(userId)) throw new Error('No guest data available to import.');
  const saved = localStorage.getItem(BACKUP_PREFIX + 'guest');
  if (!saved) throw new Error('Guest backup is unavailable.');
  const guest = JSON.parse(saved) as Record<string,string>;
  // Import is deliberately explicit: do not silently replace cloud trips.
  replaceData(guest);
  lastSaved = '';
  await saveAccountData(userId);
  localStorage.removeItem(IMPORT_PREFIX + userId);
}
export async function saveAccountData(userId: string): Promise<void> {
  if (!supabase || activeOwner !== userId || localStorage.getItem(OWNER_KEY) !== userId) return;
  const data = snapshot();
  const serial = JSON.stringify(data);
  if (serial === lastSaved) return;
  const currentGeneration = generation;
  const task = pendingSave.catch(() => undefined).then(async () => {
    if (generation !== currentGeneration || activeOwner !== userId || localStorage.getItem(OWNER_KEY) !== userId) return;
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || auth.user?.id !== userId) throw new Error('Account session changed; cloud save cancelled.');
    const { error } = await supabase.from('user_app_data').upsert({ user_id: userId, data }, { onConflict: 'user_id' });
    if (error) throw error;
    if (generation === currentGeneration && activeOwner === userId) lastSaved = serial;
  });
  pendingSave = task;
  await task;
}

export async function loadAccountData(userId: string) {
  if (!supabase) throw new Error('Cloud login is not configured');
  await pendingSave;
  const previousOwner = localStorage.getItem(OWNER_KEY);
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || auth.user?.id !== userId) throw new Error('Account session mismatch.');
  // Fetch before touching local data: network failures must never erase trips.
  const {data,error} = await supabase.from('user_app_data').select('data').eq('user_id',userId).maybeSingle();
  if (error) throw error;
  if (previousOwner !== userId) {
    backup(previousOwner || 'guest');
    if (!previousOwner && Object.keys(snapshot()).some(key => key.startsWith('roamtogether_')))
      localStorage.setItem(IMPORT_PREFIX + userId,'1');
  }
  const cloud = data?.data;
  generation += 1;
  replaceData(cloud && typeof cloud === 'object' && !Array.isArray(cloud) ? cloud as Record<string,unknown> : {});
  localStorage.setItem(OWNER_KEY,userId);
  activeOwner = userId;
  lastSaved = JSON.stringify(snapshot());
}
export async function signOutAccount() {
  if (!supabase) return;
  const owner = activeOwner;
  if (owner) await saveAccountData(owner); // Do not sign out if saving fails.
  const {error} = await supabase.auth.signOut();
  if (error) throw error;
  if (owner) backup(owner);
  generation += 1;
  generation += 1;
  replaceData({});
  localStorage.removeItem(OWNER_KEY);
  activeOwner = null;
  lastSaved = '';
  window.location.reload();
}

export function clearLocalSessionOnSignOut() {
  const owner = localStorage.getItem(OWNER_KEY);
  if (owner) backup(owner);
  generation += 1;
  generation += 1;
  replaceData({});
  localStorage.removeItem(OWNER_KEY);
  activeOwner = null;
  lastSaved = '';
}
