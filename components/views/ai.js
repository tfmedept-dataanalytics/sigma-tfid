'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, BarList, groupBy, statSummary,
         PeriodChip, quarterFill, achievement, actualOf, fmt, pct, useState, useMemo } from './common';

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

const LimitsStandard = ({ s, year }) => (
  <Limits>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li>{s.total - s.withA} dari {s.total} indikator tidak memiliki target dan actual sekaligus pada {year},
          sehingga dikeluarkan dari seluruh perhitungan — bukan dihitung sebagai nol.</li>
      <li>Rata-rata bersifat tidak berbobot: indikator kecil dan besar berpengaruh sama.</li>
      <li>Sistem tidak menyimpan variabel penjelas (anggaran, cakupan, konteks lapangan),
          sehingga penyebab tidak dapat diuji dari dalam SIGMA.</li>
      <li>Analisis ini dihasilkan dari aturan aritmetika, bukan model bahasa maupun model prediktif.</li>
    </ul>
  </Limits>
);

export function AiSummary({ rows, year, qtr = 2 }) {
  const { s, sOpi, sPpi } = baseFacts(rows, year);
  const f = quarterFill(rows, year, qtr);
  return (
    <>
      <PageHead title={`Executive Summary — Q${qtr} ${year}`} right={<PeriodChip year={year} qtr={qtr} />}>
        Ringkasan dihasilkan dari aturan atas data yang tersimpan. Fakta, interpretasi, dan
        keterbatasan dipisahkan secara eksplisit.
      </PageHead>
      <Card>
        <Facts>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>{s.total} indikator terdaftar; {s.withA} memiliki target dan actual sekaligus pada {year}.</li>
            <li>Rata-rata capaian gabungan {pct(s.score)} — dihitung dari {s.withA} indikator.</li>
            <li>OPI: {pct(sOpi.score)} dari {sOpi.withA} indikator ber-data.
                PPI: {pct(sPpi.score)} dari {sPpi.withA} indikator ber-data.</li>
            <li>Sebaran status: On Track {s.counts.ok}, Near Target {s.counts.am},
                At Risk {s.counts.rd}, No Data {s.counts.gy}.</li>
            <li>Kelengkapan Q{qtr}: {f.filled} dari {f.total} indikator sudah terisi
                ({(f.ratio * 100).toFixed(0)}%).</li>
          </ul>
        </Facts>
        <Interp>
          {s.withA === 0
            ? 'Belum ada satu pun indikator yang dapat dinilai capaiannya pada periode ini. Prioritas pertama adalah melengkapi target dan actual, bukan menafsirkan performa.'
            : s.counts.gy > s.withA
              ? `Jumlah indikator tanpa data (${s.counts.gy}) melebihi yang ber-data (${s.withA}). Angka rata-rata di atas belum mewakili portofolio secara keseluruhan; memperbaiki kelengkapan data akan lebih mengubah keandalan keputusan daripada memperbaiki capaian indikator mana pun.`
              : `Sebanyak ${s.counts.rd} indikator berada di bawah ambang At Risk dan layak dibahas lebih dulu dalam forum review. Perhatikan bahwa ${s.counts.gy} indikator masih tanpa data sehingga gambaran ini belum lengkap.`}
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

export function AiAsk({ rows, year }) {
  const [q, setQ] = useState('');
  const [ans, setAns] = useState(null);
  const { s } = baseFacts(rows, year);

  function answer() {
    const t = q.toLowerCase();
    const hit = QA.find(x => x.k.some(k => t.includes(k)));
    if (!hit) { setAns({ type: 'none' }); return; }
    if (hit.id === 'sum') setAns({ type: 'sum' });
    if (hit.id === 'risk') setAns({ type: 'risk',
      list: rows.map(r => ({ r, a: achievement(r.years?.[year] || r.year, r) }))
        .filter(x => x.a !== null && x.a < 0.75).sort((a, b) => a.a - b.a).slice(0, 10) });
    if (hit.id === 'compl') setAns({ type: 'compl' });
    if (hit.id === 'worst') setAns({ type: 'worst',
      list: groupBy(rows.filter(r => r.portfolio), 'portfolio', year)
        .filter(g => g.score !== null).sort((a, b) => a.score - b.score).slice(0, 6) });
  }

  return (
    <>
      <PageHead title="Ask AI">
        Ajukan pertanyaan tentang data kinerja. Asisten menjawab hanya dari data yang tersimpan di
        SIGMA dan menyatakan bila data tidak cukup.
      </PageHead>
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
              <Facts>Pertanyaan tidak dikenali oleh aturan yang tersedia.</Facts>
              <Limits>Modul ini memakai pencocokan aturan sederhana, bukan pemahaman bahasa alami penuh.
                Coba kata kunci: ringkas kinerja, at risk, kelengkapan data, portfolio terendah.</Limits>
            </>
          )}
          {ans.type === 'sum' && (
            <>
              <Facts>Rata-rata capaian {year}: {pct(s.score)}, dihitung dari {s.withA} dari {s.total} indikator.
                On Track {s.counts.ok}, Near Target {s.counts.am}, At Risk {s.counts.rd}, No Data {s.counts.gy}.</Facts>
              <LimitsStandard s={s} year={year} />
            </>
          )}
          {ans.type === 'risk' && (
            <>
              <Facts>{ans.list.length} indikator berada di bawah 75% dari target.
                {ans.list.length > 0 && ' Sepuluh terendah:'}
                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {ans.list.map(x => <li key={x.r.id}>{x.r.name} — {pct(x.a)}</li>)}
                </ul>
              </Facts>
              <LimitsStandard s={s} year={year} />
            </>
          )}
          {ans.type === 'compl' && (
            <>
              <Facts>{s.withA} dari {s.total} indikator ({Math.round(s.withA / Math.max(1, s.total) * 100)}%)
                memiliki target dan actual sekaligus pada {year}. Sisanya {s.counts.gy} berstatus No Data.</Facts>
              <Interp>Selama proporsi No Data setinggi ini, angka agregat sebaiknya selalu disajikan
                bersama jumlah indikator ber-data, agar pembaca tidak menyimpulkan lebih dari yang didukung data.</Interp>
            </>
          )}
          {ans.type === 'worst' && (
            <>
              <Facts>
                <BarList items={ans.list.map(g => ({ label: g.key, value: g.score, n: g.withA }))} />
              </Facts>
              <Limits>Kelompok dengan sedikit indikator ber-data akan tampak ekstrem karena rata-ratanya
                tidak teredam. Periksa n sebelum menyimpulkan.</Limits>
            </>
          )}
        </Card>
      )}
    </>
  );
}

