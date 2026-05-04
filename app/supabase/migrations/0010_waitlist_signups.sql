-- ===============================================
-- ReWear — marketing site waitlist
-- Date: 2026-05-04
--
-- Stores emails collected from the marketing site (rewear-jade-five.vercel.app
-- → eventually rewear.app). RLS denies all direct access; inserts go through
-- a SECURITY DEFINER RPC granted to anon so the public site can call it
-- without a session.
--
-- Run in Supabase SQL editor:
--   https://supabase.com/dashboard/project/dsegzkolqoosxphqxapt/sql/new
-- ===============================================

create table waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table waitlist_signups enable row level security;
-- No policies: nobody can SELECT/INSERT/UPDATE/DELETE directly. Inserts only
-- via the RPC below. Reads happen via the Supabase dashboard or service-role
-- queries from JG's tooling.

create function join_waitlist(
  p_email text,
  p_source text default null,
  p_referrer text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  -- Normalise + validate
  v_email := lower(trim(p_email));
  if v_email is null or v_email = '' then
    raise exception 'invalid_email';
  end if;
  if not (v_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid_email';
  end if;

  -- Idempotent: re-submitting the same email is a silent success
  insert into waitlist_signups (email, source, referrer, user_agent)
  values (v_email, p_source, p_referrer, p_user_agent)
  on conflict (email) do nothing;
end;
$$;

grant execute on function join_waitlist(text, text, text, text) to anon, authenticated;
