'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { can } from '@/lib/calc';

const NAV = [
  { t: 'Home', items: [{ h: '/dashboard', l: 'Executive Dashboard' }] },
  { t: 'Organization Performance', items: [{ h: '/opi', l: 'KPI Repository & Quarterly Update' }] },
  { t: 'Program Performance', items: [{ h: '/ppi', l: 'Indicator Repository & Quarterly Update' }] },
  { t: 'Analytics & Insights', items: [{ h: '/analytics/pathway', l: 'Pathway Diagram' }] },
  { t: 'Administration', cap: 'admin', items: [{ h: '/admin/users', l: 'User Management' }] }
];

export default function Sidebar({ role }) {
  const path = usePathname();
  return (
    <aside className="side" id="side">
      <div className="brand">
        <div className="lg-bars"><i /><i /><i /><i /></div>
        <div><b>SIGMA</b><small>GOVERNANCE · MONITORING · ANALYTICS</small></div>
      </div>
      <nav className="nav">
        {NAV.filter(g => !g.cap || can(role, g.cap)).map(g => (
          <div className="nav-g" key={g.t}>
            <div className="nav-t">{g.t}</div>
            {g.items.map(i => (
              <Link key={i.h} href={i.h} className={path === i.h ? 'on' : ''}>{i.l}</Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
