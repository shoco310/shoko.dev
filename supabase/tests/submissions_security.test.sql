-- Security tests for the private submission intake. Run with:
--   npx supabase test db
-- Every test runs inside a transaction that is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

-- ---------------------------------------------------------------------------
-- Fixtures: one staff member (operator), one signed-in non-staff user
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-0000000000a1', 'pgtap-operator@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b2', 'pgtap-stranger@example.test', 'authenticated', 'authenticated');
insert into public.staff (user_id, role, display_name)
values ('00000000-0000-0000-0000-0000000000a1', 'admin', 'Operator');

-- A submission with contact details, created the way /api/submit does it.
-- Tests must pass on a database that already holds other rows, so every
-- check below targets this test's own submission.
create temp table t (receipt text, sid uuid) on commit drop;
grant all on t to service_role, authenticated, anon;
set local role service_role;
insert into t (receipt)
  select public.submit_voice('バス停が遠くて通院が大変です', '2026-11-20', 'pgtap-hash', '{交通}', '東岐波', '40s',
                             '山田', 'Taro@Example.test', true);
reset role;
update t set sid = (select id from public.submissions s where s.receipt_no = t.receipt);

select ok((select receipt from t) ~ '^UB-[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}$',
  'submit_voice returns a receipt number like UB-XXXX-XXXX');
select isnt((select sid from t), null, 'submission stored');
select is((select has_contact from public.submissions where id = (select sid from t)), true, 'has_contact flag set');
select is((select email from public.submission_contacts where submission_id = (select sid from t)), 'taro@example.test',
  'email normalized to lower case');
select is((select theme_hints from public.submissions where id = (select sid from t)), '{交通}'::text[], 'theme hints stored');

-- ---------------------------------------------------------------------------
-- Structural guarantees
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'every table in public has RLS enabled'
);
select ok(not has_table_privilege('anon', 'public.submissions', 'select'), 'anon has no SELECT on submissions');
select ok(not has_table_privilege('anon', 'public.submission_contacts', 'select'), 'anon has no SELECT on contacts');
select ok(not has_table_privilege('authenticated', 'public.submission_contacts', 'select'), 'authenticated has no SELECT on contacts');
select ok(not has_table_privilege('anon', 'public.submissions', 'insert'), 'anon cannot INSERT submissions');
select ok(not has_table_privilege('authenticated', 'public.submissions', 'insert'), 'authenticated cannot INSERT submissions');
select ok(not has_column_privilege('authenticated', 'public.submissions', 'body', 'update'), 'staff cannot edit the citizen''s text');
select ok(has_column_privilege('authenticated', 'public.submissions', 'status', 'update'), 'staff can update status');
select ok(not has_function_privilege('anon',
  'public.submit_voice(text, text, text, text[], text, text, text, text, boolean)', 'execute'),
  'anon cannot call submit_voice directly (must go through /api/submit)');
select ok(not has_function_privilege('authenticated',
  'public.submit_voice(text, text, text, text[], text, text, text, text, boolean)', 'execute'),
  'authenticated cannot call submit_voice');
select ok(not has_function_privilege('anon', 'public.reveal_contact(uuid)', 'execute'), 'anon cannot call reveal_contact');

-- ---------------------------------------------------------------------------
-- anon (the public website)
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from public.submissions', '42501', null, 'anon: reading submissions is denied');
select throws_ok('select * from public.submission_contacts', '42501', null, 'anon: reading contacts is denied');
select throws_ok('select * from public.audit_log', '42501', null, 'anon: reading audit log is denied');
reset role;

-- ---------------------------------------------------------------------------
-- Signed-in user who is not staff
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select is((select count(*)::int from public.submissions), 0, 'non-staff sees no submissions');
select throws_ok(
  $$select * from public.reveal_contact((select sid from t))$$,
  '42501', null, 'non-staff cannot reveal contacts');
reset role;

-- ---------------------------------------------------------------------------
-- Staff without MFA (aal1)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
set local role authenticated;
select is((select count(*)::int from public.submissions), 0, 'staff without MFA sees nothing');
reset role;

-- ---------------------------------------------------------------------------
-- Staff with MFA (aal2)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select ok(exists (select 1 from public.submissions where id = (select sid from t)), 'staff with MFA sees submissions');
select is(
  (select email from public.reveal_contact((select sid from t))),
  'taro@example.test', 'staff can reveal a contact');
