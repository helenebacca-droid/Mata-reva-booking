-- Mata Reva Booking - ajout des champs Google Calendar
-- A copier dans Supabase > SQL Editor, puis cliquer sur Run.

alter table public.bookings
add column if not exists google_event_id text,
add column if not exists google_synced_at timestamptz,
add column if not exists google_sync_error text;
