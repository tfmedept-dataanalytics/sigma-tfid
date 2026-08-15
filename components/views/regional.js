'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, StatusBadge, Progress, Spark, BarList,
         groupBy, statSummary, ReadinessNote, PeriodChip, quarterFill, qVal,
         achievement, actualOf, statusClass, STATUS_LABEL, fmt, pct, useState, useMemo } from './common';
import { STATUS_COLOR } from '@/lib/calc';
import RegionalTable from '@/components/RegionalTable';
import QuarterlyTable from '@/components/QuarterlyTable';
import { useRegion } from '@/lib/useRegion';

const RPI = rows => rows.filter(r => r.type === 'RPI');
const ACCUM = 'Akumulasi Regional';
const DEFAULT_REGION = ACCUM;

/* Baris nilai satu indikator untuk kombinasi tahun + region. */
export const rowOf = (r, year, region) => r.regions?.[year]?.[region] || null;

/** Rata-rata capaian tidak berbobot untuk satu region. */
export function regionScore(rows, year, region) {
  const vals = rows.map(r => achievement(rowOf(r, year, region), r)).filter(v => v !== null);
  return {
    n: rows.length,
    withA: vals.length,
    score: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  };
}

/* Region disimpan pada URL, bukan pada state komponen — sama seperti tahun dan
   kuartal. Dengan begitu pilihan region bertahan saat berpindah antar halaman
   RPI, bertahan setelah halaman dimuat ulang, dan ikut saat tautan dibagikan. */

