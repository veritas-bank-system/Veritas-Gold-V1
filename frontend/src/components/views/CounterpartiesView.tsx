import React, { useMemo, useState } from 'react';
import type { AppSection, PrincipalProfile, DemandDepositRecord, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';

/**
 * Counterparties — registry, KYC/AML/sanctions states, document expiry,
 * eligibility per docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. The registry is
 * the LIVE identity registry joined with live settlement accounts. Compliance
 * states (KYC/AML/sanctions) are shown honestly: the platform has no
 * sanctions-screening or KYC engine yet (Phase 5), so a counterparty with no
 * verified identity is displayed as "Not screened — Phase 5 engine", never
 * as "Clear". A false "clear" would be a compliance defect. Eligibility
 * proposals follow the same maker-step discipline as the other views.
 */

interface CounterpartiesViewProps {
  identities: PrincipalProfile[];
  accounts: DemandDepositRecord[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

/** Counterparties whose legal_name appears in the institutional persona set. */
const KNOWN_DOCUMENT_EXPIRY: Record<string, string> = {};

export const CounterpartiesView: React.FC<CounterpartiesViewProps> = ({
  identities,
  accounts,
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  onNavigate,
  onNotify,
}) => {
  const [query, setQuery] = useState('');
  // Capture fetch freshness in state — Date.now() at render is impure (React Compiler purity rule).
  const [fetchedAt] = useState<number | null>(() => (identities.length > 0 ? Date.now() : null));
  const [eligibilityProposals, setEligibilityProposals] = useState<Record<string, string>>({});

  const counterparties = useMemo(() => {
    const q = query.trim().toLowerCase();
    return identities
      .map((i) => {
        const custodianAccounts = accounts.filter((a) => a.custodian === i.legal_name || a.owner === i.principal);
        const docsExpiry = KNOWN_DOCUMENT_EXPIRY[i.legal_name];
        return {
          ...i,
          principalShort: `${i.principal.slice(0, 12)}…`,
          settlementAccounts: custodianAccounts.length,
          kyc: i.is_verified ? 'Verified (identity registry)' : 'Not screened — Phase 5 engine',
          aml: 'Not screened — Phase 5 engine',
          sanctions: 'Not screened — Phase 5 engine',
          docsExpiry,
          eligibility: i.is_verified ? 'Eligible for settlement (identity verified)' : 'Ineligible — identity unverified',
        };
      })
      .filter((c) => !q || `${c.legal_name} ${c.principal} ${c.role}`.toLowerCase().includes(q))
      .sort((a, b) => a.legal_name.localeCompare(b.legal_name));
  }, [identities, accounts, query]);

  const eligibleCount = counterparties.filter((c) => c.is_verified).length;

  const proposeEligibility = (principal: string, legalName: string): void => {
    if (eligibilityProposals[principal]) {
      onNotify(`${legalName} already has an eligibility proposal this session`, true);
      return;
    }
    const at = new Date().toISOString();
    setEligibilityProposals((current) => ({ ...current, [principal]: at }));
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'COUNTERPARTY_ELIGIBILITY_PROPOSED',
      object: `${legalName} — eligibility workflow (maker step; compliance checker Phase 5)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'COUNTERPARTY_ELIGIBILITY_PROPOSED',
      object: legalName,
      environment,
    }).catch(() => onNotify('Ledger unavailable — proposal recorded in-session only', true));
    onNotify(`Eligibility proposed for ${legalName} — compliance checker pending`);
  };

  const exportEvidence = (): void => {
    const payload = {
      view: 'Counterparties',
      generated_at: new Date().toISOString(),
      counterparties: counterparties.map((c) => ({
        legal_name: c.legal_name, principal: c.principal, role: c.role,
        verified: c.is_verified, kyc: c.kyc, aml: c.aml, sanctions: c.sanctions,
        settlement_accounts: c.settlementAccounts, eligibility: c.eligibility,
        document_expiry: c.docsExpiry ?? null,
        eligibility_proposal: eligibilityProposals[c.principal] ?? null,
      })),
      provenance: 'Registry joined from GET /api/v1/identities and GET /api/v1/reporting/accounts. Compliance screening engines are Phase 5 — unscreened states are labelled, never reported clear.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-counterparties-evidence-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `Counterparties evidence (${counterparties.length} entries)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'COUNTERPARTIES_EXPORT',
      object: `${counterparties.length} entries exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('Counterparties evidence exported');
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Counterparties"
        auditPrefix="CB-CP"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Registry read · compliance states honest (unscreened labelled) · eligibility proposals (maker step)"
        dataStatus={identities.length > 0 ? 'available' : 'unavailable'}
        dataFetchedAt={fetchedAt}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Registered counterparties</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{counterparties.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Live identity registry</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Identity-verified</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#2BA640' }}>{eligibleCount}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Verified on-chain identity</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>AML / sanctions screening</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F5C842' }}>0</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>No screening engine connected (Phase 5) — nobody is reported clear without one</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Eligibility proposals open</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: Object.keys(eligibilityProposals).length > 0 ? '#F5C842' : 'var(--text-main)' }}>{Object.keys(eligibilityProposals).length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Maker step — checker Phase 5</div>
        </div>
      </div>

      {/* Registry */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            Counterparty registry ({counterparties.length})
          </h3>
          <button onClick={exportEvidence} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>Export Evidence</button>
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="input-flat" placeholder="Search legal name, principal…" style={{ width: '100%', marginBottom: '12px' }} />
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Counterparty</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Principal</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Settlement accts</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>KYC</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>AML / Sanctions</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Docs expiry</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Eligibility</th>
              </tr>
            </thead>
            <tbody>
              {counterparties.map((c) => (
                <tr key={c.principal} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{c.legal_name}</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }} title={c.principal}>{c.principalShort}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.settlementAccounts}</td>
                  <td style={{ padding: '8px', fontSize: '11px', color: c.is_verified ? '#2BA640' : '#F5C842' }}>{c.kyc}</td>
                  <td style={{ padding: '8px', fontSize: '11px', color: '#F5C842' }}>{c.aml} / {c.sanctions}</td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{c.docsExpiry ?? '—'}</td>
                  <td style={{ padding: '8px', fontSize: '11px' }}>
                    {eligibilityProposals[c.principal] ? (
                      <span style={{ color: '#F5C842' }}>Proposal recorded</span>
                    ) : c.is_verified ? (
                      <>
                        <span style={{ color: '#2BA640', marginRight: '6px' }}>{c.eligibility}</span>
                        <button onClick={() => proposeEligibility(c.principal, c.legal_name)} className="btn-secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>Extend…</button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: '#EF4444', marginRight: '6px' }}>{c.eligibility}</span>
                        <button onClick={() => proposeEligibility(c.principal, c.legal_name)} className="btn-secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>Propose…</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '10px' }}>
          Compliance law: screening states that do not exist are displayed as absent. A counterparty is never shown "sanctions clear" without a connected screening engine — fail closed, per the banking rules.
        </div>
      </div>
    </div>
  );
};
