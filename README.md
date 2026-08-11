# SIGMA — Tanoto Foundation

**Strategic Information for Governance, Monitoring & Analytics**

Platform performa yang menyatukan **Organization Performance Indicators (OPI)** dan
**Program Performance Indicators (PPI)** dalam satu model data, dari Vision hingga indikator,
lengkap dengan quarterly update, alur review, dan jejak audit.

Stack: **Next.js 14 (App Router) · Supabase (Postgres + Auth + RLS) · Vercel**

---

## Isi repositori

```
app/
  login/                    halaman login (username + password, panel 3/4 : 1/4)
  auth/actions.js           server action: sign in, sign out, ganti password
  (app)/                    area terproteksi — layout dengan sidebar & topbar
    dashboard/              Executive Dashboard
    opi/                    KPI Repository & Quarterly Update (OPI)
    ppi/                    Indicator Repository & Quarterly Update (PPI)
    analytics/pathway/      Pathway Diagram
    admin/users/            User Management (khusus System Administrator)
    account/password/       ganti password sendiri
  api/admin/users/          route handler service-role untuk kelola akun
components/
  IndicatorTable.js         tabel dengan input Q1–Q4 inline + sparkline SVG
  Pathway.js                diagram Sankey Indicator → Project → Portfolio → ToC Foundation
  UserAdmin.js, Sidebar.js, TopBar.js
lib/
  calc.js                   aturan perhitungan capaian, role, format nilai
  data.js                   query indikator dan tahun
  supabase/                 client browser, server, middleware
supabase/
  migrations/0001_schema.sql   tabel, enum, trigger, fungsi
  migrations/0002_rls.sql      Row Level Security
  seed/sigma-seed.json         387 indikator (80 OPI + 307 PPI) + 8 akun awal
scripts/seed.mjs             pengisian data awal ke Supabase
```

---

## Model data

Satu tabel `indicators` menampung OPI dan PPI (dibedakan kolom `type`), sesuai keputusan
desain agar analitik lintas kerangka tidak perlu menyatukan dua sumber. Nilai per periode
ada di `indicator_years` dengan primary key `(indicator_id, year)`.

**Konvensi nilai yang tidak boleh diubah tanpa keputusan sadar:**

| Hal | Aturan |
|---|---|
| Kuartal kosong | `NULL` = **belum ada data**, bukan nol. Dikeluarkan dari seluruh agregasi. |
| Unit Percent | Disimpan sebagai desimal (`0.8` = 80%), konsisten dengan file Excel sumber. |
| Actual — unit Percent | **MAX** dari Q1–Q4 yang terisi. |
| Actual — unit selain Percent | **Jumlah** seluruh kuartal yang terisi. |
| Pengecualian per indikator | Kolom `agg` (`max` / `sum` / `last`) menimpa aturan di atas. |
| Capaian | `actual ÷ target`. `NULL` bila salah satunya tidak ada. |
| Ambang status | On Track ≥95%, Near Target ≥75%, di bawahnya At Risk, sisanya No Data. |

> **Aturan agregasi seragam punya batas.** MAX untuk unit Percent tepat bila persentase
> bersifat kumulatif atau "pernah tercapai", tetapi menyesatkan untuk persentase yang
> menggambarkan kondisi pada satu titik waktu — tingkat kehadiran, tingkat pemenuhan,
> prevalensi — karena melaporkan kuartal terbaik, bukan kondisi akhir tahun. Demikian pula
> SUM untuk unit Number keliru pada indikator stok atau indeks (jumlah unit aktif, skor,
> unit cost), karena menjumlahkan objek yang sama berkali-kali. Setel `agg = 'last'` pada
> indikator seperti itu.

Rata-rata capaian di seluruh layar adalah **rata-rata tidak berbobot** dari indikator yang
punya target *dan* actual. Karena itu setiap kartu skor menampilkan jumlah indikator ber-data
di sampingnya — angka rata-rata tanpa konteks itu akan melebih-lebihkan performa.

---

## Kondisi data awal — baca sebelum menyimpulkan apa pun

Tiga temuan dari file sumber, yang ikut dibawa apa adanya oleh seed:

