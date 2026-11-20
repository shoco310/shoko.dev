-- Events: public reads published only; only an admin edits; history kept.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000e1', 'pgtap-ev-admin@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000e2', 'pgtap-ev-reviewer@example.test', 'authenticated', 'authenticated');
insert into public.staff (user_id, role, display_name) values
  ('00000000-0000-0000-0000-0000000000e1', 'admin', 'Admin'),
  ('00000000-0000-0000-0000-0000000000e2', 'reviewer', 'Reviewer');

select is((select count(*)::int from public.events where slug in ('2026-04-18-genai-event', '2025-10-16-engineer-community-talk')), 2,
  'the two events from events.ts were migrated');

-- Admin creates a draft.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
insert into public.events (slug, title, event_date, start_time, end_time, description)
values ('2026-12-05-pgtap-draft', '下書きの予定', '2026-12-05', '14:00', '15:30', 'テスト');
select throws_ok($$insert into public.events (slug, title, event_date, start_time, end_time, description)
  values ('2026-12-06-pgtap-bad', '時刻が逆', '2026-12-06', '15:00', '14:00', 'x')$$, '23514', null, 'end time must be after start time');
select throws_ok($$insert into public.events (slug, title, event_date, description, apply_url)
  values ('2026-12-07-pgtap-http', 'http', '2026-12-07', 'x', 'http://example.com')$$, '23514', null, 'links must be https');
reset role;

set local role anon;
select is((select count(*)::int from public.events where slug = '2026-12-05-pgtap-draft'), 0, 'drafts are not public');
select ok((select count(*) from public.events) >= 2, 'published events are public');
select throws_ok('select created_by from public.events', '42501', null, 'editor ids are not public');
select throws_ok($$insert into public.events (slug, title, event_date, description) values ('2026-12-08-x', 'x', '2026-12-08', 'x')$$,
  '42501', null, 'anon cannot insert');
select throws_ok($$update public.events set title = 'x'$$, '42501', null, 'anon cannot update');
reset role;

-- A reviewer (staff but not admin) cannot touch events.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e2","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select throws_ok($$insert into public.events (slug, title, event_date, description) values ('2026-12-09-rev', 'x', '2026-12-09', 'x')$$,
  '42501', null, 'reviewer cannot create events');
update public.events set title = '書き換え' where slug = '2026-12-05-pgtap-draft';
reset role;
select is((select title from public.events where slug = '2026-12-05-pgtap-draft'), '下書きの予定', 'reviewer cannot edit events');

-- Admin without MFA cannot edit.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated","aal":"aal1"}', true);
set local role authenticated;
select throws_ok($$insert into public.events (slug, title, event_date, description) values ('2026-12-10-aal1', 'x', '2026-12-10', 'x')$$,
  '42501', null, 'admin without MFA cannot create events');
reset role;

-- Admin publishes; published rows cannot be deleted directly.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
update public.events set visibility = 'published' where slug = '2026-12-05-pgtap-draft';
delete from public.events where slug = '2026-12-05-pgtap-draft';
reset role;
select is((select count(*)::int from public.events where slug = '2026-12-05-pgtap-draft'), 1, 'a published event cannot be deleted');
select isnt((select published_at from public.events where slug = '2026-12-05-pgtap-draft'), null, 'published_at is set');
set local role anon;
select is((select count(*)::int from public.events where slug = '2026-12-05-pgtap-draft'), 1, 'published event is public');
reset role;

set local role authenticated;
update public.events set visibility = 'draft' where slug = '2026-12-05-pgtap-draft';
delete from public.events where slug = '2026-12-05-pgtap-draft';
reset role;
select is((select count(*)::int from public.events where slug = '2026-12-05-pgtap-draft'), 0, 'after unpublishing it can be deleted');

select ok(exists (select 1 from public.audit_log where action = 'publish_event' and detail -> 'after' ->> 'slug' = '2026-12-05-pgtap-draft'),
  'publishing is logged with the row');
select ok(exists (select 1 from public.audit_log where action = 'delete_event' and detail -> 'before' ->> 'title' = '下書きの予定'),
  'deletion keeps the deleted row in the log');

select * from finish();
rollback;
