import { createClient } from '@/lib/supabase/server';
import { achievement } from '@/lib/calc';

/** Daftar tahun yang tersedia pada indicator_years. */
export async function getYears() {
  const supabase = createClient();
  const { data } = await supabase.from('indicator_years').select('year').order('year');
  const set = [...new Set((data || []).map(r => String(r.year)))];
  return set.length ? set : [String(new Date().getFullYear())];
}

const IND_COLS = 'id,type,name,code,unit,calc,agg,t2030,strategy_map,outcome,accountability,' +
  'program,details,toc_foundation,portfolio,project,level,result_statement,definition,mov,period';

const EMPTY = { target: null, q1: null, q2: null, q3: null, q4: null, status: 'draft' };
export const NATIONAL = 'National';
export const ACCUM = 'Akumulasi Regional';
export const RPI_REGIONS = ['Jawa', 'Sumatera-A', 'Sumatera-B', 'Kalimantan'];

/**
 * Seluruh indikator beserta SEMUA baris tahunnya.
 * `year` menempel sebagai baris tahun aktif agar komponen lama tetap jalan;
 * `years` memuat seluruh tahun untuk tren dan annual review.
 */
export async function getAll(year) {
  const supabase = createClient();
  const [{ data: inds }, { data: yrs }, { data: cfg }, { data: ev }] = await Promise.all([
    supabase.from('indicators').select(IND_COLS).eq('archived', false).order('id'),
    supabase.from('indicator_years').select('*'),
    supabase.from('app_config').select('key,value'),
    /* Jumlah evidence per indikator pada tahun aktif — ditampilkan sebagai
       kolom pada Quarterly Update agar terlihat mana yang angkanya belum
       dapat diverifikasi tanpa harus membuka satu per satu. */
    supabase.from('evidence').select('indicator_id, region').eq('year', Number(year))
  ]);

  const evCount = new Map();
  (ev || []).forEach(r => {
    const k = r.indicator_id;
    evCount.set(k, (evCount.get(k) || 0) + 1);
    const kr = k + '|' + (r.region || NATIONAL);
    evCount.set(kr, (evCount.get(kr) || 0) + 1);
  });

  /* `years[tahun]`     → baris National, dipakai OPI/PPI dan sebagai rujukan RPI
     `regions[tahun][r]` → baris tiap region, hanya terisi untuk RPI.
     Baris lama tanpa kolom region diperlakukan sebagai National. */
  const byInd = new Map();
  (yrs || []).forEach(r => {
    const reg = r.region || NATIONAL;
    if (!byInd.has(r.indicator_id)) byInd.set(r.indicator_id, { years: {}, regions: {} });
    const e = byInd.get(r.indicator_id);
    const y = String(r.year);
    if (!e.regions[y]) e.regions[y] = {};
    e.regions[y][reg] = r;
    if (reg === NATIONAL) e.years[y] = r;
  });

  const rows = (inds || []).map(i => {
    const e = byInd.get(i.id) || { years: {}, regions: {} };
    if (i.type === 'RPI') accumulate(i, e);
    const years = i.type === 'RPI'
      ? Object.fromEntries(Object.entries(e.regions).map(([y, r]) => [y, r[ACCUM] || { ...EMPTY }]))
      : e.years;
    return {
      ...i, years, regions: e.regions,
      year: years[String(year)] || { ...EMPTY },
      evCount: evCount.get(i.id) || 0,
      evByRegion: Object.fromEntries(
        [...evCount.keys()]
          .filter(k => k.startsWith(i.id + '|'))
          .map(k => [k.slice(i.id.length + 1), evCount.get(k)])
      )
    };
  });

  const config = {};
  (cfg || []).forEach(c => { config[c.key] = c.value; });

  const allYears = [...new Set((yrs || []).map(r => String(r.year)))].sort();
  const regions = config.regions || [...RPI_REGIONS, ACCUM];
  return {
    rows, config, regions,
    allYears: allYears.length ? allYears : [String(year)]
  };
}

export async function getIndicators(type, year) {
  const { rows } = await getAll(year);
  return type ? rows.filter(r => r.type === type) : rows;
}

/** Seri Performance Trend untuk seluruh tahun. */
export function trendFrom(rows, years) {
  const build = filter => {
    const values = [], counts = [], medians = [], overs = [];
    years.forEach(y => {
      const vals = rows.filter(filter)
        .map(r => achievement(r.years[y], r))
        .filter(v => v !== null)
        .sort((a, b) => a - b);
      counts.push(vals.length);
      values.push(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
      /* Median dilaporkan berdampingan dengan rata-rata. Rata-rata tidak
         berbobot mudah didominasi sedikit indikator ber-rasio ekstrem —
         target kecil dengan capaian besar menghasilkan ribuan persen — dan
         angka seperti itu tidak menggambarkan kondisi kebanyakan indikator. */
      medians.push(vals.length
        ? (vals.length % 2 ? vals[(vals.length - 1) / 2]
                           : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2)
        : null);
      overs.push(vals.filter(v => v >= 3).length);   // capaian >= 300%
    });
    return { values, counts, medians, overs };
  };
  return {
    years,
    opi: build(r => r.type === 'OPI'),
    rpi: build(r => r.type === 'RPI'),
    ppi: build(r => r.type === 'PPI'),
    all: build(() => true)
  };
}

/* ---------------------------------------------------------------------
   Akumulasi Regional dihitung, bukan disimpan.

   Q1–Q4 akumulasi adalah PENJUMLAHAN nilai kuartal keempat region. Nilai
   yang tersimpan di database untuk baris ini hanya target akumulasi dan
   catatan; kuartalnya selalu diturunkan agar tidak pernah berbeda dari
   penjumlahan regionnya sendiri.

   Pengecualian unit Percent: menjumlahkan persentase antar region tidak
   bermakna (4 region masing-masing 80% tidak menghasilkan 320%). Untuk unit
   itu akumulasi diisi RATA-RATA tidak berbobot dari region yang punya nilai,
   dan ditandai `pctAvg: true` agar tampilan dapat menyatakannya. Rata-rata
   tidak berbobot dipakai karena sistem tidak menyimpan populasi atau bobot
   tiap region — pembobotan yang benar memerlukan data yang tidak ada.
   --------------------------------------------------------------------- */
function accumulate(ind, entry) {
  const isPct = String(ind.unit || '').toLowerCase() === 'percent';
  Object.keys(entry.regions).forEach(y => {
    const byRegion = entry.regions[y];
    const parts = RPI_REGIONS.map(r => byRegion[r]).filter(Boolean);
    const stored = byRegion[ACCUM] || {};
    const q = {};
    ['q1', 'q2', 'q3', 'q4'].forEach(k => {
      const vals = parts.map(p => p[k]).filter(v => v !== null && v !== undefined).map(Number);
      if (!vals.length) { q[k] = null; return; }
      q[k] = isPct
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : vals.reduce((a, b) => a + b, 0);
    });
    byRegion[ACCUM] = {
      ...stored,
      indicator_id: ind.id, year: Number(y), region: ACCUM,
      target: stored.target ?? null,
      ...q,
      status: stored.status || 'draft',
      computed: true,
      pctAvg: isPct,
      contributors: parts.length
    };
  });
}
