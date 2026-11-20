-- Public issues: nothing is public without the admin's approval.
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000d1', 'pgtap-issue-admin@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d2', 'pgtap-issue-reviewer@example.test', 'authenticated', 'authenticated');
insert into public.staff (user_id, role, display_name) values
  ('00000000-0000-0000-0000-0000000000d1', 'admin', 'Admin'),
  ('00000000-0000-0000-0000-0000000000d2', 'reviewer', 'Reviewer');

create temp table ctx (issue_id integer, receipt text, update_id integer) on commit drop;
grant all on ctx to anon, authenticated, service_role;
insert into ctx default values;

set local role service_role;
update ctx set receipt = public.submit_voice('通学路の街灯が少なく、夜が暗くて不安です', '2026-11-20', 'pgtap-issue-hash');
reset role;

-- Reviewer (staff, aal2, not admin) drafts an issue from the submission.
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
insert into public.public_issues (title, summary, themes, progress)
values ('通学路が夜に暗い', '通学路の街灯が少なく、夜道に不安を感じるという声が届いています。', '{まちづくり・暮らし}', 'heard');
update ctx set issue_id = (select max(id) from public.public_issues);
select lives_ok($$select public.attach_submission_by_receipt((select issue_id from ctx), (select receipt from ctx))$$,
  'reviewer can attach a submission by receipt number');
insert into public.issue_policy_links (issue_id, policy_slug, note) values ((select issue_id from ctx), 'civic', '地域の安全');
insert into public.issue_updates (issue_id, body) values ((select issue_id from ctx), '現地を確認しました。');
update ctx set update_id = (select max(id) from public.issue_updates);
select throws_ok($$select public.publish_issue((select issue_id from ctx), true)$$, '42501', null,
  'a reviewer cannot publish (admin approval required)');
select throws_ok($$update public.public_issues set status = 'published' where id = (select issue_id from ctx)$$, '42501', null,
  'nobody can set status directly');
reset role;

select is((select voice_count from public.public_issues where id = (select issue_id from ctx)), 1, 'voice_count follows sources');

-- Anonymous visitors see nothing yet.
set local role anon;
select is((select count(*)::int from public.public_issues where id = (select issue_id from ctx)), 0, 'draft issue is not public');
select is((select count(*)::int from public.issue_policy_links where issue_id = (select issue_id from ctx)), 0,
  'links of a draft issue are not public');
select throws_ok('select * from public.issue_sources', '42501', null, 'issue_sources is never readable by anon');
select throws_ok('select created_by from public.public_issues', '42501', null, 'internal columns are not readable by anon');
select throws_ok($$select public.publish_issue(1, true)$$, '42501', null, 'anon cannot publish');
reset role;

-- Admin without MFA cannot publish.
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal1"}', true);
set local role authenticated;
select throws_ok($$select public.publish_issue((select issue_id from ctx), true)$$, '42501', null,
  'admin without MFA cannot publish');
reset role;

-- Admin approves.
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select throws_ok($$select public.publish_issue((select issue_id from ctx), false)$$, 'P0001', 'checklist_required',
  'publishing requires the checklist to be confirmed');
select lives_ok($$select public.publish_issue((select issue_id from ctx), true)$$, 'admin can publish');
reset role;

select is((select status from public.public_issues where id = (select issue_id from ctx)), 'published', 'issue is published');
select is((select approved_by from public.public_issues where id = (select issue_id from ctx)),
  '00000000-0000-0000-0000-0000000000d1'::uuid, 'approver is recorded');
select is((select count(*)::int from public.audit_log where action = 'publish_issue' and target_id = (select issue_id::text from ctx)), 1,
  'publishing is logged');

set local role anon;
select is((select title from public.public_issues where id = (select issue_id from ctx)), '通学路が夜に暗い',
  'published issue is public');
select is((select voice_count from public.public_issues where id = (select issue_id from ctx)), 1, 'voice count is public');
select is((select policy_slug from public.issue_policy_links where issue_id = (select issue_id from ctx)), 'civic',
  'policy link is public once the issue is published');
select is((select count(*)::int from public.issue_updates where issue_id = (select issue_id from ctx)), 0,
  'unapproved progress updates stay private');
select throws_ok('select * from public.submissions', '42501', null, 'original submissions stay private');
reset role;

-- After publishing, the reviewer can no longer change public content.
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select throws_ok($$update public.public_issues set summary = '書き換え' where id = (select issue_id from ctx)$$, '42501', null,
  'reviewer cannot edit a published issue');
select throws_ok($$delete from public.issue_policy_links where issue_id = (select issue_id from ctx)$$, '42501', null,
  'reviewer cannot change policy links of a published issue');
select throws_ok($$select public.publish_issue_update((select update_id from ctx))$$, '42501', null,
  'reviewer cannot publish a progress update');
reset role;

-- Admin publishes the update and can unpublish the issue.
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select lives_ok($$select public.publish_issue_update((select update_id from ctx))$$, 'admin can publish a progress update');
reset role;
set local role anon;
select is((select count(*)::int from public.issue_updates where issue_id = (select issue_id from ctx)), 1,
  'approved update is public');
reset role;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated","aal":"aal2"}', true);
select lives_ok($$select public.unpublish_issue((select issue_id from ctx))$$, 'admin can unpublish');
reset role;
set local role anon;
select is((select count(*)::int from public.public_issues where id = (select issue_id from ctx)), 0,
  'unpublished issue disappears from the public site');
select is((select count(*)::int from public.issue_updates where issue_id = (select issue_id from ctx)), 0,
  'its updates disappear too');
reset role;

select * from finish();
rollback;
