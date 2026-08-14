/* Shim kompatibilitas.
   File ini ada semata-mata agar berkas lama yang tertinggal di repository —
   misalnya app/(app)/opi/page.js dari versi sebelumnya — tidak menggagalkan
   build dengan "Module not found: Can't resolve '@/lib/trend'".
   Perhitungan tren yang sebenarnya ada di lib/data.js (trendFrom). */
import { getAll, trendFrom } from '@/lib/data';

export async function getTrend(year) {
  const y = year || String(new Date().getFullYear());
  const { rows, allYears } = await getAll(y);
  return trendFrom(rows, allYears);
}
