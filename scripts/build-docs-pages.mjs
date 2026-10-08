#!/usr/bin/env node
/**
 * build-docs-pages.mjs — render the Veritas Gold governance markdown documents
 * into styled HTML pages using the SAME design tokens as the screen-tour site
 * (docs/index.html built by init-site.mjs).
 *
 * No external markdown dependency: a small, purpose-built renderer for the
 * subset used by the two Phase 0 documents (headings, lists, tables, code
 * fences, bold/italic/inline-code, links, paragraphs).
 *
 * Output:
 *   docs/VERITAS-GOLD-MENU-SPECIFICATIONS.html
 *   docs/MENU-BUILD-BACKLOG.html
 *   docs/governance.html  (landing page linking both + the screen tour)
 *
 * Usage: node scripts/build-docs-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const DOCS = path.join(REPO_ROOT, 'docs');

const TARGETS = [
  { md: 'VERITAS-GOLD-MENU-SPECIFICATIONS.md', title: 'Menu Specifications — every menu point, page contract, and acceptance criteria', tag: 'Phase 0 · Governance' },
  { md: 'MENU-BUILD-BACKLOG.md', title: 'Menu Build Backlog — the master to-do list, phased P0–P5', tag: 'Phase 0 · Governance' },
];

/* --------------------------------------------------- tiny md renderer */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inlineMd(text, linkMap) {
  let out = esc(text);
  // links [label](url) — resolve relative .md links to their .html sibling
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
    const resolved = linkMap[url] ?? url;
    return `<a href="${resolved}">${label}</a>`;
  });
  // bold, italic, inline code
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}

