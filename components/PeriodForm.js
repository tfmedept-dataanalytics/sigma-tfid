'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { addPeriod, deletePeriod } from '@/app/actions/indicators';

function Submit({ label, busy, danger }) {
  const { pending } = useFormStatus();
  return (
    <button className={'btn ' + (danger ? 'dg' : 'p')} type="submit" disabled={pending}>
      {pending ? (busy || 'Memproses…') : label}
    </button>
  );
}

const Msg = ({ state }) => (
  <>
    {state?.error && <div className="note d mb">{state.error}</div>}
    {state?.ok && <div className="note s mb">{state.message}</div>}
  </>
);

/** Membuat baris periode tahunan untuk banyak indikator sekaligus. */
export function PeriodForm({ years = [], defaultYear }) {
  const [state, action] = useFormState(addPeriod, {});

  return (
    <div className="card mb">
      <div className="card-h">
        <h3>Tambah periode tahunan</h3>
        <div className="sub">
          Membuat baris periode baru untuk indikator terpilih. Nilai actual Q1–Q4 selalu dikosongkan
          agar periode tidak tercampur; baris yang sudah ada tidak akan tertimpa.
        </div>
      </div>
      <div className="card-b">
        <Msg state={state} />
        <form action={action}>
          <div className="grid g3">
            <div className="fld"><label>Tahun baru *</label>
              <input name="year" type="number" defaultValue={defaultYear} required /></div>
            <div className="fld"><label>Cakupan</label>
              <select name="scope" defaultValue="all">
                <option value="all">Seluruh kerangka (OPI + RPI + PPI)</option>
                <option value="OPI">OPI saja</option>
                <option value="RPI">RPI saja</option>
                <option value="PPI">PPI saja</option>
              </select></div>
            <div className="fld"><label>Salin target dari</label>
              <select name="source" defaultValue="">
                <option value="">— tidak menyalin (target kosong) —</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select></div>
          </div>
          <div className="hint mb">
            Menyalin target berarti mengasumsikan target tahun sumber masih berlaku. Bila target tahun
            baru belum ditetapkan, mengosongkannya lebih jujur — indikator akan tampil sebagai
            <i> No Data</i> sampai targetnya diisi, bukan tampak tercapai atas dasar target lama.
            Indikator RPI otomatis memperoleh lima baris per tahun: empat region dan Akumulasi Regional.
          </div>
          <Submit label="Tambah periode" busy="Membuat…" />
        </form>
      </div>
    </div>
  );
}

/** Menghapus seluruh baris periode satu tahun. */
export function DeletePeriodForm({ years = [] }) {
  const [state, action] = useFormState(deletePeriod, {});
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(years[years.length - 1] || '');

  if (!open) {
    return (
      <div className="mb">
        <button className="btn dg sm" onClick={() => setOpen(true)}>Hapus seluruh periode satu tahun</button>
      </div>
    );
  }

  return (
    <div className="card mb">
      <div className="card-h"><h3>Hapus periode</h3></div>
      <div className="card-b">
        <div className="note d mb">
          <b>Tindakan ini permanen.</b> Seluruh target, nilai kuartal, commentary, dan evidence pada
          tahun yang dipilih akan hilang untuk semua indikator dan semua region. Jejak audit yang
          sudah tercatat tetap tersimpan.
        </div>
        <Msg state={state} />
        <form action={action}>
          <div className="grid g3">
            <div className="fld"><label>Tahun</label>
              <select name="year" value={year} onChange={e => setYear(e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select></div>
            <div className="fld"><label>Ketik {year} untuk konfirmasi</label>
              <input name="confirm" autoComplete="off" /></div>
            <div className="fld" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <Submit label="Hapus periode" busy="Menghapus…" danger />
              <button className="btn" type="button" onClick={() => setOpen(false)}>Batal</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
