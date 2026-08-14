/* Penanda rilis. Naikkan setiap kali ada perubahan yang perlu diverifikasi
   sudah sampai ke server, agar tidak perlu menebak build mana yang aktif. */
export const BUILD = {
  version: '1.6.0',
  date: '2026-08-14',
  notes: 'Tombol Buka form + drawer detail untuk OPI, RPI, dan PPI; panel definisi & catatan; Indicator/Year Management; filter kerangka & region; seri RPI pada Performance Trend'
};

/** Daftar penanda fitur — dipakai halaman /setup untuk memastikan build. */
export const FEATURES = [
  ['Tombol "Buka form" pada tabel OPI, RPI, dan PPI', '1.6.0'],
  ['Panel definisi & catatan indikator pada Quarterly Update', '1.6.0'],
  ['Indicator & Year Management (tambah indikator dan periode)', '1.5.0'],
  ['Filter kerangka OPI/RPI/PPI pada Analytics dan AI', '1.4.0'],
  ['Seri RPI pada Performance Trend + median', '1.4.0'],
  ['Modul Regional Performance (RPI)', '1.3.0'],
  ['Pemilih bahasa yang menerjemahkan seluruh halaman', '1.5.0']
];
