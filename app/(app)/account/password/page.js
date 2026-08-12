'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { changePassword } from '@/app/auth/actions';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function Btn() {
  const { pending } = useFormStatus();
  return <button className="btn p" type="submit" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan password'}</button>;
}

function Form() {
  const [state, action] = useFormState(changePassword, { error: null });
  const force = useSearchParams().get('force') === '1';
  return (
    <div style={{ maxWidth: 460 }}>
      <div className="page-h">
        <h2>Ganti password</h2>
        <p>{force
          ? 'Password Anda ditetapkan oleh administrator dan harus diganti sebelum melanjutkan.'
          : 'Password diubah langsung pada Supabase Auth; sistem tidak pernah menyimpan atau menampilkan password lama.'}</p>
      </div>
      <div className="card"><div className="card-b">
        <form action={action}>
          <div className="fld"><label>Password baru</label>
            <input name="password" type="password" autoComplete="new-password" required />
            <div className="hint">Minimal 8 karakter.</div></div>
          <div className="fld"><label>Ulangi password baru</label>
            <input name="password2" type="password" autoComplete="new-password" required /></div>
          {state?.error && <div className="note d mb">{state.error}</div>}
          <Btn />
        </form>
      </div></div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="card"><div className="card-b">Memuat…</div></div>}><Form /></Suspense>;
}
