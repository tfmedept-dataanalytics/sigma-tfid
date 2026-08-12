'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, statSummary,
         achievement, fmt, pct, useState, useMemo } from './common';

export function MdIndicators({ rows, year }) {
  const [q, setQ] = useState('');
  const [t, setT] = useState('');
  const list = useMemo(() => rows.filter(r => {
    if (t && r.type !== t) return false;
    if (q) {
      const hay = [r.id, r.name, r.code, r.portfolio, r.project, r.program].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [rows, q, t]);

  const withTarget = rows.filter(r => {
    const y = r.years?.[year];
    return y && y.target !== null && y.target !== undefined;
  }).length;

  return (
    <>
      <PageHead title="Indicator Management">
        Struktur indikator pada kedua kerangka. Perubahan struktur berlaku untuk seluruh tahun; nilai
        target dan actual tetap tersimpan per tahun.
      </PageHead>
      <div className="grid g4 mb">
        <Kpi label="Total indikator" value={rows.length}
             detail={`OPI ${rows.filter(r => r.type === 'OPI').length} · PPI ${rows.filter(r => r.type === 'PPI').length}`} />
        <Kpi label={`Punya target ${year}`} value={withTarget} detail="dasar perhitungan capaian" cls="gd" />
        <Kpi label={`Punya actual ${year}`} value={rows.filter(r => {
          const y = r.years?.[year];
          return y && [y.q1, y.q2, y.q3, y.q4].some(v => v !== null && v !== undefined);
        }).length} detail="minimal satu nilai kuartal" cls="b" />
        <Kpi label="Ber-capaian" value={statSummary(rows, year).withA} detail="target dan actual lengkap" cls="a" />
      </div>

      <Card className="mb"><div className="filters">
        <input type="search" value={q} onChange={e => setQ(e.target.value)}
               placeholder="Cari nama, kode, portfolio, project…" />
        <select value={t} onChange={e => setT(e.target.value)}>
          <option value="">Semua kerangka</option>
          <option value="OPI">OPI — Organization</option>
          <option value="PPI">PPI — Program</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{list.length} indikator</span>
      </div></Card>

      <Card><div className="tbl-w"><table>
        <thead><tr><th style={{ width: 74 }}>ID</th><th style={{ minWidth: 300 }}>Indikator</th>
          <th>Kerangka</th><th>Hierarki</th><th>Unit</th><th className="num">Target {year}</th></tr></thead>
        <tbody>
          {list.slice(0, 400).map(r => (
            <tr key={r.id}>
              <td><span className="code">{r.id}</span></td>
              <td><div className="t-name">{r.name}</div>
                {r.code && <div className="t-meta"><span className="code">{r.code}</span></div>}</td>
              <td><Badge cls={r.type === 'OPI' ? 'b-bl' : 'b-gd'}>{r.type}</Badge></td>
              <td style={{ fontSize: 11.5, color: 'var(--muted)', maxWidth: 320 }}>
                {(r.type === 'OPI'
                  ? [r.strategy_map, r.program, r.accountability]
                  : [r.toc_foundation, r.portfolio, r.project, r.level]).filter(Boolean).join(' › ')}
              </td>
              <td><Badge cls="b-gy">{r.unit || '—'}</Badge></td>
              <td className="num">{fmt(r.years?.[year]?.target, r.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {list.length > 400 && <div className="card-b" style={{ fontSize: 12, color: 'var(--muted)' }}>
        400 baris pertama ditampilkan. Persempit dengan pencarian.</div>}
      </Card>

      <Note kind="w">
        Penambahan dan penghapusan indikator dari antarmuka ini belum diaktifkan pada versi Next.js;
        struktur indikator saat ini dimuat lewat file seed. Perubahan nilai per kuartal tetap dilakukan
        dari Quarterly Update.
      </Note>
    </>
  );
}

export function MdYears({ rows, allYears, year }) {
  const stats = allYears.map(y => {
    const rec = rows.filter(r => r.years?.[y]);
    const s = statSummary(rows, y);
    const qf = [0, 1, 2, 3].map(k => rec.filter(r => {
      const v = [r.years[y].q1, r.years[y].q2, r.years[y].q3, r.years[y].q4][k];
      return v !== null && v !== undefined;
    }).length);
    return {
      y, tot: rec.length,
      opi: rec.filter(r => r.type === 'OPI').length,
      ppi: rec.filter(r => r.type === 'PPI').length,
      wT: rec.filter(r => r.years[y].target !== null && r.years[y].target !== undefined).length,
      wQ: rec.filter(r => [r.years[y].q1, r.years[y].q2, r.years[y].q3, r.years[y].q4]
        .some(v => v !== null && v !== undefined)).length,
      qf, score: s.score
    };
  });

  return (
    <>
      <PageHead title="Year Management">
        Kesiapan tiap periode pelaporan. Satu indikator dapat memiliki banyak tahun; target dan actual
        disimpan terpisah per tahun sehingga riwayat periode sebelumnya tidak tertimpa.
      </PageHead>
      <Card><div className="tbl-w"><table>
        <thead><tr><th>Tahun</th><th className="num">OPI</th><th className="num">PPI</th>
          <th className="num">Total</th><th className="num">Punya target</th><th className="num">Punya actual</th>
          <th className="ctr">Q1</th><th className="ctr">Q2</th><th className="ctr">Q3</th><th className="ctr">Q4</th>
          <th className="num">Rata-rata capaian</th></tr></thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.y} style={s.y === year ? { background: 'var(--green-x)' } : undefined}>
              <td><b>{s.y}</b>{s.y === year && <> <Badge cls="b-ok">aktif</Badge></>}</td>
              <td className="num">{s.opi}</td><td className="num">{s.ppi}</td>
              <td className="num"><b>{s.tot}</b></td>
              <td className="num">{s.wT}</td><td className="num">{s.wQ}</td>
              {s.qf.map((v, i) => (
                <td className="ctr" key={i} style={{ color: v ? 'var(--ink)' : 'var(--faint)' }}>{v}</td>
              ))}
              <td className="num"><b>{pct(s.score)}</b></td>
            </tr>
          ))}
        </tbody>
      </table></div></Card>

      <Note kind="w">
        <b>Cara membaca.</b> Kolom Q1–Q4 menghitung berapa indikator yang <i>terisi</i> pada kuartal
        tersebut, bukan capaiannya. Kolom rata-rata hanya menghitung indikator yang memiliki target dan
        actual sekaligus — indikator tanpa data dikeluarkan, tidak dianggap nol, sehingga angka ini
        tidak boleh dibaca sebagai capaian seluruh portofolio.
      </Note>
    </>
  );
}
