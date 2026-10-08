import React, { useMemo, useState } from 'react';
import type { AppSection, SovereignBondContract, BondAuction, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';

/**
 * System Configuration — Bonds: instrument master, coupon schedules,
 * calendars, day-count conventions, pricing sources, eligibility rules,
 * versioned configuration releases per docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md.
 * The instrument master is the LIVE bond contract registry (GET /api/v1/bonds
 * contracts) joined with live auctions — every coupon rate, frequency, ACTUS
 * contract type and canister principal is a real registered fact. Calendars
 * and day-count conventions actually in force are read off the instruments
 * themselves; anything not recorded on an instrument is shown "Not recorded"
 * rather than defaulted. Config releases are maker-step proposals (peer
 * review + approval before promotion is a Phase 5 engine).
 */

interface SystemConfigBondsViewProps {
  bondContracts: SovereignBondContract[];
  auctions: BondAuction[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const SystemConfigBondsView: React.FC<SystemConfigBondsViewProps> = ({
  bondContracts,
  auctions,
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  onNavigate,
  onNotify,
}) => {
  const [releaseProposals, setReleaseProposals] = useState<{ id: string; at: string; scope: string }[]>([]);
  // Capture freshness in state — Date.now() at render is impure (purity rule).
  const [fetchedAt] = useState<number | null>(() => (bondContracts.length > 0 || auctions.length > 0 ? Date.now() : null));

  const releaseTarget = useMemo(() => {
    // Scope = every bond currently registered — a release touches the master.
    return `${bondContracts.length} instrument${bondContracts.length === 1 ? '' : 's'}`;
  }, [bondContracts]);

  const proposeRelease = (): void => {
    const openProposal = releaseProposals.find((r) => r.scope === releaseTarget);
    if (openProposal) {
      onNotify(`A configuration release covering ${releaseTarget} is already proposed this session`, true);
      return;
    }
    const id = `REL-${Date.now().toString(36).toUpperCase()}`;
    setReleaseProposals((current) => [{ id, at: new Date().toISOString(), scope: releaseTarget }, ...current]);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'CONFIG_RELEASE_PROPOSED',
      object: `${id} — ${releaseTarget} (maker step; peer review + approval Phase 5)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'CONFIG_RELEASE_PROPOSED',
      object: `${id} — ${releaseTarget}`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — proposal recorded in-session only', true));
    onNotify(`Release ${id} proposed — peer review + approval pending`);
  };

  const exportEvidence = (): void => {
    const payload = {
      view: 'System Configuration — Bonds',
      generated_at: new Date().toISOString(),
      instrument_master: bondContracts.map((b) => ({
        contract_id: b.contract_id, issuer: b.issuer_name, isin: b.isin_code, dti: b.dti_code,
        currency: b.currency, coupon_rate_pct: b.coupon_rate_pct, coupon_frequency: b.coupon_frequency,
        actus_contract_type: b.actus_contract_type, maturity_date: b.maturity_date,
        auction_mechanism: b.auction_mechanism, collateral_backing: b.collateral_backing,
        canister_principal: b.canister_principal_id, status: b.status,
      })),
      auctions: auctions.map((a) => ({ auction_id: a.auction_id, bond_symbol: a.bond_symbol, status: a.status, bids: a.bids_count, target_yield_pct: a.target_yield_pct, cutoff_yield_pct: a.cutoff_yield_pct, maturity_date: a.maturity_date })),
      config_release_proposals: releaseProposals,
      provenance: 'Instrument master from the live bond contract registry + auctions. No pricing sources, calendars, or eligibility rules are shown beyond what instruments record; config release approval engine is Phase 5.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-bond-config-evidence-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `Bond configuration evidence (${bondContracts.length} instruments)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'BOND_CONFIG_EXPORT',
      object: `${bondContracts.length} instruments exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('Bond configuration evidence exported');
  };

  const frequencies = useMemo(() => [...new Set(bondContracts.map((b) => b.coupon_frequency).filter(Boolean))], [bondContracts]);
  const actusTypes = useMemo(() => [...new Set(bondContracts.map((b) => b.actus_contract_type).filter(Boolean))], [bondContracts]);
  const currencies = useMemo(() => [...new Set(bondContracts.map((b) => b.currency))], [bondContracts]);

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="System Configuration — Bonds"
        auditPrefix="CB-CFG"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Instrument master read (live) · config release proposals (maker step, approval Phase 5)"
        dataStatus={bondContracts.length > 0 || auctions.length > 0 ? 'available' : 'unavailable'}
        dataFetchedAt={fetchedAt}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {/* Configuration facts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Instruments in master</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{bondContracts.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Live bond contract registry</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Currencies covered</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{currencies.join(', ') || '—'}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>From registered instruments</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Coupon frequencies</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{frequencies.join(' · ') || 'Not recorded'}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>As registered — no defaults assumed</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>ACTUS contract types</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{actusTypes.join(' · ') || 'Not recorded'}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Simulation taxonomies in force</div>
        </div>
      </div>

      {/* Config release */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Configuration releases</h3>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              {releaseProposals.length === 0
                ? `No open release proposals. A release scopes to ${releaseTarget}. Developers cannot promote unapproved config — peer review + approval are Phase 5.`
                : `${releaseProposals.length} open proposal(s): ${releaseProposals.map((r) => `${r.id} (${r.scope})`).join(', ')} — pending peer review + approval.`}
            </div>
          </div>
          <button onClick={proposeRelease} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>Propose release</button>
        </div>
      </div>

      {/* Instrument master */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            Bond instrument master ({bondContracts.length})
          </h3>
          <button onClick={exportEvidence} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>Export Evidence</button>
        </div>
        {bondContracts.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '14px 0', textAlign: 'center' }}>
            The bond contract registry is empty — instruments appear here as real contracts are registered on the ledger.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Issuer / contract</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>ISIN · DTI</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Currency</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Coupon</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Frequency</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Maturity</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bondContracts.map((b) => (
                  <tr key={b.contract_id} style={{ borderBottom: '1px solid var(--border-subtle)' }} title={`${b.issuer_name} · ${b.actus_contract_type} · canister ${b.canister_principal_id} · collateral ${b.collateral_backing}`}>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 700 }}>{b.issuer_name}</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{b.contract_id}</div>
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{b.isin_code || '—'}<br />{b.dti_code || '—'}</td>
                    <td style={{ padding: '8px' }}>{b.currency}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{b.coupon_rate_pct}%</td>
                    <td style={{ padding: '8px', fontSize: '11px' }}>{b.coupon_frequency || 'Not recorded'}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{b.maturity_date}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: b.status === 'Active' ? '#2BA640' : '#F5C842' }}>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auction configuration */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '12px' }}>
          Auction configuration ({auctions.length}) — yield mechanics actually configured
        </h3>
        {auctions.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '10px 0', textAlign: 'center' }}>No auctions configured.</div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Auction</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Bond</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Target yield</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Cutoff yield</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Bids</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Maturity</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((a) => (
                  <tr key={a.auction_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{a.auction_id}</td>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{a.bond_symbol}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{a.target_yield_pct}%</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{a.cutoff_yield_pct}%</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{a.bids_count}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{a.maturity_date}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: a.status === 'Open' ? '#2BA640' : 'var(--text-muted)' }}>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
