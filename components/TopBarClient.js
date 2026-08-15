'use client';

import { useQuery } from '@/lib/useParams';
import TopBar from './TopBar';

/** Menentukan tahun aktif dari URL, dengan 2026 sebagai default bila tersedia. */
export default function TopBarClient({ profile, years }) {
  const sp = useQuery();
  const year = sp.get('year') || (years.includes('2026') ? '2026' : years[years.length - 1]);
  const qtr = Number(sp.get('q')) || 2;
  return <TopBar profile={profile} years={years} year={year} qtr={qtr} />;
}
