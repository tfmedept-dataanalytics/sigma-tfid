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

---

## Pemecahan masalah

### `MIDDLEWARE_INVOCATION_FAILED` / `500: INTERNAL_SERVER_ERROR` tepat setelah deploy

Middleware gagal dijalankan. Pada aplikasi ini penyebabnya hampir selalu satu hal:
**variabel environment Supabase tidak terbaca saat build**, sehingga klien Supabase
dibuat tanpa URL dan kunci, lalu melempar error di setiap request.

Tiga sebab yang paling sering, berurutan dari yang paling sering:

1. **Variabel ditambahkan setelah deployment berjalan, tanpa redeploy.**
   Variabel berawalan `NEXT_PUBLIC_` disisipkan ke dalam bundel pada saat *build*,
   bukan dibaca saat request. Menyimpannya di Settings tidak mengubah deployment yang
   sudah jadi. Buka **Deployments → deployment terakhir → ⋯ → Redeploy**.
2. **Variabel hanya dicentang untuk Preview atau Development.** Centang ketiganya:
   Production, Preview, Development.
3. **Salah nama atau ada spasi/baris baru ikut ter-paste.** Nama harus persis
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   URL harus lengkap dengan `https://` dan berakhiran `.supabase.co`.

Sejak versi ini, middleware tidak lagi menjatuhkan seluruh situs bila terjadi masalah:

- Variabel belum lengkap → seluruh permintaan diarahkan ke **`/setup`**, halaman yang
  menampilkan variabel mana yang terbaca dan mana yang tidak (tanpa menampilkan nilainya).
- Supabase tidak dapat dihubungi atau kunci ditolak → permintaan diarahkan ke `/login`
  dan penyebabnya dicatat di log Vercel, bukan menghasilkan HTTP 500.

Jadi setelah redeploy, buka `https://<domain-anda>/setup` lebih dulu: halaman itu
langsung menunjukkan apakah masalahnya ada pada environment variable atau bukan.

### Berhasil masuk halaman login, tetapi login selalu ditolak

Berarti environment sudah benar dan aplikasi terhubung ke Supabase. Periksa berurutan:

1. Kedua file di `supabase/migrations/` sudah dijalankan di SQL Editor.
2. `npm run seed` sudah dijalankan dan melaporkan akun yang dibuat.
3. Di Supabase → Authentication → Providers → Email, **Confirm email** dinonaktifkan.
4. Fungsi `public.email_for_username` ada dan dapat dieksekusi oleh role `anon`
   (dibuat oleh migrasi 0001).

### Halaman terbuka tetapi tabel kosong

Migrasi sudah jalan tetapi seed belum. Jalankan `npm run seed` dari komputer Anda
dengan `.env.local` yang memuat `SUPABASE_SERVICE_ROLE_KEY`.

### Tidak bisa masuk dengan `admin` / `sigma2026`

Halaman login sudah tampil berarti environment sudah benar. Periksa berurutan:

**1. Isi kolom Username dengan `admin`, bukan alamat email.**
Sejak migrasi `0003_login_by_email.sql`, alamat email juga diterima — tetapi migrasi itu
perlu dijalankan lebih dulu di SQL Editor pada project yang sudah terlanjur dibuat.

**2. Pastikan akunnya memang ada.** Jalankan di Supabase SQL Editor:

```sql
select username, email, role, active, must_change, last_login
from public.profiles order by username;
```

- **Tabel kosong** → `npm run seed` belum pernah dijalankan. Seed berjalan dari komputer
  Anda, bukan dari Vercel; deploy saja tidak mengisi data apa pun.
- **Baris ada tetapi `active = false`** → aktifkan lewat SQL atau lewat User Management.

**3. Buat atau reset administrator tanpa menjalankan seed penuh:**

```bash
npm run create-admin
npm run create-admin -- --username admin --password RahasiaBaru123
```

Skrip ini membuat akun bila belum ada, atau mereset password dan memastikan rolenya
System Administrator bila sudah ada. Membutuhkan `.env.local` berisi
`SUPABASE_SERVICE_ROLE_KEY`, jadi jalankan hanya dari komputer Anda sendiri.

**4. Periksa Supabase → Authentication → Providers → Email:** *Confirm email* harus
dinonaktifkan. Bila aktif, akun hasil seed ada tetapi belum terverifikasi dan login ditolak.

**5. Password sudah pernah diganti.** Seluruh akun seed ditandai wajib ganti password saat
pertama masuk. Bila seseorang sudah menggantinya, `sigma2026` tidak berlaku lagi — pakai
`npm run create-admin` untuk mereset.

