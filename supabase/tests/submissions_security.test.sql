-- Security tests for the private submission intake. Run with:
--   npx supabase test db
-- Every test runs inside a transaction that is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- ---------------------------------------------------------------------------
-- Fixtures: one staff member (operator), one signed-in non-staff user
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-0000000000a1', 'operator@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b2', 'stranger@example.test', 'authenticated', 'authenticated');
insert into public.staff (user_id, role, display_name)
values ('00000000-0000-0000-0000-0000000000a1', 'admin', 'Operator');

-- A submission with contact details, created the way /api/submit does it.
set local role service_role;
select ok(
  public.submit_voice('バス停が遠くて通院が大変です', '2026-11-20', 'hash-a', '{交通}', '東岐波', '40s',
                      '山田', 'Taro@Example.test', true) ~ '^UB-[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}$',
  'submit_voice returns a receipt number like UB-XXXX-XXXX'
);
reset role;

select is((select count(*)::int from public.submissions), 1, 'one submission stored');
select is((select has_contact from public.submissions limit 1), true, 'has_contact flag set');
select is((select email from public.submission_contacts limit 1), 'taro@example.test', 'email normalized to lower case');
select is((select theme_hints from public.submissions limit 1), '{交通}'::text[], 'theme hints stored');

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
  $$select * from public.reveal_contact((select id from public.submissions limit 1))$$,
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
select is((select count(*)::int from public.submissions), 1, 'staff with MFA sees submissions');
select is(
  (select email from public.reveal_contact((select id from public.submissions limit 1))),
  'taro@example.test', 'staff can reveal a contact');
select throws_ok(
  $$update public.submissions set body = 'changed'$$, '42501', null, 'staff cannot rewrite the submission text');
update public.submissions set status = 'used', reviewer_note = '交通の課題として整理';
reset role;

select is((select count(*)::int from public.audit_log where action = 'reveal_contact'), 1, 'contact reveal was logged');
select is((select count(*)::int from public.audit_log where action = 'update_submission'), 1, 'status change was logged');
select ok(
  (select delete_after from public.submission_contacts limit 1) <= (current_date + interval '6 months')::date,
  'closing a submission shortens contact retention to 6 months');

-- ---------------------------------------------------------------------------
-- Rate limiting and validation
-- ---------------------------------------------------------------------------
set local role service_role;
select lives_ok($$select public.submit_voice('2件目', '2026-11-20', 'hash-a')$$, '2nd submission within an hour is accepted');
select lives_ok($$select public.submit_voice('3件目', '2026-11-20', 'hash-a')$$, '3rd submission within an hour is accepted');
select throws_ok($$select public.submit_voice('4件目', '2026-11-20', 'hash-a')$$, 'P0001', 'rate_limited',
  '4th submission from the same sender within an hour is rejected');
reset role;

select * from finish();
rollback;
