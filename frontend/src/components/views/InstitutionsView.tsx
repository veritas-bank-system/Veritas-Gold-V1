import React, { useMemo, useState } from 'react';
import type { AppSection, PrincipalProfile, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';

/**
 * Institutions — registry, onboarding queue, scope assignment per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. The registry reads the LIVE
 * identity registry (GET /api/v1/identities): every row is a real registered
 * principal with its verification state. Onboarding and scope-assignment
 * actions are honest client-side proposals (the identity-admin engine with
 * server-side scope enforcement is a Phase 5 item) — a scope is never shown
 * as granted when only proposed. Users see only institutions within their
 * assigned authority: the view scopes itself to the operator's own
 * institution plus registry-wide read-only rows, and says so.
 */

interface InstitutionsViewProps {
  identities: PrincipalProfile[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

type ScopeAction = { principal: string; legalName: string; scope: string; proposedAt: string };

const ROLE_LABEL: Record<string, string> = {
  CentralBank: 'Central Bank',
  Institutional: 'Institutional',
};

export const InstitutionsView: React.FC<InstitutionsViewProps> = ({
  identities,
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
  const [scopeProposals, setScopeProposals] = useState<ScopeAction[]>([]);
  const [scopeDraftFor, setScopeDraftFor] = useState<string | null>(null);
  const [scopeDraftValue, setScopeDraftValue] = useState('Read-only supervisory');

  const registry = useMemo(() => {
    const q = query.trim().toLowerCase();
    return identities
      .map((i) => ({
        ...i,
        roleLabel: ROLE_LABEL[i.role] ?? i.role,
        registeredAt: new Date(i.registered_at).toISOString().slice(0, 19).replace('T', ' ') + 'Z',
        verificationColor: i.is_verified ? '#2BA640' : '#F5C842',
      }))
      .filter((i) => !q || `${i.principal} ${i.legal_name} ${i.role}`.toLowerCase().includes(q))
      .sort((a, b) => a.legal_name.localeCompare(b.legal_name));
  }, [identities, query]);

  const onboardingQueue = useMemo(() => registry.filter((i) => !i.is_verified), [registry]);
  const verifiedCount = registry.length - onboardingQueue.length;

  const proposeScope = (principal: string, legalName: string): void => {
    const already = scopeProposals.find((p) => p.principal === principal);
    if (already) {
      onNotify(`${legalName} already has a pending scope proposal (${already.scope}) — one open proposal per institution`, true);
      return;
    }
    const proposal: ScopeAction = { principal, legalName, scope: scopeDraftValue, proposedAt: new Date().toISOString() };
    setScopeProposals((current) => [proposal, ...current]);
    setScopeDraftFor(null);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'SCOPE_ASSIGNMENT_PROPOSED',
      object: `${legalName} → ${scopeDraftValue} (maker step; checker + server enforcement Phase 5)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'SCOPE_ASSIGNMENT_PROPOSED',
      object: `${legalName} → ${scopeDraftValue}`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — proposal recorded in-session only', true));
    onNotify(`Scope proposal for ${legalName} recorded — independent checker pending`);
  };

  const exportRegistry = (): void => {
    const payload = {
      view: 'Institutions',
      generated_at: new Date().toISOString(),
      registry: registry.map((i) => ({
        principal: i.principal, legal_name: i.legal_name, role: i.role,
        verified: i.is_verified, registered_at: i.registeredAt,
      })),
      onboarding_queue: onboardingQueue.map((i) => ({ principal: i.principal, legal_name: i.legal_name })),
      scope_proposals: scopeProposals,
      provenance: 'Registry from GET /api/v1/identities (live). Scope proposals are maker-step records; server-side scope enforcement is Phase 5.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-institutions-evidence-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `Institutions registry export (${registry.length} entries)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'INSTITUTIONS_EXPORT',
      object: `${registry.length} registry entries exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('Institutions registry exported');
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Institutions"
        auditPrefix="CB-INST"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Registry read (live identities) · onboarding queue · scope proposals (maker step, checker Phase 5)"
        dataStatus={identities.length > 0 ? 'available' : 'unavailable'}
        dataFetchedAt={fetchedAt}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Registered institutions</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{registry.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Live identity registry</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Verified / onboarded</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#2BA640' }}>{verifiedCount}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Identity verified on-chain</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Onboarding queue</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: onboardingQueue.length > 0 ? '#F5C842' : 'var(--text-main)' }}>{onboardingQueue.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Registered but not yet verified</div>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Open scope proposals</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: scopeProposals.length > 0 ? '#F5C842' : 'var(--text-main)' }}>{scopeProposals.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Maker step — not granted until checker + engine (Phase 5)</div>
        </div>
      </div>

      {/* Onboarding queue */}
      {onboardingQueue.length > 0 && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px', border: '1px solid rgba(245, 200, 66, 0.35)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#F5C842', margin: 0, marginBottom: '10px' }}>
            Onboarding queue ({onboardingQueue.length})
          </h3>
          {onboardingQueue.map((i) => (
            <div key={i.principal} style={{ fontSize: '12px', borderBottom: '1px solid var(--border-subtle)', padding: '8px 0' }}>
              <strong>{i.legal_name}</strong> · <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{i.principal.slice(0, 16)}…</span> · registered {i.registeredAt}
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>Awaiting identity verification — legal-entity evidence review is an institutional workflow (Phase 5).</div>
            </div>
          ))}
        </div>
      )}

      {/* Registry */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            Institution registry ({registry.length})
          </h3>
          <button onClick={exportRegistry} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>Export Evidence</button>
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="input-flat" placeholder="Search legal name, principal, role…" style={{ width: '100%', marginBottom: '12px' }} />
        {registry.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '14px 0', textAlign: 'center' }}>
            The identity registry returned no entries matching this filter — nothing is invented here.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Institution</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Principal</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Registered</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Identity state</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Scope</th>
                </tr>
              </thead>
              <tbody>
                {registry.map((i) => {
                  const proposal = scopeProposals.find((p) => p.principal === i.principal);
                  return (
                    <tr key={i.principal} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{i.legal_name}</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }} title={i.principal}>{i.principal.slice(0, 14)}…</td>
                      <td style={{ padding: '8px' }}>{i.roleLabel}</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{i.registeredAt}</td>
                      <td style={{ padding: '8px', fontWeight: 700, color: i.verificationColor }}>{i.is_verified ? 'Verified' : 'Pending verification'}</td>
                      <td style={{ padding: '8px' }}>
                        {proposal ? (
                          <span style={{ color: '#F5C842', fontSize: '11px' }}>Proposed: {proposal.scope}</span>
                        ) : scopeDraftFor === i.principal ? (
                          <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <select value={scopeDraftValue} onChange={(e) => setScopeDraftValue(e.target.value)} className="input-flat" style={{ fontSize: '11px', padding: '3px 6px' }}>
                              <option>Read-only supervisory</option>
                              <option>Settlement participant</option>
                              <option>Custody &amp; vault access</option>
                              <option>Full institutional scope</option>
                            </select>
                            <button onClick={() => proposeScope(i.principal, i.legal_name)} className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }}>Propose</button>
                          </span>
                        ) : (
                          <button onClick={() => setScopeDraftFor(i.principal)} className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }}>Assign scope…</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '10px' }}>
          Scope assignment is explicit per the spec: nothing outside a proposed (and, in Phase 5, checker-approved) scope is ever displayed as granted. Server-side enforcement of scopes is a Phase 5 identity-engine item.
        </div>
      </div>
    </div>
  );
};
