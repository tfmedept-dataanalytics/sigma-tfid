'use client';

import { useMemo, useState } from 'react';
import { achievement, statusClass, STATUS_COLOR, pct } from '@/lib/calc';

const DEF = {
  PPI: [
    { k: 'id', l: 'Indicator' },
    { k: 'project', l: 'Project Level' },
    { k: 'portfolio', l: 'ToC Portfolio Level' },
    { k: 'toc_foundation', l: 'ToC Foundation Level' }
  ],
  OPI: [
    { k: 'id', l: 'KPI' },
    { k: 'program', l: 'Program' },
    { k: 'outcome', l: 'Outcome' },
    { k: 'strategy_map', l: 'Strategy Map' }
  ]
};

const key = (r, k) => (k === 'id' ? r.id : (r[k] || '(tidak diisi)'));
const label = (r, k) => (k === 'id' ? r.name : (r[k] || '(tidak diisi)'));
const uniq = a => [...new Set(a)].sort();

function wrap(t, max, lines) {
  t = String(t || '');
  if (lines === 1) return [t.length > max ? t.slice(0, max - 1) + '…' : t];
  if (t.length <= max) return [t, ''];
  let cut = t.lastIndexOf(' ', max);
  if (cut < max * 0.55) cut = max;
  let b = t.slice(cut).trim();
  if (b.length > max) b = b.slice(0, max - 1) + '…';
  return [t.slice(0, cut).trim(), b];
}

