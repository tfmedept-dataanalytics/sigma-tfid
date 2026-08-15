'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/* Pesan gagal login sengaja sama untuk username tidak dikenal maupun password
   salah, agar halaman login tidak menjadi alat memastikan username terdaftar. */
const GENERIC = 'Username atau password tidak dikenali.';

const looksLikeEmail = s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

export async function signIn(prevState, formData) {
  const input = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  if (!input || !password) return { error: 'Username dan password wajib diisi.' };

  const supabase = createClient();

  /* Tentukan email untuk Supabase Auth.

     Urutan ini penting: bila yang diketik sudah berupa email, pakai langsung.
     Akun yang dibuat lewat Supabase Dashboard belum punya baris di profiles,
     sehingga pencarian lewat email_for_username akan gagal — dan itulah cara
     akun administrator pertama masuk. */
  let email = null;

  if (looksLikeEmail(input)) {
    email = input;
  } else {
    const { data, error } = await supabase.rpc('email_for_username', { u: input });
    if (error) {
      console.error('[signIn] email_for_username:', error.message);
      return { error: 'Database belum siap: fungsi email_for_username tidak ditemukan. Jalankan file migrasi di Supabase SQL Editor.' };
    }
    email = data || null;
  }

  if (!email) {
    return { error: 'Username tidak ditemukan. Akun pertama dibuat di Supabase Dashboard (Authentication → Users) dan masuk dengan alamat emailnya.' };
  }

  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr || !auth?.user) {
    console.error('[signIn] signInWithPassword:', authErr?.message);
    return { error: GENERIC };
  }

  /* Ambil profil. Bila belum ada — kasus akun pertama dari dashboard —
     minta database membuatkannya. claim_profile hanya memberi role sysadmin
     saat tabel profiles masih kosong. */
  let { data: profile } = await supabase
    .from('profiles').select('id, active, must_change, role').eq('id', auth.user.id).single();

  if (!profile) {
    const { data: claim, error: claimErr } = await supabase.rpc('claim_profile');
    if (claimErr) {
      await supabase.auth.signOut();
      return { error: 'Akun terautentikasi tetapi profilnya belum ada, dan fungsi claim_profile tidak ditemukan. Jalankan 0007_claim_profile.sql di Supabase SQL Editor.' };
    }
    if (!claim?.ok) {
      await supabase.auth.signOut();
      return { error: claim?.reason === 'not_bootstrap'
        ? 'Akun ini belum terdaftar di SIGMA. Minta System Administrator mendaftarkannya melalui Administration › User Management.'
        : 'Profil tidak dapat dibuat untuk akun ini.' };
    }
    const re = await supabase
      .from('profiles').select('id, active, must_change, role').eq('id', auth.user.id).single();
    profile = re.data;
  }

  if (!profile) {
    await supabase.auth.signOut();
    return { error: 'Profil tidak ditemukan untuk akun ini.' };
  }
  if (!profile.active) {
    await supabase.auth.signOut();
    return { error: 'Akun dinonaktifkan. Hubungi System Administrator.' };
  }

  await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', profile.id);
  await supabase.from('audit_log').insert({
    actor: profile.id, actor_username: input, action: 'Login', object: '—', detail: ''
  });

  revalidatePath('/', 'layout');
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
