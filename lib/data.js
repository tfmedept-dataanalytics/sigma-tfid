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

/**
 * Seluruh indikator beserta SEMUA baris tahunnya.
 * `year` menempel sebagai baris tahun aktif agar komponen lama tetap jalan;
 * `years` memuat seluruh tahun untuk tren dan annual review.
 */
export async function getAll(year) {
  const supabase = createClient();
  const [{ data: inds }, { data: yrs }, { data: cfg }] = await Promise.all([
    supabase.from('indicators').select(IND_COLS).eq('archived', false).order('id'),
    supabase.from('indicator_years').select('*'),
    supabase.from('app_config').select('key,value')
  ]);

  const byInd = new Map();
  (yrs || []).forEach(r => {
    if (!byInd.has(r.indicator_id)) byInd.set(r.indicator_id, {});
    byInd.get(r.indicator_id)[String(r.year)] = r;
  });

  const rows = (inds || []).map(i => {
    const years = byInd.get(i.id) || {};
    return { ...i, years, year: years[String(year)] || { ...EMPTY } };
  });

  const config = {};
  (cfg || []).forEach(c => { config[c.key] = c.value; });

  const allYears = [...new Set((yrs || []).map(r => String(r.year)))].sort();
  return { rows, config, allYears: allYears.length ? allYears : [String(year)] };
}

export async function getIndicators(type, year) {
  const { rows } = await getAll(year);
  return type ? rows.filter(r => r.type === type) : rows;
}

/** Seri Performance Trend untuk seluruh tahun. */
export function trendFrom(rows, years) {
  const build = filter => {
    const values = [], counts = [];
    years.forEach(y => {
      const vals = rows.filter(filter)
        .map(r => achievement(r.years[y], r))
        .filter(v => v !== null);
      counts.push(vals.length);
      values.push(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
    });
    return { values, counts };
  };
  return {
    years,
    opi: build(r => r.type === 'OPI'),
    ppi: build(r => r.type === 'PPI'),
    all: build(() => true)
  };
}
