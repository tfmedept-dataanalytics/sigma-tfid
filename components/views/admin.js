'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, BarList, groupBy, statSummary,
         achievement, fmt, pct, useState, useMemo } from './common';
import { ROLES, CAPS } from '@/lib/calc';

export function AdRoles() {
  const caps = [['edit', 'Input / ubah data'], ['submit', 'Submit'], ['review', 'Review'],
                ['approve', 'Approve'], ['manage', 'Kelola indikator & tahun'],
                ['admin', 'Administrasi sistem'], ['config', 'Konfigurasi']];
  return (
    <>
      <PageHead title="Role & Permission">
        Matriks hak akses. Model akses mengikuti pola User → Role → Organization/Unit →
        Program/Portfolio → Indicator, sehingga hak tidak hanya ditentukan jabatan tetapi juga area
        tanggung jawab.
      </PageHead>
      <Card className="mb">
        <div className="tbl-w"><table>
          <thead><tr><th style={{ minWidth: 180 }}>Role</th>
            {caps.map(c => <th key={c[0]} className="ctr" style={{ fontSize: 10.5 }}>{c[1]}</th>)}</tr></thead>
          <tbody>
            {Object.keys(ROLES).map(k => (
              <tr key={k}>
                <td><div className="t-name">{ROLES[k].n}</div>
                  <div className="t-meta">{ROLES[k].scope}</div></td>
                {caps.map(c => (
                  <td key={c[0]} className="ctr">
                    {CAPS[k]?.[c[0]] ? <Badge cls="b-ok">✓</Badge> : <span style={{ color: 'var(--faint)' }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
      <Note kind="w">
        Pembatasan ini ditegakkan <b>dua lapis</b>: di antarmuka dan oleh Row Level Security di database.
        Lapis kedua yang menentukan — menyembunyikan tombol saja bukan kontrol akses. Pembatasan per
        portfolio untuk Program Manager memerlukan kebijakan RLS tambahan yang membandingkan
        <span className="code"> profiles.unit</span> dengan <span className="code">indicators.portfolio</span>.
      </Note>
    </>
  );
}

export function AdOrg({ rows, year }) {
  const units = groupBy(rows.filter(r => r.accountability), 'accountability', year);
  return (
    <>
      <PageHead title="Organization / Unit">
        Unit akuntabilitas yang tercatat pada data OPI beserta jumlah KPI dan capaian tahun berjalan.
      </PageHead>
      <Card>
        <div className="tbl-w"><table>
          <thead><tr><th>Unit / Accountability</th><th className="num">Jumlah KPI</th>
            <th className="num">Ber-capaian</th><th className="num">Rata-rata capaian</th></tr></thead>
          <tbody>
            {units.map(u => (
              <tr key={u.key}>
                <td className="t-name">{u.key}</td>
                <td className="num">{u.n}</td>
                <td className="num">{u.withA}</td>
                <td className="num">{pct(u.score)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
      <Note kind="w">
        Daftar ini diturunkan dari kolom Accountability pada data sumber, bukan dari master data unit
        tersendiri. Perubahan ejaan pada file sumber akan memunculkan unit baru di sini.
      </Note>
    </>
  );
}

export function AdProgram({ rows, year }) {
  const ppi = rows.filter(r => r.type === 'PPI');
  const portfolios = groupBy(ppi, 'portfolio', year);
  return (
    <>
      <PageHead title="Program / Portfolio">Struktur portfolio dan project pada kerangka PPI.</PageHead>
      <div className="grid g2">
        {portfolios.map(p => (
          <Card key={p.key} title={p.key} sub={`${p.n} indikator · rata-rata ${pct(p.score)}`}>
            <div className="tbl-w"><table>
              <thead><tr><th>Project</th><th className="num">Indikator</th><th className="num">Capaian</th></tr></thead>
              <tbody>
                {groupBy(p.list, 'project', year).map(pr => (
                  <tr key={pr.key}>
                    <td className="t-name" style={{ fontSize: 12 }}>{pr.key}</td>
                    <td className="num">{pr.n}</td>
                    <td className="num">{pct(pr.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function AdMasterData({ rows }) {
  const fields = [
    ['unit', 'Unit'], ['calc', 'Calculation type'], ['level', 'Level of Change'],
    ['period', 'Period of Data Collection'], ['mov', 'Mean of Verification'],
    ['definition', 'Definition'], ['code', 'Indicator code']
  ];
  return (
    <>
      <PageHead title="Master Data">
        Kualitas metadata indikator. Kolom yang kosong pada data sumber akan membatasi kemampuan
        analisis dan interpretasi.
      </PageHead>
      <Card>
        <div className="tbl-w"><table>
          <thead><tr><th>Kolom</th><th className="num">Terisi</th><th className="num">Kosong</th>
            <th className="num">Kelengkapan</th></tr></thead>
          <tbody>
            {fields.map(([k, l]) => {
              const filled = rows.filter(r => r[k] !== null && r[k] !== undefined && r[k] !== '').length;
              const p = rows.length ? filled / rows.length : 0;
              return (
                <tr key={k}>
                  <td className="t-name">{l}<div className="t-meta"><span className="code">{k}</span></div></td>
                  <td className="num">{filled}</td>
                  <td className="num">{rows.length - filled}</td>
                  <td className="num">
                    <Badge cls={p >= 0.9 ? 'b-ok' : p >= 0.5 ? 'b-am' : 'b-rd'}>
                      {Math.round(p * 100)}%
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </Card>
      <Note kind="w">
        Kolom <b>Mean of Verification</b> dan <b>Definition</b> yang kosong berdampak langsung pada
        auditability: tanpa keduanya, angka yang dilaporkan tidak dapat ditelusuri kembali ke sumbernya
        maupun diperiksa konsistensi perhitungannya antar periode.
      </Note>
    </>
  );
}

export function AdWorkflowCfg({ config }) {
  const wf = config?.workflow || {};
  return (
    <>
      <PageHead title="Workflow Configuration">Aturan yang berlaku pada proses submit dan approval.</PageHead>
      <Card className="mb">
        <div className="tbl-w"><table>
          <thead><tr><th>Aturan</th><th className="ctr">Status</th><th>Keterangan</th></tr></thead>
          <tbody>
            <tr><td className="t-name">Evidence wajib sebelum submit</td>
              <td className="ctr"><Badge cls={wf.require_evidence ? 'b-ok' : 'b-gy'}>
                {wf.require_evidence ? 'Aktif' : 'Nonaktif'}</Badge></td>
              <td style={{ fontSize: 12 }}>Angka tanpa dokumen pendukung tidak dapat diverifikasi saat audit.</td></tr>
            <tr><td className="t-name">Minimal satu nilai kuartal</td>
              <td className="ctr"><Badge cls={wf.require_one_quarter ? 'b-ok' : 'b-gy'}>
                {wf.require_one_quarter ? 'Aktif' : 'Nonaktif'}</Badge></td>
              <td style={{ fontSize: 12 }}>Mencegah submit baris kosong.</td></tr>
            <tr><td className="t-name">Nilai berubah menurunkan Approved ke Draft</td>
              <td className="ctr"><Badge cls="b-ok">Aktif</Badge></td>
              <td style={{ fontSize: 12 }}>Ditegakkan trigger database, tidak dapat dilewati lewat API.</td></tr>
          </tbody>
        </table></div>
      </Card>
      <Note kind="w">
        Alur: Draft → Submitted → Under Review → Approved, atau Returned → Revision. Setiap perubahan
        status tercatat pada Audit Trail dan tidak dapat dihapus lewat API — tabel audit sengaja tidak
        memiliki kebijakan UPDATE maupun DELETE.
      </Note>
    </>
  );
}

export function AdSystemCfg({ config, rows, year }) {
  const th = config?.thresholds || { on_track: 95, near_target: 75 };
  const meta = config?.meta || {};
  return (
    <>
      <PageHead title="System Configuration">
        Parameter perhitungan status dan identitas organisasi. Perubahan ambang langsung memengaruhi
        seluruh dashboard, analytics, dan AI insight.
      </PageHead>
      <div className="grid g2 mb">
        <Card title="Ambang status">
          <div className="tbl-w"><table>
            <tbody>
              <tr><td>On Track</td><td className="num">≥ {th.on_track}%</td></tr>
              <tr><td>Near Target</td><td className="num">≥ {th.near_target}%</td></tr>
              <tr><td>At Risk</td><td className="num">&lt; {th.near_target}%</td></tr>
              <tr><td>No Data</td><td className="num">target atau actual kosong</td></tr>
            </tbody>
          </table></div>
        </Card>
        <Card title="Aturan agregasi Q1–Q4">
          <div className="tbl-w"><table>
            <tbody>
              <tr><td>Unit Percent</td><td className="num">MAX dari Q1–Q4</td></tr>
              <tr><td>Unit selain Percent</td><td className="num">Jumlah Q1–Q4</td></tr>
              <tr><td>Pengecualian per indikator</td><td className="num">kolom <span className="code">agg</span></td></tr>
            </tbody>
          </table></div>
        </Card>
      </div>
      <Note kind="w">
        <b>Aturan seragam punya batas.</b> MAX untuk unit Percent tepat bila persentase bersifat
        kumulatif, tetapi menyesatkan untuk persentase yang menggambarkan kondisi pada satu titik waktu
        — tingkat kehadiran, pemenuhan, atau prevalensi — karena melaporkan kuartal terbaik, bukan
        kondisi akhir tahun. Demikian pula SUM keliru pada indikator stok atau indeks. Setel kolom
        <span className="code"> agg = last</span> pada indikator seperti itu.
      </Note>
      {meta.vision && <Card title="Vision" className="mt"><div style={{ fontSize: 13 }}>{meta.vision}</div></Card>}
    </>
  );
}

export function AdNotification({ notifications = [] }) {
  return (
    <>
      <PageHead title="Notification">
        Pemberitahuan yang dihasilkan sistem dari aktivitas submit, approval, dan permintaan revisi.
      </PageHead>
      {!notifications.length ? (
        <Card><NoData title="Belum ada notifikasi"
          hint="Notifikasi muncul saat data di-submit, disetujui, atau dikembalikan." /></Card>
      ) : (
        <Card><div className="tbl-w"><table>
          <thead><tr><th>Waktu</th><th>Pesan</th><th className="ctr">Status</th></tr></thead>
          <tbody>
            {notifications.map(n => (
              <tr key={n.id}>
                <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {new Date(n.created_at).toLocaleString('id-ID')}</td>
                <td>{n.message}</td>
                <td className="ctr"><Badge cls={n.read ? 'b-gy' : 'b-bl'}>{n.read ? 'Dibaca' : 'Baru'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table></div></Card>
      )}
    </>
  );
}

export function AdAudit({ audit = [] }) {
  return (
    <>
      <PageHead title="Audit Trail">
        Riwayat aktivitas pengguna dalam sistem. Setiap perubahan nilai, perubahan status workflow, dan
        tindakan administratif tercatat di sini.
      </PageHead>
      {!audit.length ? (
        <Card><NoData title="Audit trail masih kosong"
          hint="Terisi otomatis saat Anda mengubah data atau mengelola akun." /></Card>
      ) : (
        <Card sub={`${audit.length} entri terakhir`}>
          <div className="tbl-w"><table>
            <thead><tr><th>Waktu</th><th>Pengguna</th><th>Aktivitas</th><th>Objek</th><th>Detail</th></tr></thead>
            <tbody>
              {audit.map(a => (
                <tr key={a.id}>
                  <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    {new Date(a.at).toLocaleString('id-ID')}</td>
                  <td><span className="code">{a.actor_username || '—'}</span></td>
                  <td className="t-name">{a.action}</td>
                  <td style={{ fontSize: 12 }}>{a.object || '—'}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>{a.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>
      )}
      <Note kind="w">
        Tabel audit sengaja tidak memiliki kebijakan UPDATE maupun DELETE pada Row Level Security,
        sehingga entri yang sudah tercatat tidak dapat diubah atau dihapus siapa pun lewat API.
      </Note>
    </>
  );
}
