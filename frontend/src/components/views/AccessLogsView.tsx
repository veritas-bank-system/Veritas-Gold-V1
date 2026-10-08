import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSection, LedgerAuditEvent } from '../../types';
import { fetchAuditEvents, verifyAuditChain, appendAuditEvent } from '../../services/api';
import { PageContextStrip } from '../smart/PageContextStrip';
import { getSessionEvents } from '../../services/sessionAudit';
import { ShieldCheck, ShieldAlert, FileDown } from 'lucide-react';

/**
 * Access Logs — authentication/authorization/privilege event log per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md, now backed by the LEDGER-SIDE
 * append-only hash-chained audit journal (GET /api/v1/admin/audit-events).
 * Genuine in-session client events are merged underneath and clearly split
 * by source: "Ledger" (server chain, verified) vs "Session" (browser-only).
 * The view is read-only: log viewers investigate, they never modify.
 */

interface AccessLogsViewProps {
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  pendingApprovals: number;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface DisplayRow {
  source: 'Ledger' | 'Session';
  seq: number;
  timestamp: number;
  actor: string;
  effectiveRole: string;
  institution: string;
  action: string;
  object: string;
  environment: string;
  result: string;
  reason: string;
  evidenceHash: string;
}

type SourceState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; ledger: LedgerAuditEvent[]; chainVerified: boolean; chainChecked: number; brokenAt: number | null; total: number };

function fmtTimestamp(ts: number): string {
  return `${new Date(ts).toISOString().replace('T', ' ').slice(0, 19)}Z`;
}

const ACTION_FILTERS = ['ALL', 'CASH_TRANSFER', 'ASSET_TRANSFER', 'LOGIN', 'PERSONA_SWITCH', 'EXPORT_EVIDENCE', 'UNMASK_AUDIT', 'LIMIT_PROPOSED', 'LIMIT_APPROVED', 'STRESS_RUN_ATTEMPTED'];

