import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UserAdmin from '@/components/UserAdmin';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from('profiles').select('id, role').eq('id', user.id).single();
  if (me?.role !== 'sysadmin') redirect('/dashboard');

  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, full_name, email, role, unit, active, must_change, last_login')
    .order('username');

  return <UserAdmin users={users || []} meId={me.id} />;
}
