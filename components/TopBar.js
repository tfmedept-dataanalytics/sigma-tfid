'use client';

import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import { ROLES } from '@/lib/calc';
import LangSwitch from './LangSwitch';
import { useLang } from './LangProvider';

export default function TopBar({ profile, year, years, onYear }) {
  const { t } = useLang();
  const initials = (profile.full_name || profile.username)
    .split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="top">
      <div className="crumb"><b>SIGMA</b><span>Performance Intelligence Platform</span></div>
      <div className="top-r no-print">
        <LangSwitch />
        {years?.length > 0 && (
          <select className="sel-sm" value={year} onChange={e => onYear?.(e.target.value)} title={t('Tahun pelaporan')}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        )}
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
