'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  achievement, actualOf, statusClass, STATUS_LABEL, STATUS_COLOR,
  fmt, pct, toStored, toInput, WORKFLOW, can
} from '@/lib/calc';
import { Spark } from '@/components/ui';
import IndicatorDrawer from './IndicatorDrawer';
import { useLang } from '@/components/LangProvider';
import { useRegion } from '@/lib/useRegion';

const ACCUM = 'Akumulasi Regional';

/**
 * Tabel indikator regional. Berbeda dari IndicatorTable karena satu indikator
 * memiliki satu baris nilai untuk SETIAP region — pilihan region menentukan
 * baris mana yang ditampilkan dan disimpan.
 */
export default function RegionalTable({ rows, year, qtr = 2, regions = [], role,
                                        region: regionProp, onRegion }) {
  const { t } = useLang();
  const [urlRegion, setUrlRegion] = useRegion(regions, regionProp);
  const region = urlRegion;
  const setRegion = onRegion ?? setUrlRegion;

  const [data, setData] = useState(rows);
  useEffect(() => { setData(rows); }, [rows, year]);

  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('');
  const [saving, setSaving] = useState({});
  const [openId, setOpenId] = useState(null);
  const [, startTransition] = useTransition();

  /* RPI berada di luar cakupan Program Manager dan Head of Program: keduanya
     terikat pada satu kerangka lain. Pembatasan yang sama ditegakkan RLS. */
  /* Baris Akumulasi Regional dihitung dari keempat region, jadi tidak boleh
     diedit langsung — mengisinya manual akan membuat angka akumulasi berbeda
     dari penjumlahan regionnya. */
  const isAccum = region === ACCUM;
  const editable = can(role, 'edit') && role !== 'pm' && role !== 'head' && !isAccum;

  const rowOf = r => r.regions?.[year]?.[region] || null;

  const view = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.filter(r => {
      if (s) {
        const hay = [r.id, r.name, r.portfolio, r.program, r.accountability]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (statusF && statusClass(achievement(rowOf(r), r)) !== statusF) return false;
      return true;
    });
  }, [data, q, statusF, region, year]);

  const withData = view.filter(r => achievement(rowOf(r), r) !== null).length;
  const vals = view.map(r => achievement(rowOf(r), r)).filter(v => v !== null);
  const score = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const atRisk = view.filter(r => {
    const a = achievement(rowOf(r), r);
    return a !== null && a < 0.75;
  }).length;

  async function saveCell(id, field, raw) {
    const r = data.find(x => x.id === id);
    const val = toStored(raw, r.unit);
    const key = id + field + region;
    setSaving(s => ({ ...s, [key]: 1 }));

    const supabase = createClient();
    /* Baris region mungkin belum ada pada data sumber, jadi upsert —
       bukan update — agar region yang belum pernah diisi tetap dapat dibuat. */
    const existing = rowOf(r) || {};
    const { error } = await supabase.from('indicator_years').upsert({
      indicator_id: id, year: Number(year), region,
      target: existing.target ?? null,
      q1: existing.q1 ?? null, q2: existing.q2 ?? null,
      q3: existing.q3 ?? null, q4: existing.q4 ?? null,
      status: existing.status || 'draft',
      [field]: val
    }, { onConflict: 'indicator_id,year,region' });

    setSaving(s => { const c = { ...s }; delete c[key]; return c; });
    if (error) { alert('Gagal menyimpan: ' + error.message); return; }

    startTransition(() => {
      setData(ds => ds.map(x => {
        if (x.id !== id) return x;
        const regs = { ...(x.regions || {}) };
        const yr = { ...(regs[year] || {}) };
        const cur = { ...(yr[region] || { status: 'draft' }) };
        cur[field] = val;
        if (cur.status === 'approved') cur.status = 'draft';
        yr[region] = cur; regs[year] = yr;
        return { ...x, regions: regs };
      }));
    });
  }

  return (
    <>
      <div className="grid g4 mb">
        <div className="kpi"><div className="lb">Indikator</div><div className="vl">{view.length}</div>
          <div className="dl">KPI regional · {region} · {year}</div></div>
        <div className="kpi b"><div className="lb">Ber-capaian</div><div className="vl">{withData}</div>
          <div className="dl">punya target dan actual sekaligus</div></div>
        <div className="kpi gd"><div className="lb">Rata-rata capaian</div><div className="vl">{pct(score)}</div>
          <div className="dl">dihitung dari {withData} indikator saja</div></div>
        <div className="kpi a"><div className="lb">At Risk</div><div className="vl">{atRisk}</div>
          <div className="dl">di bawah 75% dari target</div></div>
      </div>

      {isAccum && (
        <div className="note i mb">
          <b>Akumulasi Regional dihitung, bukan diinput.</b> Nilai Q1–Q4 pada tampilan ini adalah
          penjumlahan kuartal dari Jawa, Sumatera-A, Sumatera-B, dan Kalimantan
          {view.some(r => String(r.unit || '').toLowerCase() === 'percent') && (
            <> — kecuali indikator ber-unit <b>Percent</b>, yang memakai rata-rata tidak berbobot
            karena menjumlahkan persentase antar region tidak bermakna</>
          )}. Untuk mengubah angkanya, perbaiki nilai pada region yang bersangkutan.
        </div>
      )}

      {withData < view.length && (
        <div className="note w mb">
          <b>Kesiapan data.</b> {view.length - withData} dari {view.length} indikator belum memiliki
          target dan actual sekaligus pada region {region} tahun {year}, sehingga berstatus
          <i> No Data</i> dan dikeluarkan dari rata-rata di atas — bukan dihitung sebagai nol.
        </div>
      )}

      <div className="card mb"><div className="card-b" style={{ padding: '12px 14px' }}>
        <div className="filters">
          <select value={region} onChange={e => setRegion(e.target.value)} title="Region">
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input type="search" placeholder="Cari indikator, portfolio, program…"
                 value={q} onChange={e => setQ(e.target.value)} />
          <select value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">{t('Semua status capaian')}</option>
            {['ok', 'am', 'rd', 'gy'].map(k => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            {view.length} {t('baris')}
          </span>
        </div>
      </div></div>

      <div className="card"><div className="tbl-w"><table>
        <thead><tr>
          <th style={{ width: 74 }}>ID</th>
          <th style={{ minWidth: 280 }}>Indikator</th>
          <th className="num">Target 2030</th>
          <th className="num">Target {year}</th>
          {[1, 2, 3, 4].map(n => (
            <th className="ctr" key={n}
                style={n === qtr ? { background: 'var(--green-x)', color: 'var(--green-d)' } : undefined}>Q{n}</th>
          ))}
          <th className="num">Actual YTD</th>
          <th style={{ width: 120 }}>Capaian</th>
          <th className="ctr">Trend</th>
          <th>Status</th><th>Workflow</th><th className="ctr no-print">Form</th>
        </tr></thead>
        <tbody>
          {view.map(r => {
            const y = rowOf(r);
            const a = achievement(y, r);
            const cls = statusClass(a);
            const wf = WORKFLOW[y?.status] || WORKFLOW.draft;
            return (
              <tr key={r.id}>
                <td><span className="code">{r.id}</span></td>
                <td><div className="t-name" title={r.definition || undefined}>{r.name}</div>
                  {r.definition && (
                    <div className="t-meta" style={{ maxWidth: 380, whiteSpace: 'normal' }}>
                      {r.definition.length > 110 ? r.definition.slice(0, 109) + '…' : r.definition}
                    </div>
                  )}
                  <div className="t-meta">
                    {[r.strategy_map, r.portfolio, r.accountability].filter(Boolean).join(' › ')}
                  </div></td>
                <td className="num">{fmt(r.t2030, r.unit)}</td>
                <td className="num">
                  {editable
                    ? <input className="qin" key={`t-${r.id}-${year}-${region}`}
                             defaultValue={toInput(y?.target, r.unit)}
                             onBlur={e => saveCell(r.id, 'target', e.target.value)}
                             disabled={!!saving[r.id + 'target' + region]} />
                    : fmt(y?.target, r.unit)}
                </td>
                {['q1', 'q2', 'q3', 'q4'].map((k, ki) => (
                  <td className="ctr" key={k}
                      style={ki + 1 === qtr ? { background: 'var(--green-x)' } : undefined}>
                    {editable
                      ? <input className="qin" key={`${k}-${r.id}-${year}-${region}`}
                               defaultValue={toInput(y?.[k], r.unit)}
                               onBlur={e => saveCell(r.id, k, e.target.value)}
                               disabled={!!saving[r.id + k + region]} />
                      : fmt(y?.[k], r.unit)}
                  </td>
                ))}
                <td className="num">
                  {fmt(actualOf(y, r), r.unit)}
                  {isAccum && y?.contributors !== undefined && (
                    <div className="t-meta">{y.contributors} region{y.pctAvg ? ' · rata-rata' : ' · jumlah'}</div>
                  )}
                </td>
                <td>
                  <div className="prog"><i className={'p-' + cls}
                       style={{ width: a === null ? 0 : Math.max(2, Math.min(100, a * 100)) + '%' }} /></div>
                  <div className="t-meta">{pct(a)}</div>
                </td>
                <td className="ctr"><Spark row={y || {}} unit={r.unit} /></td>
                <td><span className={'bdg b-' + cls}>{STATUS_LABEL[cls]}</span></td>
                <td><span className={'bdg ' + wf.cls}>{wf.label}</span></td>
                <td className="ctr no-print">
                  <button className="btn sm" onClick={() => setOpenId(r.id)}>Buka form</button>
                </td>
              </tr>
            );
          })}
          {!view.length && (
            <tr><td colSpan={14}>
              <div className="nodata"><b>Tidak ada indikator yang cocok</b>
                <span>Ubah kata kunci, region, atau filter status.</span></div>
            </td></tr>
          )}
        </tbody>
      </table></div></div>

      {openId && (
        <IndicatorDrawer
          ind={data.find(x => x.id === openId)}
          year={year} qtr={qtr} region={region} role={role}
          onClose={() => setOpenId(null)} />
      )}

      {!editable && (
        <div className="note i mt">
          Role Anda tidak memiliki hak input pada kerangka RPI. Pembatasan yang sama ditegakkan
          ulang oleh Row Level Security di database, bukan hanya di layar ini.
        </div>
      )}
    </>
  );
}
