-- =====================================================================
-- SIGMA — Migration 0004 (OPSIONAL)
-- Membuat atau MERESET satu akun System Administrator dari SQL Editor.
--
-- Aman dijalankan berulang. Bila akun sudah ada, password direset dan
-- kekurangan yang menyebabkan login gagal (email belum terkonfirmasi,
-- baris identity hilang, profil nonaktif) ikut diperbaiki.
--
-- Jalur yang lebih disarankan tetap `npm run create-admin` dari komputer Anda.
--
-- PERINGATAN: password di bawah tertulis apa adanya dan tercatat di riwayat
-- SQL Editor. Ganti segera setelah berhasil masuk.
-- =====================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_email    text := 'admin@sigma.local';
  v_username text := 'admin';
  v_password text := 'sigma2026';        -- GANTI setelah berhasil masuk
  v_id       uuid;
  v_has_pid  boolean;
begin
  -- Kolom provider_id baru ada pada GoTrue versi lebih baru; deteksi dulu
  -- agar skrip tetap jalan pada project Supabase lama maupun baru.
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'auth' and table_name = 'identities' and column_name = 'provider_id'
  ) into v_has_pid;

  select id into v_id from auth.users where lower(email) = lower(v_email);

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
    raise notice 'Akun auth dibuat: %', v_email;
  else
    update auth.users
       set encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at  = coalesce(email_confirmed_at, now()),
           raw_app_meta_data   = '{"provider":"email","providers":["email"]}'::jsonb,
           updated_at          = now()
     where id = v_id;
    raise notice 'Akun auth sudah ada, password direset: %', v_email;
  end if;

  -- GoTrue menolak login email/password bila baris identity tidak ada.
  if not exists (select 1 from auth.identities where user_id = v_id) then
    if v_has_pid then
      execute format(
        'insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
         values (gen_random_uuid(), %L, %L, %L::jsonb, %L, now(), now())',
        v_id, v_id::text,
        jsonb_build_object('sub', v_id::text, 'email', v_email)::text, 'email');
    else
      execute format(
        'insert into auth.identities (id, user_id, identity_data, provider, created_at, updated_at)
         values (gen_random_uuid(), %L, %L::jsonb, %L, now(), now())',
        v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email)::text, 'email');
    end if;
    raise notice 'Baris identity ditambahkan.';
  end if;

  insert into public.profiles (id, username, full_name, email, role, unit, active, must_change)
  values (v_id, v_username, 'Admin SIGMA', v_email, 'sysadmin', 'IT', true, true)
  on conflict (id) do update
    set username = excluded.username,
        email    = excluded.email,
        role     = 'sysadmin',
        active   = true;

  raise notice 'Selesai. Masuk dengan username: %  password: %', v_username, v_password;
end $$;

-- Verifikasi (harus mengembalikan satu baris, password_ok = true):
select p.username, p.active, u.email,
       (u.email_confirmed_at is not null) as email_terkonfirmasi,
       (u.encrypted_password = crypt('sigma2026', u.encrypted_password)) as password_ok,
       exists (select 1 from auth.identities i where i.user_id = u.id) as punya_identity
from public.profiles p join auth.users u on u.id = p.id
where p.username = 'admin';
