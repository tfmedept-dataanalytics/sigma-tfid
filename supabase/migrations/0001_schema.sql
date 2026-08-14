-- =====================================================================
-- SIGMA — Strategic Information for Governance, Monitoring & Analytics
-- Migration 0001 — schema
-- Jalankan di Supabase SQL Editor, atau: supabase db push
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- enum ----------
do $$ begin
  create type sigma_role as enum
    ('sysadmin','pmo','pm','head','contrib','reviewer','country','exec');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sigma_status as enum
    ('draft','submitted','review','approved','returned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sigma_framework as enum ('OPI','PPI');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
-- Satu baris per akun auth.users. Username dipakai di layar login;
-- Supabase Auth sendiri tetap memakai email, lihat fungsi email_for_username().
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  full_name   text not null,
  email       text,
  role        sigma_role not null default 'contrib',
  unit        text,
  active      boolean not null default true,
  must_change boolean not null default false,
  last_login  timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------- indicators (OPI + PPI dalam satu tabel) ----------
create table if not exists public.indicators (
  id                  text primary key,
  type                sigma_framework not null,
  name                text not null,
  code                text,
  unit                text,
  calc                text,
  -- Agregasi Q1..Q4 menjadi actual tahunan: 'max' | 'sum' | 'last'.
  -- NULL berarti mengikuti aturan umum: unit Percent memakai MAX, unit lain dijumlahkan.
  -- Setel 'last' untuk indikator kondisi pada satu titik waktu (kehadiran, pemenuhan,
  -- prevalensi, jumlah unit aktif, indeks, unit cost), karena MAX melaporkan kuartal
  -- terbaik dan SUM menggandakan objek yang sama.
  agg                 text check (agg in ('max','sum','last')),
  t2030               numeric,
  -- kolom khusus OPI
  strategy_map        text,
  outcome             text,
  accountability      text,
  program             text,
  details             text,
  -- kolom khusus PPI
  toc_foundation      text,
  toc_foundation_code text,
  portfolio           text,
  portfolio_code      text,
  project             text,
  project_code        text,
  level               text,
  result_statement    text,
  definition          text,
  mov                 text,
  period              text,
  archived            boolean not null default false,
  created_at          timestamptz not null default now(),
  created_by          uuid references public.profiles(id)
);

create index if not exists idx_ind_type      on public.indicators(type);
create index if not exists idx_ind_portfolio on public.indicators(portfolio);
create index if not exists idx_ind_project   on public.indicators(project);
create index if not exists idx_ind_toc       on public.indicators(toc_foundation);

-- ---------- nilai per tahun ----------
-- q1..q4 disimpan apa adanya. NULL berarti BELUM ADA DATA — bukan nol.
-- Seluruh agregasi di aplikasi mengeluarkan NULL dari perhitungan.
-- Unit Percent disimpan sebagai desimal (0.8 = 80%), konsisten dengan file sumber.
create table if not exists public.indicator_years (
  indicator_id text not null references public.indicators(id) on delete cascade,
  year         int  not null,
  target       numeric,
  q1 numeric, q2 numeric, q3 numeric, q4 numeric,
  commentary   text,
  achievement  text,
  challenge    text,
  action       text,
  notes        text,
  key_initiatives text,
  source       text,
  status       sigma_status not null default 'draft',
  owner        text,
  return_reason text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles(id),
  primary key (indicator_id, year)
);

create index if not exists idx_iy_year   on public.indicator_years(year);
create index if not exists idx_iy_status on public.indicator_years(status);

-- ---------- riwayat perubahan nilai ----------
create table if not exists public.indicator_history (
  id           bigserial primary key,
  indicator_id text not null references public.indicators(id) on delete cascade,
  year         int  not null,
  field        text not null,
  old_value    text,
  new_value    text,
  changed_by   uuid references public.profiles(id),
  changed_at   timestamptz not null default now()
);

create index if not exists idx_hist_ind on public.indicator_history(indicator_id, year);

-- ---------- evidence (metadata; berkas di Supabase Storage) ----------
create table if not exists public.evidence (
  id           bigserial primary key,
  indicator_id text not null references public.indicators(id) on delete cascade,
  year         int  not null,
  file_name    text not null,
  storage_path text,
  note         text,
  uploaded_by  uuid references public.profiles(id),
  uploaded_at  timestamptz not null default now()
);

-- ---------- audit trail ----------
create table if not exists public.audit_log (
  id       bigserial primary key,
  actor    uuid references public.profiles(id),
  actor_username text,
  action   text not null,
  object   text,
  detail   text,
  at       timestamptz not null default now()
);

create index if not exists idx_audit_at on public.audit_log(at desc);

-- ---------- notifikasi ----------
create table if not exists public.notifications (
  id         bigserial primary key,
  recipient  uuid references public.profiles(id),
  role_target sigma_role,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- konfigurasi aplikasi ----------
create table if not exists public.app_config (
  key   text primary key,
  value jsonb not null
);

insert into public.app_config(key, value) values
  ('thresholds', '{"on_track":95,"near_target":75}'::jsonb),
  ('workflow',   '{"require_evidence":true,"require_one_quarter":true}'::jsonb),
  ('meta',       '{"vision":"","mission":""}'::jsonb)
on conflict (key) do nothing;

-- ---------- helper: role pengguna saat ini ----------
create or replace function public.current_role()
returns sigma_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_active()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select active from public.profiles where id = auth.uid()), false)
$$;

-- ---------- helper: cari email dari username (dipakai halaman login) ----------
-- SECURITY DEFINER agar dapat dipanggil sebelum pengguna terautentikasi.
-- Hanya mengembalikan email untuk akun aktif; tidak membocorkan apakah
-- username ada atau tidak (halaman login menampilkan pesan yang sama).
create or replace function public.email_for_username(u text)
returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles
  where lower(username) = lower(trim(u)) and active
  limit 1
$$;

grant execute on function public.email_for_username(text) to anon, authenticated;

-- ---------- trigger: catat perubahan nilai kuartal & target ----------
create or replace function public.log_indicator_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare f text; o text; n text;
begin
  foreach f in array array['target','q1','q2','q3','q4','status'] loop
    execute format('select ($1).%I::text, ($2).%I::text', f, f)
      into o, n using old, new;
    if o is distinct from n then
      insert into public.indicator_history(indicator_id, year, field, old_value, new_value, changed_by)
      values (new.indicator_id, new.year, f, o, n, auth.uid());
    end if;
  end loop;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

drop trigger if exists trg_indicator_years_history on public.indicator_years;
create trigger trg_indicator_years_history
  before update on public.indicator_years
  for each row execute function public.log_indicator_change();

-- ---------- trigger: nilai berubah menurunkan status Approved ke Draft ----------
create or replace function public.demote_on_value_change()
returns trigger language plpgsql as $$
begin
  if old.status = 'approved'
     and (old.q1 is distinct from new.q1 or old.q2 is distinct from new.q2
       or old.q3 is distinct from new.q3 or old.q4 is distinct from new.q4
       or old.target is distinct from new.target)
     and new.status = old.status then
    new.status := 'draft';
  end if;
  return new;
end $$;

drop trigger if exists trg_demote on public.indicator_years;
create trigger trg_demote
  before update on public.indicator_years
  for each row execute function public.demote_on_value_change();