export const AccessLogsView: React.FC<AccessLogsViewProps> = ({
  personaRoleTitle,
  institutionName,
  environment,
  pendingApprovals,
  onNavigate,
  onNotify,
}) => {
  const [source, setSource] = useState<SourceState>({ kind: 'loading' });
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'Ledger' | 'Session'>('ALL');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'Success' | 'Rejected' | 'Failure'>('ALL');
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    // No synchronous setState here: initial state is already 'loading', so the
    // mount effect stays free of cascading renders (lint: set-state-in-effect).
    try {
      const res = await fetchAuditEvents();
      setSource({
        kind: 'ok',
        ledger: res.events,
        chainVerified: res.chain_verified,
        chainChecked: res.chain_checked,
        brokenAt: res.chain_broken_at_seq,
        total: res.total_events,
      });
    } catch (e) {
      setSource({ kind: 'error', message: e instanceof Error ? e.message : 'audit endpoint unreachable' });
    }
  }, []);

  // Mount fetch: await before setState so the effect triggers no synchronous
  // cascading render (lint: set-state-in-effect). 'load' stays for refresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuditEvents();
        if (cancelled) return;
        setSource({
          kind: 'ok',
          ledger: res.events,
          chainVerified: res.chain_verified,
          chainChecked: res.chain_checked,
          brokenAt: res.chain_broken_at_seq,
          total: res.total_events,
        });
      } catch (e) {
        if (cancelled) return;
        setSource({ kind: 'error', message: e instanceof Error ? e.message : 'audit endpoint unreachable' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<DisplayRow[]>(() => {
    const all: DisplayRow[] = [];
    if (source.kind === 'ok') {
      for (const e of source.ledger) {
        all.push({
          source: 'Ledger',
          seq: e.seq,
          timestamp: e.timestamp_ms,
          actor: e.actor,
          effectiveRole: e.effective_role,
          institution: e.institution,
          action: e.action,
          object: e.object,
          environment: e.environment,
          result: e.result,
          reason: e.reason,
          evidenceHash: e.evidence_hash,
        });
      }
    }
    for (const e of getSessionEvents()) {
      all.push({
        source: 'Session',
        seq: e.seq,
        timestamp: e.timestamp,
        actor: e.actor,
        effectiveRole: e.effectiveRole,
        institution: e.institution,
        action: e.action,
        object: e.object,
        environment: e.environment,
        result: e.result,
        reason: e.reason ?? '',
        evidenceHash: e.evidenceHash,
      });
    }
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.filter((r) => {
      if (sourceFilter !== 'ALL' && r.source !== sourceFilter) return false;
      if (actionFilter !== 'ALL' && r.action !== actionFilter) return false;
      if (resultFilter !== 'ALL' && r.result !== resultFilter) return false;
      if (query) {
        const hay = `${r.actor} ${r.institution} ${r.action} ${r.object} ${r.reason}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [source, query, actionFilter, sourceFilter, resultFilter]);

  const runChainVerification = async (): Promise<void> => {
    setVerifying(true);
    try {
      const v = await verifyAuditChain();
      if (v.chain_verified) {
        onNotify(`Audit chain verified — ${v.events_checked} records re-hashed, head ${v.head_hash?.slice(0, 12)}…`);
      } else {
        onNotify(`CHAIN BREAK DETECTED at seq ${v.broken_at_seq} — evidence integrity compromised`, true);
      }
    } catch {
      onNotify('Chain verification endpoint unreachable', true);
    } finally {
      setVerifying(false);
    }
  };

  const exportCsv = (): void => {
    const header = 'source,seq,timestamp_utc,actor,effective_role,institution,action,object,environment,result,reason,evidence_hash';
    const body = rows.map((r) =>
      [r.source, r.seq, fmtTimestamp(r.timestamp), r.actor, r.effectiveRole, r.institution, r.action, `"${r.object.replace(/"/g, '""')}"`, r.environment, r.result, `"${r.reason.replace(/"/g, '""')}"`, r.evidenceHash].join(','),
    );
    const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-access-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    // The export itself is a sensitive action: record it on the ledger chain.
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'ACCESS_LOG_EXPORT',
      object: `CSV of ${rows.length} access-log rows (source filter: ${sourceFilter}, action: ${actionFilter})`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify(`Access log export (${rows.length} rows, CSV)`);
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
        dataStatus={source.kind === 'ok' ? 'available' : source.kind === 'loading' ? 'loading' : 'unavailable'}
        pendingApprovals={pendingApprovals}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {source.kind === 'ok' && (
        <div
          style={{
            border: `1px solid ${source.chainVerified ? 'rgba(43, 166, 64, 0.45)' : 'rgba(239, 68, 68, 0.55)'}`,
            backgroundColor: source.chainVerified ? 'rgba(43, 166, 64, 0.08)' : 'rgba(239, 68, 68, 0.10)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: source.chainVerified ? '#7EE2A0' : '#FCA5A5',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {source.chainVerified ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
          <span>
            <b>Ledger audit chain {source.chainVerified ? 'verified' : 'BROKEN'}.</b>{' '}
            {source.chainVerified
              ? `${source.total} append-only records on the server-side hash chain (view shows latest ${source.ledger.length}).`
              : `Integrity failure at seq ${source.brokenAt} — treat all downstream evidence as compromised and escalate.`}
          </span>
          <button onClick={() => void runChainVerification()} disabled={verifying} className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', marginLeft: 'auto' }}>
            {verifying ? 'Verifying…' : 'Verify chain'}
          </button>
        </div>
      )}

      {source.kind === 'error' && (
        <div
          style={{
            border: '1px solid rgba(245, 158, 11, 0.4)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#FCD34D',
            marginBottom: '16px',
          }}
        >
          <b>Ledger audit endpoint unreachable ({source.message}).</b> Showing in-session client events only — they are browser records, not
          ledger-side history, and cover this session alone.
        </div>
      )}

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-flat"
            placeholder="Search actor, institution, object, reason…"
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)} className="input-flat" style={{ width: 'auto' }}>
            <option value="ALL">All sources</option>
            <option value="Ledger">Ledger (verified)</option>
            <option value="Session">Session (browser)</option>
          </select>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input-flat" style={{ width: 'auto' }}>
            {ACTION_FILTERS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value as typeof resultFilter)} className="input-flat" style={{ width: 'auto' }}>
            <option value="ALL">All results</option>
            <option value="Success">Success</option>
            <option value="Rejected">Rejected</option>
            <option value="Failure">Failure</option>
          </select>
          <button
            onClick={() => {
              setSource({ kind: 'loading' });
              void load();
            }}
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '6px 10px' }}
          >
            Refresh
          </button>
          <button onClick={exportCsv} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }} disabled={rows.length === 0}>
            <FileDown size={11} style={{ verticalAlign: '-2px' }} /> Export CSV ({rows.length})
          </button>
        </div>

        {rows.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '18px 0', textAlign: 'center' }}>
            {source.kind === 'loading'
              ? 'Loading ledger audit journal…'
              : 'No events match this filter. Ledger events appear as money and asset movements are executed; session events appear as you act.'}
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Timestamp (UTC)</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Source</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Actor / role</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Institution</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Action</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Object</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Result</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Evidence hash</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.source}-${r.seq}-${r.timestamp}-${i}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'nowrap' }}>{fmtTimestamp(r.timestamp)}</td>
                    <td style={{ padding: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          backgroundColor: r.source === 'Ledger' ? 'rgba(43, 166, 64, 0.14)' : 'rgba(245, 200, 66, 0.12)',
                          color: r.source === 'Ledger' ? '#7EE2A0' : '#F5C842',
                        }}
                      >
                        {r.source}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 700 }}>{r.actor}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{r.effectiveRole}</div>
                    </td>
                    <td style={{ padding: '8px' }}>{r.institution}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{r.action}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', maxWidth: '230px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.object}>
                      {r.object}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 700, color: r.result === 'Success' ? '#2BA640' : '#EF4444' }}>{r.result}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px' }} title={r.evidenceHash}>
                      {r.evidenceHash.slice(0, 12)}…
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
