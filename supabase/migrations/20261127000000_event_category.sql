-- Category for scheduled activities (活動予定), same values as activity
-- reports, so a radio appearance shows as メディア出演 rather than イベント.
-- Additive only: a nullable column; existing events stay uncategorised
-- and the site treats them as イベント.
alter table public.events
  add column category text
  check (category in ('event', 'community', 'political', 'media', 'other'));

comment on column public.events.category is
  'Same values as activity_reports.category. Null = shown as イベント.';

grant select (category) on public.events to anon;
grant insert (category), update (category) on public.events to authenticated;
