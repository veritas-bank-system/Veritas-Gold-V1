#!/usr/bin/env node
/**
 * capture-tour.mjs — one-command regeneration of the Veritas UI tour.
 *
 * Captures: the workspace chooser, both workspace logins, both persona-switcher
 * overlays, every sidebar menu point of both workspaces (desktop), the Tablet
 * (iPad) surface of both workspaces, the Mobile (iPhone) surface incl. the
 * mobile-only MVP verification and Master Dashboard Radar, and every admitted
 * persona per workspace. Then writes:
 *
 *   Veritas/docs/screenshots/*.png        85 shots (79 legacy + 4 tablet)
 *   Veritas/docs/screenshots/manifest.json  per-shot metadata used by
 *                                           site/index.html init-site.mjs
 *   Veritas/docs/screenshots/capture-tour.log.txt  click/shot audit trail
 *
 * Prereqs:
 *   - google-chrome (headless, /usr/bin/google-chrome or CHROME_BIN)
 *   - vite dev server on 127.0.0.1:5175 (npm run dev -- --port 5175)
 *   - optional: canister suite on :8080 for live back-end data
 *
 * Usage:
 *   cd Veritas/scripts
 *   npm run capture:tour                     # defaults, CDP port 9225
 *   node capture-tour.mjs --cdp-port=9226    # parallel run / port busy
 *
 * Node 22+ (built-in WebSocket + fetch; no playwright, no npm deps).
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------- CLI args */
const argMap = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) argMap[m[1]] = m[2] === undefined ? true : m[2];
}
const CDP_PORT = Number(argMap['cdp-port'] || 9225);
const FRONT_URL = argMap.front || 'http://127.0.0.1:5175';
const SHOT_ROOT = path.join(__dirname, '..', 'docs', 'screenshots');
const LOG_PATH = path.join(SHOT_ROOT, 'capture-tour.log.txt');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------- viewport presets */
const DESKTOP = { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false };
const PHONE = { width: 412, height: 915, deviceScaleFactor: 1, mobile: true };

/* ------------------------------------------------------------- metadata */
const FLAG_CB = { id: 'persona_cb_governor', persona: 'Central Bank Operator & Governor' };
const FLAG_INST = { id: 'persona_comm_treasury', persona: 'Commercial Bank Treasury & Primary Dealer' };
const P_CB = 'Central Bank';
const P_INST = 'Institutional';

function meta(file, surface, workspace, pm, menuPoint, sectionId, description) {
  return {
    file,
    surface,
    workspace,
    persona_id: pm ? pm.id : null,
    persona: pm ? pm.persona : null,
    menu_point: menuPoint,
    section_id: sectionId,
    description,
  };
}

