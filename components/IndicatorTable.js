'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  achievement, actualOf, statusClass, STATUS_LABEL, STATUS_COLOR,
  fmt, pct, toStored, toInput, WORKFLOW, can, scoreOf, countByStatus
} from '@/lib/calc';
import { useLang } from './LangProvider';
import IndicatorDrawer from './IndicatorDrawer';

/** Bar chart kecil Q1–Q4 dengan garis target — sama seperti prototipe. */
function Spark({ row, unit, calc }) {
  const q = [row?.q1, row?.q2, row?.q3, row?.q4];
  const t = row?.target;
  const vals = q.filter(v => v !== null && v !== undefined).map(Number);
  const max = Math.max(...vals, t ? Number(t) : 0, 1);
  const W = 74, H = 26, bw = 13, gap = 4;
  return (
    <svg width={W} height={H} role="img"
         aria-label={`Q1–Q4 ${q.map(v => (v == null ? 'kosong' : fmt(v, unit))).join(', ')}`}>
      {q.map((v, i) => {
        const x = i * (bw + gap) + 2;
        if (v === null || v === undefined) {
          return <rect key={i} x={x} y={H - 3} width={bw} height={2} rx={1} fill="#DCE5E0" />;
        }
        const h = Math.max(2, (Number(v) / max) * (H - 6));
        const a = t ? Number(v) / Number(t) : null;
        return <rect key={i} x={x} y={H - h} width={bw} height={h} rx={2}
                     fill={STATUS_COLOR[statusClass(a)]} />;
      })}
      {t ? <line x1="0" y1={H - (Number(t) / max) * (H - 6)} x2={W} y2={H - (Number(t) / max) * (H - 6)}
                 stroke="#8A7A42" strokeWidth="1" strokeDasharray="3 2" /> : null}
    </svg>
  );
}

/**
 * mode='repo'      → seluruh Q1–Q4 dapat diedit (KPI/Indicator Repository)
 * mode='quarterly' → hanya kuartal aktif yang dapat diedit, plus kolom
 *                    Evidence dan filter status workflow (Quarterly Update)
 */
