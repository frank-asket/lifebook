-- Migration: 20260910000000_careful_ai_and_curated_content.sql
-- Description: Sets up the curated Scripture and LivingWord corpus, pgvector embeddings,
-- structured AI audit logging, journey definitions, and hardened RLS policies
-- supporting Clerk authentication and safe background jobs.

-- 1. Enable pgvector extension for scripture and teaching retrieval
create extension if not exists vector with schema extensions;

-- 2. Helper function to extract Clerk subject reliably from JWT
create or replace function public.clerk_uid()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() ->> 'sub',
    current_setting('request.jwt.claim.sub', true)
  );
$$;

-- 3. Curated Scripture Passages
-- Grounding table: AI reflections and voice answers MUST select from approved passages
-- rather than improvising citations.
create table if not exists public.scriptures (
  id uuid primary key default gen_random_uuid(),
  translation text not null default 'KJV',
  book text not null,
  chapter integer not null,
  verse_start integer not null,
  verse_end integer,
  reference text not null,
  text text not null,
  primary_mood text check (primary_mood in ('grateful','peaceful','seeking','doubting','distant','convicted')),
  theological_notes text,
  embedding extensions.vector(1536), -- compatible with standard embedding models
  created_at timestamptz not null default now(),
  unique (translation, reference)
);

create index if not exists scriptures_mood_idx on public.scriptures (primary_mood);
create index if not exists scriptures_reference_idx on public.scriptures (reference);

