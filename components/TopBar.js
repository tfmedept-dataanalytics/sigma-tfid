'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import { ROLES } from '@/lib/calc';
import { TITLES } from '@/lib/nav';
import LangSwitch from './LangSwitch';
import { useLang } from './LangProvider';

export default function TopBar({ profile, years = [], year, qtr }) {
  const { t } = useLang();
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();

  const activeId = path === '/dashboard' ? 'dash' : (path.startsWith('/v/') ? path.slice(3) : '');
  const title = TITLES[activeId] || { t: 'SIGMA', p: 'Performance Intelligence Platform' };

  const initials = (profile.full_name || profile.username)
    .split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* Tahun disimpan pada URL, bukan pada state komponen, sehingga halaman
     dirender ulang di server dengan data periode yang dipilih — termasuk
     saat tautan dibagikan atau halaman dimuat ulang. */
  function setParam(k, v) {
    const q = new URLSearchParams(sp.toString());
    q.set(k, v);
    router.push(`${path}?${q.toString()}`);
    router.refresh();
  }

  return (
    <header className="top">
      <div className="crumb"><b>{title.t}</b><span>{title.p}</span></div>
      <div className="top-r no-print">
        <LangSwitch />
        {years.length > 0 && (
          <select className="sel-sm" value={year} onChange={e => setParam('year', e.target.value)}
                  title={t('Tahun pelaporan')}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        )}
        <select className="sel-sm" value={qtr} onChange={e => setParam('q', e.target.value)}
                title={t('Kuartal')}>
          {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
        </select>
        <div className="avatar">
          <div className="av-c">{initials}</div>
          <div className="av-t">
            <b>{profile.full_name || profile.username}</b>
            <span>{ROLES[profile.role]?.n || profile.role}</span>
          </div>
          <Link className="btn-i" href="/account/password" title={t('Ganti password')}>🔑</Link>
          <form action={signOut}><button className="btn-i" title={t('Keluar')} type="submit">⏻</button></form>
        </div>
      </div>
    </header>
  );
}