function renderMarkdown(mdText, { title, tag }) {
  const lines = mdText.split('\n');
  const html = [];
  let inFence = false;
  let fenceBuf = [];
  let listStack = []; // 'ul' | 'ol' | 'task'
  let paraBuf = [];
  let tableBuf = [];

  const linkMap = {
    // resolve repo-relative .md links to their .html sibling (or GitHub for others)
  };
  const resolveLink = (url) => {
    if (url.endsWith('.md')) {
      const base = path.basename(url);
      if (TARGETS.some((t) => t.md === base)) return base.replace(/\.md$/, '.html');
      return `https://github.com/veritas-bank-system/Veritas-Gold-V1/blob/main/docs/${base}`;
    }
    if (url.startsWith('http') || url.startsWith('#')) return url;
    // relative path in repo → GitHub
    return `https://github.com/veritas-bank-system/Veritas-Gold-V1/blob/main/${url.replace(/^\.\.\//, '').replace(/^\//, '')}`;
  };

  const closeList = () => { while (listStack.length) { html.push(`</${listStack.pop()}>`); } };
  const closePara = () => { if (paraBuf.length) { html.push(`<p>${paraBuf.map((l) => inlineMd(l, resolveLink)).join('<br/>')}</p>`); paraBuf = []; } };
  const closeTable = () => {
    if (!tableBuf.length) return;
    const rows = tableBuf;
    tableBuf = [];
    // rows[1] is the separator row; drop it
    const header = rows[0];
    const body = rows.slice(2);
    const cells = (row) => row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    html.push('<div class="tblwrap"><table><thead><tr>');
    for (const c of cells(header)) html.push(`<th>${inlineMd(c, resolveLink)}</th>`);
    html.push('</tr></thead><tbody>');
    for (const row of body) {
      html.push('<tr>');
      for (const c of cells(row)) html.push(`<td>${inlineMd(c, resolveLink)}</td>`);
      html.push('</tr>');
    }
    html.push('</tbody></table></div>');
  };
  const closeAll = () => { closePara(); closeTable(); closeList(); };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    // fenced code
    if (line.startsWith('```')) {
      if (inFence) {
        html.push(`<pre><code>${esc(fenceBuf.join('\n'))}</code></pre>`);
        fenceBuf = [];
        inFence = false;
      } else {
        closeAll();
        inFence = true;
      }
      continue;
    }
    if (inFence) { fenceBuf.push(raw); continue; }

    // tables
    if (/^\s*\|.*\|\s*$/.test(line)) { closePara(); tableBuf.push(line.trim()); continue; }
    closeTable();

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeAll();
      const level = h[1].length;
      const text = inlineMd(h[2], resolveLink);
      if (level === 1) html.push(`<h1>${text}</h1>`);
      else if (level === 2) html.push(`<h2>${text}</h2>`);
      else if (level === 3) html.push(`<h3>${text}</h3>`);
      else if (level === 4) html.push(`<h4>${text}</h4>`);
      else html.push(`<h5>${text}</h5>`);
      continue;
    }

    // horizontal rule
    if (/^---+$/.test(line.trim())) { closeAll(); html.push('<hr/>'); continue; }

    // task-list items  - ✅ / - ⬜ / - 🚧
    const task = line.match(/^\s*-\s+\[( |x|X)\]\s+(.*)$/) || line.match(/^\s*-\s+([✅🚧⬜])\s+(.*)$/);
    if (task) {
      closePara(); closeTable();
      const done = task[1] === 'x' || task[1] === 'X' || task[1] === '✅';
      const doing = task[1] === '🚧';
      if (listStack[listStack.length - 1] !== 'task') { closeList(); html.push('<ul class="tasks">'); listStack.push('task'); }
      const cls = done ? 'done' : doing ? 'doing' : 'todo';
      const mark = done ? '✓' : doing ? '▸' : '○';
      html.push(`<li class="${cls}"><span class="mark">${mark}</span><span>${inlineMd(task[2], resolveLink)}</span></li>`);
      continue;
    }

    // plain list items
    const li = line.match(/^(\s*)-\s+(.*)$/);
    if (li) {
      closePara(); closeTable();
      const depth = Math.floor(li[1].length / 2);
      while (listStack.length > depth + (listStack[0] === 'task' ? 0 : 1) && listStack[listStack.length - 1] !== 'ul') { closeList(); }
      if (listStack.length <= depth) {
        // open nested ul as needed
        while (listStack.length < depth) { html.push('<ul>'); listStack.push('ul'); }
        if (listStack.length === depth || listStack.length === 0) { html.push('<ul>'); listStack.push('ul'); }
      }
      html.push(`<li>${inlineMd(li[2], resolveLink)}</li>`);
      continue;
    }
    closeList();

    // blank line
    if (!line.trim()) { closePara(); continue; }

    // paragraph continuation
    paraBuf.push(line);
  }
  // flush
  if (inFence) { html.push(`<pre><code>${esc(fenceBuf.join('\n'))}</code></pre>`); }
  closeAll();

  return PAGE_SHELL({ title, tag, body: html.join('\n') });
}