-- 4. Curated LivingWord Teachings Catalog
-- Human-approved pastoral and devotional teachings with metadata and embeddings
create table if not exists public.living_word_teachings (
  slug text primary key,
  title text not null,
  teacher text not null,
  teacher_role text not null default 'LifeBook teaching contributor',
  category text not null,
  duration text not null,
  scripture_reference text not null,
  excerpt text not null,
  full_transcript text,
  audio_url text,
  video_url text,
  is_published boolean not null default true,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists living_word_category_idx on public.living_word_teachings (category);

-- 5. Curated Spiritual Journeys & Day Content
create table if not exists public.journeys (
  id text primary key,
  title text not null,
  description text not null,
  category text not null,
  total_days integer not null,
  recommended_moods text[] not null default '{}',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.journey_days (
  id uuid primary key default gen_random_uuid(),
  journey_id text not null references public.journeys(id) on delete cascade,
  day_number integer not null,
  title text not null,
  verse_reference text not null,
  verse_text text not null,
  reflection text not null,
  prayer text not null,
  created_at timestamptz not null default now(),
  unique (journey_id, day_number)
);

create index if not exists journey_days_journey_day_idx on public.journey_days (journey_id, day_number);

-- 6. AI Gateway Audit Logging & Crisis/Safety Policy
-- Audits prompt versions, grounding context, model used, safety flags, and execution metrics
create table if not exists public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text, -- nullable if unauthenticated or pre-auth voice query
  action_type text not null check (action_type in ('generate_checkin', 'answer_voice_question', 'moderate_post', 'classify_safety_risk')),
  prompt_version text not null,
  model_identifier text not null,
  source_passages text[] not null default '{}',
  input_preview text, -- truncated/sanitized to protect user privacy
  output_preview text,
  safety_classification text not null default 'safe' check (safety_classification in ('safe', 'distress_detected', 'crisis_escalation', 'flagged_for_review')),
  emergency_escalated boolean not null default false,
  latency_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_audit_logs_action_created_idx on public.ai_audit_logs (action_type, created_at desc);
create index if not exists ai_audit_logs_user_idx on public.ai_audit_logs (user_id);

-- 7. Community Moderation Queue (Content-review dashboard before public display)
create table if not exists public.moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('prayer_request', 'discussion', 'discussion_reply', 'living_word_comment')),
  content_id uuid not null,
  submitted_by text not null,
  content_text text not null,
  ai_flagged_reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by text, -- reviewer/moderator admin user_id
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists moderation_reviews_status_idx on public.moderation_reviews (status, created_at desc);

-- 8. Add sensitive data retention & crisis tracking to checkins and journals
alter table public.checkins add column if not exists crisis_detected boolean not null default false;
alter table public.checkins add column if not exists is_private boolean not null default true;

alter table public.journal_entries add column if not exists title text;
alter table public.journal_entries add column if not exists encrypted boolean not null default false;
alter table public.journal_entries add column if not exists tags text[] not null default '{}';
alter table public.journal_entries add column if not exists updated_at timestamptz not null default now();

-- 9. Row Level Security Policies
alter table public.scriptures enable row level security;
alter table public.living_word_teachings enable row level security;
alter table public.journeys enable row level security;
alter table public.journey_days enable row level security;
alter table public.ai_audit_logs enable row level security;
alter table public.moderation_reviews enable row level security;

-- Public read access for published curated knowledge
create policy "scriptures public read"
  on public.scriptures for select
  using (true);

create policy "living_word_teachings public read"
  on public.living_word_teachings for select
  using (is_published = true);

create policy "journeys public read"
  on public.journeys for select
  using (is_published = true);

create policy "journey_days public read"
  on public.journey_days for select
  using (true);

-- Community prayer requests: Users can view approved prayers, or their own prayers even if pending
drop policy if exists "prayer requests readable if approved or owned" on public.prayer_requests;
alter table public.prayer_requests enable row level security;
create policy "prayer requests readable if approved or owned"
  on public.prayer_requests for select
  using (moderation_status = 'approved' or user_id = public.clerk_uid());

create policy "prayer requests insert by owner"
  on public.prayer_requests for insert
  with check (user_id = public.clerk_uid());

-- Discussions: Users can view approved discussions, or their own
drop policy if exists "discussions readable if approved or owned" on public.discussions;
alter table public.discussions enable row level security;
create policy "discussions readable if approved or owned"
  on public.discussions for select
  using (moderation_status = 'approved' or user_id = public.clerk_uid());

create policy "discussions insert by owner"
  on public.discussions for insert
  with check (user_id = public.clerk_uid());

-- Living Word comments: Public can read approved comments
drop policy if exists "living word comments readable if approved" on public.living_word_comments;
alter table public.living_word_comments enable row level security;
create policy "living word comments readable if approved"
  on public.living_word_comments for select
  using (moderation_status = 'approved' or user_id = public.clerk_uid());

create policy "living word comments insert by author"
  on public.living_word_comments for insert
  with check (user_id = public.clerk_uid());

-- AI audit logs and Moderation queue:
-- Restricted to backend service role; authenticated users can only view their own non-sensitive audit rows
create policy "ai audit logs read own"
  on public.ai_audit_logs for select
  using (user_id = public.clerk_uid());

-- 10. Seed Core Scripture Grounding Corpus
insert into public.scriptures (translation, book, chapter, verse_start, verse_end, reference, text, primary_mood, theological_notes)
values
  ('KJV', 'Psalms', 107, 1, null, 'Psalm 107:1', 'O give thanks unto the LORD, for he is good: for his mercy endureth for ever.', 'grateful', 'Core thanksgiving psalm acknowledging God’s everlasting lovingkindness.'),
  ('KJV', '1 Thessalonians', 5, 18, null, '1 Thessalonians 5:18', 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.', 'grateful', 'Apostolic encouragement to cultivate gratitude across all circumstances.'),
  ('KJV', 'John', 14, 27, null, 'John 14:27', 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.', 'peaceful', 'Christ’s farewell discourse offering transcendent peace distinct from earthly circumstances.'),
  ('KJV', 'Isaiah', 26, 3, null, 'Isaiah 26:3', 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.', 'peaceful', 'Prophetic promise connecting undivided focus on God with enduring serenity.'),
  ('KJV', 'Jeremiah', 29, 11, null, 'Jeremiah 29:11', 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.', 'seeking', 'God’s word to exiles revealing divine purpose, hope, and an intentional future.'),
  ('KJV', 'Matthew', 7, 7, null, 'Matthew 7:7', 'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.', 'seeking', 'Sermon on the Mount invitation to persistent, humble prayer.'),
  ('KJV', 'Mark', 9, 24, null, 'Mark 9:24', 'Lord, I believe; help thou mine unbelief.', 'doubting', 'A father’s authentic cry of struggling faith, honored directly by Jesus.'),
  ('KJV', 'John', 20, 29, null, 'John 20:29', 'Jesus saith unto him, Thomas, because thou hast seen me, thou hast believed: blessed are they that have not seen, and yet have believed.', 'doubting', 'Affirmation of faith for those who believe through witness and word without physical sight.'),
  ('KJV', 'Psalms', 42, 1, 2, 'Psalm 42:1-2', 'As the hart panteth after the water brooks, so panteth my soul after thee, O God. My soul thirsteth for God, for the living God: when shall I come and appear before God?', 'distant', 'Classic psalm of spiritual thirst and lament during seasons of dryness or perceived distance.'),
  ('KJV', 'Psalms', 13, 1, null, 'Psalm 13:1', 'How long wilt thou forget me, O LORD? for ever? how long wilt thou hide thy face from me?', 'distant', 'Biblical lament validating honest prayer during periods of feeling abandoned.'),
  ('KJV', 'Psalms', 51, 10, null, 'Psalm 51:10', 'Create in me a clean heart, O God; and renew a right spirit within me.', 'convicted', 'Davidic psalm of genuine repentance, turning from guilt toward renewing grace.'),
  ('KJV', '1 John', 1, 9, null, '1 John 1:9', 'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.', 'convicted', 'Covenant assurance of forgiveness and purification through Christ.')
on conflict (translation, reference) do nothing;

-- 11. Seed Curated Journeys and Days
insert into public.journeys (id, title, description, category, total_days, recommended_moods, is_published)
values
  ('jr-finding-peace', 'Finding Peace', 'Five days learning to let go of anxiety and rest in God''s presence.', 'Peace', 5, array['peaceful', 'distant'], true),
  ('jr-growing-faith', 'Growing in Faith', 'Five days building a faith that holds steady, not just when it''s easy.', 'Faith', 5, array['doubting', 'seeking'], true),
  ('jr-overcoming-fear', 'Overcoming Fear', 'Five days facing what frightens you with real, scriptural courage.', 'Courage', 5, array['doubting', 'convicted'], true)
on conflict (id) do nothing;

insert into public.journey_days (journey_id, day_number, title, verse_reference, verse_text, reflection, prayer)
values
  ('jr-finding-peace', 1, 'Bring It to God', 'Philippians 4:6-7', 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.', 'Peace doesn''t start with fixing the problem. It starts with putting the problem into someone else''s hands. What are you still carrying that you haven''t actually handed over yet?', 'Lord, I bring you what''s been weighing on me today. I don''t need to solve it right now — I just need to stop carrying it alone. Guard my heart and mind. Amen.'),
  ('jr-finding-peace', 2, 'A Different Kind of Peace', 'John 14:27', 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.', 'The world''s peace depends on circumstances going right. This peace doesn''t. What would it look like to feel steady today, even if nothing around you changes?', 'Jesus, give me the peace that doesn''t depend on my circumstances lining up. Let my heart be still even in the middle of what''s unresolved. Amen.'),
  ('jr-finding-peace', 3, 'A Mind Stayed on God', 'Isaiah 26:3', 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.', 'Peace here isn''t passive — it''s a mind that''s been deliberately fixed on something steady. What keeps pulling your attention away today, and what would it take to redirect it?', 'Father, keep my mind fixed on you today, especially when my thoughts want to wander toward worry. I trust you with what I can''t control. Amen.'),
  ('jr-finding-peace', 4, 'Strength and Peace Together', 'Psalm 29:11', 'The LORD will give strength unto his people; the LORD will bless his people with peace.', 'Peace isn''t the absence of hard things — it often comes paired with the strength to face them. Where do you need both today, not just one or the other?', 'Lord, give me strength for what''s ahead and peace to carry it well. I don''t need to feel nothing — I need to feel steady. Amen.'),
  ('jr-finding-peace', 5, 'Let Peace Rule', 'Colossians 3:15', 'And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful.', 'This verse treats peace like a decision, not just a feeling — something you let govern you. Looking back on this week, where did you let peace rule, and where did you let something else take over instead?', 'God, thank you for meeting me this week. Help peace be the thing that governs my heart going forward, not anxiety, not control. Amen.')
on conflict (journey_id, day_number) do nothing;

-- 12. Seed Curated LivingWord Teachings
insert into public.living_word_teachings (slug, title, teacher, teacher_role, category, duration, scripture_reference, excerpt, is_published)
values
  ('when-faith-feels-small', 'When faith feels small', 'Pastor Asket', 'LifeBook teaching contributor', 'Faith', '12 min', 'Mark 9:24', 'Lord, I believe; help my unbelief.', true),
  ('learning-to-be-still', 'Learning to be still', 'Pastor Asket', 'LifeBook teaching contributor', 'Prayer', '9 min', 'Psalm 46:10', 'Be still, and know that I am God.', true),
  ('mercy-of-a-new-morning', 'The mercy of a new morning', 'Pastor Asket', 'LifeBook teaching contributor', 'Hope', '15 min', 'Lamentations 3:22-23', 'The steadfast love of the Lord never ceases.', true),
  ('a-life-shaped-by-love', 'A life shaped by love', 'Pastor Asket', 'LifeBook teaching contributor', 'Discipleship', '18 min', 'John 13:34-35', 'By this all people will know that you are my disciples.', true)
on conflict (slug) do nothing;
