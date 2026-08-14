import { createClient } from '@/lib/supabase/server';
import SetupActions from '@/components/SetupActions';
import { BUILD, FEATURES } from '@/lib/version';

export const dynamic = 'force-dynamic';

/** Bandingkan dua nomor versi bergaya semver. */
function cmp(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

/**
 * Halaman diagnosis konfigurasi. Tampil ketika variabel environment Supabase
 * belum terbaca oleh aplikasi. Tidak menampilkan nilai kunci apa pun —
 * hanya apakah terbaca atau tidak.
 */
export default async function SetupPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const urlOk = /^https?:\/\/.+\.supabase\.co/.test(url);
  const keyOk = key.length > 20;
  const ref = (url.match(/https?:\/\/([^.]+)\.supabase\.co/) || [])[1] || '—';

  /* Diagnosa isi database, dibaca dari project yang benar-benar dipakai
     aplikasi ini. Membutuhkan migrasi 0006_setup_status.sql. */
  let status = null, statusErr = null;
  if (urlOk && keyOk) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('setup_status');
      if (error) statusErr = error.message; else status = data;
    } catch (e) { statusErr = e?.message || String(e); }
  }

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
      <div className="card mb">
        <div className="card-h">
          <h3>Versi aplikasi yang sedang berjalan</h3>
          <div className="sub">
            Bandingkan dengan versi pada berkas yang Anda push. Bila berbeda, build di Vercel belum
            memuat perubahan terakhir — periksa Deployments, lalu Redeploy.
          </div>
        </div>
        <div className="card-b">
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>
            v{BUILD.version}
          </div>
          <div className="t-meta">Build {BUILD.date}</div>
          <div className="tbl-w mt"><table>
            <thead><tr><th>Fitur</th><th className="ctr">Ada sejak</th><th className="ctr">Status</th></tr></thead>
            <tbody>
              {FEATURES.map(([f, v]) => {
                const ok = cmp(BUILD.version, v) >= 0;
                return (
                  <tr key={f}>
                    <td style={{ fontSize: 12.5 }}>{f}</td>
                    <td className="ctr"><span className="code">v{v}</span></td>
                    <td className="ctr">
                      <span className={'bdg ' + (ok ? 'b-ok' : 'b-rd')}>{ok ? 'tersedia' : 'belum'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      </div>

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

      {urlOk && keyOk && (
        <SetupActions
          hasAdmin={!!(status && status.admin_ada)}
          hasIndicators={!!(status && status.indikator > 0)}
        />
      )}

      <div className="card mb">
        <div className="card-h">
          <h3>Isi database pada project yang dipakai aplikasi ini</h3>
          <div className="sub">
            Project ref: <span className="code">{ref}</span> — bandingkan dengan ref pada URL
            dashboard Supabase tempat Anda menjalankan SQL. Bila berbeda, SQL Anda masuk ke
            database yang tidak dibaca aplikasi ini.
          </div>
        </div>
        <div className="card-b">
          {status ? (
            <div className="tbl-w"><table>
              <thead><tr><th>Pemeriksaan</th><th className="num">Hasil</th><th>Harusnya</th></tr></thead>
              <tbody>
                <tr><td>Akun total</td><td className="num">{status.akun_total}</td><td>≥ 1</td></tr>
                <tr><td>Akun aktif</td><td className="num">{status.akun_aktif}</td><td>≥ 1</td></tr>
                <tr><td>Akun <span className="code">admin</span> aktif</td>
                    <td className="num">
                      <span className={'bdg ' + (status.admin_ada ? 'b-ok' : 'b-rd')}>
                        {status.admin_ada ? 'ada' : 'tidak ada'}
                      </span>
                    </td><td>ada</td></tr>
                <tr><td>Fungsi <span className="code">email_for_username</span></td>
                    <td className="num">
                      <span className={'bdg ' + (status.fungsi_login_ada ? 'b-ok' : 'b-rd')}>
                        {status.fungsi_login_ada ? 'ada' : 'tidak ada'}
                      </span>
                    </td><td>ada</td></tr>
                <tr><td>Indikator</td><td className="num">{status.indikator}</td><td>387</td></tr>
                <tr><td>Baris nilai per tahun</td><td className="num">{status.baris_tahun}</td><td>461</td></tr>
              </tbody>
            </table></div>
          ) : (
            <div className="note w" style={{ margin: 0 }}>
              <b>Belum dapat membaca isi database.</b>{' '}
              {statusErr
                ? <>Pesan dari Supabase: <span className="code">{statusErr}</span>.{' '}
                   Bila pesannya menyebut <span className="code">setup_status</span> tidak ditemukan,
                   jalankan <span className="code">supabase/migrations/0006_setup_status.sql</span>.</>
                : 'Lengkapi dulu kedua variabel di atas.'}
            </div>
          )}
        </div>
      </div>

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