function buildSvg(list, cols, showInd) {
  const sorted = [...list].sort((a, b) => {
    for (let c = cols.length - 1; c >= 0; c--) {
      const ka = key(a, cols[c].k), kb = key(b, cols[c].k);
      if (ka !== kb) return ka < kb ? -1 : 1;
    }
    return 0;
  });

  const colNodes = cols.map(() => []);
  const colIdx = cols.map(() => ({}));
  sorted.forEach(r => cols.forEach((c, ci) => {
    const k = key(r, c.k);
    if (!colIdx[ci][k]) { colIdx[ci][k] = { n: 0, sum: 0, cnt: 0, lab: label(r, c.k) }; colNodes[ci].push(k); }
    const nd = colIdx[ci][k];
    nd.n++;
    const a = achievement(r.year, r);
    if (a !== null) { nd.sum += a; nd.cnt++; }
  }));

  const links = [];
  for (let ci = 0; ci < cols.length - 1; ci++) {
    const map = {}, order = [];
    sorted.forEach(r => {
      const a = key(r, cols[ci].k), b = key(r, cols[ci + 1].k), k = a + '\u0001' + b;
      if (!map[k]) { map[k] = { ci, a, b, n: 0, sum: 0, cnt: 0 }; order.push(k); }
      map[k].n++;
      const v = achievement(r.year, r);
      if (v !== null) { map[k].sum += v; map[k].cnt++; }
    });
    order.forEach(k => links.push(map[k]));
  }

  const nw = cols.map((c, ci) => (ci === 0 && showInd ? 258 : 216));
  const gapX = 132, padX = 14, padT = 44, padB = 18, gapY = 9, minH = 26;
  let W = padX * 2;
  nw.forEach((w, i) => { W += w + (i < nw.length - 1 ? gapX : 0); });

  const total = sorted.length || 1;
  const maxN = Math.max(...colNodes.map(a => a.length));
  let avail = Math.max(360, Math.min(2400, maxN * 34 + 120));
  const scale = (avail - (maxN - 1) * gapY) / total;
  for (let it = 0; it < 8; it++) {
    let need = 0;
    colNodes.forEach((keys, ci) => {
      let h = 0;
      keys.forEach(k => { h += Math.max(minH, colIdx[ci][k].n * scale) + gapY; });
      need = Math.max(need, h - gapY);
    });
    if (need <= avail) break;
    avail = need;
  }
  const H = avail + padT + padB;

  const xs = []; let x = padX;
  nw.forEach(w => { xs.push(x); x += w + gapX; });

  const pos = cols.map(() => ({}));
  colNodes.forEach((keys, ci) => {
    let yy = padT, tot = 0;
    keys.forEach(k => { tot += Math.max(minH, colIdx[ci][k].n * scale); });
    const sp = Math.max(gapY, (avail - tot) / Math.max(1, keys.length - 1));
    keys.forEach(k => {
      const h = Math.max(minH, colIdx[ci][k].n * scale);
      pos[ci][k] = { y: yy, h, so: 0, to: 0 };
      yy += h + sp;
    });
  });

  const clr = a => (a === null ? STATUS_COLOR.gy : STATUS_COLOR[statusClass(a)]);
  const ribbons = [], labels = [], nodes = [];
  const lane = {};

  links.forEach((L, li) => {
    const A = pos[L.ci][L.a], B = pos[L.ci + 1][L.b];
    if (!A || !B) return;
    const an = colIdx[L.ci][L.a].n, bn = colIdx[L.ci + 1][L.b].n;
    const ah = A.h * (L.n / an), bh = B.h * (L.n / bn);
    const sy0 = A.y + A.so, sy1 = sy0 + ah, ty0 = B.y + B.to, ty1 = ty0 + bh;
    A.so += ah; B.to += bh;
    const x0 = xs[L.ci] + nw[L.ci], x1 = xs[L.ci + 1], mx = (x0 + x1) / 2;
    const avg = L.cnt ? L.sum / L.cnt : null;
    const c = clr(avg);

    ribbons.push(
      <path key={'r' + li}
        d={`M${x0},${sy0} C${mx},${sy0} ${mx},${ty0} ${x1},${ty0} L${x1},${ty1} C${mx},${ty1} ${mx},${sy1} ${x0},${sy1} Z`}
        fill={c} fillOpacity={avg === null ? 0.16 : 0.3} stroke={c} strokeOpacity={0.35} strokeWidth={0.6}>
        <title>{`${colIdx[L.ci][L.a].lab} → ${colIdx[L.ci + 1][L.b].lab}\n${L.n} indikator · ${L.cnt} ber-capaian · rata-rata ${avg === null ? 'tidak tersedia' : pct(avg)}`}</title>
      </path>
    );

    if (L.n === 1 && avg === null) return; // jalur tunggal tanpa data: label tak menambah informasi
    const my0 = (sy0 + sy1 + ty0 + ty1) / 4;
    const txt = `${L.n} · ${avg === null ? 'n/a' : (avg * 100).toFixed(0) + '%'}`;
    const wlab = txt.length * 5.5 + 12;
    lane[L.ci] = lane[L.ci] || [-99, -99];
    const lx = [mx - 26, mx + 26];
    let idx = 0, my = my0;
    if (my0 - lane[L.ci][0] < 17) {
      if (my0 - lane[L.ci][1] >= 17) idx = 1;
      else { idx = lane[L.ci][0] <= lane[L.ci][1] ? 0 : 1; my = lane[L.ci][idx] + 17; }
    }
    lane[L.ci][idx] = my;
    labels.push(
      <g key={'l' + li}>
        <rect x={lx[idx] - wlab / 2} y={my - 8} width={wlab} height={16} rx={8}
              fill="#fff" stroke={c} strokeOpacity={0.55} strokeWidth={0.8} />
        <text x={lx[idx]} y={my + 3.4} textAnchor="middle" fontSize={9.5} fontWeight={700}
              fill={avg === null ? '#8FA09A' : c}>{txt}</text>
      </g>
    );
  });

  colNodes.forEach((keys, ci) => keys.forEach(k => {
    const nd = colIdx[ci][k], P = pos[ci][k];
    const avg = nd.cnt ? nd.sum / nd.cnt : null, c = clr(avg);
    const maxCh = Math.max(10, Math.floor((nw[ci] - 22) / 6.05));
    const two = P.h >= 44;
    const [l1, l2] = wrap(nd.lab, maxCh, two ? 2 : 1);
    const cy = P.y + P.h / 2;
    nodes.push(
      <g key={'n' + ci + k}>
        <rect x={xs[ci]} y={P.y} width={nw[ci]} height={P.h} rx={6} fill="#fff" stroke="#DCE5E0" />
        <rect x={xs[ci]} y={P.y} width={3.5} height={P.h} rx={2} fill={c} />
        {two && l2 ? (
          <>
            <text x={xs[ci] + 11} y={cy - 6} fontSize={10.8} fontWeight={600} fill="#10231B">{l1}</text>
            <text x={xs[ci] + 11} y={cy + 6} fontSize={10.8} fontWeight={600} fill="#10231B">{l2}</text>
            <text x={xs[ci] + 11} y={cy + 19} fontSize={9.5} fill="#6E7F76">{nd.n} ind · {avg === null ? 'no data' : pct(avg)}</text>
          </>
        ) : (
          <>
            <text x={xs[ci] + 11} y={cy - 2} fontSize={10.8} fontWeight={600} fill="#10231B">{l1}</text>
            <text x={xs[ci] + 11} y={cy + 10} fontSize={9.5} fill="#6E7F76">{nd.n} ind · {avg === null ? 'no data' : pct(avg)}</text>
          </>
        )}
        <title>{`${nd.lab}\n${nd.n} indikator · ${nd.cnt} ber-capaian`}</title>
      </g>
    );
  }));

  const heads = cols.map((c, ci) => (
    <g key={'h' + ci}>
      <text x={xs[ci]} y={20} fontSize={10.5} fontWeight={700} letterSpacing={0.8} fill="#6E7F76">
        {c.l.toUpperCase()}
      </text>
      <line x1={xs[ci]} y1={28} x2={xs[ci] + nw[ci]} y2={28} stroke="#DCE5E0" strokeWidth={1} />
    </g>
  ));

  return { W: Math.round(W), H: Math.round(H), heads, ribbons, nodes, labels };
}

