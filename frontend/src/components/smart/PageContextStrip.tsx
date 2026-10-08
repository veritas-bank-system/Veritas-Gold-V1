import React, { useMemo } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { getSessionEvents, recordSessionEvent, currentSessionId } from '../../services/sessionAudit';

/**
 * Common Page Contract strip — rendered above the main content of every menu
 * page built to docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. Shows the operating
 * context, data freshness, page-relevant approvals, and provides a real
 * Export Evidence action over the in-session audit record. Nothing here is
 * fabricated: segments without a live source are labelled as not connected.
 */

export type PageDataStatus = 'loading' | 'available' | 'stale' | 'unavailable' | 'no-source';

interface PageContextStripProps {
  pageName: string;
  auditPrefix: string;
  personaRoleTitle?: string | null;
  institutionName?: string | null;
  environment?: string | null;
  permissionScope?: string | null;
  dataStatus?: PageDataStatus;
  dataFetchedAt?: number | null;
  pendingApprovals?: number;
  activeIncidents?: string[];
  onNavigateApprovals?: () => void;
  onNotify?: (msg: string, isError?: boolean) => void;
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour12: false });
}

const STATUS_LABEL: Record<PageDataStatus, { text: string; color: string }> = {
  loading: { text: 'LOADING…', color: '#F5C842' },
  available: { text: 'LIVE DATA', color: '#2BA640' },
  stale: { text: 'STALE — REFRESH ADVISED', color: '#F5C842' },
  unavailable: { text: 'SOURCE UNREACHABLE', color: '#EF4444' },
  'no-source': { text: 'NO SOURCE CONNECTED', color: '#8B8B95' },
};

const StripSegment: React.FC<{ label: string; children: React.ReactNode; mono?: boolean }> = ({ label, children, mono }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
    <span style={{ fontSize: '9px', letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: mono ? 'var(--font-mono)' : undefined }}>
      {children}
    </span>
  </div>
);

export const PageContextStrip: React.FC<PageContextStripProps> = ({
  pageName,
  auditPrefix,
  personaRoleTitle,
  institutionName,
  environment,
  permissionScope,
  dataStatus = 'no-source',
  dataFetchedAt = null,
  pendingApprovals = 0,
  activeIncidents,
  onNavigateApprovals,
  onNotify,
}) => {
  const sessionId = useMemo(() => currentSessionId(), []);
  const auditRef = `${auditPrefix}-${sessionId.replace('sess-', '').toUpperCase()}`;
  const status = STATUS_LABEL[dataStatus];

  const handleExportEvidence = (): void => {
    const payload = {
      contract: 'Veritas Gold Common Page Contract',
      page: pageName,
      audit_reference: auditRef,
      exported_at: Date.now(),
      context: {
        persona: personaRoleTitle ?? null,
        institution: institutionName ?? null,
        environment: environment ?? null,
        permission_scope: permissionScope ?? null,
        data_status: dataStatus,
        data_fetched_at: dataFetchedAt,
        pending_approvals: pendingApprovals,
        active_incidents: activeIncidents ?? [],
      },
      session_audit_events: getSessionEvents(),
      provenance: 'Client-side in-session evidence only — server audit trail is a Phase 3 backlog item.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veritas-evidence-${auditPrefix}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordSessionEvent({
      actor: personaRoleTitle ?? 'unknown',
      effectiveRole: personaRoleTitle ?? 'unknown',
      institution: institutionName ?? 'unknown',
      action: 'EXPORT_EVIDENCE',
      object: `${pageName} context + session audit (${payload.session_audit_events.length} events)`,
      environment: environment ?? 'unknown',
    });
    onNotify?.(`Evidence pack exported for ${pageName}`);
  };

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        flexWrap: 'wrap',
        padding: '10px 14px',
        backgroundColor: 'var(--bg-app)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        marginBottom: '18px',
      }}
    >
      <StripSegment label="Page">
        <ShieldCheck size={11} color="var(--red-primary)" style={{ verticalAlign: '-1px', marginRight: '4px' }} />
        {pageName}
      </StripSegment>
      <StripSegment label="Institution">{institutionName ?? '—'}</StripSegment>
      <StripSegment label="Persona">{personaRoleTitle ?? '—'}</StripSegment>
      <StripSegment label="Environment">{environment ?? '—'}</StripSegment>
      <StripSegment label="Ledger" mono>LOCAL SANDBOX</StripSegment>
      <StripSegment label="Permission scope">{permissionScope ?? '—'}</StripSegment>
      <StripSegment label="Data">
        <span style={{ color: status.color }}>{status.text}</span>
        {dataFetchedAt ? <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}> · {fmtTime(dataFetchedAt)}</span> : null}
      </StripSegment>
      <StripSegment label="Pending approvals">
        {pendingApprovals > 0 ? (
          <button
            onClick={() => onNavigateApprovals?.()}
            style={{ background: 'none', border: 'none', color: '#F5C842', fontWeight: 800, cursor: 'pointer', fontSize: '11.5px', padding: 0, fontFamily: 'inherit' }}
          >
            {pendingApprovals} pending →
          </button>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>0</span>
        )}
      </StripSegment>
      <StripSegment label="Active incidents">
        {activeIncidents && activeIncidents.length > 0 ? (
          <span style={{ color: '#EF4444' }}>{activeIncidents.length} open</span>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>none</span>
        )}
      </StripSegment>
      <StripSegment label="Audit ref" mono>{auditRef}</StripSegment>
      <button
        onClick={handleExportEvidence}
        className="btn-secondary"
        style={{ marginLeft: 'auto', fontSize: '11px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        title="Exports this page's context plus the in-session audit record (client-side evidence only)"
      >
        <Download size={12} /> Export Evidence
      </button>
    </div>
  );
};
