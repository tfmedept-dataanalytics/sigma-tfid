import { getAll, trendFrom } from '@/lib/data';
import Dashboard from '@/components/views/dashboard';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
  const probe = await getAll(String(new Date().getFullYear()));
  const years = probe.allYears;
  const year = searchParams?.year || (years.includes('2026') ? '2026' : years[years.length - 1]);
  const qtr = Number(searchParams?.q) || 2;

  const { rows, config } = await getAll(year);
  const trend = trendFrom(rows, years);

  return <Dashboard rows={rows} year={year} qtr={qtr} allYears={years} trend={trend} config={config} />;
}
