import { getIndicators, getYears } from '@/lib/data';
import Pathway from '@/components/Pathway';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
  const years = await getYears();
  const year = searchParams?.year || (years.includes('2026') ? '2026' : years[years.length - 1]);
  const rows = await getIndicators(null, year);

  return (
    <>
      <div className="page-h">
        <h2>Pathway Diagram</h2>
        <p>Alur hubungan Indicator → Project → ToC Portfolio → ToC Foundation (PPI), atau
           KPI → Program → Outcome → Strategy Map (OPI), dengan nilai pada garis penghubungnya.</p>
      </div>
      <Pathway rows={rows} year={year} />
    </>
  );
}
