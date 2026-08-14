import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBarClient from '@/components/TopBarClient';
import Translate from '@/components/Translate';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, unit, active, must_change')
    .eq('id', user.id).single();
  if (!profile || !profile.active) redirect('/login');

  const { data: yrs } = await supabase.from('indicator_years').select('year').order('year');
  const years = [...new Set((yrs || []).map(r => String(r.year)))];
  const list = years.length ? years : [String(new Date().getFullYear())];

  return (
    <div id="app" className="on">
      <Suspense><Sidebar role={profile.role} /></Suspense>
      <Suspense><TopBarClient profile={profile} years={list} /></Suspense>
      <main className="main"><Translate>{children}</Translate></main>
    </div>
  );
}
