/* Struktur menu — mengikuti persis versi single-file HTML (48 view). */
export const NAV = [
  { t: 'Home', ic: '◈', items: [{ id: 'dash', l: 'Executive Dashboard' }] },
  { t: 'Organization Performance (OPI)', ic: '◎', items: [
    { id: 'org-map', l: 'Strategy Map' },
    { id: 'org-kpi', l: 'KPI Repository' },
    { id: 'org-qu',  l: 'Quarterly Update' },
    { id: 'org-ann', l: 'Annual Performance Review' },
    { id: 'org-an',  l: 'Organization Analytics' }
  ]},
  { t: 'Program Performance (PPI)', ic: '◇', items: [
    { id: 'pp-str', l: 'Program Structure' },
    { id: 'pp-ind', l: 'Indicator Repository' },
    { id: 'pp-qu',  l: 'Quarterly Update' },
    { id: 'pp-ann', l: 'Annual Review' },
    { id: 'pp-an',  l: 'Portfolio Dashboard' }
  ]},
  { t: 'Indicator & Year Management', ic: '✚', perm: 'manage', items: [
    { id: 'md-ind', l: 'Indicator Management' },
    { id: 'md-yr',  l: 'Year Management' }
  ]},
  { t: 'Analytics & Insights', ic: '◔', items: [
    { id: 'an-ov',   l: 'Performance Overview' },
    { id: 'an-tr',   l: 'Trend Analysis' },
    { id: 'an-tva',  l: 'Target vs Actual' },
    { id: 'an-hm',   l: 'Heatmap' },
    { id: 'an-cmp',  l: 'Portfolio Comparison' },
    { id: 'an-rank', l: 'Performance Ranking' },
    { id: 'an-risk', l: 'Risk & Early Warning' },
    { id: 'an-dd',   l: 'Drill-down Analysis' },
    { id: 'an-path', l: 'Pathway Diagram' }
  ]},
  { t: 'AI Performance Assistant', ic: '✦', items: [
    { id: 'ai-sum', l: 'Executive Summary' },
    { id: 'ai-ask', l: 'Ask AI' },
    { id: 'ai-int', l: 'Performance Interpretation' },
    { id: 'ai-rca', l: 'Root Cause Analysis' },
    { id: 'ai-fc',  l: 'Forecast' },
    { id: 'ai-rec', l: 'Recommendation' },
    { id: 'ai-nar', l: 'Auto Narrative' }
  ]},
  { t: 'Reporting', ic: '▤', items: [
    { id: 'rp-q', l: 'Quarterly Report' },
    { id: 'rp-a', l: 'Annual Report' },
    { id: 'rp-e', l: 'Executive Report' },
    { id: 'rp-p', l: 'Program Report' },
    { id: 'rp-c', l: 'Custom Report' }
  ]},
  { t: 'Workflow & Approval', ic: '⇄', items: [
    { id: 'wf-my',  l: 'My Tasks' },
    { id: 'wf-rev', l: 'Data Review' },
    { id: 'wf-val', l: 'Validation' },
    { id: 'wf-app', l: 'Approval' },
    { id: 'wf-ret', l: 'Returned / Revision' }
  ]},
  { t: 'Administration', ic: '⚙', perm: 'admin', items: [
    { id: 'ad-usr',  l: 'User Management' },
    { id: 'ad-role', l: 'Role & Permission' },
    { id: 'ad-org',  l: 'Organization / Unit' },
    { id: 'ad-prg',  l: 'Program / Portfolio' },
    { id: 'ad-md',   l: 'Master Data' },
    { id: 'ad-wf',   l: 'Workflow Configuration' },
    { id: 'ad-cfg',  l: 'System Configuration' },
    { id: 'ad-not',  l: 'Notification' },
    { id: 'ad-aud',  l: 'Audit Trail' }
  ]}
];

export const TITLES = (() => {
  const m = {};
  NAV.forEach(g => g.items.forEach(i => { m[i.id] = { t: i.l, p: g.t }; }));
  return m;
})();

export const hrefOf = id => (id === 'dash' ? '/dashboard' : '/v/' + id);
