-- =====================================================================
-- SIGMA — SATU FILE UNTUK MEMPERBAIKI LOGIN
--
-- Salin SELURUH isi file ini ke Supabase → SQL Editor → Run.
-- File ini memperbaiki sendiri semua penyebab login gagal yang diketahui,
-- lalu menutup dengan satu tabel hasil pemeriksaan.
--
-- Aman dijalankan berulang. Tidak menghapus data apa pun.
-- Prasyarat: 0001_schema.sql dan 0002_rls.sql sudah pernah dijalankan.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Fungsi pencarian akun (menerima username ATAU email)
-- ---------------------------------------------------------------------
create or replace function public.email_for_username(u text)
returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles
  where active
    and (lower(username) = lower(trim(u)) or lower(email) = lower(trim(u)))
  order by (lower(username) = lower(trim(u))) desc
  limit 1
$$;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Fungsi hitung akun aktif (dipakai halaman login untuk pesan error)
-- ---------------------------------------------------------------------
create or replace function public.active_account_count()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles where active
$$;
grant execute on function public.active_account_count() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Buat atau perbaiki akun administrator
--    username : admin
--    password : sigma2026     ← GANTI setelah berhasil masuk
-- ---------------------------------------------------------------------
do $$
declare
  v_email    text := 'admin@sigma.local';
  v_username text := 'admin';
  v_password text := 'sigma2026';
  v_id       uuid;
  v_has_pid  boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema='auth' and table_name='identities' and column_name='provider_id'
  ) into v_has_pid;

  -- Pakai akun yang sudah terhubung ke profil username ini bila ada,
  -- supaya tidak membuat akun auth kembar.
  select p.id into v_id from public.profiles p where lower(p.username) = v_username;
  if v_id is null then
    select id into v_id from auth.users where lower(email) = lower(v_email);
  end if;

  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
    );
  else
    -- Reset password, konfirmasi email, pastikan provider email terdaftar.
    update auth.users
       set email               = coalesce(email, v_email),
           encrypted_password  = crypt(v_password, gen_salt('bf')),
           email_confirmed_at  = coalesce(email_confirmed_at, now()),
           raw_app_meta_data   = '{"provider":"email","providers":["email"]}'::jsonb,
           banned_until        = null,
           deleted_at          = null,
           updated_at          = now()
     where id = v_id;
  end if;

  -- GoTrue menolak login email/password bila baris identity tidak ada.
  if not exists (select 1 from auth.identities where user_id = v_id and provider = 'email') then
    if v_has_pid then
      execute format(
        'insert into auth.identities (id,user_id,provider_id,identity_data,provider,created_at,updated_at)
         values (gen_random_uuid(), %L, %L, %L::jsonb, %L, now(), now())',
        v_id, v_id::text,
        jsonb_build_object('sub', v_id::text, 'email',
          (select email from auth.users where id = v_id))::text, 'email');
    else
      execute format(
        'insert into auth.identities (id,user_id,identity_data,provider,created_at,updated_at)
         values (gen_random_uuid(), %L, %L::jsonb, %L, now(), now())',
        v_id,
        jsonb_build_object('sub', v_id::text, 'email',
          (select email from auth.users where id = v_id))::text, 'email');
    end if;
  end if;

  insert into public.profiles (id, username, full_name, email, role, unit, active, must_change)
  values (v_id, v_username, 'Admin SIGMA',
          (select email from auth.users where id = v_id), 'sysadmin', 'IT', true, true)
  on conflict (id) do update
    set username = excluded.username,
        email    = excluded.email,
        role     = 'sysadmin',
        active   = true;
end $$;

-- ---------------------------------------------------------------------
-- 3b. Perbaiki kolom token NULL pada auth.users
--
--     Akun yang disisipkan lewat SQL kerap meninggalkan kolom token bernilai
--     NULL. GoTrue membaca kolom itu ke tipe string Go yang tidak menerima
--     NULL, sehingga SETIAP login gagal meskipun hash password-nya benar.
--     Inilah penyebab kasus "semua pemeriksaan true tetapi login tetap ditolak".
-- ---------------------------------------------------------------------
do $$
declare
  c text;
  cols text[] := array[
    'confirmation_token','recovery_token','email_change','email_change_token_new',
    'email_change_token_current','phone_change','phone_change_token','reauthentication_token'];
begin
  foreach c in array cols loop
    if exists (select 1 from information_schema.columns
               where table_schema='auth' and table_name='users' and column_name=c) then
      execute format('update auth.users set %I = %L where %I is null', c, '', c);
    end if;
  end loop;

  if exists (select 1 from information_schema.columns
             where table_schema='auth' and table_name='users' and column_name='is_sso_user') then
    update auth.users set is_sso_user = false where is_sso_user is null;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='auth' and table_name='users' and column_name='is_anonymous') then
    update auth.users set is_anonymous = false where is_anonymous is null;
  end if;

  update auth.users
     set aud  = coalesce(nullif(aud, ''), 'authenticated'),
         role = coalesce(nullif(role, ''), 'authenticated')
   where aud is null or aud = '' or role is null or role = '';
end $$;

-- ---------------------------------------------------------------------
-- 4. HASIL PEMERIKSAAN — semua kolom harus bernilai true / terisi
-- ---------------------------------------------------------------------
select
  p.username                                                        as username,
  u.email                                                           as email,
  p.active                                                          as profil_aktif,
  (u.email_confirmed_at is not null)                                as email_terkonfirmasi,
  (u.encrypted_password = crypt('sigma2026', u.encrypted_password)) as password_sigma2026,
  exists (select 1 from auth.identities i
          where i.user_id = u.id and i.provider = 'email')          as punya_identity,
  (u.banned_until is null)                                          as tidak_diblokir,
  (public.email_for_username('admin') = u.email)                    as fungsi_login_ok,
  public.active_account_count()                                     as jumlah_akun_aktif,
  (u.confirmation_token is not null and u.recovery_token is not null
   and u.email_change is not null)                                  as token_tidak_null
from public.profiles p
join auth.users u on u.id = p.id
where lower(p.username) = 'admin';

-- Bila seluruh kolom di atas true dan login MASIH ditolak, penyebabnya di luar
-- database. Periksa dua hal:
--   1. Authentication → Providers → Email : "Confirm email" harus MATI.
--   2. NEXT_PUBLIC_SUPABASE_URL di Vercel harus menunjuk project yang SAMA
--      dengan project tempat file ini dijalankan. Bandingkan bagian
--      https://<ref>.supabase.co pada env Vercel dengan <ref> di URL browser
--      Anda saat membuka dashboard Supabase ini.
