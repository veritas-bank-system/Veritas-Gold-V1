import React, { useMemo, useState } from 'react';
import type { AppSection } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { getSessionEvents } from '../../services/sessionAudit';
import type { SessionAuditEvent } from '../../services/sessionAudit';

/**
 * Access Logs — authentication/authorization/privilege event log per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. Only genuine in-session client
 * events are shown, each with its SHA-256 evidence hash. There is no server
 * audit-trail source yet (Phase 3 backlog), and the view says so plainly —
 * it never pretends that browser records are ledger-side history.
 */

interface AccessLogsViewProps {
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  pendingApprovals: number;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

function fmtTimestamp(ts: number): string {
  return `${new Date(ts).toISOString().replace('T', ' ').slice(0, 19)}Z`;
}

const ACTION_FILTERS = ['ALL', 'LOGIN', 'PERSONA_SWITCH', 'EXPORT_EVIDENCE', 'UNMASK_AUDIT', 'LIMIT_PROPOSED', 'LIMIT_APPROVED', 'STRESS_RUN_ATTEMPTED', 'STRESS_SCENARIO_CREATED'];

export const AccessLogsView: React.FC<AccessLogsViewProps> = ({
  personaRoleTitle,
  institutionName,
  environment,
  pendingApprovals,
  onNavigate,
  onNotify,
}) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'Success' | 'Failure'>('ALL');

  const events = useMemo<SessionAuditEvent[]>(() => {
    return getSessionEvents().filter((e) => {
      if (actionFilter !== 'ALL' && e.action !== actionFilter) return false;
      if (resultFilter !== 'ALL' && e.result !== resultFilter) return false;
      if (query) {
        const hay = `${e.actor} ${e.institution} ${e.action} ${e.object} ${e.reason ?? ''}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
    // refreshTick invalidates the memo after new events are recorded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, actionFilter, resultFilter, refreshTick]);

  const exportCsv = (): void => {
    const header = 'seq,timestamp_utc,actor,effective_role,institution,action,object,environment,device,session_id,result,reason,approval_reference,evidence_hash';
    const rows = events.map((e) =>
      [e.seq, fmtTimestamp(e.timestamp), e.actor, e.effectiveRole, e.institution, e.action, `"${e.object.replace(/"/g, '""')}"`, e.environment, `"${e.device}"`, e.sessionId, e.result, `"${(e.reason ?? '').replace(/"/g, '""')}"`, e.approvalReference ?? '', e.evidenceHash].join(','),
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-access-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Access log export (${events.length} events, CSV)`);
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Access Logs"
        auditPrefix="CB-ACCESS"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Investigate only — log records cannot be modified from this view"
        dataStatus="no-source"
        pendingApprovals={pendingApprovals}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      <div
        style={{
          border: '1px solid rgba(245, 158, 11, 0.4)',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          color: '#FCD34D',
          marginBottom: '16px',
          lineHeight: 1.5,
        }}
      >
        <b>Scope notice.</b> A server-side audit-trail source is not connected yet (Phase 3 backlog). This view shows only events that genuinely
        occurred in <i>this browser session</i>, each sealed with a SHA-256 evidence hash. It is not ledger-side history and does not cover other
        sessions, users, or institutions.
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-flat"
            placeholder="Search actor, institution, object, reason…"
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input-flat" style={{ width: 'auto' }}>
            {ACTION_FILTERS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value as typeof resultFilter)} className="input-flat" style={{ width: 'auto' }}>
            <option value="ALL">All results</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
          </select>
          <button onClick={() => setRefreshTick((t) => t + 1)} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>
            Refresh
          </button>
          <button onClick={exportCsv} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }} disabled={events.length === 0}>
            Export CSV ({events.length})
          </button>
        </div>

        {events.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '18px 0', textAlign: 'center' }}>
            No in-session events match this filter yet. Events appear as you sign in, switch persona, export evidence, propose limits, or audit a
            blinded key — nothing is ever pre-seeded.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Timestamp (UTC)</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Actor / role</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Institution</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Action</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Object</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Result</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Reason</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Evidence hash</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={`${e.seq}-${e.timestamp}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'nowrap' }}>{fmtTimestamp(e.timestamp)}</td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 700 }}>{e.actor}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{e.effectiveRole}</div>
                    </td>
                    <td style={{ padding: '8px' }}>{e.institution}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{e.action}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.object}>
                      {e.object}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 700, color: e.result === 'Success' ? '#2BA640' : '#EF4444' }}>{e.result}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)', maxWidth: '200px' }}>{e.reason ?? '—'}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px' }} title={e.evidenceHash}>
                      {e.evidenceHash.slice(0, 12)}…
                    </td>
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
