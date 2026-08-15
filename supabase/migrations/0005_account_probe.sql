-- =====================================================================
-- SIGMA — Migration 0005
-- Memperbaiki pesan gagal login yang menyesatkan.
--
-- Masalah: halaman login memeriksa "apakah ada akun sama sekali?" dengan
-- select biasa ke public.profiles. Pemeriksaan itu berjalan sebagai role
-- `anon`, sementara RLS pada profiles hanya memberi akses kepada role
-- `authenticated` — sehingga hasilnya SELALU nol, bahkan ketika akun
-- sebenarnya ada. Akibatnya pesan "No account exists in the database yet"
-- muncul untuk kasus apa pun, termasuk username salah ketik.
--
-- Solusi: satu fungsi SECURITY DEFINER yang hanya mengembalikan angka
-- jumlah akun aktif — tidak membocorkan username, email, atau apa pun.
-- =====================================================================

create or replace function public.active_account_count()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles where active
$$;

grant execute on function public.active_account_count() to anon, authenticated;

-- Verifikasi:
-- select public.active_account_count();