Catatan: pesan "Username atau password tidak dikenali" sengaja sama untuk username salah
maupun password salah, agar halaman login tidak bisa dipakai menebak username yang terdaftar.
Karena itu pesan tersebut tidak memberi tahu mana yang salah — gunakan langkah 2 di atas.

### Cara tercepat membuat akun admin bila belum ada akses terminal

Buka Supabase - SQL Editor, jalankan isi `supabase/migrations/0004_bootstrap_admin.sql`.
File itu membuat satu akun dengan username `admin` dan password `sigma2026`.

Akun ditandai wajib ganti password, jadi begitu masuk Anda langsung diminta menggantinya.
Jalur yang lebih disarankan tetap `npm run create-admin` dari komputer Anda, karena memakai
Auth Admin API dan tidak menyentuh tabel internal `auth`. Password pada file SQL tertulis apa
adanya dan tercatat di riwayat SQL Editor - ganti segera setelah berhasil masuk.

### Login masih ditolak setelah semuanya dijalankan

Jalankan `supabase/diagnose.sql` di SQL Editor. File itu memeriksa lima hal berurutan
dan hasilnya langsung menunjukkan penyebabnya: tabel/fungsi belum ada, tidak ada akun,
password sudah berubah, email belum terkonfirmasi, baris `auth.identities` hilang, atau
profil nonaktif. Kolom `password_sigma2026` pada query nomor 3 membandingkan langsung
dengan hash yang tersimpan, jadi tidak perlu menebak.

---

## Mengisi tabel Supabase (data seed)

Deploy ke Vercel tidak mengisi satu baris pun. Data harus dimasukkan sendiri ke
Supabase. Ada dua jalur; pilih salah satu.

### Jalur A — lewat SQL Editor, tanpa perlu Node

Urutan file, jalankan satu per satu di Supabase → SQL Editor dan tunggu setiap
file selesai sebelum lanjut:

| Urutan | File | Isi |
|---|---|---|
| 1 | `supabase/migrations/0001_schema.sql` | tabel, enum, trigger, fungsi |
| 2 | `supabase/migrations/0002_rls.sql` | Row Level Security |
| 3 | `supabase/migrations/0003_login_by_email.sql` | login dengan username atau email |
| 4 | `supabase/seed/seed_1_indicators.sql` | 387 indikator (80 OPI + 307 PPI) |
| 5 | `supabase/seed/seed_2_values.sql` | 461 baris nilai per tahun 2024–2030 |
| 6 | `supabase/migrations/0004_bootstrap_admin.sql` | akun `admin` |

File nomor 4 berukuran ± 210 KB. Bila SQL Editor menolak karena kepanjangan,
buka file di editor teks, potong menjadi dua bagian pada salah satu batas baris
`),` lalu jalankan bergantian — tutup potongan pertama dengan `;` dan awali
potongan kedua dengan `insert into public.indicators (...) values`.

Setiap file seed diakhiri query hitung, jadi hasilnya langsung terlihat.
Keduanya aman dijalankan berulang: indikator di-upsert, nilai per tahun tidak
ditimpa bila barisnya sudah ada.

### Jalur B — lewat skrip, dari komputer Anda

```bash
cp .env.example .env.local     # isi URL, anon key, service_role key
npm install
npm run seed
```

Lebih disarankan bila Anda akan sering memuat ulang data: skrip mencetak
ringkasan kesiapan data di akhir, dan sekaligus membuat kedelapan akun seed.

### Memeriksa hasilnya

```sql
select
  (select count(*) from public.indicators)       as indikator,
  (select count(*) from public.indicator_years)  as baris_tahun,
  (select count(*) from public.profiles)         as akun;
```

Harus menghasilkan 387 / 461 / minimal 1. Bila `indikator` = 0 padahal SQL
tidak melaporkan error, berarti file seed belum benar-benar dijalankan.

### Mengapa tabel bisa tetap kosong

- **Row Level Security bukan penyebabnya.** SQL Editor berjalan sebagai role
  `postgres` dan melewati RLS. Kalau insert gagal, pasti ada pesan errornya.
- **Aplikasi tidak akan mengisi tabel sendiri.** SIGMA hanya membaca dan
  menulis data yang diinput pengguna; muatan awal selalu dari seed.
- **`npm run seed` menulis ke project yang tertulis di `.env.local`.** Bila
  Anda punya lebih dari satu project Supabase, pastikan URL-nya yang benar.

### Pesan "No account exists in the database yet" padahal seed sudah dijalankan

Pesan itu keliru pada build sebelum migrasi `0005_account_probe.sql`. Halaman login
memeriksa jumlah akun dengan select biasa ke `public.profiles`, sementara pada tahap
login pengguna masih anonim dan RLS menutup akses role `anon` — hasilnya selalu nol,
sehingga pesan tersebut muncul untuk kasus apa pun, termasuk username salah ketik.

