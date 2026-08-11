# Panduan Publikasi — GitHub → Supabase → Vercel

Urutannya penting: **Supabase dulu**, karena Vercel membutuhkan kredensialnya saat deploy.

---

## 1. Supabase — database dan autentikasi

1. Buat project baru di [supabase.com](https://supabase.com). Pilih region terdekat
   (Singapore untuk pengguna di Indonesia). Simpan **Database Password** yang Anda tetapkan.
2. Buka **SQL Editor**, jalankan berurutan:
   - isi `supabase/migrations/0001_schema.sql`
   - isi `supabase/migrations/0002_rls.sql`

   Pastikan keduanya selesai tanpa error sebelum lanjut.
3. Buka **Authentication → Providers → Email**: aktifkan, lalu **matikan "Confirm email"**.
   Akun dibuat administrator dengan `email_confirm: true`, jadi tidak ada email verifikasi
   yang perlu ditunggu.
4. Buka **Authentication → Providers**: pastikan **"Enable sign-ups"** dinonaktifkan.
   Pendaftaran mandiri tidak dipakai; seluruh akun dibuat administrator.
5. Salin dari **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

> **service_role melewati seluruh Row Level Security.** Kunci ini hanya boleh ada di
> environment server (Vercel) dan di `.env.local` Anda. Jangan pernah memberinya awalan
> `NEXT_PUBLIC_`, jangan memakainya di komponen client, dan jangan meng-commit-nya.

### Mengisi data awal

```bash
cp .env.example .env.local     # isi ketiga kunci di atas
npm install
npm run seed
```

Skrip akan memuat 387 indikator, seluruh baris tahun 2024–2030, dan 8 akun awal
(`admin`, `s.wijaya`, `b.prakoso`, `r.dewi`, `d.anugrah`, `y.hartanti`, `a.nugroho`,
`exec.office`). Semua memakai password `SEED_DEFAULT_PASSWORD` dan **wajib menggantinya
saat pertama masuk**. Ganti nilai default itu di `.env.local` sebelum menjalankan seed
bila lingkungan ini akan dipakai sungguhan.

Menjalankan ulang `npm run seed` aman — baris yang sudah ada tidak ditimpa. Gunakan
`node scripts/seed.mjs --force` hanya bila Anda memang ingin mengembalikan nilai ke kondisi file sumber;
perintah itu akan menimpa nilai kuartal yang sudah diisi pengguna.

---

## 2. GitHub

```bash
git init
git add .
git commit -m "SIGMA — Tanoto Foundation performance platform"
git branch -M main
git remote add origin https://github.com/<akun>/sigma-tanoto.git
git push -u origin main
```

`.gitignore` sudah mengecualikan `.env.local`, `node_modules/`, dan `.next/`.
Sebelum push pertama, pastikan tidak ada kunci yang ikut ter-commit:

```bash
git grep -n "service_role\|eyJhbGciOi" -- . ':!*.md'
```

Perintah itu seharusnya tidak mengembalikan apa pun selain contoh di `.env.example`.

---

## 3. Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** repository GitHub tadi.
   Framework terdeteksi otomatis sebagai Next.js; biarkan build command dan output default.
2. Pada **Environment Variables**, tambahkan untuk *Production*, *Preview*, dan *Development*:

   | Nama | Sumber |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |
   | `SUPABASE_SERVICE_ROLE_KEY` | idem — **jangan** beri awalan `NEXT_PUBLIC_` |

3. **Deploy.** Build memakan waktu sekitar satu menit.
4. Setelah live, buka Supabase → **Authentication → URL Configuration**, isi
   **Site URL** dengan domain Vercel Anda (mis. `https://sigma-tanoto.vercel.app`) dan
   tambahkan domain itu ke **Redirect URLs**.
5. Masuk sebagai `admin`, ganti password saat diminta, lalu daftarkan pengguna sungguhan
   di Administration › User Management dan nonaktifkan akun seed yang tidak dipakai.

---

## Setelah live — daftar periksa

- [ ] Password seluruh akun seed sudah diganti, akun yang tidak dipakai dinonaktifkan.
- [ ] Sign-ups di Supabase Auth dalam keadaan nonaktif.
- [ ] Coba masuk dengan role non-admin: menu Administration tidak muncul, dan percobaan
      membuka `/admin/users` langsung dialihkan ke dashboard.
- [ ] Coba ubah nilai sebagai Program Manager pada indikator OPI: harus ditolak RLS,
      bukan hanya disembunyikan di layar.
- [ ] Backup Supabase aktif (Project Settings → Database → Backups; Point-in-Time Recovery
      tersedia pada paket berbayar).

---

## Catatan operasional

**Migrasi berikutnya.** Tambahkan file bernomor di `supabase/migrations/` dan jalankan lewat
SQL Editor, atau pakai Supabase CLI:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

**Connection string.** Bila nanti ada skrip atau ETL yang menyambung langsung ke Postgres,
gunakan **Transaction Pooler (port 6543)** untuk runtime dan **Direct connection (port 5432)**
untuk migrasi. Menjalankan migrasi lewat pooler menyebabkan kegagalan yang sulit dilacak.

**Batas yang perlu disadari.** RLS versi ini membatasi pada tingkat role dan kerangka
(OPI/PPI). Pembatasan per portfolio — misalnya Program Manager hanya boleh menyentuh
indikator portfolio-nya — memerlukan kebijakan tambahan yang membandingkan
`profiles.unit` dengan `indicators.portfolio`. Kolomnya sudah tersedia; kebijakannya
belum ditulis karena pemetaan unit ke portfolio perlu dikonfirmasi lebih dulu.
