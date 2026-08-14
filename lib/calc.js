/* =====================================================================
   Aturan perhitungan SIGMA — satu sumber untuk server dan client.

   Prinsip yang tidak boleh diubah tanpa keputusan sadar:
   kuartal kosong (null) berarti BELUM ADA DATA, bukan nol. Indikator tanpa
   actual dikeluarkan dari seluruh rata-rata, tidak dihitung sebagai capaian 0.
   Setiap tampilan yang memakai angka agregat wajib menyebut berapa indikator
   yang benar-benar punya data.
   ===================================================================== */

export const THRESHOLD = { ok: 95, am: 75 };

export const ROLES = {
  sysadmin: { n: 'System Administrator', scope: 'Seluruh modul, konfigurasi, dan manajemen pengguna.' },
  pmo:      { n: 'PMO',                  scope: 'Seluruh indikator OPI dan PPI; mengelola struktur, periode, dan review.' },
  pm:       { n: 'Program Manager',      scope: 'Indikator program (PPI) pada portfolio yang menjadi tanggung jawabnya.' },
  head:     { n: 'Head of Program',      scope: 'KPI organisasi (OPI) pada unit yang dipimpinnya.' },
  contrib:  { n: 'Data Contributor',     scope: 'Input dan submit data pada indikator yang ditugaskan.' },
  reviewer: { n: 'Reviewer / MLE',       scope: 'Memeriksa kualitas data dan mengembalikan yang belum layak.' },
  country:  { n: 'Country Head',         scope: 'Melihat seluruh performa dan menyetujui data tingkat organisasi.' },
  exec:     { n: 'Executive / CEO',      scope: 'Dashboard, analytics, dan laporan. Tanpa akses input.' }
};

export const CAPS = {
  sysadmin: { edit: 1, submit: 1, review: 1, approve: 1, admin: 1, config: 1, manage: 1 },
  pmo:      { edit: 1, submit: 1, review: 1, approve: 1, admin: 0, config: 0, manage: 1 },
  pm:       { edit: 1, submit: 1, review: 0, approve: 0, admin: 0, config: 0, manage: 0 },
  head:     { edit: 1, submit: 1, review: 1, approve: 0, admin: 0, config: 0, manage: 0 },
  contrib:  { edit: 1, submit: 1, review: 0, approve: 0, admin: 0, config: 0, manage: 0 },
  reviewer: { edit: 0, submit: 0, review: 1, approve: 0, admin: 0, config: 0, manage: 0 },
  country:  { edit: 0, submit: 0, review: 1, approve: 1, admin: 0, config: 0, manage: 0 },
  exec:     { edit: 0, submit: 0, review: 0, approve: 0, admin: 0, config: 0, manage: 0 }
};

export const can = (role, cap) => !!(CAPS[role] && CAPS[role][cap]);

/* Agregasi Q1–Q4 menjadi actual tahunan.

   Aturan aktif: unit Percent → MAX(Q1..Q4); unit lain → SUM(Q1..Q4).
   Setiap indikator dapat menimpanya lewat kolom `agg` ('max' | 'sum' | 'last').

   Aturan seragam tidak cocok untuk semua indikator: MAX menyesatkan pada
   persentase yang menggambarkan kondisi pada satu titik waktu (kehadiran,
   pemenuhan, prevalensi) karena melaporkan kuartal terbaik, bukan kondisi
   akhir tahun; SUM menggandakan objek yang sama pada indikator stok atau
   indeks. Untuk indikator seperti itu setel `agg = 'last'`. */
export const AGG_LABEL = { max: 'MAX kuartal', sum: 'Jumlah kuartal', last: 'Kuartal terakhir terisi' };

export function aggMode(ind) {
  if (ind && ind.agg) return ind.agg;
  return String((ind && ind.unit) || '').toLowerCase() === 'percent' ? 'max' : 'sum';
}

/** actualOf(row, ind) — ind memuat unit dan (opsional) agg. */
export function actualOf(row, ind) {
  if (!row) return null;
  const q = [row.q1, row.q2, row.q3, row.q4].map(v => (v === null || v === undefined ? null : Number(v)));
  const filled = q.filter(v => v !== null);
  if (!filled.length) return null;
  const m = aggMode(ind);
  if (m === 'max') return Math.max(...filled);
  if (m === 'sum') return filled.reduce((a, b) => a + b, 0);
  for (let i = 3; i >= 0; i--) if (q[i] !== null) return q[i];
  return null;
}

/** Capaian = actual ÷ target. null bila salah satunya tidak ada atau target 0. */
export function achievement(row, ind) {
  if (!row) return null;
  const a = actualOf(row, ind);
  const t = row.target === null || row.target === undefined ? null : Number(row.target);
  if (a === null || t === null || t === 0) return null;
  return a / t;
}

export function statusClass(a, th = THRESHOLD) {
  if (a === null || a === undefined) return 'gy';
  const p = a * 100;
  if (p >= th.ok) return 'ok';
  if (p >= th.am) return 'am';
  return 'rd';
}

export const STATUS_LABEL = { ok: 'On Track', am: 'Near Target', rd: 'At Risk', gy: 'No Data' };
export const STATUS_COLOR = { ok: '#006341', am: '#B3A369', rd: '#C0392B', gy: '#B9C4BF' };

/** Rata-rata capaian TIDAK BERBOBOT, hanya dari indikator yang punya target dan actual. */
export function scoreOf(rows) {
  const vals = rows.map(r => achievement(r.year, r)).filter(v => v !== null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function countByStatus(rows, th = THRESHOLD) {
  const c = { ok: 0, am: 0, rd: 0, gy: 0 };
  rows.forEach(r => { c[statusClass(achievement(r.year, r), th)]++; });
  return c;
}

/** Format nilai mengikuti unit. Percent disimpan desimal (0.8 → 80,0%). */
export function fmt(v, unit) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  if ((unit || '').toLowerCase() === 'percent') return (n * 100).toFixed(1).replace('.', ',') + '%';
  return n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

export function pct(v) {
  return v === null || v === undefined ? '—' : (v * 100).toFixed(1).replace('.', ',') + '%';
}

/** Nilai yang diketik pengguna → nilai simpan. Percent: 80 → 0,8. */
export function toStored(input, unit) {
  const s = String(input ?? '').trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return (unit || '').toLowerCase() === 'percent' ? n / 100 : n;
}

/** Nilai simpan → nilai yang ditampilkan di kotak input. */
export function toInput(v, unit) {
  if (v === null || v === undefined) return '';
  const n = Number(v);
  return (unit || '').toLowerCase() === 'percent' ? String(Math.round(n * 1000) / 10) : String(n);
}

export const WORKFLOW = {
  draft:     { label: 'Draft',        cls: 'b-gy' },
  submitted: { label: 'Submitted',    cls: 'b-bl' },
  review:    { label: 'Under Review', cls: 'b-gd' },
  approved:  { label: 'Approved',     cls: 'b-ok' },
  returned:  { label: 'Returned',     cls: 'b-rd' }
};
