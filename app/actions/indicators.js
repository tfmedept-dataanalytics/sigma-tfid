'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const RPI_REGIONS = ['Jawa', 'Sumatera-A', 'Sumatera-B', 'Kalimantan'];
const ACCUM = 'Akumulasi Regional';
const NATIONAL = 'National';

/* Region yang perlu dibuat untuk satu indikator. RPI memerlukan satu baris
   per region plus baris akumulasi — baris akumulasi hanya menyimpan target,
   karena nilai Q1–Q4-nya selalu dihitung dari keempat region. */
const regionsFor = type => (type === 'RPI' ? [...RPI_REGIONS, ACCUM] : [NATIONAL]);

/** Nilai yang diketik pengguna → nilai simpan. Percent: 80 → 0,8. */
function toStored(input, unit) {
  const s = String(input ?? '').trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return String(unit || '').toLowerCase() === 'percent' ? n / 100 : n;
}

const txt = (fd, k) => String(fd.get(k) ?? '').trim() || null;

/** Memastikan pemanggil berhak mengubah struktur indikator. */
async function guard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesi berakhir. Masuk kembali.' };
  const { data: p } = await supabase
    .from('profiles').select('id, username, role, active').eq('id', user.id).single();
  if (!p?.active) return { error: 'Akun tidak aktif.' };
  if (!['sysadmin', 'pmo'].includes(p.role)) {
    return { error: 'Hanya System Administrator dan PMO yang dapat mengubah struktur indikator.' };
  }
  return { supabase, profile: p };
}

async function nextId(supabase, type) {
  const { data } = await supabase
    .from('indicators').select('id').eq('type', type).order('id', { ascending: false }).limit(1);
  const last = data?.[0]?.id || '';
  const m = /(\d+)$/.exec(last);
  return `${type}-${String((m ? Number(m[1]) : 0) + 1).padStart(3, '0')}`;
}

async function audit(supabase, profile, action, object, detail) {
  await supabase.from('audit_log').insert({
    actor: profile.id, actor_username: profile.username, action, object, detail
  });
}

/* =====================================================================
   Tambah indikator — sekaligus membuat baris periode tahun pertamanya
   ===================================================================== */
export async function createIndicator(prevState, formData) {
  const g = await guard();
  if (g.error) return g;
  const { supabase, profile } = g;

  const type = String(formData.get('type') || 'OPI');
  if (!['OPI', 'RPI', 'PPI'].includes(type)) return { error: 'Kerangka tidak dikenali.' };

  const name = txt(formData, 'name');
  if (!name) return { error: 'Nama indikator wajib diisi.' };

  const unit = txt(formData, 'unit') || 'Number';
  const year = Number(formData.get('year'));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: 'Tahun harus berupa empat digit yang wajar.' };
  }

  const id = await nextId(supabase, type);

  const row = {
    id, type, name, unit,
    calc: txt(formData, 'calc'),
    agg: txt(formData, 'agg'),
    t2030: toStored(formData.get('t2030'), unit),
    code: txt(formData, 'code'),
    strategy_map: txt(formData, 'strategy_map'),
    outcome: txt(formData, 'outcome'),
    accountability: txt(formData, 'accountability'),
    program: txt(formData, 'program'),
    details: txt(formData, 'details'),
    toc_foundation: txt(formData, 'toc_foundation'),
    portfolio: txt(formData, 'portfolio'),
    project: txt(formData, 'project'),
    level: txt(formData, 'level'),
    result_statement: txt(formData, 'result_statement'),
    definition: txt(formData, 'definition'),
    mov: txt(formData, 'mov'),
    period: txt(formData, 'period'),
    created_by: profile.id
  };

  const { error } = await supabase.from('indicators').insert(row);
  if (error) return { error: 'Gagal menyimpan indikator: ' + error.message };

  const target = toStored(formData.get('target'), unit);
  const rows = regionsFor(type).map(region => ({
    indicator_id: id, year, region,
    target: (type === 'RPI' ? (region === ACCUM ? target : null) : target),
    q1: null, q2: null, q3: null, q4: null, status: 'draft'
  }));
  const { error: e2 } = await supabase.from('indicator_years').insert(rows);
  if (e2) return { error: 'Indikator tersimpan, tetapi baris periode gagal dibuat: ' + e2.message };

  await audit(supabase, profile, 'Tambah indikator', id, `${type} · ${name.slice(0, 70)} · ${year}`);
  revalidatePath('/', 'layout');
  return { ok: true, message: `Indikator ${id} dibuat untuk tahun ${year}. Isi nilai Q1–Q4 melalui Quarterly Update.` };
}

