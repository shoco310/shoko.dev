-- Phase C: public issues written from citizen submissions, linked to policies.
--
-- Rules (operator's decision, 2026-11-21):
--   * Nothing becomes public without the operator's approval. Only an admin
--     (the operator, 佐藤祥子) can publish, via publish_issue(); the status
--     column is not writable by any API role. A future reviewer role can
--     draft, but cannot publish or change what is already public.
--   * Public text is rewritten by staff (title/summary). Original submissions
--     are never exposed; issue_sources links them privately and only the
--     count (voice_count) is public.
--   * Issues have themes independent of the four policies; linking to a
--     policy is optional (0..n).

create table public.public_issues (
  id           integer generated always as identity primary key,
  title        text not null check (char_length(btrim(title)) between 1 and 80),
  summary      text not null default '' check (char_length(summary) <= 2000),
  themes       text[] not null default '{}' check (cardinality(themes) <= 8),
  progress     text not null default 'heard'
               check (progress in ('heard', 'researching', 'proposing', 'in_policy', 'closed')),
  status       text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  voice_count  integer not null default 0,
  created_by   uuid default auth.uid(),
  approved_by  uuid,
  approved_at  timestamptz,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.public_issues is
  'Issues rewritten by staff from citizen submissions. Public only when status = published (set by publish_issue(), admin only).';

create table public.issue_sources (
  issue_id      integer not null references public.public_issues (id) on delete cascade,
  submission_id uuid not null references public.submissions (id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (issue_id, submission_id)
);
comment on table public.issue_sources is 'Private link from an issue to the submissions behind it. Never public.';

create table public.issue_policy_links (
  issue_id    integer not null references public.public_issues (id) on delete cascade,
  policy_slug text not null check (policy_slug in ('education', 'work', 'childcare', 'civic')),
  note        text check (char_length(note) <= 200),
  linked_at   timestamptz not null default now(),
  primary key (issue_id, policy_slug)
);

create table public.issue_updates (
  id           integer generated always as identity primary key,
  issue_id     integer not null references public.public_issues (id) on delete cascade,
  body         text not null check (char_length(btrim(body)) between 1 and 1000),
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

create index public_issues_status_idx on public.public_issues (status, published_at desc);
create index issue_policy_links_slug_idx on public.issue_policy_links (policy_slug);
create index issue_updates_issue_idx on public.issue_updates (issue_id, created_at);
create index issue_sources_submission_idx on public.issue_sources (submission_id);

revoke all on table public.public_issues, public.issue_sources, public.issue_policy_links, public.issue_updates
  from anon, authenticated;
alter table public.public_issues enable row level security;
alter table public.issue_sources enable row level security;
alter table public.issue_policy_links enable row level security;
alter table public.issue_updates enable row level security;

-- ---------------------------------------------------------------------------
-- Public read (anon and any signed-in user): published rows, public columns
-- ---------------------------------------------------------------------------
create or replace function public.issue_is_published(p_issue_id integer)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.public_issues where id = p_issue_id and status = 'published');
$$;

create policy "public reads published issues" on public.public_issues
  for select to anon, authenticated using (status = 'published');
create policy "public reads links of published issues" on public.issue_policy_links
  for select to anon, authenticated using (public.issue_is_published(issue_id));
create policy "public reads published updates" on public.issue_updates
  for select to anon, authenticated using (status = 'published' and public.issue_is_published(issue_id));

grant select (id, title, summary, themes, progress, voice_count, published_at, updated_at)
  on public.public_issues to anon;
grant select (issue_id, policy_slug, note) on public.issue_policy_links to anon;
grant select (id, issue_id, body, published_at) on public.issue_updates to anon;

-- ---------------------------------------------------------------------------
-- Staff (aal2): draft and edit; admin approves
-- ---------------------------------------------------------------------------
create policy "staff read issues" on public.public_issues for select to authenticated using (public.is_staff());
create policy "staff insert issues" on public.public_issues for insert to authenticated with check (public.is_staff());
create policy "staff update issues" on public.public_issues for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "admin delete issues" on public.public_issues for delete to authenticated
  using (public.is_admin() and status <> 'published');

create policy "staff manage sources" on public.issue_sources for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "staff manage links" on public.issue_policy_links for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "staff manage updates" on public.issue_updates for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

grant select on public.public_issues to authenticated;
grant insert (title, summary, themes, progress) on public.public_issues to authenticated;
grant update (title, summary, themes, progress) on public.public_issues to authenticated;
grant delete on public.public_issues to authenticated;
grant select, insert, delete on public.issue_sources to authenticated;
grant select, insert, update (note), delete on public.issue_policy_links to authenticated;
grant select on public.issue_updates to authenticated;
grant insert (issue_id, body) on public.issue_updates to authenticated;
grant update (body) on public.issue_updates to authenticated;
grant delete on public.issue_updates to authenticated;

-- What is already public may only be changed by an admin (the approver).
create or replace function public.guard_public_issue()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'published' and not public.is_admin()
     and (new.title, new.summary, new.themes, new.progress)
         is distinct from (old.title, old.summary, old.themes, old.progress) then
    raise exception 'admin_approval_required' using errcode = '42501';
  end if;
  if (new.title, new.summary, new.themes, new.progress, new.status)
     is distinct from (old.title, old.summary, old.themes, old.progress, old.status) then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.guard_issue_child()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_issue integer;
  v_was_public boolean := false;
begin
  if tg_op = 'DELETE' then
    v_issue := old.issue_id;
  else
    v_issue := new.issue_id;
  end if;
  if tg_table_name = 'issue_updates' and tg_op <> 'INSERT' then
    v_was_public := old.status = 'published';
  end if;
  if public.issue_is_published(v_issue) and not public.is_admin()
     and (tg_table_name = 'issue_policy_links' or v_was_public) then
    raise exception 'admin_approval_required' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger public_issues_guard before update on public.public_issues
  for each row execute function public.guard_public_issue();
create trigger issue_policy_links_guard before insert or update or delete on public.issue_policy_links
  for each row execute function public.guard_issue_child();
create trigger issue_updates_guard before update or delete on public.issue_updates
  for each row execute function public.guard_issue_child();

-- voice_count follows issue_sources (also when submissions are purged).
create or replace function public.sync_issue_voice_count()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_issue integer;
begin
  if tg_op = 'DELETE' then
    v_issue := old.issue_id;
  else
    v_issue := new.issue_id;
  end if;
  update public.public_issues
     set voice_count = (select count(*) from public.issue_sources where issue_id = v_issue)
   where id = v_issue;
  return null;
end;
$$;
create trigger issue_sources_count after insert or delete on public.issue_sources
  for each row execute function public.sync_issue_voice_count();

-- Audit changes to issue content and links (publishing is logged by the
-- approval functions below).
create or replace function public.audit_issue_content()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_target text;
begin
  if tg_table_name = 'public_issues' then
    if tg_op = 'UPDATE' and (new.title, new.summary, new.themes, new.progress)
         is not distinct from (old.title, old.summary, old.themes, old.progress) then
      return null;
    end if;
    v_target := case when tg_op = 'DELETE' then old.id else new.id end::text;
  elsif tg_op = 'DELETE' then
    v_target := old.issue_id::text;
  else
    v_target := new.issue_id::text;
  end if;
  insert into public.audit_log (actor, action, target_table, target_id)
  values (auth.uid(), lower(tg_op) || '_' || tg_table_name, tg_table_name, v_target);
  return null;
end;
$$;
create trigger public_issues_audit after insert or update or delete on public.public_issues
  for each row execute function public.audit_issue_content();
create trigger issue_policy_links_audit after insert or update or delete on public.issue_policy_links
  for each row execute function public.audit_issue_content();
create trigger issue_sources_audit after insert or delete on public.issue_sources
  for each row execute function public.audit_issue_content();
create trigger issue_updates_audit after insert or update or delete on public.issue_updates
  for each row execute function public.audit_issue_content();

-- ---------------------------------------------------------------------------
-- Approval actions (admin only)
-- ---------------------------------------------------------------------------
create or replace function public.publish_issue(p_issue_id integer, p_checked boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  v public.public_issues;
begin
  if not public.is_admin() then
    raise exception 'admin_approval_required' using errcode = '42501';
  end if;
  if p_checked is not true then
    raise exception 'checklist_required' using errcode = 'P0001';
  end if;
  select * into v from public.public_issues where id = p_issue_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if btrim(v.title) = '' or btrim(v.summary) = '' then
    raise exception 'summary_required' using errcode = 'P0001';
  end if;
  update public.public_issues
     set status = 'published',
         published_at = coalesce(published_at, now()),
         approved_by = auth.uid(),
         approved_at = now()
   where id = p_issue_id;
  insert into public.audit_log (actor, action, target_table, target_id, detail)
  values (auth.uid(), 'publish_issue', 'public_issues', p_issue_id::text, jsonb_build_object('checklist', true));
end;
$$;

create or replace function public.unpublish_issue(p_issue_id integer, p_archive boolean default false)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admin_approval_required' using errcode = '42501';
  end if;
  update public.public_issues
     set status = case when p_archive then 'archived' else 'draft' end
   where id = p_issue_id;
  insert into public.audit_log (actor, action, target_table, target_id, detail)
  values (auth.uid(), 'unpublish_issue', 'public_issues', p_issue_id::text, jsonb_build_object('archive', p_archive));
end;
$$;

create or replace function public.publish_issue_update(p_update_id integer)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admin_approval_required' using errcode = '42501';
  end if;
  update public.issue_updates set status = 'published', published_at = now() where id = p_update_id;
  insert into public.audit_log (actor, action, target_table, target_id)
  values (auth.uid(), 'publish_issue_update', 'issue_updates', p_update_id::text);
end;
$$;

create or replace function public.unpublish_issue_update(p_update_id integer)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admin_approval_required' using errcode = '42501';
  end if;
  update public.issue_updates set status = 'draft', published_at = null where id = p_update_id;
  insert into public.audit_log (actor, action, target_table, target_id)
  values (auth.uid(), 'unpublish_issue_update', 'issue_updates', p_update_id::text);
end;
$$;

-- Staff can attach a submission by its receipt number (they cannot list
-- receipt numbers they cannot already read, since RLS applies inside).
create or replace function public.attach_submission_by_receipt(p_issue_id integer, p_receipt text)
returns uuid language plpgsql volatile security invoker set search_path = '' as $$
declare
  v_id uuid;
begin
  select id into v_id from public.submissions where receipt_no = upper(btrim(p_receipt));
  if v_id is null then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  insert into public.issue_sources (issue_id, submission_id) values (p_issue_id, v_id) on conflict do nothing;
  return v_id;
end;
$$;

revoke execute on function
  public.issue_is_published(integer),
  public.guard_public_issue(),
  public.guard_issue_child(),
  public.sync_issue_voice_count(),
  public.audit_issue_content(),
  public.publish_issue(integer, boolean),
  public.unpublish_issue(integer, boolean),
  public.publish_issue_update(integer),
  public.unpublish_issue_update(integer),
  public.attach_submission_by_receipt(integer, text)
  from public, anon, authenticated;

-- RLS policies call issue_is_published() as the querying role.
grant execute on function public.issue_is_published(integer) to anon, authenticated;
grant execute on function
  public.publish_issue(integer, boolean),
  public.unpublish_issue(integer, boolean),
  public.publish_issue_update(integer),
  public.unpublish_issue_update(integer),
  public.attach_submission_by_receipt(integer, text)
  to authenticated;
