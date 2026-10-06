import React, { useState } from 'react';
import {
  InstitutionContextBar,
  DetailDrawer,
  ApprovalDialog,
  type DrawerSection,
  type StatusTone,
} from '../contract/ContractKit';
import {
  ShieldCheck,
  AlertTriangle,
  CheckSquare,
  FileText,
  Activity,
  Gavel,
  Scale,
  TrendingUp,
  Droplets,
  Boxes,
  Landmark,
  Key,
  ChevronRight,
  Globe,
  Timer,
  Waves,
} from 'lucide-react';
import type {
  DemandDepositRecord,
  FungibleAssetHolding,
  MarketRate,
  RwaOffer,
  BondAuction,
  PendingApproval,
  CollateralPosition,
  WorkspaceId,
} from '../../types';

export interface WorkspaceDashboardProps {
  accounts: DemandDepositRecord[];
  holdings: FungibleAssetHolding[];
  rates: MarketRate[];
  offers: RwaOffer[];
  auctions: BondAuction[];
  approvals: PendingApproval[];
  collateral: CollateralPosition[];
  workspace: WorkspaceId;
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  onNavigate: (section: any) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

/* ---------------- Accent system (subtle per-workspace treatment) ---------------- */

const WORKSPACE_ACCENT: Record<
  WorkspaceId,
  { primary: string; soft: string; border: string; glow: string; label: string; name: string }
> = {
  central_bank: {
    primary: '#EF4444',
    soft: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.45)',
    glow: 'rgba(239, 68, 68, 0.25)',
    label: 'RESERVE & POLICY CONSOLE',
    name: 'Central Bank Workspace',
  },
  institutional: {
    primary: '#8B5CF6',
    soft: 'rgba(139, 92, 246, 0.14)',
    border: 'rgba(139, 92, 246, 0.45)',
    glow: 'rgba(139, 92, 246, 0.25)',
    label: 'TREASURY & TRADING CONSOLE',
    name: 'Institutional Workspace',
  },
};

