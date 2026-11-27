-- Event categories: public read, admin-only write, same values as reports.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000d1', 'pgtap-evcat-admin@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d2', 'pgtap-evcat-reviewer@example.test', 'authenticated', 'authenticated');
insert into public.staff (user_id, role, display_name) values
  ('00000000-0000-0000-0000-0000000000d1', 'admin', 'Admin'),
  ('00000000-0000-0000-0000-0000000000d2', 'reviewer', 'Reviewer');

set local role anon;
select lives_ok('select category from public.events', 'anon can read the category');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
insert into public.events (slug, title, event_date, description, category)
values ('2026-12-01-pgtap-radio', 'ラジオ出演', '2026-12-01', 'x', 'media');
select is((select category from public.events where slug = '2026-12-01-pgtap-radio'), 'media', 'an admin can set a category');
select throws_ok($$update public.events set category = 'volunteer' where slug = '2026-12-01-pgtap-radio'$$,
  '23514', null, 'only the report categories are allowed');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
update public.events set category = 'other' where slug = '2026-12-01-pgtap-radio';
reset role;
select is((select category from public.events where slug = '2026-12-01-pgtap-radio'), 'media', 'a reviewer cannot change it');

select ok(exists (select 1 from public.audit_log where target_table = 'events' and detail -> 'after' ->> 'category' = 'media'),
  'the change is in the audit log');

select * from finish();
rollback;
