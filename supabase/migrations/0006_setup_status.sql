-- =====================================================================
-- SIGMA — Migration 0006
-- Fungsi diagnosa yang dibaca halaman /setup.
--
-- Mengembalikan hanya ANGKA dan BOOLEAN — tidak ada username, email, atau
-- data indikator. Tujuannya satu: memastikan aplikasi di Vercel benar-benar
-- terhubung ke project Supabase yang sama dengan tempat Anda menjalankan SQL.
--
-- Setelah login berhasil, akses anon boleh dicabut:
--     revoke execute on function public.setup_status() from anon;
-- =====================================================================

create or replace function public.setup_status()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'project_ref',      split_part(current_setting('request.headers', true)::json->>'host', '.', 1),
    'akun_total',       (select count(*) from public.profiles),
    'akun_aktif',       (select count(*) from public.profiles where active),
    'admin_ada',        (select exists (select 1 from public.profiles
                                        where lower(username) = 'admin' and active)),
    'indikator',        (select count(*) from public.indicators),
    'baris_tahun',      (select count(*) from public.indicator_years),
    'fungsi_login_ada', (to_regproc('public.email_for_username') is not null)
  )
$$;

grant execute on function public.setup_status() to anon, authenticated;

-- Verifikasi:
-- select public.setup_status();
