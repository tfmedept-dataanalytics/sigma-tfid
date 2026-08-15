'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { can } from '@/lib/calc';
import { NAV, hrefOf } from '@/lib/nav';
import { APP_VERSION, BUILD_DATE } from '@/lib/version';

const canManage = role => role === 'sysadmin' || role === 'pmo';

export default function Sidebar({ role }) {
  const path = usePathname();
  const sp = useSearchParams();
  const year = sp.get('year');
  const qtr = sp.get('q');
  const region = sp.get('region');
  const activeId = path === '/dashboard' ? 'dash' : (path.startsWith('/v/') ? path.slice(3) : '');

  /* Grup yang memuat halaman aktif terbuka otomatis; sisanya menyusut,
     seperti pada versi HTML. Pilihan buka/tutup pengguna dipertahankan
     selama navigasi. */
  const [open, setOpen] = useState({});
  useEffect(() => {
    const g = NAV.find(x => x.items.some(i => i.id === activeId));
    if (g) setOpen(o => (o[g.t] ? o : { ...o, [g.t]: true }));
  }, [activeId]);

  const visible = g => {
    if (g.perm === 'admin' && !can(role, 'admin')) return false;
    if (g.perm === 'manage' && !canManage(role)) return false;
    if (role === 'exec' && g.t.startsWith('Workflow')) return false;
    return true;
  };

  /* Tahun aktif ikut dibawa antar halaman agar pilihan periode tidak
     tereset setiap kali berpindah menu. */
  const withParams = h => {
    const q = new URLSearchParams();
    if (year) q.set('year', year);
    if (qtr) q.set('q', qtr);
    if (region) q.set('region', region);
    const s2 = q.toString();
    return s2 ? `${h}?${s2}` : h;
  };

  return (
    <aside className="side" id="side">
      <div className="brand">
        <div className="lg-bars"><i /><i /><i /><i /></div>
        <div><b>SIGMA</b><small>GOVERNANCE · MONITORING · ANALYTICS</small></div>
      </div>

      <nav className="nav">
        {NAV.filter(visible).map(g => {
          if (g.t === 'Home') {
            return g.items.map(i => (
              <Link key={i.id} href={withParams(hrefOf(i.id))}
                    className={activeId === i.id ? 'on' : ''}>
                <span className="ic">⌂</span>{i.l}
              </Link>
            ));
          }
          const isOpen = !!open[g.t];
          return (
            <div key={g.t}>
              <button type="button" className={'cat' + (isOpen ? ' open' : '')}
                      aria-expanded={isOpen}
                      onClick={() => setOpen(o => ({ ...o, [g.t]: !o[g.t] }))}>
                <span className="ic">{g.ic || '•'}</span>{g.t}<span className="ar">▸</span>
              </button>
              <div className={'kids' + (isOpen ? ' open' : '')}>
                {g.items.map(i => (
                  <Link key={i.id} href={withParams(hrefOf(i.id))}
                        className={'sub-a' + (activeId === i.id ? ' on' : '')}>{i.l}</Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="side-ver" title={BUILD.notes}>
        v{APP_VERSION} · {BUILD_DATE}
      </div>
    </aside>
  );
}
