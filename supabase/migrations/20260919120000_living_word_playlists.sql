-- Migration: LivingWord Playlist Management System
-- Allows users to create curated playlists of teachings for continuous or scheduled listening.

create table if not exists public.living_word_playlists (
  id text primary key,
  user_id text not null,
  title text not null,
  description text,
  icon text default '🎧',
  color text default 'from-[#6B5B95] to-[#4A3B75]',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.living_word_playlist_items (
  id text primary key,
  playlist_id text not null references public.living_word_playlists(id) on delete cascade,
  teaching_slug text not null,
  teaching_title text not null,
  teacher text not null,
  duration text not null,
  category text,
  audio_url text,
  portrait text,
  position integer not null default 0,
  added_at timestamptz default now(),
  unique (playlist_id, teaching_slug)
);

create index if not exists idx_playlists_user on public.living_word_playlists(user_id);
create index if not exists idx_playlist_items_playlist on public.living_word_playlist_items(playlist_id, position);

alter table public.living_word_playlists enable row level security;
alter table public.living_word_playlist_items enable row level security;

-- Policies for playlists
create policy "Users can view own playlists"
  on public.living_word_playlists for select
  using (user_id = public.clerk_uid());

create policy "Users can insert own playlists"
  on public.living_word_playlists for insert
  with check (user_id = public.clerk_uid());

create policy "Users can update own playlists"
  on public.living_word_playlists for update
  using (user_id = public.clerk_uid())
  with check (user_id = public.clerk_uid());

create policy "Users can delete own playlists"
  on public.living_word_playlists for delete
  using (user_id = public.clerk_uid());

-- Policies for playlist items
create policy "Users can view own playlist items"
  on public.living_word_playlist_items for select
  using (
    exists (
      select 1 from public.living_word_playlists p
      where p.id = playlist_id and p.user_id = public.clerk_uid()
    )
  );

create policy "Users can insert playlist items"
  on public.living_word_playlist_items for insert
  with check (
    exists (
      select 1 from public.living_word_playlists p
      where p.id = playlist_id and p.user_id = public.clerk_uid()
    )
  );

create policy "Users can update playlist items"
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

create policy "Users can delete playlist items"
  on public.living_word_playlist_items for delete
  using (
    exists (
      select 1 from public.living_word_playlists p
      where p.id = playlist_id and p.user_id = public.clerk_uid()
    )
  );
