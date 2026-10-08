import React, { useMemo } from 'react';
import type { AppSection, DemandDepositRecord, FungibleAssetHolding, PrincipalProfile } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';

/**
 * Risk Dashboard — consolidated market/credit/liquidity exposure summary per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. Exposure numbers derive ONLY from
 * the live ledger (accounts + holdings + identity registry). Sections whose
 * backend source does not exist yet (limits engine, breach feed, stress
 * results) render honest not-connected states — no invented risk figures.
 */

interface RiskDashboardViewProps {
  accounts: DemandDepositRecord[];
  holdings: FungibleAssetHolding[];
  identities: PrincipalProfile[];
  accountDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  accountsFetchedAt: number | null;
  pendingApprovals: number;
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

function fmtEur(v: number): string {
  return `€${v.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card" style={{ padding: '16px' }}>
    <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '10px' }}>{title}</h3>
    {children}
  </div>
);

const NotConnected: React.FC<{ feature: string; cta?: { label: string; onClick: () => void } }> = ({ feature, cta }) => (
  <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.55 }}>
    <span style={{ color: '#F5C842', fontWeight: 700 }}>Not connected.</span> No {feature} source exists on the ledger yet
    (Phase 3 backlog) — no figures are shown rather than invented.
    {cta && (
      <button onClick={cta.onClick} className="btn-secondary" style={{ marginLeft: '8px', fontSize: '11px', padding: '3px 8px' }}>
        {cta.label}
      </button>
    )}
  </div>
);

export const RiskDashboardView: React.FC<RiskDashboardViewProps> = ({
  accounts,
  holdings,
  identities,
  accountDataStatus,
  accountsFetchedAt,
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  onNavigate,
  onNotify,
}) => {
  const legalNameOf = (principal: string): string =>
    identities.find((i) => i.principal === principal)?.legal_name ?? `${principal.slice(0, 8)}… (unregistered)`;

  const cashByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) {
      map.set(a.currency, (map.get(a.currency) ?? 0) + parseFloat(a.balance.value_str));
    }
    return [...map.entries()].sort((x, y) => y[1] - x[1]);
  }, [accounts]);

  const assetBySymbol = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of holdings) {
      if (h.status !== 'Unconsumed') continue;
      map.set(h.asset_symbol, (map.get(h.asset_symbol) ?? 0) + parseFloat(h.amount.value_str));
    }
    return [...map.entries()].sort((x, y) => y[1] - x[1]);
  }, [holdings]);

  const exposureByInstitution = useMemo(() => {
    const map = new Map<string, { cash: number; currency: string; goldOz: number; ustb: number }>();
    for (const a of accounts) {
      const entry = map.get(a.owner) ?? { cash: 0, currency: a.currency, goldOz: 0, ustb: 0 };
      entry.cash += parseFloat(a.balance.value_str);
      map.set(a.owner, entry);
    }
    for (const h of holdings) {
      if (h.status !== 'Unconsumed') continue;
      const entry = map.get(h.holder) ?? { cash: 0, currency: 'EUR', goldOz: 0, ustb: 0 };
      if (h.asset_symbol === 'GOLD') entry.goldOz += parseFloat(h.amount.value_str);
      if (h.asset_symbol === 'USTB') entry.ustb += parseFloat(h.amount.value_str);
      map.set(h.holder, entry);
    }
    return [...map.entries()].map(([principal, e]) => ({
      institution: legalNameOf(principal),
      principal,
      cash: e.cash,
      currency: e.currency,
      goldOz: e.goldOz,
      ustb: e.ustb,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, holdings, identities]);

  const totalCash = cashByCurrency.reduce((s, [, v]) => s + v, 0);
  const totalGoldOz = assetBySymbol.find(([s]) => s === 'GOLD')?.[1] ?? 0;
  const totalUstb = assetBySymbol.find(([s]) => s === 'USTB')?.[1] ?? 0;

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Risk Dashboard"
        auditPrefix="CB-RISK"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Consolidated supervisory scope — all registered institutions"
        dataStatus={accountDataStatus}
        dataFetchedAt={accountsFetchedAt}
        pendingApprovals={pendingApprovals}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <Panel title="Risk summary — total cash exposure">
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{fmtEur(totalCash)}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
            {cashByCurrency.map(([c, v]) => `${c} ${fmtEur(v)}`).join(' · ') || 'No settlement accounts on the ledger'}
          </div>
        </Panel>
        <Panel title="Commodity exposure — allocated gold">
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F5C842' }}>{totalGoldOz.toLocaleString('en-IE', { maximumFractionDigits: 2 })} oz</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>Unconsumed GOLD holdings (live ledger)</div>
        </Panel>
        <Panel title="Sovereign debt exposure — USTB">
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#065FD4' }}>${totalUstb.toLocaleString('en-IE', { maximumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>Unconsumed USTB holdings (live ledger)</div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <Panel title="Exposure by institution (live ledger)">
          {exposureByInstitution.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No accounts or holdings on the ledger yet.</div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Institution</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>Cash</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>Gold (oz)</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>USTB</th>
                  </tr>
                </thead>
                <tbody>
                  {exposureByInstitution.map((row) => (
                    <tr key={row.principal} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{row.institution}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.cash > 0 ? fmtEur(row.cash) : '—'}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.goldOz > 0 ? row.goldOz.toLocaleString('en-IE') : '—'}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.ustb > 0 ? `$${row.ustb.toLocaleString('en-IE')}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Exposure by product & currency (live ledger)">
          {assetBySymbol.length === 0 && cashByCurrency.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Nothing to report yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {assetBySymbol.map(([sym, amt]) => (
                <div key={sym} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: 700 }}>{sym}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{sym === 'GOLD' ? `${amt.toLocaleString('en-IE')} oz` : sym === 'USTB' ? `$${amt.toLocaleString('en-IE')}` : amt.toLocaleString('en-IE')}</span>
                </div>
              ))}
              {cashByCurrency.map(([cur, amt]) => (
                <div key={cur} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: 700 }}>Cash · {cur}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtEur(amt)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Panel title="Limit utilization & breaches">
          <NotConnected feature="limits-engine" cta={{ label: 'Open Exposure & Limits →', onClick: () => onNavigate('cb_limits') }} />
        </Panel>
        <Panel title="Breach & near-breach feed">
          <NotConnected feature="limit-breach feed" />
        </Panel>
        <Panel title="Stress-test results">
          <NotConnected feature="stress-simulation engine" cta={{ label: 'Open Stress Testing →', onClick: () => onNavigate('cb_stress') }} />
        </Panel>
      </div>
    </div>
  );
};
