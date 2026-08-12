'use client';

import { achievement, actualOf, statusClass, STATUS_LABEL, STATUS_COLOR, fmt, pct, WORKFLOW } from '@/lib/calc';

export const Card = ({ title, sub, right, children, className = '' }) => (
  <div className={'card ' + className}>
    {(title || sub) && (
      <div className="card-h">
        {title && <h3>{title}</h3>}
        {sub && <div className="sub">{sub}</div>}
        {right}
      </div>
    )}
    {children && <div className="card-b">{children}</div>}
  </div>
);

export const Kpi = ({ label, value, detail, cls = '' }) => (
  <div className={'kpi ' + cls}><div className="lb">{label}</div>
    <div className="vl">{value}</div><div className="dl">{detail}</div></div>
);

export const Note = ({ kind = 'w', children }) => <div className={'note ' + kind}>{children}</div>;

export const NoData = ({ title, hint }) => (
  <div className="nodata"><b>{title}</b>{hint && <span>{hint}</span>}</div>
);

export const PageHead = ({ title, children, right }) => (
  <div className="page-h">
    <h2>{title}</h2>
    {children && <p>{children}</p>}
    {right}
  </div>
);

export const Badge = ({ cls, children }) => <span className={'bdg ' + cls}>{children}</span>;

export const StatusBadge = ({ a }) => {
  const c = statusClass(a);
  return <Badge cls={'b-' + c}>{STATUS_LABEL[c]}</Badge>;
};

export const WfBadge = ({ status }) => {
  const w = WORKFLOW[status] || WORKFLOW.draft;
  return <Badge cls={w.cls}>{w.label}</Badge>;
};

export const Progress = ({ a }) => (
  <>
    <div className="prog">
      <i className={'p-' + statusClass(a)}
         style={{ width: a === null ? 0 : Math.max(2, Math.min(100, a * 100)) + '%' }} />
    </div>
    <div className="t-meta">{pct(a)}</div>
  </>
);

/** Bar chart Q1–Q4 dengan garis target. */
export const Spark = ({ row, unit, w = 74, h = 26 }) => {
  const q = [row?.q1, row?.q2, row?.q3, row?.q4];
  const t = row?.target;
  const vals = q.filter(v => v !== null && v !== undefined).map(Number);
  const max = Math.max(...vals, t ? Number(t) : 0, 1);
  const bw = (w - 8) / 4 - 4;
  return (
    <svg width={w} height={h} role="img"
         aria-label={`Q1-Q4: ${q.map(v => (v == null ? 'kosong' : fmt(v, unit))).join(', ')}`}>
      {q.map((v, i) => {
        const x = i * (bw + 4) + 2;
        if (v === null || v === undefined) return <rect key={i} x={x} y={h - 3} width={bw} height={2} rx={1} fill="#DCE5E0" />;
        const bh = Math.max(2, (Number(v) / max) * (h - 6));
        const a = t ? Number(v) / Number(t) : null;
        return <rect key={i} x={x} y={h - bh} width={bw} height={bh} rx={2} fill={STATUS_COLOR[statusClass(a)]} />;
      })}
      {t ? <line x1="0" y1={h - (Number(t) / max) * (h - 6)} x2={w} y2={h - (Number(t) / max) * (h - 6)}
                 stroke="#8A7A42" strokeWidth="1" strokeDasharray="3 2" /> : null}
    </svg>
  );
};

/** Bar chart horizontal berkelompok. */
export const BarList = ({ items, unit }) => {
  if (!items.length) return <NoData title="Belum ada data" hint="Tidak ada nilai yang dapat ditampilkan." />;
  return (
    <div className="barlist">
      {items.map((it, i) => (
        <div className="bl-row" key={i}>
          <div className="bl-l" title={it.label}>{it.label}</div>
          <div className="bl-b">
            <div className="prog" style={{ height: 9 }}>
              <i className={'p-' + statusClass(it.value)}
                 style={{ width: it.value === null ? 0 : Math.max(2, Math.min(100, it.value * 100)) + '%' }} />
            </div>
          </div>
          <div className="bl-v">{it.value === null ? '—' : pct(it.value)}
            {it.n !== undefined && <span className="t-meta"> n={it.n}</span>}</div>
        </div>
      ))}
    </div>
  );
};

/** Ringkasan sebaran status + catatan kesiapan data. */
export function statSummary(rows, year) {
  const withA = rows.filter(r => achievement(r.years?.[year] || r.year, r) !== null).length;
  const c = { ok: 0, am: 0, rd: 0, gy: 0 };
  rows.forEach(r => { c[statusClass(achievement(r.years?.[year] || r.year, r))]++; });
  const vals = rows.map(r => achievement(r.years?.[year] || r.year, r)).filter(v => v !== null);
  const score = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  return { withA, counts: c, score, total: rows.length };
}

export const ReadinessNote = ({ total, withA, year }) => (
  total > withA ? (
    <Note kind="w">
      <b>Kesiapan data.</b> {total - withA} dari {total} indikator belum memiliki target dan actual
      sekaligus pada {year}, sehingga berstatus <i>No Data</i>. Indikator tanpa data <b>tidak dihitung
      sebagai nol</b> dan dikeluarkan dari seluruh rata-rata di halaman ini — angka rata-rata hanya
      mewakili {withA} indikator.
    </Note>
  ) : null
);

export { achievement, actualOf, statusClass, STATUS_LABEL, STATUS_COLOR, fmt, pct };