export function AiInterpret({ rows, year }) {
  const [id, setId] = useState('');
  const r = rows.find(x => x.id === id);
  const y = r ? (r.years?.[year] || r.year) : null;
  const a = r ? achievement(y, r) : null;
  const q = y ? [y.q1, y.q2, y.q3, y.q4] : [];
  const filled = q.filter(v => v !== null && v !== undefined).map(Number);

  return (
    <>
      <PageHead title="Performance Interpretation">
        Pilih satu indikator untuk memperoleh pembacaan terstruktur atas pola datanya.
      </PageHead>
      <Card className="mb"><div className="filters">
        <select value={id} onChange={e => setId(e.target.value)} style={{ minWidth: 320 }}>
          <option value="">— pilih indikator —</option>
          {rows.slice(0, 400).map(x => <option key={x.id} value={x.id}>{x.id} — {x.name.slice(0, 70)}</option>)}
        </select>
      </div></Card>

      {!r ? <Card><NoData title="Belum ada indikator dipilih" /></Card> : (
        <Card title={r.name} sub={`${r.id} · unit ${r.unit || '—'}`}>
          <Facts>
            Target {year}: {fmt(y?.target, r.unit)}. Actual: {fmt(actualOf(y, r), r.unit)}.
            Capaian: {pct(a)}. Kuartal terisi: {filled.length} dari 4
            ({q.map((v, i) => `Q${i + 1} ${v === null || v === undefined ? '—' : fmt(v, r.unit)}`).join(', ')}).
          </Facts>
          <Interp>
            {a === null
              ? 'Capaian belum dapat dinilai karena target atau actual belum lengkap. Melengkapi keduanya adalah langkah pertama sebelum indikator ini dapat masuk pembahasan kinerja.'
              : filled.length < 2
                ? `Capaian ${pct(a)} berasal dari satu titik data, sehingga arah perubahan dalam tahun berjalan belum dapat dinilai.`
                : filled[filled.length - 1] < filled[filled.length - 2]
                  ? `Capaian ${pct(a)} dengan nilai kuartal terakhir lebih rendah daripada sebelumnya. Pola ini perlu penjelasan dari pemilik indikator sebelum ditafsirkan sebagai penurunan kinerja.`
                  : `Capaian ${pct(a)} dengan nilai kuartal yang tidak menurun. Pola ini konsisten dengan pelaksanaan yang berjalan sesuai rencana.`}
          </Interp>
          <Limits>
            Pembacaan ini hanya memakai angka yang tersimpan pada indikator ini. Konteks pelaksanaan,
            perubahan definisi, maupun perbedaan cakupan antar kuartal tidak terekam di sistem dan
            dapat mengubah kesimpulan sepenuhnya.
          </Limits>
        </Card>
      )}
    </>
  );
}

