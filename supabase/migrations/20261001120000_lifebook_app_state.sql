-- Compatibility persistence for the active FastAPI service's existing state model.
-- Access is server-only; the service role key bypasses RLS.
create table if not exists public.lifebook_app_state (
  state_key text primary key check (state_key = 'default'),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.lifebook_app_state enable row level security;
revoke all on public.lifebook_app_state from anon, authenticated;
grant all on public.lifebook_app_state to service_role;