/* --------------------------------------------------- page shell (same design tokens) */
function PAGE_SHELL({ title, tag, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} · Veritas Gold V1</title>
<style>
 :root{--bg:#0b0a0d;--panel:#141118;--panel2:#1a1620;--line:#2a2331;--ink:#efe6f2;--mut:#9d92a8;--red:#ef4444;--gold:#d4af37;--violet:#8b5cf6}
 *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.6 -apple-system,'Segoe UI',Roboto,sans-serif}
 a{color:var(--red);text-decoration:none} a:hover{text-decoration:underline}
 header{padding:28px 32px 18px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#171219,#0b0a0d)}
 .brand{font:800 26px/1 'Segoe UI',sans-serif;letter-spacing:-.02em;margin:0 0 6px}
 .brand b{color:var(--red)} .tag{display:inline-block;margin-left:10px;font:700 10px/1.8 sans-serif;letter-spacing:.12em;color:#ffb1b1;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);border-radius:999px;padding:2px 10px;vertical-align:2px}
 header p{color:var(--mut);max-width:860px;margin:8px 0 0}
 .crumbs{font-size:12px;color:var(--mut);margin-top:10px}
 .crumbs a{color:var(--gold)}
 main{max-width:980px;margin:0 auto;padding:28px 32px 80px}
 h1{font:800 30px/1.2 'Segoe UI',sans-serif;letter-spacing:-.02em;margin:18px 0 14px;color:var(--ink);border-bottom:2px solid var(--line);padding-bottom:10px}
 h2{font:800 20px/1.3 'Segoe UI',sans-serif;margin:32px 0 10px;color:var(--gold);border-bottom:1px solid var(--line);padding-bottom:6px}
 h3{font:700 16px/1.3 'Segoe UI',sans-serif;margin:22px 0 8px;color:var(--ink)}
 h4{font:700 14px/1.3 'Segoe UI',sans-serif;margin:18px 0 6px;color:var(--violet)}
 h5{font:700 13px/1.3 'Segoe UI',sans-serif;margin:14px 0 6px;color:var(--mut)}
 p{margin:8px 0;color:#cfc4d8;max-width:820px}
 ul{margin:6px 0 12px;padding-left:22px;color:#cfc4d8}
 ul ul{margin-top:4px}
 li{margin:4px 0}
 ul.tasks{list-style:none;padding-left:0}
 ul.tasks li{display:flex;gap:10px;align-items:flex-start;padding:5px 8px;border-radius:8px}
 ul.tasks li:hover{background:var(--panel2)}
 ul.tasks li.done .mark{color:#34d399;font-weight:800}
 ul.tasks li.doing .mark{color:var(--gold);font-weight:800}
 ul.tasks li.todo .mark{color:var(--mut)}
 ul.tasks li.done{color:var(--mut)}
 ul.tasks li.doing{color:var(--ink)}
 code{font:12.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--panel2);border:1px solid var(--line);border-radius:5px;padding:1px 6px;color:var(--gold)}
 pre{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;overflow:auto;margin:12px 0}
 pre code{background:none;border:none;padding:0;color:#d9cfdf}
 .tblwrap{overflow-x:auto;margin:12px 0}
 table{border-collapse:collapse;width:100%;font-size:13px}
 th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top}
 th{background:var(--panel2);color:var(--gold);font-weight:700;white-space:nowrap}
 tr:nth-child(even) td{background:rgba(20,17,24,.5)}
 hr{border:none;border-top:1px solid var(--line);margin:24px 0}
 footer{padding:18px 32px 40px;border-top:1px solid var(--line);color:var(--mut);font-size:12px}
 @media(max-width:640px){header,main,footer{padding-left:16px;padding-right:16px}}
</style>
</head>
<body>
<header>
 <h1 class="brand">VERITAS <b>GOLD</b> <span style="color:var(--mut);font-weight:600;font-size:15px">· Governance Docs</span><span class="tag">${esc(tag)}</span></h1>
 <p>${esc(title)}</p>
 <div class="crumbs">
   <a href="governance.html">← Governance landing</a> ·
   <a href="index.html">Screen tour</a> ·
   <a href="https://github.com/veritas-bank-system/Veritas-Gold-V1">repo</a>
 </div>
</header>
<main>
${body}
</main>
<footer>
 Veritas Gold V1 · generated from Markdown by scripts/build-docs-pages.mjs ·
 <a href="https://github.com/veritas-bank-system/Veritas-Gold-V1">repo</a>
</footer>
</body>
</html>
`;
}

/* --------------------------------------------------- governance landing page */
function buildLanding() {
  const cards = TARGETS.map((t) => {
    const htmlName = t.md.replace(/\.md$/, '.html');
    const lines = fs.readFileSync(path.join(DOCS, t.md), 'utf8').split('\n');
    const h2s = lines.filter((l) => l.startsWith('## ')).map((l) => l.replace(/^##\s+/, ''));
    const lis = h2s.map((s) => `<li>${esc(s)}</li>`).join('');
    return `
<section class="card">
  <h2><a href="${htmlName}">${esc(t.md.replace(/\.md$/, ''))}</a></h2>
  <p class="desc">${esc(t.title)}</p>
  <details><summary>Sections (${h2s.length})</summary><ul>${lis}</ul></details>
</section>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Veritas Gold V1 — Governance Documents</title>
<style>
 :root{--bg:#0b0a0d;--panel:#141118;--panel2:#1a1620;--line:#2a2331;--ink:#efe6f2;--mut:#9d92a8;--red:#ef4444;--gold:#d4af37;--violet:#8b5cf6}
 *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.6 -apple-system,'Segoe UI',Roboto,sans-serif}
 a{color:var(--red);text-decoration:none} a:hover{text-decoration:underline}
 header{padding:28px 32px 18px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#171219,#0b0a0d)}
 .brand{font:800 26px/1 'Segoe UI',sans-serif;letter-spacing:-.02em;margin:0 0 6px}
 .brand b{color:var(--red)} .tag{display:inline-block;margin-left:10px;font:700 10px/1.8 sans-serif;letter-spacing:.12em;color:#ffb1b1;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);border-radius:999px;padding:2px 10px;vertical-align:2px}
 header p{color:var(--mut);max-width:860px;margin:8px 0 0}
 main{max-width:980px;margin:0 auto;padding:28px 32px 80px}
 .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin:0 0 20px}
 .card h2{margin:0 0 8px;font:800 19px/1.3 'Segoe UI',sans-serif}
 .card h2 a{color:var(--gold)}
 .desc{color:#cfc4d8;margin:0 0 12px}
 details{color:var(--mut)} summary{cursor:pointer;color:var(--violet);font-weight:600;font-size:13px}
 details ul{margin:8px 0 0;padding-left:20px;font-size:13px}
 footer{padding:18px 32px 40px;border-top:1px solid var(--line);color:var(--mut);font-size:12px}
</style>
</head>
<body>
<header>
 <h1 class="brand">VERITAS <b>GOLD</b> <span style="color:var(--mut);font-weight:600;font-size:15px">· Governance Docs</span><span class="tag">PHASE 0</span></h1>
 <p>The source-of-truth catalogue and build programme behind every Veritas Gold menu point — rendered in the same design language as the screen tour.</p>
</header>
<main>
${cards}
<section class="card">
  <h2><a href="index.html">Screen Tour — 83 captures</a></h2>
  <p class="desc">Every screen of both workspaces across Desktop / Tablet / Mobile surfaces, with all seven personas.</p>
</section>
<section class="card">
  <h2><a href="https://github.com/veritas-bank-system/Veritas-Gold-V1">Source repo — veritas-bank-system/Veritas-Gold-V1</a></h2>
  <p class="desc">Markdown originals live under <code>docs/</code>; this page is generated by <code>scripts/build-docs-pages.mjs</code>.</p>
</section>
</main>
<footer>
 Veritas Gold V1 · governance landing · generated by scripts/build-docs-pages.mjs
</footer>
</body>
</html>
`;
}

/* --------------------------------------------------- run */
let written = 0;
for (const t of TARGETS) {
  const mdPath = path.join(DOCS, t.md);
  if (!fs.existsSync(mdPath)) { console.error(`build-docs-pages: missing ${mdPath}`); process.exit(1); }
  const mdText = fs.readFileSync(mdPath, 'utf8');
  const outName = t.md.replace(/\.md$/, '.html');
  const html = renderMarkdown(mdText, { title: t.title, tag: t.tag });
  fs.writeFileSync(path.join(DOCS, outName), html);
  console.log(`build-docs-pages: wrote docs/${outName} (${html.length} bytes)`);
  written++;
}
fs.writeFileSync(path.join(DOCS, 'governance.html'), buildLanding());
console.log(`build-docs-pages: wrote docs/governance.html`);
console.log(`build-docs-pages: ${written + 1} pages generated`);
