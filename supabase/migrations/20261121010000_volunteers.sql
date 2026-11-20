-- Volunteer sign-ups for さとうしょうこ後援会 (the supporters' association,
-- a registered political organisation). Kept completely separate from
-- citizen submissions: different purpose, different data, different table.
--
-- Same security model as submissions (see 20261120000000_submissions.sql):
--   * anon gets nothing; sign-ups arrive only via POST /api/volunteer, which
--     verifies Turnstile and calls register_volunteer() with service_role.
--   * staff (the operator, who represents the association) need an aal2
--     session; email and phone are not selectable and are revealed one
--     sign-up at a time through reveal_volunteer_contact(), which is logged.
--   * Retention: deleted 2 years after the last action, or on request.
--
-- `adult` (18 or over) exists only because people under 18 may not take part
-- in election campaigning (公職選挙法); it lets the association keep ordinary
-- association activities separate from any campaign-period activity.

create table public.volunteer_signups (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(btrim(name)) between 1 and 100),
  email            text not null check (char_length(email) between 3 and 254),
  phone            text check (phone ~ '^[0-9+() -]{6,20}$'),
  area             text check (char_length(area) <= 50),
  interests        text[] not null default '{}'
                   check (interests <@ array['local', 'events', 'media', 'policy']::text[]),
  frequency        text not null check (frequency in ('one_off', 'monthly', 'regular', 'undecided')),
  skills           text check (char_length(skills) <= 1000),
  message          text check (char_length(message) <= 2000),
  adult            boolean not null,
  association_info boolean not null default false,
  status           text not null default 'new'
                   check (status in ('new', 'contacted', 'active', 'paused', 'closed')),
  staff_note       text check (char_length(staff_note) <= 4000),
  privacy_version  text not null,
  ip_hash          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.volunteer_signups is
  'Volunteer sign-ups for the supporters'' association. Private. Not a membership list: association_info only records a wish to receive joining information.';

create index volunteer_signups_created_at_idx on public.volunteer_signups (created_at desc);
create index volunteer_signups_ip_created_idx on public.volunteer_signups (ip_hash, created_at);
create index volunteer_signups_email_created_idx on public.volunteer_signups (lower(email), created_at);

revoke all on table public.volunteer_signups from anon, authenticated;
alter table public.volunteer_signups enable row level security;

create policy "staff read volunteers" on public.volunteer_signups
  for select to authenticated using (public.is_staff());
create policy "staff update volunteers" on public.volunteer_signups
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "admin delete volunteers" on public.volunteer_signups
  for delete to authenticated using (public.is_admin());

-- Everything except email and phone.
grant select (id, name, area, interests, frequency, skills, message, adult, association_info,
              status, staff_note, created_at, updated_at)
  on public.volunteer_signups to authenticated;
grant update (status, staff_note) on public.volunteer_signups to authenticated;
grant delete on public.volunteer_signups to authenticated;

-- ---------------------------------------------------------------------------
-- Intake (service_role only, via /api/volunteer)
-- ---------------------------------------------------------------------------
create or replace function public.register_volunteer(
  p_name             text,
  p_email            text,
  p_frequency        text,
  p_adult            boolean,
  p_privacy_version  text,
  p_ip_hash          text,
  p_phone            text default null,
  p_area             text default null,
  p_interests        text[] default '{}',
  p_skills           text default null,
  p_message          text default null,
  p_association_info boolean default false
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
begin
  if (select count(*) from public.volunteer_signups where created_at > now() - interval '1 hour') >= 100 then
    raise exception 'busy' using errcode = 'P0001';
  end if;

  if p_ip_hash is not null and (
       (select count(*) from public.volunteer_signups
         where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 10
    or (select count(*) from public.volunteer_signups
         where ip_hash = p_ip_hash and created_at > now() - interval '1 day') >= 30) then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.volunteer_signups
              where lower(email) = v_email and created_at > now() - interval '1 day') then
    raise exception 'duplicate' using errcode = 'P0001';
  end if;

  insert into public.volunteer_signups
    (name, email, phone, area, interests, frequency, skills, message, adult, association_info,
     privacy_version, ip_hash)
  values
    (btrim(p_name), v_email, nullif(btrim(p_phone), ''), nullif(btrim(p_area), ''),
     coalesce(p_interests, '{}'), p_frequency, nullif(btrim(p_skills), ''), nullif(btrim(p_message), ''),
     p_adult, coalesce(p_association_info, false), p_privacy_version, p_ip_hash);
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff: reveal email/phone for one sign-up (logged)
-- ---------------------------------------------------------------------------
create or replace function public.reveal_volunteer_contact(p_id uuid)
returns table (email text, phone text)
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
  values (auth.uid(), 'reveal_volunteer_contact', 'volunteer_signups', p_id::text);
  return query select v.email, v.phone from public.volunteer_signups v where v.id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bookkeeping
-- ---------------------------------------------------------------------------
create or replace function public.volunteer_signups_before_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger volunteer_signups_before_update
  before update on public.volunteer_signups
  for each row execute function public.volunteer_signups_before_update();

create or replace function public.volunteer_signups_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_log (actor, action, target_table, target_id)
    values (auth.uid(), 'delete_volunteer', 'volunteer_signups', old.id::text);
  elsif new.status is distinct from old.status or new.staff_note is distinct from old.staff_note then
    insert into public.audit_log (actor, action, target_table, target_id, detail)
    values (auth.uid(), 'update_volunteer', 'volunteer_signups', new.id::text,
            jsonb_build_object('from_status', old.status, 'to_status', new.status,
                               'note_changed', new.staff_note is distinct from old.staff_note));
  end if;
  return null;
end;
$$;
create trigger volunteer_signups_audit
  after update or delete on public.volunteer_signups
  for each row execute function public.volunteer_signups_audit();

create or replace function public.purge_old_volunteers()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  delete from public.volunteer_signups where updated_at < now() - interval '2 years';
  get diagnostics v_count = row_count;
  if v_count > 0 then
    insert into public.audit_log (actor, action, target_table, detail)
    values (null, 'purge_old_volunteers', 'volunteer_signups', jsonb_build_object('deleted', v_count));
  end if;
  return v_count;
end;
$$;

revoke execute on function
  public.register_volunteer(text, text, text, boolean, text, text, text, text, text[], text, text, boolean),
  public.reveal_volunteer_contact(uuid),
  public.volunteer_signups_before_update(),
  public.volunteer_signups_audit(),
  public.purge_old_volunteers()
  from public, anon, authenticated;

grant execute on function public.reveal_volunteer_contact(uuid) to authenticated;
grant execute on function
  public.register_volunteer(text, text, text, boolean, text, text, text, text, text[], text, text, boolean)
  to service_role;

select cron.schedule('purge-old-volunteers', '37 3 * * *', 'select public.purge_old_volunteers()');