1. **File PPI tidak memuat satu pun actual per kuartal.** Kolom Q1–Q4 kosong di seluruh tahun.
   Yang tersedia adalah struktur, definisi, mean of verification, dan target. Akibatnya 307
   indikator PPI tampil sebagai *No Data* sampai diisi lewat Quarterly Update. Ini kondisi
   data, bukan kesalahan sistem.
2. **Target PPI belum lengkap.** Hanya 98 dari 315 baris sumber yang punya Target 2026
   (Target 2025: 27 baris, 2027: 11, Target 2030: 8). Penetapan target perlu menjadi agenda
   tersendiri sebelum pelaporan capaian bermakna.
3. **OPI dilaporkan semesteran, bukan kuartalan.** Q2 dan Q4 terisi jauh lebih padat daripada
   Q1 dan Q3. Bila SIGMA dijalankan sebagai siklus kuartalan penuh, itu perubahan proses
   pelaporan — bukan sekadar perubahan sistem.

---

## Autentikasi

Layar login memakai **username + password**; Supabase Auth sendiri berbasis email, jadi
username dipetakan ke email lewat fungsi `public.email_for_username()` (SECURITY DEFINER,
hanya mengembalikan akun aktif). Bila akun dibuat tanpa email, sistem memakai alias internal
`username@sigma.local`.

- **Tidak ada pendaftaran mandiri.** Akun dibuat System Administrator di
  Administration › User Management, sekaligus penetapan role.
- Pesan gagal login sengaja sama untuk username tidak dikenal maupun password salah, agar
  halaman login tidak bisa dipakai memastikan username mana yang terdaftar.
- Administrator dapat mereset password, menonaktifkan, dan menghapus akun. Sistem menolak
  tindakan yang menyisakan nol System Administrator aktif.
- Penandaan "wajib ganti password" memaksa penggantian saat pengguna pertama kali masuk.

Pembatasan role ditegakkan **dua lapis**: di antarmuka (menu dan kolom input) dan di database
lewat Row Level Security. Lapis kedua yang menentukan — menyembunyikan tombol saja bukan kontrol akses.

---

## Cakupan versi ini

Sudah ada: autentikasi dan RBAC, Executive Dashboard, repository OPI dan PPI dengan quarterly
update inline plus sparkline, Pathway Diagram, User Management, audit trail, dan skema database
lengkap dengan RLS.

Belum diport dari prototipe single-file (`SIGMA_Tanoto_Foundation.html`): Strategy Map, Program
Structure tree, Annual Review, tujuh modul analytics lainnya, AI Performance Assistant, Reporting,
Workflow & Approval, dan sisa layar Administration. Struktur data dan `lib/calc.js` sudah menampung
seluruhnya, sehingga penambahan berikutnya berupa halaman baru, bukan perubahan skema.

---

## Tipografi dan bahasa

**Font.** Seluruh antarmuka memakai **Inter 18pt Regular**, dimuat dari
`public/fonts/inter-18pt-regular.woff2` (subset Latin, 16 KB). Berkas TTF aslinya
disertakan di folder yang sama. Hanya berat Regular yang tersedia, sehingga teks
tebal (600–800) dirender sebagai *synthetic bold* oleh browser. Bila diperlukan
ketebalan yang benar, tambahkan Inter Medium/SemiBold/Bold sebagai `@font-face`
terpisah di `app/globals.css`.

**Dua bahasa.** Bahasa Indonesia adalah default; English tersedia melalui pemilih
bahasa di halaman login dan di top bar. Pilihan disimpan di `localStorage`.
Terjemahan ada di `lib/i18n.js`, dipakai lewat hook `useLang()`. Kunci kamus
ditulis dalam Bahasa Indonesia dan `t()` mengembalikan kunci itu sendiri bila
terjemahannya belum ada — jadi string yang terlewat tampil dalam Bahasa Indonesia,
bukan sebagai teks kosong. Cakupan saat ini: login, shell, dashboard, kedua
repository, pathway, dan user management.

---

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local     # isi kredensial Supabase
npm run seed                   # setelah kedua migrasi diterapkan
npm run dev
```

Langkah publikasi ke GitHub, Supabase, dan Vercel ada di [DEPLOYMENT.md](./DEPLOYMENT.md).