/* Central Bank desktop sidebar tour — 29 menu points, tour order. */
const CB_TOUR = [
  ['cb_dashboard', 'Executive Dashboard', 'central-bank/01-executive-dashboard.png'],
  ['governance', 'Tasks & Approvals', 'central-bank/02-tasks-and-approvals.png'],
  ['support', 'Notifications', 'central-bank/03-notifications.png'],
  ['portfolio', 'Reserve Overview', 'central-bank/04-reserve-overview.png'],
  ['vault', 'Gold & Bullion', 'central-bank/05-gold-and-bullion.png'],
  ['terminal', 'Government Bonds', 'central-bank/06-government-bonds.png'],
  ['interoperability', 'FX & Money Markets', 'central-bank/07-fx-and-money-markets.png'],
  ['liquidity_pools', 'Portfolio Management', 'central-bank/08-portfolio-management.png'],
  ['sweeper', 'Liquidity Management', 'central-bank/09-liquidity-management.png'],
  ['settlement_instruments', 'Settlement Accounts', 'central-bank/10-settlement-accounts.png'],
  ['vault_telemetry', 'Custody & Vaults', 'central-bank/11-custody-and-vaults.png'],
  ['notaries', 'Settlement Monitor', 'central-bank/12-settlement-monitor.png'],
  ['iso20022_bridge', 'Payments & ISO 20022', 'central-bank/13-payments-and-iso-20022.png'],
  ['logs', 'Reconciliation', 'central-bank/14-reconciliation.png'],
  ['trade', 'Delivery & Transfers', 'central-bank/15-delivery-and-transfers.png'],
  ['compliance', 'Risk Dashboard', 'central-bank/16-risk-dashboard.png'],
  ['cb_limits', 'Exposure & Limits', 'central-bank/17-exposure-and-limits.png'],
  ['identity_admin', 'Counterparties', 'central-bank/18-counterparties.png'],
  ['cb_stress', 'Stress Testing', 'central-bank/19-stress-testing.png'],
  ['cb_compliance_dash', 'Compliance Dashboard', 'central-bank/20-compliance-dashboard.png'],
  ['statements_gl', 'Statements & GL', 'central-bank/21-statements-and-gl.png'],
  ['cb_valuation', 'Valuation & P&L', 'central-bank/22-valuation-and-pandl.png'],
  ['cb_reg_reports', 'Regulatory Reports', 'central-bank/23-regulatory-reports.png'],
  ['cb_audit', 'Audit Center', 'central-bank/24-audit-center.png'],
  ['enterprise_admin', 'Institutions', 'central-bank/25-institutions.png'],
  ['identity_admin', 'Users & Roles', 'central-bank/26-users-and-roles.png'],
  ['cb_mandates', 'Mandates & Policies', 'central-bank/27-mandates-and-policies.png'],
  ['secure_chat', 'Access Logs', 'central-bank/28-access-logs.png'],
  ['canister_mgmt', 'System Configuration', 'central-bank/29-system-configuration.png'],
];

/* Institutional desktop sidebar tour — 34 menu points, tour order. */
const INST_TOUR = [
  ['inst_dashboard', 'Bank Dashboard', 'institutional/01-bank-dashboard.png'],
  ['trader_desk', 'Client Orders', 'institutional/02-client-orders.png'],
  ['trade', 'RFQ Inbox', 'institutional/03-rfq-inbox.png'],
  ['governance', 'Tasks & Approvals', 'institutional/04-tasks-and-approvals.png'],
  ['support', 'Notifications', 'institutional/05-notifications.png'],
  ['vault', 'Gold Market', 'institutional/06-gold-market.png'],
  ['terminal', 'Government Bonds', 'institutional/07-government-bonds.png'],
  ['interoperability', 'FX & Money Markets', 'institutional/08-fx-and-money-markets.png'],
  ['liquidity_pools', 'Market Making', 'institutional/09-market-making.png'],
  ['auctions', 'Auctions', 'institutional/10-auctions.png'],
  ['portfolio', 'Cash & Liquidity', 'institutional/11-cash-and-liquidity.png'],
  ['inst_inventory', 'Inventory & Positions', 'institutional/12-inventory-and-positions.png'],
  ['settlement_instruments', 'Settlement Accounts', 'institutional/13-settlement-accounts.png'],
  ['sweeper', 'Funding', 'institutional/14-funding.png'],
  ['inst_repo', 'Repo & Reverse Repo', 'institutional/15-repo-and-reverse-repo.png'],
  ['inst_gold_loans', 'Gold Loans & Leases', 'institutional/16-gold-loans-and-leases.png'],
  ['inst_sec_lending', 'Securities Lending', 'institutional/17-securities-lending.png'],
  ['collateral', 'Collateral Desk', 'institutional/18-collateral-desk.png'],
  ['notaries', 'Settlement Monitor', 'institutional/19-settlement-monitor.png'],
  ['vault_telemetry', 'Custody', 'institutional/20-custody.png'],
  ['iso20022_bridge', 'Payments & ISO 20022', 'institutional/21-payments-and-iso-20022.png'],
  ['logs', 'Reconciliation', 'institutional/22-reconciliation.png'],
  ['corporate_actions', 'Delivery & Transfers', 'institutional/23-delivery-and-transfers.png'],
  ['inst_limits', 'Risk & Limits', 'institutional/24-risk-and-limits.png'],
  ['identity_admin', 'Counterparties', 'institutional/25-counterparties.png'],
  ['compliance', 'Compliance', 'institutional/26-compliance.png'],
  ['inst_margin', 'Margin & Collateral', 'institutional/27-margin-and-collateral.png'],
  ['inst_surveillance', 'Surveillance', 'institutional/28-surveillance.png'],
  ['inst_pnl', 'P&L and Valuation', 'institutional/29-pandl-and-valuation.png'],
  ['inst_client_stmts', 'Client Statements', 'institutional/30-client-statements.png'],
  ['cb_reg_reports', 'Regulatory Reports', 'institutional/31-regulatory-reports.png'],
  ['cb_audit', 'Audit', 'institutional/32-audit.png'],
  ['enterprise_admin', 'Users & Roles', 'institutional/33-users-and-roles.png'],
  ['inst_apis', 'APIs & Integrations', 'institutional/34-apis-and-integrations.png'],
];

