'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, StatusBadge, Progress, Spark, BarList,
         groupBy, StatusCards, IndicatorRows, statSummary, ReadinessNote,
         achievement, actualOf, statusClass, STATUS_LABEL, fmt, pct, useState, useMemo } from './common';
import { STATUS_COLOR } from '@/lib/calc';
import TrendChart from '@/components/TrendChart';
import Pathway from '@/components/Pathway';
import { trendFrom } from '@/lib/trendClient';

export function AnOverview({ rows, year }) {
  const s = statSummary(rows, year);
  const byType = groupBy(rows, 'type', year);
  return (
    <>
      <PageHead title="Performance Overview">
        Kondisi seluruh indikator pada tahun {year}, dipisah menurut kerangka dan sebaran statusnya.
      </PageHead>
      <StatusCards rows={rows} year={year} />
      <div className="grid g4 mb">
        {['ok', 'am', 'rd', 'gy'].map(k => (
          <Kpi key={k} label={STATUS_LABEL[k]} value={s.counts[k]}
               detail={`${s.total ? Math.round(s.counts[k] / s.total * 100) : 0}% dari seluruh indikator`} />
        ))}
      </div>
      <Card title="Capaian per kerangka" sub="OPI dan PPI dibandingkan pada dasar yang sama: rasio capaian">
        <BarList items={byType.map(g => ({ label: `${g.key} (${g.n} indikator)`, value: g.score, n: g.withA }))} />
      </Card>
      <div className="mt"><ReadinessNote {...s} year={year} /></div>
    </>
  );
}

export function AnTrend({ rows, allYears }) {
  const t = useMemo(() => trendFrom(rows, allYears), [rows, allYears]);
  return (
    <>
      <PageHead title="Trend Analysis">
        Perkembangan rata-rata capaian antar tahun pelaporan, dipisah menjadi OPI, PPI, dan gabungan.
        Garis yang terputus berarti tahun itu tidak memiliki indikator ber-data.
      </PageHead>
      <TrendChart years={t.years} opi={t.opi} ppi={t.ppi} all={t.all} />
    </>
  );
}

