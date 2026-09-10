-- Clerk is the identity authority. Clerk IDs (for example `user_...`) are text,
-- so none of these tables reference auth.users.
create table if not exists public.profiles (
  user_id text primary key,
  display_name text,
  avatar_url text,
  spiritual_path text,
  daily_habits text[] not null default '{}',
  notification_time time,
  favorite_books text[] not null default '{}',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(), user_id text not null,
  mood text not null check (mood in ('grateful','peaceful','seeking','doubting','distant','convicted')),
  note text, created_at timestamptz not null default now()
);
create index if not exists checkins_user_created_idx on public.checkins (user_id, created_at desc);

create table if not exists public.generated_content (
  id uuid primary key default gen_random_uuid(), checkin_id uuid not null references public.checkins(id) on delete cascade,
  user_id text not null, verse_text text not null, verse_reference text not null,
  why_this_verse text not null, meditation text not null, reflection_question text not null,
  prayer text not null, action_step text not null, review_verdict text not null,
  model_mode text not null, created_at timestamptz not null default now()
);
create index if not exists generated_content_user_created_idx on public.generated_content (user_id, created_at desc);

create table if not exists public.streaks (
  user_id text primary key, current integer not null default 0, longest integer not null default 0,
  last_checkin date, updated_at timestamptz not null default now()
);
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(), user_id text not null, text text not null,
  related_content_id uuid references public.generated_content(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.favorite_verses (
  id uuid primary key default gen_random_uuid(), user_id text not null,
  content_id uuid references public.generated_content(id) on delete cascade,
  verse_text text not null, verse_reference text not null, created_at timestamptz not null default now(),
  unique (user_id, content_id)
);
create table if not exists public.user_journey_progress (
  user_id text not null, journey_id text not null, current_day integer not null default 1,
  completed_days integer[] not null default '{}', started_at timestamptz not null default now(), completed_at timestamptz,
  primary key (user_id, journey_id)
);
create table if not exists public.library_progress (
  user_id text not null, book_id text not null, progress_percent integer not null default 0,
  bookmarked boolean not null default false, primary key (user_id, book_id)
);
create table if not exists public.push_tokens (
  user_id text primary key, token text not null, platform text not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.subscriptions (
  user_id text primary key, tier text not null default 'free', billing_cycle text,
  updated_at timestamptz not null default now()
);

create table if not exists public.group_memberships (
  user_id text not null, group_id text not null, joined_at timestamptz not null default now(),
  primary key (user_id, group_id)
);
create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(), user_id text not null, text text not null, category text,
  moderation_status text not null default 'pending', prayer_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(), user_id text not null, title text not null, body text not null,
  tags text[] not null default '{}', moderation_status text not null default 'pending',
  like_count integer not null default 0, reply_count integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.discussion_replies (
  id uuid primary key default gen_random_uuid(), discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id text not null, text text not null, created_at timestamptz not null default now()
);
create table if not exists public.living_word_comments (
  id uuid primary key default gen_random_uuid(), teaching_slug text not null, user_id text not null, text text not null,
  moderation_status text not null default 'pending', created_at timestamptz not null default now()
);

-- Clerk's native Supabase integration exposes the Clerk user ID in `sub`.
alter table public.profiles enable row level security;
alter table public.checkins enable row level security;
alter table public.generated_content enable row level security;
alter table public.streaks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.favorite_verses enable row level security;
alter table public.user_journey_progress enable row level security;
alter table public.library_progress enable row level security;
alter table public.push_tokens enable row level security;
alter table public.subscriptions enable row level security;
alter table public.group_memberships enable row level security;

create policy "profiles owned by Clerk subject" on public.profiles for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
create policy "checkins owned by Clerk subject" on public.checkins for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
create policy "content owned by Clerk subject" on public.generated_content for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
create policy "streaks owned by Clerk subject" on public.streaks for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
create policy "journal owned by Clerk subject" on public.journal_entries for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
create policy "favorites owned by Clerk subject" on public.favorite_verses for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
create policy "journeys owned by Clerk subject" on public.user_journey_progress for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
create policy "library progress owned by Clerk subject" on public.library_progress for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
create policy "push tokens owned by Clerk subject" on public.push_tokens for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
create policy "subscription readable by Clerk subject" on public.subscriptions for select to authenticated using (user_id = auth.jwt()->>'sub');
create policy "memberships owned by Clerk subject" on public.group_memberships for all to authenticated using (user_id = auth.jwt()->>'sub') with check (user_id = auth.jwt()->>'sub');
