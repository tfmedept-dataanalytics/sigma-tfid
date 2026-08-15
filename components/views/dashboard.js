'use client';

import Link from 'next/link';
import { Card, Kpi, Note, NoData, PageHead, Badge, StatusBadge, Progress,
         groupBy, statSummary, achievement, actualOf, statusClass, STATUS_LABEL,
         fmt, pct, useMemo } from './common';
import { STATUS_COLOR, WORKFLOW } from '@/lib/calc';
import TrendChart from '@/components/TrendChart';
import { hrefOf } from '@/lib/nav';
import Translate from '@/components/Translate';

/** Donut sebaran status. */
function Donut({ segs, size = 158, label, sub }) {
  const r = size / 2 - 12, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  const tot = segs.reduce((a, b) => a + b.v, 0) || 1;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
         aria-label={segs.map(s => `${s.l}: ${s.v}`).join(', ')}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F3" strokeWidth="16" />
      {segs.map((g, i) => {
        if (!g.v) return null;
        const len = C * g.v / tot;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={g.c} strokeWidth="16"
                  strokeDasharray={`${len.toFixed(2)} ${(C - len).toFixed(2)}`}
                  strokeDashoffset={(-off).toFixed(2)}
                  transform={`rotate(-90 ${cx} ${cy})`}>
            <title>{g.l}: {g.v}</title>
          </circle>
        );
        off += len;
        return el;
      })}
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="21" fontWeight="800" fill="#10231B">{label}</text>
      {sub && <text x={cx} y={cy + 18} textAnchor="middle" fontSize="9.5" fill="#6E7F76">{sub}</text>}
    </svg>
  );
}

const StatLine = ({ l, v, c }) => (
  <div className="stat-line"><span className="dot" style={{ background: c }} />{l}<b>{v}</b></div>
);

