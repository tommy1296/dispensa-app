-- Dispensa: schema del database.
-- Da incollare una volta nell'SQL Editor di Supabase (Run).
-- Si può rieseguire senza danni: crea solo ciò che manca.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Ricette
-- ---------------------------------------------------------------------------
create table if not exists public.ricette (
  id bigint generated always as identity primary key,
  slug text not null unique,
  titolo text not null,
  tipo text not null check (tipo in ('pasto', 'colazione', 'dolce', 'spuntino', 'salsa', 'pane')),
  proteina text check (proteina in (
    'legumi', 'latticini', 'tofu', 'pesce', 'uova', 'carne bianca',
    'carne rossa o affettati', 'frutta secca', 'nessuna'
  )),
  ha_proteina boolean,
  ha_carboidrato boolean,
  ha_verdura boolean,
  pasto_completo boolean generated always as (
    coalesce(ha_proteina, false) and coalesce(ha_carboidrato, false) and coalesce(ha_verdura, false)
  ) stored,
  adatta_asporto boolean,
  tempo text check (tempo in ('veloce', 'medio', 'lungo')),
  vegana boolean not null default false,
  vegetariana boolean not null default false,
  senza_glutine text not null default 'no' check (senza_glutine in ('si', 'no', 'da_verificare')),
  scheda_parziale boolean not null default false,
  etichette_stimate boolean not null default false,
  ingredienti text[] not null default '{}',
  procedimento text,
  note text,
  fonte_tipo text,
  fonte_url text,
  fonte_post integer,
  immagine_url text,
  preferita boolean not null default false,
  -- Campi calcolati dal trigger qui sotto, servono alla ricerca.
  ingredienti_testo text not null default '',
  ricerca tsvector,
  creata_il timestamptz not null default now(),
  modificata_il timestamptz not null default now()
);

create or replace function public.ricette_prepara()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.ingredienti_testo := lower(unaccent(array_to_string(new.ingredienti, ' ')));
  new.ricerca :=
    setweight(to_tsvector('italian', unaccent(coalesce(new.titolo, ''))), 'A') ||
    setweight(to_tsvector('italian', new.ingredienti_testo), 'B') ||
    setweight(to_tsvector('italian', unaccent(coalesce(new.procedimento, ''))), 'C');
  new.modificata_il := now();
  return new;
end;
$$;

drop trigger if exists ricette_prepara on public.ricette;
create trigger ricette_prepara
  before insert or update on public.ricette
  for each row execute function public.ricette_prepara();

create index if not exists ricette_ricerca_idx on public.ricette using gin (ricerca);
create index if not exists ricette_ingredienti_trgm_idx on public.ricette using gin (ingredienti_testo extensions.gin_trgm_ops);
create index if not exists ricette_titolo_trgm_idx on public.ricette using gin (titolo extensions.gin_trgm_ops);
create index if not exists ricette_tipo_idx on public.ricette (tipo);

-- Bozze: ricette salvate al volo (per esempio dal bot Telegram) e ancora da
-- completare. Restano fuori dalla ricerca normale finché non si tolgono da bozza.
alter table public.ricette add column if not exists bozza boolean not null default false;
create index if not exists ricette_bozza_idx on public.ricette (bozza) where bozza;

-- ---------------------------------------------------------------------------
-- Storico dei pasti scelti
-- ---------------------------------------------------------------------------
create table if not exists public.storico_pasti (
  id bigint generated always as identity primary key,
  data date not null,
  pasto text not null check (pasto in ('colazione', 'pranzo', 'cena')),
  ricetta_id bigint references public.ricette (id) on delete set null,
  piatto text not null,
  proteina text,
  carboidrato text,
  verdura text,
  note text,
  creato_il timestamptz not null default now()
);

create index if not exists storico_data_idx on public.storico_pasti (data desc);

-- ---------------------------------------------------------------------------
-- Sicurezza: solo gli utenti che hanno fatto login vedono e modificano i dati.
-- Le nuove registrazioni vanno disattivate in Authentication > Sign In / Providers,
-- così l'unico utente resta quello creato a mano.
-- ---------------------------------------------------------------------------
alter table public.ricette enable row level security;
alter table public.storico_pasti enable row level security;

drop policy if exists "utenti autenticati" on public.ricette;
create policy "utenti autenticati" on public.ricette
  for all to authenticated using (true) with check (true);

drop policy if exists "utenti autenticati" on public.storico_pasti;
create policy "utenti autenticati" on public.storico_pasti
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Foto delle ricette (bucket pubblico in lettura, scrittura solo da loggati)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('foto-ricette', 'foto-ricette', true)
on conflict (id) do nothing;

drop policy if exists "foto: caricamento" on storage.objects;
create policy "foto: caricamento" on storage.objects
  for insert to authenticated with check (bucket_id = 'foto-ricette');

drop policy if exists "foto: modifica" on storage.objects;
create policy "foto: modifica" on storage.objects
  for update to authenticated using (bucket_id = 'foto-ricette');

drop policy if exists "foto: eliminazione" on storage.objects;
create policy "foto: eliminazione" on storage.objects
  for delete to authenticated using (bucket_id = 'foto-ricette');

-- Serve per elencare i file (pulizia delle foto inutilizzate) e per eliminarli.
drop policy if exists "foto: elenco" on storage.objects;
create policy "foto: elenco" on storage.objects
  for select to authenticated using (bucket_id = 'foto-ricette');
