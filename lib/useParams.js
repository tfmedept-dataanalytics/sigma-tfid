'use client';

import { useSearchParams } from 'next/navigation';

/**
 * useSearchParams() dapat mengembalikan null — terjadi saat komponen klien
 * dirender di luar batas Suspense, atau pada halaman yang dirender statis.
 * Memanggil .get() pada nilai null menjatuhkan seluruh aplikasi dengan
 * "Cannot read properties of null (reading 'get')".
 *
 * Pembungkus ini selalu mengembalikan objek yang aman dipanggil, sehingga
 * ketiadaan query string hanya berarti nilai default — bukan halaman gagal.
 */
export function useQuery() {
  const sp = useSearchParams();
  return sp || new URLSearchParams();
}
