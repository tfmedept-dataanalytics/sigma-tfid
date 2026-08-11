-- =====================================================================
-- SIGMA — Migration 0004 (OPSIONAL)
-- Membuat satu akun System Administrator langsung dari SQL Editor.
--
-- Gunakan hanya bila Anda belum sempat menjalankan skrip dari komputer:
--     npm run seed           (seluruh data + 8 akun)
--     npm run create-admin   (satu akun administrator saja)
-- Kedua skrip itu jalur yang disarankan, karena memakai Supabase Auth Admin
-- API dan tidak menyentuh tabel internal auth.
--
-- PERINGATAN
--   Password di bawah tertulis apa adanya di dalam file ini dan akan tercatat
--   di riwayat SQL Editor. Ganti segera setelah berhasil masuk, dan jangan
--   commit file ini setelah passwordnya diubah menjadi password sungguhan.
-- =====================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_email    text := 'admin@sigma.local';
  v_username text := 'admin';
  v_password text := 'sigma2026';        -- GANTI setelah berhasil masuk
  v_id       uuid;
begin
  select id into v_id from auth.users where email = v_email;

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

    -- GoTrue memerlukan baris identity agar login email/password diterima.
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_email),
      'email', now(), now()
    );

    raise notice 'Akun auth dibuat: %', v_email;
  else
    update auth.users
       set encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = v_id;
    raise notice 'Akun auth sudah ada, password direset: %', v_email;
  end if;

  insert into public.profiles (id, username, full_name, email, role, unit, active, must_change)
  values (v_id, v_username, 'Admin SIGMA', v_email, 'sysadmin', 'IT', true, true)
  on conflict (id) do update
    set username = excluded.username,
        role     = 'sysadmin',
        active   = true;
end $$;

-- Pemeriksaan hasil:
-- select username, email, role, active, must_change from public.profiles order by username;