export function AnTargetActual({ rows, year }) {
  const list = useMemo(() => rows
    .map(r => {
      const y = r.years?.[year] || r.year;
      const a = actualOf(y, r), t = y?.target;
      if (a === null || t === null || t === undefined) return null;
      return { r, a, t, gap: a - Number(t), ratio: achievement(y, r) };
    })
    .filter(Boolean)
    .sort((x, y2) => x.ratio - y2.ratio), [rows, year]);

  return (
    <>
      <PageHead title="Target vs Actual">
        Perbandingan target dan actual per indikator pada {year}, diurutkan dari capaian terendah.
        Gap ditampilkan dalam satuan asli indikator, sehingga tidak dapat dijumlahkan antar indikator.
      </PageHead>
      {!list.length ? (
        <Card><NoData title="Belum ada pasangan target dan actual"
          hint={`Tidak ada indikator dengan target sekaligus actual pada ${year}.`} /></Card>
      ) : (
        <Card sub={`${list.length} indikator memiliki target dan actual sekaligus`}>
          <div className="tbl-w"><table>
            <thead><tr><th>ID</th><th style={{ minWidth: 260 }}>Indikator</th>
              <th className="num">Target</th><th className="num">Actual</th>
              <th className="num">Gap</th><th style={{ width: 120 }}>Capaian</th><th>Status</th></tr></thead>
            <tbody>
              {list.slice(0, 200).map(x => (
                <tr key={x.r.id}>
                  <td><span className="code">{x.r.id}</span></td>
                  <td className="t-name">{x.r.name}</td>
                  <td className="num">{fmt(x.t, x.r.unit)}</td>
                  <td className="num">{fmt(x.a, x.r.unit)}</td>
                  <td className="num" style={{ color: x.gap < 0 ? 'var(--red)' : 'var(--green)' }}>
                    {x.gap > 0 ? '+' : ''}{fmt(x.gap, x.r.unit)}
                  </td>
                  <td><Progress a={x.ratio} /></td>
                  <td><StatusBadge a={x.ratio} /></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>
      )}
    </>
  );
}

export function AnHeatmap({ rows, year }) {
  const [key, setKey] = useState('portfolio');
  const groups = useMemo(() => groupBy(rows.filter(r => r[key]), key, year), [rows, key, year]);

  const cell = (list, qi) => {
    const vals = list.map(r => {
      const y = r.years?.[year] || r.year;
      const v = [y?.q1, y?.q2, y?.q3, y?.q4][qi];
      const t = y?.target;
      if (v === null || v === undefined || t === null || t === undefined || Number(t) === 0) return null;
      return Number(v) / Number(t);
    }).filter(v => v !== null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  return (
    <>
      <PageHead title="Heatmap">
        Rata-rata capaian tiap kelompok pada setiap kuartal {year}. Sel abu-abu berarti tidak ada
        indikator dengan nilai pada kuartal tersebut — bukan capaian nol.
      </PageHead>
      <Card className="mb"><div className="filters">
        <select value={key} onChange={e => setKey(e.target.value)}>
          <option value="portfolio">ToC Portfolio Level</option>
          <option value="project">Project Level</option>
          <option value="strategy_map">Strategy Map (OPI)</option>
          <option value="accountability">Accountability (OPI)</option>
        </select>
      </div></Card>

      <Card>
        <div className="tbl-w"><table>
          <thead><tr><th style={{ minWidth: 220 }}>Kelompok</th>
            <th className="ctr">Q1</th><th className="ctr">Q2</th><th className="ctr">Q3</th><th className="ctr">Q4</th>
            <th className="num">Rata-rata tahunan</th></tr></thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.key}>
                <td className="t-name">{g.key}<div className="t-meta">{g.n} indikator</div></td>
                {[0, 1, 2, 3].map(qi => {
                  const v = cell(g.list, qi);
                  return (
                    <td className="ctr" key={qi}
                        style={{
                          background: v === null ? 'var(--grey-b)' : STATUS_COLOR[statusClass(v)] + '22',
                          fontWeight: 600, fontSize: 12
                        }}>
                      {v === null ? <span style={{ color: 'var(--faint)' }}>—</span> : pct(v)}
                    </td>
                  );
                })}
                <td className="num">{pct(g.score)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>

      <Note kind="w">
        <b>Catatan metode.</b> Data sumber tidak memuat target per kuartal, sehingga nilai tiap kuartal
        dibandingkan terhadap <i>target tahunan</i>. Untuk indikator kumulatif, kuartal awal secara
        alami akan tampak rendah — itu sifat perbandingannya, bukan temuan kinerja.
      </Note>
    </>
  );
}

export function AnCompare({ rows, year }) {
  const [key, setKey] = useState('portfolio');
  const groups = useMemo(() => groupBy(rows.filter(r => r[key]), key, year)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1)), [rows, key, year]);
  return (
    <>
      <PageHead title="Portfolio Comparison">
        Perbandingan antar kelompok pada {year}, diurutkan dari capaian tertinggi. Jumlah indikator
        ber-data ditampilkan agar perbandingan tidak menyesatkan.
      </PageHead>
      <Card className="mb"><div className="filters">
        <select value={key} onChange={e => setKey(e.target.value)}>
          <option value="portfolio">ToC Portfolio Level</option>
          <option value="project">Project Level</option>
          <option value="toc_foundation">ToC Foundation Level</option>
          <option value="strategy_map">Strategy Map (OPI)</option>
          <option value="program">Program (OPI)</option>
        </select>
      </div></Card>
      <Card><BarList items={groups.map(g => ({ label: `${g.key} (${g.n})`, value: g.score, n: g.withA }))} /></Card>
      <Note kind="w">
        Kelompok dengan satu atau dua indikator ber-data akan tampak ekstrem — tinggi maupun rendah —
        karena rata-ratanya tidak teredam. Perhatikan n sebelum menyimpulkan kelompok mana yang
        berkinerja lebih baik.
      </Note>
    </>
  );
}

export function AnRanking({ rows, year }) {
  const [dir, setDir] = useState('asc');
  const list = useMemo(() => rows
    .map(r => ({ r, a: achievement(r.years?.[year] || r.year, r) }))
    .filter(x => x.a !== null)
    .sort((x, y2) => dir === 'asc' ? x.a - y2.a : y2.a - x.a), [rows, year, dir]);

  return (
    <>
      <PageHead title="Performance Ranking">
        Peringkat indikator berdasarkan capaian terhadap target {year}. Hanya indikator yang memiliki
        target dan actual sekaligus yang dapat diperingkat.
      </PageHead>
      <Card className="mb"><div className="filters">
        <select value={dir} onChange={e => setDir(e.target.value)}>
          <option value="asc">Capaian terendah dulu</option>
          <option value="desc">Capaian tertinggi dulu</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
          {list.length} indikator ber-capaian
        </span>
      </div></Card>
      {!list.length ? <Card><NoData title="Belum ada indikator ber-capaian" /></Card> : (
        <Card><div className="tbl-w"><table>
          <thead><tr><th style={{ width: 50 }}>#</th><th>ID</th><th style={{ minWidth: 280 }}>Indikator</th>
            <th style={{ width: 130 }}>Capaian</th><th>Status</th></tr></thead>
          <tbody>
            {list.slice(0, 100).map((x, i) => (
              <tr key={x.r.id}>
                <td>{i + 1}</td>
                <td><span className="code">{x.r.id}</span></td>
                <td className="t-name">{x.r.name}</td>
                <td><Progress a={x.a} /></td>
                <td><StatusBadge a={x.a} /></td>
              </tr>
            ))}
          </tbody>
        </table></div></Card>
      )}
    </>
  );
}

export function AnRisk({ rows, year, config }) {
  const th = config?.thresholds || { near_target: 75 };
  const alerts = useMemo(() => {
    const out = [];
    rows.forEach(r => {
      const y = r.years?.[year] || r.year;
      const a = achievement(y, r);
      if (a !== null && a * 100 < (th.near_target || 75)) {
        out.push({ r, rule: `Capaian ${pct(a)} di bawah ambang ${th.near_target || 75}%`, sev: 'rd', a });
      }
      const q = [y?.q1, y?.q2, y?.q3, y?.q4].filter(v => v !== null && v !== undefined).map(Number);
      if (q.length >= 2 && q[q.length - 1] < q[q.length - 2]) {
        out.push({ r, rule: 'Nilai kuartal terakhir lebih rendah daripada kuartal sebelumnya', sev: 'am', a });
      }
      if ((y?.target === null || y?.target === undefined) &&
          [y?.q1, y?.q2, y?.q3, y?.q4].some(v => v !== null && v !== undefined)) {
        out.push({ r, rule: 'Ada actual tetapi target belum ditetapkan — capaian tidak dapat dinilai', sev: 'am', a: null });
      }
    });
    return out;
  }, [rows, year, th]);

  return (
    <>
      <PageHead title="Risk & Early Warning">
        Peringatan dini dihasilkan dari aturan eksplisit terhadap data yang tersimpan — bukan model
        prediktif. Setiap baris menyebutkan aturan yang memicunya.
      </PageHead>
      <div className="grid g4 mb">
        <Kpi label="Total peringatan" value={alerts.length} detail={`pada ${year}`} />
        <Kpi label="Capaian di bawah ambang" value={alerts.filter(a => a.sev === 'rd').length} detail="prioritas tinggi" cls="a" />
        <Kpi label="Tren kuartal menurun" value={alerts.filter(a => a.rule.startsWith('Nilai kuartal')).length} detail="perlu penjelasan" cls="gd" />
        <Kpi label="Target belum ditetapkan" value={alerts.filter(a => a.rule.startsWith('Ada actual')).length} detail="tidak dapat dinilai" cls="b" />
      </div>
      {!alerts.length ? <Card><NoData title="Tidak ada peringatan" hint="Tidak ada aturan yang terpicu pada data saat ini." /></Card> : (
        <Card><div className="tbl-w"><table>
          <thead><tr><th>ID</th><th style={{ minWidth: 250 }}>Indikator</th>
            <th style={{ minWidth: 260 }}>Aturan terpicu</th><th>Capaian</th></tr></thead>
          <tbody>
            {alerts.slice(0, 150).map((x, i) => (
              <tr key={i}>
                <td><span className="code">{x.r.id}</span></td>
                <td className="t-name">{x.r.name}</td>
                <td style={{ fontSize: 12 }}><Badge cls={'b-' + x.sev}>{x.rule}</Badge></td>
                <td>{x.a === null ? '—' : pct(x.a)}</td>
              </tr>
            ))}
          </tbody>
        </table></div></Card>
      )}
      <Note kind="w">
        Peringatan ini menunjukkan <b>di mana</b> ada anomali, bukan <b>mengapa</b>. SIGMA tidak
        menyimpan variabel penjelas seperti anggaran, cakupan, atau konteks lapangan, sehingga
        penyebabnya tidak dapat diuji dari dalam sistem.
      </Note>
    </>
  );
}

export function AnDrill({ rows, year }) {
  const [f1, setF1] = useState('');
  const [f2, setF2] = useState('');
  const scoped = useMemo(() => {
    let l = rows;
    if (f1) l = l.filter(r => r.type === f1);
    if (f2) l = l.filter(r => (r.portfolio || r.strategy_map || '(tidak diisi)') === f2);
    return l;
  }, [rows, f1, f2]);
  const opts2 = useMemo(() => [...new Set((f1 ? rows.filter(r => r.type === f1) : rows)
    .map(r => r.portfolio || r.strategy_map || '(tidak diisi)'))].sort(), [rows, f1]);

  return (
    <>
      <PageHead title="Drill-down Analysis">
        Telusuri dari tingkat kerangka ke kelompok lalu ke indikator: Framework → Portfolio/Strategy
        Map → Indicator.
      </PageHead>
      <Card className="mb"><div className="filters">
        <select value={f1} onChange={e => { setF1(e.target.value); setF2(''); }}>
          <option value="">Semua kerangka</option>
          <option value="OPI">OPI — Organization</option>
          <option value="PPI">PPI — Program</option>
        </select>
        <select value={f2} onChange={e => setF2(e.target.value)}>
          <option value="">Semua Portfolio / Strategy Map</option>
          {opts2.map(o => <option key={o}>{o}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{scoped.length} indikator</span>
      </div></Card>
      <StatusCards rows={scoped} year={year} />
      <Card title="Indikator pada cakupan ini">
        <IndicatorRows rows={scoped} year={year} />
      </Card>
    </>
  );
}

export function AnPathway({ rows, year }) {
  return (
    <>
      <PageHead title="Pathway Diagram">
        Alur hubungan Indicator → Project → ToC Portfolio → ToC Foundation (PPI), atau
        KPI → Program → Outcome → Strategy Map (OPI), dengan nilai pada garis penghubungnya.
      </PageHead>
      <Pathway rows={rows} year={year} />
    </>
  );
}
