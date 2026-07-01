-- Mata Reva Booking - schema Supabase
-- A copier dans Supabase > SQL Editor, puis cliquer sur Run.
-- Ne mets jamais la cle service_role ni la connection string Postgres dans l'application web.

create table if not exists public.bookings (
  id text primary key,
  client text not null,
  phone text,
  service_id text not null,
  date date not null,
  time time not null,
  duration text,
  adults integer default 0,
  children integer default 0,
  status text default 'option',
  paid integer default 0,
  notes text,
  tepari_out boolean default true,
  tepari_back boolean default true,
  waiver boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bookings enable row level security;

drop policy if exists "bookings_select_authenticated" on public.bookings;
drop policy if exists "bookings_insert_authenticated" on public.bookings;
drop policy if exists "bookings_update_authenticated" on public.bookings;
drop policy if exists "bookings_delete_authenticated" on public.bookings;

create policy "bookings_select_authenticated"
on public.bookings for select
to authenticated
using (true);

create policy "bookings_insert_authenticated"
on public.bookings for insert
to authenticated
with check (auth.uid() = created_by);

create policy "bookings_update_authenticated"
on public.bookings for update
to authenticated
using (true)
with check (true);

create policy "bookings_delete_authenticated"
on public.bookings for delete
to authenticated
using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bookings_updated_at on public.bookings;

create trigger set_bookings_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();
