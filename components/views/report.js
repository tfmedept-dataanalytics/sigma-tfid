'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, BarList, groupBy, statSummary,
         PeriodChip, quarterFill, achievement, actualOf, fmt, pct, useState, useMemo } from './common';
import { STATUS_LABEL } from '@/lib/calc';
import { useLang } from '@/components/LangProvider';

function Section({ n, title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h4 style={{ margin: '0 0 6px', fontSize: 13.5, color: 'var(--ink)' }}>{n}. {title}</h4>
      <div style={{ fontSize: 12.8, lineHeight: 1.7, color: 'var(--body)' }}>{children}</div>
    </div>
  );
}

function ReportBody({ rows, year, qtr, scope, sections, periodLabel }) {
  const { t } = useLang();
  const s = statSummary(rows, year);
  const opi = rows.filter(r => r.type === 'OPI');
  const rpi = rows.filter(r => r.type === 'RPI');
  const ppi = rows.filter(r => r.type === 'PPI');
  const sOpi = statSummary(opi, year), sRpi = statSummary(rpi, year), sPpi = statSummary(ppi, year);
  const worst = rows.map(r => ({ r, a: achievement(r.years?.[year] || r.year, r) }))
    .filter(x => x.a !== null).sort((a, b) => a.a - b.a).slice(0, 10);

  return (
    <Card right={<button className="btn sm no-print" onClick={() => window.print()}>Cetak / PDF</button>}>
      <div style={{ borderBottom: '2px solid var(--green)', paddingBottom: 10, marginBottom: 16 }}>
        <div className="t-meta">TANOTO FOUNDATION · SIGMA</div>
        <h3 style={{ margin: '4px 0 0' }}>{scope} — {periodLabel || year}</h3>
        <div className="t-meta">{t('rp.head')}</div>
      </div>

      {sections.includes('ringkas') && (
        <Section n="1" title={t('rp.sec.1')}>
          {t('rp.s1', { total: s.total, withA: s.withA, year, score: pct(s.score),
            opi: pct(sOpi.score), nOpi: sOpi.withA, rpi: pct(sRpi.score), nRpi: sRpi.withA,
            ppi: pct(sPpi.score), nPpi: sPpi.withA })}
        </Section>
      )}

      {sections.includes('status') && (
        <Section n="2" title={t('rp.sec.2')}>
          {t('rp.s2', { dist: ['ok', 'am', 'rd', 'gy'].map(k => `${STATUS_LABEL[k]}: ${s.counts[k]}`).join(' · ') })}
        </Section>
      )}

      {sections.includes('kelompok') && (
        <Section n="3" title={t('rp.sec.3')}>
          <BarList items={groupBy(rows.filter(r => r.portfolio || r.strategy_map),
            'portfolio', year).filter(g => g.key !== '(tidak diisi)')
            .map(g => ({ label: g.key, value: g.score, n: g.withA }))} />
        </Section>
      )}

      {sections.includes('perhatian') && (
        <Section n="4" title={t('rp.sec.4')}>
          {!worst.length ? t('rp.s4.empty') : (
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {worst.map(x => <li key={x.r.id}>{x.r.name} — {pct(x.a)}</li>)}
            </ol>
          )}
        </Section>
      )}

      {sections.includes('metode') && (
        <Section n="5" title={t('rp.sec.5')}>
          {t('rp.s5', { missing: s.total - s.withA })}
        </Section>
      )}
    </Card>
  );
}

const ALL = ['ringkas', 'status', 'kelompok', 'perhatian', 'metode'];

export const RpQuarterly = ({ rows, year, qtr = 2 }) => {
  const f = quarterFill(rows, year, qtr);
  const { t } = useLang();
  return (
    <>
      <PageHead title="Quarterly Report" right={<PeriodChip year={year} qtr={qtr} />}>
        {t('rp.q.head', { qtr, year, filled: f.filled, total: f.total,
          ratio: (f.ratio * 100).toFixed(0) + '%' })}
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