/* =====================================================================
   Ubah struktur indikator (nilai kuartal tetap lewat Quarterly Update)
   ===================================================================== */
export async function updateIndicator(prevState, formData) {
  const g = await guard();
  if (g.error) return g;
  const { supabase, profile } = g;

  const id = txt(formData, 'id');
  if (!id) return { error: 'Indikator tidak dikenali.' };
  const name = txt(formData, 'name');
  if (!name) return { error: 'Nama indikator wajib diisi.' };
  const unit = txt(formData, 'unit') || 'Number';

  const patch = {
    name, unit,
    calc: txt(formData, 'calc'),
    agg: txt(formData, 'agg'),
    t2030: toStored(formData.get('t2030'), unit),
    code: txt(formData, 'code'),
    strategy_map: txt(formData, 'strategy_map'),
    outcome: txt(formData, 'outcome'),
    accountability: txt(formData, 'accountability'),
    program: txt(formData, 'program'),
    details: txt(formData, 'details'),
    toc_foundation: txt(formData, 'toc_foundation'),
    portfolio: txt(formData, 'portfolio'),
    project: txt(formData, 'project'),
    level: txt(formData, 'level'),
    result_statement: txt(formData, 'result_statement'),
    definition: txt(formData, 'definition'),
    mov: txt(formData, 'mov'),
    period: txt(formData, 'period')
  };

  const { error } = await supabase.from('indicators').update(patch).eq('id', id);
  if (error) return { error: 'Gagal menyimpan: ' + error.message };

  await audit(supabase, profile, 'Ubah indikator', id, name.slice(0, 70));
  revalidatePath('/', 'layout');
  return { ok: true, message: `Indikator ${id} diperbarui.` };
}

/* =====================================================================
   Hapus indikator — beserta seluruh nilai, riwayat, dan evidence-nya
   ===================================================================== */
export async function deleteIndicator(prevState, formData) {
  const g = await guard();
  if (g.error) return g;
  const { supabase, profile } = g;
  if (profile.role !== 'sysadmin') {
    return { error: 'Hanya System Administrator yang dapat menghapus indikator.' };
  }

  const id = txt(formData, 'id');
  if (String(formData.get('confirm') || '').trim().toUpperCase() !== 'HAPUS') {
    return { error: 'Ketik HAPUS pada kotak konfirmasi untuk melanjutkan.' };
  }

  const { error } = await supabase.from('indicators').delete().eq('id', id);
  if (error) return { error: 'Gagal menghapus: ' + error.message };

  await audit(supabase, profile, 'Hapus indikator', id, 'beserta seluruh nilai per tahun');
  revalidatePath('/', 'layout');
  return { ok: true, message: `Indikator ${id} dihapus.` };
}

/* =====================================================================
   Tambah periode tahunan untuk banyak indikator sekaligus
   ===================================================================== */
