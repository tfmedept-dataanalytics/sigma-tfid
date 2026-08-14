import { achievement } from '@/lib/calc';

/** Versi client dari perhitungan seri tren — dipakai halaman Trend Analysis. */
export function trendFrom(rows, years) {
  const build = filter => {
    const values = [], counts = [], medians = [], overs = [];
    years.forEach(y => {
      const vals = rows.filter(filter)
        .map(r => achievement(r.years?.[y], r))
        .filter(v => v !== null)
        .sort((a, b) => a - b);
      counts.push(vals.length);
      values.push(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
      medians.push(vals.length
        ? (vals.length % 2 ? vals[(vals.length - 1) / 2]
                           : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2)
        : null);
      overs.push(vals.filter(v => v >= 3).length);
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
