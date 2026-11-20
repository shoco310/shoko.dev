-- Phase B: private intake of citizen submissions + staff review.
--
-- Security model (see docs/platform/plan.md §5 and hosting.md §3):
--   * Citizens never sign in. They submit through the Vercel Function
--     POST /api/submit, which verifies Turnstile and then calls
--     public.submit_voice() with the secret (service_role) key. No other
--     role may execute it.
--   * anon (the public site) gets NO privileges on any table here.
--   * Staff sign in with Supabase Auth and must have completed TOTP MFA
--     (aal2). Row Level Security only lets staff rows through, and column
--     grants limit what staff can change.
--   * Contact details live in a separate table that no API role can read
--     directly; staff reveal them one submission at a time through
--     public.reveal_contact(), which writes an audit_log row each time.
--   * Defense in depth: table GRANTs are revoked AND RLS is enabled, so a
--     mistake in one layer alone does not expose data.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null default 'admin' check (role in ('admin', 'reviewer')),
  display_name text not null,
  created_at   timestamptz not null default now()
);
comment on table public.staff is
  'People allowed into the review screen. Currently only the site operator (佐藤祥子). Rows are added by hand in the dashboard/SQL, never through the API.';

create table public.submissions (
  id              uuid primary key default gen_random_uuid(),
  receipt_no      text not null unique,
  body            text not null check (char_length(btrim(body)) between 1 and 4000),
  theme_hints     text[] not null default '{}' check (cardinality(theme_hints) <= 10),
  area_hint       text check (char_length(area_hint) <= 50),
  age_range       text check (age_range in ('teens', '20s', '30s', '40s', '50s', '60s', '70plus', 'no_answer')),
  has_contact     boolean not null default false,
  status          text not null default 'received'
                  check (status in ('received', 'reviewing', 'used', 'not_published', 'spam', 'urgent_referral')),
  reviewer_note   text check (char_length(reviewer_note) <= 4000),
  privacy_version text not null,
  ip_hash         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.submissions is
  'Citizen submissions, private. Never exposed to anon. Public-facing summaries are written separately by staff (Phase C).';
comment on column public.submissions.ip_hash is
  'Salted hash of the sender IP, for rate limiting only. The raw IP is never stored.';

create index submissions_created_at_idx on public.submissions (created_at desc);
create index submissions_status_idx on public.submissions (status);
create index submissions_ip_hash_created_idx on public.submissions (ip_hash, created_at);

create table public.submission_contacts (
  submission_id uuid primary key references public.submissions (id) on delete cascade,
  name          text check (char_length(name) <= 100),
  email         text check (char_length(email) <= 254),
  reply_ok      boolean not null default false,
  delete_after  date not null default (current_date + interval '1 year')
);
comment on table public.submission_contacts is
  'Optional contact details, stored apart from the submission and deleted after delete_after. Readable only via reveal_contact().';

create table public.audit_log (
  id           bigint generated always as identity primary key,
  actor        uuid,
  action       text not null,
  target_table text not null,
  target_id    text,
  detail       jsonb not null default '{}',
  at           timestamptz not null default now()
);
comment on table public.audit_log is 'Who did what to private data, and when. Append-only.';

-- ---------------------------------------------------------------------------
-- Privileges: start from nothing, then grant only what is needed
-- ---------------------------------------------------------------------------

revoke all on table public.staff, public.submissions, public.submission_contacts, public.audit_log
  from anon, authenticated;

alter table public.staff enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_contacts enable row level security;
alter table public.audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True only for a signed-in staff member whose session completed MFA.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (select 1 from public.staff s where s.user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_staff()
     and exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'admin');
$$;

-- Random, non-sequential receipt number like "UB-7KQ4-M2PX"
-- (Crockford-style alphabet without 0/O/1/I/L/U to avoid misreading).
create or replace function public.generate_receipt_no()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes bytea := extensions.gen_random_bytes(8);
  out text := 'UB-';
begin
  for i in 0..7 loop
    if i = 4 then out := out || '-'; end if;
    out := out || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return out;
end;
$$;

-- ---------------------------------------------------------------------------
-- Intake (called only by /api/submit with the service_role key)
-- ---------------------------------------------------------------------------

create or replace function public.submit_voice(
  p_body            text,
  p_privacy_version text,
  p_ip_hash         text,
  p_theme_hints     text[] default '{}',
  p_area_hint       text default null,
  p_age_range       text default null,
  p_name            text default null,
  p_email           text default null,
  p_reply_ok        boolean default false
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id      uuid;
  v_receipt text;
  v_recent  int;
  v_name    text := nullif(btrim(p_name), '');
  v_email   text := nullif(lower(btrim(p_email)), '');
begin
  -- Rate limit: at most 3 submissions per sender per hour.
  if p_ip_hash is not null then
    select count(*) into v_recent
      from public.submissions
     where ip_hash = p_ip_hash
       and created_at > now() - interval '1 hour';
    if v_recent >= 3 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
  end if;

  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;

  loop
    v_receipt := public.generate_receipt_no();
    begin
      insert into public.submissions
        (receipt_no, body, theme_hints, area_hint, age_range, has_contact, privacy_version, ip_hash)
      values
        (v_receipt, btrim(p_body), coalesce(p_theme_hints, '{}'), nullif(btrim(p_area_hint), ''),
         p_age_range, (v_name is not null or v_email is not null), p_privacy_version, p_ip_hash)
      returning id into v_id;
      exit;
    exception when unique_violation then
      -- receipt_no collision: try again with a new random number
    end;
  end loop;

  if v_name is not null or v_email is not null then
    insert into public.submission_contacts (submission_id, name, email, reply_ok)
    values (v_id, v_name, v_email, coalesce(p_reply_ok, false) and v_email is not null);
  end if;

  return v_receipt;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff access
-- ---------------------------------------------------------------------------

-- Reveal one submission's contact details; every call is logged.
create or replace function public.reveal_contact(p_submission_id uuid)
returns table (name text, email text, reply_ok boolean, delete_after date)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.audit_log (actor, action, target_table, target_id)
  values (auth.uid(), 'reveal_contact', 'submission_contacts', p_submission_id::text);

  return query
    select c.name, c.email, c.reply_ok, c.delete_after
      from public.submission_contacts c
     where c.submission_id = p_submission_id;
end;
$$;

create policy "staff read submissions" on public.submissions
  for select to authenticated using (public.is_staff());
create policy "staff update submissions" on public.submissions
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "admin delete submissions" on public.submissions
  for delete to authenticated using (public.is_admin());

create policy "staff read own staff row" on public.staff
  for select to authenticated using (user_id = auth.uid());

create policy "admin read audit log" on public.audit_log
  for select to authenticated using (public.is_admin());

-- No policies on submission_contacts: only reveal_contact() (definer) reads it.

grant select, delete on public.submissions to authenticated;
grant update (status, reviewer_note) on public.submissions to authenticated;
grant select on public.staff to authenticated;
grant select on public.audit_log to authenticated;

-- Functions are executable by PUBLIC by default in Postgres; lock them down.
revoke execute on function
  public.is_staff(), public.is_admin(), public.generate_receipt_no(),
  public.submit_voice(text, text, text, text[], text, text, text, text, boolean),
  public.reveal_contact(uuid)
  from public, anon, authenticated;

grant execute on function public.is_staff(), public.is_admin() to authenticated;
grant execute on function public.reveal_contact(uuid) to authenticated;
grant execute on function
  public.submit_voice(text, text, text, text[], text, text, text, text, boolean)
  to service_role;

-- ---------------------------------------------------------------------------
-- Bookkeeping triggers
-- ---------------------------------------------------------------------------

create or replace function public.submissions_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger submissions_before_update
  before update on public.submissions
  for each row execute function public.submissions_before_update();

-- Log status/note changes and shorten contact retention once a submission
-- is closed (6 months from closing, never longer than the 1-year default).
create or replace function public.submissions_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status or new.reviewer_note is distinct from old.reviewer_note then
    insert into public.audit_log (actor, action, target_table, target_id, detail)
    values (auth.uid(), 'update_submission', 'submissions', new.id::text,
            jsonb_build_object('from_status', old.status, 'to_status', new.status,
                               'note_changed', new.reviewer_note is distinct from old.reviewer_note));
  end if;

  if new.status in ('used', 'not_published', 'spam') and new.status is distinct from old.status then
    update public.submission_contacts
       set delete_after = least(delete_after, (current_date + interval '6 months')::date)
     where submission_id = new.id;
  end if;
  return null;
end;
$$;

create trigger submissions_after_update
  after update on public.submissions
  for each row execute function public.submissions_after_update();

create or replace function public.submissions_after_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor, action, target_table, target_id)
  values (auth.uid(), 'delete_submission', 'submissions', old.id::text);
  return null;
end;
$$;

create trigger submissions_after_delete
  after delete on public.submissions
  for each row execute function public.submissions_after_delete();

revoke execute on function
  public.submissions_before_update(), public.submissions_after_update(), public.submissions_after_delete()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Retention: delete expired contact details daily
-- ---------------------------------------------------------------------------

create or replace function public.purge_expired_contacts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  delete from public.submission_contacts where delete_after < current_date;
  get diagnostics v_count = row_count;
  if v_count > 0 then
    insert into public.audit_log (actor, action, target_table, detail)
    values (null, 'purge_expired_contacts', 'submission_contacts', jsonb_build_object('deleted', v_count));
  end if;
  return v_count;
end;
$$;

revoke execute on function public.purge_expired_contacts() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('purge-expired-contacts', '17 3 * * *', 'select public.purge_expired_contacts()');