Perbaikannya: jalankan `supabase/migrations/0005_account_probe.sql`, lalu deploy ulang
kode terbaru. Setelah itu pesan "belum ada akun" hanya muncul bila tabel memang kosong.

Untuk memastikan keadaan sebenarnya, jalankan di SQL Editor:

```sql
select count(*) as total, count(*) filter (where active) as aktif from public.profiles;
select public.email_for_username('admin');
```

- `aktif` > 0 tetapi `email_for_username` NULL → username tidak cocok; periksa ejaannya
  pada kolom `username`, bukan `email`.
- `total` = 0 → tabel memang kosong; jalankan `seed_1_indicators.sql`,
  `seed_2_values.sql`, dan `0004_bootstrap_admin.sql`.

### Masih tidak bisa login setelah semua langkah di atas

Jalankan **`supabase/FIX_LOGIN.sql`** — satu file yang memperbaiki sendiri seluruh
penyebab yang diketahui (fungsi pencarian akun, fungsi hitung akun, akun administrator,
konfirmasi email, baris `auth.identities`, status blokir) lalu menutup dengan satu tabel
hasil pemeriksaan. Seluruh kolom pada tabel itu harus bernilai `true`.

Bila semuanya `true` dan login tetap ditolak, penyebabnya di luar database:

1. **Confirm email masih aktif** — matikan di Authentication → Providers → Email.
2. **Vercel menunjuk project Supabase yang berbeda.** Ini penyebab yang paling sering
   terlewat: SQL dijalankan di satu project, sementara aplikasi membaca project lain.
   Bandingkan `<ref>` pada `NEXT_PUBLIC_SUPABASE_URL` di Vercel dengan `<ref>` pada URL
   dashboard Supabase yang sedang Anda buka. Harus sama persis.

### Cara tercepat mengetahui penyebabnya: buka /setup

1. Jalankan `supabase/migrations/0006_setup_status.sql` di SQL Editor.
2. Deploy ulang aplikasi.
3. Buka `https://<domain-anda>/setup`.

Halaman itu membaca database dari project yang benar-benar dipakai aplikasi, lalu
menampilkan project ref beserta jumlah akun, ada tidaknya akun `admin`, ada tidaknya
fungsi `email_for_username`, serta jumlah indikator dan baris nilai. Fungsi diagnosanya
hanya mengembalikan angka dan boolean - tidak ada username, email, atau isi indikator.

Cara membaca hasilnya:

| Yang terlihat | Kesimpulan |
|---|---|
| Akun 0, indikator 0, padahal SQL Anda sukses | Project ref berbeda - SQL masuk ke database lain |
| Akun >= 1 tetapi `admin` tidak ada | Username akunnya bukan `admin`; cek kolom `username` |
| `email_for_username` tidak ada | Jalankan `0003` atau `FIX_LOGIN.sql` |
| Semua terisi wajar tetapi login ditolak | Password salah, atau Confirm email masih aktif |

Setelah login berhasil, akses anon boleh dicabut:
`revoke execute on function public.setup_status() from anon;`

---

## Penyiapan awal dari browser (tanpa terminal, tanpa SQL)

Sejak versi ini, akun administrator pertama dan data indikator dapat dibuat langsung
dari halaman `/setup`. Prasyaratnya hanya dua:

1. `0001_schema.sql` dan `0002_rls.sql` sudah dijalankan di Supabase SQL Editor.
2. Ketiga environment variable sudah terpasang di Vercel untuk Production - termasuk
   `SUPABASE_SERVICE_ROLE_KEY` - dan project sudah di-Redeploy setelahnya.

Lalu buka `https://<domain-anda>/setup` dan tekan berurutan:

| Tombol | Yang terjadi |
|---|---|
| 1. Buat akun administrator | Membuat akun `admin`, menampilkan passwordnya satu kali |
| 2. Muat data indikator | Memuat 387 indikator dan nilai per tahunnya |

Pengaman kedua endpoint tersebut:

- Pembuatan administrator ditolak begitu sudah ada satu administrator aktif. Jadi tombol
  itu mati dengan sendirinya setelah dipakai sekali dan tidak dapat dimanfaatkan orang
  lain untuk menyelipkan akun.
- Pemuatan data ditolak bila tabel indicators sudah berisi, sehingga data yang sudah
  diinput pengguna tidak mungkin tertimpa.
- Keduanya menolak bila `SUPABASE_SERVICE_ROLE_KEY` tidak ada.
- Bootstrap dapat dimatikan permanen dengan environment variable
  `SIGMA_DISABLE_BOOTSTRAP=1`. Lakukan ini setelah administrator pertama terbentuk.

Password yang ditampilkan hanya muncul sekali dan wajib diganti saat pertama masuk.
