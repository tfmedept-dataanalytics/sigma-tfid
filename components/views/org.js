'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, StatusBadge, Progress, Spark, BarList,
         groupBy, StatusCards, IndicatorRows, statSummary, ReadinessNote,
         achievement, actualOf, fmt, pct, statusClass, useMemo } from './common';
import IndicatorTable from '@/components/IndicatorTable';

const OPI = rows => rows.filter(r => r.type === 'OPI');

export function OrgMap({ rows, year }) {
  const opi = OPI(rows);
  const perspectives = groupBy(opi, 'strategy_map', year);
  return (
    <>
      <PageHead title="Strategy Map">
        Empat perspektif Balanced Scorecard beserta outcome dan KPI yang menempel pada masing-masing
        perspektif. Warna kartu mengikuti rata-rata capaian {year} dari KPI yang memiliki data.
      </PageHead>
      <StatusCards rows={opi} year={year} />
      <div className="grid g2">
        {perspectives.map(p => (
          <Card key={p.key} title={p.key}
                sub={`${p.n} KPI · ${p.withA} ber-capaian · rata-rata ${pct(p.score)}`}>
            <BarList items={groupBy(p.list, 'outcome', year).map(o => ({
              label: o.key, value: o.score, n: o.withA
            }))} />
          </Card>
        ))}
      </div>
      <div className="mt"><ReadinessNote {...statSummary(opi, year)} year={year} /></div>
    </>
  );
}

export function OrgRepo({ rows, year, allYears, role }) {
  return (
    <>
      <PageHead title="KPI Repository">
        Seluruh KPI organisasi beserta target tahunan, target 2030, dan capaian per kuartal.
        Nilai Q1–Q4 dapat diubah langsung pada tabel; perubahan tersimpan seketika dan tercatat
        pada audit trail.
      </PageHead>
      <IndicatorTable type="OPI" year={year} years={allYears} role={role} rows={OPI(rows)} />
    </>
  );
}

export function OrgQuarterly({ rows, year, allYears, role }) {
  return (
    <>
      <PageHead title="Quarterly Update — Organization Performance">
        Input actual per kuartal. Alur: pemilik indikator mengisi nilai, menambahkan commentary dan
        evidence, lalu submit untuk direview. Nilai yang berubah menurunkan status Approved kembali
        ke Draft.
      </PageHead>
      <IndicatorTable type="OPI" year={year} years={allYears} role={role} rows={OPI(rows)} />
    </>
  );
}

export function OrgAnnual({ rows, year, allYears }) {
  const opi = OPI(rows);
  const prev = String(Number(year) - 1);
  const s = statSummary(opi, year);
  const sPrev = statSummary(opi, prev);
  const moved = opi.map(r => {
    const a = achievement(r.years?.[year], r), b = achievement(r.years?.[prev], r);
    return (a !== null && b !== null) ? { r, a, b, d: a - b } : null;
  }).filter(Boolean).sort((x, y2) => y2.d - x.d);

  return (
    <>
      <PageHead title={`Annual Performance Review ${year}`}>
        Ringkasan capaian satu tahun dan perbandingannya dengan {prev}. Perbandingan hanya mencakup
        indikator yang memiliki data pada kedua tahun.
      </PageHead>
      <div className="grid g4 mb">
        <Kpi label={`Rata-rata ${year}`} value={pct(s.score)} detail={`${s.withA} indikator ber-data`} />
        <Kpi label={`Rata-rata ${prev}`} value={pct(sPrev.score)} detail={`${sPrev.withA} indikator ber-data`} cls="b" />
        <Kpi label="Dapat dibandingkan" value={moved.length} detail={`punya data di ${prev} dan ${year}`} cls="gd" />
        <Kpi label="At Risk" value={s.counts.rd} detail={`pada ${year}`} cls="a" />
      </div>

      {moved.length === 0 ? (
        <Card><NoData title="Belum dapat dibandingkan"
          hint={`Tidak ada indikator yang memiliki capaian pada ${prev} sekaligus ${year}.`} /></Card>
      ) : (
        <div className="grid g2 mb">
          <Card title="Kenaikan terbesar" sub={`selisih capaian ${prev} → ${year}`}>
            <BarList items={moved.slice(0, 8).map(m => ({ label: m.r.name, value: m.a }))} />
          </Card>
          <Card title="Penurunan terbesar" sub={`selisih capaian ${prev} → ${year}`}>
            <BarList items={moved.slice(-8).reverse().map(m => ({ label: m.r.name, value: m.a }))} />
          </Card>
        </div>
      )}

      <Note kind="w">
        <b>Cara membaca.</b> Selisih dihitung dari rasio capaian, bukan dari nilai absolut, sehingga
        indikator dengan satuan berbeda tetap dapat disandingkan. Perubahan komposisi indikator yang
        terisi antar tahun ({sPrev.withA} → {s.withA}) dapat menggeser rata-rata tanpa ada perubahan
        performa sama sekali — baca kedua angka bersamaan.
      </Note>
    </>
  );
}

export function OrgAnalytics({ rows, year }) {
  const opi = OPI(rows);
  const byUnit = groupBy(opi, 'accountability', year);
  const byProgram = groupBy(opi, 'program', year);
  return (
    <>
      <PageHead title="Organization Analytics">
        Agregasi capaian KPI organisasi menurut unit akuntabilitas dan program pada tahun {year}.
      </PageHead>
      <StatusCards rows={opi} year={year} />
      <div className="grid g2 mb">
        <Card title="Capaian per Accountability" sub="rata-rata tidak berbobot, hanya indikator ber-data">
          <BarList items={byUnit.map(g => ({ label: g.key, value: g.score, n: g.withA }))} />
        </Card>
        <Card title="Capaian per Program" sub="rata-rata tidak berbobot, hanya indikator ber-data">
          <BarList items={byProgram.map(g => ({ label: g.key, value: g.score, n: g.withA }))} />
        </Card>
      </div>
      <Card title="Daftar KPI" sub={`${opi.length} KPI organisasi`}>
        <IndicatorRows rows={opi} year={year} cols={{ group: 'Accountability', key: 'accountability' }} />
      </Card>
    </>
  );
}
