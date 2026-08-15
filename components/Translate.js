'use client';

import { cloneElement, isValidElement, Children, useMemo } from 'react';
import { useLang } from './LangProvider';
import { translator } from '@/lib/i18n';

/* Atribut yang ikut diterjemahkan. */
const ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];

/**
 * Menerjemahkan seluruh teks di dalam pohon React.
 *
 * Alasan pendekatan ini: SIGMA memiliki 46 halaman view dengan ribuan potong
 * teks. Menyisipkan t() satu per satu berisiko merusak halaman yang sudah
 * teruji dan pasti menyisakan bagian yang terlewat. Dengan menerjemahkan pada
 * lapisan render, halaman baru pun ikut terterjemahkan tanpa perubahan kode.
 *
 * Yang TIDAK diterjemahkan: nama indikator, kode, portfolio, dan seluruh isi
 * data lain — kamus hanya memuat frasa antarmuka, dan frasa yang tidak ada di
 * kamus dikembalikan apa adanya. Elemen bertanda data-no-i18n dilewati
 * seisinya, dipakai untuk blok yang murni berisi data.
 */
function walk(node, t) {
  if (node === null || node === undefined || node === false) return node;

  if (typeof node === 'string') {
    if (!node.trim()) return node;
    /* Spasi di tepi dipertahankan agar potongan kalimat yang dirangkai dari
       beberapa node tidak menempel satu sama lain. */
    const lead = node.match(/^\s*/)[0];
    const tail = node.match(/\s*$/)[0];
    return lead + t(node.trim()) + tail;
  }

  if (typeof node === 'number' || typeof node === 'boolean') return node;

  if (Array.isArray(node)) return Children.map(node, c => walk(c, t));

  if (isValidElement(node)) {
    if (node.props?.['data-no-i18n']) return node;

    const next = {};
    let changed = false;

    ATTRS.forEach(a => {
      const v = node.props?.[a];
      if (typeof v === 'string' && v.trim()) {
        const tv = t(v.trim());
        if (tv !== v) { next[a] = tv; changed = true; }
      }
    });

    if (node.props?.children !== undefined) {
      next.children = walk(node.props.children, t);
      changed = true;
    }

    return changed ? cloneElement(node, next) : node;
  }

  return node;
}

export default function Translate({ children }) {
  const { lang } = useLang();
  const t = useMemo(() => translator(lang), [lang]);
  if (lang === 'id') return children;      // tanpa biaya apa pun pada bahasa default
  return walk(children, t);
}
