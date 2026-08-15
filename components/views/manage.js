'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, statSummary,
         achievement, fmt, pct, useState, useMemo } from './common';
import { NewIndicatorForm, EditIndicatorPanel } from '@/components/IndicatorForm';
import { PeriodForm, DeletePeriodForm } from '@/components/PeriodForm';

export function MdIndicators({ rows, year, allYears, role }) {
  const [q, setQ] = useState('');
  const [t, setT] = useState('');
  const [mode, setMode] = useState(null);      // 'new' | id indikator
  const canDelete = role === 'sysadmin';

  const list = useMemo(() => rows.filter(r => {
    if (t && r.type !== t) return false;
    if (q) {
      const hay = [r.id, r.name, r.code, r.portfolio, r.project, r.program, r.accountability]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [rows, q, t]);

  const editing = mode && mode !== 'new' ? rows.find(r => r.id === mode) : null;
  const withTarget = rows.filter(r => {
    const y = r.years?.[year];
    return y && y.target !== null && y.target !== undefined;
  }).length;

  return (
    <>
      <PageHead title="Indicator Management"
        right={<button className="btn p sm" onClick={() => setMode(mode === 'new' ? null : 'new')}>
          {mode === 'new' ? 'Tutup formulir' : '+ Tambah indikator'}
        </button>}>
        Menambah, mengubah, dan menghapus indikator pada ketiga kerangka. Perubahan struktur berlaku
        untuk seluruh tahun; nilai target dan actual tetap tersimpan per tahun.
      </PageHead>

      <div className="grid g4 mb">
        <Kpi label="Total indikator" value={rows.length}
             detail={`OPI ${rows.filter(r => r.type === 'OPI').length} · RPI ${rows.filter(r => r.type === 'RPI').length} · PPI ${rows.filter(r => r.type === 'PPI').length}`} />
        <Kpi label={`Punya target ${year}`} value={withTarget} detail="dasar perhitungan capaian" cls="gd" />
        <Kpi label={`Punya actual ${year}`} value={rows.filter(r => {
          const y = r.years?.[year];
          return y && [y.q1, y.q2, y.q3, y.q4].some(v => v !== null && v !== undefined);
        }).length} detail="minimal satu nilai kuartal" cls="b" />
        <Kpi label="Punya definisi" value={rows.filter(r => r.definition).length}
             detail={`dari ${rows.length} indikator · MoV ${rows.filter(r => r.mov).length}`} cls="a" />
      </div>

      {mode === 'new' && (
        <NewIndicatorForm rows={rows} years={allYears} defaultYear={year} onDone={() => setMode(null)} />
      )}
      {editing && (
        <EditIndicatorPanel ind={editing} rows={rows} years={allYears}
                            canDelete={canDelete} onDone={() => setMode(null)} />
      )}

      <Card className="mb"><div className="filters">
        <input type="search" value={q} onChange={e => setQ(e.target.value)}
               placeholder="Cari nama, kode, portfolio, project…" />
        <select value={t} onChange={e => setT(e.target.value)}>
          <option value="">Semua kerangka</option>
          <option value="OPI">OPI — Organization</option>
          <option value="RPI">RPI — Regional</option>
          <option value="PPI">PPI — Program</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{list.length} indikator</span>
      </div></Card>

      <Card><div className="tbl-w"><table>
        <thead><tr><th style={{ width: 74 }}>ID</th><th style={{ minWidth: 280 }}>Indikator</th>
          <th>Kerangka</th><th>Hierarki</th><th>Unit</th><th className="num">Target {year}</th>
          <th className="ctr">Definisi</th><th className="ctr">MoV</th>
          <th className="ctr">Periode</th><th className="ctr">Aksi</th></tr></thead>
        <tbody>
          {list.slice(0, 400).map(r => (
            <tr key={r.id} style={mode === r.id ? { background: 'var(--green-x)' } : undefined}>
              <td><span className="code">{r.id}</span></td>
              <td><div className="t-name">{r.name}</div>
                {r.code && <div className="t-meta"><span className="code">{r.code}</span></div>}</td>
              <td><Badge cls={r.type === 'OPI' ? 'b-bl' : r.type === 'RPI' ? 'b-gd' : 'b-gy'}>{r.type}</Badge></td>
              <td style={{ fontSize: 11.5, color: 'var(--muted)', maxWidth: 300 }}>
                {(r.type === 'PPI'
                  ? [r.toc_foundation, r.portfolio, r.project, r.level]
                  : [r.strategy_map, r.program, r.accountability]).filter(Boolean).join(' › ')}
              </td>
              <td><Badge cls="b-gy">{r.unit || '—'}</Badge></td>
              <td className="num">{fmt(r.years?.[year]?.target, r.unit)}</td>
              <td className="ctr">
                <Badge cls={r.definition ? 'b-ok' : 'b-rd'}
                       title={r.definition || 'Belum ada definisi — angka tidak dapat ditelusuri saat audit'}>
                  {r.definition ? '✓' : '—'}
                </Badge>
              </td>
              <td className="ctr">
                <Badge cls={r.mov ? 'b-ok' : 'b-rd'}
                       title={r.mov || 'Belum ada Mean of Verification'}>
                  {r.mov ? '✓' : '—'}
                </Badge>
              </td>
              <td className="ctr" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                {Object.keys(r.years || {}).length}</td>
              <td className="ctr">
                <button className="btn sm" onClick={() => setMode(mode === r.id ? null : r.id)}>
                  {mode === r.id ? 'Tutup' : 'Ubah'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {list.length > 400 && <div className="card-b" style={{ fontSize: 12, color: 'var(--muted)' }}>
        400 baris pertama ditampilkan. Persempit dengan pencarian.</div>}
      </Card>

      <Note kind="w">
        <b>Definisi dan Mean of Verification banyak yang kosong pada data sumber.</b> Kolom Definisi
        dan MoV di atas menandainya. Tanpa keduanya, angka yang dilaporkan tidak dapat ditelusuri
        kembali ke sumbernya maupun diperiksa konsistensinya antar periode — dan itulah yang pertama
        ditanyakan saat audit atau pelaporan donor. Isi lewat tombol <b>Ubah</b> pada baris yang bertanda —.
      </Note>

      <Note kind="w">
        Penambahan indikator hanya membuat strukturnya. Nilai Q1–Q4 diisi melalui Quarterly Update
        pada kerangka yang bersangkutan, sehingga indikator baru tampil sebagai <i>No Data</i> —
        bukan capaian nol — sampai ada actual yang dimasukkan. Untuk RPI, satu indikator otomatis
        memperoleh lima baris: empat region dan satu Akumulasi Regional.
      </Note>
    </>
  );
}

export function MdYears({ rows, allYears, year, role }) {
  const canDelete = role === 'sysadmin';

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
      rpi: rec.filter(r => r.type === 'RPI').length,
      ppi: rec.filter(r => r.type === 'PPI').length,
      wT: rec.filter(r => r.years[y].target !== null && r.years[y].target !== undefined).length,
      wQ: rec.filter(r => [r.years[y].q1, r.years[y].q2, r.years[y].q3, r.years[y].q4]
        .some(v => v !== null && v !== undefined)).length,
      qf, score: s.score
    };
  });

  const next = allYears.length ? Number(allYears[allYears.length - 1]) + 1 : new Date().getFullYear();

  return (
    <>
      <PageHead title="Year Management">
        Menyiapkan periode pelaporan. Satu indikator dapat memiliki banyak tahun; target dan actual
        disimpan terpisah per tahun sehingga riwayat periode sebelumnya tidak tertimpa.
      </PageHead>

      <PeriodForm years={allYears} defaultYear={next} />

      <Card className="mb"><div className="tbl-w"><table>
        <thead><tr><th>Tahun</th><th className="num">OPI</th><th className="num">RPI</th>
          <th className="num">PPI</th><th className="num">Total</th>
          <th className="num">Punya target</th><th className="num">Punya actual</th>
          <th className="ctr">Q1</th><th className="ctr">Q2</th><th className="ctr">Q3</th><th className="ctr">Q4</th>
          <th className="num">Rata-rata capaian</th></tr></thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.y} style={s.y === year ? { background: 'var(--green-x)' } : undefined}>
              <td><b>{s.y}</b>{s.y === year && <> <Badge cls="b-ok">aktif</Badge></>}</td>
              <td className="num">{s.opi}</td><td className="num">{s.rpi}</td><td className="num">{s.ppi}</td>
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

      {canDelete && <DeletePeriodForm years={allYears} />}

      <Note kind="w">
        <b>Cara membaca.</b> Kolom Q1–Q4 menghitung berapa indikator yang <i>terisi</i> pada kuartal
        tersebut, bukan capaiannya. Kolom rata-rata hanya menghitung indikator yang memiliki target
        dan actual sekaligus — indikator tanpa data dikeluarkan, tidak dianggap nol, sehingga angka
        ini tidak boleh dibaca sebagai capaian seluruh portofolio. Kolom RPI menghitung indikator,
        bukan baris; satu indikator RPI memiliki lima baris region di balik layar.
      </Note>
    </>
  );
}
