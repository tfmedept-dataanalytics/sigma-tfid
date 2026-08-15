-- =====================================================================
-- SIGMA — Migration 0009
-- Empat region + Akumulasi Regional.
--
-- Koreksi atas 0008: blok pertama pada file RPI berjudul "Target
-- Accumulation", bukan National. Blok itu adalah AKUMULASI keempat region,
-- sehingga labelnya diperbaiki dan nilai kuartalnya tidak lagi disimpan —
-- aplikasi menghitungnya sebagai penjumlahan Q1–Q4 keempat region agar
-- tidak pernah berbeda dari penjumlahan regionnya sendiri.
--
-- Yang tersimpan pada baris akumulasi hanya target dan catatan.
-- Baris OPI dan PPI tetap memakai region 'National' dan tidak tersentuh.
--
-- Aman dijalankan berulang.
-- =====================================================================

-- 1. Ganti label pada baris RPI yang terlanjur bernama 'National'.
update public.indicator_years iy
   set region = 'Akumulasi Regional'
  from public.indicators i
 where i.id = iy.indicator_id
   and i.type = 'RPI'
   and iy.region = 'National'
   and not exists (
     select 1 from public.indicator_years x
     where x.indicator_id = iy.indicator_id and x.year = iy.year
       and x.region = 'Akumulasi Regional'
   );

-- 2. Kosongkan nilai kuartal pada baris akumulasi: nilainya dihitung
--    aplikasi, dan menyimpannya justru berisiko menyimpan angka yang
--    berbeda dari penjumlahan regionnya.
update public.indicator_years iy
   set q1 = null, q2 = null, q3 = null, q4 = null
  from public.indicators i
 where i.id = iy.indicator_id
   and i.type = 'RPI'
   and iy.region = 'Akumulasi Regional';

-- 3. Daftar region yang berlaku.
insert into public.app_config(key, value) values
  ('regions', '["Jawa","Sumatera-A","Sumatera-B","Kalimantan","Akumulasi Regional"]'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Verifikasi:
-- select iy.region, count(*) from public.indicator_years iy
--   join public.indicators i on i.id = iy.indicator_id
--  where i.type = 'RPI' group by iy.region order by iy.region;