export function AiRootCause({ rows, year }) {
  const groups = useMemo(() => groupBy(rows.filter(r => r.portfolio || r.strategy_map),
    'portfolio', year).filter(g => g.score !== null).sort((a, b) => a.score - b.score), [rows, year]);
  const worst = groups[0];
  const inner = worst ? worst.list.map(r => ({ r, a: achievement(r.years?.[year] || r.year, r) }))
    .filter(x => x.a !== null).sort((a, b) => a.a - b.a).slice(0, 8) : [];

  return (
    <>
      <PageHead title="Root Cause Analysis">
        Analisis dekomposisi: kelompok mana yang menarik turun capaian, dan indikator mana di dalamnya
        yang menjadi kontributor terbesar.
      </PageHead>
      {!worst ? <Card><NoData title="Belum cukup data" hint="Tidak ada kelompok dengan capaian yang dapat dihitung." /></Card> : (
        <Card title={`Kelompok dengan capaian terendah: ${worst.key}`}
              sub={`${worst.n} indikator · ${worst.withA} ber-capaian · rata-rata ${pct(worst.score)}`}>
          <Facts>
            <BarList items={inner.map(x => ({ label: x.r.name, value: x.a }))} />
          </Facts>
          <Interp>
            Indikator di urutan teratas daftar itu yang paling menarik turun rata-rata kelompok.
            Membahasnya lebih dulu memberi pengaruh terbesar terhadap angka kelompok — dengan catatan
            bahwa rata-rata tidak berbobot memperlakukan seluruh indikator setara.
          </Interp>
          <Limits>
            Analisis ini menunjukkan <b>di mana</b> capaian rendah terkonsentrasi, bukan <b>mengapa</b>.
            SIGMA tidak menyimpan variabel penjelas, sehingga hubungan sebab-akibat tidak dapat diuji.
            Menyebut daftar ini sebagai &ldquo;akar masalah&rdquo; akan melampaui yang didukung data.
          </Limits>
        </Card>
      )}
    </>
  );
}

