/**
 * Memeriksa identifier yang dipakai tetapi tidak pernah diimpor maupun
 * dideklarasikan di berkasnya — kesalahan yang lolos dari `next build`
 * karena baru muncul saat komponen dirender di browser.
 *
 *   npm run check:undef
 *
 * Pemeriksaan sengaja sempit: hanya nama ber-huruf besar (konstanta dan
 * komponen) yang tampil sebagai `NAMA.sesuatu`, `<Nama`, atau `NAMA(`.
 * Ruang lingkupnya kecil, tetapi persis menutup celah yang beberapa kali
 * menjatuhkan aplikasi ini.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['app', 'components', 'lib'];
const files = [];
const walk = d => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.js') || f.endsWith('.mjs')) files.push(p);
  }
};
ROOTS.forEach(r => fs.existsSync(r) && walk(r));

const BUILTIN = new Set(['Math','JSON','Object','Array','String','Number','Boolean','Date','Map','Set',
  'Promise','Error','RegExp','URLSearchParams','URL','React','Intl','NaN','Infinity','Symbol','BigInt',
  'Proxy','Reflect','WeakMap','WeakSet','Function','TextEncoder','TextDecoder','AbortController']);

let problems = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');

  /* Komentar, literal teks, dan teks JSX dikeluarkan lebih dulu. Tanpa ini,
     kata seperti SIGMA atau YTD di dalam kalimat ikut terbaca sebagai
     identifier dan hasilnya penuh temuan palsu. */
  const src = raw
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/>[^<>{}]*</g, '><');

  const declared = new Set(BUILTIN);

  for (const m of raw.matchAll(/import\s+(?:([\w$]+)\s*,?\s*)?(?:\{([^}]*)\})?\s*(?:\*\s+as\s+([\w$]+))?\s*from/g)) {
    if (m[1]) declared.add(m[1]);
    if (m[3]) declared.add(m[3]);
    if (m[2]) m[2].split(',').forEach(x => {
      const n = x.trim().split(/\s+as\s+/).pop().trim();
      if (n) declared.add(n);
    });
  }
  for (const m of src.matchAll(/(?:const|let|var|function|class)\s+([A-Z][\w$]*)/g)) declared.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g))
    m[1].split(',').forEach(x => {
      const n = x.trim().split(':').pop().trim();
      if (n) declared.add(n);
    });

  const used = new Set();
  for (const m of src.matchAll(/\b([A-Z][A-Z0-9_]{2,})\s*\./g)) used.add(m[1]);   // KONSTANTA.x
  for (const m of src.matchAll(/<([A-Z][\w$]*)[\s/>]/g)) used.add(m[1]);          // <Komponen
  for (const m of src.matchAll(/\b([A-Z][A-Z0-9_]{2,})\s*\(/g)) used.add(m[1]);   // FUNGSI(

  for (const name of used) {
    if (!declared.has(name)) {
      console.log(`  ${file}: '${name}' dipakai tetapi tidak diimpor / dideklarasikan`);
      problems++;
    }
  }
}

console.log(problems
  ? `\n${problems} identifier bermasalah — perbaiki sebelum deploy.`
  : 'OK — tidak ada identifier yang tidak terdefinisi.');
process.exit(problems ? 1 : 0);
