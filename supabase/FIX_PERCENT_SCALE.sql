-- =====================================================================
-- SIGMA - koreksi satuan pada nilai Percent OPI 2025
--
-- Dua nilai kuartal ditulis sebagai bilangan bulat persen sementara
-- targetnya ditulis desimal, sehingga rasio capaiannya menjadi ribuan persen:
--
--   Budget control TF Indo budget effectiveness
--     target 0,9  - Q4 tertulis 91,7  seharusnya 0,917
--   Percentage of partner districts with regulation...
--     target 0,11 - Q2 tertulis 9     seharusnya 0,09
--
-- Koreksi ini sudah dikonfirmasi. Skrip membagi 100 hanya pada baris yang
-- targetnya desimal (<= 1,5) tetapi nilai kuartalnya lebih dari 1,5, sehingga
-- indikator yang memang konsisten memakai skala bilangan bulat tidak tersentuh.
--
-- Aman dijalankan berulang: setelah dikoreksi, nilainya tidak lagi > 1,5
-- sehingga eksekusi berikutnya tidak mengubah apa pun.
-- =====================================================================

-- Langkah 1 - lihat baris yang akan dikoreksi.
select i.id, i.name, iy.year, iy.target, iy.q1, iy.q2, iy.q3, iy.q4
from public.indicators i
join public.indicator_years iy on iy.indicator_id = i.id
where i.unit = 'Percent'
  and iy.region = 'National'
  and coalesce(iy.target, 0) <= 1.5
  and (coalesce(iy.q1,0) > 1.5 or coalesce(iy.q2,0) > 1.5
    or coalesce(iy.q3,0) > 1.5 or coalesce(iy.q4,0) > 1.5)
order by i.id, iy.year;

-- Langkah 2 - koreksi.
update public.indicator_years iy
   set q1 = case when iy.q1 > 1.5 then iy.q1 / 100 else iy.q1 end,
       q2 = case when iy.q2 > 1.5 then iy.q2 / 100 else iy.q2 end,
       q3 = case when iy.q3 > 1.5 then iy.q3 / 100 else iy.q3 end,
       q4 = case when iy.q4 > 1.5 then iy.q4 / 100 else iy.q4 end
  from public.indicators i
 where i.id = iy.indicator_id
   and i.unit = 'Percent'
   and iy.region = 'National'
   and coalesce(iy.target, 0) <= 1.5
   and (coalesce(iy.q1,0) > 1.5 or coalesce(iy.q2,0) > 1.5
     or coalesce(iy.q3,0) > 1.5 or coalesce(iy.q4,0) > 1.5);

-- Langkah 3 - verifikasi. Harus mengembalikan 0 baris.
select i.id, i.name, iy.year, iy.target, iy.q1, iy.q2, iy.q3, iy.q4
from public.indicators i
join public.indicator_years iy on iy.indicator_id = i.id
where i.unit = 'Percent'
  and iy.region = 'National'
  and coalesce(iy.target, 0) <= 1.5
  and (coalesce(iy.q1,0) > 1.5 or coalesce(iy.q2,0) > 1.5
    or coalesce(iy.q3,0) > 1.5 or coalesce(iy.q4,0) > 1.5);