const fmtEur = (n: number) =>
  '€' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------------- Shared stat card ---------------- */

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: any;
  accent: { primary: string; soft: string; border: string };
  alert?: boolean;
}> = ({ label, value, sub, icon: Icon, accent, alert }) => (
  <div
    style={{
      backgroundColor: '#0e0a12',
      border: `1px solid ${alert ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
      borderRadius: '12px',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      boxShadow: alert ? '0 0 14px rgba(245, 158, 11, 0.12)' : 'none',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <Icon size={14} color={alert ? '#f59e0b' : accent.primary} />
    </div>
    <div style={{ fontSize: '19px', fontWeight: 900, color: alert ? '#f59e0b' : '#FFFFFF', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{sub}</div>}
  </div>
);

/* ================= Central Bank Executive Dashboard (spec layout) ================= */

/** Rich metric card: title, value, unit, delta, policy target, status, updated, source. */
const RichCard: React.FC<{
  title: string;
  value: string;
  unit?: string;
  secondary?: string;
  change?: { text: string; tone: 'up' | 'down' | 'flat' };
  target?: string;
  status?: { label: string; tone: 'ok' | 'warn' | 'crit' };
  updated?: string;
  source?: string;
  icon?: any;
  tone?: 'gold' | 'coral' | 'emerald' | 'violet' | 'slate' | 'amber';
}> = ({ title, value, unit, secondary, change, target, status, updated, source, icon: Icon, tone = 'slate' }) => {
  const TONES: Record<string, string> = {
    gold: '#D4AF37', coral: '#EF4444', emerald: '#10B981', violet: '#8B5CF6', slate: '#94A3B8', amber: '#f59e0b',
  };
  const color = TONES[tone];
  const STATUS_TONE: Record<string, { color: string; bg: string; border: string }> = {
    ok: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.35)' },
    warn: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.35)' },
    crit: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)' },
  };
  return (
    <div
      style={{
        backgroundColor: '#0e0a12',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
        {Icon && <Icon size={14} color={color} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>{unit}</span>}
      </div>
      {secondary && <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{secondary}</div>}
      {change && (
        <div style={{ fontSize: '10.5px', fontWeight: 800, color: change.tone === 'up' ? '#10B981' : change.tone === 'down' ? '#EF4444' : 'var(--text-dim)' }}>
          {change.tone === 'up' ? '▲' : change.tone === 'down' ? '▼' : '■'} {change.text}
        </div>
      )}
      {target && <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Policy target: {target}</div>}
      {status && (
        <div>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: STATUS_TONE[status.tone].bg,
              border: `1px solid ${STATUS_TONE[status.tone].border}`,
              color: STATUS_TONE[status.tone].color,
            }}
          >
            {status.label}
          </span>
        </div>
      )}
      {(updated || source) && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '5px', marginTop: '2px', fontSize: '8.5px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          {updated && <div>Updated: {updated}</div>}
          {source && <div>Source: {source}</div>}
        </div>
      )}
    </div>
  );
};

/** Inline SVG donut for reserve allocation. */
const ReserveDonut: React.FC = () => {
  const slices = [
    { label: 'Gold', value: 59, color: '#D4AF37' },
    { label: 'Sovereign bonds', value: 29, color: '#8B5CF6' },
    { label: 'FX', value: 8, color: '#10B981' },
    { label: 'Deposits', value: 4, color: '#64748B' },
  ];
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
      <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label="Reserve allocation donut chart">
        {slices.map((s) => {
          const dash = (s.value / 100) * C;
          const el = (
            <circle
              key={s.label}
              cx="75"
              cy="75"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 75 75)"
            />
          );
          acc += dash;
          return el;
        })}
        <text x="75" y="72" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="800" fontFamily="var(--font-mono)">100%</text>
        <text x="75" y="87" textAnchor="middle" fill="var(--text-dim)" fontSize="8" letterSpacing="1">ALLOCATED</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '150px' }}>
        {slices.map((s) => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: s.color, display: 'inline-block' }} />
              {s.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#FFFFFF', fontWeight: 800 }}>{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Inline SVG area chart for the liquidity forecast (inflows/outflows/net). */
const LiquidityForecastChart: React.FC = () => {
  const W = 460;
  const H = 170;
  const inflow = [42, 55, 48, 66, 74, 63, 82, 90, 78, 95, 88, 104];
  const outflow = [30, 38, 34, 45, 52, 47, 58, 66, 61, 72, 69, 80];
  const net = inflow.map((v, i) => v - outflow[i]);
  const maxV = Math.max(...inflow);
  const step = W / (inflow.length - 1);
  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(H - (v / maxV) * (H - 24) - 8).toFixed(1)}`).join(' ');
  const area = `${path(net)} L${W},${H} L0,${H} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="170" role="img" aria-label="Liquidity forecast chart">
        <path d={area} fill="rgba(139,92,246,0.18)" />
        <path d={path(inflow)} fill="none" stroke="#10B981" strokeWidth="2" />
        <path d={path(outflow)} fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="5 4" />
        <path d={path(net)} fill="none" stroke="#8B5CF6" strokeWidth="2.5" />
      </svg>
      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '14px', height: '2px', backgroundColor: '#10B981', display: 'inline-block' }} /> Expected inflows</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '14px', height: '2px', backgroundColor: '#EF4444', display: 'inline-block' }} /> Expected outflows</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '14px', height: '2px', backgroundColor: '#8B5CF6', display: 'inline-block' }} /> Net position</span>
      </div>
    </div>
  );
};

/** Inline SVG chart: gold value & weight history. */
const GoldHistoryChart: React.FC = () => {
  const W = 460;
  const H = 170;
  const value = [7.1, 7.3, 7.2, 7.6, 7.9, 7.8, 8.1, 8.3, 8.2, 8.45, 8.4, 8.42];
  const weight = [131, 132, 133, 135, 137, 138, 140, 141, 142, 143.8, 144.2, 144.5];
  const maxV = 9;
  const maxW = 150;
  const step = W / (value.length - 1);
  const yV = (v: number) => H - (v / maxV) * (H - 24) - 8;
  const yW = (w: number) => H - (w / maxW) * (H - 24) - 8;
  const line = (arr: number[], y: (n: number) => number) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="170" role="img" aria-label="Gold value and weight history">
        <path d={`${line(value, yV)} L${W},${H} L0,${H} Z`} fill="rgba(212,175,55,0.15)" />
        <path d={line(value, yV)} fill="none" stroke="#D4AF37" strokeWidth="2.5" />
        <path d={line(weight, yW)} fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '14px', height: '2px', backgroundColor: '#D4AF37', display: 'inline-block' }} /> Valuation (€B)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '14px', height: '2px', backgroundColor: '#94A3B8', display: 'inline-block' }} /> Fine weight (t)</span>
      </div>
    </div>
  );
};

const bondLadderYears = [
  { bucket: '2026', pct: 14 },
  { bucket: '2027', pct: 22 },
  { bucket: '2028', pct: 19 },
  { bucket: '2029', pct: 24 },
  { bucket: '2030+', pct: 21 },
];

const specRiskLimits = [
  { name: 'Gold-price risk', utilization: 42 },
  { name: 'FX exposure EUR/USD', utilization: 61 },
  { name: 'Duration limit 6.5y', utilization: 78 },
  { name: 'Counterparty concentration', utilization: 35 },
  { name: 'Intraday liquidity limit', utilization: 28 },
];

const specApprovals = [
  { txn: 'TXN-90412', asset: 'XAU (Allocated)', amount: '€45.20M', risk: 'High', approvers: '2-of-2 Governor + Deputy' },
  { txn: 'TXN-90413', asset: 'sBOND/10Y', amount: '€120.00M', risk: 'Medium', approvers: '2-of-2 Reserve Director + Governor' },
  { txn: 'TXN-90414', asset: 'EUR/CHF Swap', amount: '€80.00M', risk: 'Medium', approvers: '1-of-2 Treasury Operator' },
  { txn: 'TXN-90415', asset: 'Policy Change #12', amount: '—', risk: 'High', approvers: 'Board Quorum 3-of-5' },
];

const specExceptions = [
  { severity: 'Critical', trade: 'DVP-8842', issue: 'Cash leg not reserved by deadline', owner: 'Settlement Officer', due: 'Today 14:00 CET' },
  { severity: 'Warning', trade: 'DVP-8837', issue: 'Custody bar serial mismatch', owner: 'Custody Officer', due: '07 Oct 2026' },
  { severity: 'Warning', trade: 'PAY-2201', issue: 'ISO 20022 pacs.008 rejected — repair queue', owner: 'Payments Officer', due: '07 Oct 2026' },
];

const specExposures = [
  { cp: 'JPMorgan Chase N.A.', jurisdiction: 'US', rating: 'A1 / AA-', exposure: '€412.0M', limit: '€600.0M', usage: 69 },
  { cp: 'Zurich Bullion Custody AG', jurisdiction: 'CH', rating: 'A2', exposure: '€184.7B (gold title)', limit: 'n/a (custody)', usage: 0 },
  { cp: 'BlackRock Institutional', jurisdiction: 'US', rating: 'A+', exposure: '€96.4M', limit: '€250.0M', usage: 39 },
  { cp: 'ECB Deposit Facility', jurisdiction: 'EU', rating: 'AAA', exposure: '€210.0M', limit: '€800.0M', usage: 26 },
];

const SEV_TONE: Record<string, { color: string; bg: string; border: string }> = {
  Critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)' },
  Warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)' },
  Info: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)' },
};

interface CbDetail {
  objectType: string;
  objectId: string;
  status: { label: string; tone: StatusTone };
  sections: DrawerSection[];
  approve?: { amount: string; asset: string; approvers: string };
}

export const CentralBankDashboard: React.FC<WorkspaceDashboardProps> = (props) => {
  const acc = WORKSPACE_ACCENT.central_bank;
  const [detail, setDetail] = useState<CbDetail | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const now = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich',
  });
  const totalCash = props.accounts.reduce((s, a) => s + parseFloat(a.balance.value_str || '0'), 0);
  const goldBars = props.holdings.filter((h) => h.asset_symbol === 'XAU').length;
  const aum = 14_245_796_831 + totalCash;
  void acc; void goldBars;

  /* §27 detail-drawer builders (shared drawer standard, one per record type). */
  const openApproval = (txn: string, asset: string, amount: string, approvers: string) =>
    setDetail({
      objectType: 'Pending Approval',
      objectId: txn,
      status: { label: 'Pending review', tone: 'amber' },
      approve: { amount, asset, approvers },
      sections: [
        { title: 'Summary', lines: [
          { label: 'Requested action', value: asset },
          { label: 'Total value', value: amount },
          { label: 'Requester', value: 'Treasury Operations' },
          { label: 'Mandate / policy', value: 'RES-MND-07 v4 (reserve mandate)' },
        ] },
        { title: 'Risk & compliance', lines: [
          { label: 'Risk assessment', value: 'Within policy limits' },
          { label: 'KYC / AML', value: 'Cleared' },
          { label: 'Sanctions screening', value: 'No hits' },
          { label: 'Source of funds', value: 'Verified' },
        ] },
        { title: 'Settlement & approval', lines: [
          { label: 'Settlement plan', value: 'DvP T+2 via notary cluster' },
          { label: 'Custody plan', value: 'ZRH-01 allocated' },
          { label: 'Required approvals', value: approvers },
          { label: 'Completed', value: '1 of required signers' },
        ] },
        { title: 'Timeline', lines: [
          { label: 'Created', value: '06 Oct 2026 09:41 CET' },
          { label: 'Maker signed', value: 'Alice Trading Corp · 09:42 CET' },
          { label: 'Deadline', value: 'Today 16:00 CET' },
          { label: 'Audit', value: 'Hash-chained immutable events' },
        ] },
      ],
    });

  const openException = (trade: string, issue: string, owner: string, severity: string, due: string) =>
    setDetail({
      objectType: 'Settlement Exception',
      objectId: trade,
      status: { label: severity, tone: severity === 'Critical' ? 'coral' : 'amber' },
      sections: [
        { title: 'Summary', lines: [
          { label: 'Issue', value: issue },
          { label: 'Owner', value: owner },
          { label: 'Due', value: due },
          { label: 'Status', value: 'Investigation' },
        ] },
        { title: 'Legs & custody', lines: [
          { label: 'Cash leg', value: 'Reserved — pending confirmation' },
          { label: 'Asset leg', value: 'XAU allocated UTXO locked' },
          { label: 'Payment ID', value: 'PAY-2201 (pacs.008)' },
          { label: 'Custodian', value: 'Zurich ZRH-01' },
        ] },
        { title: 'Investigation', lines: [
          { label: 'Detected', value: '06 Oct 2026 09:58 CET' },
          { label: 'Repair evidence', value: 'Attached (2 documents)' },
          { label: 'Related trade', value: `${trade} · atomic DvP` },
          { label: 'Finality record', value: 'Pending notary quorum' },
        ] },
      ],
    });

  const openCounterparty = (cp: string, jurisdiction: string, rating: string, exposure: string, limit: string) =>
    setDetail({
      objectType: 'Counterparty',
      objectId: cp,
      status: { label: 'Approved', tone: 'emerald' },
      sections: [
        { title: 'Identity', lines: [
          { label: 'Legal entity', value: cp },
          { label: 'Jurisdiction', value: jurisdiction },
          { label: 'Credit rating', value: rating },
          { label: 'License', value: 'Institutional participant' },
        ] },
        { title: 'Exposure & limits', lines: [
          { label: 'Current exposure', value: exposure },
          { label: 'Approved limit', value: limit },
          { label: 'Collateral', value: 'Per master agreement' },
          { label: 'Review history', value: 'Last review Q2 2026' },
        ] },
        { title: 'Compliance', lines: [
          { label: 'KYC / KYB', value: 'Valid to 12/2027' },
          { label: 'AML screening', value: 'Continuous — clear' },
          { label: 'Sanctions', value: 'No hits' },
          { label: 'Next review', value: 'Q2 2027' },
        ] },
        { title: 'Settlement instructions', lines: [
          { label: 'Rail', value: 'ISO 20022 pacs.008 / DvP' },
          { label: 'Settlement account', value: 'Standing instruction per ccy' },
          { label: 'Approved products', value: 'Gold · Bonds · FX · Repo' },
          { label: 'Documents', value: 'IMAA · ISDA · custody annex' },
        ] },
      ],
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ===== Contract §2: persistent institution context (LINE 01–04 fields) ===== */}
      <InstitutionContextBar
        ctx={{
          institution_id: 'INST-SNB-001',
          institution_name: 'Swiss National Bank',
          legal_entity_id: 'LE-SNB-RD',
          legal_entity_name: 'Reserve Desk (Sandbox)',
          persona_id: 'persona_cb_governor',
          role_id: props.personaRoleTitle,
          environment: props.environment,
          security_level: 'Level 5 — Sovereign Reserve Authority',
          node_id: 'N1',
          region: 'Zurich, CH',
          base_currency: 'EUR',
          last_sync_at: now,
          data_source: 'Local Sandbox API',
          mfa_status: 'WebAuthn verified',
          approval_count: props.approvals.length,
          critical_alert_count: specExceptions.filter((e) => e.severity === 'Critical').length,
        }}
      />

      {/* ===== Header block ===== */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(12,10,16,0.6))',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '14px',
          padding: '20px 24px',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#EF4444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
          CENTRAL BANK EXECUTIVE DASHBOARD
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '21px', fontWeight: 900 }}>Central Bank Operator & Governor</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Swiss National Bank / Reserve Desk · Level 5 — Sovereign Reserve Authority
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '5px', fontFamily: 'var(--font-mono)' }}>
              Last synchronized: {now} CET
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => props.onNavigate('governance')} className="card-interactive" style={{ padding: '9px 14px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.16)', border: '1px solid rgba(239,68,68,0.45)', color: '#FFF', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckSquare size={13} color="#EF4444" /> Review Approvals
            </button>
            <button onClick={() => props.onNavigate('sweeper')} className="card-interactive" style={{ padding: '9px 14px', borderRadius: '8px', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#FFF', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={13} color="#f59e0b" /> Emergency Controls
            </button>
            <button onClick={() => props.onNavigate('logs')} className="card-interactive" style={{ padding: '9px 14px', borderRadius: '8px', backgroundColor: '#191120', border: '1px solid var(--border-subtle)', color: '#FFF', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={13} color="#94A3B8" /> Export Report
            </button>
          </div>
        </div>
        <div
          style={{
            marginTop: '14px',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.3)',
            color: '#f59e0b',
            fontSize: '10.5px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={13} />
          SANDBOX — SIMULATED RECORDS ONLY. No live central-bank money, RTGS, SWIFT, or production account mandate is connected.
        </div>
      </div>

      {/* ===== Eight key metric cards ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
        <RichCard title="Total Official Reserves" value={fmtEur(aum)} change={{ text: '+1.2% this month', tone: 'up' }} target="≥ €12.0B floor" status={{ label: 'Within mandate', tone: 'ok' }} updated={`${now} CET`} source="Consolidated ledger" icon={Landmark} tone="coral" />
        <RichCard title="Allocated Gold" value="2,480.50" unit="tonnes" secondary="€184.7B estimated value" change={{ text: '+1.8% this month', tone: 'up' }} target="15–20% of reserves" status={{ label: 'Within mandate', tone: 'ok' }} updated="10:48 CET" source="Custody & vault registry" icon={Landmark} tone="gold" />
        <RichCard title="Sovereign Bonds" value="$4.10B" secondary="Treasuries · agencies · supranationals" change={{ text: '+0.4% this month', tone: 'up' }} target="25–35% of reserves" status={{ label: 'Within mandate', tone: 'ok' }} updated="10:46 CET" source="Bond custody registry" icon={Scale} tone="violet" />
        <RichCard title="FX & Cash" value="$545.6M" secondary="USD · CHF · GBP operational balances" change={{ text: '−0.3% this week', tone: 'down' }} target="≥ 5% liquidity floor" status={{ label: 'Watch', tone: 'warn' }} updated="10:44 CET" source="Correspondent accounts" icon={Globe} tone="emerald" />
        <RichCard title="Intraday Liquidity" value={fmtEur(totalCash)} secondary="Settlement accounts (live ledger)" change={{ text: 'live', tone: 'flat' }} target="≥ €2.0M buffer" status={{ label: totalCash >= 2_000_000 ? 'Healthy' : 'Low buffer', tone: totalCash >= 2_000_000 ? 'ok' : 'warn' }} updated={`${now} CET`} source="Live settlement ledger" icon={Waves} tone="emerald" />
        <RichCard title="Risk-Limit Usage" value="49%" secondary="Weighted utilization across 5 policy limits" change={{ text: '+4 pts vs last week', tone: 'up' }} target="≤ 75% amber threshold" status={{ label: 'Amber — duration near breach', tone: 'warn' }} updated="10:40 CET" source="Risk engine" icon={Activity} tone="amber" />
        <RichCard title="Settlement Health" value="4/5" unit="BFT quorum" secondary="Zero double-spend · 1 pending exception" change={{ text: 'stable 30d', tone: 'flat' }} target="≥ 4 notaries" status={{ label: 'Operational', tone: 'ok' }} updated="10:50 CET" source="Notary cluster" icon={Activity} tone="emerald" />
        <RichCard title="Compliance Alerts" value="3" secondary="1 settlement exception · 2 document expiries" change={{ text: '+1 vs yesterday', tone: 'up' }} target="0 open criticals" status={{ label: 'Action required', tone: 'crit' }} updated="10:49 CET" source="Compliance engine" icon={ShieldCheck} tone="coral" />
      </div>

      {/* ===== Charts row 1: allocation + forecast ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Reserve Allocation by Asset Class
          </div>
          <ReserveDonut />
          <div style={{ marginTop: '14px', fontSize: '10px', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
            By currency: EUR 62% · USD 24% · CHF 9% · other 5%
          </div>
        </div>
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Liquidity Forecast — 12 Weeks
            </div>
            <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)', color: '#10B981', fontWeight: 800 }}>
              Buffer intact
            </span>
          </div>
          <LiquidityForecastChart />
        </div>
      </div>

      {/* ===== Charts row 2: gold history + bond ladder ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Gold Value & Weight — 12 Months
            </div>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#D4AF37', fontWeight: 800 }}>
              €2,542.10 / oz
            </span>
          </div>
          <GoldHistoryChart />
        </div>
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Government-Bond Maturity Ladder
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '160px', padding: '0 4px' }}>
            {bondLadderYears.map((b) => (
              <div key={b.bucket} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#FFFFFF', fontWeight: 700 }}>{b.pct}%</span>
                <div
                  style={{
                    width: '100%',
                    height: `${b.pct * 1.35}%`,
                    background: 'linear-gradient(180deg, #8B5CF6, rgba(139,92,246,0.22))',
                    borderRadius: '6px 6px 2px 2px',
                    boxShadow: '0 0 12px rgba(139,92,246,0.25)',
                  }}
                />
                <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{b.bucket}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Avg duration: 5.8y</span>
            <span>Weighted yield: 2.41%</span>
            <span>Next redemption: Mar 2027</span>
          </div>
        </div>
      </div>

      {/* ===== Risk limits strip ===== */}
      <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          Risk-Limit Utilization
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {specRiskLimits.map((l) => (
            <div key={l.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{l.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: l.utilization > 70 ? '#f59e0b' : '#10B981' }}>{l.utilization}%</span>
              </div>
              <div style={{ height: '5px', borderRadius: '3px', backgroundColor: '#1a1420' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${l.utilization}%`,
                    borderRadius: '3px',
                    backgroundColor: l.utilization > 70 ? '#f59e0b' : '#10B981',
                    boxShadow: `0 0 8px ${l.utilization > 70 ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Pending approvals table ===== */}
      <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pending Approvals
          </div>
          <button onClick={() => props.onNavigate('governance')} className="card-interactive" style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#FFF', fontSize: '10.5px', fontWeight: 800, cursor: 'pointer' }}>
            Open Approval Queue ({props.approvals.length} live)
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr>
                {['Transaction', 'Asset', 'Amount', 'Risk', 'Required Approvers'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: '9.5px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specApprovals.map((r) => (
                <tr key={r.txn} onClick={() => openApproval(r.txn, r.asset, r.amount, r.approvers)} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: '#FFF', fontWeight: 700 }}>{r.txn}</td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{r.asset}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: '#FFF', fontWeight: 700 }}>{r.amount}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', backgroundColor: SEV_TONE[r.risk === 'High' ? 'Critical' : 'Warning'].bg, border: `1px solid ${SEV_TONE[r.risk === 'High' ? 'Critical' : 'Warning'].border}`, color: SEV_TONE[r.risk === 'High' ? 'Critical' : 'Warning'].color }}>
                      {r.risk}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{r.approvers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Settlement exceptions + counterparty exposure ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Settlement Exceptions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {specExceptions.map((r) => (
              <div key={r.trade} onClick={() => openException(r.trade, r.issue, r.owner, r.severity, r.due)} style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#140f1a', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', cursor: 'pointer' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FFF', fontSize: '11.5px' }}>{r.trade}</span>
                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 7px', borderRadius: '9999px', backgroundColor: SEV_TONE[r.severity].bg, border: `1px solid ${SEV_TONE[r.severity].border}`, color: SEV_TONE[r.severity].color }}>
                      {r.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>{r.issue} · Owner: {r.owner}</div>
                </div>
                <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Due {r.due}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Counterparty Exposure
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {specExposures.map((c) => (
              <div key={c.cp} onClick={() => openCounterparty(c.cp, c.jurisdiction, c.rating, c.exposure, c.limit)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                    {c.cp} <span style={{ color: 'var(--text-dim)' }}>· {c.jurisdiction} · {c.rating}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#FFF', fontWeight: 700 }}>{c.exposure}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '5px', borderRadius: '3px', backgroundColor: '#1a1420' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(c.usage, 2)}%`,
                        borderRadius: '3px',
                        backgroundColor: c.usage > 70 ? '#EF4444' : c.usage > 50 ? '#f59e0b' : '#10B981',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', minWidth: '86px', textAlign: 'right' }}>
                    limit {c.limit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Contract §27: unified detail drawer (one standard for every row) ===== */}
      <DetailDrawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        objectType={detail?.objectType || ''}
        objectId={detail?.objectId || ''}
        status={detail?.status}
        classification="Confidential — Sovereign Reserve"
        sections={detail?.sections || []}
        actions={[
          ...(detail?.approve
            ? [{ label: 'Approve (opens high-value confirmation)', primary: true, onClick: () => setConfirmOpen(true) }]
            : []),
          { label: 'Export evidence', onClick: () => props.onNotify('Evidence bundle exported with period, source, version and approver.') },
          { label: 'Escalate', onClick: () => props.onNotify('Escalated to deputy governor approval chain.') },
        ]}
      />

      {/* ===== Contract §32: high-value action confirmation ===== */}
      <ApprovalDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setDetail(null);
          props.onNotify('Approval recorded — maker-checker signature chain updated.');
        }}
        action={detail?.approve ? `Approve ${detail.objectType} ${detail.objectId}` : 'Approve action'}
        requiredApprovals={detail?.approve?.approvers || '2-of-2'}
        fields={[
          { label: 'Institution', value: 'Swiss National Bank / Reserve Desk' },
          { label: 'Legal entity', value: 'LE-SNB-RD (Sandbox)' },
          { label: 'Asset', value: detail?.approve?.asset || '—' },
          { label: 'Quantity / amount', value: detail?.approve?.amount || '—' },
          { label: 'Currency', value: 'EUR' },
          { label: 'Counterparty', value: 'Approved institutional participant' },
          { label: 'Settlement date', value: 'T+2 — 08 Oct 2026' },
          { label: 'Custody account', value: 'ZRH-01 allocated' },
          { label: 'Payment account', value: 'SNB settlement account (sandbox)' },
          { label: 'Risk result', value: 'Within policy limits' },
          { label: 'Compliance result', value: 'KYC / AML / sanctions cleared' },
        ]}
      />
    </div>
  );
};

