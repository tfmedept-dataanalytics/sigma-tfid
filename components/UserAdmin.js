'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/calc';
import Translate from '@/components/Translate';

const EMPTY = { full_name: '', username: '', email: '', unit: '', role: 'contrib', password: '', must_change: true };

export default function UserAdmin({ users, meId }) {
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const router = useRouter();

  const activeAdmins = users.filter(u => u.active && u.role === 'sysadmin').length;

  async function call(method, body) {
    setBusy(true); setMsg(null);
    const res = await fetch('/api/admin/users', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg({ err: json.error || 'Permintaan gagal.' }); return false; }
    router.refresh();
    return true;
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const suggest = name => name.trim().toLowerCase().split(/\s+/).filter(Boolean)
    .map((w, i) => (i === 0 ? w[0] : w)).join('.').replace(/[^a-z0-9.]/g, '');

  return (
    <Translate>
      <div className="page-h">
        <h2>User Management</h2>
        <p>Pendaftaran akun dan penetapan role. Hanya System Administrator yang dapat membuat akun;
           pengguna tidak dapat mendaftar sendiri dari halaman login.</p>
      </div>

      <div className="row mb">
        <button className="btn p sm" onClick={() => { setForm(EMPTY); setOpen(o => !o); }}>
          {open ? 'Tutup formulir' : '+ Tambah pengguna'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{activeAdmins} administrator aktif</span>
      </div>

      {msg?.err && <div className="note d mb">{msg.err}</div>}

      {open && (
        <div className="card mb"><div className="card-b">
          <div className="grid g2">
            <div className="fld"><label>Nama lengkap *</label>
              <input value={form.full_name}
                     onChange={e => { set('full_name', e.target.value); if (!form.username) set('username', suggest(e.target.value)); }} /></div>
            <div className="fld"><label>Username *</label>
              <input value={form.username} autoCapitalize="none"
                     onChange={e => set('username', e.target.value.toLowerCase())} />
              <div className="hint">Huruf kecil, angka, dan titik. Dipakai di layar login.</div></div>
          </div>
          <div className="grid g2">
            <div className="fld"><label>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              <div className="hint">Kosongkan untuk memakai alias internal username@sigma.local.</div></div>
            <div className="fld"><label>Unit / Portfolio</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} /></div>
          </div>
          <div className="fld"><label>Role *</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}>
              {Object.keys(ROLES).map(k => <option key={k} value={k}>{ROLES[k].n}</option>)}
            </select>
            <div className="hint">{ROLES[form.role]?.scope}</div></div>
          <div className="fld"><label>Password awal *</label>
            <input value={form.password} onChange={e => set('password', e.target.value)} />
            <div className="hint">Minimal 8 karakter. Sampaikan ke pengguna melalui kanal terpisah.</div></div>
          <label className="row" style={{ gap: 7, fontSize: 12.5 }}>
            <input type="checkbox" checked={form.must_change} onChange={e => set('must_change', e.target.checked)} />
            Wajib ganti password saat pertama masuk
          </label>
          <div className="mt">
            <button className="btn p" disabled={busy}
              onClick={async () => { if (await call('POST', form)) { setForm(EMPTY); setOpen(false); } }}>
              {busy ? 'Menyimpan…' : 'Simpan akun'}
            </button>
          </div>
        </div></div>
      )}

      <div className="card"><div className="tbl-w"><table>
        <thead><tr>
          <th>Username</th><th>Nama</th><th>Email</th><th style={{ minWidth: 190 }}>Role</th>
          <th>Unit</th><th className="ctr">Status</th><th>Terakhir masuk</th><th className="ctr">Aksi</th>
        </tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={u.active ? undefined : { opacity: 0.55 }}>
              <td><span className="code">{u.username}</span>{u.id === meId && <span className="bdg b-ok"> Anda</span>}</td>
              <td className="t-name">{u.full_name}</td>
              <td style={{ fontSize: 11.8, color: 'var(--muted)' }}>{u.email || '—'}</td>
              <td>
                <select className="sel-sm" value={u.role} disabled={busy}
                        onChange={e => call('PATCH', { id: u.id, role: e.target.value })}>
                  {Object.keys(ROLES).map(k => <option key={k} value={k}>{ROLES[k].n}</option>)}
                </select>
                {u.must_change && <div className="t-meta">wajib ganti password</div>}
              </td>
              <td>{u.unit || '—'}</td>
              <td className="ctr"><span className={'bdg ' + (u.active ? 'b-ok' : 'b-gy')}>{u.active ? 'Aktif' : 'Nonaktif'}</span></td>
              <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                {u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : 'belum pernah'}
              </td>
              <td className="ctr">
                <button className="btn-i" title="Reset password" disabled={busy}
                  onClick={() => {
                    const pw = prompt('Password baru untuk ' + u.username + ' (minimal 8 karakter):');
                    if (pw) call('PATCH', { id: u.id, password: pw, must_change: true });
                  }}>🔑</button>{' '}
                <button className="btn-i" title={u.active ? 'Nonaktifkan' : 'Aktifkan'} disabled={busy}
                  onClick={() => call('PATCH', { id: u.id, active: !u.active })}>{u.active ? '⏻' : '✓'}</button>{' '}
                <button className="btn-i" title="Hapus" disabled={busy}
                  onClick={() => { if (confirm('Hapus akun ' + u.username + '? Jejak audit atas namanya tetap tersimpan.')) call('DELETE', { id: u.id }); }}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      <div className="note i mt">
        Sistem menolak penghapusan, penonaktifan, atau penurunan role apabila tindakan itu menyisakan nol
        System Administrator aktif. Pemeriksaan ini berjalan di server (route handler dengan service role),
        bukan hanya di layar ini.
      </div>
    </Translate>
  );
}
