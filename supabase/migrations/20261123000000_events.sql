-- Events (活動予定) managed from the review screen instead of src/data/events.ts.
--
--   * Only an admin (the operator) can create, edit, publish or delete.
--   * The public (anon) reads published rows only. Events are public
--     information by design: the form tells staff not to enter personal data.
--   * Upcoming vs ended stays automatic (computed from date/time in Japan
--     time on the page); status_override is only for 中止 / 延期 / 手動の終了.
--   * Published events cannot be deleted directly: unpublish first.
--   * Every change is written to audit_log with the row before and after,
--     so nothing is lost even when a field is overwritten. Published data is
--     also exported to the repository daily (content/events.json).

create table public.events (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^\d{4}-\d{2}-\d{2}-[a-z0-9-]{1,60}$'),
  title              text not null check (char_length(btrim(title)) between 1 and 100),
  event_date         date not null,
  start_time         time,
  end_time           time,
  place              text check (char_length(place) <= 200),
  place_url          text check (place_url ~ '^https://' and char_length(place_url) <= 500),
  description        text not null check (char_length(btrim(description)) between 1 and 2000),
  audience           text check (char_length(audience) <= 200),
  how_to_join        text check (char_length(how_to_join) <= 500),
  apply_url          text check (apply_url ~ '^https://' and char_length(apply_url) <= 500),
  status_override    text check (status_override in ('cancelled', 'postponed', 'ended')),
  report_activity_id text check (char_length(report_activity_id) <= 40),
  report_url         text check (report_url ~ '^https://' and char_length(report_url) <= 500),
  visibility         text not null default 'draft' check (visibility in ('draft', 'published')),
  published_at       timestamptz,
  created_by         uuid default auth.uid(),
  updated_by         uuid default auth.uid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (end_time is null or start_time is not null),
  check (end_time is null or end_time > start_time)
);
comment on table public.events is 'Public activity schedule. No personal data. Edited by admins only; anon reads published rows.';

create index events_visibility_date_idx on public.events (visibility, event_date desc);

revoke all on table public.events from anon, authenticated;
alter table public.events enable row level security;

create policy "public reads published events" on public.events
  for select to anon, authenticated using (visibility = 'published');
create policy "admin reads all events" on public.events
  for select to authenticated using (public.is_admin());
create policy "admin inserts events" on public.events
  for insert to authenticated with check (public.is_admin());
create policy "admin updates events" on public.events
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes draft events" on public.events
  for delete to authenticated using (public.is_admin() and visibility = 'draft');

grant select (id, slug, title, event_date, start_time, end_time, place, place_url, description, audience,
              how_to_join, apply_url, status_override, report_activity_id, report_url, visibility,
              published_at, updated_at)
  on public.events to anon;
grant select on public.events to authenticated;
grant insert (slug, title, event_date, start_time, end_time, place, place_url, description, audience,
              how_to_join, apply_url, status_override, report_activity_id, report_url, visibility)
  on public.events to authenticated;
grant update (slug, title, event_date, start_time, end_time, place, place_url, description, audience,
              how_to_join, apply_url, status_override, report_activity_id, report_url, visibility)
  on public.events to authenticated;
grant delete on public.events to authenticated;

-- Bookkeeping: timestamps, editor, first-publication time.
create or replace function public.events_before_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if new.visibility = 'published' and (tg_op = 'INSERT' or old.visibility <> 'published') then
    new.published_at := coalesce(new.published_at, now());
  end if;
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
create trigger events_before_write before insert or update on public.events
  for each row execute function public.events_before_write();

-- Full history in audit_log (row before and after).
create or replace function public.events_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor, action, target_table, target_id, detail)
  values (
    auth.uid(),
    case
      when tg_op = 'INSERT' then 'create_event'
      when tg_op = 'DELETE' then 'delete_event'
      when old.visibility <> new.visibility and new.visibility = 'published' then 'publish_event'
      when old.visibility <> new.visibility then 'unpublish_event'
      else 'update_event'
    end,
    'events',
    coalesce(new.id, old.id)::text,
    jsonb_build_object(
      'before', case when tg_op = 'INSERT' then null else to_jsonb(old) end,
      'after',  case when tg_op = 'DELETE' then null else to_jsonb(new) end
    )
  );
  return null;
end;
$$;
create trigger events_audit after insert or update or delete on public.events
  for each row execute function public.events_audit();

revoke execute on function public.events_before_write(), public.events_audit() from public, anon, authenticated;

-- Move the two real past events that were in src/data/events.ts.
insert into public.events (slug, title, event_date, description, report_activity_id, visibility)
values
  ('2026-04-18-genai-event', '生成AIを「基礎 → 実践」まで体験するイベント', '2026-04-18',
   '講演とワークショップの形式で、生成AIを基礎から実践まで体験していただきました。', '2', 'published'),
  ('2025-10-16-engineer-community-talk', '「エンジニア×地域コミュニティ〜宇部のこれから〜」に登壇', '2025-10-16',
   'エンジニアの視点から、地域コミュニティと宇部のこれからについてお話ししました。', '6', 'published');
