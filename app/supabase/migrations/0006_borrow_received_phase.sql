-- ===============================================
-- ReWear — borrow lifecycle: add 'received' phase
-- Date: 2026-05-04
--
-- New flow: pending → approved → received → returned
-- Each transition timestamped:
--   created_at    — request sent
--   decided_at    — owner approved/declined
--   received_at   — borrower confirmed in hand    (NEW)
--   returned_at   — owner confirmed returned
--
-- Run in Supabase SQL editor:
--   https://supabase.com/dashboard/project/dsegzkolqoosxphqxapt/sql/new
-- ===============================================

-- ============= Add 'received' to enum =============

alter type borrow_status add value if not exists 'received' before 'returned';

-- ============= Add received_at column =============

alter table borrow_requests
  add column if not exists received_at timestamptz;

-- ============= Done =============
