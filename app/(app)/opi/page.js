import { createClient } from '@/lib/supabase/server';
import { getIndicators, getYears } from '@/lib/data';
import IndicatorTable from '@/components/IndicatorTable';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
  const years = await getYears();
  const year = searchParams?.year || (years.includes('2026') ? '2026' : years[years.length - 1]);
  const rows = await getIndicators('OPI', year);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  return (
    <>
      <div className="page-h">
        <h2>KPI Repository & Quarterly Update — Organization Performance</h2>
        <p>Ubah nilai Q1–Q4 dan target langsung di tabel. Perubahan tersimpan saat kotak input kehilangan fokus,
           tercatat di indicator_history, dan menurunkan status Approved kembali ke Draft.</p>
      </div>
      <IndicatorTable type="OPI" year={year} years={years} role={profile?.role} rows={rows} />
    </>
  );
}
