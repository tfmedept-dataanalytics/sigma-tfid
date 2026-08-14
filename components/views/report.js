'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, BarList, groupBy, statSummary,
         PeriodChip, quarterFill, achievement, actualOf, fmt, pct, useState, useMemo } from './common';
import { STATUS_LABEL } from '@/lib/calc';

function Section({ n, title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h4 style={{ margin: '0 0 6px', fontSize: 13.5, color: 'var(--ink)' }}>{n}. {title}</h4>
      <div style={{ fontSize: 12.8, lineHeight: 1.7, color: 'var(--body)' }}>{children}</div>
    </div>
  );
}

function ReportBody({ rows, year, qtr, scope, sections, periodLabel }) {
  const s = statSummary(rows, year);
  const opi = rows.filter(r => r.type === 'OPI');
  const ppi = rows.filter(r => r.type === 'PPI');
  const sOpi = statSummary(opi, year), sPpi = statSummary(ppi, year);
  const worst = rows.map(r => ({ r, a: achievement(r.years?.[year] || r.year, r) }))
    .filter(x => x.a !== null).sort((a, b) => a.a - b.a).slice(0, 10);

  return (
    <Card right={<button className="btn sm no-print" onClick={() => window.print()}>Cetak / PDF</button>}>
      <div style={{ borderBottom: '2px solid var(--green)', paddingBottom: 10, marginBottom: 16 }}>
        <div className="t-meta">TANOTO FOUNDATION · SIGMA</div>
        <h3 style={{ margin: '4px 0 0' }}>{scope} — {periodLabel || year}</h3>
        <div className="t-meta">Dihasilkan dari data yang tersimpan di platform pada saat laporan dibuat.</div>
      </div>

      {sections.includes('ringkas') && (
        <Section n="1" title="Ringkasan capaian">
          Dari {s.total} indikator, {s.withA} memiliki target dan actual sekaligus pada {year}.
          Rata-rata capaian gabungan {pct(s.score)} — dihitung dari {s.withA} indikator, bukan dari {s.total}.
          OPI {pct(sOpi.score)} ({sOpi.withA} indikator ber-data); PPI {pct(sPpi.score)} ({sPpi.withA} indikator ber-data).
        </Section>
      )}

      {sections.includes('status') && (
        <Section n="2" title="Sebaran status">
          {['ok', 'am', 'rd', 'gy'].map(k => `${STATUS_LABEL[k]}: ${s.counts[k]}`).join(' · ')}.
          Indikator berstatus No Data belum memiliki target atau actual dan tidak dihitung sebagai capaian nol.
        </Section>
      )}

      {sections.includes('kelompok') && (
        <Section n="3" title="Capaian per kelompok">
          <BarList items={groupBy(rows.filter(r => r.portfolio || r.strategy_map),
            'portfolio', year).filter(g => g.key !== '(tidak diisi)')
            .map(g => ({ label: g.key, value: g.score, n: g.withA }))} />
        </Section>
      )}

      {sections.includes('perhatian') && (
        <Section n="4" title="Indikator yang memerlukan perhatian">
          {!worst.length ? 'Belum ada indikator dengan capaian yang dapat dihitung.' : (
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {worst.map(x => <li key={x.r.id}>{x.r.name} — {pct(x.a)}</li>)}
            </ol>
          )}
        </Section>
      )}

      {sections.includes('metode') && (
        <Section n="5" title="Catatan metode dan keterbatasan">
          Capaian dihitung sebagai actual dibagi target. Untuk unit Percent, actual diambil dari nilai
          kuartal tertinggi; untuk unit lain, dijumlahkan sepanjang tahun. Rata-rata bersifat tidak
          berbobot dan hanya mencakup indikator dengan target dan actual lengkap — {s.total - s.withA} indikator
          dikeluarkan dari perhitungan. Data sumber tidak memuat target per kuartal, sehingga pembacaan
          kuartalan membandingkan actual kuartal terhadap target tahunan. Laporan ini tidak memuat
          analisis sebab-akibat karena sistem tidak menyimpan variabel penjelas.
        </Section>
      )}
    </Card>
  );
}

const ALL = ['ringkas', 'status', 'kelompok', 'perhatian', 'metode'];

export const RpQuarterly = ({ rows, year, qtr = 2 }) => {
  const f = quarterFill(rows, year, qtr);
  return (
    <>
      <PageHead title="Quarterly Report" right={<PeriodChip year={year} qtr={qtr} />}>
        Laporan untuk Q{qtr} {year}. Kelengkapan data pada kuartal ini: {f.filled} dari {f.total} indikator
        ({(f.ratio * 100).toFixed(0)}%).
      </PageHead>
      <ReportBody rows={rows} year={year} qtr={qtr} scope="Laporan Kuartalan"
                  periodLabel={`Q${qtr} ${year}`} sections={ALL} />
    </>
  );
};

export const RpAnnual = ({ rows, year }) =>
  <><PageHead title="Annual Report">Laporan tahunan lengkap dengan capaian, sebaran status, dan catatan metode.</PageHead>
    <ReportBody rows={rows} year={year} scope="Laporan Tahunan" sections={ALL} /></>;

export const RpExecutive = ({ rows, year }) =>
  <><PageHead title="Executive Report">Ringkasan satu halaman untuk pimpinan.</PageHead>
    <ReportBody rows={rows} year={year} scope="Ringkasan Eksekutif" sections={['ringkas', 'status', 'metode']} /></>;

export function RpProgram({ rows, year }) {
  const [p, setP] = useState('');
  const opts = useMemo(() => [...new Set(rows.map(r => r.portfolio).filter(Boolean))].sort(), [rows]);
  const scoped = p ? rows.filter(r => r.portfolio === p) : rows.filter(r => r.type === 'PPI');
  return (
    <>
      <PageHead title="Program Report">Laporan per portfolio atau program.</PageHead>
      <Card className="mb"><div className="filters">
        <select value={p} onChange={e => setP(e.target.value)} style={{ minWidth: 280 }}>
          <option value="">Seluruh program (PPI)</option>
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
      </div></Card>
      <ReportBody rows={scoped} year={year} scope={p || 'Seluruh Program'} sections={ALL} />
    </>
  );
}

export function RpCustom({ rows, year }) {
  const [sel, setSel] = useState(ALL);
  const [type, setType] = useState('');
  const scoped = type ? rows.filter(r => r.type === type) : rows;
  const toggle = k => setSel(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
  const LBL = { ringkas: 'Ringkasan capaian', status: 'Sebaran status', kelompok: 'Capaian per kelompok',
                perhatian: 'Indikator perlu perhatian', metode: 'Catatan metode' };
  return (
    <>
      <PageHead title="Custom Report">Pilih sendiri cakupan dan bagian laporan.</PageHead>
      <Card className="mb">
        <div className="filters mb">
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="">OPI + PPI</option>
            <option value="OPI">OPI saja</option>
            <option value="PPI">PPI saja</option>
          </select>
        </div>
        <div className="row">
          {ALL.map(k => (
            <label key={k} className="row" style={{ gap: 6, fontSize: 12.5 }}>
              <input type="checkbox" checked={sel.includes(k)} onChange={() => toggle(k)} /> {LBL[k]}
            </label>
          ))}
        </div>
      </Card>
      <ReportBody rows={scoped} year={year} scope="Laporan Kustom" sections={sel} />
    </>
  );
}