export default function Pathway({ rows, year }) {
  const [type, setType] = useState('PPI');
  const [f3, setF3] = useState('');
  const [f2, setF2] = useState('');
  const [f1, setF1] = useState('');
  const [showInd, setShowInd] = useState(false);

  const def = DEF[type];
  const base = useMemo(() => rows.filter(r => r.type === type), [rows, type]);

  const o3 = useMemo(() => uniq(base.map(r => key(r, def[3].k))), [base, def]);
  const o2 = useMemo(() => uniq(base.filter(r => !f3 || key(r, def[3].k) === f3).map(r => key(r, def[2].k))), [base, def, f3]);
  const o1 = useMemo(() => uniq(base.filter(r => (!f3 || key(r, def[3].k) === f3) && (!f2 || key(r, def[2].k) === f2))
    .map(r => key(r, def[1].k))), [base, def, f3, f2]);

  const list = useMemo(() => base.filter(r =>
    (!f3 || key(r, def[3].k) === f3) &&
    (!f2 || key(r, def[2].k) === f2) &&
    (!f1 || key(r, def[1].k) === f1)), [base, def, f1, f2, f3]);

  const tooMany = showInd && list.length > 60;
  const useInd = showInd && !tooMany;
  const cols = useInd ? def : def.slice(1);
  const svg = useMemo(() => (list.length ? buildSvg(list, cols, useInd) : null), [list, cols, useInd]);

  const withA = list.filter(r => achievement(r.year, r) !== null).length;

  return (
    <>
      <div className="card mb"><div className="card-b" style={{ padding: '12px 14px' }}>
        <div className="filters">
          <select value={type} onChange={e => { setType(e.target.value); setF1(''); setF2(''); setF3(''); }}>
            <option value="PPI">PPI — Program Performance</option>
            <option value="OPI">OPI — Organization Performance</option>
          </select>
          <select value={f3} onChange={e => { setF3(e.target.value); setF2(''); setF1(''); }}>
            <option value="">Semua {def[3].l}</option>{o3.map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={f2} onChange={e => { setF2(e.target.value); setF1(''); }}>
            <option value="">Semua {def[2].l}</option>{o2.map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={f1} onChange={e => setF1(e.target.value)}>
            <option value="">Semua {def[1].l}</option>{o1.map(v => <option key={v}>{v}</option>)}
          </select>
          <label className="row" style={{ gap: 6, fontSize: 12.5 }}>
            <input type="checkbox" checked={showInd} onChange={e => setShowInd(e.target.checked)} />
            Tampilkan level indikator
          </label>
          <span className="bdg b-gd" style={{ marginLeft: 'auto' }}>Tahun {year}</span>
        </div>
      </div></div>

      {tooMany && (
        <div className="note w mb">
          <b>Level indikator disembunyikan.</b> Kombinasi filter ini memuat {list.length} indikator — terlalu padat
          untuk dibaca sebagai satu diagram. Pilih satu {def[2].l} atau {def[1].l} lebih dulu (maksimal 60 indikator).
        </div>
      )}

      {!list.length ? (
        <div className="card"><div className="card-b">
          <div className="nodata"><b>Tidak ada indikator pada kombinasi filter ini</b>
            <span>Longgarkan filter atau ganti tahun.</span></div>
        </div></div>
      ) : (
        <div className="card mb">
          <div className="card-h">
            <h3>Pathway {type} — tahun {year}</h3>
            <div className="sub">
              {list.length} indikator pada jalur ini, {withA} di antaranya memiliki target dan actual sekaligus.
              Lebar pita sebanding dengan jumlah indikator; label pada garis adalah jumlah indikator dan rata-rata capaian jalur.
            </div>
          </div>
          <div className="card-b" style={{ overflow: 'auto' }}>
            <svg viewBox={`0 0 ${svg.W} ${svg.H}`} width={svg.W} height={svg.H}
                 fontFamily="Segoe UI, system-ui, sans-serif">
              {svg.heads}{svg.ribbons}{svg.nodes}{svg.labels}
            </svg>
          </div>
        </div>
      )}

      <div className="note w">
        <b>Cara membaca angka pada garis.</b> Angka pertama adalah jumlah indikator yang mengalir pada jalur tersebut;
        persentase adalah rata-rata capaian <i>tidak berbobot</i> dari indikator pada jalur itu yang memiliki target dan
        actual sekaligus. Indikator tanpa data tidak dihitung sebagai nol dan tidak masuk rata-rata, sehingga sebuah jalur
        bisa menampilkan persentase tinggi meskipun sebagian besar indikatornya belum terisi.
        Diagram ini menggambarkan <b>keterkaitan struktural</b> pada Theory of Change, bukan hubungan sebab-akibat yang telah
        diuji: pita lebar berarti banyak indikator terhubung, bukan bahwa kontribusinya besar.
      </div>
    </>
  );
}