/* Descriptions parsed from README.md tables (last table cell of the row). */
const README_DESC = (() => {
  const map = {};
  try {
    const md = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
    for (const line of md.split('\n')) {
      const m = line.match(/docs\/screenshots\/([A-Za-z0-9/_.-]+\.png)/);
      if (!m) continue;
      const cells = line.split(' | ').map((c) => c.trim().replace(/^\|/, '').trim());
      const desc = cells[cells.length - 1].replace(/\|$/, '').trim();
      if (desc) map[m[1]] = desc;
    }
  } catch { /* missing README → fallbacks */ }
  return map;
})();

const manifest = [];
let logStream;

/* ----------------------------------------------------------- chrome/CDP */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => this._onMessage(ev.data));
  }
  static connect(wsu) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsu);
      ws.onopen = () => resolve(new Cdp(ws));
      ws.onerror = () => reject(new Error('ws connect failed: ' + wsu));
    });
  }
  send(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  _onMessage(raw) {
    const msg = JSON.parse(raw);
    if (msg.id && this.pending.has(msg.id)) {
      const p = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message || 'CDP error'));
      else p.resolve(msg.result);
    }
  }
  close() {
    try { this.ws.close(); } catch { /* noop */ }
  }
}

let chromeProc = null;
let cdpRef = null;

async function startChrome() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'veritas-shots-'));
  const args = [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1600,1000',
    `--user-data-dir=${profile}`,
    'about:blank',
  ];
  console.log(`[chrome] headless on CDP :${CDP_PORT}`);
  chromeProc = spawn(process.env.CHROME_BIN || '/usr/bin/google-chrome', args, { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(1000) });
      if (r.ok) return;
    } catch { /* retry */ }
    await sleep(250);
  }
  throw new Error('chrome did not come up');
}

