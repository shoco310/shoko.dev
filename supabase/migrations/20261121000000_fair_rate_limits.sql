-- Fairer rate limits for citizen submissions.
--
-- The first version allowed 3 submissions per sender (salted IP hash) per
-- hour. Many people can share one public IP (mobile carrier NAT, school /
-- library / community-centre Wi-Fi), so that could block ordinary people,
-- e.g. at a meeting where everyone is asked to submit on the spot.
-- Bots are stopped mainly by Cloudflare Turnstile (checked in /api/submit
-- before this function runs); these limits only guard against manual floods
-- and unexpected bursts:
--   * per sender: 20 / hour and 50 / day
--   * the same text from the same sender within 24 hours: 'duplicate'
--   * whole site: 200 / hour ('busy'), to protect the database and the
--     operator's review workload during an attack
-- IPv6 senders are hashed per /64 network in /api/submit, so one household
-- or device counts once even though its address changes.

create or replace function public.submit_voice(
  p_body            text,
  p_privacy_version text,
  p_ip_hash         text,
  p_theme_hints     text[] default '{}',
  p_area_hint       text default null,
  p_age_range       text default null,
  p_name            text default null,
  p_email           text default null,
  p_reply_ok        boolean default false
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id      uuid;
  v_receipt text;
  v_body    text := btrim(p_body);
  v_name    text := nullif(btrim(p_name), '');
  v_email   text := nullif(lower(btrim(p_email)), '');
begin
  if (select count(*) from public.submissions where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'busy' using errcode = 'P0001';
  end if;

  if p_ip_hash is not null then
    if (select count(*) from public.submissions
         where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 20
       or (select count(*) from public.submissions
         where ip_hash = p_ip_hash and created_at > now() - interval '1 day') >= 50 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;

    if exists (select 1 from public.submissions
                where ip_hash = p_ip_hash and created_at > now() - interval '1 day' and body = v_body) then
      raise exception 'duplicate' using errcode = 'P0001';
    end if;
  end if;

  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;

  loop
    v_receipt := public.generate_receipt_no();
    begin
      insert into public.submissions
        (receipt_no, body, theme_hints, area_hint, age_range, has_contact, privacy_version, ip_hash)
      values
        (v_receipt, v_body, coalesce(p_theme_hints, '{}'), nullif(btrim(p_area_hint), ''),
         p_age_range, (v_name is not null or v_email is not null), p_privacy_version, p_ip_hash)
      returning id into v_id;
      exit;
    exception when unique_violation then
      -- receipt_no collision: try again with a new random number
    end;
  end loop;

  if v_name is not null or v_email is not null then
    insert into public.submission_contacts (submission_id, name, email, reply_ok)
    values (v_id, v_name, v_email, coalesce(p_reply_ok, false) and v_email is not null);
  end if;

  return v_receipt;
end;
$$;

-- CREATE OR REPLACE keeps existing grants, but restate them so this file
-- is self-explanatory: only service_role (/api/submit) may call it.
revoke execute on function
  public.submit_voice(text, text, text, text[], text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function
  public.submit_voice(text, text, text, text[], text, text, text, text, boolean)
  to service_role;
