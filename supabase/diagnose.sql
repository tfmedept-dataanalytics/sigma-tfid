-- =====================================================================
-- SIGMA — diagnosa login
-- Jalankan seluruh isi file ini di Supabase → SQL Editor, lalu baca hasilnya.
-- Setiap query menjawab satu kemungkinan penyebab, berurutan.
-- =====================================================================

-- 1. Apakah tabelnya sudah ada? (migrasi 0001 & 0002 sudah dijalankan?)
select
  to_regclass('public.profiles')            as tabel_profiles,
  to_regclass('public.indicators')          as tabel_indicators,
  to_regproc('public.email_for_username')   as fungsi_login;
-- Bila ada yang NULL → jalankan 0001_schema.sql dan 0002_rls.sql lebih dulu.


-- 2. Apakah ada akun sama sekali?
select count(*) as jumlah_profil, count(*) filter (where active) as jumlah_aktif
from public.profiles;
-- 0 → seed/bootstrap belum jalan. Jalankan 0004_bootstrap_admin.sql.


-- 3. Kondisi tiap akun, termasuk apakah passwordnya benar-benar 'sigma2026'.
select
  p.username,
  p.role,
  p.active                                                     as profil_aktif,
  u.email,
  (u.email_confirmed_at is not null)                           as email_terkonfirmasi,
  (u.encrypted_password = crypt('sigma2026', u.encrypted_password)) as password_sigma2026,
  exists (select 1 from auth.identities i where i.user_id = u.id)   as punya_identity,
  p.must_change,
  p.last_login
from public.profiles p
left join auth.users u on u.id = p.id
order by p.username;
-- password_sigma2026 = false  → password sudah pernah diganti. Reset lewat 0004.
-- email_terkonfirmasi = false → login ditolak. Matikan "Confirm email" di
--                               Authentication → Providers → Email, lalu jalankan 0004 lagi.
-- punya_identity = false      → GoTrue menolak login email/password. Jalankan 0004 versi terbaru.
-- profil_aktif = false        → akun dinonaktifkan.


-- 4. Apakah fungsi login menemukan akunnya?
select public.email_for_username('admin') as email_untuk_admin;
-- NULL → username tidak cocok atau akun tidak aktif.


-- 5. Apakah pendaftaran mandiri masih terbuka? (harus dimatikan di dashboard)
--    Tidak dapat dibaca lewat SQL — periksa manual di
--    Authentication → Providers → Email → Enable sign-ups.
