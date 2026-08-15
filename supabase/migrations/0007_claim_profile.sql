-- =====================================================================
-- SIGMA — Migration 0007
-- Menghubungkan akun Supabase Auth ke tabel profiles secara otomatis.
--
-- LATAR
-- Akun pertama sebaiknya dibuat lewat Supabase Dashboard (Authentication →
-- Users → Add user), karena dashboard memakai Auth API yang sama dengan
-- aplikasi sehingga seluruh kolom internal auth terisi benar. Penyisipan
-- manual ke auth.users lewat SQL kerap meninggalkan kolom token bernilai
-- NULL dan membuat GoTrue menolak setiap login.
--
-- Masalahnya, akun dashboard belum punya baris di public.profiles, sehingga
-- aplikasi tidak mengenali role-nya. Fungsi di bawah menutup celah itu:
-- dijalankan SETELAH login berhasil, membuatkan baris profil untuk pengguna
-- yang sedang masuk.
--
-- PENGAMAN
--   - Hanya dapat dipanggil oleh pengguna yang sudah terautentikasi.
--   - Memberi role sysadmin HANYA bila tabel profiles benar-benar kosong.
--     Begitu satu profil ada, fungsi ini menolak membuat profil baru —
--     akun berikutnya harus didaftarkan administrator lewat User Management.
--   - Username diturunkan dari email dan dijamin unik.
-- =====================================================================

create or replace function public.claim_profile()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id       uuid := auth.uid();
  v_email    text;
  v_username text;
  v_base     text;
  v_total    int;
  v_n        int := 1;
begin
  if v_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  -- Sudah punya profil → tidak ada yang perlu dilakukan.
  if exists (select 1 from public.profiles where id = v_id) then
    return jsonb_build_object('ok', true, 'reason', 'already_exists');
  end if;

  select count(*) into v_total from public.profiles;
  if v_total > 0 then
    -- Bukan lagi tahap bootstrap. Akun ini harus didaftarkan administrator.
    return jsonb_build_object('ok', false, 'reason', 'not_bootstrap');
  end if;

  select email into v_email from auth.users where id = v_id;
  v_base := lower(split_part(coalesce(v_email, 'admin'), '@', 1));
  v_base := regexp_replace(v_base, '[^a-z0-9.]', '', 'g');
  if length(v_base) < 3 then v_base := 'admin'; end if;

  v_username := v_base;
  while exists (select 1 from public.profiles where username = v_username) loop
    v_n := v_n + 1;
    v_username := v_base || v_n::text;
  end loop;

  insert into public.profiles (id, username, full_name, email, role, unit, active, must_change)
  values (v_id, v_username, 'Administrator', v_email, 'sysadmin', 'IT', true, false);

  insert into public.audit_log (actor, actor_username, action, object, detail)
  values (v_id, v_username, 'Bootstrap administrator', v_username,
          'profil dibuat otomatis saat login pertama');

  return jsonb_build_object('ok', true, 'reason', 'created', 'username', v_username);
end $$;

grant execute on function public.claim_profile() to authenticated;

-- Verifikasi setelah login pertama:
-- select username, role, active from public.profiles;
