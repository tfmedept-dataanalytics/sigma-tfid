'use client';

import { Card, Kpi, Note, NoData, PageHead, Badge, StatusBadge, WfBadge, Progress, Spark,
         statSummary, achievement, actualOf, fmt, pct, useMemo } from './common';
import { can, WORKFLOW } from '@/lib/calc';
import Link from 'next/link';
import { hrefOf } from '@/lib/nav';

function Queue({ title, desc, rows, year, status, empty, note }) {
  const list = useMemo(() => rows.filter(r => {
    const y = r.years?.[year] || r.year;
    return status.includes(y?.status || 'draft');
  }), [rows, year, status]);

  return (
    <>
      <PageHead title={title}>{desc}</PageHead>
      <div className="grid g4 mb">
        {['draft', 'submitted', 'review', 'approved'].map(k => (
          <Kpi key={k} label={WORKFLOW[k].label}
               value={rows.filter(r => ((r.years?.[year] || r.year)?.status || 'draft') === k).length}
               detail={`indikator pada ${year}`} />
        ))}
      </div>

      {!list.length ? <Card><NoData title={empty.t} hint={empty.h} /></Card> : (
        <Card sub={`${list.length} indikator dalam antrean ini`}>
          <div className="tbl-w"><table>
            <thead><tr><th>ID</th><th style={{ minWidth: 280 }}>Indikator</th>
              <th className="num">Target</th><th className="num">Actual</th>
              <th style={{ width: 120 }}>Capaian</th><th className="ctr">Q1–Q4</th>
              <th>Workflow</th><th className="ctr">Buka</th></tr></thead>
            <tbody>
              {list.slice(0, 200).map(r => {
                const y = r.years?.[year] || r.year;
                return (
                  <tr key={r.id}>
                    <td><span className="code">{r.id}</span></td>
                    <td className="t-name">{r.name}</td>
                    <td className="num">{fmt(y?.target, r.unit)}</td>
                    <td className="num">{fmt(actualOf(y, r), r.unit)}</td>
                    <td><Progress a={achievement(y, r)} /></td>
                    <td className="ctr"><Spark row={y} unit={r.unit} /></td>
                    <td><WfBadge status={y?.status} /></td>
                    <td className="ctr">
                      <Link className="btn sm" href={hrefOf(r.type === 'OPI' ? 'org-qu' : 'pp-qu')}>Buka</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </Card>
      )}
      {note && <Note kind="w">{note}</Note>}
    </>
  );
}

export function WfMyTasks({ rows, year, role }) {
  const editable = can(role, 'edit');
  const scoped = rows.filter(r => {
    if (role === 'pm') return r.type === 'PPI';
    if (role === 'head') return r.type === 'OPI';
    return true;
  });
  return (
    <Queue
      title="My Tasks"
      desc={`Daftar pekerjaan Anda pada periode ${year} sesuai role. Indikator berstatus Draft dan Returned menunggu tindakan pemilik data.`}
      rows={editable ? scoped : []}
      year={year} status={['draft', 'returned']}
      empty={{ t: editable ? 'Tidak ada tugas tertunda' : 'Role Anda tidak memiliki tugas input',
               h: editable ? 'Seluruh indikator dalam cakupan Anda sudah di-submit atau disetujui.'
                           : 'Role ini hanya memiliki akses baca dan review.' }}
      note="Antrean ini menampilkan indikator berdasarkan status workflow, bukan penugasan per orang. Penugasan per pemilik indikator memerlukan kolom owner yang terisi konsisten."
    />
  );
}

export function WfReview({ rows, year }) {
  return (
    <Queue title="Data Review"
      desc="Data yang telah di-submit oleh pemilik indikator dan menunggu pemeriksaan kualitas serta kewajaran."
      rows={rows} year={year} status={['submitted']}
      empty={{ t: 'Antrean review kosong', h: 'Antrean akan terisi saat pemilik indikator melakukan submit.' }} />
  );
}

export function WfValidation({ rows, year }) {
  return (
    <Queue title="Validation"
      desc="Pemeriksaan kelengkapan sebelum persetujuan: nilai kuartal terisi, target tersedia, dan evidence terlampir."
      rows={rows} year={year} status={['review']}
      empty={{ t: 'Tidak ada data dalam proses validasi', h: 'Data masuk ke sini setelah reviewer memulai pemeriksaan.' }}
      note="Angka tanpa dokumen pendukung tidak dapat diverifikasi saat audit atau pelaporan donor. Validasi sebaiknya menolak data tanpa evidence, bukan sekadar mencatatnya." />
  );
}

export function WfApproval({ rows, year }) {
  return (
    <Queue title="Approval"
      desc="Antrean persetujuan. Data yang disetujui menjadi data resmi organisasi dan menjadi dasar dashboard serta AI Insight."
      rows={rows} year={year} status={['review', 'submitted']}
      empty={{ t: 'Tidak ada data menunggu persetujuan', h: 'Seluruh data pada periode ini sudah diproses.' }} />
  );
}

export function WfReturned({ rows, year }) {
  return (
    <Queue title="Returned / Revision"
      desc="Data yang dikembalikan reviewer beserta alasan pengembalian, tercatat pada field Challenge / Deviation."
      rows={rows} year={year} status={['returned']}
      empty={{ t: 'Tidak ada data yang dikembalikan', h: 'Belum ada data yang ditolak reviewer pada periode ini.' }} />
  );
}
