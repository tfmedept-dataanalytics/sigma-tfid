'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const ACCUM = 'Akumulasi Regional';

function toStored(input, unit) {
  const s = String(input ?? '').trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return String(unit || '').toLowerCase() === 'percent' ? n / 100 : n;
}

const txt = (fd, k) => {
  const v = String(fd.get(k) ?? '').trim();
  return v === '' ? null : v;
};

async function who() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesi berakhir. Masuk kembali.' };
  const { data: p } = await supabase
    .from('profiles').select('id, username, role, active').eq('id', user.id).single();
  if (!p?.active) return { error: 'Akun tidak aktif.' };
  return { supabase, profile: p };
}

const CAN_EDIT = ['sysadmin', 'pmo', 'contrib', 'reviewer', 'pm', 'head', 'country'];
const CAN_REVIEW = ['sysadmin', 'pmo', 'reviewer', 'head', 'country'];
const CAN_APPROVE = ['sysadmin', 'pmo', 'country'];

/** Batas kerangka per role — sama dengan yang ditegakkan Row Level Security. */
function scopeOk(role, type) {
  if (role === 'pm') return type === 'PPI';
  if (role === 'head') return type === 'OPI';
  return true;
}

/**
 * Menyimpan satu baris periode: nilai kuartal, target, dan seluruh field
 * naratif, sekaligus menjalankan transisi workflow.
 *
 * action: 'draft' | 'submit' | 'review' | 'approve' | 'return'
 */
export async function saveQuarterly(prevState, formData) {
  const w = await who();
  if (w.error) return w;
  const { supabase, profile } = w;

  const id = txt(formData, 'indicator_id');
  const year = Number(formData.get('year'));
  const region = String(formData.get('region') || 'National');
  const act = String(formData.get('act') || 'draft');
  if (!id || !Number.isInteger(year)) return { error: 'Indikator atau tahun tidak dikenali.' };

  const { data: ind } = await supabase
    .from('indicators').select('id, type, unit, name').eq('id', id).single();
  if (!ind) return { error: 'Indikator tidak ditemukan.' };
  if (!scopeOk(profile.role, ind.type)) {
    return { error: `Role Anda tidak memiliki hak input pada kerangka ${ind.type}.` };
  }
  if (ind.type === 'RPI' && region === ACCUM) {
    return { error: 'Akumulasi Regional dihitung dari keempat region dan tidak dapat diinput langsung. Ubah nilainya pada region yang bersangkutan.' };
  }

  const { data: cur } = await supabase
    .from('indicator_years').select('*')
    .eq('indicator_id', id).eq('year', year).eq('region', region).maybeSingle();

  const payload = {
    indicator_id: id, year, region,
    target: toStored(formData.get('target'), ind.unit),
    q1: toStored(formData.get('q1'), ind.unit),
    q2: toStored(formData.get('q2'), ind.unit),
    q3: toStored(formData.get('q3'), ind.unit),
    q4: toStored(formData.get('q4'), ind.unit),
    commentary: txt(formData, 'commentary'),
    achievement: txt(formData, 'achievement'),
    challenge: txt(formData, 'challenge'),
    action: txt(formData, 'action'),
    notes: txt(formData, 'notes'),
    owner: cur?.owner ?? profile.username
  };

  /* Transisi status. Aturan hak akses sama dengan matriks role. */
  const prev = cur?.status || 'draft';
  let status = prev;
  if (act === 'draft') {
    /* Nilai yang berubah menurunkan Approved ke Draft — ditegakkan juga oleh
       trigger database, jadi ini hanya menyelaraskan tampilan. */
    status = prev === 'approved' ? 'draft' : prev;
  } else if (act === 'submit') {
    if (!CAN_EDIT.includes(profile.role)) return { error: 'Role Anda tidak dapat mengirim data untuk direview.' };
    const anyQ = ['q1', 'q2', 'q3', 'q4'].some(k => payload[k] !== null);
    if (!anyQ) return { error: 'Isi minimal satu nilai kuartal sebelum submit.' };
    status = 'submitted';
  } else if (act === 'review') {
    if (!CAN_REVIEW.includes(profile.role)) return { error: 'Role Anda tidak dapat memulai review.' };
    status = 'review';
  } else if (act === 'approve') {
    if (!CAN_APPROVE.includes(profile.role)) return { error: 'Role Anda tidak dapat menyetujui data.' };
    status = 'approved';
  } else if (act === 'return') {
    if (!CAN_REVIEW.includes(profile.role)) return { error: 'Role Anda tidak dapat mengembalikan data.' };
    const reason = txt(formData, 'return_reason');
    if (!reason) return { error: 'Alasan pengembalian wajib diisi agar pemilik indikator tahu apa yang harus diperbaiki.' };
    payload.return_reason = reason;
    status = 'returned';
  }
  payload.status = status;

  const { error } = await supabase
    .from('indicator_years').upsert(payload, { onConflict: 'indicator_id,year,region' });
  if (error) return { error: 'Gagal menyimpan: ' + error.message };

  const LBL = { draft: 'Simpan draft', submit: 'Submit for review', review: 'Mulai review',
                approve: 'Approve', return: 'Kembalikan untuk revisi' };
  await supabase.from('audit_log').insert({
    actor: profile.id, actor_username: profile.username,
    action: LBL[act] || 'Simpan', object: `${id} · ${year} · ${region}`,
    detail: `${prev} → ${status}`
  });

  revalidatePath('/', 'layout');
  const MSG = {
    draft: 'Draft tersimpan.',
    submit: 'Data dikirim untuk direview.',
    review: 'Data masuk proses review.',
    approve: 'Data disetujui dan menjadi data resmi.',
    return: 'Data dikembalikan ke pemilik indikator.'
  };
  return { ok: true, message: MSG[act] || 'Tersimpan.' };
}

/** Mencatat metadata evidence. Berkasnya sendiri disimpan di luar sistem. */
export async function addEvidence(prevState, formData) {
  const w = await who();
  if (w.error) return w;
  const { supabase, profile } = w;

  const id = txt(formData, 'indicator_id');
  const year = Number(formData.get('year'));
  const region = String(formData.get('region') || 'National');
  const file_name = txt(formData, 'file_name');
  if (!id || !Number.isInteger(year) || !file_name) {
    return { error: 'Nama dokumen wajib diisi.' };
  }

  const { error } = await supabase.from('evidence').insert({
    indicator_id: id, year, region, file_name,
    storage_path: txt(formData, 'storage_path'),
    note: txt(formData, 'note'),
    uploaded_by: profile.id
  });
  if (error) return { error: 'Gagal mencatat evidence: ' + error.message };

  await supabase.from('audit_log').insert({
    actor: profile.id, actor_username: profile.username,
    action: 'Tambah evidence', object: `${id} · ${year} · ${region}`, detail: file_name
  });

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Evidence dicatat.' };
}
