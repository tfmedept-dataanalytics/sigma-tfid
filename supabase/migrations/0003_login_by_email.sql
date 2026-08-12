-- =====================================================================
-- SIGMA — Migration 0003
-- Masuk dengan username ATAU email.
--
-- Halaman login meminta username, tetapi orang lazim mengetikkan alamat
-- email. Sebelumnya pencarian hanya mencocokkan kolom username, sehingga
-- email yang benar pun ditolak dengan pesan "tidak dikenali" — membingungkan
-- dan sulit dibedakan dari password yang salah.
--
-- Aman dijalankan berulang, dan aman pada instance yang sudah berisi data.
-- =====================================================================

create or replace function public.email_for_username(u text)
returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles
  where active
    and (lower(username) = lower(trim(u)) or lower(email) = lower(trim(u)))
  order by (lower(username) = lower(trim(u))) desc   -- username diprioritaskan
  limit 1
$$;

grant execute on function public.email_for_username(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Pemeriksaan cepat: apakah akun sudah ada?
-- Jalankan potongan di bawah di SQL Editor bila login gagal terus.
-- ---------------------------------------------------------------------
-- select username, email, role, active, must_change, last_login
-- from public.profiles order by username;
--
-- Bila tabel kosong, skrip seed belum dijalankan:
--   npm run seed          (dari komputer Anda, dengan .env.local terisi)
-- atau buat satu administrator saja:
--   npm run create-admin
