import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, unit, active, must_change')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.active) redirect('/login');

  return (
    <div id="app" className="on">
      <Sidebar role={profile.role} />
      <TopBar profile={profile} />
      <main className="main">{children}</main>
    </div>
  );
}
