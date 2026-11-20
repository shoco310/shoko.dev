-- Security tests for volunteer sign-ups (npx supabase test db).
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-0000000000c1', 'pgtap-vol-operator@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c2', 'pgtap-vol-stranger@example.test', 'authenticated', 'authenticated');
insert into public.staff (user_id, role, display_name)
values ('00000000-0000-0000-0000-0000000000c1', 'admin', 'Operator');

-- A sign-up created the way /api/volunteer does it.
set local role service_role;
select lives_ok($$select public.register_volunteer(
  '山田 花子', 'Hanako@Example.test', 'monthly', true, '2026-11-21', 'pgtap-vol-hash',
  '090-1234-5678', '東岐波', '{events,media}', '写真撮影', 'よろしくお願いします', true)$$,
  'register_volunteer accepts a valid sign-up');
reset role;

create temp table v (id uuid) on commit drop;
grant all on v to authenticated;
insert into v select id from public.volunteer_signups where email = 'hanako@example.test';

select is((select count(*)::int from v), 1, 'stored once, email normalised to lower case');
select is((select association_info from public.volunteer_signups where id = (select id from v)), true,
  'wish for joining information is recorded as a separate flag');
select is((select interests from public.volunteer_signups where id = (select id from v)), '{events,media}'::text[],
  'interests stored');

-- Structure / privileges
select ok(not has_table_privilege('anon', 'public.volunteer_signups', 'select'), 'anon has no SELECT');
select ok(not has_table_privilege('anon', 'public.volunteer_signups', 'insert'), 'anon has no INSERT');
select ok(not has_table_privilege('authenticated', 'public.volunteer_signups', 'insert'), 'authenticated has no INSERT');
select ok(not has_column_privilege('authenticated', 'public.volunteer_signups', 'email', 'select'),
  'staff cannot select email directly');
select ok(not has_column_privilege('authenticated', 'public.volunteer_signups', 'phone', 'select'),
  'staff cannot select phone directly');
select ok(not has_column_privilege('authenticated', 'public.volunteer_signups', 'name', 'update'),
  'staff cannot rewrite what the volunteer entered');
select ok(not has_function_privilege('anon',
  'public.register_volunteer(text, text, text, boolean, text, text, text, text, text[], text, text, boolean)', 'execute'),
  'anon cannot call register_volunteer directly');
select ok(not has_function_privilege('anon', 'public.reveal_volunteer_contact(uuid)', 'execute'),
  'anon cannot reveal contacts');
select ok(not has_table_privilege('anon', 'public.submissions', 'select'),
  'citizen submissions remain closed to anon');

set local role anon;
select throws_ok('select * from public.volunteer_signups', '42501', null, 'anon: reading volunteers is denied');
reset role;

-- Signed-in non-staff
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select is((select count(*)::int from public.volunteer_signups), 0, 'non-staff sees no volunteers');
select throws_ok($$select * from public.reveal_volunteer_contact((select id from v))$$, '42501', null,
  'non-staff cannot reveal volunteer contacts');
reset role;

-- Staff without MFA
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal1"}', true);
set local role authenticated;
select is((select count(*)::int from public.volunteer_signups), 0, 'staff without MFA sees nothing');
reset role;

-- Staff with MFA
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select is((select name from public.volunteer_signups where id = (select id from v)), '山田 花子', 'staff sees the sign-up');
select is((select phone from public.reveal_volunteer_contact((select id from v))), '090-1234-5678',
  'staff can reveal the phone number');
update public.volunteer_signups set status = 'contacted', staff_note = '12月の意見交換会を案内' where id = (select id from v);
reset role;
select is((select count(*)::int from public.audit_log
           where action = 'reveal_volunteer_contact' and target_id = (select id::text from v)), 1, 'reveal is logged');
select is((select count(*)::int from public.audit_log
           where action = 'update_volunteer' and target_id = (select id::text from v)), 1, 'status change is logged');

-- Abuse limits
set local role service_role;
select throws_ok($$select public.register_volunteer('山田 花子', 'hanako@example.test', 'monthly', true, '2026-11-21', 'pgtap-vol-other')$$,
  'P0001', 'duplicate', 'the same email within 24 hours is a duplicate');
reset role;

-- Retention: 2 years after the last action
insert into public.volunteer_signups (name, email, frequency, adult, privacy_version, updated_at)
values ('古い登録', 'old@example.test', 'undecided', true, '2026-11-21', now() - interval '2 years 1 day');
select ok(public.purge_old_volunteers() >= 1, 'purge_old_volunteers deletes something');
select is((select count(*)::int from public.volunteer_signups where email = 'old@example.test'), 0,
  'sign-ups untouched for over 2 years are deleted');

select * from finish();
rollback;
