-- Apex — initial schema.
--
-- Identity: Clerk is the auth provider (Supabase third-party auth).
-- Every request carries a Clerk session JWT; RLS keys off
-- auth.jwt() ->> 'sub' (the Clerk user id, text like "user_2ab...").
--
-- Sync protocol: clients sync document-shaped workout sessions.
-- `upsert_workout_session` unpacks a document into the normalized
-- workout_sessions / workout_exercises / sets tables transactionally;
-- `workout_session_documents` reassembles them for pulls.

create schema if not exists private;

-- Helper: current Clerk user id from the verified JWT.
create or replace function private.clerk_user_id()
returns text
language sql stable
as $$
  select coalesce(auth.jwt() ->> 'sub', '')
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id text primary key, -- Clerk user id
  user_id text not null default private.clerk_user_id(),
  display_name text,
  goal text not null check (goal in ('hypertrophy', 'strength', 'endurance', 'general')),
  experience text not null check (experience in ('beginner', 'intermediate', 'advanced')),
  equipment jsonb not null default '[]'::jsonb,
  limitations text not null default '',
  avoid_muscles jsonb not null default '[]'::jsonb,
  unit text not null default 'kg' check (unit in ('kg', 'lb')),
  preferred_session_minutes int not null default 60
    check (preferred_session_minutes between 15 and 180),
  bodyweight_history jsonb not null default '[]'::jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own rows" on public.profiles
  for all
  using (id = private.clerk_user_id())
  with check (id = private.clerk_user_id() and user_id = private.clerk_user_id());

-- ---------------------------------------------------------------------------
-- exercises (seeded rows have user_id null; custom rows are per-user)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id text primary key,
  user_id text default private.clerk_user_id(), -- null = global seed row
  name text not null,
  description text not null default '',
  instructions jsonb not null default '[]'::jsonb,
  primary_muscles jsonb not null default '[]'::jsonb,
  secondary_muscles jsonb not null default '[]'::jsonb,
  equipment jsonb not null default '[]'::jsonb,
  difficulty text not null default 'beginner'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  movement_pattern text not null,
  animation_url text,
  video_url text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "exercises: read seed + own" on public.exercises
  for select
  using (user_id is null or user_id = private.clerk_user_id());

create policy "exercises: insert own custom" on public.exercises
  for insert
  with check (user_id = private.clerk_user_id() and is_custom = true);

create policy "exercises: update own custom" on public.exercises
  for update
  using (user_id = private.clerk_user_id())
  with check (user_id = private.clerk_user_id() and is_custom = true);

create policy "exercises: delete own custom" on public.exercises
  for delete
  using (user_id = private.clerk_user_id() and is_custom = true);

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id text primary key, -- equals exercise_id, scoped by user below
  user_id text not null default private.clerk_user_id(),
  exercise_id text not null references public.exercises (id) on delete cascade,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

alter table public.favorites enable row level security;

create policy "favorites: own rows" on public.favorites
  for all
  using (user_id = private.clerk_user_id())
  with check (user_id = private.clerk_user_id());

-- ---------------------------------------------------------------------------
-- workout sessions (normalized)
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id text primary key,
  user_id text not null default private.clerk_user_id(),
  name text not null,
  status text not null default 'completed'
    check (status in ('planned', 'active', 'completed', 'discarded')),
  started_at timestamptz not null,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_started
  on public.workout_sessions (user_id, started_at desc);

alter table public.workout_sessions enable row level security;

create policy "workout_sessions: own rows" on public.workout_sessions
  for all
  using (user_id = private.clerk_user_id())
  with check (user_id = private.clerk_user_id());

create table if not exists public.workout_exercises (
  id text primary key,
  session_id text not null references public.workout_sessions (id) on delete cascade,
  user_id text not null default private.clerk_user_id(),
  exercise_id text not null,
  "order" int not null default 0,
  target_sets int not null default 3,
  target_reps_min int not null default 8,
  target_reps_max int not null default 12,
  target_weight_kg numeric,
  rest_seconds int not null default 90,
  notes text
);

