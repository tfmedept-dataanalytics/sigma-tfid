'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Tombol penyiapan awal. Dipakai hanya sekali, saat database belum berisi
 * administrator. Endpoint di baliknya menolak berjalan begitu sudah ada
 * administrator aktif.
 */
export default function SetupActions({ hasAdmin, hasIndicators }) {
  const [busy, setBusy] = useState(null);
  const [cred, setCred] = useState(null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const router = useRouter();

  async function call(what) {
    setBusy(what); setErr(null); setMsg(null);
    try {
      const res = await fetch('/api/setup/' + what, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(json.error || 'Permintaan gagal.'); return; }
      if (what === 'bootstrap') setCred({ username: json.username, password: json.password });
      else setMsg(`${json.indicators} indikator dan ${json.years} baris nilai dimuat.`);
      router.refresh();
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card mb">
      <div className="card-h">
        <h3>Penyiapan awal</h3>
        <div className="sub">
          Hanya berfungsi selama database belum memiliki administrator. Setelah akun pertama
          terbentuk, tombol ini ditolak oleh server.
        </div>
      </div>
      <div className="card-b">
        {err && <div className="note d mb">{err}</div>}
        {msg && <div className="note s mb">{msg}</div>}

        {cred && (
          <div className="note s mb">
            <b>Akun administrator dibuat.</b>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Username: <span className="code">{cred.username}</span><br />
              Password: <span className="code">{cred.password}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              Catat sekarang — password tidak ditampilkan lagi. Anda akan diminta menggantinya
              saat pertama masuk.
            </div>
          </div>
        )}

        <div className="row">
          <button className="btn p" disabled={!!busy || hasAdmin} onClick={() => call('bootstrap')}>
            {busy === 'bootstrap' ? 'Membuat…' : '1. Buat akun administrator'}
          </button>
          <button className="btn" disabled={!!busy || hasIndicators} onClick={() => call('seed')}>
            {busy === 'seed' ? 'Memuat…' : '2. Muat data indikator (387)'}
          </button>
          <a className="btn" href="/login">Ke halaman login</a>
        </div>

        {hasAdmin && (
          <div className="hint mt">
            Administrator sudah ada, jadi tombol pembuatan akun dimatikan. Bila password terlupa,
            pakai <span className="code">npm run create-admin</span> atau
            <span className="code"> supabase/FIX_LOGIN.sql</span>.
          </div>
        )}
      </div>
    </div>
  );
}
