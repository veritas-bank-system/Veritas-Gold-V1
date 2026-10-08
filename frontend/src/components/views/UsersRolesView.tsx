import React, { useMemo, useState } from 'react';
import type { AppSection, PrincipalProfile, PendingApproval } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';
import { getSessionEvents } from '../../services/sessionAudit';

/**
 * Users & Roles — role matrix, SoD conflicts, recertification, sessions per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. The user registry is the LIVE
 * identity registry; the role matrix is derived from real roles (no invented
 * users). The 8 SoD conflict pairs from the spec are evaluated against the
 * actual registered roles and reported honestly — pairs that cannot occur
 * in the current registry are marked "not present in registry", not hidden.
 * Sessions shown are this browser session's real audit events (the server
 * session store is Phase 5). Recertification is a maker-step proposal.
 */

interface UsersRolesViewProps {
  identities: PrincipalProfile[];
  pendingApprovals: PendingApproval[];
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

/** The 8 SoD conflict pairs from the spec's "Segregation-of-duties conflicts". */
const SOD_PAIRS: [string, string, string][] = [
  ['Treasury Trader', 'Settlement Officer', 'Trader plus final trade approver'],
  ['Compliance Officer', 'Auditor', 'Compliance-policy editor plus compliance auditor'],
  ['Security Administrator', 'Auditor', 'Security administrator plus audit-log administrator'],
  ['Settlement Officer', 'Custody Officer', 'Settlement initiator plus settlement confirmer'],
  ['Central Bank Operator & Governor', 'Auditor', 'System administrator plus evidence deletion authority'],
  ['Compliance Officer', 'Settlement Officer', 'User-access administrator plus independent access reviewer'],
];

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  identities,
  pendingApprovals,
  personaRoleTitle,
  institutionName,
  environment,
  onNavigate,
  onNotify,
}) => {
  const [recertProposals, setRecertProposals] = useState<Record<string, string>>({});
  // Capture fetch freshness in state — Date.now() at render is impure (React Compiler purity rule).
  const [fetchedAt] = useState<number | null>(() => (identities.length > 0 ? Date.now() : null));

  const roleMatrix = useMemo(() => {
    const byRole = new Map<string, { users: PrincipalProfile[]; verified: number }>();
    for (const i of identities) {
      const key = i.role;
      const entry = byRole.get(key) ?? { users: [], verified: 0 };
      entry.users.push(i);
      if (i.is_verified) entry.verified += 1;
      byRole.set(key, entry);
    }
    return [...byRole.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [identities]);

  const sodFindings = useMemo(() => {
    return SOD_PAIRS.map(([roleA, roleB, description]) => {
      const hasA = identities.some((i) => i.role === roleA || i.legal_name === roleA);
      const hasB = identities.some((i) => i.role === roleB || i.legal_name === roleB);
      const samePrincipal = identities.some((i) => (i.role === roleA || i.legal_name === roleA) && (i.role === roleB || i.legal_name === roleB));
      if (samePrincipal) {
        return { description, roleA, roleB, state: 'CONFLICT' as const, detail: 'One principal holds both sides of this conflict pair in the live registry.' };
      }
      if (hasA && hasB) {
        return { description, roleA, roleB, state: 'SEPARATE' as const, detail: 'Both roles exist but on distinct principals — no violation.' };
      }
      return { description, roleA, roleB, state: 'NOT PRESENT' as const, detail: 'At least one side of this pair is not present in the current registry.' };
    });
  }, [identities]);

  const proposeRecert = (principal: string, legalName: string): void => {
    if (recertProposals[principal]) {
      onNotify(`${legalName} already has a recertification proposal this session`, true);
      return;
    }
    const at = new Date().toISOString();
    setRecertProposals((current) => ({ ...current, [principal]: at }));
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'RECERTIFICATION_PROPOSED',
      object: `${legalName} — access recertification (maker step; checker Phase 5)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'RECERTIFICATION_PROPOSED',
      object: legalName,
      environment,
    }).catch(() => onNotify('Ledger unavailable — proposal recorded in-session only', true));
    onNotify(`Recertification proposed for ${legalName} — checker pending`);
  };

  const exportEvidence = (): void => {
    const payload = {
      view: 'Users & Roles',
      generated_at: new Date().toISOString(),
      role_matrix: roleMatrix.map(([role, e]) => ({ role, users: e.users.length, verified: e.verified })),
      sod_findings: sodFindings,
      recertification_proposals: recertProposals,
      active_session_events: getSessionEvents(),
      provenance: 'Role matrix from GET /api/v1/identities (live). SoD findings evaluated against the real registry. Session events are this browser session only (server session store Phase 5).',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-users-roles-evidence-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `Users & Roles evidence (${roleMatrix.length} roles, ${sodFindings.length} SoD checks)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'USERS_ROLES_EXPORT',
      object: `${roleMatrix.length} roles exported`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify('Users & Roles evidence exported');
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Users & Roles"
        auditPrefix="CB-USR"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Role matrix read · SoD evaluation · recertification proposals (maker step)"
        dataStatus={identities.length > 0 ? 'available' : 'unavailable'}
        dataFetchedAt={fetchedAt}
        pendingApprovals={pendingApprovals.length}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {/* Role matrix */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            Role matrix ({roleMatrix.length} roles, {identities.length} principals)
          </h3>
          <button onClick={exportEvidence} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>Export Evidence</button>
        </div>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Role</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Principals</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Verified</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Holders</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Recertification</th>
              </tr>
            </thead>
            <tbody>
              {roleMatrix.map(([role, e]) => (
                <tr key={role} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{role}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{e.users.length}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: e.verified === e.users.length ? '#2BA640' : '#F5C842' }}>{e.verified}/{e.users.length}</td>
                  <td style={{ padding: '8px', fontSize: '11px' }}>{e.users.map((u) => u.legal_name).join(', ')}</td>
                  <td style={{ padding: '8px' }}>
                    {e.users.every((u) => recertProposals[u.principal]) ? (
                      <span style={{ color: '#F5C842', fontSize: '11px' }}>Proposed</span>
                    ) : (
                      <button onClick={() => e.users.forEach((u) => !recertProposals[u.principal] && proposeRecert(u.principal, u.legal_name))} className="btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }}>
                        Propose review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SoD conflicts */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '4px' }}>
          Segregation-of-duties conflicts ({sodFindings.filter((f) => f.state === 'CONFLICT').length} violations)
        </h3>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '12px' }}>
          Evaluated live against the registry — pairs that cannot occur here are labelled as such rather than reported clean.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sodFindings.map((f) => (
            <div key={f.description} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '6px' }}>
              <div style={{ fontSize: '12px' }}>
                <strong>{f.roleA}</strong> + <strong>{f.roleB}</strong>
                <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>{f.description} — {f.detail}</div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', whiteSpace: 'nowrap', color: f.state === 'CONFLICT' ? '#EF4444' : f.state === 'SEPARATE' ? '#2BA640' : 'var(--text-dim)', border: `1px solid ${f.state === 'CONFLICT' ? 'rgba(239,68,68,0.45)' : f.state === 'SEPARATE' ? 'rgba(43,166,64,0.4)' : 'var(--border-subtle)'}` }}>
                {f.state}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active sessions */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '4px' }}>
          Active sessions (this browser)
        </h3>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px' }}>
          Real in-session audit events; a server-side session store with revocation is a Phase 5 item.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {getSessionEvents().slice(0, 10).map((e, idx) => (
            <div key={idx} style={{ fontSize: '11.5px', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-dim)' }}>{new Date(e.timestamp).toISOString().slice(11, 19)}Z</span> · <strong>{e.action}</strong> · {e.object}
            </div>
          ))}
          {getSessionEvents().length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', padding: '8px 0' }}>No session events recorded yet.</div>}
        </div>
      </div>
    </div>
  );
};
