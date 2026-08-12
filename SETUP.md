# SIGMA — Penyiapan pertama kali

Urutan ini menghindari seluruh masalah login yang muncul bila akun disisipkan
langsung ke `auth.users` lewat SQL. Akun pertama dibuat lewat **Supabase Dashboard**,
karena dashboard memakai Auth API yang sama dengan aplikasi sehingga seluruh kolom
internal terisi benar.

Perkiraan waktu: 10 menit.

---

## 1. Jalankan migrasi

Supabase → **SQL Editor** → **New query**. Jalankan berurutan, satu per satu:

| Urutan | File |
|---|---|
| 1 | `supabase/migrations/0001_schema.sql` |
| 2 | `supabase/migrations/0002_rls.sql` |
| 3 | `supabase/migrations/0003_login_by_email.sql` |
| 4 | `supabase/migrations/0005_account_probe.sql` |
| 5 | `supabase/migrations/0006_setup_status.sql` |
| 6 | `supabase/migrations/0007_claim_profile.sql` |

`0004_bootstrap_admin.sql` **tidak lagi dipakai** dan tidak perlu dijalankan.

Bila Anda pernah menjalankannya dan akun `admin@sigma.local` sudah terlanjur ada,
hapus dulu: Authentication → Users → cari akun itu → **Delete user**. Akun hasil
penyisipan SQL kerap punya kolom token NULL yang membuat GoTrue menolak setiap login.

---

## 2. Matikan konfirmasi email dan pendaftaran mandiri

Supabase → **Authentication → Providers → Email**:

- **Enable Email provider** : ON
- **Confirm email** : OFF
- **Enable sign-ups** : OFF

Sign-ups dimatikan karena seluruh akun didaftarkan administrator dari dalam aplikasi.

---

## 3. Buat akun administrator pertama

Supabase → **Authentication → Users** → **Add user** → **Create new user**:

- **Email** : `admin@tanotofoundation.org` (atau alamat lain yang Anda pakai)
- **Password** : tentukan sendiri, minimal 8 karakter
- **Auto Confirm User** : **dicentang** — wajib

Klik **Create user**. Tidak perlu menyalin UID; aplikasi menanganinya sendiri.

---

## 4. Isi environment variable di Vercel

Vercel → project → **Settings → Environment Variables**. Centang **Production,
Preview, dan Development** untuk ketiganya:

| Nama | Sumber |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role |

Lalu **Deployments → deployment terakhir → ⋯ → Redeploy**. Variabel berawalan
`NEXT_PUBLIC_` disisipkan saat build, jadi menyimpannya saja tidak cukup.

Pastikan bagian `<ref>` pada `NEXT_PUBLIC_SUPABASE_URL` sama dengan `<ref>` pada URL
dashboard Supabase yang Anda pakai. Bila berbeda, aplikasi membaca database lain.

---

## 5. Login pertama

Buka `https://<domain-anda>/login`:

- **Username atau email** : alamat email dari langkah 3
- **Password** : password dari langkah 3

Saat login pertama, aplikasi membuatkan baris profil untuk akun itu dengan role
**System Administrator**, dan username diturunkan dari bagian sebelum `@` pada email
(`admin@tanotofoundation.org` → username `admin`). Setelah itu Anda dapat masuk
memakai username tersebut.

Pemberian role sysadmin otomatis ini **hanya berlaku saat tabel profiles masih
kosong**. Begitu satu profil ada, akun baru wajib didaftarkan administrator.

---

## 6. Isi data indikator

SQL Editor → jalankan berurutan:

1. `supabase/seed/seed_1_indicators.sql` — 387 indikator
2. `supabase/seed/seed_2_values.sql` — 461 baris nilai per tahun

Verifikasi:

```sql
select
  (select count(*) from public.indicators)      as indikator,
  (select count(*) from public.indicator_years) as baris_tahun,
  (select count(*) from public.profiles)        as akun;
```

Harus menghasilkan 387 / 461 / 1.

---

## 7. Daftarkan pengguna lain

Masuk sebagai administrator → **Administration › User Management** → **+ Tambah pengguna**.

Isi nama, username, email, unit, role, dan password awal. Centang *wajib ganti
password saat pertama masuk*, lalu sampaikan password itu melalui kanal terpisah.

Akun yang dibuat dari sini memakai Auth Admin API, sehingga tidak pernah mengalami
masalah kolom token NULL.

Role yang tersedia: System Administrator, PMO, Program Manager, Head of Program,
Data Contributor, Reviewer/MLE, Country Head, Executive/CEO. Pembatasan role
ditegakkan di antarmuka **dan** oleh Row Level Security di database.

---

## Bila login masih gagal

Buka `https://<domain-anda>/setup`. Halaman itu membaca database dari project yang
benar-benar dipakai aplikasi, lalu menampilkan project ref, jumlah akun, jumlah
indikator, dan ada tidaknya fungsi pendukung login.

| Yang terlihat | Kesimpulan |
|---|---|
| Akun 0 dan indikator 0, padahal SQL Anda sukses | Project ref berbeda — perbaiki `NEXT_PUBLIC_SUPABASE_URL` lalu Redeploy |
| `email_for_username` tidak ada | Migrasi 0003 belum dijalankan |
| Semua terisi wajar, login tetap ditolak | Password salah, atau Email provider mati |

Untuk menguji Supabase langsung tanpa melewati aplikasi:

```bash
curl -X POST "https://<ref>.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: <ANON_KEY>" -H "Content-Type: application/json" \
  -d '{"email":"admin@tanotofoundation.org","password":"<password>"}'
```

Muncul `access_token` berarti Supabase sehat dan masalahnya di konfigurasi Vercel.
Muncul pesan error berarti masalahnya di Supabase, dan pesannya menyebutkan penyebabnya.
