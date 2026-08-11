/**
 * Membuat atau mereset satu akun System Administrator.
 *
 *   npm run create-admin
 *   npm run create-admin -- --username admin --password RahasiaBaru123
 *
 * Gunakan bila:
 *   - seed belum pernah dijalankan dan Anda hanya perlu satu akun untuk masuk;
 *   - password administrator terlupa dan tidak ada administrator lain yang aktif.
 *
 * Skrip memakai SUPABASE_SERVICE_ROLE_KEY, jadi hanya boleh dijalankan dari
 * komputer Anda sendiri — jangan pernah dari server yang diakses publik.
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const arg = n => {
  const i = process.argv.indexOf('--' + n);
  return i > -1 ? process.argv[i + 1] : null;
};

const DOMAIN = 'sigma.local';
const username = (arg('username') || 'admin').toLowerCase();
const password = arg('password') || process.env.SEED_DEFAULT_PASSWORD || 'sigma2026';
const fullName = arg('name') || 'Admin SIGMA';
const email = arg('email') || `${username}@${DOMAIN}`;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib ada di .env.local');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password minimal 8 karakter.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  console.log(`Target : ${url}`);
  console.log(`Akun   : ${username} <${email}>`);

  const { data: profile } = await db
    .from('profiles').select('id, username, email, role, active').eq('username', username).maybeSingle();

  if (profile) {
    // Akun sudah ada → reset password dan pastikan aktif sebagai sysadmin.
    const { error: pwErr } = await db.auth.admin.updateUserById(profile.id, { password });
    if (pwErr) throw pwErr;
    const { error: upErr } = await db.from('profiles')
      .update({ role: 'sysadmin', active: true, must_change: true }).eq('id', profile.id);
    if (upErr) throw upErr;
    console.log('\nAkun sudah ada — password direset dan role dipastikan System Administrator.');
  } else {
    const { data: created, error: authErr } = await db.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authErr) throw authErr;

    const { error: insErr } = await db.from('profiles').insert({
      id: created.user.id, username, full_name: fullName, email,
      role: 'sysadmin', unit: 'IT', active: true, must_change: true
    });
    if (insErr) {
      await db.auth.admin.deleteUser(created.user.id);   // jangan tinggalkan akun auth tanpa profil
      throw insErr;
    }
    console.log('\nAkun administrator dibuat.');
  }

  console.log(`\n  Username : ${username}`);
  console.log(`  Password : ${password}`);
  console.log('\nPassword ini wajib diganti saat pertama masuk. Ganti juga bila dikirim melalui kanal');
  console.log('yang tidak aman — skrip ini mencetaknya ke layar, jadi jangan bagikan tangkapan layarnya.');
}

main().catch(e => { console.error('\nGAGAL:', e.message || e); process.exit(1); });