/** Bar horizontal berlabel — dipakai kartu Health. */
function Bars({ items }) {
  if (!items.length) return <NoData title="Belum ada data" hint="Tidak ada indikator pada kelompok ini." />;
  const w = 620, rh = 26, pad = { l: 200, r: 56, t: 6, b: 6 };
  const h = pad.t + pad.b + items.length * rh;
  const max = Math.max(...items.map(i => Math.abs(i.v)), 1);
  const iw = w - pad.l - pad.r;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      {items.map((it, i) => {
        const y = pad.t + i * rh, bh = 15;
        const lab = it.l.length > 34 ? it.l.slice(0, 33) + '…' : it.l;
        const bw = Math.max(2, (Math.abs(it.v) / max) * iw);
        return (
          <g key={i}>
            <text x="0" y={y + rh / 2 + 3.5} fontSize="10.8" fill="#33413A">{lab}<title>{it.l}</title></text>
            <rect x={pad.l} y={y + rh / 2 - bh / 2} width={iw} height={bh} rx={bh / 2} fill="#F1F5F3" />
            <rect x={pad.l} y={y + rh / 2 - bh / 2} width={bw} height={bh} rx={bh / 2} fill={it.c} />
            <text x={w - pad.r + 6} y={y + rh / 2 + 3.5} fontSize="10.8" fontWeight="700" fill="#10231B">{it.t}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HealthCard({ title, groups, year, link, linkLabel }) {
  const items = groups
    .map(g => ({
      l: `${g.key} (${g.n})`,
      v: g.score === null ? 0 : Math.min(g.score, 1.3),
      t: g.score === null ? '—' : pct(g.score),
      c: g.score === null ? '#B9C4BF' : STATUS_COLOR[statusClass(g.score)]
    }))
    .sort((a, b) => b.v - a.v).slice(0, 8);
  return (
    <Card title={title} sub={`Rata-rata capaian terhadap target ${year}.`}>
      <Bars items={items} />
      <Link className="btn sm mt no-print" href={`${hrefOf(link)}?year=${year}`}>{linkLabel}</Link>
    </Card>
  );
}

export default function Dashboard({ rows, year, qtr, allYears, trend, config }) {
  const th = config?.thresholds || { near_target: 75 };
  const opi = rows.filter(r => r.type === 'OPI');
  const ppi = rows.filter(r => r.type === 'PPI');
  const s = statSummary(rows, year), sO = statSummary(opi, year), sP = statSummary(ppi, year);

  const completeness = useMemo(() => {
    let f = 0, t = 0;
    rows.forEach(r => {
      const y = r.years?.[year];
      if (!y) return;
      t++;
      const v = [y.q1, y.q2, y.q3, y.q4][qtr - 1];
      if (v !== null && v !== undefined) f++;
    });
    return t ? f / t : 0;
  }, [rows, year, qtr]);

  const wf = useMemo(() => {
    const c = { draft: 0, submitted: 0, review: 0, returned: 0, approved: 0 };
    rows.forEach(r => { const y = r.years?.[year]; if (y) c[y.status || 'draft']++; });
    return c;
  }, [rows, year]);

  const attention = useMemo(() => rows
    .map(r => ({ r, a: achievement(r.years?.[year], r) }))
    .filter(x => x.a !== null).sort((a, b) => a.a - b.a).slice(0, 10), [rows, year]);

  const overallCls = s.score === null ? '' : statusClass(s.score) === 'ok' ? '' : statusClass(s.score) === 'am' ? 'a' : 'r';

  return (
    <Translate>
      <PageHead title="Executive Dashboard"
        right={<Link className="btn sm no-print" href={`${hrefOf('ai-sum')}?year=${year}`}>✦ AI Executive Summary</Link>}>
        Kondisi kinerja organisasi dan program per Q{qtr} {year}. Angka di bawah dihitung dari data
        yang tersimpan di platform — belum seluruh indikator memiliki actual.
      </PageHead>

      <div className="grid g5 mb">
        <Kpi label="Overall Performance" value={pct(s.score)}
             detail={`Rata-rata capaian ${s.withA} indikator ber-data`} cls={overallCls} />
        <Kpi label="OPI Performance" value={pct(sO.score)} detail={`${opi.length} KPI organisasi`} cls="b" />
        <Kpi label="PPI Performance" value={pct(sP.score)} detail={`${ppi.length} indikator program`} cls="gd" />
        <Kpi label="At Risk Indicators" value={s.counts.rd}
             detail={`Capaian < ${th.near_target}% dari target`} cls="r" />
        <Kpi label="Data Completeness" value={`${(completeness * 100).toFixed(0)}%`}
             detail={`Indikator terisi pada Q${qtr} ${year}`} cls={completeness >= 0.8 ? '' : 'a'} />
      </div>

      <div className="grid g21 mb">
        <TrendChart years={trend.years} opi={trend.opi} rpi={trend.rpi} ppi={trend.ppi}
                    all={trend.all} regionLabel="Akumulasi Regional" />
        <Card title={`Status Indikator ${year}`}>
          <div style={{ textAlign: 'center' }}>
            <Donut
              segs={[
                { v: s.counts.ok, c: STATUS_COLOR.ok, l: 'On Track' },
                { v: s.counts.am, c: STATUS_COLOR.am, l: 'Near Target' },
                { v: s.counts.rd, c: STATUS_COLOR.rd, l: 'At Risk' },
                { v: s.counts.gy, c: STATUS_COLOR.gy, l: 'No Data' }
              ]}
              label={String(s.total)} sub="indikator" />
          </div>
          <div style={{ textAlign: 'left', marginTop: 10 }}>
            <StatLine l="On Track" v={s.counts.ok} c={STATUS_COLOR.ok} />
            <StatLine l="Near Target" v={s.counts.am} c={STATUS_COLOR.am} />
            <StatLine l="At Risk" v={s.counts.rd} c={STATUS_COLOR.rd} />
            <StatLine l="No Data (belum diinput)" v={s.counts.gy} c={STATUS_COLOR.gy} />
          </div>
        </Card>
      </div>

      <div className="grid g2 mb">
        <HealthCard title="Organization Health — per Strategy Map"
          groups={groupBy(opi, 'strategy_map', year)} year={year} link="org-an" linkLabel="Lihat analytics" />
        <HealthCard title="Program Health — per ToC Portfolio"
          groups={groupBy(ppi, 'portfolio', year)} year={year} link="pp-an" linkLabel="Lihat analytics" />
      </div>

      <Card className="mb" title="⚠ Indicators Requiring Attention"
            sub={`10 indikator dengan capaian terendah terhadap target ${year}.`}>
        {!attention.length ? (
          <NoData title={`Belum ada capaian ${year}`} hint="Input actual melalui modul Quarterly Update." />
        ) : (
          <div className="tbl-w"><table>
            <thead><tr><th>Indikator</th><th>Tipe</th><th>Portfolio / Strategy</th>
              <th className="num">Target</th><th className="num">Actual</th>
              <th style={{ width: 130 }}>Capaian</th><th>Status</th></tr></thead>
            <tbody>
              {attention.map(x => {
                const y = x.r.years?.[year];
                return (
                  <tr key={x.r.id}>
                    <td><div className="t-name" style={{ maxWidth: 340 }}>{x.r.name}</div></td>
                    <td><Badge cls={x.r.type === 'OPI' ? 'b-bl' : 'b-gd'}>{x.r.type}</Badge></td>
                    <td style={{ fontSize: 11.5, color: 'var(--muted)', maxWidth: 190 }}>
                      {x.r.type === 'OPI' ? x.r.strategy_map : x.r.portfolio}</td>
                    <td className="num">{fmt(y?.target, x.r.unit)}</td>
                    <td className="num">{fmt(actualOf(y, x.r), x.r.unit)}</td>
                    <td><Progress a={x.a} /></td>
                    <td><StatusBadge a={x.a} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </Card>

      <div className="grid g2">
        <Card title={`Workflow Snapshot ${year}`}>
          <StatLine l="Pending Input (draft)" v={wf.draft} c="#8FA09A" />
          <StatLine l="Pending Review (submitted)" v={wf.submitted} c="#1F6FB2" />
          <StatLine l="Under Review" v={wf.review} c="#B3A369" />
          <StatLine l="Returned / Revision" v={wf.returned} c="#C0392B" />
          <StatLine l="Approved (official data)" v={wf.approved} c="#006341" />
          <Link className="btn sm mt no-print" href={`${hrefOf('wf-my')}?year=${year}`}>Buka My Tasks</Link>
        </Card>
        <Card title="Catatan keterbatasan data">
          <Note kind="w">
            <b>Baca angka di atas dengan hati-hati.</b><br />
            Skor gabungan hanya menghitung indikator yang memiliki <i>target</i> dan <i>actual</i> pada {year}
            {' '}({s.withA} dari {s.total} indikator). Indikator tanpa data tidak dihitung sebagai 0, sehingga
            skor dapat bias optimis apabila indikator bermasalah justru yang belum terisi.
          </Note>
          <div className="note n mt">
            Satuan campuran (Percent, Number, Text) tidak dijumlahkan. Agregasi dilakukan pada rasio
            capaian (actual ÷ target), bukan pada nilai absolut.
          </div>
        </Card>
      </div>
    </Translate>
  );
}
