-- =====================================================================
-- SIGMA — perbaikan kolom token NULL pada auth.users
--
-- MASALAH
-- Akun yang dibuat langsung lewat SQL (bukan lewat Auth Admin API) sering
-- meninggalkan kolom token di auth.users bernilai NULL: confirmation_token,
-- recovery_token, email_change, email_change_token_new, dan sejenisnya.
--
-- GoTrue — layanan auth Supabase — membaca kolom-kolom itu ke dalam tipe
-- string Go yang tidak menerima NULL. Akibatnya setiap percobaan login
-- gagal di lapisan auth, MESKIPUN hash password-nya benar. Inilah sebabnya
-- pemeriksaan SQL menunjukkan semua true tetapi login tetap ditolak.
--
-- SOLUSI: ubah NULL menjadi string kosong. Tidak menghapus data apa pun.
-- Aman dijalankan berulang.
-- =====================================================================

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


-- Verifikasi: seluruh kolom di bawah harus 0.
select
  count(*) filter (where confirmation_token is null)     as null_confirmation_token,
  count(*) filter (where recovery_token is null)         as null_recovery_token,
  count(*) filter (where email_change is null)           as null_email_change,
  count(*) filter (where email_change_token_new is null) as null_email_change_token_new,
  count(*) filter (where aud is null or aud = '')        as aud_kosong,
  count(*) filter (where role is null or role = '')      as role_kosong
from auth.users;