export function AiForecast({ rows, year }) {
  const list = useMemo(() => rows.map(r => {
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
  }).filter(Boolean).sort((a, b) => (a.ratio ?? 9) - (b.ratio ?? 9)), [rows, year]);

  return (
    <>
      <PageHead title="Forecast">
        Proyeksi akhir tahun memakai regresi linier atas nilai kuartal yang tersedia. Metode sederhana
        ini dipilih agar dapat diaudit; keterbatasannya dinyatakan pada setiap baris.
      </PageHead>
      {!list.length ? <Card><NoData title="Data tidak cukup"
        hint="Proyeksi memerlukan minimal dua nilai kuartal dan target pada tahun yang sama." /></Card> : (
        <Card sub={`${list.length} indikator memenuhi syarat minimal`}>
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
      <Note kind="w">
        <b>Keterbatasan yang harus disampaikan bersama angka ini.</b> Dua titik data hanya menghasilkan
        satu garis lurus tanpa informasi ketidakpastian sama sekali — proyeksinya tidak memiliki
        rentang kepercayaan. Regresi linier juga mengasumsikan laju perubahan tetap, yang jarang berlaku
        pada program dengan pelaksanaan musiman atau bertahap. Gunakan angka ini sebagai pemicu diskusi,
        bukan sebagai dasar keputusan alokasi.
      </Note>
    </>
  );
}

export function AiRecommend({ rows, year }) {
  const s = statSummary(rows, year);
  const noTarget = rows.filter(r => {
    const y = r.years?.[year] || r.year;
    return (y?.target === null || y?.target === undefined) &&
      [y?.q1, y?.q2, y?.q3, y?.q4].some(v => v !== null && v !== undefined);
  }).length;
  const atRisk = s.counts.rd;

  const recs = [
    s.counts.gy > 0 && {
      p: 'Tinggi', title: `Lengkapi data ${s.counts.gy} indikator berstatus No Data`,
      basis: `${s.counts.gy} dari ${s.total} indikator tidak memiliki target dan actual sekaligus pada ${year}.`,
      act: 'Tetapkan pemilik indikator dan tenggat pengisian per portfolio, lalu pantau lewat Workflow & Approval.'
    },
    noTarget > 0 && {
      p: 'Tinggi', title: `Tetapkan target untuk ${noTarget} indikator yang sudah punya actual`,
      basis: `${noTarget} indikator memiliki nilai kuartal tetapi belum bertarget, sehingga capaiannya tidak dapat dinilai.`,
      act: 'Jadwalkan sesi penetapan target bersama pemilik program sebelum siklus pelaporan berikutnya.'
    },
    atRisk > 0 && {
      p: 'Sedang', title: `Bahas ${atRisk} indikator At Risk dalam forum review`,
      basis: `${atRisk} indikator berada di bawah 75% dari target pada ${year}.`,
      act: 'Minta penjelasan tertulis pada field Challenge/Deviation dan Corrective Action sebelum approval.'
    },
    {
      p: 'Sedang', title: 'Sertakan jumlah indikator ber-data pada setiap angka agregat',
      basis: `Rata-rata capaian ${pct(s.score)} berasal dari ${s.withA} indikator, bukan dari ${s.total}.`,
      act: 'Gunakan format "x% (n=…)" pada seluruh materi presentasi dan laporan donor.'
    }
  ].filter(Boolean);

  return (
    <>
      <PageHead title="Recommendation">
        Rekomendasi dihasilkan dari aturan atas kondisi data saat ini. Setiap butir menyebutkan dasar
        bukti dan tindakan konkret.
      </PageHead>
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
      <Note kind="w">
        Prioritas ditentukan dari besar pengaruhnya terhadap keandalan pengambilan keputusan, bukan dari
        besar dampak programatik — SIGMA tidak memiliki informasi untuk menilai yang kedua.
      </Note>
    </>
  );
}

export function AiNarrative({ rows, year }) {
  const { s, sOpi, sPpi } = baseFacts(rows, year);
  const text =
`Pada ${year}, SIGMA mencatat ${s.total} indikator kinerja, terdiri atas ${sOpi.total} indikator organisasi (OPI) dan ${sPpi.total} indikator program (PPI). Dari jumlah tersebut, ${s.withA} indikator memiliki target dan actual sekaligus sehingga capaiannya dapat dihitung.

Rata-rata capaian gabungan tercatat ${pct(s.score)}, dihitung secara tidak berbobot dari ${s.withA} indikator yang datanya lengkap. Pada kerangka organisasi, rata-rata capaian ${pct(sOpi.score)} berasal dari ${sOpi.withA} indikator; pada kerangka program, ${pct(sPpi.score)} dari ${sPpi.withA} indikator.

Sebaran status menunjukkan ${s.counts.ok} indikator On Track, ${s.counts.am} Near Target, ${s.counts.rd} At Risk, dan ${s.counts.gy} berstatus No Data. Indikator berstatus No Data belum memiliki target atau actual dan tidak diperlakukan sebagai capaian nol; indikator tersebut dikeluarkan dari seluruh perhitungan rata-rata.

Angka agregat pada periode ini perlu dibaca bersama jumlah indikator yang benar-benar memiliki data. Dengan ${s.counts.gy} indikator masih kosong, rata-rata di atas belum mewakili keseluruhan portofolio, dan perbandingan antar periode dapat bergeser semata-mata karena perubahan komposisi indikator yang terisi.`;

  return (
    <>
      <PageHead title="Auto Narrative">
        Draft narasi laporan yang dihasilkan dari data tervalidasi. Draft ini titik awal penulisan,
        bukan laporan final.
      </PageHead>
      <Card right={<button className="btn sm" onClick={() => navigator.clipboard?.writeText(text)}>Salin teks</button>}>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.75 }}>{text}</div>
      </Card>
      <Note kind="w">
        Narasi ini hanya menyusun ulang angka yang tersimpan. Ia tidak mengetahui konteks pelaksanaan,
        perubahan kebijakan, maupun peristiwa lapangan — semua itu harus ditambahkan penulis laporan.
      </Note>
    </>
  );
}