select throws_ok(
  $$update public.submissions set body = 'changed' where id = (select sid from t)$$, '42501', null,
  'staff cannot rewrite the submission text');
update public.submissions set status = 'used', reviewer_note = '交通の課題として整理' where id = (select sid from t);
reset role;

select is((select count(*)::int from public.audit_log where action = 'reveal_contact' and target_id = (select sid::text from t)), 1,
  'contact reveal was logged');
select is((select count(*)::int from public.audit_log where action = 'update_submission' and target_id = (select sid::text from t)), 1,
  'status change was logged');
select ok(
  (select delete_after from public.submission_contacts where submission_id = (select sid from t)) <= (current_date + interval '6 months')::date,
  'closing a submission shortens contact retention to 6 months');

-- ---------------------------------------------------------------------------
-- Rate limiting (fair limits: 20/hour and 50/day per sender, duplicates,
-- 200/hour site-wide)
-- ---------------------------------------------------------------------------
set local role service_role;
select lives_ok($$select public.submit_voice('2件目', '2026-11-20', 'pgtap-hash')$$,
  'a 2nd submission within an hour is accepted (shared networks are not blocked early)');
select throws_ok($$select public.submit_voice('2件目', '2026-11-20', 'pgtap-hash')$$, 'P0001', 'duplicate',
  'the same text from the same sender within 24 hours is rejected as a duplicate');
select lives_ok($$select public.submit_voice('2件目', '2026-11-20', 'pgtap-other-sender')$$,
  'the same text from a different sender is accepted');
reset role;

-- Fill up to the hourly per-sender limit (20) for one sender.
insert into public.submissions (receipt_no, body, privacy_version, ip_hash)
select 'UB-RATE-' || lpad(g::text, 4, '0'), 'rate ' || g, '2026-11-20', 'pgtap-busy-sender'
from generate_series(1, 20) g;
set local role service_role;
select throws_ok($$select public.submit_voice('21件目', '2026-11-20', 'pgtap-busy-sender')$$, 'P0001', 'rate_limited',
  'the 21st submission from one sender within an hour is rejected');
reset role;

-- Daily limit (50): spread earlier submissions over the day.
insert into public.submissions (receipt_no, body, privacy_version, ip_hash, created_at)
select 'UB-DAY0-' || lpad(g::text, 4, '0'), 'day ' || g, '2026-11-20', 'pgtap-day-sender', now() - interval '3 hours'
from generate_series(1, 50) g;
set local role service_role;
select throws_ok($$select public.submit_voice('51件目', '2026-11-20', 'pgtap-day-sender')$$, 'P0001', 'rate_limited',
  'the 51st submission from one sender within a day is rejected');
reset role;

-- Site-wide hourly cap (200).
insert into public.submissions (receipt_no, body, privacy_version, ip_hash)
select 'UB-SITE-' || lpad(g::text, 4, '0'), 'site ' || g, '2026-11-20', 'pgtap-flood-' || g
from generate_series(1, 200) g;
set local role service_role;
select throws_ok($$select public.submit_voice('新しい送信者', '2026-11-20', 'pgtap-new-sender')$$, 'P0001', 'busy',
  'when 200 submissions arrived in the last hour, new ones are refused as busy');
reset role;

-- ---------------------------------------------------------------------------
-- Retention: submission text is removed 5 years after the last action
-- ---------------------------------------------------------------------------
insert into public.submissions (receipt_no, body, privacy_version, created_at, updated_at)
values ('UB-OLD0-0001', '古い投稿', '2026-11-20', now() - interval '6 years', now() - interval '5 years 1 day'),
       ('UB-NEW0-0001', '最近の投稿', '2026-11-20', now() - interval '6 years', now() - interval '4 years');
select ok(public.purge_old_submissions() >= 1, 'purge_old_submissions deletes something');
select is((select count(*)::int from public.submissions where receipt_no = 'UB-OLD0-0001'), 0,
  'a submission untouched for over 5 years is deleted');
select is((select count(*)::int from public.submissions where receipt_no = 'UB-NEW0-0001'), 1,
  'a submission acted on within 5 years is kept');

select * from finish();
rollback;