export async function addPeriod(prevState, formData) {
  const g = await guard();
  if (g.error) return g;
  const { supabase, profile } = g;

  const year = Number(formData.get('year'));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: 'Tahun harus berupa empat digit yang wajar.' };
  }
  const scope = String(formData.get('scope') || 'all');
  const src = String(formData.get('source') || '').trim();
  const copyTarget = src !== '';

  let q = supabase.from('indicators').select('id, type').eq('archived', false);
  if (scope !== 'all') q = q.eq('type', scope);
  const { data: inds, error } = await q;
  if (error) return { error: 'Gagal membaca daftar indikator: ' + error.message };
  if (!inds?.length) return { error: 'Tidak ada indikator pada cakupan itu.' };

  /* Baris yang sudah ada tidak ditimpa — periode berjalan tidak boleh
     terhapus hanya karena tombol ini ditekan dua kali. */
  const { data: existing } = await supabase
    .from('indicator_years').select('indicator_id, region').eq('year', year);
  const has = new Set((existing || []).map(r => `${r.indicator_id}|${r.region}`));

  const srcRows = new Map();
  if (copyTarget) {
    const { data: s } = await supabase
      .from('indicator_years').select('indicator_id, region, target').eq('year', Number(src));
    (s || []).forEach(r => srcRows.set(`${r.indicator_id}|${r.region}`, r.target));
  }

  const rows = [];
  inds.forEach(i => {
    regionsFor(i.type).forEach(region => {
      const key = `${i.id}|${region}`;
      if (has.has(key)) return;
      rows.push({
        indicator_id: i.id, year, region,
        target: copyTarget ? (srcRows.get(key) ?? null) : null,
        q1: null, q2: null, q3: null, q4: null, status: 'draft'
      });
    });
  });

  if (!rows.length) return { ok: true, message: `Seluruh indikator sudah memiliki periode ${year}.` };

  for (let i = 0; i < rows.length; i += 500) {
    const { error: e } = await supabase.from('indicator_years').insert(rows.slice(i, i + 500));
    if (e) return { error: 'Gagal membuat periode: ' + e.message };
  }

  await audit(supabase, profile, 'Tambah periode', String(year),
    `${rows.length} baris · cakupan ${scope}${copyTarget ? ` · target disalin dari ${src}` : ''}`);
  revalidatePath('/', 'layout');
  return { ok: true, message: `${rows.length} baris periode ${year} dibuat.` };
}

/* =====================================================================
   Tambah periode untuk satu indikator
   ===================================================================== */
export async function addPeriodForIndicator(prevState, formData) {
  const g = await guard();
  if (g.error) return g;
  const { supabase, profile } = g;

  const id = txt(formData, 'id');
  const year = Number(formData.get('year'));
  if (!id || !Number.isInteger(year)) return { error: 'Indikator atau tahun tidak dikenali.' };

  const { data: ind } = await supabase.from('indicators').select('id, type, unit').eq('id', id).single();
  if (!ind) return { error: 'Indikator tidak ditemukan.' };

  const { data: existing } = await supabase
    .from('indicator_years').select('region').eq('indicator_id', id).eq('year', year);
  const has = new Set((existing || []).map(r => r.region));
  const target = toStored(formData.get('target'), ind.unit);

  const rows = regionsFor(ind.type)
    .filter(r => !has.has(r))
    .map(region => ({
      indicator_id: id, year, region,
      target: (ind.type === 'RPI' ? (region === ACCUM ? target : null) : target),
      q1: null, q2: null, q3: null, q4: null, status: 'draft'
    }));

  if (!rows.length) return { error: `Indikator ${id} sudah memiliki periode ${year}.` };

  const { error } = await supabase.from('indicator_years').insert(rows);
  if (error) return { error: 'Gagal membuat periode: ' + error.message };

  await audit(supabase, profile, 'Tambah periode indikator', id, String(year));
  revalidatePath('/', 'layout');
  return { ok: true, message: `Periode ${year} dibuat untuk ${id}.` };
}

/* =====================================================================
   Hapus seluruh periode satu tahun
   ===================================================================== */
export async function deletePeriod(prevState, formData) {
  const g = await guard();
  if (g.error) return g;
  const { supabase, profile } = g;
  if (profile.role !== 'sysadmin') {
    return { error: 'Hanya System Administrator yang dapat menghapus periode.' };
  }

  const year = Number(formData.get('year'));
  if (String(formData.get('confirm') || '').trim() !== String(year)) {
    return { error: `Ketik ${year} pada kotak konfirmasi untuk melanjutkan.` };
  }

  const { error } = await supabase.from('indicator_years').delete().eq('year', year);
  if (error) return { error: 'Gagal menghapus periode: ' + error.message };

  await audit(supabase, profile, 'Hapus periode', String(year), 'seluruh indikator dan region');
  revalidatePath('/', 'layout');
  return { ok: true, message: `Periode ${year} dihapus.` };
}
