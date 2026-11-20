-- Rename the report category 'volunteer' (shown as ボランティア) to
-- 'political' (政治活動). Reports already set to 'volunteer' are moved to
-- 'political'; nothing else changes.
alter table public.activity_reports drop constraint activity_reports_category_check;

update public.activity_reports set category = 'political' where category = 'volunteer';

alter table public.activity_reports
  add constraint activity_reports_category_check
  check (category in ('event', 'community', 'political', 'media', 'other'));

comment on column public.activity_reports.category is
  'Public filter category: event=イベント, community=地域活動, political=政治活動, media=メディア出演, other=その他. Null = uncategorised (shown under すべて only).';
