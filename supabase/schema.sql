-- Run in Supabase SQL Editor. Only the logged-in owner can access their data.
create table if not exists public.user_app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_app_data enable row level security;
revoke all on public.user_app_data from anon;
grant select, insert, update, delete on public.user_app_data to authenticated;
drop policy if exists "Users read own data" on public.user_app_data;
create policy "Users read own data" on public.user_app_data for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users insert own data" on public.user_app_data;
create policy "Users insert own data" on public.user_app_data for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update own data" on public.user_app_data;
create policy "Users update own data" on public.user_app_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete own data" on public.user_app_data;
create policy "Users delete own data" on public.user_app_data for delete to authenticated using ((select auth.uid()) = user_id);
