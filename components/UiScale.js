'use client';

import { useEffect, useState } from 'react';
import { useLang } from './LangProvider';

const KEY = 'sigma_ui_scale';
const DEFAULT = '0.8';
const OPTIONS = ['0.7', '0.8', '0.9', '1'];

/** Menerapkan skala tersimpan sedini mungkin agar tidak ada kedipan ukuran. */
export function applyScale(v) {
  document.documentElement.style.setProperty('--ui-scale', v);
}

/**
 * Pemilih kepadatan tampilan.
 *
 * Default 80%: lebih banyak baris tabel dan kartu terlihat sekaligus, yang
 * penting pada layar Quarterly Update dengan ratusan indikator. Pilihan tetap
 * disediakan karena kepadatan yang nyaman berbeda-beda menurut ukuran layar
 * dan penglihatan masing-masing pengguna.
 */
export default function UiScale() {
  const { t } = useLang();
  const [scale, setScale] = useState(DEFAULT);

  useEffect(() => {
    const saved = localStorage.getItem(KEY) || DEFAULT;
    setScale(saved);
    applyScale(saved);
  }, []);

  const change = v => {
    setScale(v);
    localStorage.setItem(KEY, v);
    applyScale(v);
  };

  return (
    <select className="sel-sm" value={scale} onChange={e => change(e.target.value)}
            title={t('Kepadatan tampilan')} aria-label={t('Kepadatan tampilan')}>
      {OPTIONS.map(v => (
        <option key={v} value={v}>{Math.round(Number(v) * 100)}%</option>
      ))}
    </select>
  );
}
