#!/usr/bin/env node
/**
 * init-site.mjs — build the filterable "GitHub Private site" for the Veritas
 * screen tour from docs/screenshots/manifest.json.
 *
 * Output: Veritas/docs/index.html
 *   - manifest inlined  → works offline (file://) and on GitHub Pages
 *   - images referenced relative ("screenshots/<area>/<file>.png") so the same
 *     file works locally AND when GitHub Pages is enabled with source "/docs"
 *     (https://veritas-bank-system.github.io/Veritas-Gold-V1/)
 *
 * Usage:
 *   node init-site.mjs                       # build docs/index.html
 *   node init-site.mjs --serve               # + local static server on :4173
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const SHOTS = path.join(REPO_ROOT, 'docs', 'screenshots');
const SITE_OUT = path.join(REPO_ROOT, 'docs', 'index.html');

const manifestPath = path.join(SHOTS, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('init-site: docs/screenshots/manifest.json not found — run capture-tour.mjs first.');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

/* ------------------------------------------------------------- helpers */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const PERSONAS = {
  persona_cb_governor:      { name: 'Central Bank Operator & Governor',      inst: 'Swiss National Bank / CBRT Sovereign Desk' },
  persona_super_admin:      { name: 'Platform Super Admin & Operator',       inst: 'Sovereign Network Operations Center (NOC)' },
  persona_supervisory_auditor: { name: 'Supervisory & Compliance Auditor',   inst: 'Bank for International Settlements (BIS) / ECB Radar' },
  persona_comm_treasury:    { name: 'Commercial Bank Treasury & Primary Dealer', inst: 'JPMorgan Chase Bank, N.A. (Kinexys Desk)' },
  persona_custodian_vault:  { name: 'Qualified Custodian & Vault Notary',    inst: 'Zurich Swiss Bullion Custody AG' },
  persona_issuer_dmo:       { name: 'Sovereign Debt Issuer / DMO Lead',      inst: 'Republic Debt Management Office (DMO)' },
  persona_fund_asset_mgr:   { name: 'Institutional Asset Manager / PE Fund', inst: 'BlackRock / Veritas Institutional Alpha Fund' },
};

/* ------------------------------------------------- manifest → site data */
const shots = manifest.shots.map((s, i) => {
  const area = s.file.split('/')[0]; // auth | central-bank | institutional | mobile | tablet
  const p = s.persona_id ? PERSONAS[s.persona_id] : null;
  return {
    i,
    file: s.file,
    area,
    surface: s.surface || 'Desktop Workstation',
    workspace: s.workspace || 'Pre-Login',
    personaId: s.persona_id || '',
    personaName: p ? p.name : 'Pre-login / Any',
    personaInst: p ? p.inst : '',
    menuPoint: s.menu_point || '',
    sectionId: s.section_id || '',
    desc: s.description || '',
    img: `screenshots/${s.file}`,
    short: path.basename(s.file, '.png'),
  };
});

const areas = [...new Set(shots.map((s) => s.area))];
const surfaces = [...new Set(shots.map((s) => s.surface))];
const workspaces = [...new Set(shots.map((s) => s.workspace))];
const personas = [];

