'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, BarList, groupBy, statSummary,
         PeriodChip, quarterFill, achievement, actualOf, fmt, pct, useState, useMemo } from './common';
import { useScope, ScopeBar } from './scope';
import { useLang } from '@/components/LangProvider';

/* =====================================================================
   Modul AI berbasis ATURAN, bukan model bahasa.
   Setiap keluaran dipisah tiga blok — Fakta / Interpretasi / Keterbatasan —
   sesuai prinsip pada concept note: sistem tidak boleh menyatakan penyebab
   yang tidak didukung data.
   ===================================================================== */

const Block = ({ t, kind, children }) => (
  <div className={'note ' + kind} style={{ marginBottom: 12 }}>
    <b>{t}</b>
    <div style={{ marginTop: 6 }}>{children}</div>
  </div>
);

export const Facts = ({ children }) => <Block t="Fakta dari data" kind="i">{children}</Block>;
export const Interp = ({ children }) => <Block t="Interpretasi & rekomendasi" kind="s">{children}</Block>;
export const Limits = ({ children }) => <Block t="Keterbatasan data" kind="w">{children}</Block>;

function baseFacts(rows, year) {
  const s = statSummary(rows, year);
  const opi = rows.filter(r => r.type === 'OPI');
  const ppi = rows.filter(r => r.type === 'PPI');
  return { s, sOpi: statSummary(opi, year), sPpi: statSummary(ppi, year), opi, ppi };
}

function LimitsStandard({ s, year }) {
  const { t } = useLang();
  return (
    <Limits>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>{t('ai.limit.excluded', { missing: s.total - s.withA, total: s.total, year })}</li>
        <li>{t('ai.limit.unweighted')}</li>
        <li>{t('ai.limit.noExplain')}</li>
        <li>{t('ai.limit.rules')}</li>
      </ul>
    </Limits>
  );
}

export function AiSummary({ rows, year, qtr = 2, regions }) {
  const scope = useScope(rows, year, regions);
  const list = scope.rows;
  const { s, sOpi, sPpi } = baseFacts(list, year);
  const sRpi = statSummary(list.filter(r => r.type === 'RPI'), year);
  const { t } = useLang();
  const f = quarterFill(list, year, qtr);
  return (
    <>
      <PageHead title={`Executive Summary — Q${qtr} ${year}`} right={<PeriodChip year={year} qtr={qtr} />}>
        Ringkasan dihasilkan dari aturan atas data yang tersimpan. Fakta, interpretasi, dan
        keterbatasan dipisahkan secara eksplisit.
      </PageHead>
      <ScopeBar scope={scope} regions={regions} />
      <Card>
        <Facts>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>{t('ai.total', { total: s.total, withA: s.withA, year })}</li>
            <li>{t('ai.avg', { score: pct(s.score), withA: s.withA, total: s.total })}</li>
            <li>{t('ai.byFramework', { opi: pct(sOpi.score), nOpi: sOpi.withA,
                rpi: pct(sRpi.score), nRpi: sRpi.withA, region: scope.region,
                ppi: pct(sPpi.score), nPpi: sPpi.withA })}</li>
            <li>{t('ai.status', { ok: s.counts.ok, am: s.counts.am, rd: s.counts.rd, gy: s.counts.gy })}</li>
            <li>{t('ai.fill', { qtr, filled: f.filled, total: f.total,
                ratio: (f.ratio * 100).toFixed(0) + '%' })}</li>
          </ul>
        </Facts>
        <Interp>
          {s.withA === 0
            ? t('ai.interp.none')
            : s.counts.gy > s.withA
              ? t('ai.interp.gaps', { gy: s.counts.gy, withA: s.withA })
              : t('ai.interp.risk', { rd: s.counts.rd, gy: s.counts.gy })}
        </Interp>
        <LimitsStandard s={s} year={year} />
      </Card>
    </>
  );
}

const QA = [
  { k: ['ringkas', 'summary', 'kinerja tahun'], id: 'sum' },
  { k: ['at risk', 'risiko', 'bermasalah'], id: 'risk' },
  { k: ['kelengkapan', 'lengkap', 'data'], id: 'compl' },
  { k: ['portfolio', 'terendah', 'terburuk'], id: 'worst' }
];

