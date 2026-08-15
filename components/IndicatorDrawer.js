'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { saveQuarterly, changeStatus, addEvidence, deleteEvidence } from '@/app/actions/quarterly';
import {
  achievement, actualOf, statusClass, STATUS_LABEL, STATUS_COLOR,
  fmt, pct, toInput, WORKFLOW, can, AGG_LABEL, aggMode
} from '@/lib/calc';

const ACCUM = 'Akumulasi Regional';
const TABS = ['Overview', 'Quarterly Update', 'Evidence', 'History', 'AI Insight'];

function Submit({ label, busy, cls = 'p' }) {
  const { pending } = useFormStatus();
  return <button className={'btn ' + cls} type="submit" disabled={pending}>{pending ? (busy || 'Memproses…') : label}</button>;
}

const Msg = ({ state }) => (
  <>
    {state?.error && <div className="note d mb">{state.error}</div>}
    {state?.ok && <div className="note s mb">{state.message}</div>}
  </>
);

/** Bar chart Q1–Q4 besar dengan garis target. */
function BigChart({ row, unit }) {
  const q = [row?.q1, row?.q2, row?.q3, row?.q4];
  const t = row?.target;
  const vals = q.filter(v => v !== null && v !== undefined).map(Number);
  if (!vals.length && (t === null || t === undefined)) {
    return <div className="nodata"><b>Belum ada data</b><span>Nilai kuartal dan target belum diisi.</span></div>;
  }
  const max = Math.max(...vals, t ? Number(t) : 0, 1) * 1.15;
  const w = 420, h = 170, pad = { l: 46, r: 12, t: 12, b: 26 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const bw = iw / 4 - 16;
  const ty = t ? pad.t + ih - (Number(t) / max) * ih : null;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      {[0, 1, 2].map(g => {
        const gy = pad.t + ih - (ih * g) / 2;
        return <line key={g} x1={pad.l} y1={gy} x2={w - pad.r} y2={gy} stroke="#EDF2EF" />;
      })}
      {q.map((v, i) => {
        const x = pad.l + i * (iw / 4) + 8;
        if (v === null || v === undefined) {
          return (
            <g key={i}>
              <rect x={x} y={pad.t + ih - 2} width={bw} height={2} fill="#DCE5E0" />
              <text x={x + bw / 2} y={h - 8} textAnchor="middle" fontSize={10.5} fill="#6E7F76">Q{i + 1}</text>
            </g>
          );
        }
        const bh = Math.max(2, (Number(v) / max) * ih);
        const a = t ? Number(v) / Number(t) : null;
        return (
          <g key={i}>
            <rect x={x} y={pad.t + ih - bh} width={bw} height={bh} rx={3} fill={STATUS_COLOR[statusClass(a)]}>
              <title>Q{i + 1}: {fmt(v, unit)}</title>
            </rect>
            <text x={x + bw / 2} y={pad.t + ih - bh - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#10231B">
              {fmt(v, unit)}
            </text>
            <text x={x + bw / 2} y={h - 8} textAnchor="middle" fontSize={10.5} fill="#6E7F76">Q{i + 1}</text>
          </g>
        );
      })}
      {ty !== null && (
        <>
          <line x1={pad.l} y1={ty} x2={w - pad.r} y2={ty} stroke="#8A7A42" strokeWidth={1.4} strokeDasharray="5 3" />
          <text x={pad.l - 5} y={ty + 3.5} textAnchor="end" fontSize={9.5} fill="#8A7A42">{fmt(t, unit)}</text>
        </>
      )}
    </svg>
  );
}


/* Definisi dan catatan ditampilkan langsung di tab Quarterly Update — bukan
   hanya di Overview — karena di sinilah orang mengisi angka, dan salah tafsir
   definisi indikator adalah sumber kesalahan input yang paling sering. */
function DefinitionPanel({ ind, row }) {
  const [open, setOpen] = useState(false);
  const meta = [
    ['Definition', ind.definition],
    ['Mean of Verification', ind.mov],
    ['Period of Data Collection', ind.period],
    ['Result statement', ind.result_statement],
    ['Details', ind.details]
  ].filter(([, v]) => v);
  const src = [
    ['Notes', row?.notes],
    ['Key Initiatives', row?.key_initiatives],
    ['Source', row?.source]
  ].filter(([, v]) => v);

  if (!meta.length && !src.length) {
    return (
      <div className="note w mb">
        <b>Indikator ini belum memiliki definisi maupun Mean of Verification.</b> Tanpa keduanya,
        angka yang diisi tidak dapat ditelusuri kembali ke sumbernya dan konsistensinya antar periode
        tidak dapat diperiksa. Lengkapi lewat Indicator Management.
      </div>
    );
  }

  return (
    <div className="card mb">
      <div className="card-h" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <h3>{open ? '▾' : '▸'} Definisi & catatan indikator</h3>
        <div className="sub">
          {open ? 'Klik untuk menutup.' : 'Klik untuk membuka — baca definisi sebelum mengisi angka.'}
        </div>
      </div>
      {open && (
        <div className="card-b">
          {meta.length > 0 && (
            <dl className="meta-dl">
              {meta.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          )}
          {src.length > 0 && (
            <>
              <div className="t-meta mt" style={{ fontWeight: 700 }}>Catatan pada data sumber</div>
              <dl className="meta-dl">
                {src.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function IndicatorDrawer({ ind, year, qtr = 2, region, role, onClose }) {
  const { t } = useLang();
  const [tab, setTab] = useState('Quarterly Update');
  const [history, setHistory] = useState(null);
  const [evidence, setEvidence] = useState(null);

  const isRpi = ind.type === 'RPI';
  const reg = isRpi ? (region || ACCUM) : 'National';
  const row = (isRpi ? ind.regions?.[year]?.[reg] : ind.years?.[year]) || {};
  const a = achievement(row, ind);
  const wf = WORKFLOW[row.status] || WORKFLOW.draft;
  const readOnly = isRpi && reg === ACCUM;

  const editable = can(role, 'edit') &&
    !(role === 'pm' && ind.type !== 'PPI') &&
    !(role === 'head' && ind.type !== 'OPI') &&
    !readOnly;

  const [saveState, saveAction] = useFormState(saveQuarterly, {});
  const [flowState, flowAction] = useFormState(changeStatus, {});
  const [evState, evAction] = useFormState(addEvidence, {});
  const [delState, delAction] = useFormState(deleteEvidence, {});

  /* Riwayat dan evidence dibaca langsung dari database, bukan dari data
     halaman, agar selalu mencerminkan keadaan terbaru setelah penyimpanan. */
  useEffect(() => {
    if (tab !== 'History' && tab !== 'Evidence') return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      if (tab === 'History') {
        const { data } = await supabase.from('indicator_history')
          .select('id, year, region, field, old_value, new_value, changed_at')
          .eq('indicator_id', ind.id).order('changed_at', { ascending: false }).limit(80);
        if (!cancelled) setHistory(data || []);
      } else {
        const { data } = await supabase.from('evidence')
          .select('id, year, region, file_name, storage_path, note, uploaded_at')
          .eq('indicator_id', ind.id).order('uploaded_at', { ascending: false });
        if (!cancelled) setEvidence(data || []);
      }
    })();
    return () => { cancelled = true; };
  }, [tab, ind.id, saveState, evState, delState]);

  const years = Object.keys(isRpi ? (ind.regions || {}) : (ind.years || {})).sort();

  return (
    <div className="drawer-wrap" role="dialog" aria-label={ind.name}>
      <div className="drawer-bg" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-h">
          <div>
            <h3 style={{ margin: 0, fontSize: 15 }}>{ind.name}</h3>
            <div className="t-meta" style={{ marginTop: 4 }}>
              <span className={'bdg ' + (ind.type === 'OPI' ? 'b-bl' : ind.type === 'RPI' ? 'b-gd' : 'b-gy')}>{ind.type}</span>
              {' '}<span className="code">{ind.id}</span> · {ind.unit || '—'}
              {ind.calc ? ' · ' + ind.calc : ''}
              {isRpi ? ' · ' + reg : ''}
            </div>
          </div>
          {['sysadmin', 'pmo'].includes(role) && (
            <a className="btn sm" href="/v/md-ind"
               title={t('Ubah struktur indikator ini di Indicator Management')}>{t('Ubah indikator')}</a>
          )}
          <button className="btn-i" onClick={onClose} aria-label="Tutup">✕</button>
        </div>

        <div className="drawer-tabs">
          {TABS.map(t => (
            <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="drawer-b">
          {/* ---------------- Overview ---------------- */}
          {tab === 'Overview' && (
            <>
              <div className="grid g3 mb">
                <div className="kpi"><div className="lb">Target {year}</div>
                  <div className="vl">{fmt(row.target, ind.unit)}</div>
                  <div className="dl">Target 2030: {fmt(ind.t2030, ind.unit)}</div></div>
                <div className="kpi b"><div className="lb">Actual {year}</div>
                  <div className="vl">{fmt(actualOf(row, ind), ind.unit)}</div>
                  <div className="dl">Agregasi: {AGG_LABEL[aggMode(ind)]}</div></div>
                <div className="kpi gd"><div className="lb">Capaian</div>
                  <div className="vl">{pct(a)}</div>
                  <div className="dl">{STATUS_LABEL[statusClass(a)]}</div></div>
              </div>

              <div className="card mb"><div className="card-h"><h3>Nilai per kuartal {year}</h3></div>
                <div className="card-b"><BigChart row={row} unit={ind.unit} /></div></div>

              <div className="card mb"><div className="card-h"><h3>Seluruh periode</h3></div>
                <div className="tbl-w"><table>
                  <thead><tr><th>Tahun</th><th className="num">Target</th>
                    <th className="ctr">Q1</th><th className="ctr">Q2</th><th className="ctr">Q3</th><th className="ctr">Q4</th>
                    <th className="num">Actual</th><th className="num">Capaian</th><th>Workflow</th></tr></thead>
                  <tbody>
                    {years.map(y => {
                      const r = isRpi ? (ind.regions[y]?.[reg] || {}) : (ind.years[y] || {});
                      const av = achievement(r, ind);
                      const w2 = WORKFLOW[r.status] || WORKFLOW.draft;
                      return (
                        <tr key={y} style={y === year ? { background: 'var(--green-x)' } : undefined}>
                          <td><b>{y}</b></td>
                          <td className="num">{fmt(r.target, ind.unit)}</td>
                          {['q1', 'q2', 'q3', 'q4'].map(k => <td className="ctr" key={k}>{fmt(r[k], ind.unit)}</td>)}
                          <td className="num">{fmt(actualOf(r, ind), ind.unit)}</td>
                          <td className="num">{pct(av)}</td>
                          <td><span className={'bdg ' + w2.cls}>{w2.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div></div>

              {(row.notes || row.key_initiatives || row.source) && (
                <div className="card mb"><div className="card-h"><h3>Catatan pada data sumber</h3>
                  <div className="sub">Diambil apa adanya dari file OPI/RPI/PPI, tidak diringkas.</div></div>
                  <div className="card-b"><dl className="meta-dl">
                    {[['Notes', row.notes], ['Key Initiatives', row.key_initiatives], ['Source', row.source]]
                      .filter(([, v]) => v).map(([k, v]) => (
                        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                      ))}
                  </dl></div>
                </div>
              )}

              <div className="card"><div className="card-h"><h3>Metadata indikator</h3></div>
                <div className="card-b">
                  <dl className="meta-dl">
                    {[
                      ['Strategy Map', ind.strategy_map], ['Outcome', ind.outcome],
                      ['Accountability', ind.accountability], ['Program', ind.program],
                      ['Details', ind.details], ['ToC Foundation', ind.toc_foundation],
                      ['ToC Portfolio', ind.portfolio], ['Project', ind.project],
                      ['Level of Change', ind.level], ['Result statement', ind.result_statement],
                      ['Definition', ind.definition], ['Mean of Verification', ind.mov],
                      ['Period of Data Collection', ind.period], ['Indicator code', ind.code]
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                    ))}
                  </dl>
                </div></div>
            </>
          )}

          {/* ---------------- Quarterly Update ---------------- */}
          {tab === 'Quarterly Update' && (
            <>
              <DefinitionPanel ind={ind} row={row} />
              <div className="row mb">
                <span className="bdg b-gd">{t('form.period', { qtr, year })}</span>
                <span className={'bdg ' + wf.cls}>{wf.label}</span>
                <span className={'bdg b-' + statusClass(a)}>{STATUS_LABEL[statusClass(a)]}</span>
                {isRpi && <span className="bdg b-gy">{reg}</span>}
              </div>

              {readOnly && (
                <div className="note i mb">
                  <b>Akumulasi Regional dihitung, bukan diinput.</b> Nilai Q1–Q4 pada baris ini adalah
                  penjumlahan keempat region — rata-rata untuk unit Percent. Untuk mengubah angkanya,
                  buka indikator ini pada region yang bersangkutan.
                </div>
              )}
              {row.return_reason && (
                <div className="note d mb"><b>Dikembalikan reviewer.</b> {row.return_reason}</div>
              )}

              <Msg state={saveState} />
              <form action={saveAction}>
                <input type="hidden" name="id" value={ind.id} />
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="region" value={reg} />

                <div className="grid g4">
                  {['q1', 'q2', 'q3', 'q4'].map((k, i) => (
                    <div className="fld" key={k}>
                      <label>Q{i + 1} {year}{i + 1 === qtr ? ' · AKTIF' : ''}</label>
                      <input name={k} defaultValue={toInput(row[k], ind.unit)} disabled={!editable}
                             style={i + 1 === qtr ? { borderColor: 'var(--green)', background: 'var(--green-x)' } : undefined} />
                    </div>
                  ))}
                </div>

                <div className="grid g2">
                  <div className="fld"><label>Target {year}</label>
                    <input name="target" defaultValue={toInput(row.target, ind.unit)} disabled={!editable} /></div>
                  <div className="fld"><label>Actual YTD (dihitung otomatis)</label>
                    <input value={fmt(actualOf(row, ind), ind.unit)} disabled />
                    <div className="hint">{t('form.agg', {
                      mode: t(AGG_LABEL[aggMode(ind)]),
                      note: ind.agg ? t('form.agg.custom') : t('form.agg.general', { unit: ind.unit })
                    })}</div></div>
                </div>

                <div className="note i mb" style={{ margin: '4px 0 14px' }}>
                  {a === null
                    ? t('form.noAch')
                    : t('form.ach', { ach: pct(a), target: fmt(row.target, ind.unit) })}
                </div>

                <div className="fld"><label>Commentary — penjelasan pencapaian</label>
                  <textarea name="commentary" rows={3} defaultValue={row.commentary || ''} disabled={!editable} /></div>
                <div className="fld"><label>Key achievement</label>
                  <textarea name="achievement" rows={2} defaultValue={row.achievement || ''} disabled={!editable} /></div>
                <div className="fld"><label>Challenge / deviation</label>
                  <textarea name="challenge" rows={2} defaultValue={row.challenge || ''} disabled={!editable} /></div>
                <div className="fld"><label>Corrective action</label>
                  <textarea name="action" rows={2} defaultValue={row.action || ''} disabled={!editable} /></div>

                <div className="fld"><label>Notes / catatan indikator</label>
                  <textarea name="notes" rows={3} defaultValue={row.notes || ''} disabled={!editable} />
                  <div className="hint">Catatan bawaan dari file sumber ikut tampil di sini dan dapat disunting.</div></div>

                <div className="grid g3">
                  <div className="fld"><label>Key initiatives</label>
                    <input name="key_initiatives" defaultValue={row.key_initiatives || ''} disabled={!editable} /></div>
                  <div className="fld"><label>Source</label>
                    <input name="source" defaultValue={row.source || ''} disabled={!editable} /></div>
                  <div className="fld"><label>Owner</label>
                    <input name="owner" defaultValue={row.owner || ''} disabled={!editable} /></div>
                </div>

                {editable && <div className="row mt"><Submit label="Simpan draft" busy="Menyimpan…" cls="" /></div>}
              </form>

              {!editable && !readOnly && (
                <div className="note i">
                  Role Anda tidak memiliki hak input pada kerangka {ind.type}. Pembatasan yang sama
                  ditegakkan ulang oleh Row Level Security di database.
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--line-s)', margin: '18px 0 14px' }} />
              <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Workflow</h4>
              <Msg state={flowState} />
              <form action={flowAction}>
                <input type="hidden" name="id" value={ind.id} />
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="region" value={reg} />
                <div className="fld"><label>Alasan pengembalian (wajib bila mengembalikan)</label>
                  <textarea name="reason" rows={2}
                            placeholder="Contoh: metode perhitungan Q3 belum sesuai definisi indikator." /></div>
                <div className="row">
                  <button className="btn p" name="move" value="submit" type="submit" disabled={readOnly}>Submit for review</button>
                  <button className="btn" name="move" value="review" type="submit">Mulai review</button>
                  <button className="btn" name="move" value="approve" type="submit">Approve</button>
                  <button className="btn dg" name="move" value="return" type="submit">Kembalikan</button>
                </div>
                <div className="hint mt">
                  Alur: Draft → Submitted → Under Review → Approved, atau Returned → Revision. Setiap
                  perubahan status tercatat pada Audit Trail. Mengubah nilai setelah Approved akan
                  menurunkan statusnya kembali ke Draft — ditegakkan trigger database, bukan hanya di layar.
                </div>
              </form>
            </>
          )}

          {/* ---------------- Evidence ---------------- */}
          {tab === 'Evidence' && (
            <>
              <div className="note w mb">
                SIGMA mencatat <b>metadata</b> evidence, bukan berkasnya. Simpan dokumen di penyimpanan
                resmi organisasi, lalu catat nama dan tautannya di sini agar angka yang dilaporkan dapat
                ditelusuri saat audit.
              </div>
              <Msg state={evState} />
              <Msg state={delState} />
              {editable && (
                <form action={evAction} className="mb">
                  <input type="hidden" name="id" value={ind.id} />
                  <input type="hidden" name="year" value={year} />
                  <input type="hidden" name="region" value={reg} />
                  <div className="grid g2">
                    <div className="fld"><label>Nama dokumen *</label>
                      <input name="file_name" placeholder="Laporan monitoring Q2 2026.pdf" /></div>
                    <div className="fld"><label>Tautan / lokasi penyimpanan</label>
                      <input name="storage_path" placeholder="https://…" /></div>
                  </div>
                  <div className="fld"><label>Catatan</label><input name="note" /></div>
                  <Submit label="Catat evidence" busy="Menyimpan…" />
                </form>
              )}

              {evidence === null ? <div className="hint">Memuat…</div>
                : !evidence.length ? <div className="nodata"><b>Belum ada evidence</b>
                    <span>Catat dokumen pendukung agar angka dapat diverifikasi.</span></div>
                : (
                  <div className="tbl-w"><table>
                    <thead><tr><th>Dokumen</th><th>Periode</th><th>Catatan</th><th>Dicatat</th><th className="ctr" /></tr></thead>
                    <tbody>
                      {evidence.map(e => (
                        <tr key={e.id}>
                          <td className="t-name">
                            {e.storage_path
                              ? <a href={e.storage_path} target="_blank" rel="noreferrer">{e.file_name}</a>
                              : e.file_name}
                          </td>
                          <td>{e.year} · {e.region}</td>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>{e.note || '—'}</td>
                          <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                            {new Date(e.uploaded_at).toLocaleDateString('id-ID')}</td>
                          <td className="ctr">
                            {editable && (
                              <form action={delAction}>
                                <input type="hidden" name="evidence_id" value={e.id} />
                                <button className="btn-i" type="submit" title="Hapus">✕</button>
                              </form>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
            </>
          )}

          {/* ---------------- History ---------------- */}
          {tab === 'History' && (
            history === null ? <div className="hint">Memuat…</div>
            : !history.length ? <div className="nodata"><b>Belum ada riwayat</b>
                <span>Terisi otomatis saat nilai target, kuartal, atau status diubah.</span></div>
            : (
              <>
                <div className="tbl-w"><table>
                  <thead><tr><th>Waktu</th><th>Periode</th><th>Field</th><th className="num">Dari</th>
                    <th className="num">Menjadi</th></tr></thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                          {new Date(h.changed_at).toLocaleString('id-ID')}</td>
                        <td>{h.year} · {h.region}</td>
                        <td><span className="code">{h.field}</span></td>
                        <td className="num">{h.old_value ?? '—'}</td>
                        <td className="num">{h.new_value ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                <div className="note w mt">
                  Nilai pada riwayat ditampilkan apa adanya sebagaimana tersimpan — untuk unit Percent
                  berarti dalam desimal (0,8 = 80%). Riwayat tidak dapat diubah atau dihapus lewat
                  aplikasi maupun API.
                </div>
              </>
            )
          )}

          {/* ---------------- AI Insight ---------------- */}
          {tab === 'AI Insight' && (() => {
            const q = [row.q1, row.q2, row.q3, row.q4];
            const filled = q.filter(v => v !== null && v !== undefined).map(Number);
            return (
              <>
                <div className="note i" style={{ marginBottom: 12 }}>
                  <b>Fakta dari data</b>
                  <div style={{ marginTop: 6 }}>
                    Target {year}: {fmt(row.target, ind.unit)}. Actual: {fmt(actualOf(row, ind), ind.unit)}.
                    Capaian: {pct(a)}. Kuartal terisi: {filled.length} dari 4
                    ({q.map((v, i) => `Q${i + 1} ${v === null || v === undefined ? '—' : fmt(v, ind.unit)}`).join(', ')}).
                  </div>
                </div>
                <div className="note s" style={{ marginBottom: 12 }}>
                  <b>Interpretasi & rekomendasi</b>
                  <div style={{ marginTop: 6 }}>
                    {a === null
                      ? 'Capaian belum dapat dinilai karena target atau actual belum lengkap. Melengkapi keduanya adalah langkah pertama sebelum indikator ini masuk pembahasan kinerja.'
                      : filled.length < 2
                        ? `Capaian ${pct(a)} berasal dari satu titik data, sehingga arah perubahan dalam tahun berjalan belum dapat dinilai.`
                        : filled[filled.length - 1] < filled[filled.length - 2]
                          ? `Capaian ${pct(a)} dengan nilai kuartal terakhir lebih rendah daripada sebelumnya. Pola ini perlu penjelasan pemilik indikator sebelum ditafsirkan sebagai penurunan kinerja.`
                          : `Capaian ${pct(a)} dengan nilai kuartal yang tidak menurun. Pola ini konsisten dengan pelaksanaan yang berjalan sesuai rencana.`}
                  </div>
                </div>
                <div className="note w">
                  <b>Keterbatasan data</b>
                  <div style={{ marginTop: 6 }}>
                    Pembacaan ini hanya memakai angka yang tersimpan pada indikator ini dan dihasilkan
                    aturan aritmetika, bukan model bahasa. Konteks pelaksanaan, perubahan definisi, maupun
                    perbedaan cakupan antar kuartal tidak terekam di sistem dan dapat mengubah kesimpulan
                    sepenuhnya.
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
