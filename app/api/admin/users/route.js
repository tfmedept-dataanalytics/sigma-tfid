import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/* Domain internal untuk memetakan username → email Supabase Auth.
   Ganti dengan domain organisasi bila akun memakai email sungguhan. */
const DOMAIN = 'sigma.local';

/** Pastikan pemanggil adalah System Administrator yang aktif. */
async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesi tidak ditemukan.', status: 401 };

  const { data: profile } = await supabase
    .from('profiles').select('id, role, active, username').eq('id', user.id).single();

  if (!profile?.active || profile.role !== 'sysadmin') {
    return { error: 'Hanya System Administrator yang dapat mengelola akun.', status: 403 };
  }
  return { profile, supabase };
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const username = String(body.username || '').trim().toLowerCase();
  const fullName = String(body.full_name || '').trim();
  const password = String(body.password || '');
  const role = String(body.role || 'contrib');
  const unit = String(body.unit || '').trim();
  const email = String(body.email || '').trim() || `${username}@${DOMAIN}`;
  const mustChange = body.must_change !== false;

  if (!fullName) return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
  if (!/^[a-z0-9.]{3,}$/.test(username)) {
    return NextResponse.json({ error: 'Username minimal 3 karakter: huruf kecil, angka, dan titik.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password awal minimal 8 karakter.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: exists } = await admin.from('profiles').select('id').eq('username', username).maybeSingle();
  if (exists) return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 409 });

  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true
  });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });

  const { error: profErr } = await admin.from('profiles').insert({
    id: created.user.id, username, full_name: fullName, email,
    role, unit, active: true, must_change: mustChange
  });
  if (profErr) {
    // Rollback agar tidak menyisakan akun auth tanpa profil.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profErr.message }, { status: 400 });
  }

  await admin.from('audit_log').insert({
    actor: auth.profile.id, actor_username: auth.profile.username,
    action: 'Tambah pengguna', object: username, detail: role
  });

  return NextResponse.json({ ok: true, username });
}

export async function PATCH(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id, role, active, password, must_change } = await request.json();
  if (!id) return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 });

  const admin = createAdminClient();

  // Jangan sampai tersisa nol administrator aktif.
  if (role !== undefined || active !== undefined) {
    const { data: target } = await admin.from('profiles').select('role, active, username').eq('id', id).single();
    const wouldLose = target?.role === 'sysadmin' && target?.active &&
      ((role !== undefined && role !== 'sysadmin') || active === false);
    if (wouldLose) {
      const { count } = await admin.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'sysadmin').eq('active', true);
      if ((count || 0) <= 1) {
        return NextResponse.json({ error: 'Ditolak: ini administrator aktif terakhir.' }, { status: 409 });
      }
    }
    if (id === auth.profile.id && active === false) {
      return NextResponse.json({ error: 'Tidak dapat menonaktifkan akun yang sedang Anda gunakan.' }, { status: 409 });
    }
  }

  const patch = {};
  if (role !== undefined) patch.role = role;
  if (active !== undefined) patch.active = active;
  if (must_change !== undefined) patch.must_change = must_change;

  if (password) {
    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 });
    }
    const { error } = await admin.auth.admin.updateUserById(id, { password: String(password) });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    patch.must_change = must_change === undefined ? true : must_change;
  }

  if (Object.keys(patch).length) {
    const { error } = await admin.from('profiles').update(patch).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await admin.from('audit_log').insert({
    actor: auth.profile.id, actor_username: auth.profile.username,
    action: password ? 'Reset password' : 'Ubah akun', object: id,
    detail: JSON.stringify(patch)
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 });
  if (id === auth.profile.id) {
    return NextResponse.json({ error: 'Tidak dapat menghapus akun yang sedang Anda gunakan.' }, { status: 409 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles').select('role, active, username').eq('id', id).single();
  if (target?.role === 'sysadmin' && target?.active) {
    const { count } = await admin.from('profiles')
      .select('id', { count: 'exact', head: true }).eq('role', 'sysadmin').eq('active', true);
    if ((count || 0) <= 1) {
      return NextResponse.json({ error: 'Ditolak: ini administrator aktif terakhir.' }, { status: 409 });
    }
  }

  const { error } = await admin.auth.admin.deleteUser(id); // profiles ikut terhapus lewat ON DELETE CASCADE
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin.from('audit_log').insert({
    actor: auth.profile.id, actor_username: auth.profile.username,
    action: 'Hapus pengguna', object: target?.username || id, detail: ''
  });

  return NextResponse.json({ ok: true });
}
