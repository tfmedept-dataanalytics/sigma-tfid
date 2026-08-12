'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { can } from '@/lib/calc';
import { NAV, hrefOf } from '@/lib/nav';

const canManage = role => role === 'sysadmin' || role === 'pmo';

export default function Sidebar({ role }) {
  const path = usePathname();
  const visible = g => {
    if (g.perm === 'admin' && !can(role, 'admin')) return false;
    if (g.perm === 'manage' && !canManage(role)) return false;
    if (role === 'exec' && g.t.startsWith('Workflow')) return false;
    return true;
  };

  return (
    <aside className="side" id="side">
      <div className="brand">
        <div className="lg-bars"><i /><i /><i /><i /></div>
        <div><b>SIGMA</b><small>GOVERNANCE · MONITORING · ANALYTICS</small></div>
      </div>
      <nav className="nav">
        {NAV.filter(visible).map(g => (
          <div className="nav-g" key={g.t}>
            <div className="nav-t">{g.t}</div>
            {g.items.map(i => {
              const h = hrefOf(i.id);
              return <Link key={i.id} href={h} className={path === h ? 'on' : ''}>{i.l}</Link>;
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