export default function IndicatorTable({ type, year, qtr = 2, years, role, mode = 'repo', rows: initial }) {
  const { t } = useLang();
  /* Baris tahun aktif diambil ulang setiap kali `year` atau data berubah,
     sehingga tabel benar-benar mengikuti periode yang dipilih di top bar. */
  const [rows, setRows] = useState(initial);
  useEffect(() => { setRows(initial); }, [initial, year]);
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('');
  const [qF, setQF] = useState('');
  const [wfF, setWfF] = useState('');
  const [pfF, setPfF] = useState('');
  /* Daftar portfolio diturunkan dari data, bukan daftar tetap, sehingga
     portfolio baru langsung muncul tanpa perubahan kode. */
  const portfolios = useMemo(() => [...new Set((rows || [])
    .map(r => r.portfolio).filter(Boolean))].sort(), [rows]);
  const [saving, setSaving] = useState({});
  const [openId, setOpenId] = useState(null);
  const [, startTransition] = useTransition();
  const editable = can(role, 'edit') &&
    !(role === 'pm' && type === 'OPI') && !(role === 'head' && type === 'PPI');

  const view = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(r => {
      if (s) {
        const hay = [r.id, r.name, r.code, r.portfolio, r.project, r.program, r.toc_foundation]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (statusF && statusClass(achievement(r.year, r)) !== statusF) return false;
      if (pfF && (r.portfolio || '') !== pfF) return false;
      if (wfF && ((r.year?.status) || 'draft') !== wfF) return false;
      if (qF) {
        const v = [r.year?.q1, r.year?.q2, r.year?.q3, r.year?.q4][qtr - 1];
        const filled = v !== null && v !== undefined;
        if (qF === 'filled' && !filled) return false;
        if (qF === 'empty' && filled) return false;
      }
      return true;
    });
  }, [rows, q, statusF, qF, wfF, pfF, qtr]);

  const withData = view.filter(r => achievement(r.year, r) !== null).length;
  const score = scoreOf(view);
  const counts = countByStatus(view);

  async function saveCell(id, field, raw) {
    const row = rows.find(r => r.id === id);
    const val = toStored(raw, row.unit);
    const key = id + field;
    setSaving(s => ({ ...s, [key]: 1 }));

    const supabase = createClient();
    const patch = { [field]: val };
    // Nilai berubah menurunkan status Approved ke Draft — ditegakkan juga oleh trigger DB.
    const { error } = await supabase
      .from('indicator_years')
      .update(patch)
      .eq('indicator_id', id)
      .eq('year', Number(year));

    setSaving(s => { const c = { ...s }; delete c[key]; return c; });
    if (error) { alert('Gagal menyimpan: ' + error.message); return; }

    startTransition(() => {
      setRows(rs => rs.map(r => r.id === id
        ? { ...r, year: { ...(r.year || {}), [field]: val, status: r.year?.status === 'approved' ? 'draft' : r.year?.status } }
        : r));
    });
  }

  return (
    <>
      <div className="grid g4 mb">
        <div className="kpi"><div className="lb">{t('Indikator')}</div><div className="vl">{view.length}</div>
          <div className="dl">{type === 'OPI' ? t('KPI organisasi') : t('indikator program')}, {t('Tahun')} {year}</div></div>
        <div className="kpi b"><div className="lb">{t('Ber-capaian')}</div><div className="vl">{withData}</div>
          <div className="dl">{t('punya target dan actual sekaligus')}</div></div>
        <div className="kpi gd"><div className="lb">{t('Rata-rata capaian')}</div><div className="vl">{pct(score)}</div>
          <div className="dl">{t('dihitung dari')} {withData} {t('indikator saja')}</div></div>
        <div className="kpi a"><div className="lb">{t('At Risk')}</div><div className="vl">{counts.rd}</div>
          <div className="dl">{t('di bawah 75% dari target')}</div></div>
      </div>

      {withData < view.length && (
        <div className="note w mb">
          <b>Kesiapan data.</b> {view.length - withData} dari {view.length} indikator belum memiliki target dan actual
          sekaligus pada {year}, sehingga berstatus <i>No Data</i>. Indikator tanpa data <b>tidak dihitung sebagai nol</b> dan
          dikeluarkan dari rata-rata di atas — angka rata-rata itu hanya mewakili {withData} indikator.
        </div>
      )}

      <div className="card mb"><div className="card-b" style={{ padding: '12px 14px' }}>
        <div className="filters">
          {portfolios.length > 1 && (
            <select value={pfF} onChange={e => setPfF(e.target.value)} title="ToC Portfolio Level">
              <option value="">Semua Portfolio Level</option>
              {portfolios.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          )}
          <input type="search" placeholder={t('Cari indikator, kode, portfolio…')} value={q} onChange={e => setQ(e.target.value)} />
          <select value={wfF} onChange={e => setWfF(e.target.value)} title="Status workflow">
            <option value="">Semua status workflow</option>
            {Object.keys(WORKFLOW).map(k => <option key={k} value={k}>{WORKFLOW[k].label}</option>)}
          </select>
          <select value={qF} onChange={e => setQF(e.target.value)} title={`Kelengkapan Q${qtr}`}>
            <option value="">Semua kelengkapan</option>
            <option value="filled">Sudah terisi Q{qtr}</option>
            <option value="empty">Belum terisi Q{qtr}</option>
          </select>
          {mode === 'repo' && (
            <select value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="">{t('Semua status capaian')}</option>
              {['ok', 'am', 'rd', 'gy'].map(k => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
            </select>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{view.length} {t('baris')}</span>
        </div>
      </div></div>

      <div className="card"><div className="tbl-w"><table>
        <thead><tr>
          {mode === 'repo' && <th style={{ width: 74 }}>ID</th>}
          <th style={{ minWidth: 300 }}>{t('Indikator')}</th>
          {mode === 'repo' && <th className="num">Target 2030</th>}
          <th className="num">Target {year}</th>
          {mode === 'quarterly' ? (
            <th className="ctr" style={{ background: 'var(--green-x)', color: 'var(--green-d)' }}>
              Q{qtr} {year}
            </th>
          ) : [1, 2, 3, 4].map(n => (
            <th className="ctr" key={n}
                style={n === qtr ? { background: 'var(--green-x)', color: 'var(--green-d)' } : undefined}>
              Q{n}
            </th>
          ))}
          <th className="num">{t('Actual YTD')}</th>
          <th style={{ width: 130 }}>{t('Capaian')}</th>
          <th className="ctr">{t('Trend')}</th>
          {mode === 'repo' && <th>{t('Status')}</th>}
          <th>{t('Workflow')}</th>
          <th className="ctr">{t('Evidence')}</th>
          <th className="ctr no-print">Form</th>
        </tr></thead>
        <tbody>
          {view.map(r => {
            const y = r.year || {};
            const a = achievement(y, r);
            const cls = statusClass(a);
            const wf = WORKFLOW[y.status] || WORKFLOW.draft;
            return (
              <tr key={r.id}>
                {mode === 'repo' && <td><span className="code">{r.id}</span></td>}
                <td>
                  <div className="t-name" title={r.definition || undefined}>{r.name}</div>
                  <div className="t-meta">
                    {[r.type === 'OPI' ? r.strategy_map : r.toc_foundation, r.portfolio, r.project, r.level]
                      .filter(Boolean).join(' › ')}
                  </div>
                  {r.definition && (
                    <div className="t-meta" style={{ maxWidth: 400, whiteSpace: 'normal', marginTop: 2 }}>
                      {r.definition.length > 110 ? r.definition.slice(0, 109) + '…' : r.definition}
                    </div>
                  )}
                </td>
                {mode === 'repo' && <td className="num">{fmt(r.t2030, r.unit)}</td>}
                <td className="num">
                  {editable
                    ? <input className="qin" key={`t-${r.id}-${year}`} defaultValue={toInput(y.target, r.unit)}
                             onBlur={e => saveCell(r.id, 'target', e.target.value)}
                             disabled={!!saving[r.id + 'target']} />
                    : fmt(y.target, r.unit)}
                </td>
                {(mode === 'quarterly' ? ['q' + qtr] : ['q1', 'q2', 'q3', 'q4']).map((k, ki) => {
                  const active = mode === 'quarterly' || ki + 1 === qtr;
                  return (
                    <td className="ctr" key={k}
                        style={active ? { background: 'var(--green-x)' } : undefined}>
                      {editable
                        ? <input className="qin" key={`${k}-${r.id}-${year}`} defaultValue={toInput(y[k], r.unit)}
                                 onBlur={e => saveCell(r.id, k, e.target.value)}
                                 disabled={!!saving[r.id + k]} />
                        : fmt(y[k], r.unit)}
                    </td>
                  );
                })}
                <td className="num">{fmt(actualOf(y, r), r.unit)}</td>
                <td>
                  <div className="prog"><i className={'p-' + cls}
                       style={{ width: a === null ? 0 : Math.max(2, Math.min(100, a * 100)) + '%' }} /></div>
                  <div className="t-meta">{pct(a)}</div>
                </td>
                <td className="ctr"><Spark row={r.year} unit={r.unit} calc={r.calc} /></td>
                {mode === 'repo' && (
                  <td><span className={'bdg b-' + cls}>{STATUS_LABEL[cls]}</span></td>
                )}
                <td><span className={'bdg ' + wf.cls}>{wf.label}</span></td>
                <td className="ctr">
                  <span className={'bdg ' + (r.evCount ? 'b-ok' : 'b-gy')}
                        title={r.evCount ? `${r.evCount} dokumen tercatat`
                                         : 'Belum ada evidence — angka belum dapat diverifikasi'}>
                    {r.evCount || 0}
                  </span>
                </td>
                <td className="ctr no-print">
                  <button className="btn sm" onClick={() => setOpenId(r.id)}>Buka form</button>
                </td>
              </tr>
            );
          })}
          {!view.length && (
            <tr><td colSpan={13}>
              <div className="nodata"><b>{t('Tidak ada indikator yang cocok')}</b>
                <span>{t('Ubah kata kunci atau filter status.')}</span></div>
            </td></tr>
          )}
        </tbody>
      </table></div></div>

      {openId && (
        <IndicatorDrawer
          ind={rows.find(x => x.id === openId)}
          year={year} qtr={qtr} role={role}
          onClose={() => setOpenId(null)} />
      )}

      {!editable && (
        <div className="note i mt">
          Role Anda tidak memiliki hak input pada kerangka {type}. Nilai ditampilkan sebagai teks.
          Pembatasan yang sama ditegakkan ulang oleh Row Level Security di database, bukan hanya di layar ini.
        </div>
      )}
    </>
  );
}