export function AiAsk({ rows, year, regions }) {
  const scope = useScope(rows, year, regions);
  const list = scope.rows;
  const [q, setQ] = useState('');
  const [ans, setAns] = useState(null);
  const { s } = baseFacts(list, year);
  const { t } = useLang();

  function answer() {
    const t = q.toLowerCase();
    const hit = QA.find(x => x.k.some(k => t.includes(k)));
    if (!hit) { setAns({ type: 'none' }); return; }
    if (hit.id === 'sum') setAns({ type: 'sum' });
    if (hit.id === 'risk') setAns({ type: 'risk',
      list: list.map(r => ({ r, a: achievement(r.years?.[year] || r.year, r) }))
        .filter(x => x.a !== null && x.a < 0.75).sort((a, b) => a.a - b.a).slice(0, 10) });
    if (hit.id === 'compl') setAns({ type: 'compl' });
    if (hit.id === 'worst') setAns({ type: 'worst',
      list: groupBy(list.filter(r => r.portfolio), 'portfolio', year)
        .filter(g => g.score !== null).sort((a, b) => a.score - b.score).slice(0, 6) });
  }

  return (
    <>
      <PageHead title="Ask AI">
        Ajukan pertanyaan tentang data kinerja. Asisten menjawab hanya dari data yang tersimpan di
        SIGMA dan menyatakan bila data tidak cukup.
      </PageHead>
      <ScopeBar scope={scope} regions={regions} />
      <Card className="mb">
        <div className="fld" style={{ margin: 0 }}>
          <input value={q} onChange={e => setQ(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && answer()}
                 placeholder="Contoh: ringkas kinerja tahun ini / indikator apa yang at risk? / berapa kelengkapan data?" />
        </div>
        <div className="mt"><button className="btn p" onClick={answer}>Tanyakan</button></div>
      </Card>

      {ans && (
        <Card>
          {ans.type === 'none' && (
            <>
              <Facts>{t('ai.ask.unknown')}</Facts>
              <Limits>{t('ai.ask.unknownLimit')}</Limits>
            </>
          )}
          {ans.type === 'sum' && (
            <>
              <Facts>{t('ai.ask.sum', { year, score: pct(s.score), withA: s.withA, total: s.total,
                ok: s.counts.ok, am: s.counts.am, rd: s.counts.rd, gy: s.counts.gy })}</Facts>
              <LimitsStandard s={s} year={year} />
            </>
          )}
          {ans.type === 'risk' && (
            <>
              <Facts>{t('ai.ask.riskCount', { n: ans.list.length })}
                {ans.list.length > 0 && ' ' + t('ai.ask.riskTop')}
                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {ans.list.map(x => <li key={x.r.id}>{x.r.name} — {pct(x.a)}</li>)}
                </ul>
              </Facts>
              <LimitsStandard s={s} year={year} />
            </>
          )}
          {ans.type === 'compl' && (
            <>
              <Facts>{t('ai.ask.compl', { withA: s.withA, total: s.total,
                ratio: Math.round(s.withA / Math.max(1, s.total) * 100) + '%', year, gy: s.counts.gy })}</Facts>
              <Interp>{t('ai.ask.complInterp')}</Interp>
            </>
          )}
          {ans.type === 'worst' && (
            <>
              <Facts>
                <BarList items={ans.list.map(g => ({ label: g.key, value: g.score, n: g.withA }))} />
              </Facts>
              <Limits>{t('ai.ask.worstLimit')}</Limits>
            </>
          )}
        </Card>
      )}
    </>
  );
}

export function AiInterpret({ rows, year, regions }) {
  const scope = useScope(rows, year, regions);
  const list = scope.rows;
  const [id, setId] = useState('');
  const { t } = useLang();
  const r = list.find(x => x.id === id);
  const y = r ? (r.years?.[year] || r.year) : null;
  const a = r ? achievement(y, r) : null;
  const q = y ? [y.q1, y.q2, y.q3, y.q4] : [];
  const filled = q.filter(v => v !== null && v !== undefined).map(Number);

  return (
    <>
      <PageHead title="Performance Interpretation">
        Pilih satu indikator untuk memperoleh pembacaan terstruktur atas pola datanya.
      </PageHead>
      <ScopeBar scope={scope} regions={regions}>
        <select value={id} onChange={e => setId(e.target.value)} style={{ minWidth: 320 }} title="Indikator">
          <option value="">— pilih indikator —</option>
          {list.slice(0, 400).map(x => <option key={x.id} value={x.id}>{x.id} — {x.name.slice(0, 70)}</option>)}
        </select>
      </ScopeBar>

      {!r ? <Card><NoData title="Belum ada indikator dipilih" /></Card> : (
        <Card title={r.name}
              sub={`${r.id} · ${r.type} · unit ${r.unit || '—'}${r.type === 'RPI' ? ' · region ' + scope.region : ''}`}>
          <Facts>{t('ai.int.facts', {
            year, target: fmt(y?.target, r.unit), actual: fmt(actualOf(y, r), r.unit),
            ach: pct(a), filled: filled.length,
            detail: q.map((v, i) => `Q${i + 1} ${v === null || v === undefined ? '—' : fmt(v, r.unit)}`).join(', ')
          })}</Facts>
          <Interp>
            {a === null
              ? t('ai.int.noData')
              : filled.length < 2
                ? t('ai.int.onePoint', { ach: pct(a) })
                : filled[filled.length - 1] < filled[filled.length - 2]
                  ? t('ai.int.down', { ach: pct(a) })
                  : t('ai.int.steady', { ach: pct(a) })}
          </Interp>
          <Limits>{t('ai.int.limit')}</Limits>
        </Card>
      )}
    </>
  );
}

export function AiRootCause({ rows, year, regions }) {
  const scope = useScope(rows, year, regions);
  const groups = useMemo(() => groupBy(scope.rows.filter(r => r.portfolio || r.strategy_map),
    'portfolio', year).filter(g => g.score !== null).sort((a, b) => a.score - b.score), [scope.rows, year]);
  const { t } = useLang();
  const worst = groups[0];
  const inner = worst ? worst.list.map(r => ({ r, a: achievement(r.years?.[year] || r.year, r) }))
    .filter(x => x.a !== null).sort((a, b) => a.a - b.a).slice(0, 8) : [];

  return (
    <>
      <PageHead title="Root Cause Analysis">
        Analisis dekomposisi: kelompok mana yang menarik turun capaian, dan indikator mana di dalamnya
        yang menjadi kontributor terbesar.
      </PageHead>
      <ScopeBar scope={scope} regions={regions} />
      {!worst ? <Card><NoData title="Belum cukup data" hint="Tidak ada kelompok dengan capaian yang dapat dihitung." /></Card> : (
        <Card title={`Kelompok dengan capaian terendah: ${worst.key}`}
              sub={`${worst.n} indikator · ${worst.withA} ber-capaian · rata-rata ${pct(worst.score)}`}>
          <Facts>
            <BarList items={inner.map(x => ({ label: x.r.name, value: x.a }))} />
          </Facts>
          <Interp>{t('ai.rca.interp')}</Interp>
          <Limits>{t('ai.rca.limit')}</Limits>
        </Card>
      )}
    </>
  );
}

export function AiForecast({ rows, year, regions }) {
  const scope = useScope(rows, year, regions);
  const { t } = useLang();
  const list = useMemo(() => scope.rows.map(r => {
    const y = r.years?.[year] || r.year;
    const pts = [y?.q1, y?.q2, y?.q3, y?.q4]
      .map((v, i) => (v === null || v === undefined ? null : { x: i + 1, y: Number(v) }))
      .filter(Boolean);
    if (pts.length < 2 || y?.target === null || y?.target === undefined) return null;
    const n = pts.length;
    const sx = pts.reduce((a, p) => a + p.x, 0), sy = pts.reduce((a, p) => a + p.y, 0);
    const sxy = pts.reduce((a, p) => a + p.x * p.y, 0), sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
    const den = n * sxx - sx * sx;
    if (den === 0) return null;
    const b = (n * sxy - sx * sy) / den, aI = (sy - b * sx) / n;
    const proj = aI + b * 4;
    return { r, pts: n, proj, target: Number(y.target), ratio: Number(y.target) ? proj / Number(y.target) : null };
  }).filter(Boolean).sort((a, b) => (a.ratio ?? 9) - (b.ratio ?? 9)), [scope.rows, year]);

  return (
    <>
      <PageHead title="Forecast">
        Proyeksi akhir tahun memakai regresi linier atas nilai kuartal yang tersedia. Metode sederhana
        ini dipilih agar dapat diaudit; keterbatasannya dinyatakan pada setiap baris.
      </PageHead>
      <ScopeBar scope={scope} regions={regions} />
      {!list.length ? <Card><NoData title="Data tidak cukup"
        hint="Proyeksi memerlukan minimal dua nilai kuartal dan target pada tahun yang sama." /></Card> : (
        <Card sub={t('ai.fc.eligible', { n: list.length })}>
          <div className="tbl-w"><table>
            <thead><tr><th>ID</th><th style={{ minWidth: 240 }}>Indikator</th>
              <th className="num">Titik data</th><th className="num">Proyeksi Q4</th>
              <th className="num">Target</th><th className="num">Proyeksi vs target</th><th>Keyakinan</th></tr></thead>
            <tbody>
              {list.slice(0, 120).map(x => (
                <tr key={x.r.id}>
                  <td><span className="code">{x.r.id}</span></td>
                  <td className="t-name">{x.r.name}</td>
                  <td className="num">{x.pts}</td>
                  <td className="num">{fmt(x.proj, x.r.unit)}</td>
                  <td className="num">{fmt(x.target, x.r.unit)}</td>
                  <td className="num">{pct(x.ratio)}</td>
                  <td><Badge cls={x.pts >= 3 ? 'b-am' : 'b-rd'}>
                    {x.pts >= 3 ? 'rendah' : 'sangat rendah'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>
      )}
      <Note kind="w"><b>Keterbatasan yang harus disampaikan bersama angka ini.</b> {t('ai.fc.limit')}</Note>
    </>
  );
}

export function AiRecommend({ rows, year, regions }) {
  const scope = useScope(rows, year, regions);
  const list = scope.rows;
  const s = statSummary(list, year);
  const { t } = useLang();
  const noTarget = list.filter(r => {
    const y = r.years?.[year] || r.year;
    return (y?.target === null || y?.target === undefined) &&
      [y?.q1, y?.q2, y?.q3, y?.q4].some(v => v !== null && v !== undefined);
  }).length;
  const atRisk = s.counts.rd;

  const recs = [
    s.counts.gy > 0 && {
      p: 'Tinggi', title: t('ai.rec.fillTitle', { n: s.counts.gy }),
      basis: t('ai.rec.fillBasis', { gy: s.counts.gy, total: s.total, year }),
      act: t('ai.rec.fillAct')
    },
    noTarget > 0 && {
      p: 'Tinggi', title: t('ai.rec.targetTitle', { n: noTarget }),
      basis: t('ai.rec.targetBasis', { n: noTarget }),
      act: t('ai.rec.targetAct')
    },
    atRisk > 0 && {
      p: 'Sedang', title: t('ai.rec.riskTitle', { n: atRisk }),
      basis: t('ai.rec.riskBasis', { n: atRisk, year }),
      act: t('ai.rec.riskAct')
    },
    {
      p: 'Sedang', title: t('ai.rec.nTitle'),
      basis: t('ai.rec.nBasis', { score: pct(s.score), withA: s.withA, total: s.total }),
      act: t('ai.rec.nAct')
    }
  ].filter(Boolean);

  return (
    <>
      <PageHead title="Recommendation">
        Rekomendasi dihasilkan dari aturan atas kondisi data saat ini. Setiap butir menyebutkan dasar
        bukti dan tindakan konkret.
      </PageHead>
      <ScopeBar scope={scope} regions={regions} />
      <Card>
        <div className="tbl-w"><table>
          <thead><tr><th style={{ width: 80 }}>Prioritas</th><th style={{ minWidth: 220 }}>Rekomendasi</th>
            <th style={{ minWidth: 240 }}>Dasar bukti</th><th style={{ minWidth: 240 }}>Tindakan yang disarankan</th></tr></thead>
          <tbody>
            {recs.map((r, i) => (
              <tr key={i}>
                <td><Badge cls={r.p === 'Tinggi' ? 'b-rd' : 'b-am'}>{r.p}</Badge></td>
                <td className="t-name">{r.title}</td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{r.basis}</td>
                <td style={{ fontSize: 12 }}>{r.act}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
      <Note kind="w">{t('ai.rec.limit')}</Note>
    </>
  );
}

export function AiNarrative({ rows, year, regions }) {
  const scope = useScope(rows, year, regions);
  const list = scope.rows;
  const { s, sOpi, sPpi } = baseFacts(list, year);
  const sRpi = statSummary(list.filter(r => r.type === 'RPI'), year);
  const { t } = useLang();
  const text = [
    t('ai.nar.p1', { year, total: s.total, nOpi: sOpi.total, nRpi: sRpi.total,
                     region: scope.region, nPpi: sPpi.total, withA: s.withA }),
    t('ai.nar.p2', { score: pct(s.score), withA: s.withA,
                     opi: pct(sOpi.score), nOpiA: sOpi.withA,
                     rpi: pct(sRpi.score), nRpiA: sRpi.withA,
                     ppi: pct(sPpi.score), nPpiA: sPpi.withA }),
    t('ai.nar.p3', { ok: s.counts.ok, am: s.counts.am, rd: s.counts.rd, gy: s.counts.gy }),
    t('ai.nar.p4', { gy: s.counts.gy })
  ].join('\n\n');


  return (
    <>
      <PageHead title="Auto Narrative">
        Draft narasi laporan yang dihasilkan dari data tervalidasi. Draft ini titik awal penulisan,
        bukan laporan final.
      </PageHead>
      <ScopeBar scope={scope} regions={regions} />
      <Card right={<button className="btn sm" onClick={() => navigator.clipboard?.writeText(text)}>Salin teks</button>}>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.75 }}>{text}</div>
      </Card>
      <Note kind="w">{t('ai.nar.limit')}</Note>
    </>
  );
}
