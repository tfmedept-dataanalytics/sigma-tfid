# Berkas yang HARUS DIHAPUS dari repository

Mengunggah berkas lewat GitHub **menambah dan menimpa**, tetapi tidak pernah menghapus.
Berkas dari versi sebelumnya yang tertinggal akan tetap ikut di-build oleh Vercel dan
dapat menggagalkan build meskipun seluruh berkas baru sudah benar.

Hapus folder dan berkas berikut dari repository bila masih ada:

```
app/(app)/opi/
app/(app)/ppi/
app/(app)/analytics/
app/(app)/admin/
```

Keempatnya digantikan satu route dinamis `app/(app)/v/[id]/page.js`.

## Cara menghapus lewat web GitHub

1. Buka repo → masuk ke folder tersebut
2. Klik salah satu berkas di dalamnya → ikon tempat sampah → **Commit changes**
3. Ulangi sampai foldernya hilang sendiri (GitHub menghapus folder kosong otomatis)

## Cara menghapus lewat Git

```bash
git rm -r "app/(app)/opi" "app/(app)/ppi" "app/(app)/analytics" "app/(app)/admin"
git commit -m "Hapus route lama yang digantikan /v/[id]"
git push
```

## Cara paling bersih: ganti seluruh isi repo

```bash
git rm -r --cached .          # lupakan seluruh berkas lama
# salin isi zip terbaru ke folder repo, timpa semuanya
git add .
git commit -m "Sinkronkan penuh dengan rilis terbaru"
git push
```

## Memastikan struktur repo sudah benar

Setelah push, isi `app/` di GitHub seharusnya persis:

```
app/
  (app)/
    account/password/page.js
    dashboard/page.js
    v/[id]/page.js
    layout.js
  api/admin/users/route.js
  api/setup/bootstrap/route.js
  api/setup/seed/route.js
  auth/actions.js
  login/page.js
  setup/page.js
  globals.css
  layout.js
  page.js
```

Bila ada folder lain di bawah `app/(app)/`, itu sisa versi lama — hapus.

---

## Cara membaca pesan error Vercel yang sebenarnya

Baris `Command "npm run build" exited with 1` hanyalah **ringkasan**, bukan penyebabnya.
Penyebabnya tertulis beberapa baris di atasnya.

1. Buka Vercel → **Deployments** → klik deployment yang gagal
2. Buka **Build Logs**, gulir ke bagian **bawah**
3. Cari baris yang diawali salah satu dari:
   - `Failed to compile.`
   - `Module not found: Can't resolve '...'`
   - `Error:` atau `SyntaxError:`
4. Baris tepat di bawahnya menyebut **berkas mana** yang bermasalah

Pola yang paling sering pada repositori yang diperbarui lewat unggahan web:

| Pesan | Artinya |
|---|---|
| `Can't resolve '@/lib/trend'` | berkas lama `app/(app)/opi/` dsb. masih ada |
| `Can't resolve '@/supabase/seed/sigma-seed.json'` | berkas seed tidak ikut ter-commit |
| `Can't resolve '@/components/...'` | sebagian folder `components/` tidak ikut terunggah |
| `Unexpected token` / `SyntaxError` | berkas terunggah sebagian atau rusak |

Ketiganya bermuara pada satu hal yang sama: **isi repositori tidak sama persis dengan
isi zip.** Cara paling pasti mengatasinya ada di bawah.

---

## Cara paling pasti: samakan repositori dengan zip

Ini menghapus seluruh kemungkinan berkas lama tertinggal sekaligus.

```bash
git clone https://github.com/<akun>/sigma-tfid.git
cd sigma-tfid

git rm -r --cached . -q          # lupakan seluruh berkas yang terdaftar
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# salin SELURUH isi folder sigma-tanoto dari zip ke sini

git add .
git status                        # periksa: harus ada app/, components/, lib/, supabase/, public/
git commit -m "Sinkronkan penuh dengan rilis terbaru"
git push
```

Setelah push, buka repo di GitHub dan pastikan `supabase/seed/sigma-seed.json`
benar-benar ada dan berukuran sekitar 340 KB.
