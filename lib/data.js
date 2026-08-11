import { createClient } from '@/lib/supabase/server';

/** Daftar tahun yang tersedia pada indicator_years. */
export async function getYears() {
  const supabase = createClient();
  const { data } = await supabase.from('indicator_years').select('year').order('year');
  const set = [...new Set((data || []).map(r => String(r.year)))];
  return set.length ? set : [String(new Date().getFullYear())];
}

/** Indikator + baris tahun tertentu, digabung menjadi satu objek per indikator. */
export async function getIndicators(type, year) {
  const supabase = createClient();
  let qi = supabase.from('indicators')
    .select('id,type,name,code,unit,calc,t2030,strategy_map,outcome,accountability,program,portfolio,project,toc_foundation,level')
    .eq('archived', false)
    .order('id');
  if (type) qi = qi.eq('type', type);

  const [{ data: inds }, { data: yrs }] = await Promise.all([
    qi,
    supabase.from('indicator_years').select('*').eq('year', Number(year))
  ]);

  const byId = new Map((yrs || []).map(r => [r.indicator_id, r]));
  const empty = { target: null, q1: null, q2: null, q3: null, q4: null, status: 'draft' };
  return (inds || []).map(i => ({ ...i, year: byId.get(i.id) || { ...empty } }));
}
