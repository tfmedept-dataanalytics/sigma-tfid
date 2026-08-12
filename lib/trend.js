import { createClient } from '@/lib/supabase/server';
import { achievement } from '@/lib/calc';

/**
 * Menghitung seri Performance Trend untuk seluruh tahun sekaligus.
 * Mengembalikan { years, opi, ppi, all } dengan values (rata-rata) dan counts (n).
 * Indikator tanpa target atau tanpa actual tidak dihitung — bukan dianggap nol.
 */
export async function getTrend() {
  const supabase = createClient();
  const [{ data: inds }, { data: yrs }] = await Promise.all([
    supabase.from('indicators').select('id, type, unit, calc, agg').eq('archived', false),
    supabase.from('indicator_years').select('indicator_id, year, target, q1, q2, q3, q4')
  ]);

  const metaOf = new Map((inds || []).map(i => [i.id, { unit: i.unit, calc: i.calc, agg: i.agg }]));
  const typeOf = new Map((inds || []).map(i => [i.id, i.type]));
  const years = [...new Set((yrs || []).map(r => r.year))].sort((a, b) => a - b);

  const build = filter => {
    const values = [], counts = [];
    years.forEach(y => {
      const vals = (yrs || [])
        .filter(r => r.year === y && filter(typeOf.get(r.indicator_id)))
        .map(r => achievement(r, metaOf.get(r.indicator_id)))
        .filter(v => v !== null);
      counts.push(vals.length);
      values.push(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
    });
    return { values, counts };
  };

  return {
    years: years.map(String),
    opi: build(t => t === 'OPI'),
    ppi: build(t => t === 'PPI'),
    all: build(() => true)
  };
}
