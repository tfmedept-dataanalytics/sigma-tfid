'use client';

import { useEffect } from 'react';
import { APP_VERSION, BUILD_DATE } from '@/lib/version';

/**
 * Menampilkan pesan galat yang sebenarnya.
 *
 * Tanpa ini, Next.js hanya menampilkan "Application error: a client-side
 * exception has occurred" — kalimat yang sama untuk penyebab apa pun,
 * sehingga tidak dapat dipakai mendiagnosis apa-apa.
 */
export default function Error({ error, reset }) {
  useEffect(() => { console.error('[SIGMA] render error:', error); }, [error]);

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 18px' }}>
      <div className="page-h">
        <h2>Halaman gagal dimuat</h2>
        <p>
          Pesan di bawah berasal langsung dari aplikasi. Salin dan kirimkan apa adanya —
          itu yang menunjukkan penyebabnya.
        </p>
      </div>

      <div className="card mb">
        <div className="card-h"><h3>Pesan galat</h3></div>
        <div className="card-b">
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                        fontSize: 12.5, lineHeight: 1.7, color: 'var(--red)' }}>
            {error?.message || String(error)}
          </pre>
          {error?.digest && (
            <div className="t-meta mt">Digest: <span className="code">{error.digest}</span></div>
          )}
          {error?.stack && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12.5 }}>Tampilkan stack trace</summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, marginTop: 8, color: 'var(--muted)' }}>
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>

      <div className="row">
        <button className="btn p" onClick={() => reset()}>Coba lagi</button>
        <a className="btn" href="/dashboard">Kembali ke dashboard</a>
        <a className="btn" href="/setup">Halaman diagnosa</a>
      </div>

      <div className="note w mt">
        Build yang sedang berjalan: <b>v{APP_VERSION} ({BUILD_DATE})</b>. Sertakan nomor ini
        bersama pesan galat di atas.
      </div>
    </div>
  );
}
