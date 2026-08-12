import { getIndicators, getYears } from '@/lib/data';
import { achievement, statusClass, countByStatus, scoreOf, pct, STATUS_LABEL } from '@/lib/calc';
import Link from 'next/link';
import TrendChart from '@/components/TrendChart';
import { getTrend } from '@/lib/trend';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
  const years = await getYears();
  const year = searchParams?.year || (years.includes('2026') ? '2026' : years[years.length - 1]);
  const rows = await getIndicators(null, year);
  const trend = await getTrend();

  const opi = rows.filter(r => r.type === 'OPI');
  const ppi = rows.filter(r => r.type === 'PPI');
  const withData = rows.filter(r => achievement(r.year, r) !== null).length;
  const counts = countByStatus(rows);
  const score = scoreOf(rows);

  const card = (label, value, detail, cls) => (
    <div className={'kpi ' + (cls || '')} key={label}>
      <div className="lb">{label}</div><div className="vl">{value}</div><div className="dl">{detail}</div>
    </div>
  );

  return (
    <>
      <div className="page-h">
        <h2>Executive Dashboard — {year}</h2>
        <p>Ringkasan performa organisasi dan program. Seluruh angka rata-rata hanya menghitung indikator
           yang memiliki target dan actual sekaligus.</p>
      </div>

      <div className="grid g4 mb">
        {card('Total indikator', rows.length, `${opi.length} OPI · ${ppi.length} PPI`)}
        {card('Ber-capaian', withData, `dari ${rows.length} indikator`, 'b')}
        {card('Rata-rata capaian', pct(score), `dihitung dari ${withData} indikator saja`, 'gd')}
        {card('At Risk', counts.rd, 'di bawah 75% dari target', 'a')}
      </div>

      <div className="grid g4 mb">
        {['ok', 'am', 'rd', 'gy'].map(k => card(STATUS_LABEL[k], counts[k], `${rows.length ? Math.round(counts[k] / rows.length * 100) : 0}% dari seluruh indikator`))}
      </div>

      <TrendChart years={trend.years} opi={trend.opi} ppi={trend.ppi} all={trend.all} />

      {counts.gy > 0 && (
        <div className="note w mb">
          <b>Kesiapan data.</b> {counts.gy} indikator berstatus No Data pada {year} — belum memiliki target dan actual
          sekaligus. Indikator ini <b>tidak dihitung sebagai capaian nol</b> dan dikeluarkan dari rata-rata di atas.
          Membaca angka rata-rata tanpa memperhatikan jumlah indikator ber-data akan melebih-lebihkan performa.
        </div>
      )}

      <div className="card"><div className="card-b">
        <p style={{ margin: 0, fontSize: 13 }}>
          Lanjut ke <Link href="/opi">KPI Repository (OPI)</Link>,{' '}
          <Link href="/ppi">Indicator Repository (PPI)</Link>, atau{' '}
          <Link href="/analytics/pathway">Pathway Diagram</Link>.
        </p>
      </div></div>
    </>
  );
}
