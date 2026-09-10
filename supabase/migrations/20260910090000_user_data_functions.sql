-- Keep streak and journey-day progression atomic when a user has multiple
-- devices open at once.
alter table public.profiles add column if not exists joined_group_suggestion text;

create or replace function public.record_user_streak(p_user_id text, p_day date)
returns table (current integer, longest integer, last_checkin date)
language plpgsql security definer set search_path = public as $$
declare current_streak public.streaks%rowtype;
begin
  insert into public.streaks (user_id, current, longest, last_checkin)
  values (p_user_id, 1, 1, p_day) on conflict (user_id) do nothing;
  select * into current_streak from public.streaks where user_id = p_user_id for update;
  if current_streak.last_checkin < p_day then
    if current_streak.last_checkin = p_day - 1 then current_streak.current := current_streak.current + 1;
    else current_streak.current := 1; end if;
    current_streak.longest := greatest(current_streak.longest, current_streak.current);
    current_streak.last_checkin := p_day;
    update public.streaks set current = current_streak.current, longest = current_streak.longest,
      last_checkin = current_streak.last_checkin, updated_at = now() where user_id = p_user_id;
  end if;
  return query select current_streak.current, current_streak.longest, current_streak.last_checkin;
end;
$$;
revoke execute on function public.record_user_streak(text, date) from public;
grant execute on function public.record_user_streak(text, date) to service_role;

create or replace function public.complete_user_journey_day(p_user_id text, p_journey_id text, p_total_days integer)
returns table (journey_id text, current_day integer, completed_days integer[], started_at timestamptz, completed_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare progress public.user_journey_progress%rowtype;
begin
  select * into progress from public.user_journey_progress where user_id = p_user_id and journey_id = p_journey_id for update;
  if not found then raise exception 'Journey not started for this user'; end if;
  if not progress.current_day = any(progress.completed_days) then progress.completed_days := array_append(progress.completed_days, progress.current_day); end if;
  if progress.current_day >= p_total_days then progress.completed_at := now(); else progress.current_day := progress.current_day + 1; end if;
  update public.user_journey_progress set current_day = progress.current_day, completed_days = progress.completed_days,
    completed_at = progress.completed_at where user_id = p_user_id and journey_id = p_journey_id;
  return query select progress.journey_id, progress.current_day, progress.completed_days, progress.started_at, progress.completed_at;
end;
$$;
revoke execute on function public.complete_user_journey_day(text, text, integer) from public;
grant execute on function public.complete_user_journey_day(text, text, integer) to service_role;
