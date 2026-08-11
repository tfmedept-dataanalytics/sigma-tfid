export const dynamic = 'force-dynamic';

/**
 * Halaman diagnosis konfigurasi. Tampil ketika variabel environment Supabase
 * belum terbaca oleh aplikasi. Tidak menampilkan nilai kunci apa pun —
 * hanya apakah terbaca atau tidak.
 */
export default function SetupPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const urlOk = /^https?:\/\/.+\.supabase\.co/.test(url);
  const keyOk = key.length > 20;

  const row = (name, ok, note) => (
    <tr key={name}>
      <td><span className="code">{name}</span></td>
      <td className="ctr">
        <span className={'bdg ' + (ok ? 'b-ok' : 'b-rd')}>{ok ? 'Terbaca' : 'Tidak terbaca'}</span>
      </td>
      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{note}</td>
    </tr>
  );

  return (
    <div style={{ maxWidth: 780, margin: '48px auto', padding: '0 20px' }}>
      <div className="page-h">
        <h2>Konfigurasi belum lengkap</h2>
        <p>
          SIGMA tidak dapat menghubungi Supabase karena variabel environment belum terbaca saat
          aplikasi dijalankan. Halaman ini muncul menggantikan error 500 agar penyebabnya terlihat.
        </p>
      </div>

      <div className="card mb"><div className="tbl-w"><table>
        <thead><tr><th>Variabel</th><th className="ctr">Status</th><th>Keterangan</th></tr></thead>
        <tbody>
          {row('NEXT_PUBLIC_SUPABASE_URL', urlOk,
            urlOk ? 'Format URL Supabase valid.' : 'Harus berupa https://xxxx.supabase.co')}
          {row('NEXT_PUBLIC_SUPABASE_ANON_KEY', keyOk,
            keyOk ? 'Terbaca.' : 'Kunci anon publik dari Project Settings → API.')}
        </tbody>
      </table></div></div>

      <div className="note w mb">
        <b>Penyebab paling sering.</b> Variabel berawalan <span className="code">NEXT_PUBLIC_</span> dibaca
        pada saat <i>build</i>, bukan saat request. Menambahkannya di Vercel setelah deployment berjalan
        tidak berpengaruh sampai project di-<b>Redeploy</b>. Pastikan juga variabel dicentang untuk
        environment <b>Production</b>, bukan hanya Preview atau Development.
      </div>

      <div className="card"><div className="card-b">
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.9 }}>
          <li>Vercel → project → <b>Settings → Environment Variables</b>.</li>
          <li>Tambahkan <span className="code">NEXT_PUBLIC_SUPABASE_URL</span>,{' '}
              <span className="code">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>, dan{' '}
              <span className="code">SUPABASE_SERVICE_ROLE_KEY</span>; centang Production, Preview, dan Development.</li>
          <li>Buka tab <b>Deployments</b> → deployment terakhir → menu <b>⋯</b> → <b>Redeploy</b>.</li>
          <li>Pastikan kedua file migrasi SQL sudah dijalankan di Supabase, lalu jalankan{' '}
              <span className="code">npm run seed</span> dari komputer Anda.</li>
        </ol>
      </div></div>
    </div>
  );
}
