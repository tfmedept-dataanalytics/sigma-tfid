-- =====================================================================
-- SIGMA — Migration 0002 — Row Level Security
-- Model akses: User → Role → Unit/Portfolio → Indicator
-- Catatan: pembatasan per portfolio disiapkan lewat kolom profiles.unit;
-- kebijakan di bawah membatasi pada tingkat role dan kerangka (OPI/PPI).
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.indicators        enable row level security;
alter table public.indicator_years   enable row level security;
alter table public.indicator_history enable row level security;
alter table public.evidence          enable row level security;
alter table public.audit_log         enable row level security;
alter table public.notifications     enable row level security;
alter table public.app_config        enable row level security;

-- ---------- profiles ----------
drop policy if exists p_profiles_self on public.profiles;
create policy p_profiles_self on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_role() in ('sysadmin','pmo'));

drop policy if exists p_profiles_admin_write on public.profiles;
create policy p_profiles_admin_write on public.profiles
  for all to authenticated
  using (public.current_role() = 'sysadmin')
  with check (public.current_role() = 'sysadmin');

-- Pengguna boleh menghapus tanda must_change atas dirinya sendiri
drop policy if exists p_profiles_self_update on public.profiles;
create policy p_profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- indicators ----------
-- Seluruh pengguna aktif boleh membaca struktur indikator.
drop policy if exists p_ind_read on public.indicators;
create policy p_ind_read on public.indicators
  for select to authenticated using (public.is_active());

-- Hanya sysadmin dan PMO yang boleh mengubah struktur.
drop policy if exists p_ind_write on public.indicators;
create policy p_ind_write on public.indicators
  for all to authenticated
  using (public.current_role() in ('sysadmin','pmo'))
  with check (public.current_role() in ('sysadmin','pmo'));

-- ---------- indicator_years ----------
drop policy if exists p_iy_read on public.indicator_years;
create policy p_iy_read on public.indicator_years
  for select to authenticated using (public.is_active());

-- Insert baris tahun: sysadmin & PMO.
drop policy if exists p_iy_insert on public.indicator_years;
create policy p_iy_insert on public.indicator_years
  for insert to authenticated
  with check (public.current_role() in ('sysadmin','pmo'));

-- Update nilai: kontributor dan pengelola. Program Manager dibatasi ke PPI,
-- Head of Program ke OPI — sesuai scope yang tertulis pada matriks role.
drop policy if exists p_iy_update on public.indicator_years;
create policy p_iy_update on public.indicator_years
  for update to authenticated
  using (
    public.is_active() and (
      public.current_role() in ('sysadmin','pmo','contrib','reviewer')
      or (public.current_role() = 'pm'
          and exists (select 1 from public.indicators i
                      where i.id = indicator_id and i.type = 'PPI'))
      or (public.current_role() = 'head'
          and exists (select 1 from public.indicators i
                      where i.id = indicator_id and i.type = 'OPI'))
    )
  )
  with check (public.is_active());

drop policy if exists p_iy_delete on public.indicator_years;
create policy p_iy_delete on public.indicator_years
  for delete to authenticated
  using (public.current_role() = 'sysadmin');

-- ---------- history, evidence ----------
drop policy if exists p_hist_read on public.indicator_history;
create policy p_hist_read on public.indicator_history
  for select to authenticated using (public.is_active());

drop policy if exists p_hist_insert on public.indicator_history;
create policy p_hist_insert on public.indicator_history
  for insert to authenticated with check (public.is_active());

drop policy if exists p_ev_read on public.evidence;
create policy p_ev_read on public.evidence
  for select to authenticated using (public.is_active());

drop policy if exists p_ev_write on public.evidence;
create policy p_ev_write on public.evidence
  for all to authenticated
  using (public.is_active()) with check (public.is_active());

-- ---------- audit ----------
-- Semua pengguna aktif menulis jejak; hanya sysadmin/PMO yang membacanya.
drop policy if exists p_audit_insert on public.audit_log;
create policy p_audit_insert on public.audit_log
  for insert to authenticated with check (public.is_active());

drop policy if exists p_audit_read on public.audit_log;
create policy p_audit_read on public.audit_log
  for select to authenticated
  using (public.current_role() in ('sysadmin','pmo','country'));

-- Jejak audit tidak boleh diubah atau dihapus oleh siapa pun lewat API.
-- (Tidak ada policy update/delete: seluruh percobaan ditolak RLS.)

-- ---------- notifications ----------
drop policy if exists p_notif_read on public.notifications;
create policy p_notif_read on public.notifications
  for select to authenticated
  using (recipient = auth.uid() or role_target = public.current_role());

drop policy if exists p_notif_write on public.notifications;
create policy p_notif_write on public.notifications
  for all to authenticated
  using (public.is_active()) with check (public.is_active());

-- ---------- config ----------
drop policy if exists p_cfg_read on public.app_config;
create policy p_cfg_read on public.app_config
  for select to authenticated using (public.is_active());

drop policy if exists p_cfg_write on public.app_config;
create policy p_cfg_write on public.app_config
  for all to authenticated
  using (public.current_role() = 'sysadmin')
  with check (public.current_role() = 'sysadmin');
