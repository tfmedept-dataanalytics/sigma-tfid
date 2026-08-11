'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/* Pesan gagal login sengaja sama untuk username tidak dikenal maupun password
   salah, agar halaman login tidak menjadi alat memastikan username mana yang
   terdaftar. */
const GENERIC = 'Username atau password tidak dikenali.';
const NO_ACCOUNT = 'Akun belum terdaftar di database. Jalankan npm run seed atau npm run create-admin.';

export async function signIn(prevState, formData) {
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  if (!username || !password) return { error: 'Username dan password wajib diisi.' };

  const supabase = createClient();

  // username → email. Fungsi RPC hanya mengembalikan email untuk akun aktif.
  const { data: email, error: rpcErr } = await supabase.rpc('email_for_username', { u: username });

  if (rpcErr) {
    // Fungsi RPC belum ada berarti migrasi belum dijalankan — itu masalah
    // konfigurasi, bukan kredensial, jadi jangan disamarkan sebagai login gagal.
    console.error('[signIn] email_for_username gagal:', rpcErr.message);
    return { error: 'Database belum siap: fungsi email_for_username tidak ditemukan. Jalankan file migrasi di Supabase SQL Editor.' };
  }
  if (!email) {
    /* Bedakan "belum ada akun sama sekali" dari "username tidak cocok".
       Hitungannya lewat RPC SECURITY DEFINER, bukan select biasa: pada tahap
       ini pengguna masih anonim, dan RLS pada profiles menutup akses anon —
       select biasa akan selalu mengembalikan nol dan pesannya menyesatkan.
       Bila RPC belum ada (migrasi 0005 belum dijalankan), jangan menebak:
       pakai pesan generik. */
    const { data: total, error: cntErr } = await supabase.rpc('active_account_count');
    if (!cntErr && total === 0) return { error: NO_ACCOUNT };
    return { error: GENERIC };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) return { error: GENERIC };

  const { data: profile } = await supabase
    .from('profiles').select('id, active, must_change').eq('id', data.user.id).single();

  if (!profile?.active) {
    await supabase.auth.signOut();
    return { error: 'Akun dinonaktifkan. Hubungi System Administrator.' };
  }

  await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', profile.id);
  await supabase.from('audit_log').insert({
    actor: profile.id, actor_username: username, action: 'Login', object: '—', detail: ''
  });

  redirect(profile.must_change ? '/account/password?force=1' : '/dashboard');
}

export async function signOut() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('audit_log').insert({ actor: user.id, action: 'Logout', object: '—', detail: '' });
  }
  await supabase.auth.signOut();
  redirect('/login');
}

export async function changePassword(prevState, formData) {
  const pw = String(formData.get('password') || '');
  const pw2 = String(formData.get('password2') || '');
  if (pw.length < 8) return { error: 'Password baru minimal 8 karakter.' };
  if (pw !== pw2) return { error: 'Konfirmasi password tidak sama.' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesi berakhir. Masuk kembali.' };

  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) return { error: error.message };

  await supabase.from('profiles').update({ must_change: false }).eq('id', user.id);
  await supabase.from('audit_log').insert({ actor: user.id, action: 'Ganti password', object: '—', detail: '' });

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
