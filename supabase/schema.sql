-- QA Winter Wellness Bingo Tracker - database schema
--
-- Security model:
--   - `participants.pin_hash` / `admin_settings.password_hash` and all writes
--     are only reachable through the SECURITY DEFINER functions below, never
--     through direct table access.
--   - `login()` verifies the PIN and returns a participant id. The frontend
--     keeps {participantId, pin} in localStorage as its "session" and passes
--     both back in on every write (toggle_activity) so the PIN never needs to
--     be re-typed after the initial login.
--   - `admin_login()` works the same way for the shared admin password (kept
--     in sessionStorage, not localStorage, so it clears when the tab closes).
--   - `activities` and `app_settings` are non-sensitive reference/display
--     data, so they are left publicly readable directly via RLS.
--   - `get_leaderboard()` is publicly callable with no PIN required, since a
--     username + completed-count is the whole point of a shared leaderboard.
--   - Participants sign up themselves via `signup()` (username + *@rmit.edu.au
--     email, format-checked but not verified) or get added by an admin via
--     `admin_add_participant()` - both paths generate a PIN the same way.
--     Login works with either the username or the email (`citext` makes both
--     case-insensitive).
--
-- Rounds: this challenge gets re-run periodically. Rather than destroying
-- history on every reset, completions are scoped to a `round`. Starting a
-- new round (via the admin page) closes out the current one and opens a
-- fresh one - everyone's board goes back to 0/25 but past rounds' results
-- stay in the database for the admin to look back on.
--
-- Run this once in the Supabase SQL editor (or via `supabase db push`) on a
-- fresh project, then run `seed.sql` to load the 25 activities, default
-- settings text, the first round, and a default admin password.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- The Supabase SQL editor installs new extensions into a separate
-- `extensions` schema rather than `public`. The SECURITY DEFINER functions
-- below call `crypt()` / `gen_salt()` unqualified, which only resolves if
-- pgcrypto is reachable via the default search_path - move it into `public`
-- explicitly so this works regardless of where it landed. (Safe/idempotent:
-- only runs if it isn't already there.)
do $$
begin
  if not exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pgcrypto' and n.nspname = 'public'
  ) then
    alter extension pgcrypto set schema public;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- `citext` makes username/email lookups and uniqueness case-insensitive
-- automatically (no manual lower() needed), so "Jordan" and "jordan" collide
-- and login can match either field with a single equality check.
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique,
  email citext not null unique check (email ~ '^[A-Za-z0-9._%+-]+@rmit\.edu\.au$'),
  pin_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id serial primary key,
  position int not null unique check (position between 1 and 25),
  title text not null
);

