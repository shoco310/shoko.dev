-- Report categories: public read, admin-only write, fixed set of values,
-- existing reports untouched.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000c1', 'pgtap-cat-admin@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c2', 'pgtap-cat-reviewer@example.test', 'authenticated', 'authenticated');
insert into public.staff (user_id, role, display_name) values
  ('00000000-0000-0000-0000-0000000000c1', 'admin', 'Admin'),
  ('00000000-0000-0000-0000-0000000000c2', 'reviewer', 'Reviewer');

select is((select count(*)::int from public.activity_reports where category is not null), 0,
  'existing reports start uncategorised');

set local role anon;
select lives_ok('select category from public.activity_reports', 'anon can read the category');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
update public.activity_reports set category = 'media' where slug = '2026-01-31-forbes-women-in-tech';
reset role;
select is((select category from public.activity_reports where slug = '2026-01-31-forbes-women-in-tech'), null,
  'a reviewer cannot set a category');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
update public.activity_reports set category = 'media' where slug = '2026-01-31-forbes-women-in-tech';
select is((select category from public.activity_reports where slug = '2026-01-31-forbes-women-in-tech'), 'media',
  'an admin can set a category');
select throws_ok($$update public.activity_reports set category = 'campaign' where slug = '2026-01-31-forbes-women-in-tech'$$,
  '23514', null, 'only the five categories are allowed');
select throws_ok($$update public.activity_reports set category = 'volunteer' where slug = '2026-01-31-forbes-women-in-tech'$$,
  '23514', null, 'the old volunteer value is no longer accepted');
update public.activity_reports set category = 'political' where slug = '2026-01-31-forbes-women-in-tech';
select is((select category from public.activity_reports where slug = '2026-01-31-forbes-women-in-tech'), 'political',
  'political (政治活動) is a category');
update public.activity_reports set category = null where slug = '2026-01-31-forbes-women-in-tech';
select is((select category from public.activity_reports where slug = '2026-01-31-forbes-women-in-tech'), null,
  'a category can be cleared again');
reset role;

select * from finish();
rollback;
