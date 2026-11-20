-- Activity report categories for the 「これまでの活動」 filter.
-- Additive only: a nullable column, no existing row is changed. Reports
-- without a category still show under 「すべて」.
alter table public.activity_reports
  add column category text
  check (category in ('event', 'community', 'volunteer', 'media', 'other'));

comment on column public.activity_reports.category is
  'Public filter category: event=イベント, community=地域活動, volunteer=ボランティア, media=メディア出演, other=その他. Null = uncategorised (shown under すべて only).';

-- Same access pattern as the other report columns: anyone reads it on
-- published rows (RLS), only admins write it (RLS + column grants).
grant select (category) on public.activity_reports to anon;
grant insert (category), update (category) on public.activity_reports to authenticated;
