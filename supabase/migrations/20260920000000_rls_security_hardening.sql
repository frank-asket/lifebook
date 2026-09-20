-- Migration: 20260920000000_rls_security_hardening.sql
-- Description: Hardens Supabase RLS policies across playlists, playlist items,
-- discussion replies, and journey days to enforce strict Clerk ownership and gated publishing.

-- 1. Hardening LivingWord Playlists & Items
alter table if exists public.living_word_playlists enable row level security;
alter table if exists public.living_word_playlist_items enable row level security;

-- Drop permissive policies
drop policy if exists "Users can view own playlists" on public.living_word_playlists;
drop policy if exists "Users can insert own playlists" on public.living_word_playlists;
drop policy if exists "Users can update own playlists" on public.living_word_playlists;
drop policy if exists "Users can delete own playlists" on public.living_word_playlists;

drop policy if exists "Users can view own playlist items" on public.living_word_playlist_items;
drop policy if exists "Users can insert playlist items" on public.living_word_playlist_items;
drop policy if exists "Users can delete playlist items" on public.living_word_playlist_items;

-- Enforce strict Clerk ownership on living_word_playlists
create policy "playlists select own"
  on public.living_word_playlists for select
  using (user_id = public.clerk_uid());

create policy "playlists insert own"
  on public.living_word_playlists for insert
  with check (user_id = public.clerk_uid());

create policy "playlists update own"
  on public.living_word_playlists for update
  using (user_id = public.clerk_uid())
  with check (user_id = public.clerk_uid());

create policy "playlists delete own"
  on public.living_word_playlists for delete
  using (user_id = public.clerk_uid());

-- Enforce parent-ownership on living_word_playlist_items
create policy "playlist_items select own"
  on public.living_word_playlist_items for select
  using (
    exists (
      select 1 from public.living_word_playlists p
      where p.id = playlist_id and p.user_id = public.clerk_uid()
    )
  );

create policy "playlist_items insert own"
  on public.living_word_playlist_items for insert
  with check (
    exists (
      select 1 from public.living_word_playlists p
      where p.id = playlist_id and p.user_id = public.clerk_uid()
    )
  );

create policy "playlist_items update own"
  on public.living_word_playlist_items for update
  using (
    exists (
      select 1 from public.living_word_playlists p
      where p.id = playlist_id and p.user_id = public.clerk_uid()
    )
  )
  with check (
    exists (
      select 1 from public.living_word_playlists p
      where p.id = playlist_id and p.user_id = public.clerk_uid()
    )
  );

create policy "playlist_items delete own"
  on public.living_word_playlist_items for delete
  using (
    exists (
      select 1 from public.living_word_playlists p
      where p.id = playlist_id and p.user_id = public.clerk_uid()
    )
  );

-- 2. Enforce RLS on discussion_replies
alter table if exists public.discussion_replies enable row level security;

drop policy if exists "discussion_replies select" on public.discussion_replies;
drop policy if exists "discussion_replies insert own" on public.discussion_replies;
drop policy if exists "discussion_replies update own" on public.discussion_replies;
drop policy if exists "discussion_replies delete own" on public.discussion_replies;

create policy "discussion_replies select"
  on public.discussion_replies for select
  using (
    user_id = public.clerk_uid()
    or exists (
      select 1 from public.discussions d
      where d.id = discussion_id and (d.moderation_status = 'approved' or d.user_id = public.clerk_uid())
    )
  );

create policy "discussion_replies insert own"
  on public.discussion_replies for insert
  with check (
    user_id = public.clerk_uid()
    and exists (
      select 1 from public.discussions d
      where d.id = discussion_id and (d.moderation_status = 'approved' or d.user_id = public.clerk_uid())
    )
  );

create policy "discussion_replies update own"
  on public.discussion_replies for update
  using (user_id = public.clerk_uid())
  with check (user_id = public.clerk_uid());

create policy "discussion_replies delete own"
  on public.discussion_replies for delete
  using (user_id = public.clerk_uid());

-- 3. Gate journey_days reads by published parent journey
drop policy if exists "journey_days public read" on public.journey_days;
drop policy if exists "journey_days published read" on public.journey_days;

create policy "journey_days published read"
  on public.journey_days for select
  using (
    exists (
      select 1 from public.journeys j
      where j.id = journey_id and j.is_published = true
    )
  );