/* ------------------------------------------- HTML writer (single file) */
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Veritas Gold V1 — Screen Tour (Private)</title>
<style>
 :root{--bg:#0b0a0d;--panel:#141118;--panel2:#1a1620;--line:#2a2331;--ink:#efe6f2;--mut:#9d92a8;--red:#ef4444;--gold:#d4af37;--violet:#8b5cf6}
 *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 -apple-system,'Segoe UI',Roboto,sans-serif}
 a{color:var(--red);text-decoration:none} a:hover{text-decoration:underline}
 header{padding:28px 32px 18px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#171219,#0b0a0d)}
 .brand{font:800 26px/1 'Segoe UI',sans-serif;letter-spacing:-.02em;margin:0 0 6px}
 .brand b{color:var(--red)} .pub{display:inline-block;margin-left:10px;font:700 10px/1.8 sans-serif;letter-spacing:.12em;color:#ffb1b1;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);border-radius:999px;padding:2px 10px;vertical-align:2px}
 header p{color:var(--mut);max-width:860px;margin:8px 0 0}
 .stats{display:flex;gap:18px;flex-wrap:wrap;margin-top:14px;font-size:12px;color:var(--mut)}
 .stats b{color:var(--ink)}
 nav#filters{position:sticky;top:0;z-index:50;background:rgba(13,11,15,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:12px 32px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
 select,button.f{background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:13px;cursor:pointer}
 button.f:hover{border-color:var(--red)}
 main{padding:22px 32px 60px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:20px}
 .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;transition:.15s}
 .card:hover{border-color:#4a3f56;transform:translateY(-2px)}
 .thumb{display:block;position:relative;background:#06050a;border-bottom:1px solid var(--line);min-height:180px;overflow:hidden}
 .thumb img{display:block;width:100%;height:auto;max-height:340px;object-fit:cover;object-position:top}
 .badge{position:absolute;top:10px;left:10px;font:700 10px/1 sans-serif;letter-spacing:.08em;padding:4px 8px;border-radius:999px;background:rgba(20,17,24,.88);border:1px solid var(--line);color:var(--mut)}
 .badge.surface-tablet{color:#7dd3fc;border-color:rgba(125,211,252,.4)} .badge.surface-mobile{color:#86efac;border-color:rgba(134,239,172,.4)}
 .badge.surface-desktop{color:#fda4af;border-color:rgba(253,164,175,.35)}
 .meta{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;flex:1}
 .t{font-weight:800;font-size:14px} .t .sec{color:var(--mut);font-weight:600}
 .t .m{color:var(--gold);font-weight:700;font-size:12px}
 .ws{display:inline-block;font:700 10px/1 sans-serif;letter-spacing:.06em;padding:3px 8px;border-radius:999px;width:max-content}
 .ws.cb{color:#fca5a5;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35)}
 .ws.inst{color:#c4b5fd;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.35)}
 .ws.pre{color:#9d92a8;background:rgba(157,146,168,.1);border:1px solid var(--line)}
 .who{font-size:12px;color:var(--mut)} .who b{color:var(--ink);font-weight:600}
 .desc{font-size:12.5px;color:#cfc4d8;margin:2px 0 0}
 footer{padding:18px 32px 40px;border-top:1px solid var(--line);color:var(--mut);font-size:12px}
 .empty{padding:40px;text-align:center;color:var(--mut)}
 @media(max-width:640px){header,nav#filters,main,footer{padding-left:16px;padding-right:16px}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<header>
 <h1 class="brand">VERITAS <b>GOLD</b> <span style="color:var(--mut);font-weight:600;font-size:15px">· V1 Screen Tour</span><span class="pub">PRIVATE</span></h1>
 <p>Every screen of both institutional workspaces — <b>Central Bank</b> (Sovereign tier) and <b>Institutional</b> (Wholesale tier) — across Desktop Workstation, Tablet (iPad) and Mobile (iPhone) runtime surfaces, with all seven admitted personas. Captured headlessly via CDP; regenerate with <code>npm run capture:tour</code>.</p>
 <div class="stats">
   <span><b>${shots.length}</b> captures</span>
   <span><b>${workspaces.length - 1}</b> workspaces + pre-login gate</span>
   <span><b>${PERSONAS ? Object.keys(PERSONAS).length : 7}</b> personas</span>
   <span><b>${surfaces.length}</b> runtime surfaces</span>
   <span>Generated <b>${esc(manifest.generated_at || '')}</b> by capture-tour.mjs</span>
 </div>
</header>
<nav id="filters">
 <label style="color:var(--mut);font-size:12px">Filter:</label>
 <select id="fPersona"><option value="">All personas</option>${[...new Set(shots.map(s=>s.personaId))].filter(Boolean).map(id => `<option value="${id}">${esc(PERSONAS[id].name)}</option>`).join('')}</select>
 <select id="fWs"><option value="">All workspaces</option>${workspaces.filter(w=>w!=='Pre-Login').map(w => `<option value="${w}">${esc(w)}</option>`).join('')}</select>
 <select id="fSurf"><option value="">All surfaces</option>${surfaces.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
 <select id="fArea"><option value="">All areas</option>${areas.map(a => `<option value="${a}">${esc(a)}</option>`).join('')}</select>
 <input id="q" type="search" placeholder="Search menu points, sections, descriptions…" style="background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:13px;min-width:260px;flex:1;max-width:420px" />
 <button class="f" id="clear">Reset</button>
 <span id="count" style="color:var(--mut);font-size:12px"></span>
</nav>
<main><div class="grid" id="grid"></div><div class="empty" id="empty" hidden>No captures match these filters.</div></main>
<footer>
 Veritas Gold V1 · private screen tour · generated from docs/screenshots/manifest.json ·
 <a href="https://github.com/veritas-bank-system/Veritas-Gold-V1">repo</a> ·
 README full tour tables: <a href="https://github.com/veritas-bank-system/Veritas-Gold-V1#-two-institutional-workspaces--complete-screen-tour">README</a>
</footer>
<script>
const DATA = ${JSON.stringify(shots)};
const q = (id) => document.getElementById(id);
const fP = q('fPersona'), fW = q('fWs'), fS = q('fSurf'), fA = q('fArea'), Q = q('q'), cnt = q('count');
function render(){
 const pv = fP.value, wv = fW.value, sv = fS.value, av = fA.value, term = Q.value.trim().toLowerCase();
 let shown = 0;
 DATA.forEach((s, i) => {
   const el = document.getElementById('card-' + i);
   if (!el) return;
   const ok = (!pv || s.personaId === pv) && (!wv || s.workspace === wv) && (!sv || s.surface === sv) && (!av || s.area === av)
     && (!term || (s.menuPoint + ' ' + s.sectionId + ' ' + s.desc + ' ' + s.personaName).toLowerCase().includes(term));
   el.style.display = ok ? '' : 'none';
   if (ok) shown++;
 });
 cnt.textContent = shown + ' / ' + DATA.length + ' captures shown';
 q('empty').hidden = shown > 0;
}
[fP,fW,fS,fA].forEach(x => x.addEventListener('change', render));
Q.addEventListener('input', render);
q('clear').addEventListener('click', () => { fP.value=fW.value=fS.value=fA.value=Q.value=''; render(); });
// build cards
const grid = q('grid');
DATA.forEach((s, i) => {
 const d = document.createElement('div');
 d.className = 'card'; d.id = 'card-' + i;
 const wsCls = s.workspace === 'Central Bank' ? 'cb' : s.workspace === 'Institutional' ? 'inst' : 'pre';
 const suCls = 'surface-' + (s.surface.toLowerCase().includes('tablet') ? 'tablet' : s.surface.toLowerCase().includes('mobile') ? 'mobile' : 'desktop');
 d.innerHTML =
  '<a class="thumb" href="' + s.img + '" target="_blank" rel="noopener">' +
    '<img loading="lazy" src="' + s.img + '" alt="' + s.file.replace(/"/g,'') + '" />' +
    '<span class="badge ' + suCls + '">' + s.surface + '</span>' +
  '</a>' +
  '<div class="meta">' +
    '<div class="t"><span class="m">' + s.menuPoint + '</span> <span class="sec">· ' + s.sectionId + '</span></div>' +
    '<span class="ws ' + wsCls + '">' + s.workspace + '</span>' +
    '<div class="who"><b>' + s.personaName + '</b>' + (s.personaInst ? ' · ' + s.personaInst : '') + '</div>' +
    '<p class="desc">' + s.desc + '</p>' +
  '</div>';
 grid.appendChild(d);
});
render();
</script>
</body>
</html>
`;

fs.writeFileSync(SITE_OUT, PAGE);
console.log(`init-site: wrote ${SITE_OUT} (${shots.length} shots, ${PAGE.length} bytes)`);

/* --------------------------------------- governance doc pages (same design) */
// Render docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md + docs/MENU-BUILD-BACKLOG.md
// into styled HTML (docs/*.html + docs/governance.html) so the Phase 0
// documents are browsable on the same site as the tour. Runs before --serve
// or via `npm run build:site`.
{
  const { execFileSync } = await import('node:child_process');
  const conv = path.join(REPO_ROOT, 'scripts', 'build-docs-pages.mjs');
  if (fs.existsSync(conv)) {
    try {
      execFileSync(process.execPath, [conv], { stdio: 'inherit', cwd: REPO_ROOT });
    } catch (e) {
      console.error('init-site: doc-page generation failed:', e.message);
    }
  }
}

/* -------------------------------------------------- optional dev server */
if (process.argv.includes('--serve') || argFlag('serve')) {
  const port = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 4173;
  const docRoot = REPO_ROOT; // serves /docs/index.html + /docs/screenshots/*
  http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let fp = path.join(docRoot, urlPath === '/' ? 'docs/index.html' : urlPath.replace(/^\/+/, ''));
    if (!fp.startsWith(docRoot)) { res.writeHead(403); return res.end(); }
    fs.readFile(fp, (err, buf) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      const ext = path.extname(fp);
      const mime = { '.html': 'text/html', '.png': 'image/png', '.json': 'application/json' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(buf);
    });
  }).listen(port, '127.0.0.1', () => console.log(`init-site: serving ${docRoot} on http://127.0.0.1:${port}/ (site at /docs/index.html)`));
}

function argFlag(name) {
  return process.argv.includes('--' + name);
}