create table if not exists rounds (
  id serial primary key,
  label text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Only one round should ever have ended_at = null (the "active" round).
create unique index if not exists rounds_single_active
  on rounds ((ended_at is null))
  where ended_at is null;

create table if not exists completions (
  participant_id uuid not null references participants(id) on delete cascade,
  activity_id int not null references activities(id) on delete cascade,
  round_id int not null references rounds(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (participant_id, activity_id, round_id)
);

-- Free-text display settings shown on the participant-facing app (title,
-- kicker, subtitle, footer note) - non-sensitive, publicly readable.
create table if not exists app_settings (
  key text primary key,
  value text not null
);

-- Single-row table holding the shared admin password hash.
create table if not exists admin_settings (
  id boolean primary key default true check (id),
  password_hash text not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table participants enable row level security;
alter table activities enable row level security;
alter table rounds enable row level security;
alter table completions enable row level security;
alter table app_settings enable row level security;
alter table admin_settings enable row level security;

-- No policies on participants/rounds/completions/admin_settings for anon or
-- authenticated => fully locked down; only reachable via the SECURITY
-- DEFINER functions below.

-- activities and app_settings are non-sensitive, safe to read directly.
drop policy if exists "activities are publicly readable" on activities;
create policy "activities are publicly readable"
  on activities for select
  to anon, authenticated
  using (true);

drop policy if exists "app_settings are publicly readable" on app_settings;
create policy "app_settings are publicly readable"
  on app_settings for select
  to anon, authenticated
  using (true);

revoke all on participants from anon, authenticated;
revoke all on rounds from anon, authenticated;
revoke all on completions from anon, authenticated;
revoke all on admin_settings from anon, authenticated;
grant select on activities to anon, authenticated;
grant select on app_settings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Internal helpers (not exposed to anon/authenticated directly)
-- ---------------------------------------------------------------------------

create or replace function current_round_id()
returns int
language sql
stable
set search_path = public
as $$
  select id from rounds where ended_at is null order by started_at desc limit 1;
$$;

create or replace function assert_admin(p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select password_hash into v_hash from admin_settings where id = true;

  if v_hash is null or v_hash <> crypt(p_password, v_hash) then
    raise exception 'Invalid admin password';
  end if;
end;
$$;

-- Shared validation used by both self-signup and admin-added participants,
-- so both paths are held to the same rules.
create or replace function assert_valid_username_and_email(p_username text, p_email text)
returns void
language plpgsql
set search_path = public
as $$
begin
  if trim(p_username) = '' then
    raise exception 'Username cannot be empty';
  end if;

  if length(trim(p_username)) > 40 then
    raise exception 'Username must be 40 characters or fewer';
  end if;

  if p_email !~ '^[A-Za-z0-9._%+-]+@rmit\.edu\.au$' then
    raise exception 'Email must be a valid *@rmit.edu.au address';
  end if;
end;
$$;

create or replace function random_pin()
returns text
language sql
as $$
  select lpad(floor(random() * 10000)::text, 4, '0');
$$;

-- ---------------------------------------------------------------------------
-- Participant-facing RPC functions
-- ---------------------------------------------------------------------------

-- login(identifier, pin) -> participant id + their username, or raises an
-- exception if invalid. `identifier` can be either the username or the email
-- - citext makes both comparisons case-insensitive. The username is returned
-- (not just the id) so the frontend can display it even if you logged in
-- with your email.
create or replace function login(p_identifier text, p_pin text)
returns table(participant_id uuid, username text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_username citext;
  v_hash text;
  v_identifier citext := trim(p_identifier);
begin
  select id, participants.username, pin_hash into v_id, v_username, v_hash
  from participants
  where participants.username = v_identifier or participants.email = v_identifier;

  if v_id is null or v_hash <> crypt(p_pin, v_hash) then
    raise exception 'Invalid username/email or PIN';
  end if;

  return query select v_id, v_username::text;
end;
$$;

revoke all on function login(text, text) from public;
grant execute on function login(text, text) to anon, authenticated;

-- signup(username, email) -> a freshly created participant id + their PIN
-- (shown once - only ever stored hashed after this). Self-service alternative
-- to the admin adding people manually.
create or replace function signup(p_username text, p_email text)
returns table(participant_id uuid, pin text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_signups_open text;
  v_pin text;
  v_id uuid;
begin
  select value into v_signups_open from app_settings where key = 'signups_open';
  if coalesce(v_signups_open, 'true') <> 'true' then
    raise exception 'Signups are currently closed - ask your challenge organiser to add you.';
  end if;

  perform assert_valid_username_and_email(p_username, p_email);

  v_pin := random_pin();

  begin
    insert into participants (username, email, pin_hash)
    values (trim(p_username), trim(p_email), crypt(v_pin, gen_salt('bf')))
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'That username or email is already taken - try logging in instead.';
  end;

  return query select v_id, v_pin;
end;
$$;

revoke all on function signup(text, text) from public;
grant execute on function signup(text, text) to anon, authenticated;

-- toggle_activity(participant_id, pin, activity_id) -> true if now completed,
-- false if now un-completed, scoped to the current active round.
create or replace function toggle_activity(p_participant_id uuid, p_pin text, p_activity_id int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_round_id int;
  v_existing timestamptz;
begin
  select pin_hash into v_hash
  from participants
  where id = p_participant_id;

  if v_hash is null or v_hash <> crypt(p_pin, v_hash) then
    raise exception 'Invalid session or PIN';
  end if;

  v_round_id := current_round_id();
  if v_round_id is null then
    raise exception 'No active challenge round right now';
  end if;

  select completed_at into v_existing
  from completions
  where participant_id = p_participant_id
    and activity_id = p_activity_id
    and round_id = v_round_id;

  if v_existing is not null then
    delete from completions
    where participant_id = p_participant_id
      and activity_id = p_activity_id
      and round_id = v_round_id;
    return false;
  else
    insert into completions (participant_id, activity_id, round_id)
    values (p_participant_id, p_activity_id, v_round_id);
    return true;
  end if;
end;
$$;

revoke all on function toggle_activity(uuid, text, int) from public;
grant execute on function toggle_activity(uuid, text, int) to anon, authenticated;

-- get_my_board(participant_id) -> every activity plus whether this
-- participant has completed it in the current active round. No PIN needed:
-- the participant id is an unguessable random UUID handed out at login, so
-- it doubles as a session token for read-only access to your own board.
create or replace function get_my_board(p_participant_id uuid)
returns table(activity_id int, "position" int, title text, completed boolean)
language sql
security definer
set search_path = public
as $$
  select
    a.id,
    a.position,
    a.title,
    (c.participant_id is not null) as completed
  from activities a
  left join completions c
    on c.activity_id = a.id
    and c.participant_id = p_participant_id
    and c.round_id = current_round_id()
  order by a.position;
$$;

revoke all on function get_my_board(uuid) from public;
grant execute on function get_my_board(uuid) to anon, authenticated;

-- get_leaderboard() -> username + completed count for everyone in the
-- current active round, no login needed. Email is never exposed here.
create or replace function get_leaderboard()
returns table(username text, completed_count bigint)
language sql
security definer
set search_path = public
as $$
  select
    p.username::text,
    count(c.activity_id) as completed_count
  from participants p
  left join completions c
    on c.participant_id = p.id and c.round_id = current_round_id()
  group by p.id, p.username
  order by completed_count desc, p.username asc;
$$;

revoke all on function get_leaderboard() from public;
grant execute on function get_leaderboard() to anon, authenticated;

-- get_recent_activity(limit) -> the most recently completed activities still
-- checked off in the current round, newest first. Powers a lightweight "who
-- just did what" ticker on the leaderboard - no login needed, same privacy
-- posture as get_leaderboard() (username + activity title only, no email).
create or replace function get_recent_activity(p_limit int default 8)
returns table(username text, activity_title text, completed_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.username::text, a.title, c.completed_at
  from completions c
  join participants p on p.id = c.participant_id
  join activities a on a.id = c.activity_id
  where c.round_id = current_round_id()
  order by c.completed_at desc
  limit greatest(p_limit, 0);
$$;

revoke all on function get_recent_activity(int) from public;
grant execute on function get_recent_activity(int) to anon, authenticated;

-- get_app_settings() -> display text for the participant-facing app. Also
-- reachable directly via `select * from app_settings` since it's public, but
-- an RPC keeps the frontend API consistent.
create or replace function get_app_settings()
returns table(key text, value text)
language sql
security invoker
set search_path = public
as $$
  select key, value from app_settings;
$$;

grant execute on function get_app_settings() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin RPC functions (all require the shared admin password)
-- ---------------------------------------------------------------------------

create or replace function admin_login(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);
  return true;
end;
$$;

revoke all on function admin_login(text) from public;
grant execute on function admin_login(text) to anon, authenticated;

-- Drop the old 5-arg signature first - `create or replace function` can't
-- change a function's argument list, so re-running this on a database that
-- already has the old signature would otherwise leave both versions around.
drop function if exists admin_update_settings(text, text, text, text, text);

-- Update the display settings shown on the participant-facing app.
-- p_challenge_end_date is a "yyyy-mm-dd" string (or '' to hide the countdown
-- banner) - kept as text like the other settings, rather than a typed date
-- column, since app_settings is a generic key/value store.
create or replace function admin_update_settings(
  p_password text,
  p_title text,
  p_kicker text,
  p_subtitle text,
  p_footer_note text,
  p_challenge_end_date text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);

  insert into app_settings (key, value) values
    ('title', p_title),
    ('kicker', p_kicker),
    ('subtitle', p_subtitle),
    ('footer_note', p_footer_note),
    ('challenge_end_date', coalesce(trim(p_challenge_end_date), ''))
  on conflict (key) do update set value = excluded.value;
end;
$$;

revoke all on function admin_update_settings(text, text, text, text, text, text) from public;
grant execute on function admin_update_settings(text, text, text, text, text, text) to anon, authenticated;

-- Opens/closes self-service signup (checked by signup()). app_settings is
-- publicly readable, so the frontend can show the current state via
-- get_app_settings() without needing a dedicated admin-only read function.
create or replace function admin_set_signups_open(p_password text, p_open boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);

  insert into app_settings (key, value) values ('signups_open', p_open::text)
  on conflict (key) do update set value = excluded.value;
end;
$$;

revoke all on function admin_set_signups_open(text, boolean) from public;
grant execute on function admin_set_signups_open(text, boolean) to anon, authenticated;

create or replace function admin_change_password(p_current_password text, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_current_password);

  if length(p_new_password) < 4 then
    raise exception 'New password must be at least 4 characters';
  end if;

  update admin_settings set password_hash = crypt(p_new_password, gen_salt('bf')) where id = true;
end;
$$;

revoke all on function admin_change_password(text, text) from public;
grant execute on function admin_change_password(text, text) to anon, authenticated;

-- List every activity for editing (same data as the public `activities`
-- table/select, exposed as an RPC for a consistent admin API surface).
create or replace function admin_list_activities(p_password text)
returns table(activity_id int, "position" int, title text)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);
  return query select a.id, a.position, a.title from activities a order by a.position;
end;
$$;

revoke all on function admin_list_activities(text) from public;
grant execute on function admin_list_activities(text) to anon, authenticated;

-- Edit the title of one of the 25 activity slots (position 1-25).
create or replace function admin_update_activity(p_password text, p_position int, p_title text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);

  if p_position < 1 or p_position > 25 then
    raise exception 'Position must be between 1 and 25';
  end if;

  insert into activities (position, title) values (p_position, p_title)
  on conflict (position) do update set title = excluded.title;
end;
$$;

revoke all on function admin_update_activity(text, int, text) from public;
grant execute on function admin_update_activity(text, int, text) to anon, authenticated;

-- List every participant with their completed count for the current round.
-- Email is included here since this is an admin-only view, never public.
create or replace function admin_list_participants(p_password text)
returns table(participant_id uuid, username text, email text, created_at timestamptz, completed_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);
  return query
    select
      p.id,
      p.username::text,
      p.email::text,
      p.created_at,
      count(c.activity_id) as completed_count
    from participants p
    left join completions c
      on c.participant_id = p.id and c.round_id = current_round_id()
    group by p.id, p.username, p.email, p.created_at
    order by p.username asc;
end;
$$;

revoke all on function admin_list_participants(text) from public;
grant execute on function admin_list_participants(text) to anon, authenticated;

-- Add a new participant, returning their freshly generated PIN once (it is
-- only ever stored hashed - make sure to note it down / share it right away).
-- Held to the same username/email rules as self-signup.
drop function if exists admin_add_participant(text, text);

create or replace function admin_add_participant(p_password text, p_username text, p_email text)
returns table(participant_id uuid, pin text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pin text;
  v_id uuid;
begin
  perform assert_admin(p_password);
  perform assert_valid_username_and_email(p_username, p_email);

  v_pin := random_pin();

  begin
    insert into participants (username, email, pin_hash)
    values (trim(p_username), trim(p_email), crypt(v_pin, gen_salt('bf')))
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'That username or email is already taken.';
  end;

  return query select v_id, v_pin;
end;
$$;

revoke all on function admin_add_participant(text, text, text) from public;
grant execute on function admin_add_participant(text, text, text) to anon, authenticated;

-- Reset a participant's PIN (e.g. they forgot it), returning the new one.
create or replace function admin_regenerate_pin(p_password text, p_participant_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pin text;
begin
  perform assert_admin(p_password);

  v_pin := random_pin();

  update participants
  set pin_hash = crypt(v_pin, gen_salt('bf'))
  where id = p_participant_id;

  if not found then
    raise exception 'Participant not found';
  end if;

  return v_pin;
end;
$$;

revoke all on function admin_regenerate_pin(text, uuid) from public;
grant execute on function admin_regenerate_pin(text, uuid) to anon, authenticated;

create or replace function admin_remove_participant(p_password text, p_participant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);
  delete from participants where id = p_participant_id;
end;
$$;

revoke all on function admin_remove_participant(text, uuid) from public;
grant execute on function admin_remove_participant(text, uuid) to anon, authenticated;

-- List past + current rounds with aggregate stats, most recent first.
create or replace function admin_list_rounds(p_password text)
returns table(
  round_id int,
  label text,
  started_at timestamptz,
  ended_at timestamptz,
  participant_count bigint,
  total_completions bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);
  return query
    select
      r.id,
      r.label,
      r.started_at,
      r.ended_at,
      count(distinct c.participant_id) as participant_count,
      count(c.*) as total_completions
    from rounds r
    left join completions c on c.round_id = r.id
    group by r.id, r.label, r.started_at, r.ended_at
    order by r.started_at desc;
end;
$$;

revoke all on function admin_list_rounds(text) from public;
grant execute on function admin_list_rounds(text) to anon, authenticated;

-- Leaderboard snapshot for any specific round (current or past) - lets the
-- admin look back on how a previous run went.
create or replace function admin_round_leaderboard(p_password text, p_round_id int)
returns table(username text, completed_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);
  return query
    select p.username::text, count(c.activity_id) as completed_count
    from participants p
    left join completions c on c.participant_id = p.id and c.round_id = p_round_id
    group by p.id, p.username
    order by completed_count desc, p.username asc;
end;
$$;

revoke all on function admin_round_leaderboard(text, int) from public;
grant execute on function admin_round_leaderboard(text, int) to anon, authenticated;

-- Renames the current active round without resetting anything (handy right
-- after seeding, to label it "Round 3" etc instead of the generic default).
create or replace function admin_rename_current_round(p_password text, p_label text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_password);
  update rounds set label = trim(p_label) where ended_at is null;
end;
$$;

revoke all on function admin_rename_current_round(text, text) from public;
grant execute on function admin_rename_current_round(text, text) to anon, authenticated;

-- Ends the current active round (if any) and starts a brand new one.
-- Everyone's board goes back to 0/25; all previous rounds' data is kept.
create or replace function admin_start_new_round(p_password text, p_label text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_id int;
begin
  perform assert_admin(p_password);

  update rounds set ended_at = now() where ended_at is null;

  insert into rounds (label) values (coalesce(trim(p_label), 'New round'))
  returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke all on function admin_start_new_round(text, text) from public;
grant execute on function admin_start_new_round(text, text) to anon, authenticated;
