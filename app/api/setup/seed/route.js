import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/* Dibaca saat request, bukan di-import saat build.
   Import statis membuat seluruh build gagal bila berkas seed tidak ikut
   ter-commit ke repository — kegagalan yang tidak ada hubungannya dengan
   halaman lain. Dengan dibaca di sini, ketiadaannya hanya memengaruhi
   endpoint ini dan pesannya jelas. */
async function loadSeed() {
  const p = path.join(process.cwd(), 'supabase', 'seed', 'sigma-seed.json');
  return JSON.parse(await readFile(p, 'utf8'));
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Memuat data seed (387 indikator + nilai per tahun) dari browser.
 * Hanya berjalan bila tabel indicators masih kosong, sehingga tidak dapat
 * dipakai menimpa data yang sudah diisi pengguna.
 */
export async function POST() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di Vercel.' }, { status: 400 });
  }

  let admin;
  try { admin = createAdminClient(); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }

  let seed;
  try { seed = await loadSeed(); }
  catch {
    return NextResponse.json({
      error: 'Berkas supabase/seed/sigma-seed.json tidak ditemukan pada server. ' +
             'Muat data lewat SQL Editor memakai seed_1_indicators.sql dan seed_2_values.sql.'
    }, { status: 400 });
  }

  const { count, error: probeErr } = await admin
    .from('indicators').select('id', { count: 'exact', head: true });

  if (probeErr) {
    return NextResponse.json({
      error: 'Tabel indicators belum bisa dibaca: ' + probeErr.message +
             '. Jalankan 0001_schema.sql dan 0002_rls.sql lebih dulu.'
    }, { status: 400 });
  }
  if ((count || 0) > 0) {
    return NextResponse.json({
      error: `Tabel indicators sudah berisi ${count} baris. Pemuatan dilewati agar data yang ada tidak tertimpa.`
    }, { status: 409 });
  }

  /* RPI disimpan terpisah pada berkas seed karena punya dimensi region. */
  const rpiList = seed.rpi || [];

  const indicators = seed.indicators.map(i => ({
    id: i.id, type: i.type, name: i.name, code: i.code || null,
    unit: i.unit || null, calc: i.calc || null, agg: i.agg || null, t2030: i.t2030 ?? null,
    strategy_map: i.strategyMap || null, outcome: i.outcome || null,
    accountability: i.accountability || null, program: i.program || null, details: i.details || null,
    toc_foundation: i.tocFoundation || null, toc_foundation_code: i.tocFoundationCode || null,
    portfolio: i.portfolio || null, portfolio_code: i.portfolioCode || null,
    project: i.project || null, project_code: i.projectCode || null, level: i.level || null,
    result_statement: i.result || null, definition: i.definition || null,
    mov: i.mov || null, period: i.period || null
  }));

  rpiList.forEach(i => indicators.push({
    id: i.id, type: 'RPI', name: i.name, code: null,
    unit: i.unit || null, calc: i.calc || null, agg: null, t2030: i.t2030 ?? null,
    strategy_map: i.strategyMap || null, outcome: i.outcome || null,
    accountability: i.accountability || null, program: i.program || null,
    details: i.details || null, toc_foundation: null, toc_foundation_code: null,
    portfolio: i.portfolio || null, portfolio_code: null, project: null, project_code: null,
    level: null, result_statement: null, definition: null, mov: null, period: null
  }));

  const years = [];
  seed.indicators.forEach(i => {
    Object.entries(i.years || {}).forEach(([y, r]) => {
      years.push({
        indicator_id: i.id, year: Number(y), region: 'National', target: r.target ?? null,
        q1: r.q?.[0] ?? null, q2: r.q?.[1] ?? null, q3: r.q?.[2] ?? null, q4: r.q?.[3] ?? null,
        notes: r.notes || null, key_initiatives: r.init || null, source: r.src || null,
        status: r.status || 'draft'
      });
    });
  });

  rpiList.forEach(i => {
    Object.entries(i.years || {}).forEach(([y, regs]) => {
      Object.entries(regs).forEach(([region, r]) => {
        years.push({
          indicator_id: i.id, year: Number(y), region,
          target: r.target ?? null,
          q1: r.q?.[0] ?? null, q2: r.q?.[1] ?? null, q3: r.q?.[2] ?? null, q4: r.q?.[3] ?? null,
          notes: r.notes || null, key_initiatives: i.init || null, source: i.src || null,
          status: 'draft'
        });
      });
    });
  });

  const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, k) => a.slice(k * n, k * n + n));

  for (const part of chunk(indicators, 200)) {
    const { error } = await admin.from('indicators').upsert(part, { onConflict: 'id' });
    if (error) return NextResponse.json({ error: 'indicators: ' + error.message }, { status: 400 });
  }
  for (const part of chunk(years, 400)) {
    const { error } = await admin.from('indicator_years')
      .upsert(part, { onConflict: 'indicator_id,year,region', ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: 'indicator_years: ' + error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, indicators: indicators.length, years: years.length });
}
