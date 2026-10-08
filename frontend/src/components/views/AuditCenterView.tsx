import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSection, LedgerAuditEvent } from '../../types';
import { fetchAuditEvents, verifyAuditChain } from '../../services/api';
import { PageContextStrip } from '../smart/PageContextStrip';
import { getSessionEvents } from '../../services/sessionAudit';
import { recordSessionEvent } from '../../services/sessionAudit';
import { appendAuditEvent } from '../../services/api';
import { FileDown, Search } from 'lucide-react';

/**
 * Audit Center — global event search, timeline, entity history, evidence
 * validation, export builder per docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md.
 * Backed by the LIVE ledger-side append-only hash-chained audit journal
 * (GET /api/v1/admin/audit-events) — the same source as Access Logs, but with
 * investigation depth: entity timelines, before/after diffs, evidence-hash
 * validation, and a versioned export builder. Read-only for investigators;
 * exports are controlled, logged, and re-attested to the chain.
 */

interface AuditCenterViewProps {
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  pendingApprovals: number;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

type SourceState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; ledger: LedgerAuditEvent[]; chainVerified: boolean; total: number };

type Tab = 'search' | 'timeline' | 'entity' | 'evidence';

function fmtTimestamp(ts: number): string {
  return `${new Date(ts).toISOString().replace('T', ' ').slice(0, 19)}Z`;
}

