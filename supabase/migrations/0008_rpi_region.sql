-- =====================================================================
-- SIGMA — Migration 0008
-- Dimensi region untuk Regional Performance Indicators (RPI).
--
-- Struktur RPI berbeda dari OPI: satu KPI memiliki target dan nilai Q1–Q4
-- untuk SETIAP region (National, Jawa, Sumatera-A, Sumatera-B, Kalimantan).
-- Karena itu indicator_years memperoleh kolom `region`, dan primary key-nya
-- menjadi (indicator_id, year, region).
--
-- Baris OPI dan PPI yang sudah ada otomatis menjadi region 'National',
-- sehingga perilakunya tidak berubah sama sekali.
--
-- Aman dijalankan berulang.
-- =====================================================================

-- 'RPI' ditambahkan ke enum kerangka.
do $$ begin
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'sigma_framework' and e.enumlabel = 'RPI'
  ) then
    alter type sigma_framework add value 'RPI';
  end if;
end $$;

-- Kolom region + primary key baru.
alter table public.indicator_years
  add column if not exists region text not null default 'National';

do $$ begin
  if exists (
    select 1 from pg_constraint
    where conname = 'indicator_years_pkey'
      and (select count(*) from unnest(conkey)) = 2
  ) then
    alter table public.indicator_years drop constraint indicator_years_pkey;
    alter table public.indicator_years
      add constraint indicator_years_pkey primary key (indicator_id, year, region);
  end if;
end $$;

create index if not exists idx_iy_region on public.indicator_years(region);

-- History dan evidence juga perlu tahu regionnya.
alter table public.indicator_history add column if not exists region text not null default 'National';
alter table public.evidence         add column if not exists region text not null default 'National';

-- Trigger riwayat ikut mencatat region.
create or replace function public.log_indicator_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare f text; o text; n text;
begin
  foreach f in array array['target','q1','q2','q3','q4','status'] loop
    execute format('select ($1).%I::text, ($2).%I::text', f, f)
      into o, n using old, new;
    if o is distinct from n then
      insert into public.indicator_history(indicator_id, year, region, field, old_value, new_value, changed_by)
      values (new.indicator_id, new.year, new.region, f, o, n, auth.uid());
    end if;
  end loop;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

-- Daftar region yang berlaku, dibaca aplikasi lewat app_config.
insert into public.app_config(key, value) values
  ('regions', '["National","Jawa","Sumatera-A","Sumatera-B","Kalimantan"]'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Program Manager dan Head of Program tidak menyentuh RPI; hak tulis RPI
-- mengikuti PMO, Country Head, kontributor, dan reviewer.
drop policy if exists p_iy_update on public.indicator_years;
create policy p_iy_update on public.indicator_years
  for update to authenticated
  using (
    public.is_active() and (
      public.current_role() in ('sysadmin','pmo','contrib','reviewer','country')
      or (public.current_role() = 'pm'
          and exists (select 1 from public.indicators i
                      where i.id = indicator_id and i.type = 'PPI'))
      or (public.current_role() = 'head'
          and exists (select 1 from public.indicators i
                      where i.id = indicator_id and i.type = 'OPI'))
    )
  )
  with check (public.is_active());

-- Verifikasi:
-- select region, count(*) from public.indicator_years group by region order by region;
