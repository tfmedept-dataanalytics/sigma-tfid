/* =====================================================================
   Dwibahasa — Bahasa Indonesia (default) dan English.

   Kunci ditulis dalam Bahasa Indonesia agar teks default tetap terbaca
   di dalam kode; t('...') mengembalikan kunci itu sendiri bila belum ada
   terjemahannya, sehingga string yang terlewat tampil apa adanya dan
   bukan sebagai placeholder kosong.
   ===================================================================== */

export const LANGS = { id: 'Bahasa Indonesia', en: 'English' };
export const DEFAULT_LANG = 'id';

const EN = {
  // login
  'Masuk ke SIGMA': 'Sign in to SIGMA',
  'Gunakan akun yang didaftarkan oleh System Administrator.': 'Use an account registered by the System Administrator.',
  'Akun dibuat melalui Administration › User Management.': 'Accounts are created in Administration › User Management.',
  'Satu tempat untuk performa organisasi dan program.': 'One place for organization and program performance.',
  'Menyatukan Organization Performance Indicators (OPI) dan Program Performance Indicators (PPI) dalam satu struktur data, dari Vision hingga indikator, lengkap dengan alur review dan jejak audit.':
    'Brings Organization Performance Indicators (OPI) and Program Performance Indicators (PPI) into a single data structure, from Vision down to indicator, with a review flow and an audit trail.',
  'Memeriksa…': 'Checking…',
  'Masuk': 'Sign in',
  'Username': 'Username',
  'nama.pengguna': 'name.surname',
  'Dari manual reporting menuju Performance Intelligence.': 'From manual reporting to Performance Intelligence.',
  'Password': 'Password',

  // navigasi & shell
  'Home': 'Home',
  'Organization Performance': 'Organization Performance',
  'Program Performance': 'Program Performance',
  'Analytics & Insights': 'Analytics & Insights',
  'Administration': 'Administration',
  'Executive Dashboard': 'Executive Dashboard',
  'KPI Repository & Quarterly Update': 'KPI Repository & Quarterly Update',
  'Indicator Repository & Quarterly Update': 'Indicator Repository & Quarterly Update',
  'Pathway Diagram': 'Pathway Diagram',
  'User Management': 'User Management',
  'Ganti password': 'Change password',
  'Keluar': 'Sign out',
  'Tahun pelaporan': 'Reporting year',
  'Bahasa / Language': 'Bahasa / Language',

  // umum
  'Indikator': 'Indicator',
  'Total indikator': 'Total indicators',
  'Ber-capaian': 'With achievement',
  'Rata-rata capaian': 'Average achievement',
  'At Risk': 'At Risk',
  'On Track': 'On Track',
  'Near Target': 'Near Target',
  'No Data': 'No Data',
  'Status': 'Status',
  'Workflow': 'Workflow',
  'Target': 'Target',
  'Actual YTD': 'Actual YTD',
  'Capaian': 'Achievement',
  'Trend': 'Trend',
  'Tahun': 'Year',
  'baris': 'rows',
  'Semua status capaian': 'All achievement statuses',
  'Cari indikator, kode, portfolio…': 'Search indicator, code, portfolio…',
  'Tidak ada indikator yang cocok': 'No matching indicator',
  'Ubah kata kunci atau filter status.': 'Change the keywords or the status filter.',
  'dari': 'of',
  'indikator': 'indicators',
  'KPI organisasi': 'organization KPIs',
  'indikator program': 'program indicators',
  'punya target dan actual sekaligus': 'have both a target and an actual',
  'dihitung dari': 'computed from',
  'indikator saja': 'indicators only',
  'di bawah 75% dari target': 'below 75% of target',
  'Memuat…': 'Loading…',
  'Buka detail': 'Open detail',
  'Detail indikator': 'Indicator detail',
  'Kuartal': 'Quarter',
  'Notifikasi': 'Notifications',
  'Unduh CSV': 'Download CSV',
  'Ubah': 'Edit',

  // dashboard
  'Ringkasan performa organisasi dan program. Seluruh angka rata-rata hanya menghitung indikator yang memiliki target dan actual sekaligus.':
    'A summary of organization and program performance. Every average counts only indicators that have both a target and an actual.',
  'Kesiapan data.': 'Data readiness.',
  'Lanjut ke': 'Continue to',
  'Ber-data': 'With data',

  // repository
  'Ubah nilai Q1–Q4 dan target langsung di tabel. Perubahan tersimpan saat kotak input kehilangan fokus, tercatat di indicator_history, dan menurunkan status Approved kembali ke Draft.':
    'Edit Q1–Q4 values and the target directly in the table. Changes save when the input loses focus, are recorded in indicator_history, and drop an Approved status back to Draft.',
  'Role Anda tidak memiliki hak input pada kerangka': 'Your role has no input rights in framework',
  'Nilai ditampilkan sebagai teks. Pembatasan yang sama ditegakkan ulang oleh Row Level Security di database, bukan hanya di layar ini.':
    'Values are shown as text. The same restriction is enforced again by Row Level Security in the database, not only on this screen.',

  // pathway
  'Semua': 'All',
  'Tampilkan level indikator': 'Show indicator level',
  'Longgarkan filter atau ganti tahun.': 'Relax the filter or change the year.',
  'Tidak ada indikator pada kombinasi filter ini': 'No indicator matches this filter combination',

  // user management
  'Tambah pengguna': 'Add user',
  'Tutup formulir': 'Close form',
  'Nama lengkap': 'Full name',
  'Email': 'Email',
  'Unit / Portfolio': 'Unit / Portfolio',
  'Role': 'Role',
  'Password awal': 'Initial password',
  'Wajib ganti password saat pertama masuk': 'Require a password change at first sign-in',
  'Simpan akun': 'Save account',
  'Menyimpan…': 'Saving…',
  'administrator aktif': 'active administrators',
  'Aktif': 'Active',
  'Nonaktif': 'Inactive',
  'Terakhir masuk': 'Last sign-in',
  'belum pernah': 'never',
  'Anda': 'You',
  'Reset password': 'Reset password',
  'Aktifkan': 'Activate',
  'Nonaktifkan': 'Deactivate',
  'Hapus': 'Delete',
  'wajib ganti password': 'password change required'
};

const TABLES = { id: {}, en: EN };

export function translator(lang) {
  const table = TABLES[lang] || {};
  return function t(key) {
    return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
  };
}