export const AuditCenterView: React.FC<AuditCenterViewProps> = ({
  personaRoleTitle,
  institutionName,
  environment,
  pendingApprovals,
  onNavigate,
  onNotify,
}) => {
  const [source, setSource] = useState<SourceState>({ kind: 'loading' });
  // Capture the fetch completion time in state (not Date.now() at render —
  // that is impure during render per the React Compiler purity rule).
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [entity, setEntity] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<{ chain_verified: boolean; events_checked: number; broken_at_seq: number | null; head_hash: string | null } | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await fetchAuditEvents();
      setSource({ kind: 'ok', ledger: res.events, chainVerified: res.chain_verified, total: res.total_events });
      setFetchedAt(Date.now());
    } catch (e) {
      setSource({ kind: 'error', message: e instanceof Error ? e.message : 'audit endpoint unreachable' });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuditEvents();
        if (cancelled) return;
        setSource({ kind: 'ok', ledger: res.events, chainVerified: res.chain_verified, total: res.total_events });
        setFetchedAt(Date.now());
      } catch (e) {
        if (cancelled) return;
        setSource({ kind: 'error', message: e instanceof Error ? e.message : 'audit endpoint unreachable' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const searchResults = useMemo<LedgerAuditEvent[]>(() => {
    if (source.kind !== 'ok') return [];
    const q = query.trim().toLowerCase();
    if (!q) return source.ledger;
    return source.ledger.filter((e) =>
      `${e.actor} ${e.effective_role} ${e.institution} ${e.action} ${e.object} ${e.correlation_id} ${e.result}`.toLowerCase().includes(q),
    );
  }, [source, query]);

  const entityEvents = useMemo<LedgerAuditEvent[]>(() => {
    if (source.kind !== 'ok' || !entity.trim()) return [];
    const e = entity.trim().toLowerCase();
    return source.ledger.filter((ev) => ev.actor.toLowerCase().includes(e) || ev.object.toLowerCase().includes(e) || ev.institution.toLowerCase().includes(e));
  }, [source, entity]);

  const verify = async (): Promise<void> => {
    setVerifying(true);
    try {
      const res = await verifyAuditChain();
      setVerification(res);
      onNotify(res.chain_verified ? `Chain verified: ${res.events_checked} events, head ${res.head_hash?.slice(0, 16)}…` : `CHAIN BROKEN at seq ${res.broken_at_seq}`, !res.chain_verified);
    } catch (e) {
      onNotify(e instanceof Error ? e.message : 'verify endpoint unreachable', true);
    } finally {
      setVerifying(false);
    }
  };

  const buildExport = (): void => {
    if (source.kind !== 'ok') return;
    const scopedEvents = tab === 'entity' && entity.trim() ? entityEvents : searchResults;
    const scope: { type: string; value: string } =
      tab === 'entity' && entity.trim()
        ? { type: 'entity', value: entity.trim() }
        : tab === 'timeline'
          ? { type: 'timeline', value: 'full chain' }
          : { type: 'search', value: query.trim() || 'all events' };
    const payload = {
      view: 'Audit Center',
      export_type: scope,
      generated_at: new Date().toISOString(),
      chain_verified: source.chainVerified,
      total_events: source.total,
      events: scopedEvents.map((e) => ({
        seq: e.seq,
        timestamp_utc: new Date(e.timestamp_ms).toISOString(),
        actor: e.actor,
        effective_role: e.effective_role,
        institution: e.institution,
        action: e.action,
        object: e.object,
        before: e.before,
        after: e.after,
        correlation_id: e.correlation_id,
        result: e.result,
        reason: e.reason,
        evidence_hash: e.evidence_hash,
        prev_hash: e.prev_hash,
      })),
      provenance: 'Append-only hash-chained ledger journal (GET /api/v1/admin/audit-events). Controlled export — this action is itself audited.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-audit-export-${payload.generated_at.replace(/[-:T]/g, '').slice(0, 14)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'EXPORT_EVIDENCE',
      object: `Audit Center export (${scope.type}: ${scope.value}, ${payload.events.length} events)`,
      environment,
    });
    void appendAuditEvent({
      actor: personaRoleTitle,
      institution: institutionName,
      action: 'AUDIT_EXPORT',
      object: `${payload.events.length} events exported (${scope.type}: ${scope.value})`,
      environment,
    }).catch(() => onNotify('Ledger unavailable — export recorded in-session only', true));
    onNotify(`Audit export built (${payload.events.length} events)`);
  };

  if (source.kind === 'loading') {
    return (
      <div className="fade-in">
        <PageContextStrip
          pageName="Audit Center"
          auditPrefix="CB-AUD"
          personaRoleTitle={personaRoleTitle}
          institutionName={institutionName}
          environment={environment}
          dataStatus="loading"
          pendingApprovals={pendingApprovals}
          onNavigateApprovals={() => onNavigate('governance')}
          onNotify={onNotify}
        />
        <div className="card" style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>Loading audit chain…</div>
      </div>
    );
  }

  if (source.kind === 'error') {
    return (
      <div className="fade-in">
        <PageContextStrip
          pageName="Audit Center"
          auditPrefix="CB-AUD"
          personaRoleTitle={personaRoleTitle}
          institutionName={institutionName}
          environment={environment}
          dataStatus="unavailable"
          pendingApprovals={pendingApprovals}
          onNavigateApprovals={() => onNavigate('governance')}
          onNotify={onNotify}
        />
        <div className="card" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.4)' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#FCA5A5', marginBottom: '6px' }}>Audit endpoint unreachable</div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{source.message} — the ledger audit chain is the only source for this view; no fabricated events are shown.</div>
          <button onClick={() => void load()} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px', marginTop: '12px' }}>Retry</button>
        </div>
      </div>
    );
  }

  // Computed before the JSX: inside the evidence tab block TS has narrowed
  // `tab` to 'evidence', making entity/timeline comparisons a type error.
  const scopeLabel = tab === 'entity' && entity.trim()
    ? `Entity: ${entity.trim()} (${entityEvents.length} events)`
    : tab === 'timeline'
      ? 'Full chain timeline'
      : `Search: ${query.trim() || 'all events'} (${searchResults.length} events)`;

  const tabButton = (id: Tab, label: string): React.ReactNode => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer',
        backgroundColor: tab === id ? '#2d0f16' : 'transparent',
        border: `1px solid ${tab === id ? 'rgba(239,68,68,0.45)' : 'var(--border-subtle)'}`,
        color: tab === id ? 'var(--red-primary)' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Audit Center"
        auditPrefix="CB-AUD"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Investigation read-only · chain verification · controlled export builder"
        dataStatus="available"
        dataFetchedAt={fetchedAt}
        pendingApprovals={pendingApprovals}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      {/* Chain status header */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', border: `1px solid ${source.chainVerified ? 'rgba(43,166,64,0.4)' : 'rgba(239,68,68,0.45)'}` }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: source.chainVerified ? '#2BA640' : '#EF4444' }}>
            {source.chainVerified ? '✓ Ledger audit chain verified' : '⚠ Chain verification failed'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
            {source.total} hash-chained events · append-only · every export re-attested. In-memory journal (Phase 5 persistence).
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => void verify()} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }} disabled={verifying}>
            {verifying ? 'Verifying…' : 'Verify full chain'}
          </button>
          <button onClick={buildExport} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px' }}>
            <FileDown size={11} style={{ verticalAlign: '-2px' }} /> Build export
          </button>
        </div>
      </div>

      {verification && (
        <div className="card" style={{ padding: '14px', marginBottom: '20px', border: `1px solid ${verification.chain_verified ? 'rgba(43,166,64,0.4)' : 'rgba(239,68,68,0.45)'}`, fontSize: '12px' }}>
          <strong>Evidence validation:</strong> chain_verified={String(verification.chain_verified)} · events_checked={verification.events_checked} · broken_at_seq={String(verification.broken_at_seq ?? 'null')} · head_hash={verification.head_hash ? `${verification.head_hash.slice(0, 24)}…` : 'null'}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {tabButton('search', 'Global event search')}
        {tabButton('timeline', 'Timeline view')}
        {tabButton('entity', 'Entity history')}
        {tabButton('evidence', 'Evidence & exports')}
      </div>

      {tab === 'search' && (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-dim)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="input-flat" placeholder="Search actor, action, object, correlation id…" style={{ width: '100%', paddingLeft: '30px' }} />
            </div>
          </div>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Seq</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>UTC</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Actor</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Action</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Object</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((e) => (
                  <tr key={e.seq} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{e.seq}</td>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{fmtTimestamp(e.timestamp_ms)}</td>
                    <td style={{ padding: '7px 8px' }}>{e.actor}</td>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>{e.action}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)', fontSize: '11px' }}>{e.object}</td>
                    <td style={{ padding: '7px 8px', fontWeight: 700, color: e.result === 'Success' ? '#2BA640' : '#EF4444' }}>{e.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {searchResults.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '12px 0', textAlign: 'center' }}>No events match this query.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '14px' }}>
            Full chain timeline (newest first)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...source.ledger].reverse().map((e) => (
              <div key={e.seq} style={{ display: 'flex', gap: '12px', borderLeft: '2px solid rgba(239,68,68,0.35)', paddingLeft: '14px', padding: '6px 0 6px 14px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', minWidth: '150px' }}>{fmtTimestamp(e.timestamp_ms)}</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>{e.action} <span style={{ fontWeight: 500, color: e.result === 'Success' ? '#2BA640' : '#EF4444' }}>· {e.result}</span></div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{e.actor} · {e.object}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'entity' && (
        <div className="card" style={{ padding: '16px' }}>
          <input value={entity} onChange={(e) => setEntity(e.target.value)} className="input-flat" placeholder="Actor, object, or institution to reconstruct…" style={{ width: '100%', marginBottom: '12px' }} />
          {entityEvents.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '12px 0', textAlign: 'center' }}>Enter an actor/object to reconstruct its before/after history from the chain.</div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Seq</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>UTC</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Action</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Before</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>After</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Correlation</th>
                  </tr>
                </thead>
                <tbody>
                  {entityEvents.map((e) => (
                    <tr key={e.seq} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{e.seq}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{fmtTimestamp(e.timestamp_ms)}</td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, fontSize: '11px' }}>{e.action}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-dim)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.before}>{e.before || '—'}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.after}>{e.after || '—'}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{e.correlation_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'evidence' && (
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '10px' }}>
            Evidence & export builder
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.7 }}>
            Exports are <strong>controlled and versioned</strong>: the builder scopes to the current tab (search query, full timeline, or single-entity history), stamps the chain-verification state, and re-attests the export to the ledger chain as an <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>AUDIT_EXPORT</span> event. Legal-hold placement and watermarking are Phase 5 items.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Current scope</div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, marginTop: '2px' }}>{scopeLabel}</div>
            </div>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Chain state</div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, marginTop: '2px', color: source.chainVerified ? '#2BA640' : '#EF4444' }}>{source.chainVerified ? 'Verified' : 'Verification failed'}</div>
            </div>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Session evidence</div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, marginTop: '2px' }}>{getSessionEvents().length} in-session events</div>
            </div>
          </div>
          <button onClick={buildExport} className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px', marginTop: '14px' }}>
            <FileDown size={11} style={{ verticalAlign: '-2px' }} /> Build scoped export
          </button>
        </div>
      )}
    </div>
  );
};