async function pageTargetWs() {
  const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`, { signal: AbortSignal.timeout(3000) });
  const list = await r.json();
  const page = list.find((t) => t.type === 'page');
  if (!page) throw new Error('no CDP page target');
  return page.webSocketDebuggerUrl;
}

/* ---------------------------------------------------------- page helpers */
const CLICK_JS = (pat) => `(() => {
  const els = [...document.querySelectorAll('button, a, [role="button"], .card-interactive')];
  const txt = (e) => (e.textContent || '').trim();
  const el = els.find(e => txt(e) === ${JSON.stringify(pat)}) || els.find(e => txt(e).includes(${JSON.stringify(pat)}));
  if (!el) return null;
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return txt(el).slice(0, 90);
})()`;

async function clickButton(cdp, pat) {
  const r = await cdp.send('Runtime.evaluate', { expression: CLICK_JS(pat), returnByValue: true });
  const matched = r && r.result && r.result.value;
  if (!matched) throw new Error('no clickable matching "' + pat + '"');
  logStream.write(`click "${pat}" -> ${matched}\n`);
  return matched;
}

async function shot(cdp, m, settle) {
  await sleep(settle === undefined ? 800 : settle);
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const buf = Buffer.from(r.data, 'base64');
  const p = path.join(SHOT_ROOT, m.file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf);
  m.bytes = buf.length;
  manifest.push(m);
  logStream.write(`shot ${m.file} (${buf.length} bytes)\n`);
  console.log(`[shot ${manifest.length}] ${m.file}`);
}

async function setViewport(cdp, m) {
  await cdp.send('Emulation.setDeviceMetricsOverride', m);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: !!m.mobile });
}

/* --------------------------------------------------------------- flows */
const SETTLE_AUTH = 4600;       // login / switch-persona animation + toasts
const SETTLE_DASH = 1200;       // post-redirect dashboard paint

async function loginAs(cdp, workspaceCta, pm) {
  await clickButton(cdp, workspaceCta);
  await sleep(700);
  await clickButton(cdp, 'Authorize & Launch');
  await sleep(SETTLE_AUTH);
  await setViewport(cdp, DESKTOP);
  await sleep(SETTLE_DASH);
  void pm;
}

async function evalValue(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  return r && r.result && r.result.value;
}

/** Open the persona switcher from a running dashboard; verify persona cards exist. */
async function openSwitcher(cdp) {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) console.log('[switcher] retrying open');
    await clickButton(cdp, 'Switch Persona');
    await sleep(1000);
    const count = await evalValue(cdp, `document.querySelectorAll('.card-interactive').length`);
    if (count && count >= 2) return;
  }
  throw new Error('persona switcher overlay did not open (no .card-interactive)');
}

/** From an OPEN switcher: pick the card whose text includes roleTitle. */
async function pickPersonaCard(cdp, want) {
  const pickJs = `(() => {
  const cards = [...document.querySelectorAll('.card-interactive')];
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const hit = cards.find(c => norm(c.textContent).includes(${JSON.stringify(want)}));
  if (!hit) return { ok: false, available: cards.map(c => norm(c.textContent).slice(0, 80)) };
  hit.scrollIntoView({ block: 'center', behavior: 'instant' });
  hit.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return { ok: true };
})()`;
  const r = await evalValue(cdp, pickJs);
  if (!r || !r.ok) {
    throw new Error('persona card not found: ' + want + ' | available: ' + JSON.stringify(r && r.available));
  }
  logStream.write('persona-pick "' + want + '"\n');
}

/** On an OPEN switcher: pick a persona card, authorize, settle. */
async function pickPersonaFromOpen(cdp, roleTitle) {
  await pickPersonaCard(cdp, roleTitle);
  await sleep(500);
  await clickButton(cdp, 'Authorize & Launch');
  await sleep(SETTLE_AUTH);
  await setViewport(cdp, DESKTOP);
  await sleep(1000);
}

/** From a running dashboard: open the switcher, then pick. */
async function switchPersonaTo(cdp, roleTitle) {
  await openSwitcher(cdp);
  await pickPersonaFromOpen(cdp, roleTitle);
}

async function tourSidebar(cdp, rows, area, pm, surface) {
  for (const [id, label, file] of rows) {
    await clickButton(cdp, label);
    await sleep(1000);
    await shot(cdp, meta(file, surface, area, pm, label, id,
      README_DESC[file] || `${label} — captured from the workspace sidebar tour.`), 500);
  }
}

/* --------------------------------------------------------------- tour */
async function runTour(cdp) {
  /* 0. chooser */
  // The veritasbank.org landing gate sits at bare `/`; the tour captures the
  // Gold platform, so it deep-links past the gate via ?entry=gold.
  await cdp.send('Page.navigate', { url: FRONT_URL + '/?entry=gold' });
  await sleep(1600);
  await setViewport(cdp, DESKTOP);
  await shot(cdp, meta('auth/00-workspace-chooser.png', 'Desktop Workstation', null, null, 'Workspace Chooser', null,
    'Entry gate: Sovereign (Central Bank) vs Wholesale (Institutional) tier cards. The selection decides navigation, permissions, limits, data scope and approval rules.'), 600);

  /* 1. CB desktop tour (29) */
  await clickButton(cdp, 'Enter Central Bank Workspace');
  await sleep(700);
  await shot(cdp, meta('auth/01-central-bank-login-governor.png', 'Desktop Workstation', P_CB, FLAG_CB, 'Login Gate', null,
    'GOLD-branded login for the Central Bank workspace: flagship Governor preselected, 3 admitted roles, environment and auth-protocol selectors.'), 500);
  await clickButton(cdp, 'Authorize & Launch');
  await sleep(SETTLE_AUTH);
  await setViewport(cdp, DESKTOP);
  await sleep(SETTLE_DASH);
  await tourSidebar(cdp, CB_TOUR, P_CB, FLAG_CB, 'Desktop Workstation');

  /* 2. CB tablet (iPad) */
  await clickButton(cdp, 'Tablet (iPad)');
  await sleep(1600);
  await shot(cdp, meta('tablet/central-bank-home.png', 'Tablet (iPad)', P_CB, FLAG_CB, 'Home Dashboard', 'cb_dashboard',
    'VERITAS MOBILE runtime rendered inside the iPad device frame: Central Bank workspace home with scoped quick actions and bottom navigation.'), 900);
  await clickButton(cdp, 'Menu');
  await sleep(800);
  await shot(cdp, meta('tablet/central-bank-drawer.png', 'Tablet (iPad)', P_CB, FLAG_CB, 'Menu Drawer', null,
    'Full categorized mobile menu drawer scoped to the Central Bank workspace, rendered on the Tablet (iPad) surface.'), 500);

  /* 3. CB mobile (iPhone) */
  await clickButton(cdp, 'Mobile (iPhone)'); // remounts component => drawer closed, home state
  await sleep(1200);
  await setViewport(cdp, PHONE);
  await sleep(400);
  await shot(cdp, meta('mobile/central-bank-home.png', 'Mobile (iPhone)', P_CB, FLAG_CB, 'Home Dashboard', 'cb_dashboard',
    'VERITAS MOBILE home for the Central Bank workspace with scoped quick actions.'), 700);
  await clickButton(cdp, 'Menu');
  await sleep(800);
  await shot(cdp, meta('mobile/central-bank-drawer.png', 'Mobile (iPhone)', P_CB, FLAG_CB, 'Menu Drawer', null,
    'Full categorized mobile menu (Workspace & Master Radar, Accounts & Cash, Markets & Asset Issuance, …) scoped to the CB workspace.'), 500);
  await clickButton(cdp, '⚡ Live MVP Verification');
  await sleep(2400);
  await shot(cdp, meta('mobile/live-mvp-verification.png', 'Mobile (iPhone)', P_CB, FLAG_CB, 'Live MVP Verification', 'mvp_verification',
    '⚡ 6/6 live invariant test suite: conservation of value, notary consensus and settlement invariants.'), 500);
  // The MVP view has no hamburger; reset through a fresh page load.
  await cdp.send('Page.navigate', { url: FRONT_URL + '/?entry=gold' });
  await sleep(1600);
  await clickButton(cdp, 'Enter Central Bank Workspace');
  await sleep(700);
  await clickButton(cdp, 'Authorize & Launch');
  await sleep(SETTLE_AUTH);
  await setViewport(cdp, DESKTOP);
  await clickButton(cdp, 'Mobile (iPhone)');
  await sleep(1000);
  await setViewport(cdp, PHONE);
  await clickButton(cdp, 'Menu');
  await sleep(800);
  await clickButton(cdp, '👑 Master Dashboard Radar');
  await sleep(2400);
  await shot(cdp, meta('mobile/master-dashboard-radar.png', 'Mobile (iPhone)', P_CB, FLAG_CB, 'Master Dashboard Radar', 'admin_overview',
    '👑 Master radar dashboard — global participant and liquidity monitoring.'), 500);
  await clickButton(cdp, 'Workstation'); // 'Desktop Workstation' in top bar
  await sleep(1200);
  await setViewport(cdp, DESKTOP);
  await clickButton(cdp, 'Logout');
  await sleep(1200);

  /* 4. Institutional desktop tour (34) */
  await clickButton(cdp, 'Enter Institutional Workspace');
  await sleep(700);
  await shot(cdp, meta('auth/02-institutional-login-treasury.png', 'Desktop Workstation', P_INST, FLAG_INST, 'Login Gate', null,
    'Same login contract for the Commercial Bank/Agency workspace with its 4 admitted roles and Primary Dealer flagship.'), 500);
  await clickButton(cdp, 'Authorize & Launch');
  await sleep(SETTLE_AUTH);
  await setViewport(cdp, DESKTOP);
  await sleep(SETTLE_DASH);
  await tourSidebar(cdp, INST_TOUR, P_INST, FLAG_INST, 'Desktop Workstation');

  /* 5. Institutional tablet */
  await clickButton(cdp, 'Tablet (iPad)');
  await sleep(1600);
  await shot(cdp, meta('tablet/institutional-home.png', 'Tablet (iPad)', P_INST, FLAG_INST, 'Home Dashboard', 'inst_dashboard',
    'VERITAS MOBILE runtime inside the iPad device frame for the Commercial Bank/Agency workspace: treasury home with quick group.'), 900);
  await clickButton(cdp, 'Menu');
  await sleep(800);
  await shot(cdp, meta('tablet/institutional-drawer.png', 'Tablet (iPad)', P_INST, FLAG_INST, 'Menu Drawer', null,
    'Institutional mobile drawer on the Tablet (iPad) surface: Bank Dashboard, Client Orders, RFQ Inbox, Gold Market, Repo & Collateral quick links.'), 500);
  await clickButton(cdp, 'Workstation');
  await sleep(1200);

  /* 5b. Institutional mobile (iPhone) */
  await clickButton(cdp, 'Mobile (iPhone)'); // remount => home state, drawer closed
  await sleep(1200);
  await setViewport(cdp, PHONE);
  await sleep(400);
  await shot(cdp, meta('mobile/institutional-home.png', 'Mobile (iPhone)', P_INST, FLAG_INST, 'Home Dashboard', 'inst_dashboard',
    'VERITAS MOBILE home for the Commercial Bank/Agency workspace (Treasury quick group).'), 700);
  await clickButton(cdp, 'Menu');
  await sleep(800);
  await shot(cdp, meta('mobile/institutional-drawer.png', 'Mobile (iPhone)', P_INST, FLAG_INST, 'Menu Drawer', null,
    'Institutional mobile drawer with Bank Dashboard / Client Orders / RFQ / Gold Market / Repo & Collateral quick links.'), 500);
  await setViewport(cdp, DESKTOP);
  await clickButton(cdp, 'Logout');
  await sleep(1200);

  /* 6. CB persona row: switcher overlay + 2 personas */
  await clickButton(cdp, 'Enter Central Bank Workspace');
  await sleep(700);
  await clickButton(cdp, 'Authorize & Launch');
  await sleep(SETTLE_AUTH);
  await setViewport(cdp, DESKTOP);
  await sleep(SETTLE_DASH);

  await clickButton(cdp, 'Switch Persona');
  await sleep(800);
  await shot(cdp, meta('auth/03-central-bank-persona-switcher.png', 'Desktop Workstation', P_CB, FLAG_CB, 'Switch Persona', null,
    'Full-screen re-authentication overlay listing the 3 admitted Central Bank roles (Super Admin, Governor, Supervisory Auditor) with clearance levels.'), 500);
  await pickPersonaFromOpen(cdp, 'Platform Super Admin & Operator');
  await shot(cdp, meta('central-bank/30-persona-super-admin.png', 'Desktop Workstation', P_CB,
    { id: 'persona_super_admin', persona: 'Platform Super Admin & Operator' }, 'Executive Dashboard', 'cb_dashboard',
    'Platform-root master session: NOC identity in the context bar, master-operator clearance ribbon, full console reach.'), 1600);
  await switchPersonaTo(cdp, 'Supervisory & Compliance Auditor');
  await shot(cdp, meta('central-bank/31-persona-supervisory-auditor.png', 'Desktop Workstation', P_CB,
    { id: 'persona_supervisory_auditor', persona: 'Supervisory & Compliance Auditor' }, 'Executive Dashboard', 'cb_dashboard',
    'Read-only supervisory session (Level 5 Zero-Knowledge Audit) over the reserve console.'), 1600);
  await clickButton(cdp, 'Logout');
  await sleep(1200);

  /* 7. Institutional persona row: switcher overlay + 3 personas */
  await clickButton(cdp, 'Enter Institutional Workspace');
  await sleep(700);
  await clickButton(cdp, 'Authorize & Launch');
  await sleep(SETTLE_AUTH);
  await setViewport(cdp, DESKTOP);
  await sleep(SETTLE_DASH);

  await clickButton(cdp, 'Switch Persona');
  await sleep(800);
  await shot(cdp, meta('auth/04-institutional-persona-switcher.png', 'Desktop Workstation', P_INST, FLAG_INST, 'Switch Persona', null,
    'Same overlay for the institutional workspace listing its 4 admitted roles (Treasury, Custodian, DMO, Asset Manager).'), 500);
  await pickPersonaFromOpen(cdp, 'Sovereign Debt Issuer / DMO Lead');
  await shot(cdp, meta('institutional/35-persona-issuer-dmo.png', 'Desktop Workstation', P_INST,
    { id: 'persona_issuer_dmo', persona: 'Sovereign Debt Issuer / DMO Lead' }, 'Bank Dashboard', 'inst_dashboard',
    'Sovereign Debt Management Office session (Level 4 Debt Placement Lead) over the trading console.'), 1600);
  await switchPersonaTo(cdp, 'Qualified Custodian & Vault Notary');
  await shot(cdp, meta('institutional/36-persona-custodian-vault.png', 'Desktop Workstation', P_INST,
    { id: 'persona_custodian_vault', persona: 'Qualified Custodian & Vault Notary' }, 'Bank Dashboard', 'inst_dashboard',
    'Physical-title custody session at Zurich Swiss Bullion Custody AG over the institutional console.'), 1600);
  await switchPersonaTo(cdp, 'Institutional Asset Manager / PE Fund');
  await shot(cdp, meta('institutional/37-persona-fund-asset-mgr.png', 'Desktop Workstation', P_INST,
    { id: 'persona_fund_asset_mgr', persona: 'Institutional Asset Manager / PE Fund' }, 'Bank Dashboard', 'inst_dashboard',
    'Accredited asset-manager session (BlackRock / Veritas Institutional Alpha Fund) over the institutional console.'), 1600);
}

/* --------------------------------------------------------------- main */
async function main() {
  console.log(`[tour] front=${FRONT_URL} cdp=${CDP_PORT}`);
  fs.mkdirSync(SHOT_ROOT, { recursive: true });
  logStream = fs.createWriteStream(LOG_PATH, { flags: 'w' });

  const cdpResult = await runWithChrome();
  fs.writeFileSync(
    path.join(SHOT_ROOT, 'manifest.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), shot_count: manifest.length, shots: manifest }, null, 2) + '\n',
  );
  logStream.end();
  console.log(`[tour] done — ${manifest.length} shots, manifest.json + capture-tour.log.txt written`);
  return cdpResult;
}

async function runWithChrome() {
  await startChrome();
  cdpRef = await Cdp.connect(await pageTargetWs());
  await cdpRef.send('Page.enable');
  await cdpRef.send('Runtime.enable');
  try {
    await runTour(cdpRef);
  } finally {
    cdpRef.close();
    if (chromeProc && chromeProc.exitCode === null) {
      try { chromeProc.kill('SIGTERM'); } catch { /* noop */ }
    }
  }
}

main().catch((e) => {
  console.error('[tour] FATAL:', e);
  process.exitCode = 1;
});
