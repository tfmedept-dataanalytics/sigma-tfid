'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { createIndicator, updateIndicator, deleteIndicator, addPeriodForIndicator } from '@/app/actions/indicators';

const UNITS = ['Number', 'Percent', 'Text', 'Ratio', 'Index', 'Score'];
const CALCS = ['', 'Annual', 'Cumulative', 'Average'];
const LEVELS = ['', 'Output', 'Intermediate Outcome', 'Outcome', 'Impact'];
const AGGS = [
  ['', 'Ikuti aturan umum'],
  ['max', 'MAX kuartal'],
  ['sum', 'Jumlah kuartal'],
  ['last', 'Kuartal terakhir terisi']
];

function Submit({ label, busy }) {
  const { pending } = useFormStatus();
  return <button className="btn p" type="submit" disabled={pending}>{pending ? (busy || 'Menyimpan…') : label}</button>;
}

const Msg = ({ state }) => (
  <>
    {state?.error && <div className="note d mb">{state.error}</div>}
    {state?.ok && <div className="note s mb">{state.message}</div>}
  </>
);

/** Daftar nilai unik pada kolom tertentu, untuk datalist. */
const uniq = (rows, key) => [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();

function Fields({ type, rows, ind, unit, setUnit }) {
  const dl = (id, key) => (
    <datalist id={id}>{uniq(rows, key).map(v => <option key={v} value={v} />)}</datalist>
  );
  const v = k => ind?.[k] || '';

  return (
    <>
      <div className="fld">
        <label>Nama indikator *</label>
        <textarea name="name" rows={2} defaultValue={v('name')} required />
      </div>

      {type === 'PPI' ? (
        <>
          <div className="grid g2">
            <div className="fld"><label>Indicator code</label>
              <input name="code" defaultValue={v('code')} placeholder="TPL1.1.1.1.OC-1" /></div>
            <div className="fld"><label>Level of Change</label>
              <select name="level" defaultValue={v('level')}>
                {LEVELS.map(l => <option key={l} value={l}>{l || '— tidak diisi —'}</option>)}
              </select></div>
          </div>
          <div className="fld"><label>ToC Foundation Level</label>
            <input name="toc_foundation" list="dl-tf" defaultValue={v('toc_foundation')} autoComplete="off" />
            {dl('dl-tf', 'toc_foundation')}</div>
          <div className="grid g2">
            <div className="fld"><label>ToC Portfolio Level</label>
              <input name="portfolio" list="dl-pf" defaultValue={v('portfolio')} autoComplete="off" />
              {dl('dl-pf', 'portfolio')}</div>
            <div className="fld"><label>Project Level</label>
              <input name="project" list="dl-pj" defaultValue={v('project')} autoComplete="off" />
              {dl('dl-pj', 'project')}</div>
          </div>
          <div className="fld"><label>Result statement</label>
            <textarea name="result_statement" rows={2} defaultValue={v('result_statement')} /></div>
          <div className="fld"><label>Definition</label>
            <textarea name="definition" rows={2} defaultValue={v('definition')} /></div>
          <div className="grid g2">
            <div className="fld"><label>Mean of Verification</label>
              <input name="mov" defaultValue={v('mov')} /></div>
            <div className="fld"><label>Period of Data Collection</label>
              <input name="period" defaultValue={v('period')} placeholder="Quarterly / Annual" /></div>
          </div>
        </>
      ) : (
        <>
          <div className="grid g2">
            <div className="fld"><label>Strategy Map</label>
              <input name="strategy_map" list="dl-sm" defaultValue={v('strategy_map')} autoComplete="off" />
              {dl('dl-sm', 'strategy_map')}</div>
            <div className="fld"><label>Outcome</label>
              <input name="outcome" list="dl-oc" defaultValue={v('outcome')} autoComplete="off" />
              {dl('dl-oc', 'outcome')}</div>
          </div>
          <div className="grid g3">
            <div className="fld"><label>Accountability</label>
              <input name="accountability" list="dl-ac" defaultValue={v('accountability')} autoComplete="off" />
              {dl('dl-ac', 'accountability')}</div>
            <div className="fld"><label>Program</label>
              <input name="program" list="dl-pg" defaultValue={v('program')} autoComplete="off" />
              {dl('dl-pg', 'program')}</div>
            <div className="fld"><label>ToC Portfolio</label>
              <input name="portfolio" list="dl-pf2" defaultValue={v('portfolio')} autoComplete="off" />
              {dl('dl-pf2', 'portfolio')}</div>
          </div>
          <div className="fld"><label>Details</label>
            <input name="details" defaultValue={v('details')} /></div>

          {/* Definition dan Mean of Verification sebelumnya hanya tersedia untuk PPI.
              Tanpa keduanya, angka OPI dan RPI tidak dapat ditelusuri kembali ke
              sumbernya maupun diperiksa konsistensinya antar periode — padahal
              itu justru yang ditanyakan saat audit dan pelaporan donor. */}
          <div className="fld"><label>Definition</label>
            <textarea name="definition" rows={2} defaultValue={v('definition')} />
            <div className="hint">
              Penjelasan apa yang diukur dan bagaimana menghitungnya. Ditampilkan pada form
              Quarterly Update agar pengisi angka membacanya sebelum mengisi.
            </div></div>
          <div className="grid g2">
            <div className="fld"><label>Mean of Verification</label>
              <input name="mov" defaultValue={v('mov')} placeholder="Sumber data dan cara verifikasinya" /></div>
            <div className="fld"><label>Period of Data Collection</label>
              <input name="period" defaultValue={v('period')} placeholder="Quarterly / Semi-annual / Annual" /></div>
          </div>
          <div className="fld"><label>Result statement</label>
            <textarea name="result_statement" rows={2} defaultValue={v('result_statement')} /></div>
        </>
      )}

      <div className="grid g4">
        <div className="fld"><label>Unit *</label>
          <select name="unit" value={unit} onChange={e => setUnit(e.target.value)}>
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </select></div>
        <div className="fld"><label>Calculation type</label>
          <select name="calc" defaultValue={v('calc')}>
            {CALCS.map(c => <option key={c} value={c}>{c || '— tidak diisi —'}</option>)}
          </select></div>
        <div className="fld"><label>Agregasi actual Q1–Q4</label>
          <select name="agg" defaultValue={v('agg')}>
            {AGGS.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
          </select></div>
        <div className="fld"><label>Target 2030</label>
          <input name="t2030" type="number" step="any"
                 defaultValue={ind?.t2030 == null ? '' : (unit === 'Percent' ? ind.t2030 * 100 : ind.t2030)} /></div>
      </div>

      <div className="hint">
        Aturan agregasi umum: unit <b>Percent</b> memakai nilai kuartal tertinggi (MAX), unit lain
        dijumlahkan. Pilih <b>Kuartal terakhir terisi</b> untuk indikator yang menggambarkan kondisi
        pada satu titik waktu — tingkat kehadiran, pemenuhan, prevalensi, jumlah unit aktif, indeks —
        karena MAX akan melaporkan kuartal terbaik dan penjumlahan akan menggandakan objek yang sama.
        {unit === 'Percent' && <> Untuk unit Percent, isi target dalam persen (80 untuk 80%); sistem
        menyimpannya sebagai desimal agar konsisten dengan data yang sudah ada.</>}
      </div>
    </>
  );
}

/** Formulir tambah indikator. */
export function NewIndicatorForm({ rows, years, defaultYear, onDone }) {
  const [state, action] = useFormState(createIndicator, {});
  const [type, setType] = useState('OPI');
  const [unit, setUnit] = useState('Number');

  return (
    <div className="card mb">
      <div className="card-h">
        <h3>Tambah indikator</h3>
        <div className="sub">
          Indikator baru dibuat beserta baris periode tahun yang dipilih. Nilai Q1–Q4 diisi kemudian
          melalui Quarterly Update, sehingga indikator ini tampil sebagai <i>No Data</i> — bukan
          capaian nol — sampai ada actual yang dimasukkan.
        </div>
      </div>
      <div className="card-b">
        <Msg state={state} />
        <form action={action}>
          <div className="grid g3">
            <div className="fld"><label>Kerangka *</label>
              <select name="type" value={type} onChange={e => setType(e.target.value)}>
                <option value="OPI">OPI — Organization Performance</option>
                <option value="RPI">RPI — Regional Performance</option>
                <option value="PPI">PPI — Program Performance</option>
              </select></div>
            <div className="fld"><label>Tahun periode pertama *</label>
              <input name="year" type="number" defaultValue={defaultYear} required /></div>
            <div className="fld"><label>Target tahun tersebut</label>
              <input name="target" type="number" step="any" />
              <div className="hint">Boleh dikosongkan bila target belum ditetapkan.</div></div>
          </div>

          {type === 'RPI' && (
            <div className="note i mb">
              Indikator RPI otomatis memperoleh lima baris periode: Jawa, Sumatera-A, Sumatera-B,
              Kalimantan, dan Akumulasi Regional. Target yang Anda isi di atas ditempatkan pada baris
              akumulasi; target tiap region diisi kemudian dari KPI Repository regional. Nilai Q1–Q4
              akumulasi tidak diinput karena selalu dihitung dari keempat region.
            </div>
          )}

          <Fields type={type} rows={rows} unit={unit} setUnit={setUnit} />
          <div className="row mt">
            <Submit label="Simpan indikator" />
            {onDone && <button type="button" className="btn" onClick={onDone}>Tutup</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

/** Formulir ubah indikator + tambah periode + hapus. */
export function EditIndicatorPanel({ ind, rows, years, onDone, canDelete }) {
  const [state, action] = useFormState(updateIndicator, {});
  const [periodState, periodAction] = useFormState(addPeriodForIndicator, {});
  const [delState, delAction] = useFormState(deleteIndicator, {});
  const [unit, setUnit] = useState(ind.unit || 'Number');
  const [confirmDel, setConfirmDel] = useState(false);

  const owned = Object.keys(ind.years || {}).sort();

  return (
    <div className="card mb">
      <div className="card-h">
        <h3>{ind.id} — {ind.name}</h3>
        <div className="sub">
          Perubahan struktur berlaku untuk seluruh tahun. Nilai target dan actual tetap tersimpan
          per tahun dan tidak terpengaruh.
        </div>
      </div>
      <div className="card-b">
        <Msg state={state} />
        <form action={action}>
          <input type="hidden" name="id" value={ind.id} />
          <Fields type={ind.type} rows={rows} ind={ind} unit={unit} setUnit={setUnit} />
          <div className="row mt">
            <Submit label="Simpan perubahan" />
            {onDone && <button type="button" className="btn" onClick={onDone}>Tutup</button>}
          </div>
        </form>

        <div style={{ borderTop: '1px solid var(--line-s)', margin: '18px 0 14px' }} />

        <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Tambah periode untuk indikator ini</h4>
        <div className="t-meta mb">Periode yang sudah ada: {owned.length ? owned.join(', ') : 'belum ada'}</div>
        <Msg state={periodState} />
        <form action={periodAction}>
          <input type="hidden" name="id" value={ind.id} />
          <div className="grid g3">
            <div className="fld"><label>Tahun</label>
              <input name="year" type="number"
                     defaultValue={owned.length ? Number(owned[owned.length - 1]) + 1 : new Date().getFullYear()} /></div>
            <div className="fld"><label>Target tahun tersebut</label>
              <input name="target" type="number" step="any" /></div>
            <div className="fld" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Submit label="Tambah periode" busy="Membuat…" />
            </div>
          </div>
        </form>

        {canDelete && (
          <>
            <div style={{ borderTop: '1px solid var(--line-s)', margin: '18px 0 14px' }} />
            {!confirmDel ? (
              <button className="btn dg" type="button" onClick={() => setConfirmDel(true)}>
                Hapus indikator ini
              </button>
            ) : (
              <>
                <div className="note d mb">
                  <b>Tindakan ini permanen.</b> Seluruh nilai kuartal, riwayat perubahan, dan metadata
                  evidence milik {ind.id} ikut terhapus{ind.type === 'RPI' ? ', termasuk kelima baris regionnya' : ''}.
                  Jejak audit yang sudah tercatat tetap tersimpan.
                </div>
                <Msg state={delState} />
                <form action={delAction}>
                  <input type="hidden" name="id" value={ind.id} />
                  <div className="grid g3">
                    <div className="fld"><label>Ketik HAPUS untuk konfirmasi</label>
                      <input name="confirm" placeholder="HAPUS" autoComplete="off" /></div>
                    <div className="fld" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                      <button className="btn dg" type="submit">Hapus permanen</button>
                      <button className="btn" type="button" onClick={() => setConfirmDel(false)}>Batal</button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
