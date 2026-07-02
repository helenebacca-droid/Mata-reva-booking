-- Correction si Supabase indique :
-- invalid input syntax for type uuid: "mr..."
--
-- Cela veut dire que la colonne bookings.id a ete creee en uuid.
-- L'application Mata Reva utilise des identifiants texte pour rester compatible
-- avec les anciennes reservations locales.
--
-- A lancer dans Supabase > SQL Editor.
-- Si la table bookings est vide, cette correction est sans risque.

alter table public.bookings
alter column id type text
using id::text;
