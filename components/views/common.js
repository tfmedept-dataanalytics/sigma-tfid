'use client';

import { useMemo, useState } from 'react';
import { achievement, actualOf, statusClass, STATUS_LABEL, fmt, pct } from '@/lib/calc';
import { Card, Kpi, Note, NoData, PageHead, Badge, StatusBadge, WfBadge, Progress, Spark, BarList, statSummary, ReadinessNote } from '@/components/ui';

export { Card, Kpi, Note, NoData, PageHead, Badge, StatusBadge, WfBadge, Progress, Spark, BarList, statSummary, ReadinessNote };
export { achievement, actualOf, statusClass, STATUS_LABEL, fmt, pct };
export { useMemo, useState };

/** Kelompokkan indikator menurut satu field, hitung skor tiap kelompok. */
export function groupBy(rows, key, year) {
  const m = new Map();
  rows.forEach(r => {
    const k = r[key] || '(tidak diisi)';
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  });
  return [...m.entries()].map(([k, list]) => {
    const vals = list.map(r => achievement(r.years?.[year] || r.year, r)).filter(v => v !== null);
    return {
      key: k, list,
      n: list.length,
      withA: vals.length,
      score: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    };
  }).sort((a, b) => a.key.localeCompare(b.key));
}

/** Kartu ringkas empat status. */
export function StatusCards({ rows, year }) {
  const s = statSummary(rows, year);
  return (
    <div className="grid g4 mb">
      <Kpi label="Total indikator" value={s.total} detail={`tahun ${year}`} />
      <Kpi label="Ber-capaian" value={s.withA} detail="punya target dan actual sekaligus" cls="b" />
      <Kpi label="Rata-rata capaian" value={pct(s.score)} detail={`dihitung dari ${s.withA} indikator saja`} cls="gd" />
      <Kpi label="At Risk" value={s.counts.rd} detail="di bawah 75% dari target" cls="a" />
    </div>
  );
}

/** Tabel indikator baca-saja dengan sparkline — dipakai banyak view. */
export function IndicatorRows({ rows, year, cols = {} }) {
  if (!rows.length) return <NoData title="Tidak ada indikator" hint="Ubah filter atau periode." />;
  return (
    <div className="tbl-w"><table>
      <thead><tr>
        <th style={{ width: 74 }}>ID</th>
        <th style={{ minWidth: 280 }}>Indikator</th>
        {cols.group && <th>{cols.group}</th>}
        <th className="num">Target</th>
        <th className="num">Actual</th>
        <th style={{ width: 120 }}>Capaian</th>
        <th className="ctr">Q1–Q4</th>
        <th>Status</th>
      </tr></thead>
      <tbody>
        {rows.slice(0, 300).map(r => {
          const y = r.years?.[year] || r.year;
          const a = achievement(y, r);
          return (
            <tr key={r.id}>
              <td><span className="code">{r.id}</span></td>
              <td><div className="t-name">{r.name}</div>
                {r.code && <div className="t-meta"><span className="code">{r.code}</span></div>}</td>
              {cols.group && <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>{r[cols.key] || '—'}</td>}
              <td className="num">{fmt(y?.target, r.unit)}</td>
              <td className="num">{fmt(actualOf(y, r), r.unit)}</td>
              <td><Progress a={a} /></td>
              <td className="ctr"><Spark row={y} unit={r.unit} /></td>
              <td><StatusBadge a={a} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
    {rows.length > 300 && <div className="card-b" style={{ fontSize: 12, color: 'var(--muted)' }}>
      300 baris pertama ditampilkan.</div>}
    </div>
  );
}
