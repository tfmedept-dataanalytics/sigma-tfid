import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DOMAIN = 'sigma.local';

/**
 * Bootstrap sekali pakai: membuat akun System Administrator pertama.
 *
 * Pengaman:
 *  - Menolak bila sudah ada satu saja administrator aktif. Jadi endpoint ini
 *    mati dengan sendirinya begitu sistem punya admin — tidak bisa dipakai
 *    orang lain untuk menyelipkan akun.
 *  - Menolak bila SIGMA_DISABLE_BOOTSTRAP=1 diset di environment.
 *  - Akun yang dibuat wajib ganti password saat pertama masuk.
 */
export async function POST(request) {
  if (process.env.SIGMA_DISABLE_BOOTSTRAP === '1') {
    return NextResponse.json({ error: 'Bootstrap dinonaktifkan lewat SIGMA_DISABLE_BOOTSTRAP.' }, { status: 403 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di Vercel. Tambahkan untuk Production lalu Redeploy.'
    }, { status: 400 });
  }

  let body = {};
  try { body = await request.json(); } catch { /* body opsional */ }

  const username = String(body.username || 'admin').trim().toLowerCase();
  const password = String(body.password || '').trim() || genPassword();
  const email = String(body.email || '').trim() || `${username}@${DOMAIN}`;

  if (!/^[a-z0-9.]{3,}$/.test(username)) {
    return NextResponse.json({ error: 'Username minimal 3 karakter: huruf kecil, angka, dan titik.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 });
  }

  let admin;
  try { admin = createAdminClient(); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }

  // Tabel belum ada → migrasi belum dijalankan.
  const { count: adminCount, error: probeErr } = await admin
    .from('profiles').select('id', { count: 'exact', head: true })
    .eq('role', 'sysadmin').eq('active', true);

  if (probeErr) {
    return NextResponse.json({
      error: 'Tabel profiles belum bisa dibaca: ' + probeErr.message +
             '. Jalankan 0001_schema.sql dan 0002_rls.sql di Supabase SQL Editor lebih dulu.'
    }, { status: 400 });
  }

  if ((adminCount || 0) > 0) {
    return NextResponse.json({
      error: 'Sudah ada administrator aktif. Bootstrap hanya berjalan saat belum ada satu pun. ' +
             'Gunakan reset password dari User Management, atau npm run create-admin.'
    }, { status: 409 });
  }

  // Akun auth dengan email ini mungkin sudah ada dari percobaan sebelumnya.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = (list?.users || []).find(u => (u.email || '').toLowerCase() === email.toLowerCase());

  let userId;
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password, email_confirm: true
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    userId = existing.id;
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    userId = created.user.id;
  }

  const { error: upErr } = await admin.from('profiles').upsert({
    id: userId, username, full_name: 'Admin SIGMA', email,
    role: 'sysadmin', unit: 'IT', active: true, must_change: true
  }, { onConflict: 'id' });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  await admin.from('audit_log').insert({
    actor: userId, actor_username: username,
    action: 'Bootstrap administrator', object: username, detail: 'dibuat dari halaman /setup'
  });

  return NextResponse.json({ ok: true, username, password });
}

function genPassword() {
  const abc = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 14; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}
