/**
 * Seed SIGMA ke Supabase.
 *
 *   npm run seed
 *
 * Membutuhkan .env.local berisi NEXT_PUBLIC_SUPABASE_URL dan
 * SUPABASE_SERVICE_ROLE_KEY. Jalankan SETELAH kedua file migrasi diterapkan.
 *
 * Skrip ini idempoten: menjalankannya dua kali tidak menggandakan data
 * (upsert berdasarkan primary key), tetapi TIDAK menimpa nilai kuartal yang
 * sudah diubah pengguna kecuali dijalankan dengan --force.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FORCE = process.argv.includes('--force');
const DOMAIN = 'sigma.local';
const DEFAULT_PW = process.env.SEED_DEFAULT_PASSWORD || 'sigma2026';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const seed = JSON.parse(readFileSync(join(__dirname, '../supabase/seed/sigma-seed.json'), 'utf8'));
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

/* ---------- 1. indicators ---------- */
const indicators = seed.indicators.map(i => ({
  id: i.id,
  type: i.type,
  name: i.name,
  code: i.code || null,
  unit: i.unit || null,
  calc: i.calc || null,
  agg: i.agg || null,
  t2030: i.t2030 ?? null,
  strategy_map: i.strategyMap || null,
  outcome: i.outcome || null,
  accountability: i.accountability || null,
  program: i.program || null,
  details: i.details || null,
  toc_foundation: i.tocFoundation || null,
  toc_foundation_code: i.tocFoundationCode || null,
  portfolio: i.portfolio || null,
  portfolio_code: i.portfolioCode || null,
  project: i.project || null,
  project_code: i.projectCode || null,
  level: i.level || null,
  result_statement: i.result || null,
  definition: i.definition || null,
  mov: i.mov || null,
  period: i.period || null
}));

/* ---------- 2. indicator_years ---------- */
const yearRows = [];
seed.indicators.forEach(i => {
  Object.entries(i.years || {}).forEach(([y, r]) => {
    yearRows.push({
      indicator_id: i.id,
      year: Number(y),
      target: r.target ?? null,
      q1: r.q?.[0] ?? null, q2: r.q?.[1] ?? null, q3: r.q?.[2] ?? null, q4: r.q?.[3] ?? null,
      notes: r.notes || null,
      key_initiatives: r.init || null,
      source: r.src || null,
      commentary: r.commentary || null,
      achievement: r.achievement || null,
      challenge: r.challenge || null,
      action: r.action || null,
      status: r.status || 'draft',
      owner: r.owner || null
    });
  });
});

/* ---------- 3. users ---------- */
async function seedUsers() {
  for (const u of seed.users) {
    const email = u.email || `${u.username}@${DOMAIN}`;
    const { data: existing } = await db.from('profiles').select('id').eq('username', u.username).maybeSingle();
    if (existing) { console.log(`  · ${u.username} sudah ada, dilewati`); continue; }

    const { data: created, error } = await db.auth.admin.createUser({
      email, password: DEFAULT_PW, email_confirm: true
    });
    if (error) { console.error(`  ! gagal membuat ${u.username}: ${error.message}`); continue; }

    const { error: pErr } = await db.from('profiles').insert({
      id: created.user.id, username: u.username, full_name: u.full_name,
      email, role: u.role, unit: u.unit || null, active: true,
      must_change: true   // seluruh akun seed wajib ganti password saat pertama masuk
    });
    if (pErr) console.error(`  ! profil ${u.username}: ${pErr.message}`);
    else console.log(`  · ${u.username} (${u.role})`);
  }
}

async function main() {
  console.log('SIGMA seed → ' + url);

  console.log(`\n1. indicators (${indicators.length})`);
  for (const part of chunk(indicators, 200)) {
    const { error } = await db.from('indicators').upsert(part, { onConflict: 'id' });
    if (error) throw error;
  }
  console.log('   selesai');

  console.log(`\n2. indicator_years (${yearRows.length})`);
  for (const part of chunk(yearRows, 500)) {
    const { error } = await db.from('indicator_years')
      .upsert(part, { onConflict: 'indicator_id,year', ignoreDuplicates: !FORCE });
    if (error) throw error;
  }
  console.log(FORCE ? '   selesai (menimpa nilai yang ada)' : '   selesai (baris yang sudah ada tidak ditimpa)');

  console.log('\n3. app_config');
  await db.from('app_config').upsert(
    { key: 'meta', value: { vision: seed.meta?.vision || '', mission: seed.meta?.mission || '' } },
    { onConflict: 'key' }
  );
  console.log('   selesai');

  console.log(`\n4. users (${seed.users.length})`);
  await seedUsers();

  /* ---------- ringkasan kesiapan data ---------- */
  const withTarget = yearRows.filter(r => r.target !== null).length;
  const withActual = yearRows.filter(r => [r.q1, r.q2, r.q3, r.q4].some(v => v !== null)).length;
  const ppiActual = yearRows.filter(r =>
    r.indicator_id.startsWith('PPI') && [r.q1, r.q2, r.q3, r.q4].some(v => v !== null)).length;

  console.log('\n--- Kesiapan data ---');
  console.log(`baris tahun          : ${yearRows.length}`);
  console.log(`punya target         : ${withTarget}`);
  console.log(`punya minimal 1 Q    : ${withActual}`);
  console.log(`baris PPI punya Q    : ${ppiActual}`);
  console.log('\nCatatan: kuartal kosong berarti BELUM ADA DATA, bukan nol. File PPI sumber');
  console.log('tidak memuat actual sama sekali, sehingga indikator PPI tampil sebagai No Data');
  console.log('sampai diisi lewat Quarterly Update.');
  console.log(`\nSeluruh akun seed memakai password awal "${DEFAULT_PW}" dan wajib menggantinya saat pertama masuk.`);
}

main().catch(e => { console.error('\nGAGAL:', e.message || e); process.exit(1); });
