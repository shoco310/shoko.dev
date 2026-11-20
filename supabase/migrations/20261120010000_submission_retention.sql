-- Retention for submission text: keep at most 5 years after the last action
-- (updated_at moves whenever staff change the status or note). Contact
-- details are removed with the submission (ON DELETE CASCADE) and normally
-- much earlier by purge_expired_contacts(). Public issue summaries (Phase C)
-- live in separate tables and are not affected.
--
-- Stated in the privacy policy (src/pages/PrivacyPage.tsx, "保存期間").

create or replace function public.purge_old_submissions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  delete from public.submissions where updated_at < now() - interval '5 years';
  get diagnostics v_count = row_count;
  if v_count > 0 then
    insert into public.audit_log (actor, action, target_table, detail)
    values (null, 'purge_old_submissions', 'submissions', jsonb_build_object('deleted', v_count));
  end if;
  return v_count;
end;
$$;

revoke execute on function public.purge_old_submissions() from public, anon, authenticated;

select cron.schedule('purge-old-submissions', '27 3 * * *', 'select public.purge_old_submissions()');
