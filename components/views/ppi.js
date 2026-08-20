'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, StatusBadge, Progress, BarList,
         groupBy, StatusCards, IndicatorRows, statSummary, ReadinessNote, PeriodChip, quarterFill,
         achievement, fmt, pct, useState, useMemo } from './common';
import IndicatorTable from '@/components/IndicatorTable';
import QuarterlyTable from '@/components/QuarterlyTable';

const PPI = rows => rows.filter(r => r.type === 'PPI');

export function PpStructure({ rows, year, config }) {
  const ppi = PPI(rows);
  const [open, setOpen] = useState({});
  const vision = config?.meta?.vision || 'Quality Education Accelerates Equal Opportunities';

  const tree = useMemo(() => groupBy(ppi, 'toc_foundation', year).map(f => ({
    ...f,
    children: groupBy(f.list, 'portfolio', year).map(p => ({
      ...p,
      children: groupBy(p.list, 'project', year)
    }))
  })), [ppi, year]);

  const toggle = k => setOpen(o => ({ ...o, [k]: !o[k] }));

  return (
    <>
      <PageHead title="Program Structure">
        Hierarki Vision → ToC Foundation Level → ToC Portfolio Level → Project Level → Indicator
        sesuai struktur file PPI. Angka pada tiap simpul adalah jumlah indikator dan rata-rata
        capaian {year} dari indikator yang memiliki data.
      </PageHead>

      <Card className="mb"><div style={{ fontSize: 13 }}>
        <div className="t-meta">VISION</div>
        <b style={{ fontSize: 15 }}>{vision}</b>
      </div></Card>

      <StatusCards rows={ppi} year={year} />

      <Card title="Struktur Theory of Change">
        {tree.map(f => (
          <div key={f.key} style={{ borderLeft: '3px solid var(--green)', paddingLeft: 12, marginBottom: 14 }}>
            <div style={{ cursor: 'pointer' }} onClick={() => toggle(f.key)}>
              <b>{open[f.key] ? '▾' : '▸'} {f.key}</b>
              <span className="t-meta"> {f.n} indikator · {f.withA} ber-capaian · {pct(f.score)}</span>
            </div>
            {open[f.key] && f.children.map(p => (
              <div key={p.key} style={{ borderLeft: '2px solid var(--gold)', paddingLeft: 12, margin: '10px 0 10px 10px' }}>
                <div style={{ cursor: 'pointer' }} onClick={() => toggle(f.key + p.key)}>
                  <b style={{ fontSize: 12.5 }}>{open[f.key + p.key] ? '▾' : '▸'} {p.key}</b>
                  <span className="t-meta"> {p.n} indikator · {pct(p.score)}</span>
                </div>
                {open[f.key + p.key] && p.children.map(pr => (
                  <div key={pr.key} style={{ paddingLeft: 14, marginTop: 8 }}>
                    <div className="t-name" style={{ fontSize: 12 }}>{pr.key}
                      <span className="t-meta"> {pr.n} indikator · {pct(pr.score)}</span></div>
                    <ul style={{ margin: '4px 0 0 14px', fontSize: 11.5, color: 'var(--muted)' }}>
                      {pr.list.slice(0, 12).map(r => (
                        <li key={r.id}>{r.name} <span className="code">{r.level || '—'}</span></li>
                      ))}
                      {pr.list.length > 12 && <li>… {pr.list.length - 12} lainnya</li>}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </Card>

      <div className="mt"><ReadinessNote {...statSummary(ppi, year)} year={year} /></div>
    </>
  );
}

export function PpRepo({ rows, year, qtr, allYears, role }) {
  return (
    <>
      <PageHead title="Indicator Repository">
        Seluruh indikator program pada hierarki ToC Foundation → ToC Portfolio → Project → Indicator.
        Nilai Q1–Q4 dapat diubah langsung pada tabel.
      </PageHead>
      <IndicatorTable type="PPI" year={year} qtr={qtr} years={allYears} role={role} rows={PPI(rows)} />
    </>
  );
}

export function PpQuarterly({ rows, year, qtr, allYears, role }) {
  const ppiRows = PPI(rows);
  const f = quarterFill(ppiRows, year, qtr);
  return (
    <>
      <PageHead title="Quarterly Update — Program Performance"
                right={<PeriodChip year={year} qtr={qtr} />}>
        Input actual untuk Q{qtr} {year}. Kolom kuartal aktif disorot pada tabel. Nilai kosong berarti
        belum ada data dan tidak pernah dihitung sebagai nol.
      </PageHead>
      <QuarterlyTable type="PPI" rows={ppiRows} year={year} qtr={qtr} role={role} />
    </>
  );
}

export function PpAnnual({ rows, year }) {
  const ppi = PPI(rows);
  const byLevel = groupBy(ppi, 'level', year);
  const s = statSummary(ppi, year);
  return (
    <>
      <PageHead title={`Annual Review — Program Performance ${year}`}>
        Capaian indikator program menurut Level of Change. Struktur ini mengikuti logika Theory of
        Change: Output menopang Intermediate Outcome, yang menopang Outcome, yang menopang Impact.
      </PageHead>
      <StatusCards rows={ppi} year={year} />
      <Card title="Capaian per Level of Change" sub="rata-rata tidak berbobot, hanya indikator ber-data" className="mb">
        <BarList items={byLevel.map(g => ({ label: `${g.key} (${g.n})`, value: g.score, n: g.withA }))} />
      </Card>
      <Note kind="w">
        <b>Batas pembacaan.</b> Capaian pada level Output tidak membuktikan tercapainya Outcome maupun
        Impact. Hubungan antar level pada Theory of Change adalah asumsi program yang perlu diuji lewat
        evaluasi, bukan kesimpulan yang dapat ditarik dari tabel ini.
      </Note>
      <div className="mt"><ReadinessNote {...s} year={year} /></div>
    </>
  );
}

export function PpPortfolio({ rows, year }) {
  const ppi = PPI(rows);
  const byPortfolio = groupBy(ppi, 'portfolio', year);
  return (
    <>
      <PageHead title="Portfolio Dashboard">
        Ringkasan tiap ToC Portfolio Level pada tahun {year}, beserta project di dalamnya.
      </PageHead>
      <StatusCards rows={ppi} year={year} />
      <div className="grid g2">
        {byPortfolio.map(p => (
          <Card key={p.key} title={p.key}
                sub={`${p.n} indikator · ${p.withA} ber-capaian · rata-rata ${pct(p.score)}`}>
            <BarList items={groupBy(p.list, 'project', year).map(pr => ({
              label: pr.key, value: pr.score, n: pr.withA
            }))} />
          </Card>
        ))}
      </div>
    </>
  );
}