/* ---------------- Institutional (Commercial Bank / Agency) dashboard ---------------- */

export const InstitutionalBankDashboard: React.FC<WorkspaceDashboardProps> = (props) => {
  const acc = WORKSPACE_ACCENT.institutional;
  const totalCash = props.accounts.reduce((s, a) => s + parseFloat(a.balance.value_str || '0'), 0);
  const goldHoldings = props.holdings.filter((h) => h.asset_symbol === 'XAU');

  const clientRfqs = props.offers.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Welcome banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${acc.soft}, rgba(12,10,16,0.6))`,
          border: `1px solid ${acc.border}`,
          borderRadius: '14px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: acc.primary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            {acc.label}
          </div>
          <div style={{ fontSize: '21px', fontWeight: 900 }}>Welcome, Institutional Treasury Operator</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {props.institutionName} · {props.personaRoleTitle}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontWeight: 800 }}>
            ENV: {props.environment}
          </span>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: acc.soft, border: `1px solid ${acc.border}`, color: acc.primary, fontWeight: 800 }}>
            Role: Treasury & Primary Dealer
          </span>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 800 }}>
            ● Live Sync
          </span>
        </div>
      </div>

      {/* Main cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        <StatCard label="Cash by Currency" value={fmtEur(totalCash)} sub={`${props.accounts.length} settlement accounts (live)`} icon={Globe} accent={acc} />
        <StatCard label="Gold Inventory" value={`${goldHoldings.length} lots`} sub="Allocated · reserved · pledged" icon={Boxes} accent={acc} />
        <StatCard label="Bond Inventory" value={String(props.auctions.length + 2)} sub="Holdings + auction allocations" icon={Scale} accent={acc} />
        <StatCard label="Open FX Positions" value="3" sub="EUR/USD · EUR/CHF · USD/CHF" icon={TrendingUp} accent={acc} />
        <StatCard label="Client RFQs" value={String(clientRfqs)} sub="Incoming quote requests" icon={Gavel} accent={acc} alert={clientRfqs > 0} />
        <StatCard label="Repo Exposure" value="€120.0M" sub="2 open term-repo trades" icon={Droplets} accent={acc} />
        <StatCard label="Available Liquidity" value={fmtEur(totalCash * 0.62)} sub="After buffers & reservations" icon={Waves} accent={acc} />
        <StatCard label="Collateral Available" value={fmtEur(props.collateral.reduce((s, c) => s + parseFloat(c.market_value_eur.replace(/,/g, '') || '0'), 0))} sub={`${props.collateral.length} unencumbered positions`} icon={Key} accent={acc} />
        <StatCard label="Pending Settlements" value={String(props.offers.length)} sub="DvP legs awaiting finality" icon={Timer} accent={acc} />
        <StatCard label="Margin Utilization" value="38%" sub="Collateral coverage 3.1×" icon={Activity} accent={acc} />
        <StatCard label="Approvals Queue" value={String(props.approvals.length)} sub="Desk / treasury / compliance" icon={CheckSquare} accent={acc} alert={props.approvals.length > 0} />
        <StatCard label="Compliance Alerts" value="0" sub="KYC · AML · sanctions clear" icon={ShieldCheck} accent={acc} />
      </div>

      {/* Trading actions */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
          PRIMARY ACTIONS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { label: 'Create RFQ', section: 'trade' },
            { label: 'Respond to RFQ', section: 'trader_desk' },
            { label: 'Buy / Sell Gold', section: 'vault' },
            { label: 'Buy / Sell Bonds', section: 'terminal' },
            { label: 'Create FX Trade', section: 'terminal' },
            { label: 'Initiate Repo', section: 'sweeper' },
            { label: 'Pledge Collateral', section: 'collateral' },
            { label: 'Transfer Asset', section: 'portfolio' },
            { label: 'Approve Settlement', section: 'governance' },
            { label: 'Manage Client Orders', section: 'trader_desk' },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => props.onNavigate(a.section)}
              className="card-interactive"
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: acc.soft,
                border: `1px solid ${acc.border}`,
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {a.label}
              <ChevronRight size={13} color={acc.primary} />
            </button>
          ))}
        </div>
      </div>

      {/* Visualizations row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        {/* Inventory by vault */}
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Gold Inventory by Vault
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { vault: 'Zurich ZRH-01 (Allocated)', lots: Math.max(goldHoldings.length, 1), color: acc.primary },
              { vault: 'Zurich ZRH-02 (Reserved)', lots: Math.max(props.holdings.filter((h) => h.asset_symbol !== 'XAU').length, 1), color: '#F59E0B' },
              { vault: 'Frankfurt FRA-03 (Pledged)', lots: 2, color: '#64748B' },
            ].map((v) => {
              const totalLots = 6;
              const pct = (v.lots / totalLots) * 100;
              return (
                <div key={v.vault}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{v.vault}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#FFFFFF', fontWeight: 700 }}>{v.lots} lots · {pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#1a1420' }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: '3px', backgroundColor: v.color, boxShadow: `0 0 8px ${v.color}55` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client order flow */}
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Client Order Flow & RFQ Conversion
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '150px', padding: '0 4px' }}>
            {[45, 62, 38, 71, 55, 83, 67, 92, 74, 60, 88, 79].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${h}%`,
                    background: `linear-gradient(180deg, ${acc.primary}, rgba(139,92,246,0.2))`,
                    borderRadius: '4px 4px 2px 2px',
                    boxShadow: `0 0 10px ${acc.glow}`,
                    opacity: 0.55 + (h / 100) * 0.45,
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '9.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            <span>JAN</span><span>APR</span><span>AUG</span><span>DEC</span>
          </div>
        </div>

        {/* Settlement queue + desk P&L */}
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Settlement Queue & Desk P&L
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { id: 'DVP-8841', cp: 'JPMorgan (Kinexys)', state: 'Matched', tone: '#10B981' },
              { id: 'DVP-8842', cp: 'SNB Reserve Desk', state: 'Awaiting Approval', tone: '#f59e0b' },
              { id: 'DVP-8843', cp: 'BlackRock Alpha', state: 'Assets Locked', tone: '#3B82F6' },
            ].map((r) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#140f1a', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{r.id}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{r.cp}</div>
                </div>
                <span style={{ fontSize: '9.5px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: `${r.tone}22`, border: `1px solid ${r.tone}55`, color: r.tone, fontWeight: 800 }}>
                  {r.state}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '4px', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800 }}>Realized P&L (MTD)</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#10B981', fontFamily: 'var(--font-mono)' }}>+€2.41M</div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800 }}>Unrealized P&L</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>+€0.87M</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
