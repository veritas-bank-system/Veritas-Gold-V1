import React, { useMemo, useState } from 'react';
import type { AppSection, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';

/**
 * Mandates & Policies — policy catalogue, versioned drafts, exceptions with
 * expiry per docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. The catalogue is the
 * set of mandates this platform actually operates (drawn from the operator's
 * real configured limits/scopes on other views) — version history and policy
 * persistence are a Phase 5 engine, so drafts carry explicit "unpublished"
 * state and exceptions always carry owner + expiry + justification as the
 * spec requires. No fake version numbers: a policy with no recorded
 * amendments shows version 1.0 and says "no recorded amendments".
 */

interface MandatesPoliciesViewProps {
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface PolicyEntry {
  id: string;
  name: string;
  scope: string;
  version: string;
  state: 'Published' | 'Draft amendment';
  sourceNote: string;
}

interface PolicyException {
  policy: string;
  justification: string;
  owner: string;
  expiresAt: string;
}

const CATALOGUE: PolicyEntry[] = [
  { id: 'POL-SCOPE', name: 'Institution scope & least privilege', scope: 'All workspaces', version: '1.0', state: 'Published', sourceNote: 'Enforced in-session: views scope data to the active persona; server enforcement Phase 5.' },
  { id: 'POL-SOD', name: 'Segregation of duties — 8 conflict pairs', scope: 'Access & approvals', version: '1.0', state: 'Published', sourceNote: 'Evaluated live in Users & Roles against the identity registry.' },
  { id: 'POL-FOUR-EYES', name: 'Four-eyes on high-value actions', scope: 'Approvals, payments, transfers', version: '1.0', state: 'Published', sourceNote: 'Release/creation separation visible in Payments & ISO 20022 and Delivery & Transfers.' },
  { id: 'POL-AUDIT-CHAIN', name: 'Hash-chained immutable audit trail', scope: 'All state changes', version: '1.0', state: 'Published', sourceNote: 'Live on the ledger (append-only journal) — persistence Phase 5.' },
  { id: 'POL-NO-FABRICATION', name: 'Zero fabricated data on any screen', scope: 'Every view', version: '1.0', state: 'Published', sourceNote: 'Enforced: absent sources show explicit not-connected states, never invented figures.' },
];

export const MandatesPoliciesView: React.FC<MandatesPoliciesViewProps> = ({
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  onNavigate,
  onNotify,
}) => {
  const [amendDrafts, setAmendDrafts] = useState<Record<string, { proposedBy: string; at: string; note: string }>>({});
  const [exceptions, setExceptions] = useState<PolicyException[]>([]);
  const [exDraftFor, setExDraftFor] = useState<string | null>(null);
  const [exJustification, setExJustification] = useState('');
  const [exDays, setExDays] = useState('30');
  // Capture freshness in state — Date.now() at render is impure (purity rule).
  const [fetchedAt] = useState<number | null>(() => Date.now());

  const catalogue = useMemo(
    () => CATALOGUE.map((p) => (amendDrafts[p.id] ? { ...p, state: 'Draft amendment' as const } : p)),
    [amendDrafts],
  );

  const proposeAmendment = (p: PolicyEntry): void => {
    if (amendDrafts[p.id]) {
      onNotify(`${p.name} already has an unpublished amendment draft this session`, true);
      return;
    }
    const at = new Date().toISOString();
    setAmendDrafts((current) => ({ ...current, [p.id]: { proposedBy: personaRoleTitle, at, note: `Amendment proposed by ${personaRoleTitle}` } }));
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'POLICY_AMENDMENT_DRAFTED',
      object: `${p.id} ${p.name} — draft amendment (editor step; publication is a separate approver, Phase 5)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'POLICY_AMENDMENT_DRAFTED',
      object: `${p.id} — ${p.name}`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — draft recorded in-session only', true));
    onNotify(`Amendment drafted for ${p.name} — editor cannot publish own draft`);
  };

  const addException = (policyId: string, policyName: string): void => {
    if (!exJustification.trim()) {
      onNotify('A justification is required before an exception can be recorded', true);
      return;
    }
    const days = Math.max(1, Math.min(365, parseInt(exDays, 10) || 30));
    const ex: PolicyException = {
      policy: policyName,
      justification: exJustification.trim(),
      owner: personaRoleTitle,
      expiresAt: new Date(Date.now() + days * 86400000).toISOString().slice(0, 10),
    };
    setExceptions((current) => [ex, ...current]);
    setExDraftFor(null);
    setExJustification('');
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'POLICY_EXCEPTION_RECORDED',
      object: `${policyId} — expires ${ex.expiresAt} — ${ex.justification.slice(0, 60)}`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'POLICY_EXCEPTION_RECORDED',
      object: `${policyId} — expires ${ex.expiresAt}`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — exception recorded in-session only', true));
    onNotify(`Exception recorded against ${policyName} — expires ${ex.expiresAt}`);
  };

  const exportEvidence = (): void => {
    const payload = {
      view: 'Mandates & Policies',
      generated_at: new Date().toISOString(),
      catalogue,
      exceptions,
      amendment_drafts: amendDrafts,
      provenance: 'Catalogue entries describe mandates actually enforced in this build (source note on each). Versioned policy persistence is Phase 5.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-mandates-evidence-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `Mandates & Policies evidence (${catalogue.length} policies, ${exceptions.length} exceptions)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'MANDATES_EXPORT',
      object: `${catalogue.length} policies exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('Mandates & Policies evidence exported');
  };

  const nowIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Mandates & Policies"
        auditPrefix="CB-MND"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Catalogue read · amendment drafts (editor ≠ publisher) · exceptions with owner + expiry"
        dataStatus="available"
        dataFetchedAt={fetchedAt}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {/* Catalogue */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            Policy catalogue ({catalogue.length}) — every entry maps to an enforced behaviour
          </h3>
          <button onClick={exportEvidence} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>Export Evidence</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {catalogue.map((p) => (
            <div key={p.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>{p.id}</span>{' '}
                  <strong style={{ fontSize: '12.5px' }}>{p.name}</strong>{' '}
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>· v{p.version} · {p.scope}</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', color: p.state === 'Published' ? '#2BA640' : '#F5C842', border: `1px solid ${p.state === 'Published' ? 'rgba(43,166,64,0.4)' : 'rgba(245,200,66,0.45)'}` }}>
                  {p.state}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{p.sourceNote}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                No recorded amendments. {amendDrafts[p.id] ? `Draft by ${amendDrafts[p.id].proposedBy} at ${amendDrafts[p.id].at} — unpublished (editor ≠ publisher).` : ''}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => proposeAmendment(p)} className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }} disabled={!!amendDrafts[p.id]}>
                  Draft amendment
                </button>
                <button onClick={() => setExDraftFor(exDraftFor === p.id ? null : p.id)} className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }}>
                  Record exception…
                </button>
              </div>
              {exDraftFor === p.id && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input value={exJustification} onChange={(e) => setExJustification(e.target.value)} className="input-flat" placeholder="Justification (required)" style={{ flex: 1, minWidth: '200px', fontSize: '11px' }} />
                  <input value={exDays} onChange={(e) => setExDays(e.target.value)} className="input-flat" style={{ width: '70px', fontSize: '11px' }} title="Expiry in days" />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>days</span>
                  <button onClick={() => addException(p.id, p.name)} className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }}>Record</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Exceptions register */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '4px' }}>
          Exception register ({exceptions.length})
        </h3>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px' }}>
          Spec law: every exception carries owner, justification, and expiry — expired exceptions must stop applying (enforcement is Phase 5; the register below is audit-recorded).
        </div>
        {exceptions.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '12px 0', textAlign: 'center' }}>No exceptions recorded. Empty is the compliant default.</div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Policy</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Justification</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Owner</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Expiry</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>State</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((ex, idx) => {
                  const expired = ex.expiresAt < nowIso;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{ex.policy}</td>
                      <td style={{ padding: '8px', fontSize: '11px' }}>{ex.justification}</td>
                      <td style={{ padding: '8px', fontSize: '11px' }}>{ex.owner}</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{ex.expiresAt}</td>
                      <td style={{ padding: '8px', fontWeight: 700, color: expired ? '#EF4444' : '#F5C842' }}>{expired ? 'Expired' : 'Active'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
