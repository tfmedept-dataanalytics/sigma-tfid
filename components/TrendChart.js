'use client';

import { pct } from '@/lib/calc';

/**
 * series: [{ label, color, values: (number|null)[], width, opacity }]
 * Nilai kosong MEMUTUS garis — menyambungkannya menyiratkan ada data pada
 * tahun yang sebenarnya kosong. Titik yang berdiri sendiri digambar penuh.
 */
function Line({ series, labels, height = 210 }) {
  const w = 620, pad = { l: 46, r: 18, t: 16, b: 30 };
  const iw = w - pad.l - pad.r, ih = height - pad.t - pad.b;
  const all = series.flatMap(s => s.values.filter(v => v !== null && v !== undefined));
  if (!all.length) {
    return <div className="nodata"><b>Belum ada data</b><span>Tidak ada nilai yang dapat ditampilkan.</span></div>;
  }
  const max = Math.max(...all) * 1.15 || 1;
  const xOf = i => pad.l + (labels.length < 2 ? iw / 2 : (iw * i) / (labels.length - 1));
  const yOf = v => pad.t + ih - (v / max) * ih;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="xMidYMid meet">
      {[0, 1, 2, 3, 4].map(g => {
        const gy = pad.t + ih - (ih * g) / 4;
        return (
          <g key={g}>
            <line x1={pad.l} y1={gy} x2={w - pad.r} y2={gy} stroke="#EDF2EF" />
            <text x={pad.l - 7} y={gy + 3.5} textAnchor="end" fontSize={9.5} fill="#8FA09A">
              {(((max * g) / 4) * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={l} x={xOf(i)} y={height - 9} textAnchor="middle" fontSize={10.5} fill="#6E7F76">{l}</text>
      ))}
      {series.map(se => {
        let d = '', prev = false, prev0 = false;
        const dots = [];
        se.values.forEach((v, i) => {
          if (v === null || v === undefined) { prev = false; prev0 = false; return; }
          prev0 = prev;
          d += (prev ? ' L' : ' M') + xOf(i).toFixed(1) + ' ' + yOf(v).toFixed(1);
          prev = true;
          const nx = se.values[i + 1];
          const lone = !prev0 && (nx === null || nx === undefined);
          dots.push(
            <circle key={i} cx={xOf(i)} cy={yOf(v)} r={lone ? 5.2 : 3.6}
                    fill={lone ? se.color : '#fff'} stroke={se.color} strokeWidth={2} opacity={se.opacity || 1}>
              <title>{`${se.label} — ${labels[i]}: ${pct(v)}`}</title>
            </circle>
          );
        });
        return (
          <g key={se.label}>
            {d && <path d={d.trim()} fill="none" stroke={se.color} strokeWidth={se.width || 2.2}
                        strokeOpacity={se.opacity || 1} strokeLinejoin="round" strokeLinecap="round" />}
            {dots}
          </g>
        );
      })}
    </svg>
  );
}

const COLORS = { opi: '#006341', rpi: '#B3A369', ppi: '#8A7A42', all: '#1F6FB2' };

export default function TrendChart({ years, opi, rpi, ppi, all, regionLabel }) {
  const cnt = a => a.filter(v => v !== null).length;
  const empty = {
    values: years.map(() => null), counts: years.map(() => 0),
    medians: years.map(() => null), overs: years.map(() => 0)
  };
  const R = rpi || empty;

  const rows = [
    { label: 'OPI — Organization', color: COLORS.opi, ...opi },
    { label: 'RPI — Regional', color: COLORS.rpi, ...R },
    { label: 'PPI — Program', color: COLORS.ppi, ...ppi },
    { label: 'Gabungan', color: COLORS.all, ...all }
  ];

  const same = (a, b) => years.every((_, i) =>
    (a[i] === null && b[i] === null) ||
    (a[i] !== null && b[i] !== null && Math.abs(a[i] - b[i]) < 1e-9));

  let thin = '';
  [['OPI', opi.values], ['RPI', R.values], ['PPI', ppi.values]].forEach(([lb, v]) => {
    const c = cnt(v);
    if (c === 0) thin += ` Seri ${lb} tidak muncul pada grafik: belum ada satu pun tahun dengan indikator ber-data.`;
    else if (c === 1) thin += ` Seri ${lb} hanya memiliki satu tahun ber-data sehingga tampil sebagai titik, bukan garis — arah perubahannya belum dapat dinilai.`;
  });

  let coincide = '';
  if (cnt(all.values) && same(all.values, opi.values) && cnt(ppi.values) === 0 && cnt(R.values) === 0) {
    coincide = ' Garis Gabungan berimpit penuh dengan OPI karena belum ada satu pun indikator RPI maupun PPI yang memiliki target dan actual sekaligus.';
  } else if (cnt(all.values) && same(all.values, opi.values)) {
    coincide = ' Garis Gabungan berimpit dengan OPI pada seluruh tahun ber-data.';
  }

  /* Seberapa jauh rata-rata terseret indikator ber-rasio ekstrem. */
  const skew = years.some((_, i) =>
    all.values[i] !== null && all.medians?.[i] != null && all.values[i] > all.medians[i] * 1.5);
  const totalOver = (all.overs || []).reduce((a, b) => a + b, 0);

  return (
    <div className="card mb">
      <div className="card-h">
        <h3>Performance Trend</h3>
        <div className="sub">
          Rata-rata capaian terhadap target per tahun pelaporan, dipisah menjadi OPI, RPI, PPI, dan
          gabungan ketiganya{regionLabel ? ` (RPI dibaca pada ${regionLabel})` : ''}. Garis yang
          terputus berarti tahun itu tidak memiliki indikator ber-data; titik penuh berarti tahun
          tersebut berdiri sendiri tanpa tahun pembanding. Seri Gabungan digambar sebagai pita lebar
          di lapisan bawah agar tetap terbaca ketika nilainya berimpit dengan seri lain.
        </div>
      </div>
      <div className="card-b">
        <Line
          labels={years}
          series={[
            { label: 'Gabungan', color: COLORS.all, values: all.values, width: 8, opacity: 0.22 },
            { label: 'OPI — Organization', color: COLORS.opi, values: opi.values },
            { label: 'RPI — Regional', color: COLORS.rpi, values: R.values },
            { label: 'PPI — Program', color: COLORS.ppi, values: ppi.values }
          ]}
        />

        <div className="row" style={{ gap: 14, marginTop: 8 }}>
          {rows.map(r => (
            <span key={r.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--muted)' }}>
              <span className="dot" style={{ background: r.color }} />
              {r.label} ({cnt(r.values)} dari {years.length} tahun ber-data)
            </span>
          ))}
        </div>

        <div className="tbl-w mt"><table>
          <thead><tr><th>Seri</th>{years.map(y => <th className="num" key={y}>{y}</th>)}</tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label}>
                <td className="t-name">
                  <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: r.color, marginRight: 7 }} />
                  {r.label}
                </td>
                {r.values.map((v, i) => (
                  <td className="num" key={i}>
                    {v === null ? <span style={{ color: 'var(--faint)' }}>—</span> : (
                      <>
                        {pct(v)}
                        <div className="t-meta" style={{ textAlign: 'right' }}>
                          median {pct(r.medians?.[i] ?? null)} · n={r.counts[i]}
                          {r.overs?.[i] > 0 ? ` · ${r.overs[i]} ≥300%` : ''}
                        </div>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table></div>

        <div className="note w mt" style={{ marginBottom: 0 }}>
          <b>Cara membaca.</b> Angka besar adalah rata-rata <i>tidak berbobot</i> dari indikator yang
          memiliki target dan actual sekaligus pada tahun tersebut; <b>median</b> dan <b>n</b> di
          bawahnya menunjukkan nilai tengah dan berapa indikator yang masuk hitungan.
          {totalOver > 0 && (
            <> Sebanyak <b>{totalOver}</b> indikator tercatat mencapai 300% atau lebih dari targetnya —
            umumnya karena targetnya sangat kecil, misalnya target 1% dengan capaian 79%. Rasio seperti
            itu menarik rata-rata jauh ke atas tanpa menggambarkan kondisi kebanyakan indikator
            {skew ? ', dan pada tahun tertentu rata-rata di sini lebih dari satu setengah kali medianya' : ''}.
            Untuk pelaporan, <b>median lebih mewakili</b>; rata-rata sebaiknya disertai catatan outlier
            ini, atau target indikator bersangkutan ditinjau ulang.</>
          )}
          {' '}Karena n berbeda antar tahun, naik-turunnya garis dapat berasal dari perubahan komposisi
          indikator yang terisi, bukan hanya dari perubahan performa. Tanda — berarti tidak ada
          indikator ber-data, bukan capaian nol.{thin}{coincide}
        </div>
      </div>
    </div>
  );
}
