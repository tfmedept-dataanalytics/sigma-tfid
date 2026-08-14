import { achievement } from '@/lib/calc';

/** Versi client dari perhitungan seri tren — dipakai halaman Trend Analysis. */
export function trendFrom(rows, years) {
  const build = filter => {
    const values = [], counts = [];
    years.forEach(y => {
      const vals = rows.filter(filter)
        .map(r => achievement(r.years?.[y], r))
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
