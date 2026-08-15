'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  achievement, actualOf, statusClass, STATUS_LABEL, fmt, pct, toInput, toStored,
  WORKFLOW, can
} from '@/lib/calc';
import { Spark } from '@/components/ui';
import IndicatorDrawer from './IndicatorDrawer';
import { useLang } from '@/components/LangProvider';

const ACCUM = 'Akumulasi Regional';
const QK = ['q1', 'q2', 'q3', 'q4'];

/**
 * Layar Quarterly Update — mengikuti pola versi HTML.
 *
 * Bedanya dengan repository: hanya kolom kuartal AKTIF yang ditampilkan dan
 * dapat diisi, sehingga layar ini fokus pada satu periode pelaporan. Kolom
 * Evidence memperlihatkan berapa dokumen pendukung sudah tercatat, karena
 * angka tanpa evidence tidak dapat diverifikasi saat audit.
 */
export default function QuarterlyTable({ type, rows, year, qtr = 2, region, regions = [], role, onRegion }) {
  const { t } = useLang();
  const [data, setData] = useState(rows);
  const [q, setQ] = useState('');
  const [wfF, setWfF] = useState('');
  const [fillF, setFillF] = useState('');
  const [saving, setSaving] = useState({});
  const [openId, setOpenId] = useState(null);
  const [evCount, setEvCount] = useState({});

  useEffect(() => { setData(rows); }, [rows, year, region]);

  /* Jumlah evidence per indikator pada tahun aktif. */
  useEffect(() => {
    let alive = true;
    (async () => {
      const supabase = createClient();
      const { data: ev } = await supabase
        .from('evidence').select('indicator_id').eq('year', Number(year));
      if (!alive) return;
      const m = {};
      (ev || []).forEach(e => { m[e.indicator_id] = (m[e.indicator_id] || 0) + 1; });
      setEvCount(m);
    })();
    return () => { alive = false; };
  }, [year, saving]);

  const isRpi = type === 'RPI';
  const reg = isRpi ? (region || ACCUM) : 'National';
  const rowOf = r => (isRpi ? (r.regions?.[year]?.[reg] || null) : (r.years?.[year] || null));

  const isAccum = isRpi && reg === ACCUM;
  const editable = can(role, 'edit') &&
    !(role === 'pm' && type !== 'PPI') && !(role === 'head' && type !== 'OPI') && !isAccum;

  const view = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.filter(r => {
      const y = rowOf(r);
      if (s) {
        const hay = [r.id, r.name, r.code, r.portfolio, r.project, r.program, r.accountability]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (wfF && (y?.status || 'draft') !== wfF) return false;
      if (fillF) {
        const v = y ? y[QK[qtr - 1]] : null;
        const filled = v !== null && v !== undefined;
        if (fillF === 'filled' && !filled) return false;
        if (fillF === 'empty' && filled) return false;
      }
      return true;
    });
  }, [data, q, wfF, fillF, qtr, year, reg]);

  /* Kartu ringkas — sama dengan versi HTML. */
  const stats = useMemo(() => {
    const st = { draft: 0, submitted: 0, review: 0, approved: 0, returned: 0 };
    let filled = 0, total = 0;
    data.forEach(r => {
      const y = rowOf(r);
      if (!y) return;
      total++;
      st[y.status || 'draft'] = (st[y.status || 'draft'] || 0) + 1;
      const v = y[QK[qtr - 1]];
      if (v !== null && v !== undefined) filled++;
    });
    return { st, filled, total };
  }, [data, qtr, year, reg]);

  async function saveCell(id, field, raw) {
    const r = data.find(x => x.id === id);
    const key = id + field;
    setSaving(s => ({ ...s, [key]: 1 }));

    const supabase = createClient();
    const cur = rowOf(r) || {};
    const { error } = await supabase.from('indicator_years').upsert({
      indicator_id: id, year: Number(year), region: reg,
      target: cur.target ?? null,
      q1: cur.q1 ?? null, q2: cur.q2 ?? null, q3: cur.q3 ?? null, q4: cur.q4 ?? null,
      status: cur.status || 'draft',
      [field]: toStored(raw, r.unit)
    }, { onConflict: 'indicator_id,year,region' });

    setSaving(s => { const c = { ...s }; delete c[key]; return c; });
    if (error) { alert(t('Gagal menyimpan: ') + error.message); return; }

    setData(ds => ds.map(x => {
      if (x.id !== id) return x;
      const val = toStored(raw, x.unit);
      if (isRpi) {
        const regs = { ...(x.regions || {}) };
        const yr = { ...(regs[year] || {}) };
        const c = { ...(yr[reg] || { status: 'draft' }) };
        c[field] = val;
        if (c.status === 'approved') c.status = 'draft';
        yr[reg] = c; regs[year] = yr;
        return { ...x, regions: regs };
      }
      const ys = { ...(x.years || {}) };
      const c = { ...(ys[year] || { status: 'draft' }) };
      c[field] = val;
      if (c.status === 'approved') c.status = 'draft';
      ys[year] = c;
      return { ...x, years: ys, year: c };
    }));
  }

  const pctText = stats.total ? ((stats.filled / stats.total) * 100).toFixed(0) + '% completeness' : '—';

  return (
    <>
      <div className="grid g5 mb">
        <div className="kpi b"><div className="lb">Indikator periode ini</div>
          <div className="vl">{stats.total}</div><div className="dl">Tahun {year}</div></div>
        <div className={'kpi ' + (stats.filled / Math.max(stats.total, 1) >= 0.8 ? '' : 'a')}>
          <div className="lb">Sudah terisi Q{qtr}</div>
          <div className="vl">{stats.filled} / {stats.total}</div><div className="dl">{pctText}</div></div>
        <div className="kpi gd"><div className="lb">Menunggu review</div>
          <div className="vl">{stats.st.submitted + stats.st.review}</div>
          <div className="dl">Submitted + under review</div></div>
        <div className="kpi"><div className="lb">Approved</div>
          <div className="vl">{stats.st.approved}</div><div className="dl">Data official</div></div>
        <div className="kpi r"><div className="lb">Returned</div>
          <div className="vl">{stats.st.returned}</div><div className="dl">Perlu revisi</div></div>
      </div>

      <div className="card mb"><div className="card-b" style={{ padding: '12px 14px' }}>
        <div className="filters">
          {isRpi && regions.length > 0 && (
            <select value={reg} onChange={e => onRegion?.(e.target.value)} title="Region">
              {regions.map(x => <option key={x} value={x}>{x === ACCUM ? x : 'Region ' + x}</option>)}
            </select>
          )}
          <input type="search" placeholder={t('Cari indikator…')} value={q} onChange={e => setQ(e.target.value)} />
          <select value={wfF} onChange={e => setWfF(e.target.value)}>
            <option value="">{t('Semua status workflow')}</option>
            {Object.keys(WORKFLOW).map(k => <option key={k} value={k}>{WORKFLOW[k].label}</option>)}
          </select>
          <select value={fillF} onChange={e => setFillF(e.target.value)}>
            <option value="">{t('Semua kelengkapan')}</option>
            <option value="empty">Belum terisi Q{qtr}</option>
            <option value="filled">Sudah terisi Q{qtr}</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            {view.length} {t('baris')}
          </span>
        </div>
      </div></div>

      {isAccum && (
        <div className="note i mb">
          <b>{t('Akumulasi Regional dihitung, bukan diinput.')}</b> Pilih salah satu region untuk mengisi
          nilainya; akumulasi mengikuti sendiri.
        </div>
      )}

      <div className="card"><div className="tbl-w"><table>
        <thead><tr>
          <th style={{ minWidth: 300 }}>{t('Indikator')}</th>
          <th className="num">{t('Target')} {year}</th>
          <th className="ctr" style={{ background: 'var(--green-x)', color: 'var(--green-d)' }}>Q{qtr} {year}</th>
          <th className="num">{t('Actual YTD')}</th>
          <th style={{ width: 120 }}>{t('Capaian')}</th>
          <th className="ctr">{t('Trend')}</th>
          <th>{t('Workflow')}</th>
          <th className="ctr">{t('Evidence')}</th>
          <th className="no-print" />
        </tr></thead>
        <tbody>
          {view.map(r => {
            const y = rowOf(r) || {};
            const a = achievement(y, r);
            const wf = WORKFLOW[y.status] || WORKFLOW.draft;
            const ev = evCount[r.id] || 0;
            return (
              <tr key={r.id}>
                <td>
                  <div className="t-name" title={r.definition || undefined}>{r.name}</div>
                  <div className="t-meta">
                    {[r.portfolio, r.accountability, r.project].filter(Boolean).join(' · ')}
                  </div>
                </td>
                <td className="num">
                  {editable
                    ? <input className="qin" key={`t-${r.id}-${year}-${reg}`}
                             defaultValue={toInput(y.target, r.unit)}
                             onBlur={e => saveCell(r.id, 'target', e.target.value)}
                             disabled={!!saving[r.id + 'target']} />
                    : fmt(y.target, r.unit)}
                </td>
                <td className="ctr" style={{ background: 'var(--green-x)' }}>
                  {editable
                    ? <input className="qin" key={`q-${r.id}-${year}-${qtr}-${reg}`}
                             defaultValue={toInput(y[QK[qtr - 1]], r.unit)}
                             onBlur={e => saveCell(r.id, QK[qtr - 1], e.target.value)}
                             disabled={!!saving[r.id + QK[qtr - 1]]} />
                    : fmt(y[QK[qtr - 1]], r.unit)}
                </td>
                <td className="num">{fmt(actualOf(y, r), r.unit)}</td>
                <td>
                  <div className="prog"><i className={'p-' + statusClass(a)}
                       style={{ width: a === null ? 0 : Math.max(2, Math.min(100, a * 100)) + '%' }} /></div>
                  <div className="t-meta">{pct(a)}</div>
                </td>
                <td className="ctr"><Spark row={y} unit={r.unit} /></td>
                <td><span className={'bdg ' + wf.cls}>{wf.label}</span></td>
                <td className="ctr">
                  <span className={'bdg ' + (ev ? 'b-ok' : 'b-gy')}>{ev}</span>
                </td>
                <td className="ctr no-print">
                  <button className="btn sm" onClick={() => setOpenId(r.id)}>{t('Buka form')}</button>
                </td>
              </tr>
            );
          })}
          {!view.length && (
            <tr><td colSpan={9}>
              <div className="nodata"><b>{t('Tidak ada indikator yang cocok')}</b>
                <span>{t('Ubah kata kunci atau filter status.')}</span></div>
            </td></tr>
          )}
        </tbody>
      </table></div></div>

      {openId && (
        <IndicatorDrawer ind={data.find(x => x.id === openId)}
                         year={year} qtr={qtr} region={reg} role={role}
                         onClose={() => setOpenId(null)} />
      )}

      {!editable && !isAccum && (
        <div className="note i mt">
          Role Anda tidak memiliki hak input pada kerangka {type}. Pembatasan yang sama ditegakkan
          ulang oleh Row Level Security di database, bukan hanya di layar ini.
        </div>
      )}
    </>
  );
}