alter table public.workout_exercises enable row level security;

create policy "workout_exercises: own rows" on public.workout_exercises
  for all
  using (user_id = private.clerk_user_id())
  with check (user_id = private.clerk_user_id());

create table if not exists public.sets (
  id text primary key,
  workout_exercise_id text not null references public.workout_exercises (id) on delete cascade,
  user_id text not null default private.clerk_user_id(),
  set_number int not null,
  weight_kg numeric not null default 0,
  reps int not null default 0,
  rpe numeric check (rpe between 1 and 10),
  rir numeric check (rir >= 0),
  is_warmup boolean not null default false,
  is_failure boolean not null default false,
  is_drop_set boolean not null default false,
  auto_detected boolean not null default false,
  confidence numeric check (confidence between 0 and 1),
  avg_hr numeric,
  notes text,
  completed_at timestamptz not null
);

alter table public.sets enable row level security;

create policy "sets: own rows" on public.sets
  for all
  using (user_id = private.clerk_user_id())
  with check (user_id = private.clerk_user_id());

-- ---------------------------------------------------------------------------
-- Document sync: unpack a camelCase session document into normalized rows.
-- Runs as the caller, so RLS applies to every statement.
-- ---------------------------------------------------------------------------
create or replace function public.upsert_workout_session(session_document jsonb)
returns void
language plpgsql
as $$
declare
  uid text := private.clerk_user_id();
  ex jsonb;
  st jsonb;
begin
  if uid = '' then
    raise exception 'not authenticated';
  end if;

  insert into public.workout_sessions as ws
    (id, user_id, name, status, started_at, completed_at, notes, created_at, updated_at)
  values (
    session_document ->> 'id',
    uid,
    session_document ->> 'name',
    session_document ->> 'status',
    (session_document ->> 'startedAt')::timestamptz,
    (session_document ->> 'completedAt')::timestamptz,
    session_document ->> 'notes',
    coalesce((session_document ->> 'createdAt')::timestamptz, now()),
    coalesce((session_document ->> 'updatedAt')::timestamptz, now())
  )
  on conflict (id) do update set
    name = excluded.name,
    status = excluded.status,
    started_at = excluded.started_at,
    completed_at = excluded.completed_at,
    notes = excluded.notes,
    updated_at = excluded.updated_at
  where ws.user_id = uid;

  -- Replace child rows wholesale: the document is the source of truth.
  delete from public.workout_exercises
    where session_id = session_document ->> 'id' and user_id = uid;

  for ex in select * from jsonb_array_elements(coalesce(session_document -> 'exercises', '[]'::jsonb))
  loop
    insert into public.workout_exercises
      (id, session_id, user_id, exercise_id, "order", target_sets,
       target_reps_min, target_reps_max, target_weight_kg, rest_seconds, notes)
    values (
      ex ->> 'id',
      session_document ->> 'id',
      uid,
      ex ->> 'exerciseId',
      coalesce((ex ->> 'order')::int, 0),
      coalesce((ex ->> 'targetSets')::int, 3),
      coalesce((ex ->> 'targetRepsMin')::int, 8),
      coalesce((ex ->> 'targetRepsMax')::int, 12),
      (ex ->> 'targetWeightKg')::numeric,
      coalesce((ex ->> 'restSeconds')::int, 90),
      ex ->> 'notes'
    );

    for st in select * from jsonb_array_elements(coalesce(ex -> 'sets', '[]'::jsonb))
    loop
      insert into public.sets
        (id, workout_exercise_id, user_id, set_number, weight_kg, reps, rpe, rir,
         is_warmup, is_failure, is_drop_set, auto_detected, confidence, avg_hr,
         notes, completed_at)
      values (
        st ->> 'id',
        ex ->> 'id',
        uid,
        coalesce((st ->> 'setNumber')::int, 1),
        coalesce((st ->> 'weightKg')::numeric, 0),
        coalesce((st ->> 'reps')::int, 0),
        (st ->> 'rpe')::numeric,
        (st ->> 'rir')::numeric,
        coalesce((st ->> 'isWarmup')::boolean, false),
        coalesce((st ->> 'isFailure')::boolean, false),
        coalesce((st ->> 'isDropSet')::boolean, false),
        coalesce((st ->> 'autoDetected')::boolean, false),
        (st ->> 'confidence')::numeric,
        (st ->> 'avgHr')::numeric,
        st ->> 'notes',
        coalesce((st ->> 'completedAt')::timestamptz, now())
      );
    end loop;
  end loop;
