import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckSquare,
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

/* ---------------- Central Bank dashboard ---------------- */

const reserveAllocation = [
  { label: 'Monetary Gold (XAU)', value: 8.42, color: '#EF4444' },
  { label: 'Sovereign Bonds', value: 4.10, color: '#8B5CF6' },
  { label: 'Digital Assets (ICP)', value: 1.20, color: '#3B82F6' },
  { label: 'Demand Cash / FX', value: 0.55, color: '#10B981' },
];

const bondLadder = [
  { bucket: '< 1Y', pct: 12 },
  { bucket: '1–3Y', pct: 22 },
  { bucket: '3–5Y', pct: 28 },
  { bucket: '5–10Y', pct: 26 },
  { bucket: '10Y+', pct: 12 },
];

export const CentralBankDashboard: React.FC<WorkspaceDashboardProps> = (props) => {
  const acc = WORKSPACE_ACCENT.central_bank;
  const totalCash = props.accounts.reduce((s, a) => s + parseFloat(a.balance.value_str || '0'), 0);
  const goldBars = props.holdings.filter((h) => h.asset_symbol === 'XAU').length;
  const aum = 14_245_796_831 + totalCash;

  const riskLimits = [
    { name: 'Gold price risk (Δ10%)', utilization: 42 },
    { name: 'FX EUR/USD exposure', utilization: 61 },
    { name: 'Duration limit 6.5y', utilization: 78 },
    { name: 'Counterparty concentration', utilization: 35 },
  ];

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
          <div style={{ fontSize: '21px', fontWeight: 900 }}>Welcome, Central Bank Operator</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {props.institutionName} · {props.personaRoleTitle}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontWeight: 800 }}>
            ENV: {props.environment}
          </span>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: acc.soft, border: `1px solid ${acc.border}`, color: acc.primary, fontWeight: 800 }}>
            🔐 Sovereign Root Key
          </span>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 800 }}>
            ● Live Sync
          </span>
        </div>
      </div>

      {/* Main cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        <StatCard label="Total Official Reserves" value={fmtEur(aum)} sub="Managed official reserve portfolio" icon={Landmark} accent={acc} />
        <StatCard label="Monetary Gold" value="$8.42B" sub={`${goldBars} allocated XAU holdings in vault`} icon={Landmark} accent={acc} />
        <StatCard label="Allocated Gold Weight" value="144.5 t" sub="Fine weight across vault ZRH-01" icon={Boxes} accent={acc} />
        <StatCard label="Sovereign Bonds" value="$4.10B" sub="Treasury & agency portfolio" icon={Scale} accent={acc} />
        <StatCard label="FX Liquidity" value="$545.6M" sub="USD · CHF · GBP corridors" icon={Globe} accent={acc} />
        <StatCard label="Intraday Liquidity" value={fmtEur(totalCash)} sub="Settlement accounts (live ledger)" icon={Waves} accent={acc} />
        <StatCard label="Available Collateral" value={fmtEur(props.collateral.reduce((s, c) => s + parseFloat(c.market_value_eur.replace(/,/g, '') || '0'), 0))} sub={`${props.collateral.length} pledgeable positions`} icon={Key} accent={acc} />
        <StatCard label="Pending Approvals" value={String(props.approvals.length)} sub="Governor 2-of-2 queue" icon={CheckSquare} accent={acc} alert={props.approvals.length > 0} />
        <StatCard label="Settlement Health" value="4/5 BFT" sub="Notary quorum · zero double-spend" icon={Activity} accent={acc} />
        <StatCard label="Compliance Alerts" value="0" sub="AML / sanctions screens clear" icon={ShieldCheck} accent={acc} />
        <StatCard label="Live Market Offers" value={String(props.offers.length)} sub="RWA desk inventory" icon={TrendingUp} accent={acc} />
        <StatCard label="Primary Auctions" value={String(props.auctions.length)} sub="Sovereign debt issuance" icon={Gavel} accent={acc} />
      </div>

      {/* Primary actions */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
          PRIMARY ACTIONS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { label: 'Approve High-Value Transaction', section: 'governance' },
            { label: 'Approve Transfer', section: 'portfolio' },
            { label: 'Freeze Account / Asset', section: 'enterprise_admin' },
            { label: 'Review Risk Breach', section: 'compliance' },
            { label: 'Review Failed Settlement', section: 'notaries' },
            { label: 'Open CB Operation', section: 'sweeper' },
            { label: 'Export Official Reserve Report', section: 'logs' },
            { label: 'Create Governor Briefing', section: 'secure_chat' },
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
        {/* Reserve allocation */}
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Reserve Allocation by Asset Class
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reserveAllocation.map((r) => {
              const total = reserveAllocation.reduce((s, x) => s + x.value, 0);
              const pct = (r.value / total) * 100;
              return (
                <div key={r.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{r.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#FFFFFF', fontWeight: 700 }}>${r.value.toFixed(2)}B · {pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#1a1420' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: '3px', backgroundColor: r.color, boxShadow: `0 0 8px ${r.color}55` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bond maturity ladder */}
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Government-Bond Maturity Ladder
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '150px', padding: '0 4px' }}>
            {bondLadder.map((b) => (
              <div key={b.bucket} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#FFFFFF', fontWeight: 700 }}>{b.pct}%</span>
                <div
                  style={{
                    width: '100%',
                    height: `${b.pct * 1.2}%`,
                    background: `linear-gradient(180deg, ${acc.primary}, rgba(239,68,68,0.25))`,
                    borderRadius: '6px 6px 2px 2px',
                    boxShadow: `0 0 12px ${acc.glow}`,
                  }}
                />
                <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{b.bucket}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk-limit utilization */}
        <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Risk-Limit Utilization
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {riskLimits.map((l) => (
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
          <div style={{ marginTop: '14px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '10.5px', color: '#f59e0b', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle size={13} />
            Duration limit nearest to breach — review in Risk Dashboard.
          </div>
        </div>
      </div>
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
