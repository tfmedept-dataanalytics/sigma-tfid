'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const ACCUM = 'Akumulasi Regional';

/**
 * Region aktif, disimpan pada URL seperti tahun dan kuartal — sehingga
 * pilihan bertahan saat berpindah halaman RPI dan ikut ketika tautan dibagikan.
 *
 * Ditempatkan di modul tersendiri, bukan di components/views/regional.js,
 * karena RegionalTable memakainya sementara regional.js mengimpor
 * RegionalTable. Saling impor seperti itu membuat salah satu modul bernilai
 * undefined saat dimuat dan menjatuhkan halaman dengan "Element type is
 * invalid" — kesalahan yang muncul saat render, bukan saat build.
 */
export function useRegion(regions = [], regionProp) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();

  const fromUrl = sp.get('region');
  const fallback = regions.includes(ACCUM) ? ACCUM : (regions[0] || ACCUM);
  const region = regionProp || (regions.includes(fromUrl) ? fromUrl : fallback);

  const setRegion = v => {
    const q = new URLSearchParams(sp.toString());
    q.set('region', v);
    router.push(`${path}?${q.toString()}`);
    router.refresh();
  };

  return [region, setRegion];
}
