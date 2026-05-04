-- ===============================================
-- ReWear — outfit scheduling
-- Date: 2026-05-04
--
-- Adds a single column to the existing `outfits` table so an outfit
-- can be scheduled for a future date. `worn_date` still tracks when
-- (and if) it was actually worn. Both can be set: an outfit scheduled
-- for Tuesday becomes worn_date=Tuesday when the user logs it.
--
-- No new tables — `outfit_items` already handles the join.
--
-- Run in Supabase SQL editor:
--   https://supabase.com/dashboard/project/dsegzkolqoosxphqxapt/sql/new
-- ===============================================

alter table outfits
  add column if not exists scheduled_date date;

-- Partial index: only the rows that are actually scheduled
create index if not exists outfits_scheduled_date_idx
  on outfits(user_id, scheduled_date)
  where scheduled_date is not null;
