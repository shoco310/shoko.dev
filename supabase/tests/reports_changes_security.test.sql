-- Activity reports and policy changes: admin-only edits, published-only
-- public reads, and an append-only policy history.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000f1', 'pgtap-rc-admin@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000f2', 'pgtap-rc-reviewer@example.test', 'authenticated', 'authenticated');
insert into public.staff (user_id, role, display_name) values
  ('00000000-0000-0000-0000-0000000000f1', 'admin', 'Admin'),
  ('00000000-0000-0000-0000-0000000000f2', 'reviewer', 'Reviewer');

-- Migration
select is((select count(*)::int from public.activity_reports where visibility = 'published'
           and slug in ('2026-06-06-note-return-to-ube', '2026-04-18-genai-event', '2026-01-31-conference-childcare',
                        '2026-05-05-omikoshi', '2026-01-31-forbes-women-in-tech', '2025-10-16-engineer-community-talk')), 6,
  'all six activities from activity.ts were migrated');
select is((select count(*)::int from public.policy_changes where visibility = 'published'
           and slug in ('2026-06-17-first-publish', '2026-09-26-detail-pages', '2026-09-27-research-data')), 3,
  'the three real policy changes were migrated');
select is((select jsonb_array_length(diffs) from public.policy_changes where slug = '2026-09-27-research-data'), 3,
  'before/after wording migrated');
select is((select count(*)::int from public.events e join public.activity_reports r on r.id = e.report_id), 2,
  'migrated events point at their reports');

-- anon
set local role anon;
select ok((select count(*) from public.activity_reports) >= 6, 'published reports are public');
select ok((select count(*) from public.policy_changes) >= 3, 'published changes are public');
select throws_ok($$insert into public.policy_changes (slug, change_date, policy_slugs, summary) values ('2026-12-01-x', '2026-12-01', '{work}', 'x')$$,
  '42501', null, 'anon cannot add changes');
select throws_ok($$insert into public.activity_reports (slug, title, report_date, summary) values ('2026-12-01-x', 'x', '2026-12-01', 'x')$$,
  '42501', null, 'anon cannot add reports');
select throws_ok('select created_by from public.activity_reports', '42501', null, 'editor ids are not public');
reset role;

-- reviewer cannot edit
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select throws_ok($$insert into public.policy_changes (slug, change_date, policy_slugs, summary) values ('2026-12-02-rev', '2026-12-02', '{work}', 'x')$$,
  '42501', null, 'reviewer cannot add policy changes');
select throws_ok($$insert into public.activity_reports (slug, title, report_date, summary) values ('2026-12-02-rev', 'x', '2026-12-02', 'x')$$,
  '42501', null, 'reviewer cannot add reports');
reset role;

-- admin: drafts are editable and deletable
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
insert into public.policy_changes (slug, change_date, policy_slugs, summary, reason)
values ('2026-12-03-pgtap-change', '2026-12-03', '{childcare}', '病児保育の取り組みを追加', '市民の声を受けて');
select throws_ok($$insert into public.policy_changes (slug, change_date, policy_slugs, summary) values ('2026-12-04-bad', '2026-12-04', '{unknown}', 'x')$$,
  '23514', null, 'only the four policies can be targeted');
update public.policy_changes set reason = '市民の声と公開データを受けて' where slug = '2026-12-03-pgtap-change';
select is((select reason from public.policy_changes where slug = '2026-12-03-pgtap-change'), '市民の声と公開データを受けて',
  'a draft can be edited');
update public.policy_changes set visibility = 'published' where slug = '2026-12-03-pgtap-change';
select isnt((select published_at from public.policy_changes where slug = '2026-12-03-pgtap-change'), null, 'publishing sets published_at');

-- append-only once published
select throws_ok($$update public.policy_changes set summary = '書き換え' where slug = '2026-12-03-pgtap-change'$$,
  '42501', 'published_changes_are_permanent', 'a published change cannot be edited');
select throws_ok($$update public.policy_changes set visibility = 'draft' where slug = '2026-12-03-pgtap-change'$$,
  '42501', 'published_changes_are_permanent', 'a published change cannot go back to draft');
delete from public.policy_changes where slug = '2026-12-03-pgtap-change';
select is((select count(*)::int from public.policy_changes where slug = '2026-12-03-pgtap-change'), 1, 'a published change cannot be deleted');
select throws_ok($$update public.policy_changes set summary = 'x' where slug = '2026-09-27-research-data'$$,
  '42501', 'published_changes_are_permanent', 'migrated history is protected too');

-- correction = new row pointing at the original
insert into public.policy_changes (slug, change_date, policy_slugs, summary, corrects, visibility)
values ('2026-12-05-pgtap-correction', '2026-12-05', '{childcare}', '前回の記録の日付を訂正',
        (select id from public.policy_changes where slug = '2026-12-03-pgtap-change'), 'published');
select ok(exists (select 1 from public.policy_changes where slug = '2026-12-05-pgtap-correction' and corrects is not null),
  'a correction is a new record linked to the original');

-- emergency withdrawal hides it but keeps it
update public.policy_changes set visibility = 'withdrawn' where slug = '2026-12-03-pgtap-change';
select throws_ok($$update public.policy_changes set visibility = 'published' where slug = '2026-12-03-pgtap-change'$$,
  '42501', 'published_changes_are_permanent', 'a withdrawn change stays withdrawn');
reset role;
select isnt((select withdrawn_at from public.policy_changes where slug = '2026-12-03-pgtap-change'), null, 'withdrawal time recorded');
set local role anon;
select is((select count(*)::int from public.policy_changes where slug = '2026-12-03-pgtap-change'), 0, 'withdrawn change is hidden from the public');
reset role;
select ok(exists (select 1 from public.audit_log where action = 'withdrawn_policy_change'
                  and detail -> 'before' ->> 'summary' = '病児保育の取り組みを追加'), 'withdrawal is logged with the record');

select * from finish();
rollback;
