/* Penanda build. Ditampilkan di sidebar dan halaman /setup supaya dapat
   dipastikan versi mana yang benar-benar berjalan di server — tanpa ini,
   perbedaan antara "belum ter-deploy" dan "belum diperbaiki" sulit dibedakan
   dari layar.

   Diekspor dalam dua bentuk — konstanta terpisah dan objek BUILD — karena
   keduanya sempat dipakai di tempat berbeda. Mengekspor keduanya membuat
   impor mana pun tetap sah, sehingga tidak ada lagi nilai undefined yang
   menjatuhkan halaman saat dirender. */
export const APP_VERSION = '1.6.3';
export const BUILD_DATE = '2026-08-15';
export const BUILD_NOTES = 'Perbaikan impor melingkar RegionalTable, penangkap error yang menampilkan pesan aslinya';

export const BUILD = {
  version: APP_VERSION,
  date: BUILD_DATE,
  notes: BUILD_NOTES
};

export default BUILD;

/* Daftar fitur beserta versi kemunculannya. Dipakai halaman /setup untuk
   menunjukkan apakah build yang berjalan sudah memuat fitur tertentu —
   supaya "belum ter-deploy" tidak lagi tertukar dengan "belum dibuat". */
export const FEATURES = [
  ['Modul RPI dan dimensi region', '1.4.0'],
  ['Filter OPI/RPI/PPI pada Analytics dan AI Assistant', '1.5.0'],
  ['Seri RPI pada Performance Trend, median pada tabel tren', '1.5.1'],
  ['Tambah indikator dan periode dari antarmuka', '1.5.2'],
  ['Tombol Buka form dan drawer indikator pada OPI/RPI/PPI', '1.6.0'],
  ['Panel definisi dan catatan pada Quarterly Update', '1.6.0'],
  ['Terjemahan insights dan report summary', '1.6.0'],
  ['Field Definition dan Mean of Verification untuk OPI dan RPI', '1.6.1'],
  ['Narasi login diperbarui', '1.6.2'],
  ['Pesan error ditampilkan di layar, bukan layar kosong', '1.6.3']
];
