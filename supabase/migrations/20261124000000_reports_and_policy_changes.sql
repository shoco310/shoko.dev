-- Activity reports (活動報告) and the policy change history (政策変更履歴),
-- edited from the dashboard (admin only), replacing src/data/activity.ts and
-- the changelog in src/data/policy.ts. Existing entries are migrated below.
--
-- Policy changes are append-only once published:
--   * a published change can never be edited or deleted (trigger);
--   * mistakes are fixed by publishing a correction (`corrects` → original);
--   * in an emergency (e.g. personal data published by mistake) an admin can
--     withdraw it: hidden from the public, kept in the table and audit_log.

-- ---------------------------------------------------------------------------
-- Activity reports
-- ---------------------------------------------------------------------------
create table public.activity_reports (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^\d{4}-\d{2}-\d{2}-[a-z0-9-]{1,60}$'),
  kind         text not null default 'report' check (kind in ('report', 'note', 'instagram', 'event')),
  title        text not null check (char_length(btrim(title)) between 1 and 150),
  report_date  date not null,
  summary      text not null check (char_length(btrim(summary)) between 1 and 400),
  body         text check (char_length(body) <= 20000),
  -- https URLs (Storage) or site images; http only for the local dev Storage.
  photo_url    text check (photo_url ~ '^(https://|/images/|http://(127\.0\.0\.1|localhost):[0-9]+/)' and char_length(photo_url) <= 1000),
  photo_alt    text check (char_length(photo_alt) <= 200),
  external_url text check (external_url ~ '^https://' and char_length(external_url) <= 500),
  event_id     uuid references public.events (id) on delete set null,
  visibility   text not null default 'draft' check (visibility in ('draft', 'published')),
  published_at timestamptz,
  created_by   uuid default auth.uid(),
  updated_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.activity_reports is 'Public activity reports. No personal data. Admin edits; anon reads published.';
create index activity_reports_visibility_date_idx on public.activity_reports (visibility, report_date desc);

revoke all on table public.activity_reports from anon, authenticated;
alter table public.activity_reports enable row level security;
create policy "public reads published reports" on public.activity_reports
  for select to anon, authenticated using (visibility = 'published');
create policy "admin reads all reports" on public.activity_reports for select to authenticated using (public.is_admin());
create policy "admin inserts reports" on public.activity_reports for insert to authenticated with check (public.is_admin());
create policy "admin updates reports" on public.activity_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes draft reports" on public.activity_reports for delete to authenticated
  using (public.is_admin() and visibility = 'draft');

grant select (id, slug, kind, title, report_date, summary, body, photo_url, photo_alt, external_url, event_id,
              visibility, published_at, updated_at)
  on public.activity_reports to anon;
grant select on public.activity_reports to authenticated;
grant insert (slug, kind, title, report_date, summary, body, photo_url, photo_alt, external_url, event_id, visibility),
      update (slug, kind, title, report_date, summary, body, photo_url, photo_alt, external_url, event_id, visibility)
  on public.activity_reports to authenticated;
grant delete on public.activity_reports to authenticated;

-- Events can point at their report.
alter table public.events add column report_id uuid references public.activity_reports (id) on delete set null;
grant select (report_id) on public.events to anon;
grant insert (report_id), update (report_id) on public.events to authenticated;

-- ---------------------------------------------------------------------------
-- Policy changes (append-only once published)
-- ---------------------------------------------------------------------------
create table public.policy_changes (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^\d{4}-\d{2}-\d{2}-[a-z0-9-]{1,60}$'),
  change_date    date not null,
  policy_slugs   text[] not null check (
                   cardinality(policy_slugs) between 1 and 4
                   and policy_slugs <@ array['education', 'work', 'childcare', 'civic']::text[]),
  summary        text not null check (char_length(btrim(summary)) between 1 and 500),
  reason         text check (char_length(reason) <= 2000),
  evidence       jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array' and jsonb_array_length(evidence) <= 20),
  diffs          jsonb not null default '[]' check (jsonb_typeof(diffs) = 'array' and jsonb_array_length(diffs) <= 20),
  related_issues integer[] not null default '{}' check (cardinality(related_issues) <= 20),
  commits        text[] not null default '{}' check (cardinality(commits) <= 10),
  corrects       uuid references public.policy_changes (id),
  visibility     text not null default 'draft' check (visibility in ('draft', 'published', 'withdrawn')),
  published_at   timestamptz,
  withdrawn_at   timestamptz,
  created_by     uuid default auth.uid(),
  updated_by     uuid default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.policy_changes is
  'Public policy change history. Append-only once published (corrections are new rows); withdrawn rows are hidden, never deleted.';
create index policy_changes_visibility_date_idx on public.policy_changes (visibility, change_date desc);

revoke all on table public.policy_changes from anon, authenticated;
alter table public.policy_changes enable row level security;
create policy "public reads published changes" on public.policy_changes
  for select to anon, authenticated using (visibility = 'published');
create policy "admin reads all changes" on public.policy_changes for select to authenticated using (public.is_admin());
create policy "admin inserts changes" on public.policy_changes for insert to authenticated with check (public.is_admin());
create policy "admin updates changes" on public.policy_changes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes draft changes" on public.policy_changes for delete to authenticated
  using (public.is_admin() and visibility = 'draft');

grant select (id, slug, change_date, policy_slugs, summary, reason, evidence, diffs, related_issues, commits,
              corrects, visibility, published_at, updated_at)
  on public.policy_changes to anon;
grant select on public.policy_changes to authenticated;
grant insert (slug, change_date, policy_slugs, summary, reason, evidence, diffs, related_issues, commits, corrects, visibility),
      update (slug, change_date, policy_slugs, summary, reason, evidence, diffs, related_issues, commits, corrects, visibility)
  on public.policy_changes to authenticated;
grant delete on public.policy_changes to authenticated;

create or replace function public.policy_changes_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.visibility <> 'draft' then
      raise exception 'published_changes_are_permanent' using errcode = '42501';
    end if;
    return old;
  end if;
  if old.visibility = 'withdrawn' then
    raise exception 'published_changes_are_permanent' using errcode = '42501';
  end if;
  if old.visibility = 'published' then
    -- The only allowed change: withdraw, without touching the content.
    if new.visibility <> 'withdrawn'
       or (new.slug, new.change_date, new.policy_slugs, new.summary, new.reason, new.evidence, new.diffs,
           new.related_issues, new.commits, new.corrects)
          is distinct from
          (old.slug, old.change_date, old.policy_slugs, old.summary, old.reason, old.evidence, old.diffs,
           old.related_issues, old.commits, old.corrects) then
      raise exception 'published_changes_are_permanent' using errcode = '42501';
    end if;
    new.withdrawn_at := now();
  end if;
  return new;
end;
$$;
create trigger policy_changes_guard before update or delete on public.policy_changes
  for each row execute function public.policy_changes_guard();

-- ---------------------------------------------------------------------------
-- Shared bookkeeping (timestamps, editor, publish time) and full audit
-- ---------------------------------------------------------------------------
create or replace function public.content_before_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if new.visibility = 'published' and (tg_op = 'INSERT' or old.visibility <> 'published') then
    new.published_at := coalesce(new.published_at, now());
  end if;
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
create trigger activity_reports_before_write before insert or update on public.activity_reports
  for each row execute function public.content_before_write();
create trigger policy_changes_before_write before insert or update on public.policy_changes
  for each row execute function public.content_before_write();

create or replace function public.content_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_kind text := case tg_table_name when 'activity_reports' then 'report' else 'policy_change' end;
begin
  insert into public.audit_log (actor, action, target_table, target_id, detail)
  values (
    auth.uid(),
    case
      when tg_op = 'INSERT' then 'create_' || v_kind
      when tg_op = 'DELETE' then 'delete_' || v_kind
      when old.visibility <> new.visibility then new.visibility || '_' || v_kind
      else 'update_' || v_kind
    end,
    tg_table_name,
    coalesce(new.id, old.id)::text,
    jsonb_build_object(
      'before', case when tg_op = 'INSERT' then null else to_jsonb(old) end,
      'after',  case when tg_op = 'DELETE' then null else to_jsonb(new) end
    )
  );
  return null;
end;
$$;
create trigger activity_reports_audit after insert or update or delete on public.activity_reports
  for each row execute function public.content_audit();
create trigger policy_changes_audit after insert or update or delete on public.policy_changes
  for each row execute function public.content_audit();

revoke execute on function public.policy_changes_guard(), public.content_before_write(), public.content_audit()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Photos: public bucket, images only, admin-only writes
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-media', 'public-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admin uploads public media" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-media' and public.is_admin());
create policy "admin updates public media" on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and public.is_admin());
create policy "admin deletes public media" on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Migrate existing content
-- ---------------------------------------------------------------------------
insert into public.activity_reports (slug, kind, title, report_date, summary, photo_url, external_url, visibility) values
  ('2026-06-06-note-return-to-ube', 'note', '13年ぶりに宇部に戻ってきた理由。そして、次の挑戦へ。', '2026-06-06',
   'エンジニアとして、コミュニティ運営者として、母として。宇部で挑戦する人を増やしたいという想いから、市政への挑戦を表明しました。ぜひ全文を読んでいただけると嬉しいです。',
   'https://assets.st-note.com/production/uploads/images/282744910/rectangle_large_type_2_45b3458da69c2b92cface398a873169e.jpeg?width=800',
   'https://note.com/satoshoco/n/n073cb334dd8b', 'published'),
  ('2026-04-18-genai-event', 'instagram', '生成AIを「基礎 → 実践」まで体験するイベントを開催しました', '2026-04-18',
   '講演 & ワークショップ形式で、生成AIを基礎から実践まで一気通貫で体験できるイベントを開催。参加者の皆さんと一緒に楽しく学びました。',
   '/images/activity/ig-ai-event.jpg', 'https://www.instagram.com/p/DXRfshzj_y7/', 'published'),
  ('2026-01-31-conference-childcare', 'note', 'カンファレンス託児サポートをしています', '2026-01-31',
   '子育て中でも学びの場に参加できるよう、カンファレンス託児サポートの取り組みを続けています。誰もが参加できる場づくりを目指して。',
   'https://assets.st-note.com/production/uploads/images/248020863/rectangle_large_type_2_f00d9df40de7d69f46603ce4cd9a0e3d.png?width=800',
   'https://note.com/satoshoco/n/n83a6263e1246', 'published'),
  ('2026-05-05-omikoshi', 'instagram', '山口県宇部市のお祭りで、13年ぶりに御神輿を担ぎました', '2026-05-05',
   '地元のお祭りに参加し、13年ぶりに御神輿を担ぎました。地域の皆さんと汗をかきながら、宇部のあたたかさを再確認した一日でした。',
   '/images/activity/ig-omikoshi.jpg', 'https://www.instagram.com/p/DX80roSPnAp/', 'published'),
  ('2026-01-31-forbes-women-in-tech', 'note', 'Forbes JAPAN「Women in Tech 30」2026 に選出されました', '2026-01-31',
   '「テクノロジー領域で世界を変える30人」に選出いただきました。この機会を宇部への活動につなげていきます。',
   'https://assets.st-note.com/production/uploads/images/248013228/rectangle_large_type_2_a34e8dee9ad932edbc7a7ebfd48601e8.jpeg?width=800',
   'https://note.com/satoshoco/n/nf8a6380b8fab', 'published'),
  ('2025-10-16-engineer-community-talk', 'instagram', '「エンジニア×地域コミュニティ〜宇部のこれから〜」に登壇しました', '2025-10-16',
   '「エンジニア×地域コミュニティ ～佐藤祥子さんと考える、宇部のこれから〜」に登壇。エンジニアの視点から地域の未来について語り合いました。',
   '/images/activity/ig-todan.jpg', 'https://www.instagram.com/p/DP3ypeHD7aM/', 'published');

-- Link the two migrated events to their reports (they referenced activity ids 2 and 6).
update public.activity_reports r set event_id = e.id from public.events e
 where (r.slug, e.slug) in (('2026-04-18-genai-event', '2026-04-18-genai-event'),
                            ('2025-10-16-engineer-community-talk', '2025-10-16-engineer-community-talk'));
update public.events e set report_id = r.id from public.activity_reports r
 where (e.report_activity_id = '2' and r.slug = '2026-04-18-genai-event')
    or (e.report_activity_id = '6' and r.slug = '2025-10-16-engineer-community-talk');

-- The three real policy changes recorded in src/data/policy.ts (all four policies).
insert into public.policy_changes
  (slug, change_date, policy_slugs, summary, reason, evidence, diffs, commits, visibility) values
  ('2026-06-17-first-publish', '2026-06-17', array['education', 'work', 'childcare', 'civic'],
   '4つの政策を公開しました。', null, '[]', '[]', array['d96ed76'], 'published'),
  ('2026-09-26-detail-pages', '2026-09-26', array['education', 'work', 'childcare', 'civic'],
   '政策ごとの詳細ページを新しく作り、背景・具体的な取り組み・必要な理由を掲載しました。', null, '[]', '[]', array['7ecad88'], 'published'),
  ('2026-09-27-research-data', '2026-09-27', array['education', 'work', 'childcare', 'civic'],
   '「数字で見る宇部の現状」「調査結果から考えられること」「市民の声」「関連資料・出典」を追加しました。取り組みに付けていた表示と、一部の見出しも改めました。',
   '宇部市の計画書・アンケート調査などの公式資料を確認し、出典を確認できたデータだけを掲載するためです。あわせて、調査の対象や母数の書き方を正確にし、「関連する既存制度あり」の表示が政策の進め方まで決めているように読めないよう表現を改めました。',
   '[
      {"label": "宇部市人口ビジョン【改訂版】（令和7年3月）", "url": "https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/007/034/vision202503.pdf"},
      {"label": "宇部市こども計画（令和7年3月）", "url": "https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/023/097/ubeshikodomokeikaku.pdf"},
      {"label": "第9期宇部市高齢者福祉計画【概要版】（令和6年3月）", "url": "https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/005/423/9gaiyou.pdf"},
      {"label": "令和6年度 学童保育クラブ利用者アンケート結果（全体集計）", "url": "https://www.city.ube.yamaguchi.jp/_res/projects/default_project/_page_/001/023/525/2024-zenntai.pdf"},
      {"label": "宇部市のパブリックコメント実施結果（人口ビジョン・総合戦略の改訂素案）"}
    ]'::jsonb,
   '[
      {"label": "取り組みに付ける表示", "before": "「既存制度の拡充」／「既存制度との関係を確認中」", "after": "「関連する既存制度あり」（関係する制度が確認できた取り組みだけに表示）"},
      {"label": "関連制度の書き方", "before": "該当する既存制度：…", "after": "関連制度：…"},
      {"label": "見出し", "before": "既存制度と改善を検討する点", "after": "（「なぜ、この政策が必要なのか」と「調査結果から考えられること」に整理）"}
    ]'::jsonb,
   array['708e835', '72ada07'], 'published');
