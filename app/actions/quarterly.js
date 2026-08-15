'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const ACCUM = 'Akumulasi Regional';

/** Nilai yang diketik pengguna → nilai simpan. Percent: 80 → 0,8. */
function toStored(input, unit) {
  const s = String(input ?? '').trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return String(unit || '').toLowerCase() === 'percent' ? n / 100 : n;
}

const txt = (fd, k) => String(fd.get(k) ?? '').trim() || null;

async function session() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesi berakhir. Masuk kembali.' };
  const { data: p } = await supabase
    .from('profiles').select('id, username, role, active').eq('id', user.id).single();
  if (!p?.active) return { error: 'Akun tidak aktif.' };
  return { supabase, profile: p };
}

async function audit(supabase, profile, action, object, detail) {
  await supabase.from('audit_log').insert({
    actor: profile.id, actor_username: profile.username, action, object, detail
  });
}

/** Baris tahun+region yang sedang disunting, beserta unit indikatornya. */
async function context(supabase, id, year, region) {
  const { data: ind } = await supabase
    .from('indicators').select('id, type, unit, name').eq('id', id).single();
  if (!ind) return { error: 'Indikator tidak ditemukan.' };
  const reg = ind.type === 'RPI' ? (region || ACCUM) : 'National';
  return { ind, region: reg };
}

/* =====================================================================
   Simpan nilai kuartal dan commentary
   ===================================================================== */
export async function saveQuarterly(prevState, formData) {
  const s = await session();
  if (s.error) return s;
  const { supabase, profile } = s;

  const id = txt(formData, 'id');
  const year = Number(formData.get('year'));
  const c = await context(supabase, id, year, txt(formData, 'region'));
  if (c.error) return c;
  const { ind, region } = c;

  if (ind.type === 'RPI' && region === ACCUM) {
    return { error: 'Baris Akumulasi Regional dihitung dari keempat region dan tidak dapat diisi langsung. Perbaiki nilai pada region yang bersangkutan.' };
  }

  const patch = {
    target: toStored(formData.get('target'), ind.unit),
    q1: toStored(formData.get('q1'), ind.unit),
    q2: toStored(formData.get('q2'), ind.unit),
    q3: toStored(formData.get('q3'), ind.unit),
    q4: toStored(formData.get('q4'), ind.unit),
    commentary: txt(formData, 'commentary'),
    achievement: txt(formData, 'achievement'),
    challenge: txt(formData, 'challenge'),
    action: txt(formData, 'action'),
    owner: txt(formData, 'owner'),
    notes: txt(formData, 'notes'),
    key_initiatives: txt(formData, 'key_initiatives'),
    source: txt(formData, 'source')
  };

  /* Baris region mungkin belum ada — upsert agar region yang belum pernah
     diisi tetap dapat dibuat tanpa langkah terpisah. */
  const { error } = await supabase.from('indicator_years').upsert(
    { indicator_id: id, year, region, status: 'draft', ...patch },
    { onConflict: 'indicator_id,year,region' }
  );
  if (error) return { error: 'Gagal menyimpan: ' + error.message };

  await audit(supabase, profile, 'Simpan draft', id, `${region} · ${year}`);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Draft tersimpan.' };
}

/* =====================================================================
   Perubahan status workflow
   ===================================================================== */
const FLOW = {
  submit:  { to: 'submitted', label: 'Submit for review', caps: ['sysadmin', 'pmo', 'pm', 'head', 'contrib'] },
  review:  { to: 'review',    label: 'Mulai review',      caps: ['sysadmin', 'pmo', 'reviewer', 'head', 'country'] },
  approve: { to: 'approved',  label: 'Approve',           caps: ['sysadmin', 'pmo', 'country'] },
  return:  { to: 'returned',  label: 'Kembalikan',        caps: ['sysadmin', 'pmo', 'reviewer', 'head', 'country'] }
};

export async function changeStatus(prevState, formData) {
  const s = await session();
  if (s.error) return s;
  const { supabase, profile } = s;

  const move = String(formData.get('move') || '');
  const step = FLOW[move];
  if (!step) return { error: 'Perpindahan status tidak dikenali.' };
  if (!step.caps.includes(profile.role)) {
    return { error: `Role Anda tidak berwenang melakukan "${step.label}".` };
  }

  const id = txt(formData, 'id');
  const year = Number(formData.get('year'));
  const c = await context(supabase, id, year, txt(formData, 'region'));
  if (c.error) return c;
  const { ind, region } = c;

  const { data: row } = await supabase.from('indicator_years')
    .select('q1,q2,q3,q4,target,status').eq('indicator_id', id).eq('year', year).eq('region', region).single();
  if (!row) return { error: 'Baris periode belum ada. Simpan draft terlebih dahulu.' };

  if (move === 'submit') {
    const filled = [row.q1, row.q2, row.q3, row.q4].some(v => v !== null && v !== undefined);
    if (!filled) return { error: 'Minimal satu nilai kuartal harus diisi sebelum submit.' };
  }

  const reason = txt(formData, 'reason');
  if (move === 'return' && !reason) {
    return { error: 'Alasan pengembalian wajib diisi agar pemilik indikator tahu apa yang perlu diperbaiki.' };
  }

  const patch = { status: step.to };
  if (move === 'return') patch.return_reason = reason;

  const { error } = await supabase.from('indicator_years').update(patch)
    .eq('indicator_id', id).eq('year', year).eq('region', region);
  if (error) return { error: 'Gagal mengubah status: ' + error.message };

  await audit(supabase, profile, step.label, id, `${region} · ${year}${reason ? ' · ' + reason.slice(0, 90) : ''}`);
  await supabase.from('notifications').insert({
    role_target: move === 'submit' ? 'reviewer' : null,
    message: `${ind.name.slice(0, 60)} — ${step.label} (${region} ${year})`
  });

  revalidatePath('/', 'layout');
  return { ok: true, message: `Status menjadi ${step.to}.` };
}

/* =====================================================================
   Evidence — metadata saja; berkasnya disimpan di luar sistem
   ===================================================================== */
export async function addEvidence(prevState, formData) {
  const s = await session();
  if (s.error) return s;
  const { supabase, profile } = s;

  const id = txt(formData, 'id');
  const year = Number(formData.get('year'));
  const file_name = txt(formData, 'file_name');
  if (!file_name) return { error: 'Nama dokumen wajib diisi.' };

  const c = await context(supabase, id, year, txt(formData, 'region'));
  if (c.error) return c;

  const { error } = await supabase.from('evidence').insert({
    indicator_id: id, year, region: c.region,
    file_name, storage_path: txt(formData, 'storage_path'), note: txt(formData, 'note'),
    uploaded_by: profile.id
  });
  if (error) return { error: 'Gagal menyimpan evidence: ' + error.message };

  await audit(supabase, profile, 'Tambah evidence', id, file_name.slice(0, 80));
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Evidence dicatat.' };
}

export async function deleteEvidence(prevState, formData) {
  const s = await session();
  if (s.error) return s;
  const { supabase, profile } = s;

  const evId = Number(formData.get('evidence_id'));
  const { error } = await supabase.from('evidence').delete().eq('id', evId);
  if (error) return { error: 'Gagal menghapus evidence: ' + error.message };

  await audit(supabase, profile, 'Hapus evidence', String(evId), '');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Evidence dihapus.' };
}
