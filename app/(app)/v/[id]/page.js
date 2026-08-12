import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getAll } from '@/lib/data';
import { TITLES } from '@/lib/nav';
import { can } from '@/lib/calc';
import ViewHost, { VIEWS } from '@/components/views';
import UserAdmin from '@/components/UserAdmin';

export const dynamic = 'force-dynamic';

const canManage = r => r === 'sysadmin' || r === 'pmo';
const ADMIN_ONLY = id => id.startsWith('ad-');
const MANAGE_ONLY = id => id.startsWith('md-');

export async function generateMetadata({ params }) {
  const t = TITLES[params.id];
  return { title: t ? `${t.t} — SIGMA` : 'SIGMA' };
}

export default async function ViewPage({ params, searchParams }) {
  const id = params.id;
  if (!TITLES[id]) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles').select('id, role, username').eq('id', user.id).single();
  const role = profile?.role;

  if (ADMIN_ONLY(id) && !can(role, 'admin')) redirect('/dashboard');
  if (MANAGE_ONLY(id) && !canManage(role)) redirect('/dashboard');
  if (role === 'exec' && id.startsWith('wf-')) redirect('/dashboard');

  const { rows, config, allYears } = await getAll(
    searchParams?.year || (allYearsPick(await yearsOf(supabase)))
  );
  const year = searchParams?.year || allYearsPick(allYears);

  /* Halaman yang membutuhkan data tambahan di luar indikator. */
  let extra = {};
  if (id === 'ad-usr') {
    const { data: users } = await supabase.from('profiles')
      .select('id, username, full_name, email, role, unit, active, must_change, last_login')
      .order('username');
    return <UserAdmin users={users || []} meId={profile.id} />;
  }
  if (id === 'ad-aud') {
    const { data } = await supabase.from('audit_log')
      .select('id, actor_username, action, object, detail, at').order('at', { ascending: false }).limit(200);
    extra.audit = data || [];
  }
  if (id === 'ad-not') {
    const { data } = await supabase.from('notifications')
      .select('id, message, read, created_at').order('created_at', { ascending: false }).limit(100);
    extra.notifications = data || [];
  }

  if (!VIEWS[id]) notFound();

  return (
    <ViewHost id={id} rows={rows} year={year} allYears={allYears}
              role={role} config={config} {...extra} />
  );
}

async function yearsOf(supabase) {
  const { data } = await supabase.from('indicator_years').select('year').order('year');
  const s = [...new Set((data || []).map(r => String(r.year)))];
  return s.length ? s : [String(new Date().getFullYear())];
}
function allYearsPick(years) {
  return years.includes('2026') ? '2026' : years[years.length - 1];
}