function RegionPicker({ regions, value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} title="Region">
      {regions.map(r => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}

const RegionNote = () => (
  <Note kind="w">
    <b>Cara membaca angka regional.</b> Setiap region memiliki target sendiri, sehingga capaian antar
    region dibandingkan sebagai rasio terhadap targetnya masing-masing — bukan sebagai nilai absolut.
    Region dengan target lebih rendah dapat menunjukkan capaian tinggi tanpa berarti kontribusinya
    lebih besar.<br /><br />
    <b>Akumulasi Regional</b> adalah penjumlahan nilai Q1–Q4 keempat region (Jawa, Sumatera-A,
    Sumatera-B, Kalimantan), dihitung aplikasi dan tidak dapat diinput manual. Untuk indikator
    ber-unit <b>Percent</b>, penjumlahan tidak bermakna sehingga akumulasi memakai rata-rata tidak
    berbobot — sistem tidak menyimpan populasi atau bobot tiap region, dan pembobotan yang benar
    memerlukan data yang tidak tersedia. Region yang belum mengisi kuartal tertentu tidak dihitung
    sebagai nol; akumulasi hanya menjumlahkan region yang benar-benar punya nilai, sehingga angkanya
    dapat lebih rendah dari kondisi sebenarnya bila ada region yang belum melapor.
  </Note>
);

export function RgMap({ rows, year, regions = [], region: regionProp }) {
  const rpi = RPI(rows);
  const [region, setRegion] = useRegion(regions, regionProp);
  /* `years` ikut ditimpa, bukan hanya `year`: helper bersama (statSummary,
     quarterFill) membaca r.years[tahun] lebih dulu, sehingga tanpa ini kartu
     ringkasan akan selalu menampilkan angka National meski region diganti. */
  const list = useMemo(() => rpi.map(r => {
    const row = rowOf(r, year, region) || {};
    return { ...r, year: row, years: { ...r.years, [year]: row } };
  }), [rpi, year, region]);
  const persp = useMemo(() => {
    const m = new Map();
    list.forEach(r => {
      const k = r.strategy_map || '(tidak diisi)';
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    });
    return [...m.entries()].map(([k, l]) => {
      const vals = l.map(r => achievement(r.year, r)).filter(v => v !== null);
      return { key: k, list: l, n: l.length, withA: vals.length,
        score: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
    }).sort((a, b) => a.key.localeCompare(b.key));
  }, [list]);

  const s = statSummary(list, year);

  return (
    <>
      <PageHead title="Regional Strategy Map" right={<Badge cls="b-gd">Region: {region}</Badge>}>
        Perspektif Balanced Scorecard untuk indikator regional, dibaca pada satu region terpilih.
        Struktur perspektif dan outcome sama dengan OPI; yang berbeda adalah target dan actual-nya
        ditetapkan per region.
      </PageHead>

      <Card className="mb"><div className="filters">
        <RegionPicker regions={regions} value={region} onChange={setRegion} />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
          {list.length} indikator regional
        </span>
      </div></Card>

      <div className="grid g4 mb">
        <Kpi label="Indikator RPI" value={list.length} detail={`region ${region}, tahun ${year}`} />
        <Kpi label="Ber-capaian" value={s.withA} detail="punya target dan actual sekaligus" cls="b" />
        <Kpi label="Rata-rata capaian" value={pct(s.score)} detail={`dihitung dari ${s.withA} indikator saja`} cls="gd" />
        <Kpi label="At Risk" value={s.counts.rd} detail="di bawah 75% dari target" cls="a" />
      </div>

      <div className="grid g2 mb">
        {persp.map(p => (
          <Card key={p.key} title={p.key}
                sub={`${p.n} KPI · ${p.withA} ber-capaian · rata-rata ${pct(p.score)}`}>
            <BarList items={p.list.map(r => ({ label: r.name, value: achievement(r.year, r) }))} />
          </Card>
        ))}
      </div>

      <ReadinessNote {...s} year={year} />
      <div className="mt"><RegionNote /></div>
    </>
  );
}

export function RgRepo({ rows, year, qtr, regions = [], region, role }) {
  return (
    <>
      <PageHead title="KPI Repository — Regional Performance">
        Seluruh KPI regional beserta target dan capaian per kuartal pada region terpilih. Nilai
        Q1–Q4 dapat diubah langsung pada tabel; setiap region disimpan sebagai baris tersendiri.
      </PageHead>
      <RegionalTable rows={RPI(rows)} year={year} qtr={qtr} regions={regions} region={region} role={role} />
    </>
  );
}

export function RgQuarterly({ rows, year, qtr, regions = [], region: regionProp, role }) {
  const rpi = RPI(rows);
  const [region, setRegion] = useRegion(regions, regionProp);
  const listed = useMemo(() => rpi.map(r => {
    const row = rowOf(r, year, region) || {};
    return { ...r, year: row, years: { ...r.years, [year]: row } };
  }), [rpi, year, region]);
  const f = quarterFill(listed, year, qtr);
  return (
    <>
      <PageHead title="Quarterly Update — Regional Performance"
                right={<PeriodChip year={year} qtr={qtr} />}>
        Input actual untuk Q{qtr} {year} pada region terpilih. Kolom kuartal aktif disorot pada tabel.
      </PageHead>
      <QuarterlyTable type="RPI" rows={rpi} year={year} qtr={qtr} regions={regions}
                      region={region} onRegion={setRegion} role={role} />
    </>
  );
}

export function RgCompare({ rows, year, regions = [] }) {
  const rpi = RPI(rows);

  const perRegion = useMemo(() => regions.map(r => ({ region: r, ...regionScore(rpi, year, r) })), [rpi, year, regions]);

  return (
    <>
      <PageHead title="Regional Comparison">
        Perbandingan capaian antar region pada {year}. Setiap region dinilai terhadap targetnya
        sendiri, sehingga yang dibandingkan adalah rasio capaian, bukan besaran absolut.
      </PageHead>

      <div className="grid g4 mb">
        {perRegion.slice(0, 4).map(r => (
          <Kpi key={r.region} label={r.region} value={pct(r.score)}
               detail={`${r.withA} dari ${r.n} indikator ber-data`}
               cls={r.score === null ? '' : statusClass(r.score) === 'ok' ? '' : statusClass(r.score) === 'am' ? 'a' : 'r'} />
        ))}
      </div>

      <Card title="Rata-rata capaian per region" sub="rata-rata tidak berbobot, hanya indikator ber-data" className="mb">
        <BarList items={perRegion.map(r => ({ label: `${r.region} (${r.n})`, value: r.score, n: r.withA }))} />
      </Card>

      <Card title="Matriks indikator × region" sub={`Capaian tiap indikator pada setiap region, tahun ${year}.`}>
        <div className="tbl-w"><table>
          <thead><tr>
            <th style={{ minWidth: 260 }}>Indikator</th>
            <th>Unit</th>
            {regions.map(r => <th key={r} className="ctr">{r}</th>)}
          </tr></thead>
          <tbody>
            {rpi.map(r => (
              <tr key={r.id}>
                <td><div className="t-name">{r.name}</div>
                  <div className="t-meta"><span className="code">{r.id}</span> · {r.portfolio || '—'}</div></td>
                <td><Badge cls="b-gy">{r.unit || '—'}</Badge></td>
                {regions.map(reg => {
                  const y = rowOf(r, year, reg);
                  const a = achievement(y, r);
                  return (
                    <td className="ctr" key={reg}
                        style={{ background: a === null ? 'var(--grey-b)' : STATUS_COLOR[statusClass(a)] + '22',
                                 fontSize: 11.5, fontWeight: 600 }}>
                      {a === null
                        ? <span style={{ color: 'var(--faint)' }}>—</span>
                        : <>{pct(a)}<div className="t-meta">{fmt(actualOf(y, r), r.unit)} / {fmt(y?.target, r.unit)}</div></>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>

      <div className="mt"><RegionNote /></div>
    </>
  );
}

export function RgAnnual({ rows, year, regions = [], region: regionProp }) {
  const rpi = RPI(rows);
  const prev = String(Number(year) - 1);
  const [region, setRegion] = useRegion(regions, regionProp);

  const moved = useMemo(() => rpi.map(r => {
    const a = achievement(rowOf(r, year, region), r);
    const b = achievement(rowOf(r, prev, region), r);
    return (a !== null && b !== null) ? { r, a, b, d: a - b } : null;
  }).filter(Boolean).sort((x, y2) => y2.d - x.d), [rpi, year, prev, region]);

  const cur = regionScore(rpi, year, region);
  const old = regionScore(rpi, prev, region);

  return (
    <>
      <PageHead title={`Annual Performance Review — Regional ${year}`}
                right={<Badge cls="b-gd">Region: {region}</Badge>}>
        Capaian tahunan region terpilih dan perbandingannya dengan {prev}. Perbandingan hanya
        mencakup indikator yang memiliki data pada kedua tahun.
      </PageHead>

      <Card className="mb"><div className="filters">
        <RegionPicker regions={regions} value={region} onChange={setRegion} />
      </div></Card>

      <div className="grid g4 mb">
        <Kpi label={`Rata-rata ${year}`} value={pct(cur.score)} detail={`${cur.withA} indikator ber-data`} />
        <Kpi label={`Rata-rata ${prev}`} value={pct(old.score)} detail={`${old.withA} indikator ber-data`} cls="b" />
        <Kpi label="Dapat dibandingkan" value={moved.length} detail={`punya data di ${prev} dan ${year}`} cls="gd" />
        <Kpi label="Total indikator" value={rpi.length} detail="KPI regional" cls="a" />
      </div>

      {!moved.length ? (
        <Card><NoData title="Belum dapat dibandingkan"
          hint={`Tidak ada indikator yang memiliki capaian pada ${prev} sekaligus ${year} di region ${region}.`} /></Card>
      ) : (
        <div className="grid g2">
          <Card title="Kenaikan terbesar" sub={`selisih capaian ${prev} → ${year}`}>
            <BarList items={moved.slice(0, 8).map(m => ({ label: m.r.name, value: m.a }))} />
          </Card>
          <Card title="Penurunan terbesar" sub={`selisih capaian ${prev} → ${year}`}>
            <BarList items={moved.slice(-8).reverse().map(m => ({ label: m.r.name, value: m.a }))} />
          </Card>
        </div>
      )}

      <div className="mt">
        <Note kind="w">
          Data RPI hanya memuat dua tahun pelaporan ({prev} dan {year}), dan pengisian {prev} jauh
          lebih tipis daripada {year}. Perbandingan antar tahun karena itu berpijak pada sedikit
          indikator dan belum layak dibaca sebagai tren.
        </Note>
      </div>
    </>
  );
}

export function RgAnalytics({ rows, year, regions = [], region: regionProp }) {
  const rpi = RPI(rows);
  const [region, setRegion] = useRegion(regions, regionProp);
  /* `years` ikut ditimpa, bukan hanya `year`: helper bersama (statSummary,
     quarterFill) membaca r.years[tahun] lebih dulu, sehingga tanpa ini kartu
     ringkasan akan selalu menampilkan angka National meski region diganti. */
  const list = useMemo(() => rpi.map(r => {
    const row = rowOf(r, year, region) || {};
    return { ...r, year: row, years: { ...r.years, [year]: row } };
  }), [rpi, year, region]);

  const grp = (key) => {
    const m = new Map();
    list.forEach(r => {
      const k = r[key] || '(tidak diisi)';
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    });
    return [...m.entries()].map(([k, l]) => {
      const vals = l.map(r => achievement(r.year, r)).filter(v => v !== null);
      return { key: k, n: l.length, withA: vals.length,
        score: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
    }).sort((a, b) => a.key.localeCompare(b.key));
  };

  const s = statSummary(list, year);

  return (
    <>
      <PageHead title="Regional Analytics" right={<Badge cls="b-gd">Region: {region}</Badge>}>
        Agregasi capaian KPI regional menurut unit akuntabilitas, program, dan ToC Portfolio pada
        region terpilih.
      </PageHead>

      <Card className="mb"><div className="filters">
        <RegionPicker regions={regions} value={region} onChange={setRegion} />
      </div></Card>

      <div className="grid g4 mb">
        {['ok', 'am', 'rd', 'gy'].map(k => (
          <Kpi key={k} label={STATUS_LABEL[k]} value={s.counts[k]}
               detail={`${s.total ? Math.round(s.counts[k] / s.total * 100) : 0}% dari indikator regional`} />
        ))}
      </div>

      <div className="grid g2 mb">
        <Card title="Capaian per Accountability" sub="rata-rata tidak berbobot, hanya indikator ber-data">
          <BarList items={grp('accountability').map(g => ({ label: g.key, value: g.score, n: g.withA }))} />
        </Card>
        <Card title="Capaian per ToC Portfolio" sub="rata-rata tidak berbobot, hanya indikator ber-data">
          <BarList items={grp('portfolio').map(g => ({ label: g.key, value: g.score, n: g.withA }))} />
        </Card>
      </div>

      <Card title="Daftar KPI regional" sub={`${list.length} indikator pada region ${region}`}>
        <div className="tbl-w"><table>
          <thead><tr><th>ID</th><th style={{ minWidth: 280 }}>Indikator</th>
            <th>Accountability</th><th className="num">Target</th><th className="num">Actual</th>
            <th style={{ width: 120 }}>Capaian</th><th className="ctr">Q1–Q4</th><th>Status</th></tr></thead>
          <tbody>
            {list.map(r => {
              const a = achievement(r.year, r);
              return (
                <tr key={r.id}>
                  <td><span className="code">{r.id}</span></td>
                  <td className="t-name">{r.name}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>{r.accountability || '—'}</td>
                  <td className="num">{fmt(r.year?.target, r.unit)}</td>
                  <td className="num">{fmt(actualOf(r.year, r), r.unit)}</td>
                  <td><Progress a={a} /></td>
                  <td className="ctr"><Spark row={r.year} unit={r.unit} /></td>
                  <td><StatusBadge a={a} /></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </Card>

      <div className="mt"><ReadinessNote {...s} year={year} /></div>
    </>
  );
}
