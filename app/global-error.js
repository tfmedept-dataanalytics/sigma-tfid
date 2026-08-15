'use client';

/* Jaring pengaman terakhir: dipakai bila galat terjadi di layout akar,
   di luar jangkauan error boundary per-segmen. */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 32, lineHeight: 1.6 }}>
        <h2 style={{ margin: '0 0 8px' }}>SIGMA gagal dimuat</h2>
        <p style={{ color: '#555', marginTop: 0 }}>
          Pesan di bawah berasal langsung dari aplikasi. Salin dan kirimkan apa adanya.
        </p>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#fdf2f2',
                      border: '1px solid #f3c9c9', padding: 14, borderRadius: 8, color: '#a02020' }}>
          {error?.message || String(error)}
          {error?.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
        <button onClick={() => reset()}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}>
          Coba lagi
        </button>
      </body>
    </html>
  );
}
