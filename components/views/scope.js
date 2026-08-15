'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@/lib/useParams';
import { useMemo } from 'react';

export const ACCUM = 'Akumulasi Regional';
export const FRAMEWORKS = [
  ['', 'Semua kerangka (OPI + RPI + PPI)'],
  ['OPI', 'OPI — Organization Performance'],
  ['RPI', 'RPI — Regional Performance'],
  ['PPI', 'PPI — Program Performance']
];

/**
 * Cakupan analisis: kerangka (OPI/RPI/PPI) dan — bila RPI ikut — region.
 *
 * Keduanya disimpan pada URL seperti tahun dan kuartal, sehingga pilihan
 * bertahan saat berpindah antar halaman analytics dan ikut saat tautan
 * dibagikan.
 *
 * Untuk RPI, baris tahun aktif DIPETAKAN ULANG ke region terpilih. Tanpa
 * pemetaan ini seluruh perhitungan akan memakai baris Akumulasi Regional,
 * dan mengganti region tidak akan mengubah angka apa pun.
 */
export function useScope(rows, year, regions = []) {
  const router = useRouter();
  const path = usePathname();
  const sp = useQuery();

  const type = sp.get('f') || '';
  const fromUrl = sp.get('region');
  const region = regions.includes(fromUrl) ? fromUrl : (regions.includes(ACCUM) ? ACCUM : regions[0] || ACCUM);

  const setParam = (k, v) => {
    const q = new URLSearchParams(sp.toString());
    if (v) q.set(k, v); else q.delete(k);
    router.push(`${path}?${q.toString()}`);
    router.refresh();
  };

  const scoped = useMemo(() => {
    const base = type ? rows.filter(r => r.type === type) : rows;
    return base.map(r => {
      if (r.type !== 'RPI') return r;
      const row = r.regions?.[year]?.[region] || {};
      return { ...r, year: row, years: { ...r.years, [year]: row } };
    });
  }, [rows, type, region, year]);

  const hasRpi = useMemo(() => scoped.some(r => r.type === 'RPI'), [scoped]);

  return {
    type, setType: v => setParam('f', v),
    region, setRegion: v => setParam('region', v),
    rows: scoped, hasRpi
  };
}

/** Baris filter cakupan. Pemilih region hanya muncul bila RPI ikut tercakup. */
export function ScopeBar({ scope, regions = [], right, children }) {
  return (
    <div className="card mb"><div className="card-b" style={{ padding: '12px 14px' }}>
      <div className="filters">
        <select value={scope.type} onChange={e => scope.setType(e.target.value)} title="Kerangka indikator">
          {FRAMEWORKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        {scope.hasRpi && regions.length > 0 && (
          <select value={scope.region} onChange={e => scope.setRegion(e.target.value)} title="Region (RPI)">
            {regions.map(r => <option key={r} value={r}>{r === ACCUM ? r : 'Region ' + r}</option>)}
          </select>
        )}

        {children}
        {right}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
          {scope.rows.length} indikator
        </span>
      </div>

      {scope.hasRpi && (
        <div className="hint" style={{ marginTop: 8 }}>
          Indikator RPI dibaca pada region <b>{scope.region}</b>
          {scope.region === ACCUM && ' — penjumlahan Q1–Q4 keempat region, rata-rata untuk unit Percent'}.
          Indikator OPI dan PPI tidak memiliki dimensi region dan tidak terpengaruh pilihan ini.
        </div>
      )}
    </div></div>
  );
}