end;
$$;

-- Reassemble documents for pulls. RLS on base tables applies via
-- security_invoker.
create or replace view public.workout_session_documents
with (security_invoker = true)
as
select
  ws.id,
  ws.user_id,
  ws.updated_at,
  jsonb_build_object(
    'id', ws.id,
    'userId', ws.user_id,
    'name', ws.name,
    'status', ws.status,
    'startedAt', ws.started_at,
    'completedAt', ws.completed_at,
    'notes', ws.notes,
    'createdAt', ws.created_at,
    'updatedAt', ws.updated_at,
    'exercises', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', we.id,
        'exerciseId', we.exercise_id,
        'order', we."order",
        'targetSets', we.target_sets,
        'targetRepsMin', we.target_reps_min,
        'targetRepsMax', we.target_reps_max,
        'targetWeightKg', we.target_weight_kg,
        'restSeconds', we.rest_seconds,
        'notes', we.notes,
        'sets', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', s.id,
            'setNumber', s.set_number,
            'weightKg', s.weight_kg,
            'reps', s.reps,
            'rpe', s.rpe,
            'rir', s.rir,
            'isWarmup', s.is_warmup,
            'isFailure', s.is_failure,
            'isDropSet', s.is_drop_set,
            'autoDetected', s.auto_detected,
            'confidence', s.confidence,
            'avgHr', s.avg_hr,
            'notes', s.notes,
            'completedAt', s.completed_at
          ) order by s.set_number)
          from public.sets s where s.workout_exercise_id = we.id
        ), '[]'::jsonb)
      ) order by we."order")
      from public.workout_exercises we where we.session_id = ws.id
    ), '[]'::jsonb)
  ) as document
from public.workout_sessions ws;

-- ---------------------------------------------------------------------------
-- Derived analytics (server-side mirrors of src/domain/stats.ts)
-- ---------------------------------------------------------------------------
create or replace view public.weekly_stats
with (security_invoker = true)
as
select
  ws.user_id,
  date_trunc('week', ws.started_at)::date as week_start,
  count(distinct ws.id) as workouts,
  coalesce(sum(extract(epoch from (ws.completed_at - ws.started_at)) / 60), 0)::int as minutes,
  coalesce(sum(s.weight_kg * s.reps) filter (where not s.is_warmup), 0) as total_volume_kg
from public.workout_sessions ws
left join public.workout_exercises we on we.session_id = ws.id
left join public.sets s on s.workout_exercise_id = we.id
where ws.status = 'completed'
group by ws.user_id, date_trunc('week', ws.started_at);

create or replace view public.personal_records
with (security_invoker = true)
as
select distinct on (s.user_id, we.exercise_id)
  s.user_id,
  we.exercise_id,
  s.weight_kg * (1 + least(s.reps, 12)::numeric / 30) as estimated_1rm_kg,
  s.weight_kg,
  s.reps,
  s.completed_at
from public.sets s
join public.workout_exercises we on we.id = s.workout_exercise_id
where not s.is_warmup and s.reps > 0
order by s.user_id, we.exercise_id,
  s.weight_kg * (1 + least(s.reps, 12)::numeric / 30) desc;
